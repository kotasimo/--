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
        <div className="overview-scroll">
          <table className="overview-table custom-table">
            <thead>
              <tr>
                <th>タイトル</th>
                <th>問題</th>
                <th>一言メモ</th>
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
                    <button className="open-problem-button" type="button" onClick={() => onOpen(problem.id)}>
                      開く
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
                </tr>
              ))}
              {problems.length === 0 && (
                <tr>
                  <td className="empty-row" colSpan="3">
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
