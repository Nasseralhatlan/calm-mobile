import { useEffect, useState } from 'react';

export function useBootstrap() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.warn('[bootstrap] preload failed', error);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    prepare();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isReady };
}
