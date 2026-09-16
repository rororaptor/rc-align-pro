/**
 * Screen WakeLock API to prevent phone screen from sleeping on the pit bench
 */

let wakeLockSentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });
    return true;
  } catch (err) {
    console.warn('Wake Lock request failed:', err);
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}
