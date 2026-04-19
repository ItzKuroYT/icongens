(function () {
  function renderAbout(config) {
    const aboutHeading = document.querySelector("[data-about-heading]");
    const aboutDescription = document.querySelector("[data-about-description]");
    const aboutPoints = document.querySelector("[data-about-points]");

    if (aboutHeading) {
      const prefix =
        (config.about && config.about.headingPrefix) || "What is";
      const serverName = config.serverName || "Our Server";
      aboutHeading.textContent = `${prefix} ${serverName}?`;
    }

    if (aboutDescription && config.about && config.about.description) {
      aboutDescription.textContent = config.about.description;
    }

    if (aboutPoints && config.about && Array.isArray(config.about.points)) {
      aboutPoints.innerHTML = "";
      config.about.points.forEach(function (point) {
        const li = document.createElement("li");
        li.textContent = point;
        aboutPoints.appendChild(li);
      });
    }
  }

  function renderHero(config) {
    const title = document.querySelector("[data-hero-title]");
    const subtitle = document.querySelector("[data-hero-subtitle]");
    const description = document.querySelector("[data-hero-description]");
    const edition = document.querySelector("[data-hero-edition]");

    if (title) {
      title.textContent = config.serverName || "Minecraft Server";
    }

    if (subtitle && config.hero && config.hero.subtitle) {
      subtitle.textContent = config.hero.subtitle;
    }

    if (description && config.hero && config.hero.description) {
      description.textContent = config.hero.description;
    }

    if (edition && config.hero && config.hero.editionLabel) {
      edition.textContent = config.hero.editionLabel;
    }
  }

  function renderCta(config) {
    const ctaTitle = document.querySelector("[data-cta-title]");
    const ctaDescription = document.querySelector("[data-cta-description]");
    const ctaPrimaryButton = document.querySelector("[data-cta-primary]");

    if (ctaTitle && config.cta && config.cta.title) {
      ctaTitle.textContent = config.cta.title;
    }

    if (ctaDescription && config.cta && config.cta.description) {
      ctaDescription.textContent = config.cta.description;
    }

    if (ctaPrimaryButton && config.cta && config.cta.primaryButtonLabel) {
      ctaPrimaryButton.textContent = config.cta.primaryButtonLabel;
    }
  }

  function renderServerCards(result) {
    const cardContainer = document.querySelector("[data-player-cards]");
    const totalElement = document.querySelector("[data-total-online]");
    const heroOnline = document.querySelector("[data-hero-online]");
    const playerError = document.querySelector("[data-player-error]");

    if (totalElement) {
      totalElement.textContent = window.TemplateApp.formatNumber(
        result.totalPlayers
      );
    }

    if (heroOnline) {
      if (result.allFailed) {
        heroOnline.textContent = "Error pulling data";
        heroOnline.classList.add("pull-error-inline");
      } else {
        heroOnline.textContent =
          window.TemplateApp.formatNumber(result.totalPlayers) + " online";
        heroOnline.classList.remove("pull-error-inline");
      }
    }

    if (playerError) {
      if (result.hasErrors) {
        const suffix =
          result.errorServers && result.errorServers.length
            ? ` (${result.errorServers.join(", ")})`
            : "";
        playerError.textContent = `Error pulling data${suffix}`;
        playerError.classList.remove("hidden");
      } else {
        playerError.textContent = "";
        playerError.classList.add("hidden");
      }
    }

    if (!cardContainer) {
      return;
    }

    cardContainer.innerHTML = "";
    result.servers.forEach(function (server) {
      const onlineText = server.error
        ? "Error pulling data"
        : window.TemplateApp.formatNumber(server.playersOnline);
      const onlineClass = server.error ? "server-online error" : "server-online";
      const statusText = server.error
        ? "Error pulling data"
        : server.status === "offline"
        ? "Offline"
        : "Live";
      const dotClass = server.error
        ? "server-live-dot error"
        : server.status === "offline"
        ? "server-live-dot offline"
        : "server-live-dot";
      const statusClass = server.error ? "server-metadata pull-error-text" : "server-metadata";

      const card = document.createElement("article");
      card.className = "server-card";
      card.innerHTML = `
        <h3>${server.label}</h3>
        <div class="server-metadata">${server.provider} • ${server.host}</div>
        <div class="${onlineClass}">${onlineText}</div>
        <div class="${statusClass}"><span class="${dotClass}"></span> ${statusText} • ${server.version}</div>
      `;
      cardContainer.appendChild(card);
    });
  }

  async function refreshPlayers(config) {
    try {
      const result = await window.TemplateApp.fetchAllServerStatuses();
      renderServerCards(result);
    } catch (error) {
      renderServerCards({
        totalPlayers: 0,
        servers: [],
        hasErrors: true,
        allFailed: true,
        errorServers: []
      });
    }
  }

  function startPlayerPolling(config) {
    refreshPlayers(config);
    const refreshMs =
      (config.server && Number(config.server.refreshMs)) || 60000;
    window.setInterval(function () {
      refreshPlayers(config);
    }, refreshMs);
  }

  function init() {
    const config = window.TemplateApp.config || {};
    renderHero(config);
    renderAbout(config);
    renderCta(config);
    startPlayerPolling(config);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
