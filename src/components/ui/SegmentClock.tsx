import React from 'react';

// ─── Theme ──────────────────────────────────────────────────────────────────
const PURPLE      = '#a855f7';
const PURPLE_MID  = 'rgba(168,85,247,0.55)';
const PURPLE_DIM  = 'rgba(168,85,247,0.10)';

// ─── Segment maps ───────────────────────────────────────────────────────────
// Indices: 0=top-left-v  1=top-h  2=top-right-v  3=mid-h
//          4=bot-left-v  5=bot-h  6=bot-right-v
const T = true, F = false;
const DIGIT_SEGS: Record<string, boolean[]> = {
  '0': [T, T, T, F, T, T, T],
  '1': [F, F, T, F, F, F, T],
  '2': [F, T, T, T, T, T, F],
  '3': [F, T, T, T, F, T, T],
  '4': [T, F, T, T, F, F, T],
  '5': [T, T, F, T, F, T, T],
  '6': [T, T, F, T, T, T, T],
  '7': [F, T, T, F, F, F, T],
  '8': [T, T, T, T, T, T, T],
  '9': [T, T, T, T, F, T, T],
};

// ─── Single segment bar ─────────────────────────────────────────────────────
interface SegProps {
  active: boolean;
  style: React.CSSProperties;
  w: number;
  glowing: boolean;
}
const Seg: React.FC<SegProps> = ({ active, style, w, glowing }) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: w / 2,
      background: active
        ? 'var(--color-fg)'
        : (glowing ? PURPLE_DIM : 'transparent'),
      boxShadow: active && glowing
        ? `0 0 ${w * 2}px ${PURPLE}, 0 0 ${w * 5}px ${PURPLE}, inset 0 0 ${w * 0.5}px rgba(255,255,255,0.8)`
        : 'none',
      transition: 'background 0.4s ease, box-shadow 0.4s ease',
      ...style,
    }}
  />
);

// ─── One digit ──────────────────────────────────────────────────────────────
interface DigitProps {
  char: string;
  height: number;
  glowing: boolean;
}
const Digit: React.FC<DigitProps> = ({ char, height, glowing }) => {
  const segs = DIGIT_SEGS[char];
  if (!segs) return null;

  const w  = Math.max(2, height * 0.075);
  const dw = height * 0.56;
  const halfH = (height - w) / 2;
  const innerW = dw - w * 2;

  const styles: React.CSSProperties[] = [
    { top: w * 0.6,    left: 0,       width: w,      height: halfH - w * 0.2 },
    { top: 0,          left: w * 0.6, width: innerW, height: w },
    { top: w * 0.6,    right: 0,      width: w,      height: halfH - w * 0.2 },
    { top: height / 2 - w / 2, left: w * 0.6, width: innerW, height: w },
    { bottom: w * 0.6, left: 0,       width: w,      height: halfH - w * 0.2 },
    { bottom: 0,       left: w * 0.6, width: innerW, height: w },
    { bottom: w * 0.6, right: 0,      width: w,      height: halfH - w * 0.2 },
  ];

  return (
    <div style={{ position: 'relative', width: dw, height, flexShrink: 0 }}>
      {segs.map((active, i) => (
        <Seg key={i} active={active} style={styles[i]} w={w} glowing={glowing} />
      ))}
    </div>
  );
};

// ─── Colon separator ────────────────────────────────────────────────────────
interface ColonProps { height: number; glowing: boolean; }
const Colon: React.FC<ColonProps> = ({ height, glowing }) => {
  const d = Math.max(3, height * 0.1);
  const colW = height * 0.22;
  const dotStyle: React.CSSProperties = {
    width: d, height: d, borderRadius: '50%',
    background: glowing ? PURPLE_MID : 'var(--color-fg)',
    boxShadow: glowing ? `0 0 ${d * 1.5}px ${PURPLE}, 0 0 ${d * 3}px ${PURPLE}` : 'none',
    animation: glowing ? 'segColonPulse 1s alternate cubic-bezier(.5,0,.5,1) infinite' : 'none',
    transition: 'background 0.4s ease, box-shadow 0.4s ease',
  };
  return (
    <div style={{
      position: 'relative', width: colW, height, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: height * 0.2,
    }}>
      <div style={dotStyle} />
      <div style={dotStyle} />
    </div>
  );
};

// ─── Public component ────────────────────────────────────────────────────────
export interface SegmentClockProps {
  timeString: string;   // "HH:MM:SS"
  ampm?: string;        // "AM" | "PM"
  digitHeight: number;  // px
  glowing?: boolean;    // purple glow mode
}

export const SegmentClock: React.FC<SegmentClockProps> = ({
  timeString, ampm, digitHeight, glowing = false,
}) => {
  const gap    = digitHeight * 0.12;
  const ampmFS = digitHeight * 0.35;

  return (
    <>
      <style>{`
        @keyframes segColonPulse {
          to { opacity: 0.35; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap }}>
        {timeString.split('').map((ch, i) =>
          ch === ':'
            ? <Colon key={i} height={digitHeight} glowing={glowing} />
            : <Digit key={i} char={ch} height={digitHeight} glowing={glowing} />
        )}

        {ampm && (
          <div style={{
            fontSize: ampmFS,
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: glowing ? PURPLE : 'var(--color-muted)',
            textShadow: glowing ? `0 0 6px ${PURPLE}, 0 0 14px ${PURPLE}` : 'none',
            alignSelf: 'flex-end',
            paddingBottom: digitHeight * 0.06,
            marginLeft: gap * 0.3,
            transition: 'color 0.4s ease, text-shadow 0.4s ease',
          }}>
            {ampm}
          </div>
        )}
      </div>
    </>
  );
};
