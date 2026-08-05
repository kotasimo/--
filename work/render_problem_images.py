from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image


ROOT = Path(r"C:/Users/kotas/Documents/Codex/2026-07-14/ko")
PDF = ROOT.parent / "専門問題06-24.pdf"
OUT = ROOT / "outputs" / "exam_study_tracker_linked" / "problems"

PAGE_MAP = {
    2024: {"thermo": [2], "fluid": [3], "vibration": [4, 5], "material": [8]},
    2023: {"thermo": [10], "fluid": [11], "vibration": [12, 13], "material": [16]},
    2022: {"thermo": [18], "fluid": [19], "vibration": [20], "material": [23]},
    2021: {"thermo": [25], "fluid": [26], "vibration": [27, 28], "material": [31]},
    2019: {"thermo": [33], "fluid": [34], "vibration": [35], "material": [38]},
    2018: {"thermo": [41], "fluid": [42], "vibration": [43], "material": [45]},
    2017: {"thermo": [48], "fluid": [49], "vibration": [50], "material": [52]},
    2016: {"thermo": [57, 58], "fluid": [57, 58], "vibration": [59, 60], "material": [55, 56]},
    2015: {"thermo": [64, 65], "fluid": [64, 65], "vibration": [66, 67], "material": [62, 63]},
    2014: {"thermo": [71, 72], "fluid": [71, 72], "vibration": [73, 74], "material": [69, 70]},
    2013: {"thermo": [78, 79], "fluid": [78, 79], "vibration": [80, 81], "material": [76, 77]},
    2012: {"thermo": [85, 86], "fluid": [85, 86], "vibration": [87, 88], "material": [83, 84]},
    2011: {"thermo": [92, 93], "fluid": [92, 93], "vibration": [94, 95], "material": [90, 91]},
    2010: {"thermo": [99, 100], "fluid": [99, 100], "vibration": [101, 102], "material": [97, 98]},
    2009: {"thermo": [106, 107], "fluid": [106, 107], "vibration": [108, 109], "material": [104, 105]},
    2008: {"thermo": [113, 114], "fluid": [113, 114], "vibration": [115, 116, 117], "material": [111, 112]},
    2007: {"thermo": [122, 123], "fluid": [122, 123], "vibration": [124, 125], "material": [119, 120, 121]},
    2006: {"thermo": [129, 130], "fluid": [129, 130], "vibration": [131], "material": [127, 128]},
}


def render_page(pdf, page_num, scale=2.0):
    page = pdf[page_num - 1]
    bitmap = page.render(scale=scale)
    image = bitmap.to_pil().convert("RGB")
    bg = Image.new("RGB", image.size, "white")
    bg.paste(image)
    return bg


def combine_vertical(images):
    max_width = max(img.width for img in images)
    gap = 28
    total_height = sum(img.height for img in images) + gap * (len(images) - 1)
    canvas = Image.new("RGB", (max_width, total_height), "white")
    y = 0
    for img in images:
        x = (max_width - img.width) // 2
        canvas.paste(img, (x, y))
        y += img.height + gap
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pdf = pdfium.PdfDocument(str(PDF))
    made = []
    for year, subjects in PAGE_MAP.items():
        for subject, pages in subjects.items():
            subject_dir = OUT / subject
            subject_dir.mkdir(parents=True, exist_ok=True)
            images = [render_page(pdf, p) for p in pages]
            combined = combine_vertical(images)
            output = subject_dir / f"{year}_{subject}.jpg"
            combined.save(output, "JPEG", quality=88, optimize=True)
            made.append(str(output))
    print("\n".join(made))


if __name__ == "__main__":
    main()
