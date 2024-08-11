function escapeString(str: string): string {
  return str
    .replace(/(\\*)(\\)/g, (match, p1) =>
      p1.length % 2 === 0 ? `${p1}\\` : match
    ) // Escape backslashes that are not already escaped
    .replace(/(\\*)(\n)/g, (match, p1) =>
      p1.length % 2 === 0 ? `${p1}\\n` : match
    ) // Escape newlines that are not already escaped
    .replace(/(\\*)(\r)/g, (match, p1) =>
      p1.length % 2 === 0 ? `${p1}\\r` : match
    ) // Escape carriage returns that are not already escaped
    .replace(/(\\*)(\t)/g, (match, p1) =>
      p1.length % 2 === 0 ? `${p1}\\t` : match
    ) // Escape tabs that are not already escaped
    .replace(/(\\*)(")/g, (match, p1) =>
      p1.length % 2 === 0 ? `${p1}\\"` : match
    ); // Escape double quotes that are not already escaped
}

function escapeObjectValues(obj: any): any {
  if (typeof obj === "string") {
    return escapeString(obj);
  } else if (Array.isArray(obj)) {
    return obj.map((item) => escapeObjectValues(item));
  } else if (typeof obj === "object" && obj !== null) {
    const escapedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        escapedObj[key] = escapeObjectValues(obj[key]);
      }
    }
    return escapedObj;
  }
  return obj; // Return the value unchanged if it's not a string, object, or array
}

export function stringify(obj: any, escape: boolean = true): string {
  const escapedObj = escape === true ? escapeObjectValues(obj) : obj;
  return JSON.stringify(escapedObj, null, 2);
}
