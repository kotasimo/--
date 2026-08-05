from pathlib import Path

from pypdf import PdfReader

folder = Path(r"C:/Users/kotas/OneDrive - 国立大学法人東海国立大学機構/新しいフォルダー/専門")
for pdf_path in sorted(folder.glob("ノート*.pdf")):
    print("==", pdf_path.name)
    reader = PdfReader(str(pdf_path))
    hits = []
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        if any(str(y) in text for y in range(2006, 2025)):
            compact = " ".join(text.split())[:140]
            hits.append((i, compact))
    for p, t in hits[:80]:
        print(p, t)
    print("hits", len(hits))
