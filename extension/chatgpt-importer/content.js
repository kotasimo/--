function isChatgptConversationUrl(url) {
  return /^https:\/\/(chatgpt\.com|chat\.openai\.com)\/c\/[^/?#]+/.test(url);
}

const subjectFolders = {
  vibration: "vibration",
  thermo: "thermo",
  material: "material",
  fluid: "fluid",
  calculus: "basic/calculus",
  linear: "basic/linear",
  ode: "basic/ode",
  vector: "basic/vector",
};

function inferImageUrl(target) {
  if (target.imageUrl) return target.imageUrl;
  if (!target.siteOrigin || target.ownerType !== "past_exam" || !target.ownerId?.includes(":")) return "";
  const [subject, year] = target.ownerId.split(":");
  const folder = subjectFolders[subject];
  if (!folder || !year) return "";
  return `${target.siteOrigin}/problems/${folder}/${year}_${subject}.jpg`;
}

async function getPendingTarget() {
  const { pendingChatgptTarget } = await chrome.storage.local.get(["pendingChatgptTarget"]);
  if (!pendingChatgptTarget) return null;
  if (Date.now() - Number(pendingChatgptTarget.createdAt || 0) > 60 * 60 * 1000) {
    await chrome.storage.local.remove("pendingChatgptTarget");
    return null;
  }
  return {
    ...pendingChatgptTarget,
    imageUrl: inferImageUrl(pendingChatgptTarget),
  };
}

async function copyImageToClipboard(imageUrl) {
  if (!imageUrl) throw new Error("問題画像URLがありません。");
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("このブラウザでは画像コピーに対応していません。");
  }

  const imageResponse = await chrome.runtime.sendMessage({
    type: "FETCH_IMAGE_AS_DATA_URL",
    url: imageUrl,
  });
  if (!imageResponse?.ok) {
    throw new Error(imageResponse?.error || "問題画像を取得できませんでした。");
  }

  const response = await fetch(imageResponse.dataUrl);
  if (!response.ok) throw new Error("問題画像を読み込めませんでした。");
  const sourceBlob = await response.blob();
  const blob =
    sourceBlob.type === "image/png"
      ? sourceBlob
      : await new Promise((resolve, reject) => {
          const image = new Image();
          const objectUrl = URL.createObjectURL(sourceBlob);
          image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            URL.revokeObjectURL(objectUrl);
            canvas.toBlob((pngBlob) => {
              if (pngBlob) resolve(pngBlob);
              else reject(new Error("問題画像をコピー用に変換できませんでした。"));
            }, "image/png");
          };
          image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("問題画像を読み込めませんでした。"));
          };
          image.src = objectUrl;
        });

  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

async function saveCurrentUrl(target) {
  if (!isChatgptConversationUrl(location.href)) {
    throw new Error("URL未作成。先にChatGPTで1回質問してください。");
  }

  const settings = await chrome.storage.local.get(["supabaseUrl", "supabaseKey"]);
  const supabaseUrl = String(settings.supabaseUrl || "").trim().replace(/\/$/, "");
  const supabaseKey = String(settings.supabaseKey || "").trim();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("拡張機能にSupabase URLとkeyを設定してください。");
  }

  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/chatgpt_conversations?chatgpt_url=eq.${encodeURIComponent(location.href)}&select=owner_type,owner_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );
  if (!existingResponse.ok) throw new Error(await existingResponse.text());

  const existingItems = await existingResponse.json();
  const linkedElsewhere = existingItems.some(
    (item) => item.owner_type !== target.ownerType || item.owner_id !== target.ownerId,
  );
  if (linkedElsewhere) {
    throw new Error("このURLは別の問題に保存済みです。");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/chatgpt_conversations?on_conflict=owner_type,owner_id`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json; charset=utf-8",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        owner_type: target.ownerType,
        owner_id: target.ownerId,
        subject: target.subject,
        title: target.title || "ChatGPT",
        chatgpt_url: location.href,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) throw new Error(await response.text());

  await chrome.storage.local.remove("pendingChatgptTarget");
}

function styleButton(button, variant = "primary") {
  Object.assign(button.style, {
    minHeight: "38px",
    border: "1px solid #126e63",
    borderRadius: "8px",
    padding: "0 12px",
    color: variant === "primary" ? "#fff" : "#126e63",
    background: variant === "primary" ? "#126e63" : "#fff",
    font: "700 13px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    cursor: "pointer",
  });
}

function ensurePanel() {
  let panel = document.querySelector("#nagoya-exam-chatgpt-panel");
  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = "nagoya-exam-chatgpt-panel";
  Object.assign(panel.style, {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: "2147483647",
    display: "none",
    gridTemplateColumns: "1fr",
    gap: "8px",
    width: "230px",
    border: "1px solid #c9d7d5",
    borderRadius: "10px",
    padding: "10px",
    color: "#102027",
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.18)",
  });

  const title = document.createElement("div");
  title.id = "nagoya-exam-chatgpt-title";
  Object.assign(title.style, {
    font: "700 13px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  });

  const copyButton = document.createElement("button");
  copyButton.id = "nagoya-exam-copy-problem-image";
  copyButton.type = "button";
  copyButton.textContent = "問題画像をコピー";
  styleButton(copyButton, "primary");

  const saveButton = document.createElement("button");
  saveButton.id = "nagoya-exam-save-chatgpt-url";
  saveButton.type = "button";
  saveButton.textContent = "このURLを保存";
  styleButton(saveButton, "secondary");

  panel.append(title, copyButton, saveButton);
  document.documentElement.appendChild(panel);
  return panel;
}

async function renderPanel() {
  const target = await getPendingTarget();
  const panel = ensurePanel();

  if (!target) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "grid";
  panel.querySelector("#nagoya-exam-chatgpt-title").textContent = target.title || "この問題";

  const copyButton = panel.querySelector("#nagoya-exam-copy-problem-image");
  copyButton.disabled = !target.imageUrl;
  copyButton.textContent = target.imageUrl ? "問題画像をコピー" : "画像URLなし";
  copyButton.onclick = async () => {
    copyButton.disabled = true;
    copyButton.textContent = "コピー中";
    try {
      await copyImageToClipboard(target.imageUrl);
      copyButton.textContent = "コピー済み Ctrl+V";
    } catch (error) {
      console.error(error);
      copyButton.textContent = error.message || "コピー失敗";
      window.setTimeout(renderPanel, 2500);
    } finally {
      copyButton.disabled = false;
    }
  };

  const saveButton = panel.querySelector("#nagoya-exam-save-chatgpt-url");
  saveButton.disabled = false;
  saveButton.textContent = "このURLを保存";
  saveButton.onclick = async () => {
    saveButton.disabled = true;
    saveButton.textContent = "保存中";
    try {
      await saveCurrentUrl(target);
      saveButton.textContent = "保存しました";
      window.setTimeout(() => {
        panel.style.display = "none";
      }, 1200);
    } catch (error) {
      console.error(error);
      saveButton.textContent = error.message || "保存失敗";
      saveButton.disabled = false;
      window.setTimeout(renderPanel, 2500);
    }
  };
}

renderPanel().catch((error) => console.error(error));
window.setInterval(() => {
  renderPanel().catch((error) => console.error(error));
}, 1500);
