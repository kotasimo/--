from pathlib import Path
from math import ceil

import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFont


SRC = Path(r"C:/Users/kotas/OneDrive - 国立大学法人東海国立大学機構/新しいフォルダー/専門")
OUT = Path(r"C:/Users/kotas/Documents/Codex/2026-07-14/ko/work/note_contacts")
OUT.mkdir(parents=True, exist_ok=True)

CONTACT_COLS = 4
CONTACT_ROWS = 3
THUMB_W = 360
LABEL_H = 24
GAP = 18


def render_page(pdf, idx):
    page = pdf[idx]
    bitmap = page.render(scale=0.42)
    img = bitmap.to_pil().convert("RGB")
    ratio = THUMB_W / img.width
    return img.resize((THUMB_W, int(img.height * ratio)), Image.LANCZOS)


def make_contacts(pdf_path: Path):
    pdf = pdfium.PdfDocument(str(pdf_path))
    subject = pdf_path.stem.replace("ノート（", "").replace("）", "")
    thumbs = []
    for i in range(len(pdf)):
        img = render_page(pdf, i)
        thumbs.append((i + 1, img))

    per = CONTACT_COLS * CONTACT_ROWS
    for chunk_i in range(ceil(len(thumbs) / per)):
        chunk = thumbs[chunk_i * per : (chunk_i + 1) * per]
        cell_h = max(img.height for _, img in chunk) + LABEL_H
        canvas_w = CONTACT_COLS * THUMB_W + (CONTACT_COLS + 1) * GAP
        canvas_h = CONTACT_ROWS * cell_h + (CONTACT_ROWS + 1) * GAP
        canvas = Image.new("RGB", (canvas_w, canvas_h), "white")
        draw = ImageDraw.Draw(canvas)
        for j, (page_no, img) in enumerate(chunk):
            r, c = divmod(j, CONTACT_COLS)
            x = GAP + c * (THUMB_W + GAP)
            y = GAP + r * (cell_h + GAP)
            draw.text((x, y), f"p{page_no}", fill=(190, 0, 0))
            canvas.paste(img, (x, y + LABEL_H))
        out = OUT / f"{subject}_{chunk_i + 1:02d}_p{chunk[0][0]:03d}-{chunk[-1][0]:03d}.jpg"
        canvas.save(out, "JPEG", quality=88)
        print(out)


for p in sorted(SRC.glob("ノート*.pdf")):
    make_contacts(p)
