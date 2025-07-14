import mongoose from "mongoose";
import slugify from "slugify";

export interface IPricing extends mongoose.Document {
  name: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: {
    amount: number;
    currency: string;
    period: "one-time" | "monthly" | "yearly" | "weekly" | "hourly";
    originalAmount?: number; // For showing discounts
  };
  features: Array<{
    name: string;
    description?: string;
    included: boolean;
    icon?: string;
  }>;
  limitations?: Array<{
    name: string;
    value: string | number;
    description?: string;
  }>;
  category?: string;
  type: "basic" | "standard" | "premium" | "enterprise" | "custom";
  isPopular: boolean;
  isFeatured: boolean;
  buttonText?: string;
  buttonLink?: string;
  ribbonText?: string;
  color?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  services?: mongoose.Types.ObjectId[]; // Reference to services included
  benefits?: string[];
  deliverables?: string[];
  timeline?: string;
  revisions?: number;
  support?: {
    type: "email" | "phone" | "chat" | "priority";
    responseTime?: string;
    availability?: string;
  };
  addOns?: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  requirements?: string[];
  guarantees?: string[];
  status: "active" | "inactive" | "draft" | "archived";
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  analytics?: {
    views: number;
    clicks: number;
    conversions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PricingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pricing plan name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      minlength: [2, "Name must be at least 2 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Pricing plan title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Pricing plan description is required"],
      minlength: [10, "Description must be at least 10 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    price: {
      amount: {
        type: Number,
        required: [true, "Price amount is required"],
        min: [0, "Price cannot be negative"],
      },
      currency: {
        type: String,
        required: true,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "UGX"],
      },
      period: {
        type: String,
        required: true,
        enum: ["one-time", "monthly", "yearly", "weekly", "hourly"],
        default: "one-time",
      },
      originalAmount: {
        type: Number,
        min: [0, "Original price cannot be negative"],
      },
    },
    features: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        included: {
          type: Boolean,
          required: true,
          default: true,
        },
        icon: {
          type: String,
          trim: true,
        },
      },
    ],
    limitations: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    category: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["basic", "standard", "premium", "enterprise", "custom"],
      default: "basic",
      index: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    buttonText: {
      type: String,
      default: "Get Started",
      trim: true,
    },
    buttonLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^(https?:\/\/|\/|mailto:|tel:)/.test(v);
        },
        message: "Please provide a valid URL or path",
      },
    },
    ribbonText: {
      type: String,
      trim: true,
      maxlength: [20, "Ribbon text cannot exceed 20 characters"],
    },
    color: {
      primary: {
        type: String,
        default: "#3B82F6",
        validate: {
          validator: function (v: string) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
          },
          message: "Please provide a valid hex color",
        },
      },
      secondary: {
        type: String,
        default: "#1E40AF",
        validate: {
          validator: function (v: string) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
          },
          message: "Please provide a valid hex color",
        },
      },
      accent: {
        type: String,
        validate: {
          validator: function (v: string) {
            return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
          },
          message: "Please provide a valid hex color",
        },
      },
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    deliverables: [
      {
        type: String,
        trim: true,
      },
    ],
    timeline: {
      type: String,
      trim: true,
    },
    revisions: {
      type: Number,
      min: [0, "Revisions cannot be negative"],
      default: 0,
    },
    support: {
      type: {
        type: String,
        enum: ["email", "phone", "chat", "priority"],
        default: "email",
      },
      responseTime: {
        type: String,
        trim: true,
      },
      availability: {
        type: String,
        trim: true,
      },
    },
    addOns: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, "Add-on price cannot be negative"],
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    guarantees: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "draft",
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    seoTitle: {
      type: String,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seoDescription: {
      type: String,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
    seoKeywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    analytics: {
      views: {
        type: Number,
        default: 0,
        min: 0,
      },
      clicks: {
        type: Number,
        default: 0,
        min: 0,
      },
      conversions: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for discount percentage
PricingSchema.virtual("discountPercentage").get(function () {
  if (
    this.price &&
    this.price.originalAmount &&
    this.price.originalAmount > this.price.amount
  ) {
    return Math.round(
      ((this.price.originalAmount - this.price.amount) /
        this.price.originalAmount) *
        100
    );
  }
  return 0;
});

// Virtual for formatted price
PricingSchema.virtual("formattedPrice").get(function () {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    UGX: "UGX ",
  };

  const currency = this.price && this.price.currency ? this.price.currency : "";
  const symbol = symbols[currency] || currency;
  const amount =
    this.price && typeof this.price.amount === "number"
      ? this.price.amount.toLocaleString()
      : "0";

  return `${symbol}${amount}`;
});

// Virtual for conversion rate (CTR)
PricingSchema.virtual("conversionRate").get(function () {
  if (this.analytics && this.analytics.clicks > 0) {
    return ((this.analytics.conversions / this.analytics.clicks) * 100).toFixed(
      2
    );
  }
  return "0.00";
});

// Auto-generate slug from name
PricingSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  // Auto-generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = `${this.title} - ${this.name}`;
  }
  if (!this.seoDescription && this.shortDescription) {
    this.seoDescription = this.shortDescription;
  }

  next();
});

// Indexes for better performance
PricingSchema.index({ status: 1, isFeatured: -1, isPopular: -1, sortOrder: 1 });
PricingSchema.index({ category: 1, status: 1 });
PricingSchema.index({ type: 1, status: 1 });
PricingSchema.index({ "price.amount": 1, status: 1 });
PricingSchema.index({ createdAt: -1 });

export default mongoose.model<IPricing>("Pricing", PricingSchema);
