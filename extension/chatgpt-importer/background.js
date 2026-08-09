function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function fetchImageAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`画像を取得できませんでした: ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();
  return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "FETCH_IMAGE_AS_DATA_URL") return false;

  fetchImageAsDataUrl(message.url)
    .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
    .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
  return true;
});
