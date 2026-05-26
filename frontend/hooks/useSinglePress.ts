import { useRef, useCallback } from 'react';

/** Blocks rapid repeated presses (double navigation, etc.). */
export function useSinglePress(cooldownMs = 650) {
  const locked = useRef(false);

  return useCallback(
    (fn: () => void) => {
      if (locked.current) return;
      locked.current = true;
      fn();
      setTimeout(() => {
        locked.current = false;
      }, cooldownMs);
    },
    [cooldownMs]
  );
}
