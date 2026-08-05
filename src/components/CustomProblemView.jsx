import React from "react";
import { subjects } from "../data/examMeta.js";
import { AssetPanel } from "./AssetPanel.jsx";

export function CustomProblemView({ problem, saveState, onFieldChange }) {
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

      <section className="memo-panel detail-fields">
        <label>
          タイトル
          <input value={problem.title || ""} onChange={(event) => onFieldChange("title", event.target.value)} />
        </label>
      </section>

      <AssetPanel ownerType="custom_problem" ownerId={problem.id} subject={problem.subject} />
    </section>
  );
}
