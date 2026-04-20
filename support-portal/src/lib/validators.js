import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const signupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric/underscore"),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(passwordRegex, "Password must include upper/lowercase and a number")
});

export const loginSchema = z.object({
  identifier: z.string().min(3).max(120),
  password: z.string().min(1)
});

export const ticketCreateSchema = z.object({
  category: z.enum(["GENERAL_SUPPORT", "BUG_REPORT", "APPEAL", "PLAYER_REPORT"]),
  subject: z.string().min(4).max(120),
  message: z.string().min(8).max(4000)
});

export const ticketReplySchema = z.object({
  message: z.string().min(2).max(4000),
  status: z.enum(["OPEN", "CLOSED", "PENDING"]).optional()
});

export const roleSchema = z.object({
  role: z.enum(["USER", "ADMIN", "OWNER"])
});

export const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(2).max(200),
  content: z.string().min(2).max(10000)
});

export const announcementSchema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(5000),
  emailBroadcast: z.boolean().optional().default(false)
});

export function validate(schema, payload) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  return {
    ok: true,
    data: parsed.data
  };
}
