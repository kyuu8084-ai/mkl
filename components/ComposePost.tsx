import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Mic, Camera, Send, X, User as UserIcon, Loader2, Tag, Video } from 'lucide-react';
import { Attachment, AttachmentType, PostTag, POST_TAGS } from '../types';
import { CameraCapture } from './CameraCapture';
import { AudioRecorder } from './AudioRecorder';
import { compressImage, blobToBase64 } from '../utils/helpers';
import { getAppStorage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ComposePostProps {
  onSubmit: (content: string, attachments: Attachment[], tags?: PostTag[]) => Promise<void>;
  placeholder?: string;
  compact?: boolean;
  userAvatar?: string;
}

interface PendingAttachment extends Attachment {
  file?: File | Blob;
}

export const ComposePost: React.FC<ComposePostProps> = ({ onSubmit, placeholder = "Bạn đang nghĩ gì?", compact = false, userAvatar }) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [selectedTags, setSelectedTags] = useState<PostTag[]>([]);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<PendingAttachment | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || isProcessing || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Optimistic UI: Pass attachments with 'file' directly to parent.
      // Parent component will render them immediately and upload to cloud in background.
      await onSubmit(content, attachments as Attachment[], selectedTags.length > 0 ? selectedTags : undefined);
      
      // Only clear if successful
      setContent("");
      setAttachments([]);
      setSelectedTags([]);
      setShowTagMenu(false);
    } catch (error) {
      console.error("Submit failed", error);
      alert("Không thể đăng bài. Vui lòng kiểm tra kết nối mạng và thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      
      setAttachments(prev => [...prev, {
        id: Math.random().toString(36),
        type: isVideo ? AttachmentType.VIDEO : AttachmentType.IMAGE,
        url: URL.createObjectURL(file),
        mimeType: file.type,
        file: file
      }]);
      
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    setAttachments(prev => [...prev, {
      id: Math.random().toString(36),
      type: AttachmentType.IMAGE,
      url: URL.createObjectURL(blob),
      mimeType: blob.type || 'image/jpeg',
      file: blob
    }]);
    setIsCameraOpen(false);
  };

  const handleAudioCapture = async (blob: Blob) => {
    setAttachments(prev => [...prev, {
      id: Math.random().toString(36),
      type: AttachmentType.AUDIO,
      url: URL.createObjectURL(blob),
      mimeType: blob.type || 'audio/webm',
      file: blob
    }]);
    setIsRecording(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const toggleTag = (tag: PostTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 2) { // Limit to 2 tags
         setSelectedTags(prev => [...prev, tag]);
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={`${compact ? 'bg-white dark:bg-gray-800 rounded-xl' : 'bg-white dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-sky-200'} p-4 transition-all duration-300`}>
        {!compact && (
          <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 font-pixel text-sky-600 text-lg">Tạo bài viết mới</span>
          </div>
        )}
        
        <div className="flex gap-4">
           {!compact && (
             <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 overflow-hidden hidden md:block shrink-0">
               {userAvatar ? (
                 <img src={userAvatar} alt="User" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
               ) : (
                 <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                   <UserIcon className="text-gray-400 dark:text-gray-500" size={24} />
                 </div>
               )}
             </div>
           )}
           <div className="flex-1 relative">
             <textarea
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder={placeholder}
               className="w-full bg-transparent resize-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 min-h-[60px]"
               rows={compact ? 1 : 3}
               disabled={isSubmitting}
             />

             {/* Selected Tags Display */}
             {selectedTags.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {selectedTags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold bg-sky-100 text-sky-700 px-2 py-1 rounded-full flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => toggleTag(tag)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
             )}
             
             {/* Attachment Previews */}
             {attachments.length > 0 && (
               <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                 {attachments.map(att => (
                   <div key={att.id} className="relative group shrink-0">
                     {att.type === AttachmentType.IMAGE ? (
                       <img src={att.url} alt="Preview" className="h-20 w-20 object-cover cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700" onClick={() => setPreviewAttachment(att)} />
                     ) : att.type === AttachmentType.VIDEO ? (
                       <video src={att.url} className="h-20 w-32 object-cover cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700" muted onClick={() => setPreviewAttachment(att)} />
                     ) : (
                       <div className="h-auto w-64 bg-sky-50 rounded-lg flex flex-col items-center justify-center border border-sky-200 p-2">
                         <audio src={att.url} controls className="w-full" />
                       </div>
                     )}
                     <button
                       type="button"
                       onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeAttachment(att.id); }}
                       className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-100 shadow-md z-50 transition-colors"
                     >
                       <X size={12} />
                     </button>
                   </div>
                 ))}
               </div>
             )}

             {isRecording && (
               <div className="mb-3">
                 <AudioRecorder onRecordingComplete={handleAudioCapture} onCancel={() => setIsRecording(false)} />
               </div>
             )}

             <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/50">
               <div className="flex items-center gap-1">
                 <input 
                   type="file" 
                   accept="image/*,video/*" 
                   ref={fileInputRef} 
                   className="hidden" 
                   onChange={handleFileSelect} 
                 />
                 
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors tooltip"
                   title="Thêm ảnh/video"
                   disabled={isProcessing || isSubmitting}
                 >
                   <ImageIcon size={20} />
                 </button>
                 
                 <button 
                   type="button"
                   onClick={() => setIsCameraOpen(true)}
                   className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
                   title="Chụp ảnh ngay"
                   disabled={isProcessing || isSubmitting}
                 >
                   <Camera size={20} />
                 </button>

                 <button 
                   type="button"
                   onClick={() => setIsRecording(!isRecording)}
                   className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-50' : 'text-sky-500 hover:bg-sky-50'}`}
                   title="Ghi âm giọng nói"
                   disabled={isProcessing || isSubmitting}
                 >
                   <Mic size={20} />
                 </button>

                 <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setShowTagMenu(!showTagMenu)}
                      className={`p-2 rounded-full transition-colors ${showTagMenu || selectedTags.length > 0 ? 'text-indigo-500 bg-indigo-50' : 'text-sky-500 hover:bg-sky-50'}`}
                      title="Gắn thẻ chủ đề"
                      disabled={isProcessing || isSubmitting}
                    >
                      <Tag size={20} />
                    </button>
                    
                    {showTagMenu && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-sky-100 p-2 min-w-[150px] z-20 flex flex-col gap-1 animate-fade-in-up">
                         {POST_TAGS.map(tag => (
                           <button
                             key={tag}
                             type="button"
                             onClick={() => toggleTag(tag)}
                             className={`text-left px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedTags.includes(tag) ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300'}`}
                           >
                             {tag} {selectedTags.includes(tag) && '✓'}
                           </button>
                         ))}
                      </div>
                    )}
                 </div>
               </div>

               <button
                 type="submit"
                 disabled={(!content.trim() && attachments.length === 0) || isProcessing || isSubmitting}
                 className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-sky-200 transition-all disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5"
               >
                 {(isProcessing || isSubmitting) && <Loader2 className="animate-spin" size={16} />}
                 <span className="hidden md:inline">{isSubmitting ? 'Đang gửi...' : 'Đăng'}</span>
                 {!isProcessing && !isSubmitting && <Send size={18} />}
               </button>
             </div>
           </div>
        </div>
      </form>

      {isCameraOpen && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      {/* Full Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button 
              onClick={() => setPreviewAttachment(null)}
              className="absolute -top-12 right-0 bg-white dark:bg-gray-800/20 hover:bg-white dark:bg-gray-800/40 text-white rounded-full p-2 backdrop-blur-md transition-colors"
            >
              <X size={24} />
            </button>
            {previewAttachment.type === AttachmentType.IMAGE && (
              <img src={previewAttachment.url} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            )}
            {previewAttachment.type === AttachmentType.VIDEO && (
              <video src={previewAttachment.url} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" controls autoPlay />
            )}
          </div>
        </div>
      )}
    </>
  );
};