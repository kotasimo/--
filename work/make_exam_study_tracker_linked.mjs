import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = "C:/Users/kotas/Documents/Codex/2026-07-14/ko";
const outputDir = path.join(root, "outputs", "exam_study_tracker_linked");
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const years = [2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006];
const subjects = [
  { jp: "振動", key: "vibration" },
  { jp: "熱力", key: "thermo" },
  { jp: "材力", key: "material" },
  { jp: "流体", key: "fluid" },
];

const headers = [
  "年度",
  "問題",
  "状態",
  "手ごたえ",
  "難易度",
  "正答率",
  "時間(分)",
  "詰まったこと",
  "必要な公式",
  "次やること",
  "優先度",
  "復習回数",
  "メモ",
];

const statuses = ["未着手", "途中", "完了", "要復習", "解き直し済"];
const priorities = ["A", "B", "C"];

function fileUri(p) {
  return `file:///${p.replaceAll("\\", "/").replaceAll(" ", "%20")}`;
}

function title(sheet, subject) {
  const range = sheet.getRange("A1:M1");
  range.merge();
  range.values = [[`${subject} 過去問記録`]];
  range.format = {
    fill: "#263238",
    font: { bold: true, color: "#FFFFFF", size: 16 },
    verticalAlignment: "center",
  };
  range.format.rowHeight = 30;
}

function setupSubjectSheet(subject) {
  const sheet = wb.worksheets.add(subject.jp);
  sheet.showGridLines = false;
  title(sheet, subject.jp);

  sheet.getRange("A2:M2").values = [headers];
  sheet.getRange("A2:M2").format = {
    fill: "#455A64",
    font: { bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };

  const rows = years.map((year) => [year, "", "未着手", "", "", "", "", "", "", "", "", 0, ""]);
  sheet.getRange(`A3:M${years.length + 2}`).values = rows;

  for (let i = 0; i < years.length; i++) {
    const row = i + 3;
    const imgPath = path.join(outputDir, "problems", subject.key, `${years[i]}_${subject.key}.jpg`);
    const uri = fileUri(imgPath);
    sheet.getRange(`B${row}`).formulas = [[`=HYPERLINK("${uri}","開く")`]];
  }

  sheet.getRange(`A2:M${years.length + 2}`).format.borders = {
    insideHorizontal: { style: "thin", color: "#E0E0E0" },
    insideVertical: { style: "thin", color: "#EEEEEE" },
    top: { style: "thin", color: "#B0BEC5" },
    bottom: { style: "thin", color: "#B0BEC5" },
    left: { style: "thin", color: "#B0BEC5" },
    right: { style: "thin", color: "#B0BEC5" },
  };

  sheet.getRange(`C3:C${years.length + 2}`).dataValidation = { rule: { type: "list", values: statuses } };
  sheet.getRange(`D3:E${years.length + 2}`).dataValidation = { rule: { type: "whole", operator: "between", formula1: 1, formula2: 5 } };
  sheet.getRange(`F3:F${years.length + 2}`).dataValidation = { rule: { type: "decimal", operator: "between", formula1: 0, formula2: 1 } };
  sheet.getRange(`G3:G${years.length + 2}`).dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 300 } };
  sheet.getRange(`K3:K${years.length + 2}`).dataValidation = { rule: { type: "list", values: priorities } };

  sheet.getRange(`B3:B${years.length + 2}`).format = {
    font: { color: "#0B57D0", underline: true },
    horizontalAlignment: "center",
  };
  sheet.getRange(`F3:F${years.length + 2}`).setNumberFormat("0%");
  sheet.getRange(`G3:G${years.length + 2}`).setNumberFormat("0");
  sheet.getRange(`L3:L${years.length + 2}`).setNumberFormat("0");
  sheet.getRange(`H3:M${years.length + 2}`).format.wrapText = true;

  sheet.getRange(`C3:C${years.length + 2}`).conditionalFormats.add("containsText", {
    text: "完了",
    format: { fill: "#E8F5E9", font: { color: "#1B5E20" } },
  });
  sheet.getRange(`C3:C${years.length + 2}`).conditionalFormats.add("containsText", {
    text: "要復習",
    format: { fill: "#FFF3E0", font: { color: "#E65100" } },
  });
  sheet.getRange(`K3:K${years.length + 2}`).conditionalFormats.add("containsText", {
    text: "A",
    format: { fill: "#FFEBEE", font: { bold: true, color: "#B71C1C" } },
  });

  sheet.getRange("A:A").format.columnWidth = 8;
  sheet.getRange("B:B").format.columnWidth = 9;
  sheet.getRange("C:C").format.columnWidth = 12;
  sheet.getRange("D:E").format.columnWidth = 10;
  sheet.getRange("F:G").format.columnWidth = 10;
  sheet.getRange("H:J").format.columnWidth = 28;
  sheet.getRange("K:L").format.columnWidth = 10;
  sheet.getRange("M:M").format.columnWidth = 24;
  sheet.freezePanes.freezeRows(2);
  sheet.tables.add(`A2:M${years.length + 2}`, true, `${subject.key}Log`);

  sheet.getRange("O2:P6").values = [
    ["集計", ""],
    ["完了", ""],
    ["要復習", ""],
    ["平均手ごたえ", ""],
    ["平均難易度", ""],
  ];
  sheet.getRange("P3").formulas = [[`=COUNTIF(C3:C20,"完了")+COUNTIF(C3:C20,"解き直し済")`]];
  sheet.getRange("P4").formulas = [[`=COUNTIF(C3:C20,"要復習")`]];
  sheet.getRange("P5").formulas = [[`=IFERROR(AVERAGE(D3:D20),"")`]];
  sheet.getRange("P6").formulas = [[`=IFERROR(AVERAGE(E3:E20),"")`]];
  sheet.getRange("O2:P2").format = { fill: "#455A64", font: { bold: true, color: "#FFFFFF" } };
  sheet.getRange("O3:O6").format = { fill: "#ECEFF1", font: { bold: true } };
  sheet.getRange("P3:P6").format = { fill: "#FAFAFA", horizontalAlignment: "right" };
  sheet.getRange("O2:P6").format.borders = { preset: "all", style: "thin", color: "#CFD8DC" };
  sheet.getRange("P5:P6").setNumberFormat("0.0");
  sheet.getRange("O:P").format.columnWidth = 14;
}

for (const subject of subjects) setupSubjectSheet(subject);

const previewFiles = [];
for (const subject of subjects) {
  const preview = await wb.render({ sheetName: subject.jp, autoCrop: "all", scale: 1, format: "png" });
  const previewPath = path.join(outputDir, `${subject.key}_sheet_preview.png`);
  await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
  previewFiles.push(previewPath);
}

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
});
await fs.writeFile(path.join(outputDir, "formula_error_scan.ndjson"), errors.ndjson ?? "");

const outPath = path.join(outputDir, "nagoya_exam_study_tracker_linked.xlsx");
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(outPath);
console.log(JSON.stringify({ output: outPath, previews: previewFiles }, null, 2));
