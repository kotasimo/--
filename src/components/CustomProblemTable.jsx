import React from "react";
import { subjects } from "../data/examMeta.js";

export function CustomProblemTable({ currentSubject, problems, saveLabel, onCreate, onOpen, onCellChange }) {
  const subject = subjects[currentSubject];

  return (
    <section className="home-view">
      <header className="topbar">
        <div>
          <div className="eyebrow">追加問題</div>
          <h2>{subject.label} 追加問題記録</h2>
        </div>
        <div className="status">
          <span>{problems.length}件</span>
          <small>{saveLabel}</small>
        </div>
      </header>

      <section className="overview-panel">
        <div className="overview-header">
          <h3>追加問題一覧</h3>
          <button className="small-action-button" type="button" onClick={onCreate}>
            + 新規追加
          </button>
        </div>
        <div className="mobile-detail-guide">
          スマホでは左のメニューから追加問題を選んで、詳細画面で確認します。
        </div>
        <div className="overview-scroll">
          <table className="overview-table custom-table">
            <thead>
              <tr>
                <th>タイトル</th>
                <th>問題</th>
                <th>解答</th>
                <th>チャット</th>
                <th>記録</th>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={problem.id}>
                  <th scope="row">
                    <input
                      className="table-input"
                      type="text"
                      value={problem.title || ""}
                      onChange={(event) => onCellChange(problem.id, "title", event.target.value)}
                    />
                  </th>
                  <td>
                    <button className="open-problem-button status-dot-button" type="button" title={`${problem.title || "追加問題"}の問題を表示`} aria-label={`${problem.title || "追加問題"}の問題を表示`} onClick={() => onOpen(problem.id, "problem")}>
                      ●
                    </button>
                  </td>
                  <td>
                    <button className="open-problem-button status-dot-button" type="button" title={`${problem.title || "追加問題"}の解答を表示`} aria-label={`${problem.title || "追加問題"}の解答を表示`} onClick={() => onOpen(problem.id, "answer")}>
                      ●
                    </button>
                  </td>
                  <td>
                    <button className="open-problem-button status-dot-button" type="button" title={`${problem.title || "追加問題"}のチャットを表示`} aria-label={`${problem.title || "追加問題"}のチャットを表示`} onClick={() => onOpen(problem.id, "logs")}>
                      ●
                    </button>
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="text"
                      value={problem.short_memo || ""}
                      onChange={(event) => onCellChange(problem.id, "short_memo", event.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      className={`open-problem-button memo-open-button ${problem.memo?.trim() ? "has-note" : ""}`}
                      type="button"
                      title={`${problem.title || "追加問題"}のメモを表示`}
                      aria-label={`${problem.title || "追加問題"}のメモを表示`}
                      onClick={() => onOpen(problem.id, "memo")}
                    >
                      {problem.memo?.trim() ? "●" : "-"}
                    </button>
                  </td>
                </tr>
              ))}
              {problems.length === 0 && (
                <tr>
                  <td className="empty-row" colSpan="6">
                    まだ追加問題がありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
