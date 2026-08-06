import React, { useEffect, useState } from "react";
import { subjects } from "../data/examMeta.js";
import { AssetPanel } from "./AssetPanel.jsx";
import { ConsultationPanel } from "./ConsultationPanel.jsx";
import { MemoPanel } from "./StudyView.jsx";

export function CustomProblemView({ problem, mode, saveState, isUnsaved, onSave, onDelete, onModeChange }) {
  const [draft, setDraft] = useState(problem);

  useEffect(() => {
    setDraft(problem);
  }, [problem.id, problem.updated_at]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  if (mode === "edit") {
    return (
      <section className="study-view custom-edit-view">
        <header className="topbar">
          <div>
            <div className="eyebrow">追加問題</div>
            <h2>{isUnsaved ? "新規追加" : "編集"}</h2>
          </div>
          {saveState === "保存失敗" && (
            <div className="status needs-attention">{saveState}</div>
          )}
        </header>

        <section className="custom-edit-panel">
          <div className="custom-edit-grid">
            <label>
              タイトル
              <input value={draft.title || ""} onChange={(event) => updateDraft("title", event.target.value)} />
            </label>
            <label>
              教科
              <select value={draft.subject} onChange={(event) => updateDraft("subject", event.target.value)}>
                {Object.entries(subjects).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="custom-edit-save-row">
            <button className="primary-action-button" type="button" onClick={() => onSave(draft)}>
              保存
            </button>
          </div>
        </section>

        <AssetPanel ownerType="custom_problem" ownerId={problem.id} subject={draft.subject} title="問題画像" fixedAssetType="問題" />
        <AssetPanel ownerType="custom_problem" ownerId={problem.id} subject={draft.subject} title="解答画像" fixedAssetType="解答" />
      </section>
    );
  }

  return (
    <section className="study-view">
      <header className="topbar">
        <div>
          <h2>{problem.title || "新しい問題"}</h2>
        </div>
        <div className="detail-header-actions">
          <button className="secondary-action-button" type="button" onClick={() => onModeChange("edit")}>
            編集
          </button>
          <button className="danger-action-button" type="button" onClick={() => onDelete(problem)}>
            削除
          </button>
          <div className={`status ${saveState === "保存中" ? "saving" : ""} ${saveState !== "保存済み" ? "needs-attention" : ""}`}>{saveState}</div>
        </div>
      </header>

      <div className="view-switch" aria-label="表示切り替え">
        <button className={mode === "problem" ? "active" : ""} type="button" onClick={() => onModeChange("problem")}>
          問題を表示
        </button>
        <button className={mode === "answer" ? "active" : ""} type="button" onClick={() => onModeChange("answer")}>
          解答を表示
        </button>
        <button className={mode === "logs" ? "active" : ""} type="button" onClick={() => onModeChange("logs")}>
          チャット
        </button>
        <button className={mode === "memo" ? "active" : ""} type="button" onClick={() => onModeChange("memo")}>
          メモ
        </button>
      </div>

      {mode === "problem" && (
        <AssetPanel ownerType="custom_problem" ownerId={problem.id} subject={problem.subject} title="問題画像" fixedAssetType="問題" editable={false} />
      )}
      {mode === "answer" && (
        <AssetPanel ownerType="custom_problem" ownerId={problem.id} subject={problem.subject} title="解答画像" fixedAssetType="解答" editable={false} />
      )}
      {mode === "logs" && (
        <ConsultationPanel
          ownerType="custom_problem"
          ownerId={problem.id}
          subject={problem.subject}
          defaultTitle={problem.title || "追加問題"}
        />
      )}
      {mode === "memo" && <MemoPanel memo={problem.memo || ""} onMemoSave={(value) => onSave({ ...problem, memo: value })} />}
    </section>
  );
}
