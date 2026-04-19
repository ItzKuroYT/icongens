const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const MEM_TICKETS = [];

function getCandidatePaths() {
  const custom = (process.env.TICKETS_DB_PATH || "").trim();
  const candidates = [
    custom,
    path.join(process.cwd(), "data", "tickets-db.json"),
    path.join(os.tmpdir(), "icongens-tickets.json")
  ].filter(Boolean);

  return Array.from(new Set(candidates));
}

async function readTicketsFromFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function ensureFile(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(filePath);
  } catch (error) {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function getWritablePath() {
  const candidates = getCandidatePaths();

  for (const filePath of candidates) {
    try {
      await ensureFile(filePath);
      await fs.appendFile(filePath, "");
      return filePath;
    } catch (error) {
      // Try next candidate.
    }
  }

  return null;
}

async function getTickets() {
  const candidates = getCandidatePaths();

  for (const filePath of candidates) {
    try {
      await ensureFile(filePath);
      return await readTicketsFromFile(filePath);
    } catch (error) {
      // Try next candidate.
    }
  }

  return MEM_TICKETS;
}

async function saveTickets(tickets) {
  const nextTickets = Array.isArray(tickets) ? tickets : [];
  const writablePath = await getWritablePath();

  if (!writablePath) {
    throw new Error("No writable ticket database path available.");
  }

  await fs.writeFile(writablePath, JSON.stringify(nextTickets, null, 2), "utf8");
  return true;
}

module.exports = {
  getTickets,
  saveTickets
};