import React from "react";
import { years, subjects } from "../data/examMeta.js";

export function Sidebar({
  appMode,
  currentSubject,
  currentYear,
  currentView,
  selectedCustomId,
  customProblems,
  hasMemo,
  onAppModeChange,
  onSubjectChange,
  onYearOpen,
  onCustomOpen,
  onCustomCreate,
}) {
  return (
    <aside className="sidebar">
      <div className="title">
        <h1>過去問メモ</h1>
        <p>問題ごとに資料を見ながら整理</p>
      </div>

      <div className="mode-tabs" aria-label="種類">
        <button
          className={appMode === "past" ? "active" : ""}
          type="button"
          onClick={() => onAppModeChange("past")}
        >
          過去問
        </button>
        <button
          className={appMode === "custom" ? "active" : ""}
          type="button"
          onClick={() => onAppModeChange("custom")}
        >
          追加問題
        </button>
      </div>

      <div className="subject-tabs" aria-label="科目">
        {Object.entries(subjects).map(([key, subject]) => (
          <button
            key={key}
            className={`subject-tab ${currentSubject === key ? "active" : ""}`}
            type="button"
            onClick={() => onSubjectChange(key)}
          >
            {subject.label}
          </button>
        ))}
      </div>

      {appMode === "past" ? (
        <div className="year-list" aria-label="年度">
          {years.map((year) => (
            <button
              key={year}
              className={[
                "year-button",
                currentView === "study" && currentYear === year ? "active" : "",
                hasMemo(currentSubject, year) ? "has-note" : "",
              ].join(" ")}
              type="button"
              onClick={() => onYearOpen(year, "problem")}
            >
              {year}
            </button>
          ))}
        </div>
      ) : (
        <div className="year-list" aria-label="追加問題">
          <button className="create-button" type="button" onClick={onCustomCreate}>
            + 新規追加
          </button>
          {customProblems.map((problem) => (
            <button
              key={problem.id}
              className={["year-button", selectedCustomId === problem.id ? "active" : ""].join(" ")}
              type="button"
              onClick={() => onCustomOpen(problem.id)}
            >
              {problem.title || "新しい問題"}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
