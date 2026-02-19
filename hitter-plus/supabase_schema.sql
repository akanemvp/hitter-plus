-- ── Hitter+ Supabase Schema ──────────────────────────────────────────────────
-- Run this in Supabase SQL Editor (Database → SQL Editor → New Query)
-- Creates tables for 2025 and 2026 Statcast data + scraper metadata

-- 2025 Statcast table (full season, loaded once)
create table if not exists statcast_2025 (
  id                              bigserial primary key,
  player_name                     text,
  batter                          bigint,
  game_date                       text,
  game_pk                         bigint,
  at_bat_number                   int,
  pitch_number                    int,
  zone                            int,
  description                     text,
  estimated_woba_using_speedangle float,
  strikes                         int,
  balls                           int,
  plate_x                         float,
  plate_z                         float,
  -- bat tracking columns
  bat_speed                       float,
  swing_length                    float,
  attack_angle                    float,
  swing_efficiency                float,
  attack_direction                float,
  tilt                            float,
  intercept_x                     float,
  intercept_y                     float,
  unique (game_pk, at_bat_number, pitch_number)
);

-- 2026 Statcast table (grows daily from March 25)
create table if not exists statcast_2026 (
  id                              bigserial primary key,
  player_name                     text,
  batter                          bigint,
  game_date                       text,
  game_pk                         bigint,
  at_bat_number                   int,
  pitch_number                    int,
  zone                            int,
  description                     text,
  estimated_woba_using_speedangle float,
  strikes                         int,
  balls                           int,
  plate_x                         float,
  plate_z                         float,
  -- bat tracking columns
  bat_speed                       float,
  swing_length                    float,
  attack_angle                    float,
  swing_efficiency                float,
  attack_direction                float,
  tilt                            float,
  intercept_x                     float,
  intercept_y                     float,
  unique (game_pk, at_bat_number, pitch_number)
);

-- Scraper metadata table
create table if not exists scraper_meta (
  id           int primary key,  -- = season year
  season       int,
  last_updated text,
  fetch_start  text,
  fetch_end    text,
  pa_min       int,
  row_count    int
);

-- Enable Row Level Security but allow public reads (anon key is safe for reads)
alter table statcast_2025 enable row level security;
alter table statcast_2026 enable row level security;
alter table scraper_meta  enable row level security;

create policy "Public read 2025"  on statcast_2025 for select using (true);
create policy "Public read 2026"  on statcast_2026 for select using (true);
create policy "Public read meta"  on scraper_meta  for select using (true);

-- Indexes for fast player lookups
create index if not exists idx_2025_player on statcast_2025 (player_name);
create index if not exists idx_2026_player on statcast_2026 (player_name);

-- ── Bat Tracking View ─────────────────────────────────────────────────────────
-- Aggregates bat tracking metrics per player per season.
-- The frontend fetches this instead of raw pitch rows.
create or replace view bat_tracking_2025 as
select
  player_name,
  batter                          as player_id,
  count(distinct game_pk || '-' || at_bat_number) as total_pa,
  avg(bat_speed)                  as bat_speed,
  avg(swing_length)               as swing_length,
  avg(attack_angle)               as attack_angle,
  avg(swing_efficiency)           as swing_efficiency,
  avg(attack_direction)           as attack_direction,
  avg(tilt)                       as swing_tilt,
  avg(intercept_x)                as intercept_x,
  avg(intercept_y)                as intercept_y,
  avg(estimated_woba_using_speedangle) as xwoba
from statcast_2025
where bat_speed is not null
group by player_name, batter
having count(distinct game_pk || '-' || at_bat_number) >= 100;

create or replace view bat_tracking_2026 as
select
  player_name,
  batter                          as player_id,
  count(distinct game_pk || '-' || at_bat_number) as total_pa,
  avg(bat_speed)                  as bat_speed,
  avg(swing_length)               as swing_length,
  avg(attack_angle)               as attack_angle,
  avg(swing_efficiency)           as swing_efficiency,
  avg(attack_direction)           as attack_direction,
  avg(tilt)                       as swing_tilt,
  avg(intercept_x)                as intercept_x,
  avg(intercept_y)                as intercept_y,
  avg(estimated_woba_using_speedangle) as xwoba
from statcast_2026
where bat_speed is not null
group by player_name, batter
having count(distinct game_pk || '-' || at_bat_number) >= 30;
-- Note: 2026 threshold starts at 30 PA, Supabase view handles the ramp-up.
-- The frontend will additionally filter by the pa_min from scraper_meta.
