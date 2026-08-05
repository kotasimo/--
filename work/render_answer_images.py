from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(r"C:\Users\kotas\OneDrive - 国立大学法人東海国立大学機構\新しいフォルダー\専門")
OUTPUT_DIR = ROOT / "outputs" / "problem_site" / "answers"

SUBJECTS = {
    "vibration": {
        "pdf": "ノート（振動工学）.pdf",
        "starts": {
            2024: 96,
            2023: 100,
            2022: 105,
            2021: 109,
            2019: 115,
            2018: 120,
            2017: 125,
            2016: 130,
            2015: 133,
            2014: 136,
            2013: 139,
            2012: 142,
            2011: 145,
            2010: 148,
            2009: 151,
            2008: 156,
            2007: 158,
            2006: 161,
        },
    },
    "thermo": {
        "pdf": "ノート（熱力学）.pdf",
        "starts": {
            2024: 65,
            2023: 68,
            2022: 71,
            2021: 74,
            2019: 77,
            2018: 81,
            2017: 84,
            2016: 87,
            2015: 89,
            2014: 92,
            2013: 94,
            2012: 97,
            2011: 100,
            2010: 102,
            2009: 104,
            2008: 107,
            2007: 109,
            2006: 111,
        },
    },
    "material": {
        "pdf": "ノート（材料力学）.pdf",
        "starts": {
            2024: 83,
            2023: 87,
            2022: 90,
            2021: 94,
            2019: 98,
            2018: 103,
            2017: 106,
            2016: 110,
            2015: 113,
            2014: 115,
            2013: 118,
            2012: 120,
            2011: 122,
            2010: 126,
            2009: 129,
            2008: 132,
            2007: 135,
            2006: 138,
        },
    },
    "fluid": {
        "pdf": "ノート（流体力学）.pdf",
        "starts": {
            2024: 109,
            2023: 113,
            2022: 116,
            2021: 119,
            2019: 123,
            2018: 125,
            2017: 129,
            2016: 132,
            2015: 135,
            2014: 137,
            2013: 139,
            2012: 142,
            2011: 144,
            2010: 147,
            2009: 149,
            2008: 151,
            2007: 153,
            2006: 156,
        },
    },
}


def page_ranges(starts, page_count):
    ordered = sorted(starts.items(), key=lambda item: item[1])
    ranges = {}
    for index, (year, start) in enumerate(ordered):
        next_start = ordered[index + 1][1] if index + 1 < len(ordered) else page_count + 1
        ranges[year] = (start, min(next_start - 1, page_count))
    return ranges


def render_page(page, scale=1.55):
    bitmap = page.render(scale=scale)
    image = bitmap.to_pil().convert("RGB")
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


def crop_first_page_to_answer(image):
    gray = image.convert("L")
    width, height = gray.size
    pixels = gray.load()
    row_counts = []
    for y in range(height):
        count = 0
        for x in range(0, width, 3):
            if pixels[x, y] < 170:
                count += 1
        row_counts.append(count)

    window = 9
    smoothed = []
    for y in range(height):
        start = max(0, y - window)
        end = min(height, y + window + 1)
        smoothed.append(sum(row_counts[start:end]) / (end - start))

    threshold = width / 3 * 0.002
    blank_runs = []
    in_blank = False
    start = 0
    for y in range(int(height * 0.35), int(height * 0.92)):
        is_blank = smoothed[y] < threshold
        if is_blank and not in_blank:
            start = y
            in_blank = True
        elif not is_blank and in_blank:
            if y - start >= 22:
                blank_runs.append((start, y))
            in_blank = False

    if in_blank and int(height * 0.92) - start >= 22:
        blank_runs.append((start, int(height * 0.92)))

    bottom_has_content = sum(row_counts[int(height * 0.72) :]) > width * 0.6
    if not blank_runs or not bottom_has_content:
        return None

    crop_run = max(blank_runs, key=lambda run: run[1] - run[0])
    crop_top = crop_run[1] + 8
    if crop_top > height * 0.88 or height - crop_top < height * 0.12:
        return None
    return image.crop((0, crop_top, width, height))


def lower_half_ink_count(image):
    gray = image.convert("L")
    width, height = gray.size
    pixels = gray.load()
    total = 0
    for y in range(int(height * 0.45), height):
        for x in range(0, width, 4):
            if pixels[x, y] < 170:
                total += 1
    return total


def main():
    manifest = {}
    for subject_key, info in SUBJECTS.items():
        pdf_path = SOURCE_DIR / info["pdf"]
        document = pdfium.PdfDocument(str(pdf_path))
        output_subject = OUTPUT_DIR / subject_key
        output_subject.mkdir(parents=True, exist_ok=True)
        manifest[subject_key] = {}

        for year, (start, end) in page_ranges(info["starts"], len(document)).items():
            images = []
            for page_number in range(start, end + 1):
                image = render_page(document[page_number - 1])
                if page_number == start:
                    image = crop_first_page_to_answer(image)
                    if image is None:
                        continue
                elif lower_half_ink_count(image) < 1000:
                    continue
                images.append(image)
            if not images:
                images = [render_page(document[start - 1])]
            combined = combine_pages(images)
            out_name = f"{year}_{subject_key}_answer.jpg"
            out_path = output_subject / out_name
            combined.save(out_path, "JPEG", quality=86, optimize=True)
            manifest[subject_key][year] = {
                "path": f"./answers/{subject_key}/{out_name}",
                "pages": f"{start}-{end}" if start != end else str(start),
            }
            print(f"{subject_key} {year}: p{start}-{end} -> {out_path}")
        document.close()

    lines = ["window.answerImages = {"]
    for subject_key, years in manifest.items():
        lines.append(f"  {subject_key}: {{")
        for year in sorted(years.keys(), reverse=True):
            data = years[year]
            lines.append(f"    {year}: {{ path: \"{data['path']}\", pages: \"{data['pages']}\" }},")
        lines.append("  },")
    lines.append("};")
    (ROOT / "outputs" / "problem_site" / "answers.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
