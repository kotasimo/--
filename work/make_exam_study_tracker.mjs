import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = "C:/Users/kotas/Documents/Codex/2026-07-14/ko";
const outputDir = path.join(root, "outputs", "exam_study_tracker");
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();

const years = [2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006];
const subjects = ["振動", "熱力", "材力", "流体"];
const statuses = ["未着手", "途中", "完了", "要復習", "解き直し済"];
const priorities = ["A: すぐ復習", "B: 今週復習", "C: 余裕があれば"];

const headers = [
  "年度",
  "科目",
  "問題テーマ",
  "解いた日",
  "状態",
  "手ごたえ(1-5)",
  "難易度(1-5)",
  "正答率",
  "所要時間(分)",
  "できたこと",
  "詰まったポイント",
  "必要公式・定理",
  "復習アクション",
  "復習期限",
  "復習回数",
  "次回優先度",
  "メモ",
];

const topicSeed = {
  "振動": "例: 1自由度, 強制振動, モード, ラプラス, 安定性",
  "熱力": "例: 状態方程式, 第一法則, エントロピー, サイクル, 伝熱",
  "材力": "例: はり, たわみ, 不静定, ねじり, 熱応力, 主応力",
  "流体": "例: ベルヌーイ, 運動量, 管路, 境界層, 次元解析",
};

const rows = [];
for (const y of years) {
  for (const s of subjects) {
    rows.push([
      y,
      s,
      topicSeed[s],
      null,
      "未着手",
      null,
      null,
      null,
      null,
      "",
      "",
      "",
      "",
      null,
      0,
      "",
      "",
    ]);
  }
}

function styleTitle(sheet, range, title) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[title]];
  r.format = {
    fill: "#243447",
    font: { bold: true, color: "#FFFFFF", size: 16 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  r.format.rowHeight = 30;
}

function setHeaderStyle(range, fill = "#315C72") {
  range.format = {
    fill,
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
}

function addLightBorders(range) {
  range.format.borders = { preset: "outside", style: "thin", color: "#AAB7C4" };
}

const record = wb.worksheets.add("記録");
record.showGridLines = false;
styleTitle(record, "A1:Q1", "名大院試 過去問 学習記録");
record.getRange("A2:Q2").values = [headers];
record.getRange(`A3:Q${rows.length + 2}`).values = rows;
setHeaderStyle(record.getRange("A2:Q2"));
record.getRange(`A2:Q${rows.length + 2}`).format.borders = {
  insideHorizontal: { style: "thin", color: "#E2E8F0" },
  insideVertical: { style: "thin", color: "#F1F5F9" },
  top: { style: "thin", color: "#CBD5E1" },
  bottom: { style: "thin", color: "#CBD5E1" },
  left: { style: "thin", color: "#CBD5E1" },
  right: { style: "thin", color: "#CBD5E1" },
};
record.getRange("A:A").format.columnWidth = 8;
record.getRange("B:B").format.columnWidth = 8;
record.getRange("C:C").format.columnWidth = 34;
record.getRange("D:D").format.columnWidth = 12;
record.getRange("E:E").format.columnWidth = 12;
record.getRange("F:G").format.columnWidth = 12;
record.getRange("H:H").format.columnWidth = 10;
record.getRange("I:I").format.columnWidth = 12;
record.getRange("J:M").format.columnWidth = 30;
record.getRange("N:N").format.columnWidth = 12;
record.getRange("O:P").format.columnWidth = 12;
record.getRange("Q:Q").format.columnWidth = 28;
record.getRange("A2:Q2").format.rowHeight = 32;
record.getRange(`J3:Q${rows.length + 2}`).format.wrapText = true;
record.getRange(`D3:D${rows.length + 2}`).setNumberFormat("yyyy-mm-dd");
record.getRange(`N3:N${rows.length + 2}`).setNumberFormat("yyyy-mm-dd");
record.getRange(`H3:H${rows.length + 2}`).setNumberFormat("0%");
record.getRange(`I3:I${rows.length + 2}`).setNumberFormat("0");
record.getRange(`O3:O${rows.length + 2}`).setNumberFormat("0");
record.freezePanes.freezeRows(2);
record.getRange(`E3:E${rows.length + 2}`).dataValidation = { rule: { type: "list", values: statuses } };
record.getRange(`F3:G${rows.length + 2}`).dataValidation = { rule: { type: "whole", operator: "between", formula1: 1, formula2: 5 } };
record.getRange(`H3:H${rows.length + 2}`).dataValidation = { rule: { type: "decimal", operator: "between", formula1: 0, formula2: 1 } };
record.getRange(`I3:I${rows.length + 2}`).dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 300 } };
record.getRange(`P3:P${rows.length + 2}`).dataValidation = { rule: { type: "list", values: priorities } };
record.getRange(`E3:E${rows.length + 2}`).conditionalFormats.add("containsText", { text: "完了", format: { fill: "#DCFCE7", font: { color: "#14532D" } } });
record.getRange(`E3:E${rows.length + 2}`).conditionalFormats.add("containsText", { text: "要復習", format: { fill: "#FEF3C7", font: { color: "#92400E" } } });
record.getRange(`F3:F${rows.length + 2}`).conditionalFormats.add("cellIs", { operator: "lessThanOrEqual", formula: 2, format: { fill: "#FEE2E2", font: { color: "#991B1B" } } });
record.getRange(`P3:P${rows.length + 2}`).conditionalFormats.add("containsText", { text: "A:", format: { fill: "#FEE2E2", font: { bold: true, color: "#991B1B" } } });
record.tables.add(`A2:Q${rows.length + 2}`, true, "StudyLog");

