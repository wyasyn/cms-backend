import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  role: "admin" | "editor";
  isActive: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "editor"],
      default: "editor",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profile: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      avatar: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
