import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Play, Pause, Bot, Eye, Pin, Trash2 } from 'lucide-react';
import { Post, Attachment, AttachmentType, FRAMES, User } from '../types';
import { ComposePost } from './ComposePost';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onReply: (postId: string, content: string, attachments: Attachment[]) => Promise<void>;
  onDelete?: (postId: string) => void;
  currentUser?: User | null;
  uploadProgress?: number;
}

const AudioPlayer = ({ url }: { url: string }) => {
  return (
    <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 w-full flex items-center justify-center">
      <audio src={url} controls className="w-full" />
    </div>
  );
};

const TagBadge = ({ tag }: { tag: string }) => {
  let className = "tag-badge ";
  switch(tag) {
    case 'Q&A': className += "tag-qa"; break;
    case 'Thảo Luận': className += "tag-discuss"; break;
    case 'Chia Sẻ': className += "tag-share"; break;
    case 'Tài Liệu': className += "tag-doc"; break;
    case 'Góc Chill': className += "tag-chill"; break;
    default: className += "tag-discuss";
  }
  return <span className={className}>{tag}</span>;
};

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onReply, onDelete, currentUser, uploadProgress }) => {
  const [showReply, setShowReply] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.isPending) return;
    
    onLike(post.id);
    
    // Create a new floating heart
    const newHeart = { 
      id: Date.now(), 
      x: Math.random() * 40 - 20, 
      y: Math.random() * 10 - 5 
    };
    setFloatingHearts(prev => [...prev, newHeart]);
    
    // Remove it after animation ends
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1000);
  };
  
  // Use current user's avatar if they are the author (syncs profile changes immediately)
  const isAuthor = currentUser && post.author === currentUser.name;
  
  // Logic: Prefer currentUser avatar if author, otherwise post avatar. 
  // IMPORTANT: Ensure we have a valid string, fallback to defaultAvatar is handled by onError, 
  // but we pass `undefined` if empty so we can track it.
  const displayAvatar = isAuthor ? (currentUser.avatar || post.avatar) : post.avatar;
  const displayFrameId = isAuthor ? (currentUser.frameId || undefined) : post.frameId;

  const authorFrame = displayFrameId ? FRAMES.find(f => f.id === displayFrameId) : null;
  // Default avatar (initials) used as fallback
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${post.author}`;

  return (
    <div className={`bg-white dark:bg-gray-800/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 ${post.isPinned ? 'border-yellow-400 shadow-yellow-100 dark:border-yellow-500/50' : 'border-sky-100 dark:border-gray-700'} overflow-hidden mb-6 transition-transform hover:scale-[1.005] duration-300 relative`}>
      
      {/* Upload Progress Bar */}
      {uploadProgress !== undefined && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 z-20">
          <motion.div 
            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />
        </div>
      )}

      {/* Pinned Icon */}
      {post.isPinned && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-bl-xl font-bold text-xs flex items-center gap-1 z-10 shadow-sm">
          <Pin size={12} fill="currentColor" />
          Đã Ghim
        </div>
      )}

      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar Container - Fixed for Alignment */}
          <div className="relative w-12 h-12 shrink-0">
             {/* KEY PROP ADDED: Forces re-render if URL changes, preventing broken image state persistence */}
             <img 
               key={displayAvatar} 
               src={displayAvatar || defaultAvatar} 
               alt={post.author} 
               className="w-full h-full rounded-full bg-gray-100 object-cover border border-gray-100"
               onError={(e) => {
                 e.currentTarget.src = defaultAvatar;
               }}
             />
             {authorFrame && <div className={authorFrame.cssClass}></div>}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight truncate">{post.author}</h3>
              {post.tags?.map(tag => <TagBadge key={tag} tag={tag} />)}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-xs text-sky-500 font-medium">
                 {new Date(post.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
               </span>
               {post.views !== undefined && (
                 <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                   • <Eye size={10} /> {post.views}
                 </span>
               )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4 text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-[15px]">
          {post.content}
        </div>

        {/* Attachments */}
        {post.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.attachments.map(att => (
              <div key={att.id} className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${att.type === AttachmentType.AUDIO ? 'w-full' : ''}`}>
                {att.type === AttachmentType.IMAGE ? (
                  <img 
                    src={att.url} 
                    alt="Attachment" 
                    className="max-h-64 object-cover cursor-zoom-in" 
                    onDoubleClick={() => setZoomedImage(att.url)}
                  />
                ) : att.type === AttachmentType.VIDEO ? (
                  <video src={att.url} controls className="max-h-64 rounded-lg" />
                ) : (
                  <AudioPlayer url={att.url} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
          <div className="relative">
            <button 
              onClick={handleLike}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors group"
            >
              <Heart 
                size={20} 
                className={`transition-transform group-active:scale-125 ${post.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} 
              />
              <span className="font-semibold">{post.likes || ''}</span>
            </button>
            <AnimatePresence>
              {floatingHearts.map(heart => (
                <motion.div
                  key={heart.id}
                  initial={{ opacity: 1, y: heart.y, x: heart.x, scale: 0.5 }}
                  animate={{ opacity: 0, y: -60, x: heart.x + (Math.random() * 20 - 10), scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute left-0 bottom-6 pointer-events-none"
                >
                  <Heart size={24} className="fill-red-500 text-red-500 drop-shadow-md" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-sky-600 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-semibold">Trả lời ({post.comments.length})</span>
          </button>

          {currentUser?.name === post.author && onDelete && (
            <div className="ml-auto relative flex items-center">
              {isConfirmingDelete ? (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-fade-in">
                  <span className="text-xs text-red-600 font-medium">Xóa?</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(post.id);
                      setIsConfirmingDelete(false);
                    }}
                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors"
                  >
                    Có
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsConfirmingDelete(false);
                    }}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsConfirmingDelete(true);
                  }}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                  title="Xóa bài viết"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {(post.comments.length > 0 || showReply) && (
        <div className="bg-sky-50/50 p-4 border-t border-sky-100">
          {post.comments.map(comment => {
            // Check if comment author is current user
            const isCommentAuthor = currentUser && comment.author === currentUser.name;
            const commentAvatar = isCommentAuthor ? (currentUser.avatar || comment.avatar) : comment.avatar;
            const commentFrameId = isCommentAuthor ? (currentUser.frameId || undefined) : comment.frameId;

            const commentFrame = commentFrameId ? FRAMES.find(f => f.id === commentFrameId) : null;
            const cmtDefaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${comment.author}`;
            
            return (
            <div key={comment.id} className={`flex gap-3 mb-4 last:mb-0 ${comment.isAi ? 'bg-indigo-50/80 p-3 rounded-xl border border-indigo-100' : ''}`}>
               {comment.isAi ? (
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                   <Bot size={16} className="text-white" />
                 </div>
               ) : (
                 <div className="relative w-8 h-8 shrink-0">
                    <img 
                      key={commentAvatar}
                      src={commentAvatar || cmtDefaultAvatar} 
                      alt={comment.author} 
                      className="w-full h-full rounded-full bg-white dark:bg-gray-800 object-cover border border-gray-200 dark:border-gray-700" 
                      onError={(e) => e.currentTarget.src = cmtDefaultAvatar}
                    />
                    {commentFrame && <div className={commentFrame.cssClass}></div>}
                 </div>
               )}
               <div className="flex-1 min-w-0">
                 <div className="flex items-baseline gap-2 mb-1">
                   <span className={`font-bold text-sm ${comment.isAi ? 'text-indigo-700 font-pixel' : 'text-gray-800 dark:text-gray-100'}`}>
                     {comment.author}
                   </span>
                   <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {new Date(comment.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                   </span>
                 </div>
                 <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.content}</p>
                 {comment.attachments.map(att => (
                   <div key={att.id} className={`mt-2 ${att.type === AttachmentType.AUDIO ? 'w-full' : ''}`}>
                      {att.type === AttachmentType.IMAGE ? (
                        <img 
                          src={att.url} 
                          alt="Reply Image" 
                          className="h-32 rounded-lg border border-gray-200 dark:border-gray-700 cursor-zoom-in" 
                          onDoubleClick={() => setZoomedImage(att.url)}
                        />
                      ) : att.type === AttachmentType.VIDEO ? (
                        <video src={att.url} controls className="h-32 rounded-lg border border-gray-200 dark:border-gray-700" />
                      ) : (
                        <AudioPlayer url={att.url} />
                      )}
                   </div>
                 ))}
               </div>
            </div>
            );
          })}

          {showReply && (
            <div className="mt-4 animate-fade-in-up">
              <ComposePost 
                placeholder="Viết câu trả lời của bạn..." 
                onSubmit={async (content, atts) => {
                  await onReply(post.id, content, atts);
                  setShowReply(false);
                }} 
                compact
              />
            </div>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-full object-contain select-none" 
          />
        </div>
      )}
    </div>
  );
};