const dash = wb.worksheets.add("ダッシュボード");
dash.showGridLines = false;
styleTitle(dash, "A1:H1", "進捗ダッシュボード");
dash.getRange("A3:B8").values = [
  ["総行数", rows.length],
  ["完了数", null],
  ["要復習数", null],
  ["平均手ごたえ", null],
  ["平均難易度", null],
  ["総学習時間(分)", null],
];
dash.getRange("B4").formulas = [["=COUNTIF('記録'!E3:E74,\"完了\")+COUNTIF('記録'!E3:E74,\"解き直し済\")"]];
dash.getRange("B5").formulas = [["=COUNTIF('記録'!E3:E74,\"要復習\")"]];
dash.getRange("B6").formulas = [["=IFERROR(AVERAGE('記録'!F3:F74),\"\")"]];
dash.getRange("B7").formulas = [["=IFERROR(AVERAGE('記録'!G3:G74),\"\")"]];
dash.getRange("B8").formulas = [["=SUM('記録'!I3:I74)"]];
dash.getRange("A3:A8").format = { fill: "#E2E8F0", font: { bold: true } };
dash.getRange("B3:B8").format = { fill: "#F8FAFC", font: { bold: true, size: 13 }, horizontalAlignment: "right" };
dash.getRange("B6:B7").setNumberFormat("0.0");
dash.getRange("B8").setNumberFormat("0");
addLightBorders(dash.getRange("A3:B8"));

dash.getRange("D3:H3").values = [["科目", "完了", "要復習", "平均手ごたえ", "平均難易度"]];
setHeaderStyle(dash.getRange("D3:H3"));
dash.getRange("D4:D7").values = subjects.map((s) => [s]);
for (let r = 4; r <= 7; r++) {
  dash.getRange(`E${r}`).formulas = [[`=COUNTIFS('記録'!$B$3:$B$74,D${r},'記録'!$E$3:$E$74,"完了")+COUNTIFS('記録'!$B$3:$B$74,D${r},'記録'!$E$3:$E$74,"解き直し済")`]];
  dash.getRange(`F${r}`).formulas = [[`=COUNTIFS('記録'!$B$3:$B$74,D${r},'記録'!$E$3:$E$74,"要復習")`]];
  dash.getRange(`G${r}`).formulas = [[`=IFERROR(AVERAGEIFS('記録'!$F$3:$F$74,'記録'!$B$3:$B$74,D${r}),"")`]];
  dash.getRange(`H${r}`).formulas = [[`=IFERROR(AVERAGEIFS('記録'!$G$3:$G$74,'記録'!$B$3:$B$74,D${r}),"")`]];
}
dash.getRange("D3:H7").format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
dash.getRange("G4:H7").setNumberFormat("0.0");
dash.getRange("A10:H10").values = [["使い方", "", "", "", "", "", "", ""]];
dash.getRange("A10:H10").merge();
dash.getRange("A10:H10").format = { fill: "#315C72", font: { bold: true, color: "#FFFFFF" } };
dash.getRange("A11:H16").values = [
  ["1", "解いたら「記録」シートの該当年度・科目の行を埋める。", "", "", "", "", "", ""],
  ["2", "手ごたえは 1=全然ダメ, 3=解けたが不安, 5=再現できる。", "", "", "", "", "", ""],
  ["3", "難易度は問題そのものの重さ。手ごたえとは分けて記録する。", "", "", "", "", "", ""],
  ["4", "詰まったポイントには「境界条件」「符号」「公式名」など短く残す。", "", "", "", "", "", ""],
  ["5", "復習アクションは次にやる1手だけを書く。例: 2022材力のカスティリアーノを解き直す。", "", "", "", "", "", ""],
  ["6", "A優先が増えた単元が、次の勉強テーマ。", "", "", "", "", "", ""],
];
dash.getRange("A11:A16").format = { fill: "#E2E8F0", font: { bold: true }, horizontalAlignment: "center" };
dash.getRange("B11:H16").merge(true);
dash.getRange("B11:H16").format.wrapText = true;
dash.getRange("A11:H16").format.borders = { preset: "all", style: "thin", color: "#E2E8F0" };
dash.getRange("A:A").format.columnWidth = 16;
dash.getRange("B:B").format.columnWidth = 14;
dash.getRange("D:H").format.columnWidth = 14;

