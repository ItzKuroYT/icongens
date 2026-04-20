import { connectDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { announcementSchema, validate } from "@/lib/validators";
import { Announcement } from "@/lib/models/Announcement";
import { User } from "@/lib/models/User";
import { fail, ok } from "@/lib/http";
import { sendEmail } from "@/lib/email";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  await connectDb();
  const announcements = await Announcement.find({}).sort({ createdAt: -1 }).lean();

  return ok({
    announcements: announcements.map((item) => ({
      id: String(item._id),
      title: item.title,
      body: item.body,
      createdById: item.createdById,
      createdByUsername: item.createdByUsername,
      createdAt: item.createdAt
    }))
  });
}

export async function POST(request) {
  const auth = await requireAuth({ roles: ["ADMIN", "OWNER"] });
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  const payload = await request.json().catch(() => null);
  const parsed = validate(announcementSchema, payload || {});
  if (!parsed.ok) {
    return fail("Invalid announcement payload", 400, parsed.errors);
  }

  await connectDb();

  const announcement = await Announcement.create({
    title: parsed.data.title,
    body: parsed.data.body,
    createdById: String(auth.user._id),
    createdByUsername: auth.user.username
  });

  let emailBroadcastStatus = "skipped";

  if (parsed.data.emailBroadcast) {
    const users = await User.find({ emailVerifiedAt: { $ne: null } }).lean();
    let failed = 0;

    for (const user of users) {
      try {
        await sendEmail({
          to: user.email,
          subject: `[Announcement] ${announcement.title}`,
          html: `<p>${announcement.body.replace(/\n/g, "<br/>")}</p>`,
          text: announcement.body
        });
      } catch (error) {
        failed += 1;
      }
    }

    emailBroadcastStatus = failed > 0 ? `partial-failure (${failed})` : "sent";
  }

  return ok(
    {
      announcement: {
        id: String(announcement._id),
        title: announcement.title,
        body: announcement.body,
        createdByUsername: announcement.createdByUsername,
        createdAt: announcement.createdAt
      },
      emailBroadcastStatus
    },
    201
  );
}
