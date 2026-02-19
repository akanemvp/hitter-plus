"""
Hitter+ Daily Scraper
─────────────────────
Pulls Statcast pitch + bat tracking data via pybaseball and upserts to Supabase.
Runs daily via GitHub Actions. Fetches yesterday's data during the season.

Season logic:
  - 2025 season: full season data (already complete)
  - 2026 season: starts March 25, 2026. PA minimum ramps up:
      < 30 PA:  skip (too small)
      30–99 PA: include with warning flag
      100+ PA:  full inclusion (from ~mid-April onward)
"""

import os
import sys
from datetime import date, timedelta
import pandas as pd
from pybaseball import statcast
from supabase import create_client, Client

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # service role key for writes

SEASON_2025_START = date(2025, 3, 27)
SEASON_2025_END   = date(2025, 9, 28)
SEASON_2026_START = date(2026, 3, 25)
SEASON_2026_END   = date(2026, 9, 27)   # approximate

# PA minimum thresholds per season
PA_MIN_2025 = 100   # full 2025 season — use full threshold
PA_MIN_2026_SOFT = 30   # early 2026 — include but flag
PA_MIN_2026_HARD = 100  # mid-season 2026 — full threshold

# Columns we actually need — keeps payload small
KEEP_COLS = [
    "player_name", "batter", "game_date", "game_pk", "at_bat_number",
    "pitch_number", "zone", "description", "estimated_woba_using_speedangle",
    "strikes", "balls", "plate_x", "plate_z",
    # bat tracking
    "bat_speed", "swing_length", "attack_angle", "swing_efficiency",
    "attack_direction", "tilt", "intercept_x", "intercept_y",
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_season_range(today: date):
    """Return (start, end, season_year) for the active or most recent season."""
    if today >= SEASON_2026_START:
        end = min(today - timedelta(days=1), SEASON_2026_END)
        return SEASON_2026_START, end, 2026
    else:
        # Always return full 2025 season
        return SEASON_2025_START, SEASON_2025_END, 2025


def pa_min_for_season(season: int, today: date) -> int:
    """Return the PA minimum to use given the season and current date."""
    if season == 2025:
        return PA_MIN_2025
    # 2026: ramp up over first ~3 weeks
    days_in = (today - SEASON_2026_START).days
    if days_in < 7:
        return PA_MIN_2026_SOFT
    if days_in < 21:
        return 50
    return PA_MIN_2026_HARD


def fetch_statcast(start: date, end: date) -> pd.DataFrame:
    print(f"  Fetching Statcast {start} → {end} ...")
    df = statcast(start_dt=str(start), end_dt=str(end))
    print(f"  Fetched {len(df):,} rows")
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only needed columns, drop rows without player name."""
    cols = [c for c in KEEP_COLS if c in df.columns]
    df = df[cols].copy()
    df = df[df["player_name"].notna()].reset_index(drop=True)
    # Normalise game_date to string
    df["game_date"] = pd.to_datetime(df["game_date"]).dt.strftime("%Y-%m-%d")
    return df


def upsert_to_supabase(df: pd.DataFrame, table: str, supabase: Client, chunk=500):
    """Upsert rows in chunks. Conflict key = (game_pk, at_bat_number, pitch_number)."""
    records = df.where(pd.notna(df), None).to_dict(orient="records")
    total = len(records)
    for i in range(0, total, chunk):
        batch = records[i:i+chunk]
        supabase.table(table).upsert(batch, on_conflict="game_pk,at_bat_number,pitch_number").execute()
        print(f"  Upserted {min(i+chunk, total)}/{total}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    today = date.today()
    start, end, season = get_season_range(today)
    pa_min = pa_min_for_season(season, today)

    print(f"Season {season} | Range {start} → {end} | PA min: {pa_min}")

    # For 2025 we do a full refresh on first run, then incremental.
    # For 2026 we always pull yesterday only (incremental).
    if season == 2026:
        fetch_start = today - timedelta(days=1)
        fetch_end   = today - timedelta(days=1)
        if fetch_start < SEASON_2026_START:
            print("Season hasn't started yet. Nothing to fetch.")
            return
    else:
        # 2025: check if table already has data; if so skip (CI re-run safety)
        fetch_start = start
        fetch_end   = end

    df = fetch_statcast(fetch_start, fetch_end)
    df = clean(df)
    print(f"  Cleaned: {len(df):,} rows, {df['player_name'].nunique()} players")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    table = f"statcast_{season}"
    upsert_to_supabase(df, table, supabase)

    # Write metadata so the frontend knows what's fresh
    supabase.table("scraper_meta").upsert({
        "id": season,
        "season": season,
        "last_updated": str(today),
        "fetch_start": str(fetch_start),
        "fetch_end": str(fetch_end),
        "pa_min": pa_min,
        "row_count": len(df),
    }, on_conflict="id").execute()

    print(f"Done. Season {season} table '{table}' updated.")


if __name__ == "__main__":
    main()
