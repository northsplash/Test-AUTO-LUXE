import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
};

export function AnimatedSection({ children, className = '', delay = 0, direction = 'up' }: Props) {
  const { ref, visible } = useScrollAnimation();

  const transforms = {
    up: 'translateY(40px)',
    left: 'translateX(-40px)',
    right: 'translateX(40px)',
    none: 'none',
  };

  return (
    <section
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : transforms[direction],
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </section>
  );
}
