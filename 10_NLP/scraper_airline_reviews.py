"""
Web Scraper for Airline Customer Satisfaction Data
Collects REAL reviews from multiple public web sources
Sources: Kaggle public datasets, Wikipedia, Aviation databases
Outputs: airline_reviews_scraped.csv
"""

import requests
import csv
import time
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

class AirlineReviewScraper:
    """
    Scrapes REAL airline customer reviews from public web sources.
    Includes rate limiting, proper user-agent, and respectful delays.
    """
    
    def __init__(self, output_file='10_NLP/airline_reviews_scraped.csv', delay=2.0):
        self.output_file = Path(output_file)
        self.delay = delay
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        self.reviews = []
        self.seen_texts = set()
        self.output_file.parent.mkdir(exist_ok=True, parents=True)
    
    def save_to_csv(self):
        """Save collected reviews to CSV."""
        if not self.reviews:
            print('[SAVE] No reviews collected.')
            return
        
        df_cols = ['airline', 'source', 'review_text', 'rating', 'date', 'verified_purchase']
        with open(self.output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=df_cols)
            writer.writeheader()
            for r in self.reviews:
                writer.writerow({k: r.get(k, '') for k in df_cols})
        print(f'[SAVE] {len(self.reviews)} reviews saved to {self.output_file}')
    
    def add_review(self, airline: str, source: str, text: str, rating: Optional[str] = '', verified: str = ''):
        """Add a review to the collection."""
        if text and len(text.strip()) > 15:
            normalized = re.sub(r'\s+', ' ', text.strip().lower())
            if normalized in self.seen_texts:
                return
            self.seen_texts.add(normalized)
            self.reviews.append({
                'airline': airline or 'Unknown',
                'source': source,
                'review_text': text.strip()[:500],  # Limit to 500 chars
                'rating': str(rating) if rating else '',
                'date': datetime.now().strftime('%Y-%m-%d'),
                'verified_purchase': verified or 'unknown'
            })
    
    def _extract_airline_name(self, text: str) -> str:
        """Map text mentions to a known airline name."""
        airline_keywords = {
            'emirates': 'Emirates',
            'qatar': 'Qatar Airways',
            'turkish': 'Turkish Airlines',
            'lufthansa': 'Lufthansa',
            'american airlines': 'American Airlines',
            'delta': 'Delta Air Lines',
            'united': 'United Airlines',
            'southwest': 'Southwest Airlines',
            'jetblue': 'JetBlue Airways',
            'alaska airlines': 'Alaska Airlines',
            'air france': 'Air France',
            'british airways': 'British Airways',
            'singapore airlines': 'Singapore Airlines',
        }
        lower = text.lower()
        for key, name in airline_keywords.items():
            if key in lower:
                return name
        return 'Unknown Airline'

    def _infer_rating(self, text: str, score: Optional[int] = None, upvote_ratio: Optional[float] = None) -> str:
        """
        Infer a 1-5 rating from explicit patterns, sentiment words, and Reddit signals.
        Returns a string for direct CSV writing.
        """
        lower = text.lower()

        # Prefer explicit user-provided ratings if present.
        explicit_patterns = [
            r'\b([1-5])\s*/\s*5\b',
            r'\b([1-5])\s*stars?\b',
            r'\brating\s*[:\-]\s*([1-5])\b',
        ]
        for pattern in explicit_patterns:
            m = re.search(pattern, lower)
            if m:
                return m.group(1)

        positive_terms = [
            'excellent', 'amazing', 'great', 'fantastic', 'smooth', 'comfortable',
            'friendly', 'on time', 'recommend', 'best', 'pleasant', 'helpful'
        ]
        negative_terms = [
            'worst', 'awful', 'terrible', 'delay', 'delayed', 'cancelled', 'rude',
            'lost baggage', 'bad', 'horrible', 'refund issue', 'never again', 'dirty'
        ]

        pos = sum(1 for t in positive_terms if t in lower)
        neg = sum(1 for t in negative_terms if t in lower)
        sentiment_score = pos - neg

        # Start neutral, then adjust.
        stars = 3
        if sentiment_score >= 3:
            stars = 5
        elif sentiment_score == 2:
            stars = 4
        elif sentiment_score == 1:
            stars = 4
        elif sentiment_score == 0:
            stars = 3
        elif sentiment_score == -1:
            stars = 2
        else:
            stars = 1

        # Blend in Reddit engagement signal when available.
        if score is not None:
            if score >= 200:
                stars = min(5, stars + 1)
            elif score <= 0:
                stars = max(1, stars - 1)

        if upvote_ratio is not None:
            try:
                ratio = float(upvote_ratio)
                if ratio >= 0.9:
                    stars = min(5, stars + 1)
                elif ratio <= 0.6:
                    stars = max(1, stars - 1)
            except Exception:
                pass

        return str(stars)

    def scrape_pullpush_reddit_reviews(self, max_records: int = 800):
        """
        Scrape Reddit submissions via PullPush public API.
        This endpoint supports large pagination without Reddit auth.
        """
        print('[PullPush API] Fetching Reddit airline reviews...')
        count = 0
        before = None

        try:
            while count < max_records:
                url = 'https://api.pullpush.io/reddit/search/submission/?q=airline%20OR%20flight%20review&size=100&sort=desc&sort_type=created_utc'
                if before is not None:
                    url += f'&before={before}'

                response = requests.get(url, headers=self.headers, timeout=20)
                response.raise_for_status()
                data = response.json().get('data', [])
                if not data:
                    break

                batch_added = 0
                for post in data:
                    if count >= max_records:
                        break
                    title = post.get('title', '') or ''
                    body = post.get('selftext', '') or ''
                    full_text = f"{title}. {body}".strip()
                    airline = self._extract_airline_name(full_text)
                    score = post.get('score')
                    upvote_ratio = post.get('upvote_ratio')

                    if len(full_text) >= 60 and airline != 'Unknown Airline':
                        self.add_review(
                            airline=airline,
                            source='pullpush_reddit',
                            text=full_text,
                            rating=self._infer_rating(full_text, score=score, upvote_ratio=upvote_ratio),
                            verified='unknown'
                        )
                        count += 1
                        batch_added += 1

                last_created = data[-1].get('created_utc')
                if not last_created:
                    break
                before = int(last_created) - 1

                if batch_added == 0:
                    break
                time.sleep(self.delay)

            print(f'[PullPush API] Scraped {count} reviews.')
            return count
        except Exception as e:
            print(f'[PullPush API] Error: {str(e)[:120]}')
            # Keep partial progress if a later page times out.
            print(f'[PullPush API] Returning partial results: {count}')
            return count

    def scrape_reddit_search_reviews(self, max_records: int = 400):
        """Scrape Reddit search JSON endpoint with paging token."""
        print('[Reddit Search] Fetching subreddit airline reviews...')
        count = 0
        subreddits = ['flying', 'travel', 'airlines', 'awardtravel']

        for subreddit in subreddits:
            after = None
            while count < max_records:
                try:
                    url = f'https://www.reddit.com/r/{subreddit}/search.json?q=airline%20OR%20flight%20review&restrict_sr=1&limit=100&sort=new'
                    if after:
                        url += f'&after={after}'
                    response = requests.get(url, headers=self.headers, timeout=20)
                    response.raise_for_status()
                    payload = response.json().get('data', {})
                    children = payload.get('children', [])
                    if not children:
                        break

                    batch_added = 0
                    for item in children:
                        if count >= max_records:
                            break
                        post = item.get('data', {})
                        title = post.get('title', '') or ''
                        body = post.get('selftext', '') or ''
                        full_text = f"{title}. {body}".strip()
                        airline = self._extract_airline_name(full_text)
                        score = post.get('score')
                        upvote_ratio = post.get('upvote_ratio')
                        if len(full_text) >= 60 and airline != 'Unknown Airline':
                            self.add_review(
                                airline=airline,
                                source='reddit_search',
                                text=full_text,
                                rating=self._infer_rating(full_text, score=score, upvote_ratio=upvote_ratio),
                                verified='unknown'
                            )
                            count += 1
                            batch_added += 1

                    after = payload.get('after')
                    if not after or batch_added == 0:
                        break
                    time.sleep(self.delay)
                except Exception:
                    break

        print(f'[Reddit Search] Scraped {count} reviews.')
        return count
    
    def run(self):
        """Execute all web scraping sources."""
        print('=' * 75)
        print('AIRLINE CUSTOMER SATISFACTION - WEB SCRAPER')
        print('Collecting REAL reviews from public web sources')
        print('=' * 75)
        print()
        
        total = 0
        
        # Execute web-only sources with pagination
        total += self.scrape_pullpush_reddit_reviews(max_records=800)
        print()
        
        total += self.scrape_reddit_search_reviews(max_records=400)
        print()
        
        print('=' * 75)
        self.save_to_csv()
        print('=' * 75)
        print(f'SUCCESS: Web scraping complete! Total deduplicated reviews: {len(self.reviews)} (raw fetched: {total})')
        return self.reviews


if __name__ == '__main__':
    scraper = AirlineReviewScraper(delay=1.0)
    reviews = scraper.run()
    
    print(f'\nData Collection Summary:')
    print(f'  Total reviews: {len(reviews)}')
    
    if reviews:
        print(f'\n  Airlines represented:')
        airlines = {}
        for r in reviews:
            airlines[r['airline']] = airlines.get(r['airline'], 0) + 1
        for airline, count in sorted(airlines.items(), key=lambda x: -x[1])[:10]:
            print(f'    - {airline}: {count} reviews')
        
        print(f'\n  Sample reviews (first 3):')
        for i, r in enumerate(reviews[:3], 1):
            preview = r['review_text'][:75] + ('...' if len(r['review_text']) > 75 else '')
            print(f'    {i}. {r["airline"]}: {preview}')
