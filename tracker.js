(function () {
  const HISTORY_KEY = "flowertracker-history-v1";
  const EVENT_KEY = "flowertracker-events-v1";
  const METRICS_KEY = "flowertracker-metrics-v1";
  const chartState = {
    history: [],
    rangeHours: 24,
    hoverCanvasX: null
  };

  function getNow() {
    return Date.now();
  }

  function parseHistory(raw) {
    if (!raw) {
      return [];
    }

    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) {
        return [];
      }

      return data
        .map(function (item) {
          const byServer = {};
          if (item && typeof item.byServer === "object" && item.byServer !== null) {
            Object.keys(item.byServer).forEach(function (serverId) {
              const value = Number(item.byServer[serverId]);
              if (Number.isFinite(value)) {
                byServer[serverId] = value;
              }
            });
          }

          return {
            ts: Number(item.ts),
            total: Number(item.total),
            byServer: byServer
          };
        })
        .filter(function (item) {
          return Number.isFinite(item.ts) && Number.isFinite(item.total);
        })
        .sort(function (a, b) {
          return a.ts - b.ts;
        });
    } catch (error) {
      return [];
    }
  }

  function getHistory() {
    return parseHistory(window.localStorage.getItem(HISTORY_KEY));
  }

  function setHistory(items) {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  }

  function getEventState() {
    const raw = window.localStorage.getItem(EVENT_KEY);
    if (!raw) {
      return {
        lastCrashTs: null,
        lastKickTs: null,
        lastTotal: null,
        lastTotalTs: null,
        lastStatuses: {}
      };
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        lastCrashTs: Number.isFinite(Number(parsed.lastCrashTs))
          ? Number(parsed.lastCrashTs)
          : null,
        lastKickTs: Number.isFinite(Number(parsed.lastKickTs))
          ? Number(parsed.lastKickTs)
          : null,
        lastTotal: Number.isFinite(Number(parsed.lastTotal))
          ? Number(parsed.lastTotal)
          : null,
        lastTotalTs: Number.isFinite(Number(parsed.lastTotalTs))
          ? Number(parsed.lastTotalTs)
          : null,
        lastStatuses:
          parsed && typeof parsed.lastStatuses === "object" && parsed.lastStatuses !== null
            ? parsed.lastStatuses
            : {}
      };
    } catch (error) {
      return {
        lastCrashTs: null,
        lastKickTs: null,
        lastTotal: null,
        lastTotalTs: null,
        lastStatuses: {}
      };
    }
  }

  function setEventState(state) {
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(state));
  }

  function getDefaultMetricsState() {
    return {
      globalPeak: 0,
      byServer: {}
    };
  }

  function getMetricsState() {
    const raw = window.localStorage.getItem(METRICS_KEY);
    if (!raw) {
      return getDefaultMetricsState();
    }

    try {
      const parsed = JSON.parse(raw);
      const byServer = {};

      if (parsed && typeof parsed.byServer === "object" && parsed.byServer !== null) {
        Object.keys(parsed.byServer).forEach(function (serverId) {
          const item = parsed.byServer[serverId];
          const firstSeenTs = Number(item && item.firstSeenTs);
          const peakPlayers = Number(item && item.peakPlayers);

          byServer[serverId] = {
            firstSeenTs: Number.isFinite(firstSeenTs) ? firstSeenTs : null,
            peakPlayers: Number.isFinite(peakPlayers) ? peakPlayers : 0
          };
        });
      }

      const globalPeak = Number(parsed && parsed.globalPeak);
      return {
        globalPeak: Number.isFinite(globalPeak) ? globalPeak : 0,
        byServer: byServer
      };
    } catch (error) {
      return getDefaultMetricsState();
    }
  }

  function setMetricsState(metricsState) {
    window.localStorage.setItem(METRICS_KEY, JSON.stringify(metricsState));
  }

  function updateMetricsState(result) {
    const now = getNow();
    const next = getMetricsState();
    const total = Number(result && result.totalPlayers);

    if (Number.isFinite(total)) {
      next.globalPeak = Math.max(next.globalPeak || 0, total);
    }

    (result && Array.isArray(result.servers) ? result.servers : []).forEach(function (server) {
      if (!server || typeof server.id !== "string") {
        return;
      }

      if (typeof server.playersOnline !== "number" || !Number.isFinite(server.playersOnline)) {
        return;
      }

      const players = server.playersOnline;
      const providerPeak =
        typeof server.peakPlayers === "number" && Number.isFinite(server.peakPlayers)
          ? server.peakPlayers
          : players;
      const providerUptimeSeconds =
        typeof server.uptimeSeconds === "number" && Number.isFinite(server.uptimeSeconds)
          ? Math.max(0, server.uptimeSeconds)
          : null;
      const providerFirstSeenTs =
        providerUptimeSeconds === null
          ? null
          : Math.max(0, now - Math.round(providerUptimeSeconds * 1000));

      const current = next.byServer[server.id] || {
        firstSeenTs: null,
        peakPlayers: 0
      };

      if (Number.isFinite(providerFirstSeenTs)) {
        if (!Number.isFinite(current.firstSeenTs) || providerFirstSeenTs < current.firstSeenTs) {
          current.firstSeenTs = providerFirstSeenTs;
        }
      } else if (!Number.isFinite(current.firstSeenTs)) {
        current.firstSeenTs = now;
      }
      current.peakPlayers = Math.max(Number(current.peakPlayers) || 0, players, providerPeak);
      next.byServer[server.id] = current;
    });

    setMetricsState(next);
    return next;
  }

  function interpolateByServer(previous, current, ratio) {
    const result = {};
    const ids = new Set([
      ...Object.keys(previous && previous.byServer ? previous.byServer : {}),
      ...Object.keys(current || {})
    ]);

    ids.forEach(function (serverId) {
      const start = Number(previous && previous.byServer ? previous.byServer[serverId] : NaN);
      const end = Number(current[serverId]);

      if (Number.isFinite(start) && Number.isFinite(end)) {
        result[serverId] = Math.round(start + (end - start) * ratio);
        return;
      }

      if (Number.isFinite(end)) {
        result[serverId] = end;
        return;
      }

      if (Number.isFinite(start)) {
        result[serverId] = start;
      }
    });

    return result;
  }

  function appendHistory(totalPlayers, servers) {
    const now = getNow();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const history = getHistory();
    const byServer = {};

    (Array.isArray(servers) ? servers : []).forEach(function (server) {
      if (server && typeof server.id === "string" && Number.isFinite(server.playersOnline)) {
        byServer[server.id] = server.playersOnline;
      }
    });

    const currentPoint = {
      ts: now,
      total: Number(totalPlayers) || 0,
      byServer: byServer
    };

    const lastPoint = history.length ? history[history.length - 1] : null;

    if (lastPoint && Number.isFinite(lastPoint.ts) && now > lastPoint.ts) {
      const delta = Math.abs(currentPoint.total - lastPoint.total);
      const stepCount = Math.min(10, Math.max(0, delta - 1));

      for (let step = 1; step <= stepCount; step += 1) {
        const ratio = step / (stepCount + 1);
        history.push({
          ts: Math.round(lastPoint.ts + (now - lastPoint.ts) * ratio),
          total: Math.round(lastPoint.total + (currentPoint.total - lastPoint.total) * ratio),
          byServer: interpolateByServer(lastPoint, currentPoint.byServer, ratio)
        });
      }
    }

    history.push(currentPoint);

    const trimmed = history.filter(function (point) {
      return point.ts >= now - maxAge;
    });

    setHistory(trimmed);
    return trimmed;
  }

  function getRangeHours() {
    const selected = document.querySelector(".range-btn.active");
    const hours = selected ? Number(selected.getAttribute("data-hours")) : 24;
    return Number.isFinite(hours) && hours > 0 ? hours : 24;
  }

  function filterRange(history, hours) {
    const start = getNow() - hours * 60 * 60 * 1000;
    const filtered = history.filter(function (point) {
      return point.ts >= start;
    });

    if (filtered.length === 1) {
      filtered.unshift({ ts: start, total: filtered[0].total, byServer: {} });
    }

    if (filtered.length === 0) {
      filtered.push({ ts: start, total: 0, byServer: {} });
      filtered.push({ ts: getNow(), total: 0, byServer: {} });
    }

    return filtered;
  }

  function computeRecordedPeak(history, metricsState) {
    if (!Array.isArray(history) || !history.length) {
      return Number(metricsState && metricsState.globalPeak) || null;
    }
    let peak = 0;
    history.forEach(function (point) {
      if (Number.isFinite(point.total) && point.total > peak) {
        peak = point.total;
      }
    });

    const persistedPeak = Number(metricsState && metricsState.globalPeak);
    return Math.max(peak, Number.isFinite(persistedPeak) ? persistedPeak : 0);
  }

  function computeServerRecordedPeak(history, serverId, metricsState) {
    if (!Array.isArray(history) || !history.length || !serverId) {
      const fallbackPeak = Number(
        metricsState && metricsState.byServer && metricsState.byServer[serverId]
          ? metricsState.byServer[serverId].peakPlayers
          : NaN
      );
      return Number.isFinite(fallbackPeak) ? fallbackPeak : null;
    }

    let peak = null;
    history.forEach(function (point) {
      const value =
        point && point.byServer && Number.isFinite(point.byServer[serverId])
          ? point.byServer[serverId]
          : null;
      if (value !== null && (peak === null || value > peak)) {
        peak = value;
      }
    });

    const persistedPeak = Number(
      metricsState && metricsState.byServer && metricsState.byServer[serverId]
        ? metricsState.byServer[serverId].peakPlayers
        : NaN
    );
    if (Number.isFinite(persistedPeak)) {
      return peak === null ? persistedPeak : Math.max(peak, persistedPeak);
    }

    return peak;
  }

  function computeServerRecordedUptimeMs(history, serverId, metricsState) {
    if (!serverId) {
      return null;
    }

    let firstSeen = null;
    if (Array.isArray(history) && history.length) {
      history.forEach(function (point) {
        const hasData =
          point && point.byServer && Number.isFinite(point.byServer[serverId]);
        if (hasData && firstSeen === null) {
          firstSeen = point.ts;
        }
      });
    }

    const persistedFirstSeen = Number(
      metricsState && metricsState.byServer && metricsState.byServer[serverId]
        ? metricsState.byServer[serverId].firstSeenTs
        : NaN
    );

    if (Number.isFinite(persistedFirstSeen)) {
      if (firstSeen === null || persistedFirstSeen < firstSeen) {
        firstSeen = persistedFirstSeen;
      }
    }

    if (firstSeen === null) {
      return null;
    }

    return Math.max(0, getNow() - firstSeen);
  }

  function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) {
      return null;
    }

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${Math.max(minutes, 0)}m`;
  }

  function formatRelativeAgo(timestamp, mode) {
    if (!Number.isFinite(timestamp)) {
      return "--";
    }

    const elapsedMs = Math.max(0, Date.now() - timestamp);
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (mode === "crash") {
      if (days > 0) {
        return `${days}d ${hours}h ago`;
      }
      if (hours > 0) {
        return `${hours}h ago`;
      }
      return `${minutes}m ago`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s ago`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  }

  function updateEventState(result, config) {
    const eventState = getEventState();
    if (result.allFailed) {
      return eventState;
    }

    const now = Date.now();
    const trackerConfig = (config && config.tracker) || {};
    const kickWindowMs = Number.isFinite(Number(trackerConfig.kickWindowSeconds))
      ? Math.max(1, Number(trackerConfig.kickWindowSeconds)) * 1000
      : 10000;
    const kickTargetMaxPlayers = Number.isFinite(Number(trackerConfig.kickTargetMaxPlayers))
      ? Math.max(0, Number(trackerConfig.kickTargetMaxPlayers))
      : 2;

    let crashDetected = false;
    const nextStatuses = {};

    result.servers.forEach(function (server) {
      const serverId = server.id || server.host || server.label;
      const isOnline = server.status === "online";
      const previous = eventState.lastStatuses[serverId];

      if (previous === true && !isOnline) {
        crashDetected = true;
      }

      nextStatuses[serverId] = isOnline;
    });

    if (crashDetected) {
      eventState.lastCrashTs = now;
    }

    const previousTotal = Number.isFinite(eventState.lastTotal)
      ? eventState.lastTotal
      : null;
    const previousTotalTs = Number.isFinite(eventState.lastTotalTs)
      ? eventState.lastTotalTs
      : null;
    const currentTotal = Number(result.totalPlayers || 0);

    if (
      previousTotal !== null &&
      previousTotalTs !== null &&
      now - previousTotalTs <= kickWindowMs &&
      previousTotal > kickTargetMaxPlayers &&
      currentTotal <= kickTargetMaxPlayers
    ) {
        eventState.lastKickTs = now;
    }

    eventState.lastTotal = currentTotal;
    eventState.lastTotalTs = now;
    eventState.lastStatuses = nextStatuses;
    setEventState(eventState);
    return eventState;
  }

  function renderEventRow(eventState) {
    const crashNode = document.querySelector("[data-last-crash]");
    const kickNode = document.querySelector("[data-last-kick]");

    if (crashNode) {
      crashNode.textContent = formatRelativeAgo(eventState.lastCrashTs, "crash");
    }
    if (kickNode) {
      kickNode.textContent = formatRelativeAgo(eventState.lastKickTs, "kick");
    }
  }

  function bindChartInteractions() {
    const canvas = document.querySelector("[data-tracker-canvas]");
    if (!canvas || canvas.dataset.boundInteractions === "1") {
      return;
    }

    canvas.dataset.boundInteractions = "1";

    canvas.addEventListener("mousemove", function (event) {
      const rect = canvas.getBoundingClientRect();
      chartState.hoverCanvasX = event.clientX - rect.left;
      renderChart(chartState.history, chartState.rangeHours);
    });

    canvas.addEventListener("mouseleave", function () {
      chartState.hoverCanvasX = null;
      renderChart(chartState.history, chartState.rangeHours);
    });
  }

  function renderSummary(result, config, history, metricsState) {
    const total = document.querySelector("[data-tracker-total]");
    const servers = document.querySelector("[data-tracker-servers]");
    const peak = document.querySelector("[data-tracker-peak]");
    const subtitle = document.querySelector("[data-tracker-count-copy]");
    const trackerError = document.querySelector("[data-tracker-error]");
    const recordedPeak = computeRecordedPeak(history, metricsState);

    if (total) {
      total.textContent = window.TemplateApp.formatNumber(result.totalPlayers);
    }

    if (servers) {
      servers.textContent = window.TemplateApp.formatNumber(result.servers.length);
    }

    if (peak) {
      peak.textContent =
        recordedPeak === null
          ? "--"
          : window.TemplateApp.formatNumber(recordedPeak);
    }

    if (subtitle) {
      subtitle.textContent = `Counting ${window.TemplateApp.formatNumber(
        result.totalPlayers
      )} players on ${window.TemplateApp.formatNumber(
        result.servers.length
      )} Minecraft servers.`;
    }

    if (trackerError) {
      if (result.hasErrors) {
        const suffix =
          result.errorServers && result.errorServers.length
            ? ` (${result.errorServers.join(", ")})`
            : "";
        trackerError.textContent = `Error pulling data${suffix}`;
        trackerError.classList.remove("hidden");
      } else {
        trackerError.textContent = "";
        trackerError.classList.add("hidden");
      }
    }

    const title = document.querySelector("[data-tracker-title]");
    if (title) {
      title.textContent =
        (config.tracker && config.tracker.name) || "FlowerTracker";
    }

    const subTitleText = document.querySelector("[data-tracker-subtitle]");
    if (subTitleText && config.tracker && config.tracker.subtitle) {
      subTitleText.textContent = config.tracker.subtitle;
    }
  }

  function renderServerList(result, history, metricsState) {
    const list = document.querySelector("[data-tracker-server-list]");
    if (!list) {
      return;
    }

    list.innerHTML = "";

    result.servers.forEach(function (server) {
      const onlineText = server.error
        ? "Error pulling data"
        : window.TemplateApp.formatNumber(server.playersOnline);
      const onlineClass = server.error
        ? "server-list-online error"
        : "server-list-online";
      const statusText = server.error
        ? "Error pulling data"
        : server.status === "offline"
        ? "offline"
        : "online";
      const dotClass = server.error
        ? "server-live-dot error"
        : server.status === "offline"
        ? "server-live-dot offline"
        : "server-live-dot";
      const statusClass = server.error
        ? "server-list-meta pull-error-text"
        : "server-list-meta";

      const recordedPeak = computeServerRecordedPeak(history, server.id, metricsState);
      const peakValueText =
        recordedPeak === null
          ? "Error fetching data"
          : window.TemplateApp.formatNumber(recordedPeak);
      const peakValueClass =
        recordedPeak === null
          ? "server-stat-value error"
          : "server-stat-value";

      const recordedUptimeMs = computeServerRecordedUptimeMs(
        history,
        server.id,
        metricsState
      );
      const uptimeValueText =
        recordedUptimeMs === null
          ? "Error fetching data"
          : formatDuration(recordedUptimeMs);
      const uptimeValueClass =
        recordedUptimeMs === null
          ? "server-stat-value error"
          : "server-stat-value";

      const tpsValueText = Number.isFinite(server.tps)
        ? server.tps.toFixed(2)
        : "Error fetching data";
      const tpsValueClass = Number.isFinite(server.tps)
        ? "server-stat-value"
        : "server-stat-value error";

      const regionValueText =
        typeof server.region === "string" && server.region.trim()
          ? server.region
          : "Error fetching data";
      const regionValueClass =
        typeof server.region === "string" && server.region.trim()
          ? "server-stat-value"
          : "server-stat-value error";

      const card = document.createElement("article");
      card.className = "server-list-card";
      card.innerHTML = `
        <h3>${server.label}</h3>
        <div class="server-list-meta">${server.provider} • ${server.host}</div>
        <div class="server-list-values">
          <div>
            <div class="${onlineClass}">${onlineText}</div>
            <div class="${statusClass}"><span class="${dotClass}"></span> ${statusText}</div>
          </div>
          <div class="server-list-meta">${server.version}</div>
        </div>
        <div class="server-stat-grid">
          <div class="server-stat">
            <span class="server-stat-label">Peak Recorded</span>
            <span class="${peakValueClass}">${peakValueText}</span>
          </div>
          <div class="server-stat">
            <span class="server-stat-label">TPS</span>
            <span class="${tpsValueClass}">${tpsValueText}</span>
          </div>
          <div class="server-stat">
            <span class="server-stat-label">Recorded Uptime</span>
            <span class="${uptimeValueClass}">${uptimeValueText}</span>
          </div>
          <div class="server-stat">
            <span class="server-stat-label">Region</span>
            <span class="${regionValueClass}">${regionValueText}</span>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  }

  function renderChart(history, rangeHours) {
    const canvas = document.querySelector("[data-tracker-canvas]");
    if (!canvas) {
      return;
    }

    const wrap = canvas.parentElement;
    const width = Math.max(320, wrap.clientWidth - 6);
    const height = 320;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const points = filterRange(history, rangeHours);
    const minTs = points[0].ts;
    const maxTs = points[points.length - 1].ts;

    const values = points.map(function (point) {
      return point.total;
    });
    const maxValue = Math.max(10, ...values);

    const pad = { top: 18, right: 16, bottom: 28, left: 56 };
    const chartWidth = width - pad.left - pad.right;
    const chartHeight = height - pad.top - pad.bottom;

    function x(ts) {
      if (maxTs === minTs) {
        return pad.left;
      }
      return pad.left + ((ts - minTs) / (maxTs - minTs)) * chartWidth;
    }

    function y(value) {
      return pad.top + (1 - value / maxValue) * chartHeight;
    }

    ctx.font = "12px Outfit, Segoe UI, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.strokeStyle = "rgba(150, 170, 158, 0.2)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i += 1) {
      const py = pad.top + (chartHeight / 4) * i;
      const tickValue = Math.round(maxValue * (1 - i / 4));

      ctx.beginPath();
      ctx.moveTo(pad.left, py);
      ctx.lineTo(width - pad.right, py);
      ctx.stroke();

      ctx.fillStyle = "rgba(186, 208, 196, 0.82)";
      ctx.fillText(window.TemplateApp.formatNumber(tickValue), pad.left - 8, py);
    }

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#f7a733");
    gradient.addColorStop(1, "#49ef7a");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    points.forEach(function (point, index) {
      const px = x(point.ts);
      const py = y(point.total);
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(73, 239, 122, 0.2)";
    ctx.beginPath();
    points.forEach(function (point, index) {
      const px = x(point.ts);
      const py = y(point.total);
      if (index === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.lineTo(x(maxTs), height - pad.bottom);
    ctx.lineTo(x(minTs), height - pad.bottom);
    ctx.closePath();
    ctx.fill();

    const hoverX = chartState.hoverCanvasX;
    const withinPlot =
      Number.isFinite(hoverX) &&
      hoverX >= pad.left &&
      hoverX <= width - pad.right;

    if (withinPlot) {
      let closestPoint = points[0];
      let closestPx = x(points[0].ts);
      let minDistance = Math.abs(closestPx - hoverX);

      points.forEach(function (point) {
        const px = x(point.ts);
        const distance = Math.abs(px - hoverX);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
          closestPx = px;
        }
      });

      const closestPy = y(closestPoint.total);

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "rgba(255, 222, 140, 0.75)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(closestPx, pad.top);
      ctx.lineTo(closestPx, height - pad.bottom);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#ffd98b";
      ctx.beginPath();
      ctx.arc(closestPx, closestPy, 4, 0, Math.PI * 2);
      ctx.fill();

      const timeLabel = new Date(closestPoint.ts).toLocaleString([], {
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
      const playersLabel = `Players: ${window.TemplateApp.formatNumber(
        closestPoint.total
      )}`;

      ctx.font = "600 12px Outfit, Segoe UI, sans-serif";
      const w1 = ctx.measureText(timeLabel).width;
      const w2 = ctx.measureText(playersLabel).width;
      const tooltipWidth = Math.max(w1, w2) + 16;
      const tooltipHeight = 44;
      const tooltipX = Math.min(
        width - pad.right - tooltipWidth,
        Math.max(pad.left + 8, closestPx + 10)
      );
      const tooltipY = pad.top + 8;

      ctx.fillStyle = "rgba(8, 24, 16, 0.95)";
      ctx.strokeStyle = "rgba(255, 214, 107, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#d7f3df";
      ctx.fillText(playersLabel, tooltipX + 8, tooltipY + 7);
      ctx.fillStyle = "#9ec4ad";
      ctx.fillText(timeLabel, tooltipX + 8, tooltipY + 24);
    }
  }

  function renderRangeButtons(config) {
    const container = document.querySelector("[data-range-buttons]");
    if (!container) {
      return;
    }

    const ranges =
      config.tracker && Array.isArray(config.tracker.ranges)
        ? config.tracker.ranges
        : [1, 6, 24, 72, 168];
    const defaultRange =
      (config.tracker && Number(config.tracker.defaultRangeHours)) || 24;

    container.innerHTML = "";

    ranges.forEach(function (hours) {
      const button = document.createElement("button");
      button.className = "range-btn";
      button.type = "button";
      button.setAttribute("data-hours", String(hours));
      button.textContent = hours >= 24 ? `${hours / 24}d` : `${hours}h`;

      if (hours === defaultRange) {
        button.classList.add("active");
      }

      button.addEventListener("click", function () {
        container.querySelectorAll(".range-btn").forEach(function (el) {
          el.classList.remove("active");
        });
        button.classList.add("active");
        chartState.rangeHours = getRangeHours();
        chartState.history = getHistory();
        renderChart(chartState.history, chartState.rangeHours);
      });

      container.appendChild(button);
    });
  }

  function buildErrorResult() {
    return {
      totalPlayers: 0,
      servers: [],
      hasErrors: true,
      allFailed: true,
      errorServers: []
    };
  }

  async function refresh() {
    const config = window.TemplateApp.config || {};
    let result = buildErrorResult();

    try {
      result = await window.TemplateApp.fetchAllServerStatuses();
    } catch (error) {
      result = buildErrorResult();
    }

    let history = getHistory();
    if (!result.allFailed) {
      history = appendHistory(result.totalPlayers, result.servers);
    }

    const metricsState = updateMetricsState(result);

    const eventState = updateEventState(result, config);

    chartState.history = history;
    chartState.rangeHours = getRangeHours();

    renderSummary(result, config, history, metricsState);
    renderEventRow(eventState);
    renderServerList(result, history, metricsState);
    renderChart(chartState.history, chartState.rangeHours);
  }

  function init() {
    const config = window.TemplateApp.config || {};
    renderRangeButtons(config);
    refresh();

    const interval =
      (config.server && Number(config.server.refreshMs)) || 60000;
    const trackerPollingMs = Math.min(interval, 10000);
    window.setInterval(refresh, trackerPollingMs);

    bindChartInteractions();

    window.addEventListener("resize", function () {
      chartState.history = getHistory();
      chartState.rangeHours = getRangeHours();
      renderChart(chartState.history, chartState.rangeHours);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
