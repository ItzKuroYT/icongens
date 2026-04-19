const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const MEM_USERS = [];

function getCandidatePaths() {
  const custom = (process.env.USERS_DB_PATH || "").trim();
  const candidates = [
    custom,
    path.join(process.cwd(), "data", "users-db.json"),
    path.join(os.tmpdir(), "icongens-users.json")
  ].filter(Boolean);

  return Array.from(new Set(candidates));
}

async function readUsersFromFile(filePath) {
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

async function getUsers() {
  const candidates = getCandidatePaths();

  for (const filePath of candidates) {
    try {
      await ensureFile(filePath);
      return await readUsersFromFile(filePath);
    } catch (error) {
      // Try next candidate.
    }
  }

  return MEM_USERS;
}

async function saveUsers(users) {
  const nextUsers = Array.isArray(users) ? users : [];
  const writablePath = await getWritablePath();

  if (!writablePath) {
    throw new Error("No writable user database path available.");
  }

  await fs.writeFile(writablePath, JSON.stringify(nextUsers, null, 2), "utf8");
  return true;
}

module.exports = {
  getUsers,
  saveUsers
};