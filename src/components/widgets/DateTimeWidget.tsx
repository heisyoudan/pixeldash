import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SegmentClock } from '@/components/ui/SegmentClock';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const DateTimeWidget: React.FC = () => {
  const [date, setDate]               = useState(new Date());
  const containerRef                  = useRef<HTMLDivElement>(null);
  const clockRef                      = useRef<HTMLDivElement>(null);
  const [digitHeight, setDigitHeight] = useState(40);
  const [dateFontSize, setDateFontSize] = useState(12);
  const [glowing, setGlowing]         = useState(false);

  // Refs for smooth mouse 3D rotation (direct DOM mutation, no re-render)
  const targetRot  = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });
  const rafId      = useRef<number>();

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Responsive digit height
  useEffect(() => {
    if (!containerRef.current) return;
    const calc = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      // "HH:MM:SS AM": 6 digits(×0.56) + 2 colons(×0.22) + 7 gaps(×0.12) + ampm(~0.7) ≈ 5.22×H
      const fromW = (w * 0.88) / 5.22;
      const fromH = h * (h > w * 0.55 ? 0.55 : 0.60);
      const dh = Math.max(18, Math.floor(Math.min(fromW, fromH)));
      setDigitHeight(dh);
      setDateFontSize(Math.max(10, Math.min(15, dh * 0.22)));
    };
    const observer = new ResizeObserver(calc);
    observer.observe(containerRef.current);
    const t = setTimeout(calc, 0);
    return () => { observer.disconnect(); clearTimeout(t); };
  }, []);

  // Mouse → smooth 3D tilt, only inside the widget
  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    targetRot.current = {
      x:  (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2),
      y: -(e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2),
    };
  }, []);

  // On mouse leave → smoothly return to flat + remove glow
  const onMouseLeave = useCallback(() => {
    targetRot.current = { x: 0, y: 0 };
    setGlowing(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    const animate = () => {
      currentRot.current.x = lerp(currentRot.current.x, targetRot.current.x, 0.08);
      currentRot.current.y = lerp(currentRot.current.y, targetRot.current.y, 0.08);
      if (clockRef.current) {
        const { x, y } = currentRot.current;
        clockRef.current.style.transform =
          `perspective(600px) rotateX(${x * 10}deg) rotateY(${y * 10}deg)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [onMouseMove, onMouseLeave]);

  // Time strings
  const timeStringFull = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const [timePart, ampmPart] = timeStringFull.split(' ');

  const dateString = date
    .toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
    .toLowerCase();

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center overflow-hidden"
      onMouseEnter={() => setGlowing(true)}
    >
      {/* Only the segment clock tilts, date stays flat */}
      <div
        ref={clockRef}
        style={{
          willChange: 'transform',
          transformStyle: 'preserve-3d',
          marginTop: digitHeight * 0.28,
        }}
      >
        <SegmentClock
          timeString={timePart}
          ampm={ampmPart}
          digitHeight={digitHeight}
          glowing={glowing}
        />
      </div>

      <div
        className="font-mono text-center whitespace-nowrap"
        style={{
          fontSize: dateFontSize,
          color: 'var(--color-muted)',
          letterSpacing: '0.04em',
          marginTop: digitHeight * 0.28,
        }}
      >
        {dateString}
      </div>
    </div>
  );
};