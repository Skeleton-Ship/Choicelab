export function formatElapsedTime(currentTime: number): string {
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const milliseconds = (currentTime % 1) * 1000;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  const formattedMilliseconds = String(Math.floor(milliseconds / 10)).padStart(
    2,
    "0"
  );
  return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
}
