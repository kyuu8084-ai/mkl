import React, { useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { CloudBackground } from './components/CloudBackground';
import { OceanBackground } from './components/OceanBackground';
import { CityBackground } from './components/CityBackground';
import { ComposePost } from './components/ComposePost';
import { PostCard } from './components/PostCard';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { Post, Attachment, AttachmentType,  SubjectId, SUBJECTS, User, Notification, FRAMES, PostTag } from './types';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, arrayUnion, increment, query, orderBy, isConfigured as isFirebaseReady, getAppStorage } from './services/firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { compressImageFile } from './utils/helpers';
import { 
  BookOpen, LogIn, ChevronLeft, ChevronRight, Trophy, Sparkles, 
  Search, Bell, Filter, Flame, Clock, Cloud, Wifi, WifiOff,
  TrendingUp, Users, MessageSquare, Moon, Sun
} from 'lucide-react';

const POSTS_PER_PAGE = 10;
const LEVEL_THRESHOLDS = [0, 300, 500, 1000, 2000, 4000, 7000, 10000];
const STORAGE_KEY_USER = 'swm_user_data_v2';
const STORAGE_KEY_POSTS = 'swm_posts_data_v2';

// Background Types
type BackgroundType = 'CLOUD' | 'OCEAN' | 'CITY';

// Sample initial data distributed across subjects
const INITIAL_POSTS: Post[] = [
  {
    id: '3',
    subject: 'KHAC',
    author: 'Admin',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    content: 'Chào mừng đến với StudyWithMe! Hãy chọn môn học ở trên để bắt đầu thảo luận nhé ☁️\n\nQuy định: Tôn trọng nhau, không spam.',
    timestamp: Date.now() - 86400000,
    likes: 999,
    attachments: [],
    comments: [],
    frameId: 'f5',
    isPinned: true,
    tags: ['Thảo Luận', 'Q&A'],
    views: 1205
  },
  {
    id: '1',
    subject: 'TOAN',
    author: 'Minh Toán',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Minh',
    content: 'Có ai biết cách giải bài tích phân này nhanh không ạ? Mình đang bí quá 🤔',
    timestamp: Date.now() - 3600000,
    likes: 5,
    attachments: [],
    comments: [],
    frameId: 'f1',
    tags: ['Q&A'],
    views: 45
  },
  {
    id: '2',
    subject: 'ANH',
    author: 'Sarah English',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah',
    content: 'Mọi người chia sẻ tips học từ vựng IELTS hiệu quả với ạ!',
    timestamp: Date.now() - 7200000,
    likes: 12,
    attachments: [],
    comments: [],
    frameId: 'f4',
    tags: ['Chia Sẻ'],
    views: 89
  }
];

