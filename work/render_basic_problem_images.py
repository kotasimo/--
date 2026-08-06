from pathlib import Path

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "work" / "basic_04_24.pdf"
OUT = ROOT / "public" / "problems" / "basic"

PAGE_MAP = {
    2024: {"calculus": [2], "linear": [3], "ode": [4], "vector": [5]},
    2023: {"calculus": [8], "linear": [9], "ode": [10], "vector": [11]},
    2022: {"calculus": [14], "linear": [15], "ode": [16], "vector": [17]},
    2021: {"calculus": [20], "linear": [21], "ode": [22], "vector": [23]},
    2019: {"calculus": [27], "linear": [28], "ode": [29], "vector": [30]},
    2018: {"calculus": [35], "linear": [36], "ode": [37], "vector": [38]},
    2017: {"calculus": [42], "linear": [43], "ode": [44], "vector": [45]},
    2016: {"calculus": [49], "linear": [51], "ode": [50], "vector": [52]},
    2015: {"calculus": [56], "linear": [58], "ode": [57], "vector": [59]},
    2014: {"calculus": [63], "linear": [65], "ode": [64], "vector": [66]},
    2013: {"calculus": [70], "linear": [71], "ode": [70], "vector": [71]},
    2012: {"calculus": [75], "linear": [76], "ode": [75], "vector": [76]},
    2011: {"calculus": [80], "linear": [81], "ode": [80], "vector": [81]},
    2010: {"calculus": [85], "linear": [86], "ode": [85], "vector": [86]},
    2009: {"calculus": [91], "linear": [90], "ode": [91], "vector": [90]},
    2008: {"calculus": [95], "linear": [96], "ode": [96], "vector": [96]},
    2007: {"calculus": [101], "linear": [100], "ode": [101], "vector": [100]},
    2006: {"calculus": [106], "linear": [105], "ode": [106], "vector": [105]},
    2005: {"calculus": [110], "linear": [111], "ode": [110], "vector": [111]},
    2004: {"calculus": [115], "linear": [116], "ode": [115], "vector": [116]},
}


def render_page(doc, page_num, zoom=2.2):
    page = doc[page_num - 1]
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def combine_vertical(images):
    max_width = max(image.width for image in images)
    gap = 32
    total_height = sum(image.height for image in images) + gap * (len(images) - 1)
    canvas = Image.new("RGB", (max_width, total_height), "white")
    y = 0
    for image in images:
        x = (max_width - image.width) // 2
        canvas.paste(image, (x, y))
        y += image.height + gap
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    made = []
    for year, subjects in PAGE_MAP.items():
        for subject, pages in subjects.items():
            subject_dir = OUT / subject
            subject_dir.mkdir(parents=True, exist_ok=True)
            images = [render_page(doc, page_num) for page_num in pages]
            output_image = combine_vertical(images)
            output_path = subject_dir / f"{year}_{subject}.jpg"
            output_image.save(output_path, "JPEG", quality=88, optimize=True)
            made.append(output_path)
    print("\n".join(str(path) for path in made))


if __name__ == "__main__":
    main()
