const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "aide"],
    version: "4.0",
    author: "Célestin x ChatGPT",
    usePrefix: false,
    role: 0,
    category: "info",
    priority: 1
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const arg = args[0]?.toLowerCase();

    const top = "━━━━━━♡♥♡━━━━━━";
    const bottom = "━━━━━━♡♥♡━━━━━━";

    // 📜 MENU GLOBAL
    if (!arg) {
      const list = Array.from(commands.entries())
        .filter(([_, cmd]) => cmd.config?.role <= role)
        .map(([name]) => `➤ ${name}`)
        .join("\n");

      return message.reply(
`${top}
📜 𝐌𝐄𝐍𝐔 𝐃𝐄𝐒 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐄𝐒

🔑 Préfixe : ${prefix}
📊 Total : ${commands.size}

${list}

${bottom}

📌 ${prefix}help <commande>
📌 ${prefix}help -<catégorie>`
      );
    }

    // 📂 FILTRE CATÉGORIE
    if (arg.startsWith("-")) {
      const category = arg.slice(1).toLowerCase();

      const list = Array.from(commands.entries())
        .filter(([_, cmd]) =>
          cmd.config?.category?.toLowerCase() === category &&
          cmd.config.role <= role
        )
        .map(([name]) => `➤ ${name}`);

      if (list.length === 0)
        return message.reply(`❌ Aucune commande trouvée pour "${category}"`);

      return message.reply(
`${top}
📂 𝐂𝐀𝐓𝐄́𝐆𝐎𝐑𝐈𝐄 : ${category.toUpperCase()}

${list.join("\n")}

${bottom}`
      );
    }

    // 🔍 DÉTAIL COMMANDE
    const cmd = commands.get(arg) || commands.get(aliases.get(arg));

    if (!cmd || cmd.config.role > role)
      return message.reply(`❌ Commande "${arg}" introuvable`);

    const info = cmd.config;

    const desc =
      info.longDescription?.fr ||
      info.longDescription?.en ||
      "Aucune description.";

    const guide =
      info.guide?.fr ||
      info.guide?.en ||
      "Aucune utilisation.";

    return message.reply(
`${top}
📌 𝐃𝐄́𝐓𝐀𝐈𝐋𝐒 𝐃𝐄 𝐋𝐀 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐄

➤ Nom : ${info.name}
➤ Description : ${desc}
➤ Utilisation : ${guide
        .replace(/{p}/g, prefix)
        .replace(/{n}/g, info.name)}
➤ Rôle : ${info.role}
➤ Catégorie : ${info.category || "aucune"}

${bottom}`
    );
  }
};