const subjectChecks = {
  "振動": [
    "運動方程式を立てられたか",
    "固有振動数・減衰比を計算できたか",
    "強制振動の振幅倍率を説明できたか",
    "ラプラス変換・伝達関数とつなげられたか",
    "単位と初期条件を確認したか",
  ],
  "熱力": [
    "閉じた系/開いた系を判別できたか",
    "第一法則の符号を崩さなかったか",
    "エントロピー・可逆不可逆を説明できたか",
    "サイクル効率やCOPを再現できたか",
    "伝熱の境界条件を整理できたか",
  ],
  "材力": [
    "反力・SFD/BMDを描けたか",
    "たわみの境界条件を置けたか",
    "不静定の適合条件を立てられたか",
    "カスティリアーノを使えたか",
    "主応力・ねじり・熱応力を判別できたか",
  ],
  "流体": [
    "連続の式・ベルヌーイを正しく選べたか",
    "運動量式の検査体積を描けたか",
    "管路損失やポンプ項を扱えたか",
    "次元解析・相似則を使えたか",
    "粘性/境界層/圧力分布を説明できたか",
  ],
};

for (const s of subjects) {
  const sh = wb.worksheets.add(s);
  sh.showGridLines = false;
  styleTitle(sh, "A1:H1", `${s} 記録サマリー`);
  sh.getRange("A3:H3").values = [["年度", "状態", "手ごたえ", "難易度", "正答率", "所要時間", "詰まったポイント", "次回優先度"]];
  setHeaderStyle(sh.getRange("A3:H3"));
  sh.getRange("A4:A21").values = years.map((y) => [y]);
  for (let i = 0; i < years.length; i++) {
    const row = 4 + i;
    const recordRow = 3 + i * subjects.length + subjects.indexOf(s);
    sh.getRange(`B${row}:H${row}`).formulas = [[
      `='記録'!E${recordRow}`,
      `='記録'!F${recordRow}`,
      `='記録'!G${recordRow}`,
      `='記録'!H${recordRow}`,
      `='記録'!I${recordRow}`,
      `='記録'!K${recordRow}`,
      `='記録'!P${recordRow}`,
    ]];
  }
  sh.getRange("A3:H21").format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  sh.getRange("E4:E21").setNumberFormat("0%");
  sh.getRange("B4:H21").format.wrapText = true;
  sh.getRange("A:A").format.columnWidth = 8;
  sh.getRange("B:D").format.columnWidth = 11;
  sh.getRange("E:F").format.columnWidth = 11;
  sh.getRange("G:G").format.columnWidth = 34;
  sh.getRange("H:H").format.columnWidth = 16;
  sh.freezePanes.freezeRows(3);
  sh.getRange("J3:K3").values = [["チェック項目", "できた?"]];
  setHeaderStyle(sh.getRange("J3:K3"), "#64748B");
  sh.getRange("J4:J8").values = subjectChecks[s].map((x) => [x]);
  sh.getRange("K4:K8").dataValidation = { rule: { type: "list", values: ["未確認", "OK", "要復習"] } };
  sh.getRange("K4:K8").values = Array(5).fill(["未確認"]);
  sh.getRange("J3:K8").format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
  sh.getRange("J:J").format.columnWidth = 36;
  sh.getRange("K:K").format.columnWidth = 12;
}

const pngs = [];
for (const sheetName of ["ダッシュボード", "記録", "振動", "熱力", "材力", "流体"]) {
  const preview = await wb.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const out = path.join(outputDir, `${sheetName}.png`);
  await fs.writeFile(out, new Uint8Array(await preview.arrayBuffer()));
  pngs.push(out);
}

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
await fs.writeFile(path.join(outputDir, "formula_error_scan.ndjson"), errors.ndjson ?? "");

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(path.join(outputDir, "nagoya_exam_study_tracker.xlsx"));

await fs.writeFile(
  path.join(outputDir, "README.txt"),
  [
    "名大院試 過去問 学習記録テンプレート",
    "",
    "Excelファイル: nagoya_exam_study_tracker.xlsx",
    "主な入力シート: 記録",
    "科目別シート: 振動 / 熱力 / 材力 / 流体",
    "ダッシュボード: 進捗・要復習数・平均手ごたえを自動集計",
    "",
    "手ごたえ: 1=全然ダメ, 3=解けたが不安, 5=再現できる",
    "難易度: 問題そのものの重さ。手ごたえとは別に記録",
  ].join("\n"),
  "utf8",
);

console.log(JSON.stringify({ output: path.join(outputDir, "nagoya_exam_study_tracker.xlsx"), previews: pngs }, null, 2));
