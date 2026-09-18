export const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter((host) => host.length > 0);

export const DEFAULT_POLL_INTERVAL_SECONDS =
  Number(process.env.POLL_INTERVAL_SECONDS) || 30;
export const DEPARTURES_COLLECTION_NAME_REGEX = /^departures_(.+)$/;

export const DEFAULT_STALE_STOP_CLEANUP_INTERVAL_SECONDS =
  Number(process.env.STALE_STOP_CLEANUP_INTERVAL_SECONDS) || 30;
export const STALE_STOP_THRESHOLD_MS =
  (Number(process.env.STALE_STOP_THRESHOLD_MINUTES) || 2) * 60 * 1000;
