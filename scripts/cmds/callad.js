const { getStreamsFromAttachment } = global.utils;
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

const box = (text) => `
━━━━━━♡♥♡━━━━━━

${text}

━━━━━━♡♥♡━━━━━━
`;

module.exports = {
  config: {
    name: "callad",
    version: "1.8",
    author: "NTKhang + ",
    countDown: 5,
    role: 0,
    category: "system"
  },

  onStart: async function ({ args, message, event, usersData, threadsData, api, commandName }) {

    const { config } = global.GoatBot;

    if (!args[0]) {
      return message.reply(box("❌ Veuillez écrire un message."));
    }

    if (!config?.adminBot?.length) {
      return message.reply(box("❌ Aucun admin disponible."));
    }

    const { senderID, threadID, isGroup } = event;

    const senderName = await usersData.getName(senderID);

    const threadName = isGroup
      ? (await threadsData.get(threadID))?.threadName || "Groupe"
      : "Privé";

    const msg =
`📩 CALL ADMIN

👤 Nom : ${senderName}
🆔 ID  : ${senderID}
💬 Type : ${isGroup ? "Groupe" : "Inbox"}
📌 Chat : ${threadName}

📝 Message :
${args.join(" ")}`;

    let attachments = [];

    try {
      const raw = [
        ...(event.attachments || []),
        ...(event.messageReply?.attachments || [])
      ];

      for (const item of raw) {
        if (mediaTypes.includes(item.type)) {
          const stream = await getStreamsFromAttachment([item]);
          attachments.push(stream);
        }
      }
    } catch {}

    const form = {
      body: box(msg),
      mentions: [{
        id: senderID,
        tag: senderName
      }],
      attachment: attachments
    };

    let success = 0;
    let failed = 0;

    for (const adminID of config.adminBot) {
      try {
        const res = await api.sendMessage(form, adminID);

        success++;

        global.GoatBot.onReply.set(res.messageID, {
          commandName,
          type: "userCallAdmin",
          threadID,
          messageIDSender: event.messageID
        });

      } catch {
        failed++;
      }
    }

    return message.reply(
      box(`📨 MESSAGE ENVOYÉ\n\n✅ Réussi : ${success}\n❌ Échoué : ${failed}`)
    );
  },

  onReply: async function ({ args, event, api, message, Reply, usersData, commandName }) {

    const senderName = await usersData.getName(event.senderID);
    const text = args.join(" ");

    let attachments = [];

    try {
      const raw = event.attachments || [];
      for (const item of raw) {
        if (mediaTypes.includes(item.type)) {
          const stream = await getStreamsFromAttachment([item]);
          attachments.push(stream);
        }
      }
    } catch {}

    switch (Reply.type) {

      case "userCallAdmin": {
        api.sendMessage(
          {
            body: box(`📍 RÉPONSE ADMIN\n\n${text}`),
            attachment: attachments
          },
          Reply.threadID
        );
        break;
      }

      case "adminReply": {
        api.sendMessage(
          {
            body: box(`📝 UTILISATEUR ${senderName}\n\n${text}`),
            attachment: attachments
          },
          Reply.threadID
        );
        break;
      }
    }
  }
};
