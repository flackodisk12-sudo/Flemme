const os = require("os");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "5.4",
    author: "Alamin (edit FR style)",
    role: 0,
    category: "system",
    guide: "{p}uptime"
  },

  onStart: async function ({ api, event, usersData, threadsData }) {

    const delay = ms => new Promise(res => setTimeout(res, ms));

    const frames = [
      "🌑 Chargement... 0%",
      "🌒 Chargement... 25%",
      "🌓 Chargement... 50%",
      "🌔 Chargement... 75%",
      "🌕 Chargement... 100%"
    ];

    const box = (text) => `
⊱ ────── {.⋅ ✨ STATUT DU BOT ✨ ⋅.} ───── ⊰

${text}

⊱ ────── {.⋅ ✨ STATUT DU BOT ✨ ⋅.} ───── ⊰
`;

    try {

      let msg = await api.sendMessage(
        box("🌕 Initialisation du système..."),
        event.threadID
      );

      for (let i = 0; i < frames.length; i++) {
        await delay(300);
        await api.editMessage(
          box(frames[i]),
          msg.messageID
        );
      }

      // ⏱ uptime
      const uptime = process.uptime();
      const jours = Math.floor(uptime / 86400);
      const heures = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const secondes = Math.floor(uptime % 60);

      const uptimeText = `${jours}j ${heures}h ${minutes}m ${secondes}s`;

      // 💾 mémoire
      const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

      // 📶 ping simulé
      const ping = Date.now() % 100;

      // 📅 date
      const date = new Date().toLocaleDateString("fr-FR", {
        timeZone: "Africa/Kinshasa",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });

      // 👥 users / threads
      let users = 0;
      let threads = 0;

      try {
        if (usersData?.getAll) {
          users = (await usersData.getAll()).length || 0;
        }
      } catch {}

      try {
        if (threadsData?.getAll) {
          threads = (await threadsData.getAll()).length || 0;
        }
      } catch {}

      const final = `
🌸 ÉTAT DU SYSTÈME NEO

🕒 Temps en ligne : ${uptimeText}
📶 Latence        : ${ping} ms
📅 Date           : ${date}
💻 Mémoire RAM    : ${ram} MB

👥 Utilisateurs   : ${users}
💬 Conversations  : ${threads}

👑 Propriétaire   : Célestin Olua
      `.trim();

      await delay(300);

      return api.editMessage(box(final), msg.messageID);

    } catch (err) {
      console.log(err);
      return api.sendMessage(
        box("❌ Erreur lors du chargement du statut."),
        event.threadID
      );
    }
  }
};
