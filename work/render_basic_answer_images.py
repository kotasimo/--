from pathlib import Path

import fitz
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "answers"

SOURCES = {
    "linear": {
        "pdf": Path(r"C:\Users\kotas\AppData\Local\Temp\ノート（線形代数）.pdf"),
        "ranges": {
            2024: (19, 21),
            2023: (22, 24),
            2022: (25, 29),
            2021: (30, 31),
            2019: (32, 34),
            2018: (35, 36),
            2017: (37, 39),
            2016: (40, 42),
            2015: (43, 45),
            2014: (46, 47),
            2013: (48, 49),
            2012: (50, 51),
            2011: (52, 55),
            2010: (56, 57),
            2009: (58, 59),
            2008: (60, 61),
            2007: (62, 64),
            2006: (65, 66),
            2005: (67, 69),
            2004: (70, 71),
        },
    },
    "calculus": {
        "pdf": Path(r"C:\Users\kotas\AppData\Local\Temp\ノート（基礎）.pdf"),
        "ranges": {
            2024: (1, 3),
            2023: (10, 13),
            2022: (20, 21),
            2021: (29, 30),
            2019: (36, 39),
            2018: (46, 48),
            2017: (55, 56),
            2016: (64, 65),
            2015: (74, 76),
            2014: (80, 81),
            2013: (91, 92),
            2012: (93, 94),
            2011: (98, 98),
            2010: (103, 103),
            2009: (112, 112),
            2008: (115, 116),
            2005: (121, 122),
            2004: (123, 125),
        },
    },
    "ode": {
        "pdf": Path(r"C:\Users\kotas\AppData\Local\Temp\ノート（基礎）.pdf"),
        "ranges": {
            2024: (4, 6),
            2023: (14, 16),
            2022: (22, 23),
            2021: (31, 33),
            2019: (40, 41),
            2018: (49, 50),
            2017: (57, 60),
            2016: (66, 70),
            2015: (77, 77),
            2014: (82, 84),
            2013: (87, 87),
            2012: (95, 96),
            2011: (99, 100),
            2010: (104, 105),
            2009: (111, 111),
            2007: (117, 117),
            2006: (118, 120),
        },
    },
    "vector": {
        "pdf": Path(r"C:\Users\kotas\AppData\Local\Temp\ノート（基礎）.pdf"),
        "ranges": {
            2024: (7, 9),
            2023: (17, 19),
            2022: (24, 28),
            2021: (34, 35),
            2019: (42, 45),
            2018: (51, 54),
            2017: (61, 63),
            2016: (71, 73),
            2015: (78, 79),
            2014: (85, 86),
            2013: (88, 90),
            2012: (97, 97),
            2011: (101, 102),
            2010: (106, 107),
            2009: (108, 110),
            2008: (113, 114),
            2004: (126, 129),
        },
    },
}


def render_page(page, scale=1.55):
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return ImageOps.autocontrast(image, cutoff=1)


def combine_pages(images):
    gap = 22
    width = max(image.width for image in images)
    height = sum(image.height for image in images) + gap * (len(images) - 1)
    combined = Image.new("RGB", (width, height), "white")
    y = 0
    for image in images:
        x = (width - image.width) // 2
        combined.paste(image, (x, y))
        y += image.height + gap
    return combined


def main():
    for subject_key, info in SOURCES.items():
        doc = fitz.open(info["pdf"])
        subject_dir = OUTPUT_DIR / subject_key
        subject_dir.mkdir(parents=True, exist_ok=True)
        for year, (start, end) in info["ranges"].items():
            images = [render_page(doc[page_number - 1]) for page_number in range(start, end + 1)]
            out_path = subject_dir / f"{year}_{subject_key}_answer.jpg"
            combine_pages(images).save(out_path, "JPEG", quality=86, optimize=True)
            pages = f"{start}-{end}" if start != end else str(start)
            print(f"{subject_key} {year}: p{pages} -> {out_path}")
        doc.close()


if __name__ == "__main__":
    main()
