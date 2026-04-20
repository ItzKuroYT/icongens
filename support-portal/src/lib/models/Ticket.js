import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    authorId: { type: String, required: true },
    authorRole: { type: String, enum: ["USER", "ADMIN", "OWNER"], required: true },
    authorLabel: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const TicketSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    ownerUsername: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    category: {
      type: String,
      enum: ["GENERAL_SUPPORT", "BUG_REPORT", "APPEAL", "PLAYER_REPORT"],
      required: true,
      index: true
    },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "PENDING"],
      default: "OPEN",
      index: true
    },
    messages: {
      type: [MessageSchema],
      default: []
    },
    closedAt: { type: Date, default: null },
    reopenedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

export const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
