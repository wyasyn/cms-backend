import mongoose from "mongoose";
import slugify from "slugify";

export interface ISkill extends mongoose.Document {
  name: string;
  slug: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  category?: string;
  description?: string;
  image?: string;
  icon?: string;
  yearsOfExperience?: number;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: Date;
    url?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
  proficiencyPercentage?: number;
  status: "active" | "inactive";
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required"],
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
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner",
      index: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
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
    icon: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      min: [0, "Years of experience cannot be negative"],
      max: [50, "Years of experience seems too high"],
    },
    certifications: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        issuer: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          required: true,
        },
        url: {
          type: String,
          validate: {
            validator: function (v: string) {
              return !v || /^https?:\/\/.+/.test(v);
            },
            message: "Please provide a valid URL for certification",
          },
        },
      },
    ],
    projects: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          validate: {
            validator: function (v: string) {
              return !v || /^https?:\/\/.+/.test(v);
            },
            message: "Please provide a valid URL for project",
          },
        },
      },
    ],
    proficiencyPercentage: {
      type: Number,
      min: [0, "Proficiency cannot be less than 0%"],
      max: [100, "Proficiency cannot be more than 100%"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
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

// Auto-generate slug from name
SkillSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  next();
});

// Indexes for better performance
SkillSchema.index({ status: 1, featured: -1, sortOrder: 1 });
SkillSchema.index({ category: 1, status: 1 });
SkillSchema.index({ level: 1, status: 1 });
SkillSchema.index({ createdAt: -1 });

export default mongoose.model<ISkill>("Skill", SkillSchema);
