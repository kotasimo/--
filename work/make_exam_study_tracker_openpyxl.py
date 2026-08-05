from pathlib import Path

from openpyxl import Workbook
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule


ROOT = Path(r"C:/Users/kotas/Documents/Codex/2026-07-14/ko")
OUT_DIR = ROOT / "outputs" / "exam_study_tracker_linked"
OUT = OUT_DIR / "nagoya_exam_study_tracker_linked_excel_hyperlinks.xlsx"
PROBLEMS = OUT_DIR / "problems"

YEARS = [2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006]
SUBJECTS = [
    ("振動", "vibration"),
    ("熱力", "thermo"),
    ("材力", "material"),
    ("流体", "fluid"),
]
HEADERS = [
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
]


def style_sheet(ws, subject_key):
    dark = "263238"
    header = "455A64"
    alt = "E0F7FA"
    thin = Side(style="thin", color="CFD8DC")

    ws.merge_cells("A1:M1")
    ws["A1"] = f"{ws.title} 過去問記録"
    ws["A1"].fill = PatternFill("solid", fgColor=dark)
    ws["A1"].font = Font(bold=True, color="FFFFFF", size=16)
    ws["A1"].alignment = Alignment(vertical="center")
    ws.row_dimensions[1].height = 24

    for col, h in enumerate(HEADERS, 1):
        cell = ws.cell(2, col, h)
        cell.fill = PatternFill("solid", fgColor=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = Border(top=thin, bottom=thin, left=thin, right=thin)

    for r, year in enumerate(YEARS, 3):
        values = [year, "開く", "未着手", None, None, None, None, None, None, None, None, 0, None]
        for c, value in enumerate(values, 1):
            cell = ws.cell(r, c, value)
            cell.border = Border(top=thin, bottom=thin, left=thin, right=thin)
            if r % 2 == 1:
                cell.fill = PatternFill("solid", fgColor=alt)
            if c in [8, 9, 10, 13]:
                cell.alignment = Alignment(wrap_text=True, vertical="top")
            else:
                cell.alignment = Alignment(vertical="center")

        link_cell = ws.cell(r, 2)
        target = PROBLEMS / subject_key / f"{year}_{subject_key}.jpg"
        link_cell.hyperlink = str(target)
        link_cell.style = "Hyperlink"
        link_cell.alignment = Alignment(horizontal="center", vertical="center")

    widths = {
        "A": 8, "B": 9, "C": 12, "D": 10, "E": 10, "F": 10, "G": 10,
        "H": 28, "I": 28, "J": 28, "K": 10, "L": 10, "M": 24,
        "O": 14, "P": 14,
    }
    for col, width in widths.items():
        ws.column_dimensions[col].width = width

    ws.freeze_panes = "A3"

    dv_status = DataValidation(type="list", formula1='"未着手,途中,完了,要復習,解き直し済"', allow_blank=True)
    dv_score = DataValidation(type="whole", operator="between", formula1="1", formula2="5", allow_blank=True)
    dv_pct = DataValidation(type="decimal", operator="between", formula1="0", formula2="1", allow_blank=True)
    dv_time = DataValidation(type="whole", operator="between", formula1="0", formula2="300", allow_blank=True)
    dv_pri = DataValidation(type="list", formula1='"A,B,C"', allow_blank=True)
    for dv, rng in [
        (dv_status, "C3:C20"),
        (dv_score, "D3:E20"),
        (dv_pct, "F3:F20"),
        (dv_time, "G3:G20"),
        (dv_pri, "K3:K20"),
    ]:
        ws.add_data_validation(dv)
        dv.add(rng)

    for row in range(3, 21):
        ws.cell(row, 6).number_format = "0%"
        ws.cell(row, 7).number_format = "0"
        ws.cell(row, 12).number_format = "0"

    ws.conditional_formatting.add(
        "C3:C20",
        FormulaRule(formula=['C3="完了"'], fill=PatternFill("solid", fgColor="E8F5E9"), font=Font(color="1B5E20")),
    )
    ws.conditional_formatting.add(
        "C3:C20",
        FormulaRule(formula=['C3="要復習"'], fill=PatternFill("solid", fgColor="FFF3E0"), font=Font(color="E65100")),
    )
    ws.conditional_formatting.add(
        "K3:K20",
        FormulaRule(formula=['K3="A"'], fill=PatternFill("solid", fgColor="FFEBEE"), font=Font(color="B71C1C", bold=True)),
    )

    tab = Table(displayName=f"{subject_key}Log", ref="A2:M20")
    tab.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True, showFirstColumn=False, showLastColumn=False)
    ws.add_table(tab)

    summary = [
        ("集計", ""),
        ("完了", '=COUNTIF(C3:C20,"完了")+COUNTIF(C3:C20,"解き直し済")'),
        ("要復習", '=COUNTIF(C3:C20,"要復習")'),
        ("平均手ごたえ", '=IFERROR(AVERAGE(D3:D20),"")'),
        ("平均難易度", '=IFERROR(AVERAGE(E3:E20),"")'),
    ]
    for i, (label, formula) in enumerate(summary, 2):
        ws.cell(i, 15, label)
        ws.cell(i, 16, formula)
        for c in [15, 16]:
            ws.cell(i, c).border = Border(top=thin, bottom=thin, left=thin, right=thin)
    ws["O2"].fill = PatternFill("solid", fgColor=header)
    ws["P2"].fill = PatternFill("solid", fgColor=header)
    ws["O2"].font = ws["P2"].font = Font(bold=True, color="FFFFFF")
    for r in range(3, 7):
        ws.cell(r, 15).fill = PatternFill("solid", fgColor="ECEFF1")
        ws.cell(r, 15).font = Font(bold=True)
        ws.cell(r, 16).fill = PatternFill("solid", fgColor="FAFAFA")
        ws.cell(r, 16).alignment = Alignment(horizontal="right")
    ws["P5"].number_format = "0.0"
    ws["P6"].number_format = "0.0"


def main():
    wb = Workbook()
    wb.remove(wb.active)
    for subject_name, subject_key in SUBJECTS:
        ws = wb.create_sheet(subject_name)
        style_sheet(ws, subject_key)
    wb.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
