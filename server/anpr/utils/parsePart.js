// Вспомогательная функция для разбора части multipart
export function parsePart(partBuffer) {
  const separator = "\r\n\r\n";
  const headerEndIndex = partBuffer.indexOf(separator);
  if (headerEndIndex === -1) return null;

  const headersRaw = partBuffer.slice(0, headerEndIndex).toString("utf8");
  const body = partBuffer.slice(headerEndIndex + separator.length);

  const headers = {};
  headersRaw.split("\r\n").forEach((line) => {
    const [key, value] = line.split(": ");
    if (key && value) headers[key.toLowerCase()] = value;
  });

  return { headers, body, rawHeader: headersRaw };
}
