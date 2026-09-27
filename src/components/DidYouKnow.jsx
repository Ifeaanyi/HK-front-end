import { useState, useEffect } from 'react';

const S = {
  surface: '#111827',
  border: '#1E2A3A',
  text: '#F5F0E8',
  gold: '#C9A84C',
  dim: '#3A4A5A',
};

// Each tip: the sentence, with {g}...{/g} marking the gold-highlighted part(s)
const TIPS = [
  'A {g}14-day streak{/g} earns +5 bonus points. Push to {g}30 days{/g} for a massive +20.',
  'Complete all {g}5 monthly goals{/g} and grab a +15 point bonus.',
  'Hit {g}85% to-do productivity{/g} for +20 bonus points — even 50% earns you +5.',
  'To win the crown: {g}65% productivity{/g}, 3 or fewer missed days, and {g}90+ activities{/g}.',
  'Your daily sheet locks at {g}11:59 PM{/g} your time. Log before then.',
  'Keep your streak: complete {g}all Team habits{/g}, 1 Personal habit, and 1 To-Do each day.',
  'Study hours count too — {g}1 hour logged = 1 point{/g}.',
  'You can edit your monthly goals from the {g}1st to the 8th{/g}. After that, they lock.',
];

function renderTip(tip) {
  // Split on the {g}...{/g} markers and colour those parts gold
  const parts = tip.split(/(\{g\}.*?\{\/g\})/g);
  return parts.map((part, i) => {
    if (part.startsWith('{g}')) {
      const inner = part.replace('{g}', '').replace('{/g}', '');
      return <span key={i} style={{ color: S.gold }}>{inner}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function DidYouKnow() {
  const [show, setShow] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastShown = localStorage.getItem('tipLastShownDate');

    // Only show once per day
    if (lastShown === today) return;

    // Rotate to the next tip each day
    const lastIndex = parseInt(localStorage.getItem('tipIndex') || '-1', 10);
    const nextIndex = (lastIndex + 1) % TIPS.length;
    setIndex(nextIndex);
    setShow(true);
    localStorage.setItem('tipIndex', String(nextIndex));
    localStorage.setItem('tipLastShownDate', today);
  }, []);

  if (!show) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }} className="rounded-2xl p-6 relative max-w-2xl mx-auto">
        <button onClick={() => setShow(false)}
          style={{ position: 'absolute', top: 16, right: 18, color: S.dim, fontSize: 18, lineHeight: 1, background: 'transparent', border: 'none' }}>
          ×
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: S.gold }}></div>
          <span style={{ color: S.gold, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em' }} className="uppercase">Did You Know</span>
        </div>

        <div style={{ color: S.text, fontSize: 16, lineHeight: 1.5, fontWeight: 500 }}>
          {renderTip(TIPS[index])}
        </div>

        <div className="flex gap-1.5 mt-4">
          {TIPS.map((_, i) => (
            <div key={i} style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: i === index ? S.gold : S.border }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}