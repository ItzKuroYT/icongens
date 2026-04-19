(function () {
  const config = window.SITE_CONFIG || {};
  const regionLookupCache = new Map();

  function getByName(name) {
    return document.querySelector(`meta[name="${name}"]`);
  }

  function getByProperty(property) {
    return document.querySelector(`meta[property="${property}"]`);
  }

  function setMeta(name, content) {
    if (!content) {
      return;
    }
    const el = getByName(name);
    if (el) {
      el.setAttribute("content", content);
    }
  }

  function setOg(property, content) {
    if (!content) {
      return;
    }
    const el = getByProperty(property);
    if (el) {
      el.setAttribute("content", content);
    }
  }

  function formatNumber(value) {
    const asNumber = Number(value);
    if (Number.isNaN(asNumber)) {
      return "0";
    }
    return asNumber.toLocaleString();
  }

  function fillServerName() {
    const serverName = config.serverName || "Minecraft Server";
    document.querySelectorAll(".js-server-name").forEach(function (node) {
      node.textContent = serverName;
    });
  }

  function updateSeo() {
    if (config.tabTitle) {
      document.title = config.tabTitle;
      setOg("og:title", config.tabTitle);
      setMeta("twitter:title", config.tabTitle);
    }

    if (config.seo && config.seo.description) {
      setMeta("description", config.seo.description);
      setOg("og:description", config.seo.description);
      setMeta("twitter:description", config.seo.description);
    }

    if (config.seo && config.seo.keywords) {
      setMeta("keywords", config.seo.keywords);
    }

    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical) {
      const defaultUrl = config.baseUrl || "";
      const dynamic = window.location.origin && window.location.origin !== "null"
        ? `${window.location.origin}${window.location.pathname}`
        : defaultUrl;
      if (dynamic) {
        canonical.setAttribute("href", dynamic);
      }
    }

    const jsonLd = document.getElementById("json-ld");
    if (jsonLd) {
      const payload = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name: config.serverName || "Minecraft Server",
        description:
          (config.seo && config.seo.description) ||
          "Minecraft community server",
        genre: "Sandbox",
        gamePlatform: "Minecraft Java Edition",
        url: config.baseUrl || "https://example.com",
        publisher: {
          "@type": "Organization",
          name: config.serverName || "Minecraft Server"
        }
      };
      jsonLd.textContent = JSON.stringify(payload);
    }
  }

  function imageExists(src) {
    return new Promise(function (resolve) {
      const image = new Image();
      image.onload = function () {
        resolve(true);
      };
      image.onerror = function () {
        resolve(false);
      };
      image.src = src + "?v=" + Date.now();
    });
  }

  async function applyBackgroundMode() {
    const body = document.body;
    const hasCustomBackground = await imageExists("background.png");

    if (hasCustomBackground) {
      body.classList.remove("has-galaxy-bg");
      body.classList.add("has-image-bg");
      body.style.setProperty(
        "--background-image",
        "url('background.png')"
      );
    } else {
      body.classList.remove("has-image-bg");
      body.classList.add("has-galaxy-bg");
    }
  }

  async function applyIconAndLogo() {
    const hasIcon = await imageExists("icon.png");
    const hasLogo = await imageExists("logo.png");

    const iconPath = hasIcon ? "icon.png" : "logo.png";
    const logoPath = hasLogo ? "logo.png" : iconPath;

    document.querySelectorAll("[data-icon-image]").forEach(function (img) {
      img.src = iconPath;
    });

    document.querySelectorAll("[data-logo-image]").forEach(function (img) {
      img.src = logoPath;
    });

    const favicon = document.querySelector("link[rel='icon']");
    if (favicon && hasIcon) {
      favicon.setAttribute("href", "icon.png");
    }

    const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (appleIcon && hasIcon) {
      appleIcon.setAttribute("href", "icon.png");
    }
  }

  function applyThemeOverrides() {
    const root = document.documentElement;
    const glowColor =
      config.hero && typeof config.hero.logoGlowColor === "string"
        ? config.hero.logoGlowColor.trim()
        : "";

    if (glowColor) {
      root.style.setProperty("--hero-glow-color", glowColor);
    }
  }

  function resolveFooterCopyright() {
    const template =
      config.footer && config.footer.legalTextTemplate
        ? config.footer.legalTextTemplate
        : "© {{year}} {{serverName}}. Not affiliated with Mojang.";
    const year = config.year || new Date().getFullYear();
    const serverName = config.serverName || "Minecraft Server";

    return template
      .replace("{{year}}", String(year))
      .replace("{{serverName}}", serverName);
  }

  function wireNavAndFooterLinks() {
    const links = config.links || {};

    document.querySelectorAll("[data-link='store']").forEach(function (el) {
      el.setAttribute("href", links.store || "#");
    });
    document.querySelectorAll("[data-link='discord']").forEach(function (el) {
      el.setAttribute("href", links.discord || "#");
    });
    document.querySelectorAll("[data-link='support']").forEach(function (el) {
      el.setAttribute("href", links.support || "support/");
    });
    document.querySelectorAll("[data-link='tickets']").forEach(function (el) {
      el.setAttribute("href", links.tickets || "support/?mode=tickets");
    });
    document.querySelectorAll("[data-link='login']").forEach(function (el) {
      el.setAttribute("href", links.login || "support/?mode=login");
    });
    document.querySelectorAll("[data-link='signup']").forEach(function (el) {
      el.setAttribute("href", links.signup || "support/?mode=signup");
    });
    document.querySelectorAll("[data-link='tracker']").forEach(function (el) {
      el.setAttribute("href", links.tracker || "tracker/");
    });
    document.querySelectorAll("[data-link='rules']").forEach(function (el) {
      el.setAttribute("href", links.rules || "rules/");
    });
    document.querySelectorAll("[data-link='tos']").forEach(function (el) {
      el.setAttribute("href", links.tos || "tos/");
    });
    document.querySelectorAll("[data-link='privacy']").forEach(function (el) {
      el.setAttribute("href", links.privacy || "privacy/");
    });

    const footerCopy = document.querySelector("[data-footer-copy]");
    if (footerCopy) {
      footerCopy.textContent = resolveFooterCopyright();
    }
  }

  function renderFooterSocials() {
    const containers = document.querySelectorAll("[data-footer-socials]");
    if (!containers.length) {
      return;
    }

    const socialsConfig =
      (config.socials && typeof config.socials === "object"
        ? config.socials
        : null) ||
      (config.links && config.links.socials && typeof config.links.socials === "object"
        ? config.links.socials
        : {});

    const socialDefs = [
      { key: "twitter", label: "Twitter", badge: "X" },
      { key: "instagram", label: "Instagram", badge: "IG" },
      { key: "youtube", label: "YouTube", badge: "YT" },
      { key: "twitch", label: "Twitch", badge: "TW" },
      { key: "reddit", label: "Reddit", badge: "RD" }
    ];

    const links = socialDefs
      .map(function (def) {
        return {
          key: def.key,
          label: def.label,
          badge: def.badge,
          href:
            typeof socialsConfig[def.key] === "string"
              ? socialsConfig[def.key].trim()
              : ""
        };
      })
      .filter(function (item) {
        return item.href.length > 0;
      });

    containers.forEach(function (container) {
      container.innerHTML = "";
      if (!links.length) {
        container.classList.add("hidden");
        return;
      }

      container.classList.remove("hidden");

      links.forEach(function (item) {
        const anchor = document.createElement("a");
        anchor.className = "footer-social";
        anchor.href = item.href;
        anchor.setAttribute("aria-label", item.label);

        if (/^https?:\/\//i.test(item.href)) {
          anchor.target = "_blank";
          anchor.rel = "noopener";
        }

        anchor.innerHTML = `
          <span class="social-badge" aria-hidden="true">${item.badge}</span>
          <span class="social-label">${item.label}</span>
        `;

        container.appendChild(anchor);
      });
    });
  }

  function parsePort(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
      return null;
    }
    return parsed;
  }

  function getDefaultMinecraftPort() {
    const configured =
      config.server && config.server.defaultPort !== undefined
        ? parsePort(config.server.defaultPort)
        : null;
    return configured || 25565;
  }

  function parseAddress(address) {
    if (typeof address !== "string") {
      return { ip: "", port: null };
    }

    const trimmed = address.trim();
    if (!trimmed) {
      return { ip: "", port: null };
    }

    const lastColon = trimmed.lastIndexOf(":");
    if (lastColon <= 0 || lastColon === trimmed.length - 1) {
      return { ip: trimmed, port: null };
    }

    const maybePort = trimmed.slice(lastColon + 1);
    const parsedPort = parsePort(maybePort);
    if (!parsedPort) {
      return { ip: trimmed, port: null };
    }

    return {
      ip: trimmed.slice(0, lastColon),
      port: parsedPort
    };
  }

  function getPrimaryServerEndpoint() {
    const defaultPort = getDefaultMinecraftPort();
    const serverConfig = config.server || {};

    const parsedPrimaryIp = parseAddress(serverConfig.primaryIp || "");
    const parsedPrimaryAddress = parseAddress(serverConfig.primaryAddress || "");

    const ip =
      parsedPrimaryIp.ip ||
      parsedPrimaryAddress.ip ||
      serverConfig.primaryIp ||
      serverConfig.primaryAddress ||
      "play.example.com";

    const port =
      parsePort(serverConfig.primaryPort) ||
      parsedPrimaryIp.port ||
      parsedPrimaryAddress.port ||
      defaultPort;

    return {
      ip: ip,
      port: port,
      defaultPort: defaultPort,
      apiAddress: `${ip}:${port}`,
      displayAddress: port === defaultPort ? ip : `${ip}:${port}`
    };
  }

  function resolveServerEndpoint(serverConfig) {
    const primary = getPrimaryServerEndpoint();
    const source =
      (serverConfig && (serverConfig.ip || serverConfig.host)) ||
      primary.ip;
    const parsedSource = parseAddress(source);

    const ip = parsedSource.ip || source || primary.ip;
    const port =
      parsePort(serverConfig && serverConfig.port) ||
      parsedSource.port ||
      primary.port;

    return {
      ip: ip,
      port: port,
      apiAddress: `${ip}:${port}`,
      displayAddress:
        port === primary.defaultPort ? ip : `${ip}:${port}`
    };
  }

  function getServerConfigs() {
    const configured = Array.isArray(config.servers) ? config.servers : [];
    if (configured.length > 0) {
      return configured;
    }

    const primary = getPrimaryServerEndpoint();
    return [
      {
        id: "primary",
        label: `${config.serverName || "Server"} - Main`,
        provider: "Primary",
        ip: primary.ip,
        port: primary.port,
        fallbackPlayers:
          (config.server && Number(config.server.fallbackOnlineCount)) || 0,
        fallbackPeak:
          (config.server && Number(config.server.fallbackOnlineCount)) || 0
      }
    ];
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

  function normalizeRegion(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  function looksLikeIpv4(value) {
    if (typeof value !== "string") {
      return false;
    }
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value.trim());
  }

  function formatGeoRegion(payload) {
    if (!payload || payload.success !== true) {
      return null;
    }

    const region = normalizeRegion(payload.region);
    const city = normalizeRegion(payload.city);
    const country = normalizeRegion(payload.country_code || payload.country);
    const parts = [region, city, country].filter(Boolean);
    if (!parts.length) {
      return null;
    }
    return parts.join(" • ");
  }

  async function resolveRegion(endpoint, payload, serverConfig) {
    const configured = normalizeRegion(serverConfig && serverConfig.region);
    if (configured) {
      return { value: configured, error: false };
    }

    const payloadRegion = normalizeRegion(
      getFirstValue(payload, [
        "region",
        "location.region",
        "location",
        "geo.region",
        "host_location"
      ])
    );
    if (payloadRegion) {
      return { value: payloadRegion, error: false };
    }

    const payloadIp = getFirstValue(payload, [
      "ip",
      "ip_address",
      "host_ip",
      "debug.ip"
    ]);
    const ipCandidate = looksLikeIpv4(payloadIp)
      ? payloadIp.trim()
      : looksLikeIpv4(endpoint.ip)
      ? endpoint.ip.trim()
      : null;

    if (!ipCandidate) {
      return { value: null, error: true };
    }

    if (regionLookupCache.has(ipCandidate)) {
      return regionLookupCache.get(ipCandidate);
    }

    try {
      const geo = await fetchJsonWithTimeout(`https://ipwho.is/${ipCandidate}`, 9000);
      const region = formatGeoRegion(geo);
      const resolved = {
        value: region,
        error: !region
      };
      regionLookupCache.set(ipCandidate, resolved);
      return resolved;
    } catch (error) {
      const failed = { value: null, error: true };
      regionLookupCache.set(ipCandidate, failed);
      return failed;
    }
  }

  function extractTps(payload) {
    const rawValue = getFirstValue(payload, [
      "tps",
      "performance.tps",
      "server.tps",
      "debug.tps",
      "stats.tps",
      "world.tps"
    ]);
    const numeric = safeNumber(rawValue);
    if (numeric === null || numeric <= 0) {
      return null;
    }
    return Number(numeric.toFixed(2));
  }

  function extractUptimeSeconds(payload) {
    const rawValue = getFirstValue(payload, [
      "uptime",
      "uptime_seconds",
      "debug.uptime",
      "server.uptime",
      "stats.uptime"
    ]);

    const numeric = safeNumber(rawValue);
    if (numeric === null || numeric < 0) {
      return null;
    }

    return numeric > 100000000 ? Math.round(numeric / 1000) : Math.round(numeric);
  }

  async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function parseServerPayload(payload, sourceName, fallbackVersion) {
    const online =
      payload && typeof payload.online === "boolean" ? payload.online : null;
    if (online === null) {
      throw new Error(`Invalid ${sourceName} payload`);
    }

    const playersOnline = safeNumber(
      payload && payload.players ? payload.players.online : null
    );
    const playersMax = safeNumber(
      payload && payload.players ? payload.players.max : null
    );
    const tps = extractTps(payload);
    const uptimeSeconds = extractUptimeSeconds(payload);

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

    return {
      online: online,
      playersOnline: online ? playersOnline || 0 : 0,
      playersMax: playersMax,
      tps: tps,
      uptimeSeconds: uptimeSeconds,
      version: versionText
    };
  }

  function getPrimaryIp() {
    return getPrimaryServerEndpoint().displayAddress;
  }

  function wireIpText() {
    const ip = getPrimaryIp();
    document.querySelectorAll("[data-server-ip]").forEach(function (el) {
      el.textContent = ip;
    });
  }

  function showCopyToast(text) {
    let toast = document.querySelector(".copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "copy-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = text;
    toast.classList.add("show");

    const delay =
      (config.server && config.server.showCopyToastMs) || 1400;
    window.clearTimeout(showCopyToast._timeoutId);
    showCopyToast._timeoutId = window.setTimeout(function () {
      toast.classList.remove("show");
    }, delay);
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      const fallback = document.createElement("textarea");
      fallback.value = value;
      fallback.setAttribute("readonly", "readonly");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      const result = document.execCommand("copy");
      document.body.removeChild(fallback);
      return result;
    }
  }

  function wireCopyButtons() {
    const ip = getPrimaryIp();
    document.querySelectorAll("[data-copy-ip]").forEach(function (button) {
      button.addEventListener("click", async function () {
        const copyValue = button.getAttribute("data-copy-ip") || ip;
        const success = await copyText(copyValue);
        showCopyToast(success ? "Server IP copied" : "Unable to copy IP");
      });
    });
  }

  async function fetchServerStatus(serverConfig) {
    const endpoint = resolveServerEndpoint(serverConfig);
    const queryTarget = encodeURIComponent(endpoint.apiAddress);
    const proxyUrlRaw =
      config.server && typeof config.server.statusProxyUrl === "string"
        ? config.server.statusProxyUrl.trim()
        : "";

    const providers = [];

    if (proxyUrlRaw && !/REPLACE_WITH|YOUR_/i.test(proxyUrlRaw)) {
      const separator = proxyUrlRaw.includes("?") ? "&" : "?";
      providers.push({
        name: "status-proxy",
        url: `${proxyUrlRaw}${separator}address=${queryTarget}`
      });
    }

    providers.push(
      {
        name: "mcstatus",
        url: `https://api.mcstatus.io/v2/status/java/${queryTarget}`
      },
      {
        name: "mcsrvstat",
        url: `https://api.mcsrvstat.us/3/${queryTarget}`
      }
    );

    let lastErrorMessage = "Unable to reach status providers";

    for (const provider of providers) {
      try {
        const payload = await fetchJsonWithTimeout(provider.url, 12000);
        const parsed = parseServerPayload(
          payload,
          provider.name,
          serverConfig.gameVersion
        );
        const region = await resolveRegion(endpoint, payload, serverConfig);

        return {
          id: serverConfig.id,
          label: serverConfig.label,
          provider: serverConfig.provider,
          host: endpoint.displayAddress,
          playersOnline: parsed.playersOnline,
          peakPlayers: Math.max(parsed.playersOnline, parsed.playersMax || 0),
          tps: parsed.tps,
          tpsError: parsed.tps === null,
          uptimeSeconds: parsed.uptimeSeconds,
          uptimeError: parsed.uptimeSeconds === null,
          region: region.value,
          regionError: region.error,
          version: parsed.version,
          status: parsed.online ? "online" : "offline",
          source: provider.name,
          error: false
        };
      } catch (error) {
        lastErrorMessage =
          error && error.message ? error.message : "Unknown fetch error";
      }
    }

    return {
      id: serverConfig.id,
      label: serverConfig.label,
      provider: serverConfig.provider,
      host: endpoint.displayAddress,
      playersOnline: null,
      peakPlayers: null,
      tps: null,
      tpsError: true,
      uptimeSeconds: null,
      uptimeError: true,
      region: null,
      regionError: true,
      version: serverConfig.gameVersion || "Unknown",
      status: "error",
      source: "none",
      error: true,
      errorMessage: lastErrorMessage
    };
  }

  async function fetchAllServerStatuses() {
    const servers = getServerConfigs();
    const results = await Promise.all(servers.map(fetchServerStatus));
    const total = results.reduce(function (sum, server) {
      return sum + (Number.isFinite(server.playersOnline) ? server.playersOnline : 0);
    }, 0);

    const errorServers = results
      .filter(function (server) {
        return !!server.error;
      })
      .map(function (server) {
        return server.label;
      });

    const allFailed =
      results.length > 0 &&
      results.every(function (server) {
        return !!server.error;
      });

    return {
      totalPlayers: total,
      servers: results,
      hasErrors: errorServers.length > 0,
      allFailed: allFailed,
      errorServers: errorServers
    };
  }

  function bootstrap() {
    fillServerName();
    updateSeo();
    applyThemeOverrides();
    wireNavAndFooterLinks();
    renderFooterSocials();
    wireIpText();
    wireCopyButtons();
    applyBackgroundMode();
    applyIconAndLogo();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);

  window.TemplateApp = {
    config: config,
    fetchAllServerStatuses: fetchAllServerStatuses,
    formatNumber: formatNumber,
    showCopyToast: showCopyToast,
    getPrimaryIp: getPrimaryIp
  };
})();
