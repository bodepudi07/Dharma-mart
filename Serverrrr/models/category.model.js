// /models/category.model.js

import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },

  type: {
    type: String,
    enum: ["string", "number", "boolean", "select"],
    required: true
  },

  required: {
    type: Boolean,
    default: false
  },

  options: {
    type: [String],
    default: [],
    validate: {
      validator: function (value) {
        if (this.type === "select") {
          return value.length > 0;
        }
        return true;
      },
      message: "Options are required when type is select"
    }
  },

  defaultValue: mongoose.Schema.Types.Mixed

}, { _id: false });

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },

  fields: {
    type: [fieldSchema],
    default: []
  }

}, {
  timestamps: true
});


// Generate slug from name
categorySchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});


// Prevent duplicate field names (case-insensitive)
categorySchema.path("fields").validate(function (fields) {
  const names = fields.map(f => f.name.trim().toLowerCase());
  return names.length === new Set(names).size;
}, "Field names must be unique within a category");


export default mongoose.model("Category", categorySchema);