// ===============================
// IMPORTS
// ===============================

// Express = server banane ke liye
import express from "express";

// Multer = file upload handle karne ke liye (memory me)
import multer from "multer";

// Axios = Telegram API calls ke liye
import axios from "axios";

// CORS = frontend se request allow karne ke liye
import cors from "cors";

// dotenv = .env file se env variables load karne ke liye
import dotenv from "dotenv";

// Path helpers frontend serve karne ke liye
import path from "path";
import { fileURLToPath } from "url";

// ===============================
// ENV & DIR SETUP
// ===============================

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// APP INITIALIZATION
// ===============================

const app = express();
app.use(cors()); // frontend se request allow
app.use(express.json()); // JSON requests handle

// ===============================
// FRONTEND STATIC FILES SERVE
// ===============================

// Public folder me frontend files (index.html, script.js) rakhe hain
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// MULTER MEMORY STORAGE
// ===============================

// Upload hone wali files RAM me store hongi, disk pe nahi
const upload = multer({
  storage: multer.memoryStorage()
});

// ===============================
// ENV VARIABLES (Render me set karna hai)
// ===============================

const BOT_TOKEN = process.env.BOT_TOKEN;   // Telegram bot token
const CHANNEL_ID = process.env.CHANNEL_ID; // @channelname ya -100xxxxxxxx
const PORT = process.env.PORT || 3000;     // Render automatically PORT set karta hai

// ===============================
// UPLOAD API
// ===============================

/*
  POST /upload
  - FormData key: "video"
  - Flow:
    1️⃣ Video Telegram channel me upload
    2️⃣ file_id nikalo
    3️⃣ getFile call → file_path
    4️⃣ MP4 link generate → frontend ko return
*/

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    // -------------------------------
    // CHECK: File exist karta hai ya nahi
    // -------------------------------
    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    // -------------------------------
    // 1️⃣ SEND VIDEO TO TELEGRAM
    // -------------------------------

    const tgRes = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`,
      {
        chat_id: CHANNEL_ID,
        video: req.file.buffer
      },
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    // Telegram response se file_id nikalo
    const file_id = tgRes.data.result.video.file_id;

    // -------------------------------
    // 2️⃣ GET FILE PATH USING getFile API
    // -------------------------------

    const fileRes = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${file_id}`
    );

    const file_path = fileRes.data.result.file_path;

    // -------------------------------
    // 3️⃣ FINAL MP4 LINK
    // -------------------------------

    const mp4_link = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;

    // -------------------------------
    // 4️⃣ SEND RESPONSE BACK TO FRONTEND
    // -------------------------------

    res.json({
      success: true,
      file_id: file_id,
      file_path: file_path,
      mp4: mp4_link
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
