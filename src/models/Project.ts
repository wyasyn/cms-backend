import mongoose from "mongoose";

export interface IProject extends mongoose.Document {
  title: string;
  description: string;
  content?: string;
  techStack: string[];
  images: string[];
  github?: string;
  liveDemo?: string;
  category?: string;
  featured: boolean;
  status: "draft" | "published" | "archived";
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    content: String,
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [String],
    github: String,
    liveDemo: String,
    category: {
      type: String,
      enum: ["web", "mobile", "desktop", "ai", "other"],
      default: "web",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    seo: {
      title: { type: String, maxlength: 60 },
      description: { type: String, maxlength: 160 },
      keywords: [String],
      ogImage: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>("Project", ProjectSchema);
