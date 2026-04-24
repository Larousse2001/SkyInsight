from pathlib import Path
import os
import shutil

from icrawler.builtin import BingImageCrawler

# ==============================
# CONFIGURATION (YOUR CLASSES)
# ==============================

DATASET = {
    "cabin_clean": [
        "clean airplane cabin",
        "tidy aircraft interior",
        "empty airplane seats clean"
    ],
    "cabin_dirty": [
        "dirty airplane cabin trash",
        "messy airplane seats garbage",
        "unclean aircraft interior",
        "airplane cabin maintenance issue",
        "broken airplane seat",
        "aircraft cabin worn seats"
    ],
    "airport_crowded": [
        "crowded airport terminal",
        "busy airport waiting area",
        "long queue airport boarding"
    ],
    "airport_not_crowded": [
        "empty airport terminal",
        "quiet airport waiting area",
        "few passengers airport"
    ],
    "baggage_good": [
        "new suitcase airport",
        "good condition luggage",
        "intact baggage airport"
    ],
    "baggage_damaged": [
        "broken suitcase airport",
        "damaged luggage airport",
        "torn baggage airport"
    ]
}

MAX_IMAGES_PER_CLASS = 120
FILE_PREFIX = "pics_"
MAX_WORKERS = 10

# ==============================
# UTIL FUNCTIONS
# ==============================

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "dataset"


def create_folder(path):
    Path(path).mkdir(parents=True, exist_ok=True)


def count_files(path):
    return len([p for p in Path(path).iterdir() if p.is_file()])


def merge_files_unique(src_dir, dst_dir, start_index):
    """Move files from src_dir to dst_dir using unique names taswira_XXXXX.ext."""
    moved = 0
    for file_path in sorted(Path(src_dir).glob("*")):
        if not file_path.is_file():
            continue
        ext = file_path.suffix.lower() or ".jpg"
        target = Path(dst_dir) / f"{FILE_PREFIX}{start_index + moved:05d}{ext}"
        shutil.move(str(file_path), str(target))
        moved += 1
    return moved


def add_prefix_to_existing_files(path, prefix=FILE_PREFIX):
    for file_path in Path(path).glob("*"):
        if not file_path.is_file():
            continue
        if file_path.name.startswith(prefix):
            continue
        target_path = file_path.with_name(f"{prefix}{file_path.name}")
        if target_path.exists():
            continue
        file_path.rename(target_path)


def download_images_with_bing(query, folder, max_images=50):
    crawler = BingImageCrawler(storage={"root_dir": str(folder)})
    crawler.crawl(keyword=query, max_num=max_images, min_size=(100, 100))


# ==============================
# MAIN LOGIC
# ==============================

def build_dataset():
    create_folder(OUTPUT_DIR)
    print(f"Saving downloads into: {OUTPUT_DIR}")

    for label, queries in DATASET.items():
        print(f"\n=== Downloading class: {label} ===")

        class_path = OUTPUT_DIR / label
        create_folder(class_path)

        per_query = max(1, MAX_IMAGES_PER_CLASS // len(queries))
        downloaded_before = count_files(class_path)

        for i, query in enumerate(queries):
            print(f"  -> query: {query}")

            # Download each query into temp folder to avoid filename collisions.
            temp_path = class_path / f"_tmp_query_{i}"
            create_folder(temp_path)
            download_images_with_bing(query, temp_path, per_query)

            moved = merge_files_unique(temp_path, class_path, count_files(class_path))
            shutil.rmtree(temp_path, ignore_errors=True)
            print(f"     moved {moved} files from query {i + 1}")

        downloaded_after = count_files(class_path)
        add_prefix_to_existing_files(class_path, FILE_PREFIX)
        print(f"Saved {downloaded_after - downloaded_before} files in {class_path}")

    print(f"\nDone. Images are in: {OUTPUT_DIR}")


if __name__ == "__main__":
    build_dataset()