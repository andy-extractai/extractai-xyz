#!/usr/bin/env python3
"""
Congress Trade Scraper
Downloads House Financial Disclosure PTR PDFs and extracts trade data.
Outputs congress-trades.json for the extractai.xyz frontend.
"""

import json
import logging
import os
import re
import ssl
import sys
import time
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from io import BytesIO
from urllib.request import Request, urlopen

# Suppress pdfminer noise
logging.getLogger("pdfminer").setLevel(logging.ERROR)

# Fix SSL on macOS
ssl._create_default_https_context = ssl._create_unverified_context

# Try pdfminer
try:
    from pdfminer.high_level import extract_text
except ImportError:
    print("ERROR: pip3 install pdfminer.six")
    sys.exit(1)

BASE_URL = "https://disclosures-clerk.house.gov"
USER_AGENT = "ExtractAI Research andy@extractai.xyz"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")
CACHE_DIR = "/tmp/congress-pdfs"

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


def fetch(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    return urlopen(req, timeout=30).read()


def get_ptr_filings(year: int) -> list[dict]:
    """Download bulk ZIP and extract PTR filing metadata."""
    print(f"Downloading {year} bulk data...")
    data = fetch(f"{BASE_URL}/public_disc/financial-pdfs/{year}FD.zip")
    filings = []

    with zipfile.ZipFile(BytesIO(data)) as zf:
        xml_name = f"{year}FD.xml"
        if xml_name not in zf.namelist():
            print(f"  No {xml_name} in ZIP")
            return filings

        with zf.open(xml_name) as f:
            tree = ET.parse(f)

        for member in tree.getroot().findall("Member"):
            filing_type = member.findtext("FilingType", "")
            # P = Periodic Transaction Report (the trades)
            if filing_type != "P":
                continue

            doc_id = member.findtext("DocID", "")
            if not doc_id:
                continue

            filings.append({
                "name": f"{member.findtext('First', '')} {member.findtext('Last', '')}".strip(),
                "prefix": member.findtext("Prefix", ""),
                "state_district": member.findtext("StateDst", ""),
                "filing_date": member.findtext("FilingDate", ""),
                "doc_id": doc_id,
                "year": year,
            })

    print(f"  Found {len(filings)} PTR filings")
    return filings


def parse_amount(amount_str: str) -> dict:
    """Parse amount range string into min/max values."""
    amount_str = amount_str.strip().replace(",", "")
    # Match patterns like "$1,001 - $15,000" or "$1,000,001 - $5,000,000"
    m = re.search(r'\$?([\d,]+)\s*-\s*\$?([\d,]+)', amount_str.replace(",", ""))
    if m:
        return {"min": int(m.group(1)), "max": int(m.group(2)), "raw": amount_str}
    return {"min": 0, "max": 0, "raw": amount_str}


def parse_transaction_type(tx_str: str) -> str:
    """Normalize transaction type."""
    tx = tx_str.strip().upper()
    if tx.startswith("P"):
        return "purchase"
    elif tx.startswith("S"):
        return "sale"
    elif tx.startswith("E"):
        return "exchange"
    return tx.lower()


def extract_trades_from_pdf(pdf_bytes: bytes) -> list[dict]:
    """Extract individual trades from a PTR PDF."""
    import tempfile
    trades = []

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        text = extract_text(tmp_path)
    except Exception as e:
        print(f"    PDF extraction error: {e}")
        return trades
    finally:
        os.unlink(tmp_path)

    if not text:
        return trades

    # The PDF text comes in a structured format. Parse it.
    # Look for patterns: Owner, Asset name (TICKER) [type], Transaction, Date, Amount
    # The format varies but tickers are reliably in parentheses

    lines = text.replace("\n", " ").replace("\r", " ")

    # Pattern: find ticker symbols in parentheses followed by transaction info
    # Match blocks like: "CompanyName (TICKER) [ST] P 01/16/2026 01/16/2026 $X - $Y"
    # Also captures options [OP]

    # Split by "SP" or owner indicators which separate entries
    # Better approach: find all ticker mentions and their surrounding context

    ticker_pattern = re.compile(
        r'([A-Za-z][A-Za-z\s\.,\-\'&]+?)\s*'  # Company name
        r'\(([A-Z]{1,5})\)\s*'                   # (TICKER)
        r'\[(\w+)\]\s*'                           # [ST] or [OP] or [OI]
        r'(P|S|S \(partial\)|E)\s*'               # Transaction type
        r'(\d{1,2}/\d{1,2}/\d{4})\s*'            # Transaction date
        r'(\d{1,2}/\d{1,2}/\d{4})\s*'            # Notification date
        r'(\$[\d,]+ ?- ?\$[\d,]+)',               # Amount range
        re.IGNORECASE
    )

    for m in ticker_pattern.finditer(lines):
        company = m.group(1).strip()
        # Clean up company name - remove leading junk
        company = re.sub(r'^[^A-Za-z]+', '', company)
        company = re.sub(r'\s+', ' ', company).strip()

        ticker = m.group(2).upper()
        asset_type = m.group(3).upper()  # ST=stock, OP=option, OI=other investment
        tx_type = parse_transaction_type(m.group(4))
        tx_date = m.group(5)
        notify_date = m.group(6)
        amount = parse_amount(m.group(7))

        # Determine if this is an options trade
        is_options = asset_type in ("OP",)

        trades.append({
            "ticker": ticker,
            "company": company[:100],
            "asset_type": "option" if is_options else "stock",
            "transaction": tx_type,
            "date": tx_date,
            "notification_date": notify_date,
            "amount": amount,
        })

    # If regex didn't match well, try a simpler fallback
    if not trades:
        # Look for any tickers
        simple_tickers = re.findall(r'\(([A-Z]{1,5})\)', lines)
        simple_types = re.findall(r'\b(P|S|S \(partial\))\b', lines)
        simple_amounts = re.findall(r'(\$[\d,]+ ?- ?\$[\d,]+)', lines)
        simple_dates = re.findall(r'(\d{1,2}/\d{1,2}/\d{4})', lines)

        # Pair them up if counts roughly match
        if simple_tickers and len(simple_tickers) <= len(simple_amounts):
            for i, ticker in enumerate(simple_tickers):
                trades.append({
                    "ticker": ticker,
                    "company": "",
                    "asset_type": "stock",
                    "transaction": parse_transaction_type(simple_types[i]) if i < len(simple_types) else "unknown",
                    "date": simple_dates[i * 2] if i * 2 < len(simple_dates) else "",
                    "notification_date": simple_dates[i * 2 + 1] if i * 2 + 1 < len(simple_dates) else "",
                    "amount": parse_amount(simple_amounts[i]) if i < len(simple_amounts) else {"min": 0, "max": 0, "raw": ""},
                })

    return trades


def process_filing(filing, year, idx, total):
    """Process a single filing — download + parse. Thread-safe."""
    doc_id = filing["doc_id"]
    cache_path = os.path.join(CACHE_DIR, f"{doc_id}.pdf")

    if not os.path.exists(cache_path):
        url = f"{BASE_URL}/public_disc/ptr-pdfs/{year}/{doc_id}.pdf"
        try:
            pdf_data = fetch(url)
            with open(cache_path, "wb") as f:
                f.write(pdf_data)
            time.sleep(0.2)
        except Exception as e:
            print(f"  [{idx}/{total}] {filing['name']}: DOWNLOAD ERROR - {e}")
            return []
    else:
        with open(cache_path, "rb") as f:
            pdf_data = f.read()

    trades = extract_trades_from_pdf(pdf_data)
    print(f"  [{idx}/{total}] {filing['name']}: {len(trades)} trades")

    for trade in trades:
        trade["politician"] = filing["name"]
        trade["state_district"] = filing["state_district"]
        trade["filing_date"] = filing["filing_date"]
        trade["doc_id"] = doc_id
        trade["chamber"] = "house"

    return trades


def scrape_year(year: int) -> list[dict]:
    """Scrape all PTR trades for a given year."""
    filings = get_ptr_filings(year)
    all_trades = []
    total = len(filings)

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(process_filing, f, year, i+1, total): f
            for i, f in enumerate(filings)
        }
        for future in as_completed(futures):
            try:
                trades = future.result()
                all_trades.extend(trades)
            except Exception as e:
                print(f"  Error: {e}")

    return all_trades


