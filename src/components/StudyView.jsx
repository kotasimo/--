import React from "react";
import { problemImagePath, subjects } from "../data/examMeta.js";
import { ImagePanel } from "./ImagePanel.jsx";

export function StudyView({
  subjectKey,
  year,
  mode,
  memo,
  saveState,
  zoom,
  onMemoChange,
  onModeChange,
  onZoomChange,
}) {
  const subject = subjects[subjectKey];
  const answer = window.answerImages?.[subjectKey]?.[year];
  const solution = window.solutionNotes?.[subjectKey]?.[year];
  const problemSrc = problemImagePath(subjectKey, year);

  return (
    <section className="study-view">
      <header className="topbar">
        <div>
          <div className="eyebrow">{subject.label}</div>
          <h2>{year}年度</h2>
        </div>
        <div className={`status ${saveState === "保存中" ? "saving" : ""}`}>{saveState}</div>
      </header>

      <section className="memo-panel">
        <label htmlFor="memoInput">この年度のメモ</label>
        <textarea
          id="memoInput"
          value={memo}
          onChange={(event) => onMemoChange(event.target.value)}
          placeholder="例: 運動方程式の立て方で詰まった。次はモード解析を復習。"
        />
      </section>

      <div className="view-switch" aria-label="表示切り替え">
        <button className={mode === "problem" ? "active" : ""} type="button" onClick={() => onModeChange("problem")}>
          問題を表示
        </button>
        <button className={mode === "answer" ? "active" : ""} type="button" onClick={() => onModeChange("answer")}>
          解答を表示
        </button>
        <label className="zoom-control" htmlFor="imageZoom">
          <span>画像サイズ</span>
          <input
            id="imageZoom"
            type="range"
            min="60"
            max="140"
            step="5"
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
          />
          <output htmlFor="imageZoom">{zoom}%</output>
        </label>
      </div>

      {mode === "problem" ? (
        <ImagePanel
          title="問題画像"
          openLabel="画像だけ開く"
          src={problemSrc}
          alt={`${year}年度 ${subject.label} 問題画像`}
        />
      ) : (
        <AnswerPanel answer={answer} solution={solution} subject={subject} year={year} />
      )}

    </section>
  );
}

function AnswerPanel({ answer, solution, subject, year }) {
  if (!answer && !solution) {
    return (
      <section className="solution-panel">
        <div className="solution-header">
          <h3>解答</h3>
          <p>ノートPDFから拾った該当ページ</p>
        </div>
        <div className="empty-state">この年度の解答メモはまだありません。</div>
      </section>
    );
  }

  return (
    <section className="solution-panel">
      <div className="solution-header">
        <h3>解答</h3>
        <p>ノートPDFから拾った該当ページ</p>
      </div>
      <div className="answer-content">
        {answer && (
          <>
            <div className="answer-toolbar">
              <span>ノートPDF p.{answer.pages}</span>
              <a href={answer.path} target="_blank" rel="noreferrer">画像だけ開く</a>
            </div>
            <img className="answer-image" src={answer.path} alt={`${year}年度 ${subject.label} 手書き解答`} />
          </>
        )}
        {solution && (
          <details className="solution-outline">
            <summary>概略メモも見る</summary>
            <h4>{solution.title}</h4>
            <ol>
              {solution.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="formula-list">
              {solution.formulas.map((formula) => (
                <code key={formula}>{formula}</code>
              ))}
            </div>
            <p className="solution-note">{solution.note}</p>
          </details>
        )}
      </div>
    </section>
  );
}
