export default function getBase64Prefix(fileName: string) {
  const fileTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  let fileType = "";
  let extension: string | undefined = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return "";
  fileType = fileTypes[extension as keyof typeof fileTypes];
  if (!fileType) {
    console.error(
      "No file type associated with this extension, so the base64 URL will not load correctly."
    );
  }
  return `data:${fileType};base64, `;
}