def compute_aggregates(trades: list[dict]) -> dict:
    """Compute useful aggregates from trade data."""
    # Hot tickers - most traded by unique politicians
    ticker_politicians = {}
    ticker_volume = {}
    politician_trades = {}

    for t in trades:
        ticker = t["ticker"]
        pol = t["politician"]

        if ticker not in ticker_politicians:
            ticker_politicians[ticker] = set()
            ticker_volume[ticker] = {"buys": 0, "sells": 0, "total_min": 0, "total_max": 0, "company": t.get("company", "")}
        ticker_politicians[ticker].add(pol)

        if t["transaction"] == "purchase":
            ticker_volume[ticker]["buys"] += 1
        elif t["transaction"] == "sale":
            ticker_volume[ticker]["sells"] += 1
        ticker_volume[ticker]["total_min"] += t["amount"]["min"]
        ticker_volume[ticker]["total_max"] += t["amount"]["max"]

        if pol not in politician_trades:
            politician_trades[pol] = {"buys": 0, "sells": 0, "total_min": 0, "total_max": 0, "state": t.get("state_district", "")}
        if t["transaction"] == "purchase":
            politician_trades[pol]["buys"] += 1
        else:
            politician_trades[pol]["sells"] += 1
        politician_trades[pol]["total_min"] += t["amount"]["min"]
        politician_trades[pol]["total_max"] += t["amount"]["max"]

    # Build hot tickers list
    hot_tickers = []
    for ticker, pols in ticker_politicians.items():
        vol = ticker_volume[ticker]
        hot_tickers.append({
            "ticker": ticker,
            "company": vol["company"],
            "politician_count": len(pols),
            "politicians": sorted(list(pols)),
            "buys": vol["buys"],
            "sells": vol["sells"],
            "total_min": vol["total_min"],
            "total_max": vol["total_max"],
        })
    hot_tickers.sort(key=lambda x: x["politician_count"], reverse=True)

    # Build politician leaderboard
    top_politicians = []
    for pol, data in politician_trades.items():
        top_politicians.append({
            "name": pol,
            "state": data["state"],
            "buys": data["buys"],
            "sells": data["sells"],
            "total_trades": data["buys"] + data["sells"],
            "total_min": data["total_min"],
            "total_max": data["total_max"],
        })
    top_politicians.sort(key=lambda x: x["total_max"], reverse=True)

    return {
        "hot_tickers": hot_tickers[:30],
        "top_politicians": top_politicians[:30],
    }


