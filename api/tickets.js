const rateLimitMap = new Map();
const { getTickets, saveTickets } = require("./_ticketStore");
const {
  isGitHubTicketStoreEnabled,
  readGitHubTickets,
  writeGitHubTickets
} = require("./_githubTicketStore");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalize(value) {
  return String(value || "").trim();
}

function getBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.length > 0) {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return null;
    }
  }

  return null;
}

function validateTicket(payload) {
  const username = normalize(payload.username);
  const email = normalize(payload.email);
  const category = normalize(payload.category);
  const subject = normalize(payload.subject);
  const message = normalize(payload.message);
  const website = normalize(payload.website);
  const page = normalize(payload.page);

  if (website) {
    return { ok: false, message: "Spam detected" };
  }

  if (username.length < 3 || username.length > 24) {
    return { ok: false, message: "Username must be between 3 and 24 characters." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { ok: false, message: "Username can only contain letters, numbers, and underscore." };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Email format is invalid." };
  }

  if (category.length < 3 || category.length > 40) {
    return { ok: false, message: "Category is required." };
  }

  if (subject.length < 6 || subject.length > 120) {
    return { ok: false, message: "Subject must be between 6 and 120 characters." };
  }

  if (message.length < 20 || message.length > 2000) {
    return { ok: false, message: "Message must be between 20 and 2000 characters." };
  }

  return {
    ok: true,
    ticket: {
      username,
      email,
      category,
      subject,
      message,
      page
    }
  };
}

function allowByRateLimit(ip) {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip) || [];
  const recent = bucket.filter(function (ts) {
    return now - ts < 60 * 1000;
  });

  if (recent.length >= 5) {
    rateLimitMap.set(ip, recent);
    return false;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

function createTicketId() {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IG-${time}-${rand}`;
}

function getClientIp(req) {
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  return String(raw).split(",")[0].trim() || "unknown";
}

async function saveTicketRecord(ticketRecord) {
  if (isGitHubTicketStoreEnabled()) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const state = await readGitHubTickets();
      const nextTickets = state.tickets.concat(ticketRecord);

      try {
        await writeGitHubTickets(
          nextTickets,
          state.sha,
          `chore(tickets): add ${ticketRecord.id}`
        );
        return "github";
      } catch (error) {
        if (error && error.code === "GITHUB_CONFLICT") {
          continue;
        }
        throw error;
      }
    }

    throw new Error("GitHub tickets database is busy. Please try again.");
  }

  const tickets = await getTickets();
  await saveTickets(tickets.concat(ticketRecord));
  return "file";
}

async function sendToWebhook(ticketId, ticket) {
  const webhook = process.env.TICKETS_WEBHOOK_URL;
  if (!webhook) {
    return false;
  }

  const content = [
    `New IconGens Ticket: ${ticketId}`,
    `Username: ${ticket.username}`,
    `Email: ${ticket.email || "N/A"}`,
    `Category: ${ticket.category}`,
    `Subject: ${ticket.subject}`,
    `Message: ${ticket.message}`,
    `Page: ${ticket.page || "N/A"}`
  ].join("\n");

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    throw new Error("Ticket webhook delivery failed");
  }

  return true;
}

async function sendToResend(ticketId, ticket) {
  const resendKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.TICKETS_NOTIFY_TO;
  const from = process.env.TICKETS_FROM || "IconGens Tickets <tickets@icongens.net>";

  if (!resendKey || !notifyTo) {
    return false;
  }

  const text = [
    `Ticket ID: ${ticketId}`,
    `Username: ${ticket.username}`,
    `Email: ${ticket.email || "N/A"}`,
    `Category: ${ticket.category}`,
    `Subject: ${ticket.subject}`,
    "",
    ticket.message,
    "",
    `Page: ${ticket.page || "N/A"}`
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [notifyTo],
      subject: `[IconGens Ticket] ${ticket.subject}`,
      text
    })
  });

  if (!response.ok) {
    throw new Error("Ticket email delivery failed");
  }

  return true;
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const clientIp = getClientIp(req);
  if (!allowByRateLimit(clientIp)) {
    res.status(429).json({ ok: false, message: "Too many submissions. Please wait and try again." });
    return;
  }

  const payload = getBody(req);
  if (!payload) {
    res.status(400).json({ ok: false, message: "Invalid request body" });
    return;
  }

  const validated = validateTicket(payload);
  if (!validated.ok) {
    res.status(400).json({ ok: false, message: validated.message });
    return;
  }

  const ticketId = createTicketId();
  const ticketRecord = {
    id: ticketId,
    username: validated.ticket.username,
    email: validated.ticket.email || "",
    category: validated.ticket.category,
    subject: validated.ticket.subject,
    message: validated.ticket.message,
    page: validated.ticket.page || "",
    status: "OPEN",
    sourceIp: clientIp,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const storedIn = await saveTicketRecord(ticketRecord);
    const webhookConfigured = !!String(process.env.TICKETS_WEBHOOK_URL || "").trim();
    const emailConfigured =
      !!String(process.env.RESEND_API_KEY || "").trim() &&
      !!String(process.env.TICKETS_NOTIFY_TO || "").trim();

    let webhookSent = false;
    let emailSent = false;

    if (webhookConfigured) {
      try {
        webhookSent = await sendToWebhook(ticketId, validated.ticket);
      } catch (error) {
        webhookSent = false;
      }
    }

    if (emailConfigured) {
      try {
        emailSent = await sendToResend(ticketId, validated.ticket);
      } catch (error) {
        emailSent = false;
      }
    }

    const hasDeliveryConfig = webhookConfigured || emailConfigured;
    const hasDeliverySuccess = webhookSent || emailSent;
    const responseMessage = !hasDeliveryConfig
      ? "Ticket saved successfully. Notifications are not configured."
      : hasDeliverySuccess
      ? "Ticket submitted successfully"
      : "Ticket saved, but notification delivery failed.";

    res.status(201).json({
      ok: true,
      ticketId,
      message: responseMessage,
      storedIn,
      notifications: {
        webhookConfigured,
        emailConfigured,
        webhookSent,
        emailSent
      }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ticket could not be saved. Check ticket storage configuration."
    });
  }
};