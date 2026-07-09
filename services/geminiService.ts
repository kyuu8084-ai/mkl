import { Attachment, AttachmentType, SubjectId, SUBJECTS } from '../types';

const getBase64 = async (url: string): Promise<string> => {
  // If it's already a base64 string (data:image...), return the data part
  if (url.startsWith('data:')) {
    const parts = url.split(',');
    return parts.length > 1 ? parts[1] : "";
  }
  // If it's a blob url
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (base64String) {
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        } else {
            resolve("");
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error converting image for AI:", e);
    return "";
  }
};

export const generateAiReply = async (postContent: string, attachments: Attachment[], subject: SubjectId): Promise<string> => {
  try {
    const subjectName = SUBJECTS[subject];
    
    // Process attachments to base64 before sending
    const processedAttachments = await Promise.all(
      attachments.map(async (att) => {
        if (att.type === AttachmentType.IMAGE && att.url) {
          const base64Data = await getBase64(att.url);
          return {
            type: 'image',
            mimeType: att.mimeType,
            base64Data
          };
        }
        return null;
      })
    );
    
    const validAttachments = processedAttachments.filter(Boolean);

    const response = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postContent,
        attachments: validAttachments,
        subject: subjectName
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    if (data.reply) {
        return data.reply;
    }
    return "Tutor AI đang nghỉ giải lao, bạn thử lại sau nha!";
  } catch (error) {
    console.error("Error generating reply:", error);
    return "Tutor AI đang nghỉ giải lao, bạn thử lại sau nha!";
  }
};