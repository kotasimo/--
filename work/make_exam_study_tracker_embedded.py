from pathlib import Path
from math import ceil

from PIL import Image as PILImage
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule


ROOT = Path(r"C:/Users/kotas/Documents/Codex/2026-07-14/ko")
OUT_DIR = ROOT / "outputs" / "exam_study_tracker_embedded"
PROBLEM_SRC = ROOT / "outputs" / "exam_study_tracker_linked" / "problems"
OUT = OUT_DIR / "nagoya_exam_study_tracker_embedded_questions.xlsx"

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


def safe_sheet_ref(sheet_name: str, cell: str) -> str:
    return f"#'{sheet_name}'!{cell}"


def prepare_problem_image(subject_key: str, year: int, max_width: int = 760) -> Path:
    src = PROBLEM_SRC / subject_key / f"{year}_{subject_key}.jpg"
    dst_dir = OUT_DIR / "embedded_images" / subject_key
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst = dst_dir / f"{year}_{subject_key}_embedded.jpg"
    with PILImage.open(src) as img:
        img = img.convert("RGB")
        if img.width > max_width:
            ratio = max_width / img.width
            img = img.resize((max_width, int(img.height * ratio)), PILImage.LANCZOS)
        img.save(dst, "JPEG", quality=86, optimize=True)
    return dst


def setup_problem_sheet(wb: Workbook, subject_name: str, subject_key: str) -> dict[int, str]:
    ws = wb.create_sheet(f"{subject_name}_問題")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 110
    ws.column_dimensions["B"].width = 3

    anchors: dict[int, str] = {}
    row = 1
    for year in YEARS:
        anchor = f"A{row}"
        anchors[year] = anchor
        ws[anchor] = f"{year} {subject_name}"
        ws[anchor].fill = PatternFill("solid", fgColor="263238")
        ws[anchor].font = Font(bold=True, color="FFFFFF", size=14)
        ws[anchor].alignment = Alignment(vertical="center")
        ws.row_dimensions[row].height = 24

        img_path = prepare_problem_image(subject_key, year)
        with PILImage.open(img_path) as im:
            width, height = im.size
        xl_img = XLImage(str(img_path))
        xl_img.width = width
        xl_img.height = height
        ws.add_image(xl_img, f"A{row + 1}")

        rows_for_image = ceil(height / 20) + 3
        row += rows_for_image

    ws.freeze_panes = "A1"
    return anchors


def setup_log_sheet(wb: Workbook, subject_name: str, subject_key: str, anchors: dict[int, str]) -> None:
    ws = wb.create_sheet(subject_name)
    ws.sheet_view.showGridLines = False
    dark = "263238"
    header = "455A64"
    alt = "E0F7FA"
    thin = Side(style="thin", color="CFD8DC")

    ws.merge_cells("A1:M1")
    ws["A1"] = f"{subject_name} 過去問記録"
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

    problem_sheet = f"{subject_name}_問題"
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
        link_cell.hyperlink = safe_sheet_ref(problem_sheet, anchors[year])
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

    validations = [
        (DataValidation(type="list", formula1='"未着手,途中,完了,要復習,解き直し済"', allow_blank=True), "C3:C20"),
        (DataValidation(type="whole", operator="between", formula1="1", formula2="5", allow_blank=True), "D3:E20"),
        (DataValidation(type="decimal", operator="between", formula1="0", formula2="1", allow_blank=True), "F3:F20"),
        (DataValidation(type="whole", operator="between", formula1="0", formula2="300", allow_blank=True), "G3:G20"),
        (DataValidation(type="list", formula1='"A,B,C"', allow_blank=True), "K3:K20"),
    ]
    for dv, rng in validations:
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


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    wb.remove(wb.active)

    anchors_by_subject = {}
    for subject_name, subject_key in SUBJECTS:
        anchors_by_subject[subject_name] = setup_problem_sheet(wb, subject_name, subject_key)
    for subject_name, subject_key in SUBJECTS:
        setup_log_sheet(wb, subject_name, subject_key, anchors_by_subject[subject_name])

    # Put the record sheets first.
    ordered = [wb[s] for s, _ in SUBJECTS] + [wb[f"{s}_問題"] for s, _ in SUBJECTS]
    wb._sheets = ordered
    wb.active = 0
    wb.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
