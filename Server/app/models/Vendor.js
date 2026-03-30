import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
    maxlength: [200, 'Vendor name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    url: String,
    publicId: String
  },
  banner: {
    url: String,
    publicId: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    },
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  businessInfo: {
    businessName: String,
    businessType: {
      type: String,
      enum: ['individual', 'partnership', 'company', 'llp', 'other']
    },
    gstNumber: String,
    panNumber: String,
    registrationNumber: String,
    establishedYear: Number
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    branchName: String,
    upiId: String
  },
  commission: {
    type: Number,
    default: 10,
    min: [0, 'Commission cannot be negative'],
    max: [100, 'Commission cannot exceed 100%']
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  socialMedia: {
    website: String,
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String
  },
  shipping: {
    freeShippingThreshold: Number,
    defaultShippingCost: Number,
    processingTime: {
      type: String,
      default: '1-3 business days'
    },
    returnPolicy: String
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended', 'inactive'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['id_proof', 'address_proof', 'business_license', 'gst_certificate', 'other']
    },
    documentUrl: String,
    documentId: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  payoutSettings: {
    payoutSchedule: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'monthly'
    },
    minimumPayout: {
      type: Number,
      default: 1000
    },
    autoPayout: {
      type: Boolean,
      default: false
    }
  },
  statistics: {
    totalSales: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  },
  permissions: {
    canAddProducts: {
      type: Boolean,
      default: true
    },
    canEditProducts: {
      type: Boolean,
      default: true
    },
    canDeleteProducts: {
      type: Boolean,
      default: false
    },
    canViewOrders: {
      type: Boolean,
      default: true
    },
    canManageInventory: {
      type: Boolean,
      default: true
    }
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Generate slug before saving
vendorSchema.pre('save', async function() {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
});

// Indexes for efficient queries
vendorSchema.index({ status: 1 });
vendorSchema.index({ isVerified: 1 });
vendorSchema.index({ 'ratings.average': -1 });

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;