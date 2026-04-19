window.SITE_CONFIG = {
  year: 2024,
  serverName: "IconGens",
  tabTitle: "IconGens | #1 Generator Tycoon Minecraft Server",
  baseUrl: "https://example.com",
  seo: {
    description:
      "IconGens is a generator tycoon Minecraft server with farming, prestige, mining, forestry, pets, archeology, and more. We are constantly updated and improved.",
    keywords:
      "minecraft server, generator tycoon, icongens, iconrealms, minecraft java, farming, prestige, mining, forestry, pets, archeology"
  },
  hero: {
    subtitle: "#1 Generator Tycoon Server",
    description:
      "Build your tycoon from the ground up with farming, prestige, mining, forestry, pets, archeology, and fresh updates every season.",
    editionLabel: "Java 1.21+",
    logoGlowColor: "#8dff4a"
  },
  about: {
    headingPrefix: "What is",
    description:
      "IconGens is a generator tycoon Minecraft server with farming, prestige, mining, forestry, pets, archeology, and even more. We constantly ship improvements, rebalance progression, and add new content to keep every grind rewarding.",
    points: [
      "Expand your production through farming, mining, and forestry loops",
      "Push prestige tiers to unlock stronger generators, perks, and multipliers",
      "Collect pets, chase archeology finds, and compete in live events"
    ]
  },
  cta: {
    title: "Start Your Empire",
    description:
      "Hop in, claim your first setup, and start climbing IconGens leaderboards.",
    primaryButtonLabel: "Join Discord"
  },
  server: {
    primaryIp: "IconGen.minehut.gg",
    primaryPort: 25565,
    defaultPort: 25565,
    statusProxyUrl: "https://icongens.vercel.app/api/player-status",
    fallbackOnlineCount: 111,
    showCopyToastMs: 1400,
    refreshMs: 60000
  },
  links: {
    store: "https://icongens.tebex.io",
    discord: "https://discord.gg/fMbfFW7PWX",
    support: "support/",
    tickets: "support/?mode=tickets",
    ticketsApi: "https://icongens.vercel.app/api/tickets",
    login: "support/?mode=login",
    loginApi: "https://icongens.vercel.app/api/auth/login",
    signup: "support/?mode=signup",
    signupApi: "https://icongens.vercel.app/api/auth/signup",
    tracker: "tracker/",
    rules: "rules/",
    tos: "tos/",
    privacy: "privacy/"
  },
  socials: {
    twitter: "https://twitter.com/iconrealms",
    instagram: "https://instagram.com/iconrealms",
    youtube: "https://youtube.com/@iconrealms",
    twitch: "https://twitch.tv/iconrealms",
    reddit: "https://reddit.com/r/iconrealms"
  },
  tracker: {
    name: "FlowerTracker",
    subtitle: "Live player analytics across your configured Minecraft servers.",
    defaultRangeHours: 24,
    ranges: [1, 6, 24, 72, 168]
  },
  servers: [
    {
      id: "minehut",
      label: "IconGens - Minehut",
      ip: "IconGen.minehut.gg",
      port: 25565,
      provider: "Minehut",
      fallbackPlayers: 88,
      fallbackPeak: 126,
      gameVersion: "1.7-1.21.8"
    },
    {
      id: "minekeep",
      label: "IconGens - Minekeep",
      ip: "gens.iconrealms.net",
      port: 25565,
      provider: "Minekeep",
      fallbackPlayers: 23,
      fallbackPeak: 37,
      gameVersion: "1.7-1.21.8"
    }
  ],
  footer: {
    legalTextTemplate: "© {{year}} {{serverName}}. Not affiliated with Mojang.",
    trackerButtonLabel: "Tracker",
    discordButtonLabel: "Discord"
  },
  legal: {
    updatedAt: "April 2026",
    rules: {
      title: "Server Rules",
      intro:
        "The following rules are cited from Discord and apply to all players. Breaking these rules may result in warnings, mutes, kicks, bans, or other moderation actions.",
      sections: [
        {
          heading: "1. Discord Rules",
          items: [
            "No spamming messages, images, or reactions.",
            "Advertising servers or services in channels or DMs is prohibited.",
            "NSFW content of any kind is not allowed."
          ]
        },
        {
          heading: "2. Server and Chat Rules",
          items: [
            "Spamming in chat is not allowed.",
            "Derogatory, hateful, or discriminatory language is prohibited.",
            "Advertising of any kind is not allowed.",
            "Treat all users and staff with respect.",
            "Sharing real or fake personal information is not allowed.",
            "Threats involving DDoS, doxxing, or intimidation are prohibited.",
            "Excessive toxicity is not permitted (moderator discretion)."
          ]
        },
        {
          heading: "3. Gameplay Rules",
          body: "Violations in this section may result in severe punishment.",
          items: [
            "Inappropriate usernames or skins are not allowed.",
            "Using external tools or background software for unfair advantages is prohibited.",
            "Boosting, exploiting, or automated item generation is not allowed.",
            "Submitting false or misleading evidence is prohibited.",
            "AFK farming and macros are not allowed."
          ]
        },
        {
          heading: "4. Additional Information",
          items: [
            "Rules may be updated or modified at any time.",
            "Staff decisions are final."
          ]
        }
      ]
    },
    tos: {
      title: "Terms of Service",
      intro:
        "By accessing or using IconGens services (including the Minecraft server, website, store, Discord, and support systems), you agree to these Terms. If you do not agree, do not use the services.",
      sections: [
        {
          heading: "1. Eligibility and Accounts",
          body: "You are responsible for activity on your account and for keeping your credentials secure. You must not share accounts for ban evasion or abuse, and you must provide accurate information in support requests and appeals."
        },
        {
          heading: "2. Rules and Acceptable Use",
          body: "You agree to follow all posted server, Discord, and community rules. You must not cheat, exploit bugs, automate unfair gameplay, harass others, distribute malicious content, or attempt unauthorized access to systems, accounts, or infrastructure."
        },
        {
          heading: "3. Purchases, Virtual Goods, and Refunds",
          body: "Store purchases grant access to virtual goods, ranks, and benefits that are non-transferable and may be rebalanced for gameplay health. Refund handling follows the store policy and applicable law. Chargebacks, fraudulent payments, or payment abuse may result in suspension or permanent loss of benefits."
        },
        {
          heading: "4. Moderation and Enforcement",
          body: "Staff may issue warnings, mutes, kicks, temporary bans, permanent bans, resets, or other corrective actions when rules or policies are violated. In severe cases, action may be immediate and without prior warning. Attempts to evade enforcement may lead to escalated penalties."
        },
        {
          heading: "5. Availability and Changes",
          body: "Services are provided on an as-is and as-available basis. We may modify, rebalance, pause, or discontinue features, worlds, economies, events, and integrations at any time to maintain service quality, fairness, or security."
        },
        {
          heading: "6. Intellectual Property",
          body: "All server branding, artwork, custom configurations, website content, and original assets are protected and may not be copied, republished, or commercially reused without permission. Minecraft and Mojang-related assets remain property of their respective owners."
        },
        {
          heading: "7. Disclaimer and Limitation of Liability",
          body: "To the maximum extent permitted by law, we disclaim warranties of uninterrupted availability, merchantability, and fitness for a particular purpose. We are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the services."
        },
        {
          heading: "8. Contact and Policy Updates",
          body: "These Terms may be updated at any time. Continued use after updates means you accept the revised Terms. For questions, appeals, or legal requests, contact staff through official support channels."
        }
      ]
    },
    privacy: {
      title: "Privacy Policy",
      intro:
        "This Privacy Policy explains what data IconGens may collect, how it is used, and the choices available to users across our website, game server, Discord, store, and support tools.",
      sections: [
        {
          heading: "1. Data We Collect",
          body: "We may collect account and gameplay information such as Minecraft username, UUID, rank and purchase entitlements, economy/progression data, moderation history, ticket/support messages, and technical logs (including IP metadata, device/browser details, and timestamps)."
        },
        {
          heading: "2. How We Use Data",
          body: "Data is used to run and secure services, enforce rules, detect abuse and fraud, process purchases, provide support, investigate incidents, maintain backups, improve balancing/features, and measure aggregate server performance."
        },
        {
          heading: "3. Legal Basis and Retention",
          body: "Where applicable, processing is based on legitimate interests, contract performance, legal obligations, and user consent when required. We retain data only as long as needed for operations, security, dispute resolution, legal compliance, and abuse prevention."
        },
        {
          heading: "4. Data Sharing and Third Parties",
          body: "We do not sell personal data. Limited sharing may occur with trusted processors and infrastructure providers (such as hosting, payments, analytics, email, and support tooling) strictly to operate services. Data may also be disclosed when legally required or to protect users and systems."
        },
        {
          heading: "5. Cookies and Tracking",
          body: "Website tools may use cookies or similar technologies for authentication, preferences, diagnostics, and anti-abuse controls. You can manage cookies in your browser, but disabling some functions may affect site features."
        },
        {
          heading: "6. Security Measures",
          body: "We use reasonable administrative, technical, and organizational safeguards to protect data. However, no internet system is perfectly secure, and users should also protect their own accounts and devices."
        },
        {
          heading: "7. Your Rights and Requests",
          body: "Depending on your region, you may have rights to access, correct, delete, restrict, or object to certain processing. To submit a request, contact official support and include your Minecraft username and relevant details for verification."
        },
        {
          heading: "8. Children's Privacy and Updates",
          body: "If local law requires parental consent for minors, use of services must comply with those requirements. This policy may be updated over time; continued use after updates indicates acceptance of the revised policy."
        }
      ]
    }
  }
};
