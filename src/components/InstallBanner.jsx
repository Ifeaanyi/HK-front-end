import { useState, useEffect } from 'react';

const S = {
  bg: '#0D1B2A',
  surface: '#152338',
  border: '#1E3A5F',
  text: '#F5F0E8',
  muted: '#8A9BB0',
  gold: '#C9A84C',
};

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // If already installed (running standalone), never show
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // If user dismissed before, don't show again
    if (localStorage.getItem('installDismissed')) return;

    // Detect iPhone / iPad
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    if (ios) {
      // iOS: no native prompt, just show instructions
      setShow(true);
    } else {
      // Android/Chrome: wait for the install prompt event
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('installDismissed', 'true');
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: S.surface, borderTop: `1px solid ${S.gold}`,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <img src="/icon-192.png" alt="Habit King" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {isIOS ? (
          <div style={{ color: S.text, fontSize: 13, lineHeight: 1.4 }}>
            Install Habit King: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
          </div>
        ) : (
          <div style={{ color: S.text, fontSize: 14, fontWeight: 600 }}>
            Install Habit King 👑
            <div style={{ color: S.muted, fontSize: 12, fontWeight: 400 }}>Quick access and notifications</div>
          </div>
        )}
      </div>
      {!isIOS && (
        <button onClick={handleInstall}
          style={{ backgroundColor: S.gold, color: S.bg, border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          Install
        </button>
      )}
      <button onClick={dismiss}
        style={{ background: 'transparent', border: 'none', color: S.muted, fontSize: 20, flexShrink: 0, lineHeight: 1, padding: '0 4px' }}>
        ×
      </button>
    </div>
  );
}