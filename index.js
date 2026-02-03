import express from "express";
import multer from "multer";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage()
});

// 🔐 ENV VARIABLES (Render me set honge)
const BOT_TOKEN = process.env.BOT_TOKEN;       // Telegram bot token
const CHANNEL_ID = process.env.CHANNEL_ID;     // @channel or -100xxx
const PORT = process.env.PORT || 3000;

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file" });
    }

    // 1️⃣ Upload video to Telegram
    const tgRes = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`,
      {
        chat_id: CHANNEL_ID,
        video: req.file.buffer
      },
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const file_id = tgRes.data.result.video.file_id;

    // 2️⃣ Get file_path
    const fileRes = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${file_id}`
    );

    const file_path = fileRes.data.result.file_path;

    // 3️⃣ Final MP4 link
    const mp4 = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;

    res.json({
      success: true,
      file_id,
      file_path,
      mp4
    });

  } catch (e) {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
