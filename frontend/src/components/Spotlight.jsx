import { useCallback } from 'react';

export default function Spotlight({ children, className }) {
  const onMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div onMouseMove={onMouseMove} className={`spotlight-card ${className || ''}`}>
      {children}
    </div>
  );
}