import React, { useEffect, useRef, useState } from "react";
import { problemImagePath, subjects, tableColumns } from "../data/examMeta.js";
import { AssetPanel } from "./AssetPanel.jsx";
import {
  getChatgptConversation,
  listChatgptConversations,
} from "../services/chatgptConversationRepository.js";
import { listAssetsForOwners } from "../services/assetRepository.js";
import { pastExamOwnerId } from "../services/consultationRepository.js";

export function OverviewTable({
  currentSubject,
  years,
  getCell,
  hasMemo,
  hasTableEntry,
  saveLabel,
  onCellChange,
  onOpenStudy,
}) {
  const subject = subjects[currentSubject];
  const filledCount = years.filter((year) => hasTableEntry(currentSubject, year)).length;
  const [modal, setModal] = useState(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [chatgptOwnerIds, setChatgptOwnerIds] = useState(() => new Set());
  const [assetOwnerIds, setAssetOwnerIds] = useState(() => new Set());

  useEffect(() => {
    if (modal?.type === "memo") {
      setMemoDraft(getCell(currentSubject, modal.year, "memo"));
    }
  }, [modal, currentSubject, getCell]);

  useEffect(() => {
    let cancelled = false;
    const ownerIds = years.map((year) => pastExamOwnerId(currentSubject, year));

    listChatgptConversations("past_exam", ownerIds)
      .then((items) => {
        if (!cancelled) setChatgptOwnerIds(new Set(items.map((item) => item.owner_id)));
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setChatgptOwnerIds(new Set());
      });

    listAssetsForOwners("past_exam", ownerIds)
      .then((items) => {
        if (!cancelled) setAssetOwnerIds(new Set(items.map((item) => item.owner_id)));
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setAssetOwnerIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [currentSubject, years]);

  function openModal(type, year) {
    setModal({ type, year });
  }

  async function openChatgpt(year) {
    const chatWindow = window.open("about:blank", "_blank");
    if (chatWindow) chatWindow.opener = null;
    try {
      const item = await getChatgptConversation("past_exam", pastExamOwnerId(currentSubject, year));
      if (item?.chatgpt_url) {
        if (chatWindow) {
          chatWindow.location.href = item.chatgpt_url;
        } else {
          window.open(item.chatgpt_url, "_blank", "noopener,noreferrer");
        }
        return;
      }
    } catch (error) {
      console.error(error);
    }
    if (chatWindow) chatWindow.close();
    onOpenStudy(year, "logs");
  }

  function closeModal() {
    setModal(null);
  }

  function saveMemo() {
    if (!modal?.year) return;
    onCellChange(currentSubject, modal.year, "memo", memoDraft);
  }

  function markAssetsSaved(ownerId) {
    setAssetOwnerIds((current) => new Set(current).add(ownerId));
  }

  return (
    <section className="home-view">
      <header className="topbar">
        <div>
          <div className="eyebrow">記録表</div>
          <h2>{subject.label} 過去問記録</h2>
        </div>
        <div className="status">
          <span>{filledCount} / {years.length}</span>
          <small>{saveLabel}</small>
        </div>
      </header>

      <section className="overview-panel">
        <div className="overview-header">
          <h3>年度別記録</h3>
          <p>表の記録と、問題画面のメモは別々に保存されます。</p>
        </div>
        <div className="mobile-detail-guide">
          スマホでは左のメニューから年度を選んで、問題の詳細画面で確認します。
        </div>
        <div className="overview-scroll">
          <table className="overview-table">
            <thead>
              <tr>
                {["年度", "問題", "解答", "チャット", "画像", ...tableColumns.map((column) => column.label), "メモ"].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year}>
                  <th scope="row">{year}</th>
                  <td>
                    <button className="open-problem-button status-dot-button" type="button" title={`${year}年度の問題を表示`} aria-label={`${year}年度の問題を表示`} onClick={() => openModal("problem", year)}>
                      ●
                    </button>
                  </td>
                  <td>
                    <button className="open-problem-button status-dot-button" type="button" title={`${year}年度の解答を表示`} aria-label={`${year}年度の解答を表示`} onClick={() => openModal("answer", year)}>
                      ●
                    </button>
                  </td>
                  <td>
                    <button className={`open-problem-button status-dot-button ${chatgptOwnerIds.has(pastExamOwnerId(currentSubject, year)) ? "has-note" : ""}`} type="button" title={`${year}年度のChatGPTを開く`} aria-label={`${year}年度のChatGPTを開く`} onClick={() => openChatgpt(year)}>
                      {chatgptOwnerIds.has(pastExamOwnerId(currentSubject, year)) ? "●" : "-"}
                    </button>
                  </td>
                  <td>
                    <button className={`open-problem-button status-dot-button ${assetOwnerIds.has(pastExamOwnerId(currentSubject, year)) ? "has-note" : ""}`} type="button" title={`${year}年度の画像を表示`} aria-label={`${year}年度の画像を表示`} onClick={() => openModal("assets", year)}>
                      {assetOwnerIds.has(pastExamOwnerId(currentSubject, year)) ? "●" : "-"}
                    </button>
                  </td>
                  {tableColumns.map((column) => (
                    <td key={column.key}>
                      <TableInput
                        column={column}
                        value={getCell(currentSubject, year, column.key)}
                        onChange={(value) => onCellChange(currentSubject, year, column.key, value)}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className={`open-problem-button memo-open-button ${hasMemo(currentSubject, year) ? "has-note" : ""}`}
                      type="button"
                      title={`${year}年度のメモを表示`}
                      aria-label={`${year}年度のメモを表示`}
                      onClick={() => openModal("memo", year)}
                    >
                      {hasMemo(currentSubject, year) ? "●" : "-"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <OverviewModal
          modal={modal}
          subject={subject}
          currentSubject={currentSubject}
          memoDraft={memoDraft}
          onClose={closeModal}
          onMemoDraftChange={setMemoDraft}
          onMemoSave={saveMemo}
          onAssetSaved={markAssetsSaved}
          onOpenDetail={onOpenStudy}
        />
      )}
    </section>
  );
}

function OverviewModal({
  modal,
  subject,
  currentSubject,
  memoDraft,
  onClose,
  onMemoDraftChange,
  onMemoSave,
  onAssetSaved,
  onOpenDetail,
}) {
  const memoTextareaRef = useRef(null);
  const [isMemoEditing, setIsMemoEditing] = useState(false);

  useEffect(() => {
    setIsMemoEditing(false);
  }, [modal.year, modal.type]);

  useEffect(() => {
    if (modal.type !== "memo" || !isMemoEditing || !memoTextareaRef.current) return;
    const textarea = memoTextareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [modal.type, memoDraft, isMemoEditing]);

  function handleMemoSave() {
    onMemoSave();
    setIsMemoEditing(false);
  }

  const titleMap = {
    problem: "問題",
    answer: "解答",
    assets: "画像",
    memo: "メモ",
  };
  const title = `${modal.year}年度 ${subject.label} ${titleMap[modal.type]}`;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`overview-modal ${modal.type === "memo" ? "memo-modal" : ""}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="overview-modal-header">
          <h3>{title}</h3>
          <div className="overview-modal-actions">
            {modal.type !== "memo" && (
              <button type="button" onClick={() => onOpenDetail(modal.year, modal.type)}>
                詳細で開く
              </button>
            )}
            <button type="button" onClick={onClose}>閉じる</button>
          </div>
        </div>
        <div className="overview-modal-body">
          {modal.type === "problem" && <ProblemPreview currentSubject={currentSubject} subject={subject} year={modal.year} />}
          {modal.type === "answer" && <AnswerPreview currentSubject={currentSubject} subject={subject} year={modal.year} />}
          {modal.type === "assets" && (
            <AssetPanel
              ownerType="past_exam"
              ownerId={pastExamOwnerId(currentSubject, modal.year)}
              subject={currentSubject}
              title="追加画像"
              displayMode="large"
              onAssetSaved={() => onAssetSaved(pastExamOwnerId(currentSubject, modal.year))}
            />
          )}
          {modal.type === "memo" && (
            <div className="memo-modal-editor">
              {isMemoEditing ? (
                <textarea
                  ref={memoTextareaRef}
                  rows={5}
                  value={memoDraft}
                  onChange={(event) => onMemoDraftChange(event.target.value)}
                  placeholder="この問題のメモを書く"
                />
              ) : (
                <div className={`memo-modal-view ${memoDraft.trim() ? "" : "empty"}`}>
                  {memoDraft.trim() || "まだメモはありません。"}
                </div>
              )}
              <div className="memo-modal-actions">
                {isMemoEditing ? (
                  <button type="button" onClick={handleMemoSave}>保存</button>
                ) : (
                  <button type="button" onClick={() => setIsMemoEditing(true)}>編集</button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProblemPreview({ currentSubject, subject, year }) {
  const src = problemImagePath(currentSubject, year);
  return <img className="modal-preview-image" src={src} alt={`${year}年度 ${subject.label} 問題`} />;
}

function AnswerPreview({ currentSubject, subject, year }) {
  const answer = window.answerImages?.[currentSubject]?.[year];
  const solution = window.solutionNotes?.[currentSubject]?.[year];

  if (!answer && !solution) {
    return <div className="empty-state">この年度の解答メモはまだありません。</div>;
  }

  return (
    <div className="answer-modal-preview">
      {answer && <img className="modal-preview-image" src={answer.path} alt={`${year}年度 ${subject.label} 解答`} />}
      {solution && (
        <details className="solution-outline">
          <summary>概略メモも見る</summary>
          <h4>{solution.title}</h4>
          <ol>
            {solution.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function TableInput({ column, value, onChange }) {
  if (column.type === "select") {
    return (
      <select className="table-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {column.options.map((optionValue) => (
          <option key={optionValue || "-"} value={optionValue}>
            {optionValue || "-"}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className="table-input"
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
