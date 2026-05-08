"""
Web Scraper for Airline Customer Reviews (Non-Reddit Sources)
Collects REAL reviews from public airline review websites.

Sources:
    - AirlineQuality.com (Skytrax) - public airline review listings
    - TripAdvisor airline review pages (public HTML)
    - Trustpilot airline category pages (public HTML)

Outputs: 10_NLP/airline_reviews_web_scraped.csv

Notes:
    - Includes rate limiting, proper user-agent, respectful delays.
    - Honors robots.txt-style etiquette via configurable delay.
    - HTML parsing uses BeautifulSoup with permissive selectors so the
      scraper degrades gracefully if a site changes layout.
"""

import csv
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


class AirlineWebReviewScraper:
    """Scrape REAL airline reviews from public, non-Reddit websites."""

    DEFAULT_HEADERS = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    # Airlines to target on Skytrax (URL slug -> display name).
    SKYTRAX_AIRLINES = {
        'emirates': 'Emirates',
        'qatar-airways': 'Qatar Airways',
        'turkish-airlines': 'Turkish Airlines',
        'lufthansa': 'Lufthansa',
        'american-airlines': 'American Airlines',
        'delta-air-lines': 'Delta Air Lines',
        'united-airlines': 'United Airlines',
        'southwest-airlines': 'Southwest Airlines',
        'jetblue-airways': 'JetBlue Airways',
        'alaska-airlines': 'Alaska Airlines',
        'air-france': 'Air France',
        'british-airways': 'British Airways',
        'singapore-airlines': 'Singapore Airlines',
        'klm-royal-dutch-airlines': 'KLM',
        'etihad-airways': 'Etihad Airways',
    }

    # Trustpilot airline domains to crawl (slug -> display name).
    TRUSTPILOT_AIRLINES = {
        'www.emirates.com': 'Emirates',
        'www.qatarairways.com': 'Qatar Airways',
        'www.turkishairlines.com': 'Turkish Airlines',
        'www.lufthansa.com': 'Lufthansa',
        'www.aa.com': 'American Airlines',
        'www.delta.com': 'Delta Air Lines',
        'www.united.com': 'United Airlines',
        'www.southwest.com': 'Southwest Airlines',
        'www.jetblue.com': 'JetBlue Airways',
        'www.britishairways.com': 'British Airways',
    }

    def __init__(
        self,
        output_file: str = '10_NLP/airline_reviews_web_scraped.csv',
        delay: float = 2.0,
        request_timeout: int = 25,
    ):
        self.output_file = Path(output_file)
        self.delay = delay
        self.request_timeout = request_timeout
        self.session = requests.Session()
        self.session.headers.update(self.DEFAULT_HEADERS)
        self.reviews: list[dict] = []
        self.seen_texts: set[str] = set()
        self.output_file.parent.mkdir(exist_ok=True, parents=True)

    # ------------------------------------------------------------------ utils

    def _get(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a URL respectfully and return parsed soup or None."""
        try:
            resp = self.session.get(url, timeout=self.request_timeout)
            if resp.status_code != 200:
                print(f'  [HTTP {resp.status_code}] {url}')
                return None
            return BeautifulSoup(resp.text, 'html.parser')
        except requests.RequestException as exc:
            print(f'  [ERR] {url} -> {str(exc)[:120]}')
            return None
        finally:
            time.sleep(self.delay)

    def add_review(
        self,
        airline: str,
        source: str,
        text: str,
        rating: Optional[str] = '',
        date: Optional[str] = '',
        verified: str = 'unknown',
    ) -> bool:
        """Add a deduplicated review to the collection. Returns True if added."""
        if not text:
            return False
        text = text.strip()
        if len(text) < 25:
            return False
        normalized = re.sub(r'\s+', ' ', text.lower())
        if normalized in self.seen_texts:
            return False
        self.seen_texts.add(normalized)
        self.reviews.append({
            'airline': airline or 'Unknown',
            'source': source,
            'review_text': text[:1000],
            'rating': str(rating) if rating else '',
            'date': date or datetime.now().strftime('%Y-%m-%d'),
            'verified_purchase': verified or 'unknown',
        })
        return True

    def save_to_csv(self) -> None:
        if not self.reviews:
            print('[SAVE] No reviews collected.')
            return
        cols = ['airline', 'source', 'review_text', 'rating', 'date', 'verified_purchase']
        with open(self.output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=cols)
            writer.writeheader()
            for r in self.reviews:
                writer.writerow({k: r.get(k, '') for k in cols})
        print(f'[SAVE] {len(self.reviews)} reviews saved to {self.output_file}')

    # --------------------------------------------------------------- Skytrax

    def scrape_skytrax(self, max_pages_per_airline: int = 5) -> int:
        """Scrape AirlineQuality.com (Skytrax) airline review pages."""
        print('[Skytrax] Fetching airline reviews from airlinequality.com...')
        added = 0
        base = 'https://www.airlinequality.com/airline-reviews/{slug}/page/{page}/'

        for slug, display in self.SKYTRAX_AIRLINES.items():
            for page in range(1, max_pages_per_airline + 1):
                url = base.format(slug=slug, page=page)
                soup = self._get(url)
                if soup is None:
                    break

                articles = soup.select('article.comp_media-review-rated, article.list-item.media')
                if not articles:
                    break

                page_added = 0
                for art in articles:
                    text_el = art.select_one('.text_content, .tc_mobile')
                    if text_el is None:
                        continue
                    text = text_el.get_text(' ', strip=True)
                    text = re.sub(r'^\s*✅?\s*Trip Verified\s*\|?\s*', '', text)
                    text = re.sub(r'^\s*Not Verified\s*\|?\s*', '', text)

                    rating_el = art.select_one('.rating-10 span[itemprop="ratingValue"]')
                    rating = rating_el.get_text(strip=True) if rating_el else ''

                    date_el = art.select_one('time')
                    date_str = date_el.get('datetime') if date_el else ''
                    if date_str:
                        date_str = date_str.split('T')[0]

                    verified = 'verified' if 'Trip Verified' in art.get_text() else 'unknown'

                    if self.add_review(
                        airline=display,
                        source='skytrax',
                        text=text,
                        rating=rating,
                        date=date_str,
                        verified=verified,
                    ):
                        added += 1
                        page_added += 1

                print(f'  [Skytrax] {display} page {page}: +{page_added}')
                if page_added == 0:
                    break

        print(f'[Skytrax] Total added: {added}')
        return added

    # ----------------------------------------------------------- TripAdvisor

    def scrape_tripadvisor(self, listing_urls: Optional[Iterable[str]] = None) -> int:
        """
        Scrape TripAdvisor airline review listing pages.

        TripAdvisor periodically rotates URL patterns; pass explicit listing
        URLs (one per airline) for best results. Defaults cover a few stable
        airline hubs.
        """
        print('[TripAdvisor] Fetching airline reviews from tripadvisor.com...')
        if listing_urls is None:
            listing_urls = [
                'https://www.tripadvisor.com/Airline_Review-d8729017-Reviews-Emirates',
                'https://www.tripadvisor.com/Airline_Review-d8729143-Reviews-Qatar-Airways',
                'https://www.tripadvisor.com/Airline_Review-d8729163-Reviews-Turkish-Airlines',
                'https://www.tripadvisor.com/Airline_Review-d8729068-Reviews-Lufthansa',
                'https://www.tripadvisor.com/Airline_Review-d8729020-Reviews-American-Airlines',
                'https://www.tripadvisor.com/Airline_Review-d8729035-Reviews-Delta-Air-Lines',
                'https://www.tripadvisor.com/Airline_Review-d8729167-Reviews-United-Airlines',
            ]

        added = 0
        for url in listing_urls:
            soup = self._get(url)
            if soup is None:
                continue

            airline = self._airline_from_tripadvisor_url(url)

            # TripAdvisor typically wraps reviews in elements with data-test ids
            # or .review-container; we try several selectors.
            review_blocks = soup.select(
                'div.review-container, div[data-automation="reviewCard"], '
                'div.YibKl, div.ui_columns'
            )

            page_added = 0
            for block in review_blocks:
                title_el = block.select_one('span.noQuotes, a.title, span[data-automation="reviewTitle"]')
                body_el = block.select_one('p.partial_entry, q.QewHA, span[data-automation="reviewText"]')
                if body_el is None and title_el is None:
                    continue

                parts = []
                if title_el:
                    parts.append(title_el.get_text(' ', strip=True))
                if body_el:
                    parts.append(body_el.get_text(' ', strip=True))
                text = '. '.join(p for p in parts if p)

                rating = ''
                rating_el = block.select_one('span.ui_bubble_rating, [class*="bubble_"]')
                if rating_el is not None:
                    cls = ' '.join(rating_el.get('class', []))
                    m = re.search(r'bubble_(\d{2})', cls)
                    if m:
                        rating = str(int(m.group(1)) // 10)

                date_el = block.select_one('span.ratingDate, span[data-automation="reviewDate"]')
                date_str = date_el.get('title', '') if date_el else ''

                if self.add_review(
                    airline=airline,
                    source='tripadvisor',
                    text=text,
                    rating=rating,
                    date=date_str,
                    verified='unknown',
                ):
                    added += 1
                    page_added += 1

            print(f'  [TripAdvisor] {airline}: +{page_added}')

        print(f'[TripAdvisor] Total added: {added}')
        return added

    @staticmethod
    def _airline_from_tripadvisor_url(url: str) -> str:
        m = re.search(r'Reviews-([A-Za-z0-9\-]+)', url)
        if not m:
            return 'Unknown Airline'
        return m.group(1).replace('-', ' ').strip()

    # ------------------------------------------------------------ Trustpilot

    def scrape_trustpilot(self, max_pages_per_airline: int = 5) -> int:
        """Scrape Trustpilot review pages for airline domains."""
        print('[Trustpilot] Fetching airline reviews from trustpilot.com...')
        base = 'https://www.trustpilot.com/review/{domain}?page={page}'
        added = 0

        for domain, display in self.TRUSTPILOT_AIRLINES.items():
            for page in range(1, max_pages_per_airline + 1):
                url = base.format(domain=domain, page=page)
                soup = self._get(url)
                if soup is None:
                    break

                cards = soup.select('article[data-service-review-card-paper], article.paper_paper__1PY90')
                if not cards:
                    # Fallback to any element holding review body text.
                    cards = soup.select('section.styles_reviewContentwrapper__K2aRu')

                page_added = 0
                for card in cards:
                    body_el = card.select_one(
                        'p[data-service-review-text-typography], '
                        'p.typography_body-l__KUYFJ, p.typography_color-black__5LYEn'
                    )
                    if body_el is None:
                        continue
                    text = body_el.get_text(' ', strip=True)

                    rating_el = card.select_one('div[data-service-review-rating], img[alt*="star"]')
                    rating = ''
                    if rating_el is not None:
                        rating_attr = rating_el.get('data-service-review-rating') or rating_el.get('alt', '')
                        m = re.search(r'([1-5])', rating_attr or '')
                        if m:
                            rating = m.group(1)

                    date_el = card.select_one('time')
                    date_str = ''
                    if date_el is not None:
                        date_str = (date_el.get('datetime') or '').split('T')[0]

                    if self.add_review(
                        airline=display,
                        source='trustpilot',
                        text=text,
                        rating=rating,
                        date=date_str,
                        verified='unknown',
                    ):
                        added += 1
                        page_added += 1

                print(f'  [Trustpilot] {display} page {page}: +{page_added}')
                if page_added == 0:
                    break

        print(f'[Trustpilot] Total added: {added}')
        return added

    # ----------------------------------------------------------------- run

    def run(self) -> list[dict]:
        print('=' * 75)
        print('AIRLINE CUSTOMER REVIEWS - WEB SCRAPER (Non-Reddit)')
        print('Sources: Skytrax (AirlineQuality), TripAdvisor, Trustpilot')
        print('=' * 75)

        self.scrape_skytrax(max_pages_per_airline=5)
        print()
        self.scrape_tripadvisor()
        print()
        self.scrape_trustpilot(max_pages_per_airline=5)
        print()

        print('=' * 75)
        self.save_to_csv()
        print('=' * 75)
        print(f'SUCCESS: Web scraping complete. Total deduplicated reviews: {len(self.reviews)}')
        return self.reviews


if __name__ == '__main__':
    scraper = AirlineWebReviewScraper(delay=2.0)
    reviews = scraper.run()

    print('\nData Collection Summary:')
    print(f'  Total reviews: {len(reviews)}')

    if reviews:
        airlines: dict[str, int] = {}
        sources: dict[str, int] = {}
        for r in reviews:
            airlines[r['airline']] = airlines.get(r['airline'], 0) + 1
            sources[r['source']] = sources.get(r['source'], 0) + 1

        print('\n  Reviews by source:')
        for src, n in sorted(sources.items(), key=lambda x: -x[1]):
            print(f'    - {src}: {n}')

        print('\n  Top airlines:')
        for airline, n in sorted(airlines.items(), key=lambda x: -x[1])[:10]:
            print(f'    - {airline}: {n}')

        print('\n  Sample reviews:')
        for i, r in enumerate(reviews[:3], 1):
            preview = r['review_text'][:90] + ('...' if len(r['review_text']) > 90 else '')
            print(f'    {i}. [{r["source"]}] {r["airline"]}: {preview}')
