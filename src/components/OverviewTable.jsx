import React from "react";
import { subjects, tableColumns, years } from "../data/examMeta.js";

export function OverviewTable({
  currentSubject,
  getCell,
  hasMemo,
  hasTableEntry,
  saveLabel,
  onCellChange,
  onOpenStudy,
}) {
  const subject = subjects[currentSubject];
  const filledCount = years.filter((year) => hasTableEntry(currentSubject, year)).length;

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
        <div className="overview-scroll">
          <table className="overview-table">
            <thead>
              <tr>
                {["年度", "問題", "解答", ...tableColumns.map((column) => column.label), "問題メモ"].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year}>
                  <th scope="row">{year}</th>
                  <td>
                    <button className="open-problem-button" type="button" onClick={() => onOpenStudy(year, "problem")}>
                      開く
                    </button>
                  </td>
                  <td>
                    <button className="open-problem-button" type="button" onClick={() => onOpenStudy(year, "answer")}>
                      開く
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
                  <td className={`memo-state ${hasMemo(currentSubject, year) ? "has-note" : ""}`}>
                    {hasMemo(currentSubject, year) ? "あり" : "なし"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
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
