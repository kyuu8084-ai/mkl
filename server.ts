import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: "5000mb" }));
  app.use(express.urlencoded({ limit: "5000mb", extended: true }));

  // API route for generating AI replies
  app.post("/api/generate-reply", async (req, res) => {
    try {
      const { postContent, attachments, subject } = req.body;

      if (!process.env.API_KEY) {
        console.warn("Missing API_KEY");
        return res.json({ reply: "Tutor AI đang bảo trì (Thiếu khóa API)." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const subjectName = subject || "Khác";

      const prompt = `Bạn là một trợ giảng AI nhiệt tình tại diễn đàn 'StudyWithMe'. 
Môn học: ${subjectName}.
Yêu cầu: Trả lời ngắn gọn (dưới 80 từ), đúng trọng tâm, giọng văn thân thiện, khích lệ.
Câu hỏi của học sinh: "${postContent}"`;

      const parts: any[] = [{ text: prompt }];

      if (attachments && Array.isArray(attachments)) {
        for (const att of attachments) {
          if (att.type === 'image' && att.base64Data) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType || 'image/jpeg',
                data: att.base64Data
              }
            });
          }
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: parts },
        config: {
          maxOutputTokens: 200,
          temperature: 0.7
        }
      });

      res.json({ reply: response.text || "Hmm, câu này khó quá, để mình suy nghĩ thêm chút nhé!" });
    } catch (error: any) {
      console.error("Gemini API Detailed Error:", error);
      if (error && error.message && error.message.includes('429')) {
        return res.json({ reply: "AI đang quá tải do nhiều bạn hỏi quá, vui lòng đợi 1 phút nhé!" });
      }
      res.status(500).json({ error: "Tutor AI đang nghỉ giải lao, bạn thử lại sau nha!" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
