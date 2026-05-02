const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 📦 MEMORY 7 JOURS
const DB_FILE = path.join(__dirname, "neo_memory.json");
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// ================= DB =================
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8") || "{}");
  } catch {
    return {};
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ================= MEMORY =================
function getMem(id) {
  const db = loadDB();

  if (!db[id]) {
    db[id] = {
      name: null,
      history: [],
      lastSeen: Date.now(),
      mood: "normal"
    };
  }

  if (!Array.isArray(db[id].history)) db[id].history = [];

  return db[id];
}

function setMem(id, data) {
  const db = loadDB();
  db[id] = data;
  saveDB(db);
}

// ================= FRAME =================
function frame(text) {
  return `
┅┅┅┅┅┅༻❁༺┅┅┅┅┅
${text}
┅┅┅┅┅┅༻❁༺┅┅┅┅┅
`;
}

// ================= TIME =================
function getTime() {
  return new Date().toLocaleString("fr-FR", {
    timeZone: "Africa/Kinshasa"
  });
}

// ================= CLEAN (ANTI SHIZU) =================
function clean(text) {
  return (text || "")
    .replace(/shizu/gi, "")
    .replace(/𝗦𝗵𝗶𝘇𝘂/gi, "")
    .replace(/Shizu/gi, "")
    .replace(/\(\s*\d+\s*\/\s*\d+\s*\)/g, "")
    .replace(/\b\d{3,}\b/g, "")
    .replace(/```/g, "")
    .trim();
}

// ================= IMAGE =================
function imagine(prompt) {
  const safe = (prompt || "")
    .replace(/neo/gi, "")
    .replace(/shizu/gi, "")
    .replace(/aryan/gi, "")
    .replace(/const|require|function|module/gi, "")
    .slice(0, 120);

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(safe)}`;
}

// ================= VOICE =================
async function toVoice(text) {
  const url =
    "https://translate.google.com/translate_tts?ie=UTF-8&q=" +
    encodeURIComponent((text || "").slice(0, 200)) +
    "&tl=fr&client=tw-ob";

  try {
    return await axios.get(url, { responseType: "stream" }).then(r => r.data);
  } catch {
    return null;
  }
}

// ================= AI =================
async function askAI(prompt, mem, uid) {
  const fullPrompt = `
Tu es NEO 🤖
Créé uniquement par Célestin Olua 🇨🇩

Heure: ${getTime()}
Utilisateur: ${mem.name || "inconnu"}

Réponds naturellement avec emojis 🌸

Message:
${prompt}
`;

  try {
    const res = await axios.post(
      "https://shizuai.vercel.app/chat",
      {
        uid,
        message: fullPrompt
      },
      { timeout: 15000 }
    );

    let reply =
      res.data?.reply ||
      res.data?.message ||
      "…";

    reply = clean(reply);

    if (reply.toLowerCase().includes("shizu")) {
      reply = reply.replace(/shizu/gi, "");
    }

    return reply;

  } catch {
    return "Je réfléchis doucement... 🌸";
  }
}

// ================= MODULE =================
module.exports = {
  config: {
    name: "neo",
    version: "18.0.0",
    role: 0,
    category: "ai"
  },

  onStart: async function () {},

  onChat: async function ({ api, event, message }) {
    if (!event.body) return;

    const body = event.body.trim();
    const lower = body.toLowerCase();

    if (!lower.startsWith("neo")) return;

    const input = body.slice(3).trim();
    if (!input) return message.reply(frame("Oui ? 😏"));

    const uid = event.senderID;
    let mem = getMem(uid);

    mem.lastSeen = Date.now();

    // 🧠 MEMORY 7 JOURS
    const now = Date.now();
    mem.history.push({ text: input, time: now });
    mem.history = mem.history.filter(h => now - h.time <= SEVEN_DAYS);
    if (mem.history.length > 60) mem.history.shift();

    setMem(uid, mem);

    api.setMessageReaction("🌸", event.messageID, () => {}, true);

    try {

      // 🎨 IMAGE
      if (lower.startsWith("neo imagine ")) {
        const prompt = input.replace(/^imagine\s*/i, "").trim();

        if (!prompt) return message.reply(frame("❌ prompt vide"));

        return message.reply({
          body: frame("🎨 " + prompt),
          attachment: await axios.get(imagine(prompt), {
            responseType: "stream"
          }).then(r => r.data)
        });
      }

      // 🔊 VOICE
      if (lower.startsWith("neo voix ") || lower.startsWith("neo voice ")) {
        const text = input.replace(/^(voix|voice)/i, "").trim();

        const reply = await askAI(text, mem, uid);
        const audio = await toVoice(reply);

        if (!audio) {
          return message.reply(frame(reply + "\n\n❌ voix indisponible"));
        }

        return message.reply({
          body: frame("🔊 NEO vocal"),
          attachment: audio
        });
      }

      // 🤖 TEXT
      const reply = await askAI(input, mem, uid);

      return message.reply(frame(reply));

    } catch {
      return message.reply(frame("❌ erreur mais NEO reste actif 🌸"));
    }
  }
};
