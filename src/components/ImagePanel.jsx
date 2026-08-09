import React, { useState } from "react";

async function copyImageToClipboard(src) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("このブラウザでは画像コピーに対応していません。");
  }

  const response = await fetch(src);
  if (!response.ok) throw new Error("画像を読み込めませんでした。");
  const sourceBlob = await response.blob();
  const blob =
    sourceBlob.type === "image/png"
      ? sourceBlob
      : await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            canvas.toBlob((pngBlob) => {
              if (pngBlob) resolve(pngBlob);
              else reject(new Error("画像をコピー用に変換できませんでした。"));
            }, "image/png");
          };
          image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
          image.src = URL.createObjectURL(sourceBlob);
        });

  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export function ImagePanel({ title, openLabel, src, alt, aiPasteLabel, openAiUrl }) {
  const [copyState, setCopyState] = useState("");

  async function handleAiPaste() {
    setCopyState("コピー中");
    try {
      await copyImageToClipboard(src);
      setCopyState("コピー済み");
      if (openAiUrl) window.open(openAiUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setCopyState("コピー失敗");
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section className="problem-panel">
      <div className="problem-header">
        <h3>{title}</h3>
        <div className="problem-actions">
          {aiPasteLabel && (
            <button type="button" onClick={handleAiPaste}>
              {copyState || aiPasteLabel}
            </button>
          )}
          <a href={src} target="_blank" rel="noreferrer">{openLabel}</a>
        </div>
      </div>
      <img className="problem-image" src={src} alt={alt} />
    </section>
  );
}
