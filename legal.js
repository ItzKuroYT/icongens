(function () {
  function createSection(section) {
    const wrapper = document.createElement("section");
    wrapper.className = "legal-section";

    const heading = document.createElement("h2");
    heading.textContent = section.heading || "Section";

    const body = document.createElement("p");
    body.textContent = section.body || "";

    wrapper.appendChild(heading);

    if (section.body) {
      wrapper.appendChild(body);
    }

    if (Array.isArray(section.items) && section.items.length) {
      const list = document.createElement("ul");
      list.className = "legal-list";

      section.items.forEach(function (item) {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });

      wrapper.appendChild(list);
    }

    return wrapper;
  }

  function renderLegalPage(config) {
    const pageKey = document.body.getAttribute("data-legal-page") || "rules";
    const legalRoot = (config.legal && config.legal[pageKey]) || {};

    const title = document.querySelector("[data-legal-title]");
    const intro = document.querySelector("[data-legal-intro]");
    const updated = document.querySelector("[data-legal-updated]");
    const content = document.querySelector("[data-legal-content]");

    if (title) {
      title.textContent = legalRoot.title || "Legal";
    }

    if (intro) {
      intro.textContent = legalRoot.intro || "";
    }

    if (updated) {
      updated.textContent = `Last updated: ${(config.legal && config.legal.updatedAt) || "N/A"}`;
    }

    if (content) {
      content.innerHTML = "";
      const sections = Array.isArray(legalRoot.sections) ? legalRoot.sections : [];
      sections.forEach(function (section) {
        content.appendChild(createSection(section));
      });
    }

    if (legalRoot.title && config.serverName) {
      document.title = `${legalRoot.title} | ${config.serverName}`;
    }
  }

  function init() {
    const config = window.TemplateApp.config || {};
    renderLegalPage(config);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
