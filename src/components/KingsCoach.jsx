import { useState } from 'react';
import api from '../utils/api';

const S = {
  bg: '#0A0F1E',
  surface: '#111827',
  border: '#1E2A3A',
  text: '#F5F0E8',
  muted: '#8A9BB0',
  gold: '#C9A84C',
};

const IDENTITIES = ['A fit, healthy person', 'A focused professional', 'A disciplined student', 'A calmer, balanced me'];
const AREAS = ['Health & fitness', 'Work & focus', 'Learning & study', 'Mindfulness & rest', 'Finances'];
const ANCHORS = ['My morning coffee', 'After I wake up', 'Before I open my laptop', 'After work', 'Before bed'];

export default function KingsCoach({ onDone, onCancel }) {
  const [phase, setPhase] = useState('identity'); // identity → area → anchor → designing → review
  const [identity, setIdentity] = useState('');
  const [area, setArea] = useState('');
  const [anchor, setAnchor] = useState('');
  const [habits, setHabits] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const design = async (chosenAnchor) => {
    setPhase('designing');
    setError('');
    try {
      const res = await api.post('/coach/design-habits', { identity, area, anchor: chosenAnchor });
      const list = (res.data.habits || []).map((h) => ({ ...h, editing: false }));
      if (list.length === 0) throw new Error('empty');
      setHabits(list);
      setPhase('review');
    } catch (e) {
      setError("The Coach couldn't design your habits right now. You can go back and try again, or set them up yourself.");
      setPhase('anchor');
    }
  };

  const updateName = (i, name) => {
    setHabits((prev) => prev.map((h, idx) => (idx === i ? { ...h, name } : h)));
  };

  const saveHabits = async () => {
    setSaving(true);
    for (const h of habits) {
      if (h.name.trim()) {
        try { await api.post('/habits', { name: h.name.trim(), category: 'Personal', point_value: 1 }); } catch (e) {}
      }
    }
    setSaving(false);
    onDone();
  };

  const Bubble = ({ children }) => (
    <div style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }} className="rounded-2xl rounded-tl-sm p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">👑</span>
        <span style={{ color: S.gold }} className="text-xs font-bold uppercase tracking-wider">King's Coach</span>
      </div>
      <p style={{ color: S.text }} className="text-sm leading-relaxed">{children}</p>
    </div>
  );

  const Choice = ({ options, onPick, custom }) => (
    <div className="space-y-2">
      {options.map((opt) => (
        <button key={opt} onClick={() => onPick(opt)}
          style={{ backgroundColor: S.bg, border: `1px solid ${S.border}`, color: S.text }}
          className="w-full p-3 rounded-xl text-left text-sm hover:border-yellow-600 transition">
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {phase === 'identity' && (
        <>
          <Bubble>Forget goals for a second. <strong>Who do you want to become?</strong></Bubble>
          <Choice options={IDENTITIES} onPick={(v) => { setIdentity(v); setPhase('area'); }} />
        </>
      )}

      {phase === 'area' && (
        <>
          <Bubble>Love it. To become that, which <strong>area</strong> should we strengthen first?</Bubble>
          <Choice options={AREAS} onPick={(v) => { setArea(v); setPhase('anchor'); }} />
        </>
      )}

      {phase === 'anchor' && (
        <>
          <Bubble>Here's the secret — we attach new habits to something you <strong>already do</strong>. What's a reliable part of your day?</Bubble>
          <Choice options={ANCHORS} onPick={(v) => { setAnchor(v); design(v); }} />
          {error && <p style={{ color: '#E07070' }} className="text-xs mt-3">{error}</p>}
        </>
      )}

      {phase === 'designing' && (
        <div className="text-center py-10">
          <div className="text-4xl mb-4">👑</div>
          <p style={{ color: S.muted }} className="text-sm">Designing your system...</p>
        </div>
      )}

      {phase === 'review' && (
        <>
          <Bubble>Here's your starter system — small, specific, and built to win. Tweak any of them, then let's begin.</Bubble>
          <div className="space-y-3 mb-6">
            {habits.map((h, i) => (
              <div key={i} style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }} className="rounded-xl p-3">
                <input value={h.name} onChange={(e) => updateName(i, e.target.value)} maxLength={50}
                  style={{ backgroundColor: 'transparent', color: S.text, border: 'none' }}
                  className="w-full text-sm font-semibold focus:outline-none" />
                {h.why && <p style={{ color: S.muted }} className="text-xs mt-1">{h.why}</p>}
              </div>
            ))}
          </div>
          <button onClick={saveHabits} disabled={saving}
            style={{ backgroundColor: S.gold, color: S.bg }}
            className="w-full py-3 rounded-xl font-black text-sm hover:opacity-90 transition disabled:opacity-50">
            {saving ? 'Adding your habits...' : 'Add these & continue →'}
          </button>
        </>
      )}

      <button onClick={onCancel} style={{ color: S.muted }} className="mt-4 text-xs hover:text-yellow-500 transition block mx-auto">
        I'll set them up myself
      </button>
    </div>
  );
}