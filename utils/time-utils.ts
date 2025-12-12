/**
 * Formats seconds into a human-readable time string (hours and minutes)
 * @param seconds - Total seconds to format
 * @returns Formatted string like "2h 30m" or "45m"
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Formats seconds into MM:SS format
 * @param seconds - Total seconds to format
 * @returns Formatted string like "5:30" or "0:45"
 */
export const formatTimeMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};
