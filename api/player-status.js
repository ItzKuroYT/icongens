function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNestedValue(source, path) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const keys = path.split(".");
  let current = source;

  for (const key of keys) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return null;
    }
    current = current[key];
  }

  return current;
}

function getFirstValue(source, candidatePaths) {
  for (const path of candidatePaths) {
    const value = getNestedValue(source, path);
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return null;
}

function parseAddress(rawAddress) {
  const input = String(rawAddress || "").trim();
  if (!input) {
    return null;
  }

  const match = input.match(/^([a-zA-Z0-9.-]+)(?::(\d{1,5}))?$/);
  if (!match) {
    return null;
  }

  const host = match[1];
  const port = match[2] ? Number(match[2]) : 25565;

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return {
    host,
    port,
    address: `${host}:${port}`
  };
}

function parsePayload(payload, fallbackVersion) {
  const online =
    payload && typeof payload.online === "boolean" ? payload.online : null;
  if (online === null) {
    throw new Error("Invalid status payload");
  }

  const playersOnline = safeNumber(
    payload && payload.players ? payload.players.online : null
  );
  const playersMax = safeNumber(
    payload && payload.players ? payload.players.max : null
  );

  const versionValue =
    getFirstValue(payload, [
      "version",
      "version.name_clean",
      "version.name_raw",
      "software"
    ]) || fallbackVersion || "Unknown";

  const versionText =
    typeof versionValue === "string"
      ? versionValue
      : typeof versionValue === "object" && versionValue !== null
      ? getFirstValue(versionValue, ["name_clean", "name_raw"]) || "Unknown"
      : String(versionValue);

  const tps = safeNumber(
    getFirstValue(payload, [
      "tps",
      "performance.tps",
      "server.tps",
      "debug.tps",
      "stats.tps",
      "world.tps"
    ])
  );

  const uptimeSeconds = safeNumber(
    getFirstValue(payload, [
      "uptime",
      "uptime_seconds",
      "debug.uptime",
      "server.uptime",
      "stats.uptime"
    ])
  );

  const region = getFirstValue(payload, [
    "region",
    "location.region",
    "location",
    "geo.region",
    "host_location"
  ]);

  return {
    online,
    players: {
      online: online ? playersOnline || 0 : 0,
      max: playersMax || 0
    },
    version: versionText,
    tps: tps !== null && tps > 0 ? Number(tps.toFixed(2)) : null,
    uptime:
      uptimeSeconds !== null
        ? uptimeSeconds > 100000000
          ? Math.round(uptimeSeconds / 1000)
          : Math.round(uptimeSeconds)
        : null,
    region: typeof region === "string" ? region : null
  };
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const parsed = parseAddress(req.query.address);
  if (!parsed) {
    res.status(400).json({
      ok: false,
      message: "Query parameter 'address' is required in host[:port] format"
    });
    return;
  }

  const target = encodeURIComponent(parsed.address);
  const providers = [
    {
      name: "mcstatus",
      url: `https://api.mcstatus.io/v2/status/java/${target}`
    },
    {
      name: "mcsrvstat",
      url: `https://api.mcsrvstat.us/3/${target}`
    }
  ];

  let lastError = "Unable to fetch status";

  for (const provider of providers) {
    try {
      const payload = await fetchJson(provider.url, 12000);
      const parsedStatus = parsePayload(payload, "Unknown");

      res.status(200).json({
        ok: true,
        source: provider.name,
        host: parsed.host,
        port: parsed.port,
        online: parsedStatus.online,
        players: parsedStatus.players,
        version: parsedStatus.version,
        tps: parsedStatus.tps,
        uptime: parsedStatus.uptime,
        region: parsedStatus.region
      });
      return;
    } catch (error) {
      lastError = error && error.message ? error.message : "Unknown error";
    }
  }

  res.status(502).json({
    ok: false,
    message: "All status providers failed",
    details: lastError
  });
};