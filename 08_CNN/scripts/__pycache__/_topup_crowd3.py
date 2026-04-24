from pathlib import Path
from icrawler.builtin import BingImageCrawler

base = Path(r"08_CNN/data/crowd/raw")
queries = {
    "low_crowd": [
        "almost empty airport gate",
        "few passengers airport hallway",
        "quiet airport lounge",
        "empty airport security line",
        "sparse boarding gate passengers",
    ],
    "high_crowd": [
        "airport terminal crowd",
        "passengers waiting at gate",
        "people waiting in airport",
        "busy airport hall",
        "airport line many people",
    ],
}

for cls, qlist in queries.items():
    out = base / cls
    out.mkdir(parents=True, exist_ok=True)
    for q in qlist:
        crawler = BingImageCrawler(storage={"root_dir": str(out)})
        crawler.crawl(keyword=q, max_num=60, min_size=(256, 256))
