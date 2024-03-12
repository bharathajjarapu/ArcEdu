export function time(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

export function date(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function datetime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
