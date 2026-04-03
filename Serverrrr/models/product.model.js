// models/product.model.js

import mongoose from "mongoose";
import Category from "./category.model.js";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },

    description: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },

    dynamicFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },

    images: {
      type: [
        {
          url: String,
          public_id: String
        }
      ],
      validate: {
        validator: function (images) {
          if (!Array.isArray(images)) return false;
          return images.every(img => img.url && img.public_id);
        },
        message: "Invalid image format"
      },
      default: []
    },

    vendor: {
      name: {
        type: String,
        trim: true,
        default: ""
      },
      contact: {
        type: String,
        default: ""
      }
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ title: "text", description: "text" });
productSchema.index({ price: 1 });

/**
 * Validate dynamic fields against category config
 */
async function validateDynamicFields(category, data) {
  const errors = [];
  const fields = category.fields || [];

  // ✅ ensure Map
  const mapData =
    data instanceof Map
      ? data
      : new Map(Object.entries(data?.toObject?.() || data || {}));  const allowedFieldNames = fields.map(f => f.name);

  // ❗ unknown fields
  for (const key of mapData.keys()) {
    if (!allowedFieldNames.includes(key)) {
      errors.push(`Unknown field: ${key}`);
    }
  }

  for (const field of fields) {
    const key = field.name;
    let value = mapData.get(key);

    // default value
    if (
      (value === undefined || value === null) &&
      field.defaultValue !== undefined
    ) {
      value = field.defaultValue;
      mapData.set(key, value);
    }

    // required
    if (
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${key} is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    // type validation
    switch (field.type) {
      case "number":
        if (typeof value !== "number") {
          errors.push(`${key} must be a number`);
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          errors.push(`${key} must be a boolean`);
        }
        break;

      case "string":
        if (typeof value !== "string") {
          errors.push(`${key} must be a string`);
        }
        break;

      case "select":
        if (
          !Array.isArray(field.options) ||
          !field.options.includes(value)
        ) {
          errors.push(
            `${key} must be one of: ${
              field.options?.join(", ") || "[]"
            }`
          );
        }
        break;

      default:
        break;
    }
  }

  return { errors, mapData };
}

productSchema.pre("save", async function (next) {
  try {
    const category = await Category.findById(this.categoryId);

    if (!category) {
      return next(new Error("Invalid category"));
    }

    const { errors, mapData } = await validateDynamicFields(
      category,
      this.dynamicFields
    );

    if (errors.length > 0) {
      return next(new Error(errors.join(" | ")));
    }

    // ✅ ensure stored as Map
    this.dynamicFields = mapData;

    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Product", productSchema);