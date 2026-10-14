// Keeps the iPad screen on during a service. Re-acquires on visibility
// change since the OS releases the lock whenever the tab is hidden.
export class WakeLockManager {
  private sentinel: WakeLockSentinel | null = null;
  private supported = 'wakeLock' in navigator;
  onUnsupported?: () => void;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.acquire();
    });
  }

  async acquire(): Promise<void> {
    if (!this.supported) {
      this.onUnsupported?.();
      return;
    }
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
    } catch {
      // Request can fail if the document isn't visible; visibilitychange
      // will retry it.
    }
  }

  release(): void {
    this.sentinel?.release().catch(() => {});
    this.sentinel = null;
  }
}
