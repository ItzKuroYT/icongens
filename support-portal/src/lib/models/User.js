import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN", "OWNER"],
      default: "USER",
      index: true
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    verificationTokenHash: {
      type: String,
      default: null
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
