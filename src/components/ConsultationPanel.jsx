import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { addConsultationLog, listConsultationLogs } from "../services/consultationRepository.js";

export function parseChatContent(content) {
  const lines = content.split(/\r?\n/);
  const messages = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^(User|Codex|ユーザー|君|僕|AI|Assistant):\s*(.*)$/);
    if (match) {
      if (current) messages.push(current);
      const speaker = match[1];
      current = {
        role: speaker === "User" || speaker === "ユーザー" || speaker === "君" ? "user" : "assistant",
        text: match[2],
      };
    } else if (current) {
      current.text += `${current.text ? "\n" : ""}${line}`;
    }
  }

  if (current) messages.push(current);
  return messages.length > 0 ? messages : [{ role: "note", text: content }];
}

function normalizeMath(text) {
  return text
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_match, math) => `$$\n${math.trim()}\n$$`)
    .replace(/\\\((.*?)\\\)/g, (_match, math) => `$${math}$`);
}

export function ChatMarkdown({ text }) {
  return (
    <div className="chat-content">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeMath(text)}
      </ReactMarkdown>
    </div>
  );
}

export function questionTitle(text) {
  const firstLine = text.trim().split(/\r?\n/)[0] || "質問";
  return firstLine.length > 42 ? `${firstLine.slice(0, 42)}...` : firstLine;
}

export function ConsultationPanel({ ownerType, ownerId, subject, defaultTitle }) {
  const [logs, setLogs] = useState([]);
  const [content, setContent] = useState("");
  const [state, setState] = useState("");
  const logViews = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        messages: parseChatContent(log.content)
          .filter((message) => message.role !== "note")
          .map((message, index) => ({
            ...message,
            anchorId: `chat-${log.id}-${index}`,
          })),
      })),
    [logs],
  );
  const questions = useMemo(
    () =>
      logViews.flatMap((log) =>
        log.messages
          .filter((message) => message.role === "user")
          .map((message) => ({
            id: message.anchorId,
            title: questionTitle(message.text),
            date: log.created_at,
          })),
      ),
    [logViews],
  );

  useEffect(() => {
    let cancelled = false;
    setState("読み込み中");
    listConsultationLogs(ownerType, ownerId)
      .then((items) => {
        if (!cancelled) {
          setLogs(items);
          setState("");
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setState("読み込み失敗");
      });

    return () => {
      cancelled = true;
    };
  }, [ownerType, ownerId]);

  useEffect(() => {
    setContent("");
  }, [defaultTitle, ownerId]);

  async function handleAdd() {
    if (!content.trim()) return;
    setState("保存中");
    try {
      const saved = await addConsultationLog({
        ownerType,
        ownerId,
        subject,
        title: defaultTitle || "相談ログ",
        content: content.trim(),
      });
      setLogs((current) => [...current, saved]);
      setContent("");
      setState("");
    } catch (error) {
      console.error(error);
      setState("保存失敗");
    }
  }

  return (
    <section className="consultation-panel">
      <div className="consultation-header">
        <h3>相談ログ</h3>
        <span>{state || `${logs.length}件`}</span>
      </div>

      <div className="consultation-body">
        {questions.length > 0 && (
          <nav className="question-index" aria-label="質問目次">
            <div className="question-index-list">
              {questions.map((question) => (
                <a key={question.id} href={`#${question.id}`} title={question.title}>
                  {question.title}
                </a>
              ))}
            </div>
          </nav>
        )}

        <div className="consultation-list">
          {logs.length === 0 ? (
            <p className="consultation-empty">まだ相談ログはありません。</p>
          ) : (
            logViews.filter((log) => log.messages.length > 0).map((log) => (
              <article key={log.id} className="consultation-card">
                <div className="chat-log">
                  {log.messages.map((message) => (
                    <div id={message.anchorId} key={message.anchorId} className={`chat-message ${message.role}`}>
                      <div className="chat-speaker">
                        {message.role === "user" ? "User" : message.role === "assistant" ? "Codex" : "Memo"}
                      </div>
                      <ChatMarkdown text={message.text} />
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

      </div>

      <div className="consultation-form is-hidden" aria-label="相談ログを追加">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="この問題について話したチャットをそのまま貼る"
        />
        <button type="button" onClick={handleAdd} disabled={!content.trim()}>
          チャットを保存
        </button>
      </div>
    </section>
  );
}
