from pathlib import Path

import pypdfium2 as pdfium


folder = Path(r"C:/Users/kotas/OneDrive - 国立大学法人東海国立大学機構/新しいフォルダー/専門")
for pdf_path in sorted(folder.glob("ノート*.pdf")):
    pdf = pdfium.PdfDocument(str(pdf_path))
    print(f"{pdf_path.name}\t{len(pdf)}")