const App: React.FC = () => {
  const [activeSubject, setActiveSubject] = useState<SubjectId>('KHAC');
  
  // State for posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [uploadProgresses, setUploadProgresses] = useState<Record<string, number>>({});

  // Load user from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error loading user from storage", e);
      return null;
    }
  });

  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevelData, setNewLevelData] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);
  
  // Background State
  const [currentBg, setCurrentBg] = useState<BackgroundType>('CLOUD');
  
  // New Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', content: 'Chào mừng bạn đến với diễn đàn!', timestamp: Date.now(), read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuScrollRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // --- DATA SYNCING LOGIC ---
  useEffect(() => {
    if (isFirebaseReady && db) {
      // ONLINE MODE: Subscribe to Firestore
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      console.log("Subscribing to Firestore posts...");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cloudPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          // Safe mapping ensuring all required Post fields exist
          return {
            id: doc.id,
            subject: data.subject || 'KHAC',
            author: data.author || 'Anonymous',
            avatar: data.avatar || '',
            content: data.content || '',
            timestamp: data.timestamp || Date.now(),
            likes: data.likes || 0,
            attachments: data.attachments || [],
            comments: data.comments || [],
            frameId: data.frameId || undefined,
            isPinned: data.isPinned || false,
            tags: data.tags || [],
            views: data.views || 0
          } as Post;
        });
        setPosts(cloudPosts);
      }, (error) => {
        console.error("Error reading from Firebase:", error);
      });
      return () => unsubscribe();
    } else {
      // OFFLINE MODE: Load from localStorage
      try {
        const savedPosts = localStorage.getItem(STORAGE_KEY_POSTS);
        if (savedPosts) {
          setPosts(JSON.parse(savedPosts));
        } else {
          setPosts(INITIAL_POSTS);
        }
      } catch (e) {
        setPosts(INITIAL_POSTS);
      }
    }
  }, []);

  // Save to localStorage only in Offline Mode
  useEffect(() => {
    if (!isFirebaseReady) {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    }
  }, [posts]);

  // Background Rotation Logic
  useEffect(() => {
    const backgrounds: BackgroundType[] = ['CLOUD', 'OCEAN', 'CITY'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % backgrounds.length;
      setCurrentBg(backgrounds[index]);
    }, 60000); // Switch every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and Sort logic
  const filteredPosts = posts
    .filter(post => post.subject === activeSubject)
    .filter(post => 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Pinned posts always first
      if (a.isPinned !== b.isPinned) {
        return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      }
      if (sortBy === 'popular') {
        return b.likes - a.likes; // Sort by likes desc
      }
      return b.timestamp - a.timestamp; // Sort by time desc
    });
  
  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const displayedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  // Reset page when subject or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubject, searchQuery, sortBy]);

  const handleScrollMenu = (direction: 'left' | 'right') => {
    if (menuScrollRef.current) {
      const scrollAmount = 200;
      menuScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const calculateLevel = (xp: number) => {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      }
    }
    return Math.min(level, 7);
  };

  // Helper to save user reliably
  const saveUserToStorage = (user: User) => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {
      console.error("Storage full or error:", e);
      alert("Cảnh báo: Bộ nhớ trình duyệt đã đầy. Ảnh đại diện có thể không được lưu. Hãy thử ảnh nhỏ hơn hoặc xóa bớt dữ liệu duyệt web.");
    }
  };

  const handleGainXP = (amount: number) => {
    if (!currentUser) return;
    const newXP = (currentUser.xp || 0) + amount;
    const oldLevel = currentUser.level || 1;
    const newLevel = calculateLevel(newXP);
    
    // Create updated user object
    const updatedUser = { ...currentUser, xp: newXP, level: newLevel };
    setCurrentUser(updatedUser);
    saveUserToStorage(updatedUser);

    if (newLevel > oldLevel) {
      setNewLevelData(newLevel);
      setShowLevelUp(true);
      setNotifications(prev => [{
        id: Date.now().toString(),
        content: `Chúc mừng! Bạn đã đạt cấp độ ${newLevel}!`,
        timestamp: Date.now(),
        read: false
      }, ...prev]);
    }
  };

  const handleLogin = (name: string, avatar: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      avatar,
      level: 1,
      xp: 0,
      bio: 'Tân thủ StudyWithMe',
      showcase: []
    };
    setCurrentUser(newUser);
    saveUserToStorage(newUser);
    setShowLogin(false);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const processAttachments = async (attachments: Attachment[], onProgress?: (progress: number) => void): Promise<Attachment[]> => {
    const storage = getAppStorage();
    if (!storage) return attachments.map(att => ({ ...att, file: undefined }));

    let totalBytes = 0;
    let transferredBytes = 0;
    const filesToUpload = attachments.filter(a => a.file);
    const numFiles = filesToUpload.length;
    let compressProgress = 0;

    return await Promise.all(attachments.map(async (att) => {
      if (!att.file) return att;
      
      let finalFile: Blob | File = att.file;
      if (att.type === AttachmentType.IMAGE) {
        finalFile = await compressImageFile(att.file);
        compressProgress += (10 / numFiles); // Assign 10% progress to compression
        if (onProgress) onProgress(compressProgress);
      }
      
      try {
        const storageRef = ref(storage, `attachments/${Date.now()}_${att.id}`);
        const uploadTask = uploadBytesResumable(storageRef, finalFile);
        
        return await new Promise<Attachment>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * (90 / numFiles);
              if (onProgress) onProgress(compressProgress + progress);
            },
            (error) => {
              console.error("Failed to upload attachment", error);
              resolve({ ...att, file: undefined }); // Fallback
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({
                  id: att.id,
                  type: att.type,
                  url,
                  mimeType: att.mimeType,
                });
              } catch (err) {
                resolve({ ...att, file: undefined });
              }
            }
          );
        });
      } catch (err) {
        console.error("Failed to upload attachment", err);
        return { ...att, file: undefined }; // Fallback to local URL if upload fails
      }
    }));
  };

  const handleNewPost = async (content: string, attachments: Attachment[], tags?: PostTag[]) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    const newPostData = {
      subject: activeSubject,
      author: currentUser.name,
      avatar: currentUser.avatar,
      content,
      timestamp: Date.now(),
      likes: 0,
      attachments: attachments.map(a => ({...a, file: undefined})), // Use local URLs for optimistic UI
      comments: [],
      frameId: currentUser.frameId || null,
      isPinned: false,
      tags: tags || [],
      views: 0
    };

    const newPost: Post = { ...newPostData, id: tempId, frameId: newPostData.frameId || undefined, isPending: true };
    setPosts(prev => [newPost, ...prev]);
    setCurrentPage(1);
    handleGainXP(50);

    // Background processing
    if (isFirebaseReady && db) {
      if (attachments.some(a => a.file)) {
        setUploadProgresses(prev => ({ ...prev, [tempId]: 0 }));
      }
      
      (async () => {
        try {
          const finalAttachments = await processAttachments(attachments, (progress) => {
             setUploadProgresses(prev => ({ ...prev, [tempId]: progress }));
          });
          const finalPostData = { ...newPostData, attachments: finalAttachments };
          await addDoc(collection(db, "posts"), finalPostData);
          setUploadProgresses(prev => {
            const next = { ...prev };
            delete next[tempId];
            return next;
          });
        } catch (e) {
          console.error("Error in background post creation: ", e);
          setUploadProgresses(prev => {
            const next = { ...prev };
            delete next[tempId];
            return next;
          });
        }
      })();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    
    const targetPost = posts.find(p => p.id === postId);
    if (targetPost?.isPending) return;
    
    // Optimistic UI update
    setPosts(prev => prev.filter(post => post.id !== postId));

    if (isFirebaseReady && db) {
      try {
        await deleteDoc(doc(db, "posts", postId));
      } catch (e) {
        console.error("Error deleting post: ", e);
      }
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    
    const targetPost = posts.find(p => p.id === postId);
    if (targetPost?.isPending) return;

    if (isFirebaseReady && db) {
      try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
          likes: increment(1)
        });
      } catch (e) {
        console.error("Error updating likes: ", e);
      }
    } else {
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 } 
          : post
      ));
    }
  };

  const handleReply = async (postId: string, content: string, attachments: Attachment[]) => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    
    const targetPost = posts.find(p => p.id === postId);
    if (targetPost?.isPending) return;

    const commentId = Date.now().toString();
    const newComment = {
      id: commentId,
      author: currentUser.name,
      avatar: currentUser.avatar,
      content,
      timestamp: Date.now(),
      attachments: attachments.map(a => ({...a, file: undefined})),
      frameId: currentUser.frameId || null
    };

    // Optimistic UI update
    const localComment = { ...newComment, frameId: newComment.frameId || undefined };
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, localComment], views: (post.views || 0) + 1 };
      }
      return post;
    }));
    
    handleGainXP(50);

    if (isFirebaseReady && db) {
      (async () => {
         try {
           const finalAttachments = await processAttachments(attachments);
           const finalComment = { ...newComment, attachments: finalAttachments };
           
           const postRef = doc(db, "posts", postId);
           await updateDoc(postRef, {
             comments: arrayUnion(finalComment),
             views: increment(1)
           });
         } catch (e) {
           console.error("Error adding reply in background: ", e);
         }
      })();
    }
  };

  const getLevelTitle = (level: number) => {
    switch(level) {
      case 1: return "Mầm Non Tri Thức";
      case 2: return "Chồi Non Hiếu Học";
      case 3: return "Cây Xanh Vững Chãi";
      case 4: return "Đại Thụ Thông Thái";
      case 5: return "Học Giả Uyên Bác";
      case 6: return "Hiền Triết Lỗi Lạc";
      case 7: return "Thần Đồng Đất Việt";
      default: return "";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const currentFrame = currentUser?.frameId ? FRAMES.find(f => f.id === currentUser.frameId) : null;
  const defaultAvatar = currentUser ? `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}` : '';

  return (
    <div className="min-h-screen relative font-sans text-gray-800 dark:text-gray-100 dark:text-gray-100 overflow-x-hidden bg-transparent transition-colors duration-1000">
      
      {/* Dynamic Backgrounds */}
      {currentBg === 'CLOUD' && <CloudBackground />}
      {currentBg === 'OCEAN' && <OceanBackground />}
      {currentBg === 'CITY' && <CityBackground />}
      
      {/* Dark Mode Overlay */}
      <div className="fixed inset-0 bg-gray-900/80 dark:opacity-100 opacity-0 pointer-events-none transition-opacity duration-500 z-0" />
      
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-sky-100 dark:border-gray-800 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-2 text-sky-600 shrink-0">
              <div className="bg-gradient-to-br from-sky-400 to-indigo-500 p-2 rounded-lg text-white shadow-lg hidden sm:block">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bungee tracking-wide leading-none bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 drop-shadow-sm">
                  StudyWithMe
                </h1>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] text-sky-800/60 font-medium uppercase tracking-widest hidden sm:block">Diễn đàn học tập</span>
                   {isFirebaseReady ? (
                     <div className="flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-green-700 border border-green-200" title="Đã kết nối dữ liệu Online">
                       <Wifi size={10} />
                       ONLINE
                     </div>
                   ) : (
                     <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700" title="Chế độ Offline (Chỉ lưu trên máy này)">
                       <WifiOff size={10} />
                       OFFLINE
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm câu hỏi, bài viết..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white dark:bg-gray-800 transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-sky-400 group-focus-within:text-sky-600" size={16} />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800 rounded-full transition-colors"
                title="Đổi giao diện"
              >
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>
              
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-sky-600 hover:bg-sky-100 rounded-full transition-colors relative"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-sky-100 overflow-hidden animate-fade-in-up">
                    <div className="p-3 border-b border-gray-100 bg-sky-50 font-bold text-sky-800 text-sm">
                      Thông báo
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div key={notif.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-sky-50/50' : ''}`}>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{notif.content}</p>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">Không có thông báo mới</div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({...n, read: true})));
                          setShowNotifications(false);
                        }}
                        className="w-full py-2 text-center text-xs font-bold text-sky-600 hover:bg-sky-50"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                )}
              </div>

              {currentUser ? (
                <button 
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 bg-sky-50 px-2 py-1 pr-4 rounded-full border-2 border-sky-100 hover:border-sky-300 hover:bg-sky-100 transition-all cursor-pointer group"
                >
                  <div className="relative">
                    {/* User Avatar with Frame (Header) - Fixed Size */}
                    <div className="relative w-9 h-9">
                      <img 
                        src={currentUser.avatar || defaultAvatar} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full border border-sky-200 group-hover:scale-105 transition-transform object-cover" 
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                      {currentFrame && (
                        <div className={currentFrame.cssClass}></div>
                      )}
                    </div>
                    
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[9px] font-bold text-yellow-900 w-4 h-4 flex items-center justify-center rounded-full border border-white z-20">
                      {Math.min(currentUser.level || 1, 7)}
                    </div>
                  </div>
                  <div className="flex flex-col items-start hidden sm:flex">
                    <span className="text-sm font-bold text-sky-800 truncate max-w-[100px] leading-tight">{currentUser.name}</span>
                    <span className="text-[9px] text-sky-500 font-bold uppercase">XP: {currentUser.xp || 0}</span>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-full font-bold shadow-md shadow-indigo-200 transition-all text-sm font-bungee"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Scrollable Menu Container with Buttons */}
          <div className="relative group px-4 pb-2">
            <button 
              onClick={() => handleScrollMenu('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800/80 dark:bg-gray-800/80 p-1 rounded-full shadow-md border border-sky-100 dark:border-gray-700 text-sky-600 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div 
              ref={menuScrollRef}
              className="overflow-x-auto pb-2 -mx-4 px-8 sm:mx-0 sm:px-0 no-scrollbar scroll-smooth"
            >
              <div className="flex gap-2 min-w-max">
                {(Object.keys(SUBJECTS) as SubjectId[]).map((subj) => (
                  <button
                    key={subj}
                    onClick={() => setActiveSubject(subj)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                      activeSubject === subj
                        ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200 scale-105'
                        : 'bg-white dark:bg-gray-800 border-sky-100 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50'
                    }`}
                  >
                    {SUBJECTS[subj]}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleScrollMenu('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800/80 dark:bg-gray-800/80 p-1 rounded-full shadow-md border border-sky-100 dark:border-gray-700 text-sky-600 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-gray-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout (2 Columns on Desktop) */}
      <main className="relative z-10 pt-40 pb-12 px-4 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Intro Banner */}
          <div className="text-center animate-fade-in-down">
            <div className="bg-white dark:bg-gray-800/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border-4 border-sky-300 dark:border-gray-700 p-6 md:p-8 transform hover:scale-[1.01] transition-transform relative overflow-hidden group">
               <div className="relative z-10">
                 <h2 className="text-2xl md:text-3xl font-bungee text-sky-800 dark:text-sky-300 tracking-wider drop-shadow-sm leading-tight">
                    GÓC HỌC TẬP <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mt-2 inline-block">
                      {SUBJECTS[activeSubject].toUpperCase()}
                    </span>
                 </h2>
                 <div className="mt-4 flex justify-center">
                   <span className="px-6 py-2 bg-sky-100/50 rounded-full text-sky-800 font-bold uppercase tracking-widest text-sm border border-sky-200">
                      Trao đổi kiến thức & Kinh nghiệm
                   </span>
                 </div>
               </div>
               <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
            </div>
          </div>

          {/* Compose Area */}
          <div className="sticky top-[160px] z-30">
            <ComposePost 
              onSubmit={handleNewPost} 
              placeholder={`Đặt câu hỏi môn ${SUBJECTS[activeSubject]}...`}
              userAvatar={currentUser?.avatar}
            />
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-sm border border-sky-100 dark:border-gray-700">
             <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 text-sm font-bold">
               <Filter size={16} />
               <span>Lọc:</span>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setSortBy('newest')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-bold transition-colors ${sortBy === 'newest' ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <Clock size={14} /> Mới nhất
                </button>
                <button 
                  onClick={() => setSortBy('popular')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-bold transition-colors ${sortBy === 'popular' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <Flame size={14} /> Phổ biến
                </button>
             </div>
          </div>

          {/* Feed */}
          <div className="space-y-6">
            {displayedPosts.length > 0 ? (
              displayedPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike}
                  onReply={handleReply}
                  onDelete={handleDeletePost}
                  currentUser={currentUser}
                  uploadProgress={uploadProgresses[post.id]}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-sky-200 dark:border-gray-600">
                <Cloud size={64} className="mx-auto mb-4 text-sky-300 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                <p className="text-sky-800 dark:text-sky-300 font-medium text-lg font-bungee">
                  {searchQuery ? 'Không tìm thấy kết quả nào' : 'Chưa có bài thảo luận nào'}
                </p>
                <p className="text-sky-600/70 dark:text-gray-400 dark:text-gray-500 text-sm">
                  {searchQuery ? 'Hãy thử từ khóa khác xem sao' : `Hãy là người đầu tiên đặt câu hỏi môn ${SUBJECTS[activeSubject]}!`}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredPosts.length > POSTS_PER_PAGE && (
            <div className="flex justify-center items-center gap-4 mt-8 bg-white dark:bg-gray-800/60 dark:bg-gray-800/60 p-2 rounded-full backdrop-blur-sm inline-flex mx-auto w-full max-w-xs">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow border border-sky-100 disabled:opacity-50 hover:bg-sky-50 text-sky-600"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-sky-800 font-pixel">
                Trang {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow border border-sky-100 disabled:opacity-50 hover:bg-sky-50 text-sky-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div className="hidden lg:block space-y-6">
           {/* Community Stats */}
           <div className="bg-white dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-sky-100 p-5">
              <h3 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-100 pb-2">
                 <TrendingUp size={20} className="text-sky-500" />
                 Thống Kê Nhanh
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                       <MessageSquare size={16} /> Bài viết
                    </div>
                    <span className="font-bold text-sky-600">{posts.length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                       <Users size={16} /> Thành viên
                    </div>
                    <span className="font-bold text-sky-600">1,205</span>
                 </div>
              </div>
           </div>

           {/* User Info / CTA */}
           <div className="bg-gradient-to-br from-indigo-500 to-sky-500 rounded-2xl shadow-lg p-5 text-white">
              <h3 className="font-bungee text-lg mb-2">Đua Top Tháng Này</h3>
              <p className="text-sm text-sky-100 mb-4">Tích cực thảo luận để nhận Khung Avatar độc quyền!</p>
              <button 
                 onClick={() => currentUser ? setShowProfile(true) : setShowLogin(true)}
                 className="w-full bg-white dark:bg-gray-800 text-sky-600 font-bold py-2 rounded-lg shadow-sm hover:bg-sky-50 transition-colors"
              >
                 {currentUser ? 'Xem Hồ Sơ Của Tôi' : 'Tham Gia Ngay'}
              </button>
           </div>
        </div>
      </main>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && newLevelData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <Confetti 
              width={typeof window !== 'undefined' ? window.innerWidth : 1000} 
              height={typeof window !== 'undefined' ? window.innerHeight : 1000}
              recycle={false}
              numberOfPieces={500}
              gravity={0.15}
            />
            <motion.div 
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative text-center"
            >
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute inset-0 bg-yellow-400/30 blur-[100px] rounded-full"
               ></motion.div>
               
               {/* Spinning Rays */}
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-40 pointer-events-none"
               >
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-300">
                     <path d="M50 50 L50 0 L55 50 Z" />
                     <path d="M50 50 L100 50 L50 55 Z" />
                     <path d="M50 50 L50 100 L45 50 Z" />
                     <path d="M50 50 L0 50 L50 45 Z" />
                     <path d="M50 50 L85 15 L50 50 Z" />
                     <path d="M50 50 L85 85 L50 50 Z" />
                     <path d="M50 50 L15 85 L50 50 Z" />
                     <path d="M50 50 L15 15 L50 50 Z" />
                  </svg>
               </motion.div>

               <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-10 rounded-3xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)] max-w-sm mx-4 overflow-hidden">
                  {/* Inner shine effect */}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  ></motion.div>

                  <motion.div 
                    initial={{ y: -50, scale: 0 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2"
                  >
                     <Trophy size={96} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-bungee text-white mt-10 mb-2 drop-shadow-lg tracking-wider"
                  >
                    LÊN CẤP!
                  </motion.h2>
                  
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", bounce: 0.6 }}
                    className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 mb-4 font-header drop-shadow-[0_4px_0_rgba(161,98,7,1)]"
                  >
                     {newLevelData}
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="space-y-2 mb-8"
                  >
                     <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Danh hiệu mới</p>
                     <p className="text-3xl font-bold text-white font-header drop-shadow-md">{getLevelTitle(newLevelData)}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex flex-col gap-3"
                  >
                     <button 
                       onClick={() => {
                          setShowLevelUp(false);
                          setShowProfile(true); // Open profile to flex
                       }}
                       className="relative overflow-hidden group bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-yellow-950 px-6 py-4 rounded-xl font-black shadow-[0_0_20px_rgba(250,204,21,0.4)] transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                     >
                       <span className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800/20 group-hover:animate-ping"></span>
                       <Sparkles size={24} className="animate-pulse" />
                       KHOE NGAY
                     </button>
                     <button 
                       onClick={() => setShowLevelUp(false)}
                       className="text-indigo-200 hover:text-white text-sm font-medium transition-colors"
                     >
                        Đóng
                     </button>
                  </motion.div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showLogin && (
        <LoginModal 
          onLogin={handleLogin} 
          onClose={() => setShowLogin(false)} 
        />
      )}

      {showProfile && currentUser && (
        <UserProfileModal
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default App;