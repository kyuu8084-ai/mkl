export enum AttachmentType {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string; // Blob URL
  mimeType: string;
  file?: File | Blob;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: number;
  attachments: Attachment[];
  isAi?: boolean;
  frameId?: string; // Add frame support to comments
}

export type PostTag = 'Q&A' | 'Thảo Luận' | 'Chia Sẻ' | 'Tài Liệu' | 'Góc Chill';

export interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: number;
  attachments: Attachment[];
  likes: number;
  comments: Comment[];
  subject: SubjectId;
  frameId?: string; 
  tags?: PostTag[]; // New Feature: Tags
  isPinned?: boolean; // New Feature: Pin post
  views?: number; // New Feature: View count
  isPending?: boolean;
}

export type SubjectId = 'KHAC' | 'TOAN' | 'LI' | 'HOA' | 'SINH' | 'SU' | 'VAN' | 'ANH' | 'DIA' | 'KTPL' | 'CONGNGHE';

export const SUBJECTS: Record<SubjectId, string> = {
  KHAC: 'Góc Chung',
  TOAN: 'Toán',
  LI: 'Vật Lí',
  HOA: 'Hóa Học',
  SINH: 'Sinh Học',
  SU: 'Lịch Sử',
  VAN: 'Ngữ Văn',
  ANH: 'Tiếng Anh',
  DIA: 'Địa Lí',
  KTPL: 'Kinh Tế - Pháp Luật',
  CONGNGHE: 'Công Nghệ'
};

export const POST_TAGS: PostTag[] = ['Q&A', 'Thảo Luận', 'Chia Sẻ', 'Tài Liệu', 'Góc Chill'];

export interface Frame {
  id: string;
  name: string;
  cssClass: string; // Tailwind/Custom CSS classes for the frame container
}

// CSS-based Frames (No external images)
export const FRAMES: Frame[] = [
  { id: 'f1', name: 'Băng Giá', cssClass: 'frame-ice' },
  { id: 'f2', name: 'Hỏa Long', cssClass: 'frame-fire' },
  { id: 'f3', name: 'Công Nghệ', cssClass: 'frame-tech' },
  { id: 'f4', name: 'Thiên Nhiên', cssClass: 'frame-nature' },
  { id: 'f5', name: 'Hoàng Kim', cssClass: 'frame-gold' },
  { id: 'f6', name: 'Neon Cyber', cssClass: 'frame-neon' },
  { id: 'f7', name: 'Vũ Trụ', cssClass: 'frame-galaxy' },
  { id: 'f8', name: 'Pixel Art', cssClass: 'frame-pixel' },
  { id: 'f9', name: 'Hoa Anh Đào', cssClass: 'frame-sakura' },
  { id: 'f10', name: 'Vương Giả', cssClass: 'frame-royal' },
  { id: 'f11', name: 'Thách Đấu', cssClass: 'frame-conqueror' },
  { id: 'f12', name: 'Chiến Tướng', cssClass: 'frame-grand-conqueror' },
  { id: 'f13', name: 'Cao Thủ', cssClass: 'frame-master' },
  { id: 'f14', name: 'Tinh Anh', cssClass: 'frame-veteran' },
  { id: 'f15', name: 'Kim Cương', cssClass: 'frame-diamond' }
];

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  level?: number;
  xp?: number;
  showcase?: string[]; 
  frameId?: string; // Selected frame ID
}

export interface Notification {
  id: string;
  content: string;
  timestamp: number;
  read: boolean;
}