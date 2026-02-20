"""
Hitter+ Daily Scraper
─────────────────────
Pulls Statcast pitch data, computes Trout+ scores server-side,
and stores a small pre-aggregated results table in Supabase.
The app fetches ~500 rows instead of 700k pitch rows.
"""

import os
import math
from datetime import date, timedelta
import pandas as pd
from pybaseball import statcast
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

SEASON_2025_START = date(2025, 3, 27)
SEASON_2025_END   = date(2025, 9, 28)
SEASON_2026_START = date(2026, 3, 25)
SEASON_2026_END   = date(2026, 9, 27)
PA_MIN = 100

SWING_DESCS = {'hit_into_play','foul','swinging_strike','swinging_strike_blocked','foul_tip','foul_bunt'}
WALK_DESCS  = {'ball','blocked_ball','hit_by_pitch'}
KS_DESCS    = {'swinging_strike','swinging_strike_blocked','foul_tip'}

def categorize_zone(zone):
    try:
        z = int(zone)
    except (TypeError, ValueError):
        return 'chase'
    m = {1:'upper_inner',2:'upper_middle',3:'upper_outer',
         4:'middle_inner',5:'middle_middle',6:'middle_outer',
         7:'lower_inner',8:'lower_middle',9:'lower_outer',
         11:'shadow',12:'shadow',13:'shadow',14:'shadow'}
    return m.get(z, 'chase')

def compute_trout_plus(df):
    player_data = {}
    for _, r in df.iterrows():
        player = r.get('player_name')
        if not player or pd.isna(player): continue
        if player not in player_data:
            player_data[player] = {'pitches': [], 'pa_set': set(), 'batter_id': int(r.get('batter', 0))}
        desc    = str(r.get('description', '') or '')
        strikes = int(r.get('strikes', 0) or 0)
        balls   = int(r.get('balls', 0) or 0)
        xwoba   = r.get('estimated_woba_using_speedangle')
        pa_key  = f"{r.get('game_pk','')}_{r.get('at_bat_number','')}"
        player_data[player]['pa_set'].add(pa_key)
        try:
            xw = float(xwoba) if xwoba is not None else None
            if xw is not None and math.isnan(xw): xw = None
        except (TypeError, ValueError):
            xw = None
        player_data[player]['pitches'].append({
            'zone_cat': categorize_zone(r.get('zone')),
            'xwoba': xw,
            'swing': 1 if desc in SWING_DESCS else 0,
            'is_walk': 1 if desc in WALK_DESCS and balls == 3 else 0,
            'is_k_look': 1 if desc == 'called_strike' and strikes == 2 else 0,
            'is_k_swing': 1 if desc in KS_DESCS and strikes == 2 else 0,
            'pa_key': pa_key,
            'pitch_number': int(r.get('pitch_number', 0) or 0),
            'strikes': strikes, 'balls': balls,
        })

    zones = ['upper_inner','upper_middle','upper_outer','middle_inner','middle_middle',
             'middle_outer','lower_inner','lower_middle','lower_outer','shadow','chase']
    results = []

    for player, d in player_data.items():
        if len(d['pa_set']) < PA_MIN: continue
        all_p = [p for p in d['pitches'] if p['xwoba'] is not None]
        overall = sum(p['xwoba'] for p in all_p) / len(all_p) if all_p else 0.3
        profile = {}
        for z in zones:
            zp = [p for p in all_p if p['zone_cat'] == z]
            profile[z] = sum(p['xwoba'] for p in zp) / len(zp) if len(zp) >= 10 else overall

        pa_map = {}
        for p in d['pitches']:
            pa_map.setdefault(p['pa_key'], []).append(p)
        for pa in pa_map.values():
            pa.sort(key=lambda x: x['pitch_number'])

        total_score, total_weight = 0, 0
        for pa in pa_map.values():
            last = pa[-1]
            pa_bonus = 10 if last['is_walk'] else (-8 if last['is_k_look'] else
                       (-10 if any(p['is_k_swing'] for p in pa) and last['zone_cat'] in ('chase','shadow') else 0))
            for i, p in enumerate(pa):
                zc = p['zone_cat']
                in_sz = zc not in ('shadow','chase')
                is_sh = zc == 'shadow'; is_ch = zc == 'chase'
                is_hot  = in_sz and profile.get(zc, overall) >= overall + 0.030
                is_cold = in_sz and profile.get(zc, overall) <= overall - 0.030
                sw, b, s = p['swing'], p['balls'], p['strikes']
                if b == 3:
                    score = (0 if sw else 100) if is_ch else (25 if sw else 90) if is_sh else (95 if sw else 50) if is_hot else 50
                elif s == 2:
                    score = (0 if sw else 100) if is_ch else (40 if sw else 92) if is_sh else (78 if sw else 22)
                else:
                    score = (0 if sw else 100) if is_ch else (20 if sw else 85) if is_sh else \
                            (95 if sw else 32) if is_hot else (68 if sw else 52) if is_cold else (80 if sw else 38)
                score = max(0, min(100, score + pa_bonus))
                if p['is_walk']: score += 15
                pw = min(1.5, 1.0 + i * 0.1)
                total_score += score * pw; total_weight += pw

        raw = total_score / total_weight if total_weight > 0 else 50
        swing_pct = sum(p['swing'] for p in d['pitches']) / len(d['pitches']) if d['pitches'] else 0
        results.append({
            'player_name': player, 'batter_id': d['batter_id'], 'total_pa': len(d['pa_set']),
            'total_pitches': len(d['pitches']), 'swing_pct': swing_pct,
            'overall_xwoba': overall, 'raw_score': raw,
            'zone_upper_inner': profile.get('upper_inner', overall),
            'zone_upper_middle': profile.get('upper_middle', overall),
            'zone_upper_outer': profile.get('upper_outer', overall),
            'zone_middle_inner': profile.get('middle_inner', overall),
            'zone_middle_middle': profile.get('middle_middle', overall),
            'zone_middle_outer': profile.get('middle_outer', overall),
            'zone_lower_inner': profile.get('lower_inner', overall),
            'zone_lower_middle': profile.get('lower_middle', overall),
            'zone_lower_outer': profile.get('lower_outer', overall),
        })

    if results:
        mean = sum(r['raw_score'] for r in results) / len(results)
        std  = math.sqrt(sum((r['raw_score'] - mean)**2 for r in results) / len(results))
        for r in results:
            r['trout_plus'] = 100 + ((r['raw_score'] - mean) / std * 10) if std > 0 else 100

    print(f"  Computed Trout+ for {len(results)} players")
    return results


