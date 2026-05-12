import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, ArrowBigDownDash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // 1. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIos) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    // 2. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isStandalone) return;

    // 3. Listen for Android Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      checkShowPrompt();
    });

    // 4. iOS check - manually trigger show
    if (isIos) {
      checkShowPrompt();
    }

    // 5. Listen for manual trigger from Header
    const handleManualTrigger = () => setIsVisible(true);
    window.addEventListener('triggerPWAInstall', handleManualTrigger);

    return () => {
      window.removeEventListener('triggerPWAInstall', handleManualTrigger);
    };
  }, []);

  const checkShowPrompt = () => {
    const lastPrompt = localStorage.getItem('lastPwaPrompt');
    const now = Date.now();
    
    // Only show every 24 hours if dismissed
    if (!lastPrompt || (now - parseInt(lastPrompt)) > 24 * 60 * 60 * 1000) {
      setTimeout(() => setIsVisible(true), 3000); // Show after 3 seconds for better experience
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('lastPwaPrompt', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm">
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="glass bg-black/90 backdrop-blur-xl border border-amber-500/30 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <Smartphone className="text-black" size={24} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-black text-white uppercase tracking-tight italic">Install AchievTrack</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed mt-1">
                  Tambahkan ke layar utama untuk akses lebih cepat dan lancar.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {platform === 'android' ? (
                <button 
                  onClick={handleInstallClick}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 rounded-xl text-black font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Simpan di Layar Utama
                </button>
              ) : platform === 'ios' ? (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="text-[10px] font-black">1</span>
                    </div>
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                      Tekan tombol 'Share' <Share size={12} className="inline mx-1 text-blue-400" /> di bawah browser
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="text-[10px] font-black">2</span>
                    </div>
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                      Pilih <PlusSquare size={12} className="inline mx-1" /> 'Add to Home Screen'
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.2em]">Buka di Browser Mobile untuk Menginstall</p>
                </div>
              )}
              
              <button 
                onClick={handleDismiss}
                className="w-full text-center text-[9px] font-black text-white/20 uppercase tracking-[0.3em] py-1 hover:text-white transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </motion.div>
          
          {/* Visual Indicator for iOS Share Tooltip */}
          {platform === 'ios' && (
            <motion.div 
               animate={{ y: [0, 10, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="flex justify-center mt-2"
            >
               <ArrowBigDownDash size={28} className="text-amber-500" />
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
