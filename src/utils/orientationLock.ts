/**
 * Screen orientation locking utility for RC Wheel Alignment Tool.
 * Prevents screen auto-rotation when smartphone is tilted or placed against wheels.
 */

export interface OrientationLockStatus {
  isSupported: boolean;
  isLocked: boolean;
  type: string;
}

export async function lockOrientationPortrait(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('portrait');
      return true;
    }
  } catch (err) {
    // Some browsers require full screen first
    console.debug('Standard orientation lock failed, trying fullscreen method:', err);
  }

  return false;
}

export async function lockOrientationWithFullscreen(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    return await lockOrientationPortrait();
  } catch (err) {
    console.warn('Fullscreen orientation lock failed:', err);
    return false;
  }
}

export async function unlockOrientation(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.unlock === 'function') {
      orientation.unlock();
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    // ignore
  }
}

export function isOrientationLockSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const orientation = window.screen?.orientation as any;
  return !!(orientation && typeof orientation.lock === 'function');
}
