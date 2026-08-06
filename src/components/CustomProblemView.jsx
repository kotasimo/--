import React from "react";
import { subjects } from "../data/examMeta.js";
import { AssetPanel } from "./AssetPanel.jsx";
import { ConsultationPanel } from "./ConsultationPanel.jsx";
import { MemoPanel } from "./StudyView.jsx";

export function CustomProblemView({ problem, mode, saveState, onFieldChange, onModeChange }) {
  const subject = subjects[problem.subject];

  return (
    <section className="study-view">
      <header className="topbar">
        <div>
          <div className="eyebrow">{subject.label} 追加問題</div>
          <h2>{problem.title || "新しい問題"}</h2>
        </div>
        <div className={`status ${saveState === "保存中" ? "saving" : ""}`}>{saveState}</div>
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
        <AssetPanel ownerType="custom_problem" ownerId={problem.id} subject={problem.subject} title="問題画像" fixedAssetType="問題" />
      )}
      {mode === "answer" && (
        <AssetPanel ownerType="custom_problem" ownerId={problem.id} subject={problem.subject} title="解答画像" fixedAssetType="解答" />
      )}
      {mode === "logs" && (
        <ConsultationPanel
          ownerType="custom_problem"
          ownerId={problem.id}
          subject={problem.subject}
          defaultTitle={problem.title || "追加問題"}
        />
      )}
      {mode === "memo" && (
        <section className="custom-memo-view">
          <section className="memo-panel detail-fields">
            <label>
              タイトル
              <input value={problem.title || ""} onChange={(event) => onFieldChange("title", event.target.value)} />
            </label>
            <label>
              教科
              <select value={problem.subject} onChange={(event) => onFieldChange("subject", event.target.value)}>
                {Object.entries(subjects).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <MemoPanel memo={problem.memo || ""} onMemoSave={(value) => onFieldChange("memo", value)} />
        </section>
      )}
    </section>
  );
}
