/** Simulated token streaming: emits the growing text a few words at a time. */
export function streamText(text: string, onUpdate: (partial: string) => void, opts: { signal?: AbortSignal; wordsPerTick?: number; tickMs?: number } = {}): Promise<void> {
  const { signal, wordsPerTick = 3, tickMs = 28 } = opts;
  const tokens = text.split(/(\s+)/);
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => {
      if (signal?.aborted) return resolve();
      i = Math.min(tokens.length, i + wordsPerTick * 2);
      onUpdate(tokens.slice(0, i).join(""));
      if (i >= tokens.length) return resolve();
      setTimeout(tick, tickMs);
    };
    tick();
  });
}
