import mongoose, { Schema } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdById: { type: String, required: true },
    createdByUsername: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const Announcement =
  mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
