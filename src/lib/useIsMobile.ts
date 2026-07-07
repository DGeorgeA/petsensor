import { useEffect, useState } from 'react';

/**
 * Reactive mobile breakpoint (matchMedia, not a render-time snapshot).
 * Shared by every modal so mobile bottom-sheet vs desktop centered layouts
 * stay consistent and respond to viewport changes.
 */
export function useIsMobile(breakpointPx = 640): boolean {
  const query = `(max-width: ${breakpointPx - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return isMobile;
}
