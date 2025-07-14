import mongoose from "mongoose";

export interface ISEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
}

export interface IContent extends mongoose.Document {
  page: "home" | "about" | "contact" | "services";
  data: any;
  seo: ISEOData;
  isPublished: boolean;
  lastEditedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SEOSchema = new mongoose.Schema({
  title: { type: String, maxlength: 60 },
  description: { type: String, maxlength: 160 },
  keywords: [{ type: String, trim: true }],
  ogImage: String,
  ogTitle: { type: String, maxlength: 60 },
  ogDescription: { type: String, maxlength: 160 },
  canonicalUrl: String,
});

const ContentSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      enum: ["home", "about", "contact", "services"],
      unique: true,
    },
    data: mongoose.Schema.Types.Mixed,
    seo: SEOSchema,
    isPublished: { type: Boolean, default: false },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IContent>("Content", ContentSchema);
