from pathlib import Path
import contextlib
import io
import re

from pypdf import PdfReader


folder = Path(r"C:/Users/kotas/OneDrive - 国立大学法人東海国立大学機構/新しいフォルダー/専門")
out = Path(r"C:/Users/kotas/Documents/Codex/2026-07-14/ko/work/year_hits.tsv")
years = [str(y) for y in range(2006, 2025)]

lines = ["file\tpage\tyears\ttext"]
for pdf_path in sorted(folder.glob("ノート*.pdf")):
    with contextlib.redirect_stderr(io.StringIO()):
        reader = PdfReader(str(pdf_path))
        for i, page in enumerate(reader.pages, start=1):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            found = sorted(set(re.findall(r"20(?:0[6-9]|1[0-9]|2[0-4])", text)))
            if found:
                compact = " ".join(text.split())[:220].replace("\t", " ")
                lines.append(f"{pdf_path.name}\t{i}\t{','.join(found)}\t{compact}")

out.write_text("\n".join(lines), encoding="utf-8")
print(out)
