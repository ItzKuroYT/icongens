const DEFAULT_BRANCH = "main";
const DEFAULT_PATH = "data/tickets-db.json";
const DEFAULT_API_BASE = "https://api.github.com";

function getGitHubConfig() {
  return {
    token: String(
      process.env.GITHUB_TICKETS_TOKEN || process.env.GITHUB_USERS_TOKEN || ""
    ).trim(),
    owner: String(
      process.env.GITHUB_TICKETS_OWNER || process.env.GITHUB_USERS_OWNER || ""
    ).trim(),
    repo: String(
      process.env.GITHUB_TICKETS_REPO || process.env.GITHUB_USERS_REPO || ""
    ).trim(),
    branch: String(
      process.env.GITHUB_TICKETS_BRANCH ||
        process.env.GITHUB_USERS_BRANCH ||
        DEFAULT_BRANCH
    ).trim() || DEFAULT_BRANCH,
    path: String(process.env.GITHUB_TICKETS_PATH || DEFAULT_PATH).trim() || DEFAULT_PATH,
    apiBase: String(process.env.GITHUB_API_BASE || DEFAULT_API_BASE).trim() || DEFAULT_API_BASE
  };
}

function isGitHubTicketStoreEnabled() {
  const config = getGitHubConfig();
  return Boolean(config.token && config.owner && config.repo);
}

function encodeContentPath(contentPath) {
  return String(contentPath || "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function buildReadUrl(config) {
  const owner = encodeURIComponent(config.owner);
  const repo = encodeURIComponent(config.repo);
  const contentPath = encodeContentPath(config.path);
  const branch = encodeURIComponent(config.branch);
  return `${config.apiBase}/repos/${owner}/${repo}/contents/${contentPath}?ref=${branch}`;
}

function buildWriteUrl(config) {
  const owner = encodeURIComponent(config.owner);
  const repo = encodeURIComponent(config.repo);
  const contentPath = encodeContentPath(config.path);
  return `${config.apiBase}/repos/${owner}/${repo}/contents/${contentPath}`;
}

function createError(message, code, status, details) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

function buildHeaders(config) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${config.token}`,
    "User-Agent": "icongens-ticket-store"
  };
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function readGitHubTickets() {
  const config = getGitHubConfig();
  if (!isGitHubTicketStoreEnabled()) {
    throw createError(
      "GitHub ticket store is not configured",
      "GITHUB_CONFIG",
      500,
      "Set GITHUB_TICKETS_TOKEN/OWNER/REPO or reuse GITHUB_USERS_*"
    );
  }

  const response = await fetch(buildReadUrl(config), {
    method: "GET",
    headers: buildHeaders(config)
  });

  if (response.status === 404) {
    return {
      tickets: [],
      sha: null
    };
  }

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw createError(
      "Unable to read tickets database from GitHub",
      "GITHUB_READ",
      response.status,
      data
    );
  }

  const base64Content = data && typeof data.content === "string" ? data.content : "";
  const raw = Buffer.from(base64Content.replace(/\n/g, ""), "base64").toString("utf8");
  const parsed = raw.trim() ? JSON.parse(raw) : [];

  if (!Array.isArray(parsed)) {
    throw createError("GitHub tickets file is not an array", "GITHUB_FORMAT", 500, null);
  }

  return {
    tickets: parsed,
    sha: data && data.sha ? data.sha : null
  };
}

async function writeGitHubTickets(tickets, sha, commitMessage) {
  const config = getGitHubConfig();
  if (!isGitHubTicketStoreEnabled()) {
    throw createError(
      "GitHub ticket store is not configured",
      "GITHUB_CONFIG",
      500,
      "Set GITHUB_TICKETS_TOKEN/OWNER/REPO or reuse GITHUB_USERS_*"
    );
  }

  if (!Array.isArray(tickets)) {
    throw createError("Tickets payload must be an array", "GITHUB_FORMAT", 500, null);
  }

  const payload = {
    message: commitMessage || "chore(tickets): update tickets database",
    content: Buffer.from(`${JSON.stringify(tickets, null, 2)}\n`, "utf8").toString("base64"),
    branch: config.branch
  };

  if (sha) {
    payload.sha = sha;
  }

  const response = await fetch(buildWriteUrl(config), {
    method: "PUT",
    headers: {
      ...buildHeaders(config),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) {
      throw createError("GitHub tickets database update conflict", "GITHUB_CONFLICT", response.status, data);
    }

    throw createError("Unable to write tickets database to GitHub", "GITHUB_WRITE", response.status, data);
  }

  return {
    sha: data && data.content && data.content.sha ? data.content.sha : null
  };
}

module.exports = {
  isGitHubTicketStoreEnabled,
  readGitHubTickets,
  writeGitHubTickets
};