def main():
    today = date.today()
    if today >= SEASON_2026_START:
        start, end, season = SEASON_2026_START, min(today - timedelta(days=1), SEASON_2026_END), 2026
    else:
        start, end, season = SEASON_2025_START, SEASON_2025_END, 2025

    print(f"Season {season} | {start} → {end}")
    df = statcast(start_dt=str(start), end_dt=str(end))
    print(f"Fetched {len(df):,} rows")

    # In pybaseball Statcast, 'player_name' = PITCHER name, 'batter' = batter MLBAM ID
    # We need batter names - look them up from the 'batter' column using playerid_reverse_lookup
    needed = ['game_pk','at_bat_number','pitch_number','zone',
              'description','estimated_woba_using_speedangle','strikes','balls','batter']
    df = df[[c for c in needed if c in df.columns]].dropna(subset=['batter']).reset_index(drop=True)
    
    # Filter to actual batting events only
    batting_descs = {
        'ball', 'called_strike', 'swinging_strike', 'hit_into_play', 'foul',
        'blocked_ball', 'hit_by_pitch', 'swinging_strike_blocked', 'foul_tip',
        'foul_bunt', 'missed_bunt', 'bunt_foul_tip'
    }
    df = df[df['description'].isin(batting_descs)].reset_index(drop=True)

    # Get batter names via reverse lookup
    from pybaseball import playerid_reverse_lookup
    batter_ids = df['batter'].dropna().unique().tolist()
    print(f"  Looking up names for {len(batter_ids)} batters...")
    id_df = playerid_reverse_lookup(batter_ids, key_type='mlbam')
    # Filter to hitters only (50+ PA) - use batter ID directly as player key
    pa_counts = df.groupby('batter')['at_bat_number'].nunique()
    hitter_ids = set(pa_counts[pa_counts >= 50].index.tolist())
    df = df[df['batter'].isin(hitter_ids)].reset_index(drop=True)
    df['player_name'] = df['batter'].astype(int).astype(str)
    print(f"  After filtering to batting events: {len(df):,} rows, {df['player_name'].nunique()} players")

    results = compute_trout_plus(df)

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    table = f"trout_stats_{season}"
    for i in range(0, len(results), 100):
        supabase.table(table).upsert(results[i:i+100], on_conflict="player_name").execute()
        print(f"  Upserted {min(i+100, len(results))}/{len(results)}")

    supabase.table("scraper_meta").upsert({
        "id": season, "season": season, "last_updated": str(today),
        "fetch_start": str(start), "fetch_end": str(end),
        "pa_min": PA_MIN, "row_count": len(df),
    }, on_conflict="id").execute()
    print(f"Done. {len(results)} players in '{table}'.")

if __name__ == "__main__":
    main()