def main():
    current_year = datetime.now().year
    years = [current_year]
    # Also get last year for more data
    if datetime.now().month <= 3:
        years.append(current_year - 1)

    all_trades = []
    for year in years:
        print(f"\n=== Scraping {year} ===")
        trades = scrape_year(year)
        all_trades.extend(trades)

    print(f"\nTotal trades extracted: {len(all_trades)}")

    # Sort by date descending
    def parse_date(d):
        try:
            return datetime.strptime(d, "%m/%d/%Y")
        except:
            return datetime.min

    all_trades.sort(key=lambda t: parse_date(t["date"]), reverse=True)

    # Compute aggregates
    aggregates = compute_aggregates(all_trades)

    # Build output
    output = {
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "total_trades": len(all_trades),
        "years": years,
        "trades": all_trades,
        "hot_tickers": aggregates["hot_tickers"],
        "top_politicians": aggregates["top_politicians"],
    }

    output_path = os.path.join(OUTPUT_DIR, "congress-trades.json")
    with open(output_path, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    print(f"\nSaved to {output_path}")
    print(f"  {len(all_trades)} trades")
    print(f"  {len(aggregates['hot_tickers'])} hot tickers")
    print(f"  {len(aggregates['top_politicians'])} politicians")
    size_kb = os.path.getsize(output_path) / 1024
    print(f"  File size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
