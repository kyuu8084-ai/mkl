import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { postContent, attachments, subject } = req.body;

    if (!process.env.API_KEY) {
      console.warn("Missing API_KEY");
      res.status(200).json({ reply: "Tutor AI đang bảo trì (Thiếu khóa API)." });
      return;
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
        if (att.type === "image" && att.base64Data) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType || "image/jpeg",
              data: att.base64Data,
            },
          });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });

    res.status(200).json({
      reply: response.text || "Hmm, câu này khó quá, để mình suy nghĩ thêm chút nhé!",
    });
  } catch (error: any) {
    console.error("Gemini API Detailed Error:", error);
    if (error && error.message && error.message.includes("429")) {
      res.status(200).json({ reply: "AI đang quá tải do nhiều bạn hỏi quá, vui lòng đợi 1 phút nhé!" });
      return;
    }
    res.status(500).json({ error: "Tutor AI đang nghỉ giải lao, bạn thử lại sau nha!" });
  }
}
