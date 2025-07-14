import mongoose from "mongoose";
import slugify from "slugify";

export interface IService extends mongoose.Document {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  image?: string;
  gallery?: string[];
  price?: {
    amount: number;
    currency: string;
    type: "fixed" | "hourly" | "project";
  };
  duration?: string;
  features?: string[];
  tags?: string[];
  category?: string;
  status: "active" | "inactive" | "draft";
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      minlength: [3, "Title must be at least 3 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
      minlength: [10, "Description must be at least 10 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    image: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
        },
        message: "Please provide a valid image URL",
      },
    },
    gallery: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
          },
          message: "Please provide valid image URLs for gallery",
        },
      },
    ],
    price: {
      amount: {
        type: Number,
        min: [0, "Price cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "UGX"],
      },
      type: {
        type: String,
        enum: ["fixed", "hourly", "project"],
        default: "fixed",
      },
    },
    duration: {
      type: String,
      trim: true,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "draft",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
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
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from title
ServiceSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  // Auto-generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = this.title;
  }
  if (!this.seoDescription && this.shortDescription) {
    this.seoDescription = this.shortDescription;
  }

  next();
});

// Indexes for better performance
ServiceSchema.index({ status: 1, featured: -1, sortOrder: 1 });
ServiceSchema.index({ category: 1, status: 1 });
ServiceSchema.index({ tags: 1 });
ServiceSchema.index({ createdAt: -1 });

export default mongoose.model<IService>("Service", ServiceSchema);
