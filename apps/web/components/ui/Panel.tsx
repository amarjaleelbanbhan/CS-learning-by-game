import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`glass rounded-2xl ${glow ? 'shadow-glow' : ''} ${className}`}>{children}</div>
  );
}
