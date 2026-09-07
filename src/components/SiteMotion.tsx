import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <i style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const el = ref.current;
    if (!el) return;
    const move = (event: globalThis.PointerEvent) => {
      el.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  if (typeof window !== 'undefined' && (prefersReducedMotion() || isCoarsePointer())) return null;

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

export function TiltCard({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    node.style.transform = `perspective(1100px) rotateY(${x * 9}deg) rotateX(${-y * 7}deg) translateY(-10px)`;
  };

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="luxe-marquee" aria-hidden="true">
      <div className="luxe-marquee-track">
        {row.map((item, i) => (
          <span key={`${item}-${i}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export function Filmstrip({
  frames,
}: {
  frames: { src: string; caption: string }[];
}) {
  const row = [...frames, ...frames];
  return (
    <section className="filmstrip" aria-label="Finish gallery">
      <div className="filmstrip-copy">
        <p className="eyebrow">THE FINISH</p>
        <h2>Made to be seen in motion.</h2>
      </div>
      <div className="filmstrip-viewport">
        <div className="filmstrip-track">
          {row.map((frame, i) => (
            <figure key={`${frame.caption}-${i}`} className="filmstrip-frame">
              <img src={frame.src} alt="" />
              <figcaption>{frame.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function useParallax(strength = 0.28) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const update = () => setOffset(window.scrollY * strength);
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [strength]);

  return offset;
}
