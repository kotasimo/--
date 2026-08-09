import React, { useEffect, useState } from "react";
import {
  deleteChatgptConversation,
  getChatgptConversation,
  saveChatgptConversation,
} from "../services/chatgptConversationRepository.js";

export function ConsultationPanel({ ownerType, ownerId, subject, defaultTitle }) {
  const [chatgptUrl, setChatgptUrl] = useState("");
  const [chatgptState, setChatgptState] = useState("");

  useEffect(() => {
    let cancelled = false;
    setChatgptState("読み込み中");
    getChatgptConversation(ownerType, ownerId)
      .then((item) => {
        if (cancelled) return;
        setChatgptUrl(item?.chatgpt_url || "");
        setChatgptState("");
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setChatgptState(error?.code === "PGRST205" ? "SQL更新が必要" : "読み込み失敗");
      });

    return () => {
      cancelled = true;
    };
  }, [ownerType, ownerId]);

  function normalizedChatgptUrl() {
    const value = chatgptUrl.trim();
    if (!value) return "";
    try {
      const url = new URL(value);
      if (url.hostname !== "chatgpt.com" && url.hostname !== "chat.openai.com") return "";
      return url.toString();
    } catch {
      return "";
    }
  }

  async function handleSaveChatgptUrl() {
    const url = normalizedChatgptUrl();
    if (!url) {
      setChatgptState("URLを確認");
      return;
    }

    setChatgptState("保存中");
    try {
      const saved = await saveChatgptConversation({
        ownerType,
        ownerId,
        subject,
        title: defaultTitle || "ChatGPT",
        chatgptUrl: url,
      });
      setChatgptUrl(saved.chatgpt_url);
      setChatgptState("保存済み");
    } catch (error) {
      console.error(error);
      setChatgptState("保存失敗");
    }
  }

  async function handleDeleteChatgptUrl() {
    setChatgptState("削除中");
    try {
      await deleteChatgptConversation(ownerType, ownerId);
      setChatgptUrl("");
      setChatgptState("");
    } catch (error) {
      console.error(error);
      setChatgptState("削除失敗");
    }
  }

  function handleAskInChatgpt() {
    window.postMessage(
      {
        type: "NAGOYA_EXAM_CHATGPT_TARGET",
        target: {
          ownerType,
          ownerId,
          subject,
          title: defaultTitle || "ChatGPT",
        },
      },
      window.location.origin,
    );
    setChatgptState("ChatGPTを開きます");
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
  }

  const savedChatgptUrl = normalizedChatgptUrl();

  return (
    <section className="consultation-panel">
      <div className="consultation-header">
        <h3>ChatGPT</h3>
        <span>{chatgptState || (savedChatgptUrl ? "URL保存済み" : "未保存")}</span>
      </div>

      <section className="chatgpt-link-panel" aria-label="ChatGPTチャットURL">
        <div className="chatgpt-link-copy">
          <strong>{defaultTitle || "この問題"}</strong>
          <span>この問題用のChatGPTチャットを開きます。</span>
        </div>
        <div className="chatgpt-primary-row">
          <button type="button" onClick={handleAskInChatgpt}>
            ChatGPTに質問
          </button>
          <a
            className={`chatgpt-open-link ${savedChatgptUrl ? "" : "disabled"}`}
            href={savedChatgptUrl || undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!savedChatgptUrl}
          >
            保存済みを開く
          </a>
        </div>
        <div className="chatgpt-link-row">
          <input
            value={chatgptUrl}
            onChange={(event) => setChatgptUrl(event.target.value)}
            placeholder="https://chatgpt.com/c/..."
          />
          <button type="button" onClick={handleSaveChatgptUrl}>
            保存
          </button>
          <button type="button" onClick={handleDeleteChatgptUrl} disabled={!chatgptUrl.trim()}>
            削除
          </button>
        </div>
      </section>
    </section>
  );
}
