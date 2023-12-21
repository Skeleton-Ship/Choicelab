export default async function readFileUpload(
  file: File,
  type: string
): Promise<string | ArrayBuffer | null | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      let result = event.target?.result;
      if (result) {
        if (
          result !== null &&
          typeof result !== "undefined" &&
          typeof result !== "string"
        ) {
          const binaryData = new Uint8Array(result);
          const hexString = Array.from(binaryData, (byte) =>
            byte.toString(16).padStart(2, "0")
          ).join("");
          result = hexString;
        }
      }
      resolve(result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    if (type === "text") {
      reader.readAsText(file);
    } else if (type === "binary") {
      reader.readAsArrayBuffer(file);
    }
  });
}
