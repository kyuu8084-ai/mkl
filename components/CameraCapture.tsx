import React, { useRef, useState, useCallback } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
      }
    }
  };

  const confirmPhoto = () => {
    if (photo) {
      // Convert DataURL to Blob
      fetch(photo)
        .then(res => res.blob())
        .then(blob => {
          onCapture(blob);
          onClose();
        });
    }
  };

  const retake = () => {
    setPhoto(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-sky-400">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="p-2 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="relative aspect-[3/4] bg-black">
          {error ? (
            <div className="flex items-center justify-center h-full text-white text-center p-4">
              <p>{error}</p>
            </div>
          ) : !photo ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 flex items-center justify-center gap-8 bg-gray-800">
          {!photo ? (
            <button
              onClick={takePhoto}
              disabled={!!error}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-sky-500 border-2 border-white" />
            </button>
          ) : (
            <>
              <button
                onClick={retake}
                className="flex flex-col items-center text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-1">
                  <RefreshCw size={20} />
                </div>
                <span className="text-xs">Chụp lại</span>
              </button>
              <button
                onClick={confirmPhoto}
                className="flex flex-col items-center text-sky-300 hover:text-sky-100 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-sky-600 flex items-center justify-center mb-1 shadow-lg shadow-sky-900/50">
                  <Check size={32} />
                </div>
                <span className="text-sm font-bold">Dùng ảnh này</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};