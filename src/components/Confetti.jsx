import { useEffect } from 'react';

function Confetti({ show, onComplete }) {
  useEffect(() => {
    if (show) {
      // Simple confetti effect
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-8xl animate-bounce">🎉</div>
    </div>
  );
}

export default Confetti;