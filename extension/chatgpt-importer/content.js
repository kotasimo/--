function isChatgptConversationUrl(url) {
  return /^https:\/\/(chatgpt\.com|chat\.openai\.com)\/c\/[^/?#]+/.test(url);
}

async function getPendingTarget() {
  const { pendingChatgptTarget } = await chrome.storage.local.get(["pendingChatgptTarget"]);
  if (!pendingChatgptTarget) return null;
  if (Date.now() - Number(pendingChatgptTarget.createdAt || 0) > 60 * 60 * 1000) {
    await chrome.storage.local.remove("pendingChatgptTarget");
    return null;
  }
  return pendingChatgptTarget;
}

async function saveCurrentUrl(target) {
  if (!isChatgptConversationUrl(location.href)) {
    throw new Error("このチャットのURLがまだ作られていません。先にChatGPTで1回質問してください。");
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
    throw new Error("このChatGPT URLは別の問題に保存済みです。新しいチャットで保存してください。");
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

function ensureSaveButton() {
  let button = document.querySelector("#nagoya-exam-save-chatgpt-url");
  if (button) return button;

  button = document.createElement("button");
  button.id = "nagoya-exam-save-chatgpt-url";
  button.type = "button";
  Object.assign(button.style, {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    zIndex: "2147483647",
    minHeight: "42px",
    border: "1px solid #126e63",
    borderRadius: "8px",
    padding: "0 14px",
    color: "#fff",
    background: "#126e63",
    font: "700 14px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.18)",
    cursor: "pointer",
  });
  document.documentElement.appendChild(button);
  return button;
}

async function renderSaveButton() {
  const target = await getPendingTarget();
  const button = ensureSaveButton();

  if (!target) {
    button.style.display = "none";
    return;
  }

  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.textContent = `${target.title || "この問題"} に保存`;
  button.onclick = async () => {
    button.disabled = true;
    button.textContent = "保存中";
    try {
      await saveCurrentUrl(target);
      button.textContent = "保存しました";
      window.setTimeout(() => {
        button.style.display = "none";
      }, 1200);
    } catch (error) {
      console.error(error);
      button.textContent = error.message || "保存失敗";
      button.disabled = false;
      window.setTimeout(renderSaveButton, 2500);
    }
  };
}

renderSaveButton().catch((error) => console.error(error));
window.setInterval(() => {
  renderSaveButton().catch((error) => console.error(error));
}, 1500);
