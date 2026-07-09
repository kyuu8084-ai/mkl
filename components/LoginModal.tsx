import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User as UserIcon, Loader2 } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { compressImage } from '../utils/helpers';

interface LoginModalProps {
  onLogin: (name: string, avatar: string) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      try {
        const base64 = await compressImage(e.target.files[0]);
        setAvatar(base64);
      } catch (error) {
        console.error("Error processing image", error);
        alert("Lỗi xử lý ảnh. Vui lòng chọn ảnh khác.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const base64 = await compressImage(blob);
      setAvatar(base64);
      setIsCameraOpen(false);
    } catch (error) {
      console.error("Error processing camera image", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Use a default avatar if none selected
      const finalAvatar = avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`;
      onLogin(name, finalAvatar);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-sky-200">
        <div className="bg-gradient-to-r from-sky-400 to-indigo-400 p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-header font-bold text-white mb-2">Tham gia StudyWithMe</h2>
          <p className="text-sky-50 text-sm">Đặt tên và chọn ảnh đại diện thật ngầu nhé!</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-sky-100 overflow-hidden bg-gray-50 flex items-center justify-center relative">
                {isProcessing ? (
                  <Loader2 className="animate-spin text-sky-500" size={30} />
                ) : avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-gray-300" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 shadow-md transition-transform hover:scale-110"
                  title="Chụp ảnh"
                >
                  <Camera size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 shadow-md transition-transform hover:scale-110"
                  title="Tải ảnh lên"
                >
                  <Upload size={14} />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tên hiển thị</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Hoa của Nhân"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isProcessing}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-sky-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Đang xử lý ảnh...' : 'Vào Học Ngay'}
          </button>
        </form>
      </div>

      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};