"use client";

const SCHEDULE_CHANNEL = "cfss_schedule_sync";
const SCHEDULE_EVENT = "cfss:schedule-updated";
const SCHEDULE_STORAGE_KEY = "cfss_schedule_updated_at";

/**
 * Notify all open tabs and same-tab listeners that room bookings or schedules changed.
 */
export function notifyScheduleUpdated(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(SCHEDULE_EVENT));

  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage quota errors in restricted browser modes.
  }

  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(SCHEDULE_CHANNEL);
      channel.postMessage({ updatedAt: Date.now() });
      channel.close();
    } catch {
      // Ignore BroadcastChannel errors if unsupported.
    }
  }
}

/**
 * Subscribe to cross-tab, same-tab, and window-focus schedule refresh signals.
 */
export function subscribeScheduleUpdates(onUpdate: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = () => onUpdate();
  const handleFocus = () => onUpdate();
  const handleVisibility = () => {
    if (!document.hidden) onUpdate();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === SCHEDULE_STORAGE_KEY) onUpdate();
  };

  window.addEventListener(SCHEDULE_EVENT, handleCustomEvent);
  window.addEventListener("focus", handleFocus);
  window.addEventListener("storage", handleStorage);
  document.addEventListener("visibilitychange", handleVisibility);

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    try {
      channel = new BroadcastChannel(SCHEDULE_CHANNEL);
      channel.onmessage = () => onUpdate();
    } catch {
      channel = null;
    }
  }

  return () => {
    window.removeEventListener(SCHEDULE_EVENT, handleCustomEvent);
    window.removeEventListener("focus", handleFocus);
    window.removeEventListener("storage", handleStorage);
    document.removeEventListener("visibilitychange", handleVisibility);
    channel?.close();
  };
}
