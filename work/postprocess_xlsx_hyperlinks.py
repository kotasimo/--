from __future__ import annotations

import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(r"C:/Users/kotas/Documents/Codex/2026-07-14/ko")
BOOK = ROOT / "outputs" / "exam_study_tracker_linked" / "nagoya_exam_study_tracker_linked.xlsx"
OUT = ROOT / "outputs" / "exam_study_tracker_linked" / "nagoya_exam_study_tracker_linked_clickable.xlsx"
PROBLEMS = ROOT / "outputs" / "exam_study_tracker_linked" / "problems"

YEARS = [2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006]
SHEETS = [
    ("振動", "vibration"),
    ("熱力", "thermo"),
    ("材力", "material"),
    ("流体", "fluid"),
]

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

ET.register_namespace("", NS_MAIN)
ET.register_namespace("r", NS_REL)


def q(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


def file_uri(path: Path) -> str:
    return "file:///" + path.as_posix().replace(" ", "%20")


def sheet_xml_paths(z: zipfile.ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    id_to_target = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall(q(NS_PKG_REL, "Relationship"))
    }
    out = {}
    for sheet in workbook.find(q(NS_MAIN, "sheets")):
        name = sheet.attrib["name"]
        rid = sheet.attrib[q(NS_REL, "id")]
        target = id_to_target[rid]
        if target.startswith("/"):
            target = target.lstrip("/")
        elif not target.startswith("xl/"):
            target = "xl/" + target
        out[name] = target.replace("\\", "/")
    return out


def set_cell_inline_string(sheet_root: ET.Element, ref: str, value: str) -> None:
    sheet_data = sheet_root.find(q(NS_MAIN, "sheetData"))
    row_num = int("".join(ch for ch in ref if ch.isdigit()))
    row = None
    for candidate in sheet_data.findall(q(NS_MAIN, "row")):
        if candidate.attrib.get("r") == str(row_num):
            row = candidate
            break
    if row is None:
        row = ET.SubElement(sheet_data, q(NS_MAIN, "row"), {"r": str(row_num)})

    cell = None
    for candidate in row.findall(q(NS_MAIN, "c")):
        if candidate.attrib.get("r") == ref:
            cell = candidate
            break
    if cell is None:
        cell = ET.SubElement(row, q(NS_MAIN, "c"), {"r": ref})

    for child in list(cell):
        cell.remove(child)
    cell.attrib["t"] = "inlineStr"
    inline = ET.SubElement(cell, q(NS_MAIN, "is"))
    text = ET.SubElement(inline, q(NS_MAIN, "t"))
    text.text = value


def next_rid(rels_root: ET.Element) -> int:
    max_id = 0
    for rel in rels_root.findall(q(NS_PKG_REL, "Relationship")):
        rid = rel.attrib.get("Id", "")
        if rid.startswith("rId") and rid[3:].isdigit():
            max_id = max(max_id, int(rid[3:]))
    return max_id + 1


def add_hyperlinks(sheet_xml: bytes, rels_xml: bytes | None, subject_key: str) -> tuple[bytes, bytes]:
    sheet_root = ET.fromstring(sheet_xml)
    rels_root = (
        ET.fromstring(rels_xml)
        if rels_xml
        else ET.Element(q(NS_PKG_REL, "Relationships"))
    )

    existing = sheet_root.find(q(NS_MAIN, "hyperlinks"))
    if existing is not None:
        sheet_root.remove(existing)

    hyperlinks = ET.Element(q(NS_MAIN, "hyperlinks"))
    rid_num = next_rid(rels_root)
    for idx, year in enumerate(YEARS, start=3):
        ref = f"B{idx}"
        target = file_uri(PROBLEMS / subject_key / f"{year}_{subject_key}.jpg")
        rid = f"rId{rid_num}"
        rid_num += 1
        ET.SubElement(
            rels_root,
            q(NS_PKG_REL, "Relationship"),
            {
                "Id": rid,
                "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                "Target": target,
                "TargetMode": "External",
            },
        )
        ET.SubElement(hyperlinks, q(NS_MAIN, "hyperlink"), {"ref": ref, q(NS_REL, "id"): rid})
        set_cell_inline_string(sheet_root, ref, "開く")

    sheet_data = sheet_root.find(q(NS_MAIN, "sheetData"))
    children = list(sheet_root)
    insert_at = children.index(sheet_data) + 1
    sheet_root.insert(insert_at, hyperlinks)

    return (
        ET.tostring(sheet_root, encoding="utf-8", xml_declaration=True),
        ET.tostring(rels_root, encoding="utf-8", xml_declaration=True),
    )


def main() -> None:
    tmp = OUT.with_suffix(".tmp.xlsx")
    shutil.copyfile(BOOK, tmp)
    with zipfile.ZipFile(BOOK, "r") as src:
        sheet_paths = sheet_xml_paths(src)
        replacements: dict[str, bytes] = {}
        for sheet_name, subject_key in SHEETS:
            xml_path = sheet_paths[sheet_name]
            rels_path = str(Path(xml_path).parent / "_rels" / (Path(xml_path).name + ".rels")).replace("\\", "/")
            sheet_xml = src.read(xml_path)
            rels_xml = src.read(rels_path) if rels_path in src.namelist() else None
            new_sheet, new_rels = add_hyperlinks(sheet_xml, rels_xml, subject_key)
            replacements[xml_path] = new_sheet
            replacements[rels_path] = new_rels

        with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED) as dst:
            written = set()
            for item in src.infolist():
                if item.filename in replacements:
                    dst.writestr(item, replacements[item.filename])
                    written.add(item.filename)
                else:
                    dst.writestr(item, src.read(item.filename))
            for filename, data in replacements.items():
                if filename not in written:
                    dst.writestr(filename, data)
    tmp.unlink(missing_ok=True)
    print(OUT)


if __name__ == "__main__":
    main()
