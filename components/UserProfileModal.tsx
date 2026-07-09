import React, { useState, useRef } from 'react';
import { X, Edit2, Award, Book, Star, Crown, Zap, Flame, Trophy, PlusCircle, Camera, Image as ImageIcon, Loader2, Layout, Medal, Upload, Trash2 } from 'lucide-react';
import { User, FRAMES } from '../types';
import { compressImage } from '../utils/helpers';
import { getAppStorage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UserProfileModalProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onClose: () => void;
}

const LEVEL_THRESHOLDS = [0, 300, 500, 1000, 2000, 4000, 7000, 10000];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onUpdateUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'showcase'>('badges');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user.bio || '');
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const currentLevel = user.level || 1;
  const currentXP = user.xp || 0;
  
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || 10000;
  const prevLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const progressPercent = Math.min(100, Math.max(0, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  const handleSaveBio = () => {
    onUpdateUser({ bio: bioInput });
    setIsEditingBio(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const compressedB64 = await compressImage(file);
        const compressedFile = await (await fetch(compressedB64)).blob();
        const appStorage = getAppStorage();
        if (appStorage) {
          const storageRef = ref(appStorage, `avatars/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, compressedFile);
          const downloadURL = await getDownloadURL(storageRef);
          onUpdateUser({ avatar: downloadURL });
        } else {
          onUpdateUser({ avatar: compressedB64 });
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi tải ảnh. Vui lòng thử lại.");
      } finally {
        setIsUploading(false);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
      }
    }
  };

  const handleShowcaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        let urlToSave = "";
        
        const compressedB64 = await compressImage(file);
        
        const appStorage = getAppStorage();
        if (appStorage) {
          const compressedFile = await (await fetch(compressedB64)).blob();
          const storageRef = ref(appStorage, `showcase/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, compressedFile);
          urlToSave = await getDownloadURL(storageRef);
        } else {
          urlToSave = compressedB64;
        }
        
        const currentShowcase = user.showcase || [];
        if (currentShowcase.length < 4) {
          onUpdateUser({ showcase: [...currentShowcase, urlToSave] });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
        if (showcaseInputRef.current) showcaseInputRef.current.value = '';
      }
    }
  };

  const handleFlexBadge = () => {
    const badgeImage = `https://api.dicebear.com/7.x/initials/svg?seed=${user.level}&backgroundColor=ffdfbf&scale=75&chars=L${user.level}`;
    const currentShowcase = user.showcase || [];
    if (currentShowcase.length < 4) {
       onUpdateUser({ showcase: [...currentShowcase, badgeImage] });
       setActiveTab('showcase'); // Switch to showcase tab to see the result
    }
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1: return { name: "Mầm Non Tri Thức", color: "text-sky-600", bg: "bg-sky-100", border: "border-sky-200", icon: Book, effect: "" };
      case 2: return { name: "Chồi Non Hiếu Học", color: "text-green-600", bg: "bg-green-100", border: "border-green-200", icon: Star, effect: "" };
      case 3: return { name: "Cây Xanh Vững Chãi", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200", icon: Award, effect: "badge-level-3" };
      case 4: return { name: "Đại Thụ Thông Thái", color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-200", icon: Zap, effect: "badge-level-3" };
      case 5: return { name: "Học Giả Uyên Bác", color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200", icon: Crown, effect: "badge-level-5" };
      case 6: return { name: "Hiền Triết Lỗi Lạc", color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200", icon: Flame, effect: "badge-level-6" };
      case 7: return { name: "Thần Đồng Đất Việt", color: "text-red-600", bg: "bg-red-100", border: "border-red-200", icon: Trophy, effect: "badge-level-7" };
      default: return { name: "Siêu Phàm Nhập Thánh", color: "text-red-600", bg: "bg-red-100", border: "border-red-200", icon: Trophy, effect: "badge-level-7" };
    }
  };

  const lvlInfo = getLevelInfo(currentLevel);
  const Icon = lvlInfo.icon;
  const currentFrame = FRAMES.find(f => f.id === user.frameId);
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FDFBF7] rounded-3xl shadow-2xl flex flex-col border-4 border-[#E5E0D0] overflow-hidden my-4 md:my-0 h-auto max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-gray-400 dark:text-gray-500 hover:text-red-500 bg-white dark:bg-gray-800/50 hover:bg-white dark:bg-gray-800 p-2 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* --- HEADER SECTION: Avatar, Name, Bio --- */}
        <div className="relative bg-gradient-to-b from-[#F3F0E6] to-[#FDFBF7] pt-8 pb-2 px-6 flex flex-col items-center text-center border-b border-[#EBE5D5] shrink-0">
             
             {/* ID Badge */}
             <div className="absolute top-4 left-6 text-[#9CA3AF] font-pixel text-[10px] tracking-widest opacity-60">
                ID: {user.id.slice(0, 8).toUpperCase()}
             </div>

             {/* Avatar Circle */}
             <div className="relative group mb-3">
                <div 
                  className="relative w-28 h-28 rounded-full border-4 border-white shadow-xl cursor-pointer z-10 bg-white dark:bg-gray-800" 
                  onClick={() => avatarInputRef.current?.click()}
                >
                   {isUploading ? (
                     <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-50">
                       <Loader2 className="animate-spin text-sky-500" />
                     </div>
                   ) : (
                     <div className="relative w-full h-full rounded-full overflow-hidden">
                       <img 
                         src={user.avatar || defaultAvatar} 
                         alt="Avatar" 
                         className="w-full h-full object-cover" 
                         onError={(e) => e.currentTarget.src = defaultAvatar}
                       />
                       <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white drop-shadow-md" size={24} />
                       </div>
                     </div>
                   )}
                   {currentFrame && <div className={currentFrame.cssClass}></div>}
                </div>

                {/* Level Badge Pill */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-800 text-[#FCD34D] font-black text-[10px] px-3 py-1 rounded-full border-2 border-white shadow-lg z-20 flex items-center gap-1 min-w-max">
                    <span>LVL {currentLevel}</span>
                </div>

                {/* Upload Button (NEW) - Explicit visual cue */}
                <button 
                   onClick={() => avatarInputRef.current?.click()}
                   className="absolute bottom-0 -left-2 bg-white dark:bg-gray-800 text-indigo-500 p-1.5 rounded-full shadow-md border border-gray-100 hover:scale-110 transition-transform z-30 flex items-center justify-center"
                   title="Tải ảnh từ thư viện"
                >
                   <Upload size={14} />
                </button>

                {/* Frame Edit Button */}
                <button 
                  onClick={() => setShowFrameSelector(!showFrameSelector)}
                  className="absolute bottom-0 -right-2 bg-white dark:bg-gray-800 text-sky-600 p-1.5 rounded-full shadow-md border border-gray-100 hover:scale-110 transition-transform z-30"
                  title="Đổi khung"
                >
                  <ImageIcon size={14} />
                </button>

                {/* Frame Selector Popup */}
                {showFrameSelector && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-sky-100 p-3 w-64 grid grid-cols-4 gap-2 animate-fade-in-up">
                    <div 
                      className={`aspect-square rounded-lg border cursor-pointer flex items-center justify-center ${!user.frameId ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}
                      onClick={() => { onUpdateUser({ frameId: undefined }); setShowFrameSelector(false); }}
                      title="Mặc định"
                    >
                       <X size={12} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    {FRAMES.map(frame => (
                       <div 
                          key={frame.id}
                          className={`relative aspect-square rounded-lg border cursor-pointer overflow-hidden ${user.frameId === frame.id ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}
                          onClick={() => { onUpdateUser({ frameId: frame.id }); setShowFrameSelector(false); }}
                          title={frame.name}
                       >
                          <div className={frame.cssClass} style={{ transform: 'scale(0.8)' }}></div>
                       </div>
                    ))}
                  </div>
                )}
                
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
             </div>

             {/* Name & Rank */}
             <div className="mt-4 text-center">
                 <h2 className="text-2xl md:text-3xl font-bungee text-[#374151] leading-tight mb-1">{user.name}</h2>
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white dark:bg-gray-800 border ${lvlInfo.color} ${lvlInfo.border}`}>
                    <Icon size={12} />
                    {lvlInfo.name}
                 </div>
             </div>

             {/* XP Bar */}
             <div className="w-full max-w-xs mt-4 mb-1">
                <div className="h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden relative shadow-inner">
                   <div className={`h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                   <span>{currentXP} XP</span>
                   <span>Next: {nextLevelXP} XP</span>
                </div>
             </div>

             {/* Bio */}
             <div className="mt-3 mb-2 w-full max-w-md min-h-[40px] flex justify-center relative group">
               {isEditingBio ? (
                 <div className="flex items-center gap-2 w-full animate-fade-in">
                    <input 
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-sky-300 outline-none focus:ring-2 focus:ring-sky-100"
                      placeholder="Viết gì đó..."
                      maxLength={60}
                      autoFocus
                    />
                    <button onClick={handleSaveBio} className="text-green-600 bg-green-50 p-1.5 rounded-lg hover:bg-green-100"><X className="rotate-45" size={16} /></button>
                 </div>
               ) : (
                 <div className="text-center px-6 relative">
                    <p className="text-[#6B7584] text-sm italic">
                      {user.bio ? `"${user.bio}"` : <span className="text-gray-300 not-italic">Chưa có chữ ký</span>}
                    </p>
                    <button 
                      onClick={() => { setBioInput(user.bio || ''); setIsEditingBio(true); }}
                      className="absolute -right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 md:text-gray-300 hover:text-sky-500 p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 size={12} />
                    </button>
                 </div>
               )}
             </div>
        </div>

        {/* --- TABS NAVIGATION --- */}
        <div className="flex border-b border-[#EBE5D5] bg-white dark:bg-gray-800 sticky top-0 z-10">
            <button 
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                ${activeTab === 'badges' ? 'text-sky-600 bg-[#F8FAFC]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-[#F9FAFB]'}`}
            >
               <Medal size={16} />
               Thành Tựu
               {activeTab === 'badges' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('showcase')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                ${activeTab === 'showcase' ? 'text-indigo-600 bg-[#F8FAFC]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-[#F9FAFB]'}`}
            >
               <Layout size={16} />
               Bộ Sưu Tập
               {activeTab === 'showcase' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
            </button>
        </div>

        {/* --- TAB CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 md:p-6 custom-scrollbar">
            {activeTab === 'badges' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {/* Main Rank Badge */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#F3F4F6] ${lvlInfo.bg} ${lvlInfo.color}`}>
                           <Icon size={28} />
                        </div>
                        <div className="flex-1">
                           <h4 className={`font-bold text-sm ${lvlInfo.color} uppercase`}>Danh Hiệu Hiện Tại</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">{lvlInfo.name}</p>
                        </div>
                        <button 
                          onClick={handleFlexBadge}
                          className="md:opacity-0 md:group-hover:opacity-100 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm hover:scale-105 transition-all"
                        >
                           Khoe
                        </button>
                    </div>

                    {/* Static Badge Example */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 opacity-80">
                         <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 dark:text-gray-500 border-4 border-[#F3F4F6]">
                            <Star size={28} />
                         </div>
                         <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-600 uppercase">Chuyên Cần</h4>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tích cực tham gia thảo luận</p>
                         </div>
                    </div>
                    
                    {/* Placeholder for future badges */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
                        <span className="text-xs font-medium">Sắp ra mắt...</span>
                    </div>
                </div>
            )}

            {activeTab === 'showcase' && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                           Góc Học Tập ({user.showcase?.length || 0}/4)
                        </span>
                        <div className="h-px bg-gray-200 flex-1 ml-4"></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Render Items */}
                        {user.showcase?.map((img, idx) => (
                           <div key={idx} className="aspect-[3/4] bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative group overflow-hidden">
                              <img src={img} alt="Showcase" className="w-full h-full object-cover rounded-lg" onError={(e) => {
                                // If image fails to load, maybe show a placeholder or hide it, but we still need the delete button
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3Cline x1='3' y1='3' x2='21' y2='21' stroke='%23ff0000'%3E%3C/line%3E%3C/svg%3E";
                              }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newShowcase = [...(user.showcase || [])];
                                      newShowcase.splice(idx, 1);
                                      onUpdateUser({ showcase: newShowcase });
                                    }}
                                    className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all active:scale-95"
                                    title="Xóa ảnh này"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                              </div>
                           </div>
                        ))}

                        {/* Upload Slot */}
                        {(!user.showcase || user.showcase.length < 4) && (
                           <div 
                              className="aspect-[3/4] bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors group"
                              onClick={() => !isUploading && showcaseInputRef.current?.click()}
                           >
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                 {isUploading ? <Loader2 className="animate-spin text-indigo-500" size={20} /> : <PlusCircle className="text-indigo-500" size={24} />}
                              </div>
                              <span className="text-[10px] font-bold text-indigo-400 uppercase">Thêm Ảnh</span>
                           </div>
                        )}
                        <input type="file" ref={showcaseInputRef} className="hidden" accept="image/*" onChange={handleShowcaseUpload} disabled={isUploading} />
                    </div>
                </div>
            )}
        </div>
        
      </div>
    </div>
  );
};