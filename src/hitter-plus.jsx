import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Upload, TrendingUp, TrendingDown, ArrowUpDown, Info, BarChart3, Target, Zap, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
// v2.1 - ID-based matching
// ── Season config ─────────────────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SEASON_2026_START = new Date('2026-03-25');
const TODAY             = new Date();
const ACTIVE_SEASON     = TODAY >= SEASON_2026_START ? 2026 : 2025;

// PA minimum — ramps up in 2026 early season
const getPaMin = () => {
  if (ACTIVE_SEASON === 2025) return 100;
  const daysIn = Math.floor((TODAY - SEASON_2026_START) / 86400000);
  if (daysIn < 7)  return 30;
  if (daysIn < 21) return 50;
  return 100;
};
const PA_MIN = getPaMin();

// ═══════════════════════════════════════════════════════════════
// HITTER+ CALCULATOR — 45% Mechanics+ / 55% Trout+
// ═══════════════════════════════════════════════════════════════

const BAT_DATA = {
'624431':{n:'Trevino, Jose',bs:68.92,st:23.28,aa:9.09,ad:-2.28,ix:32.48,iy:30.38,sl:7.2,xw:0.278},
'808975':{n:'Kim, Hyeseong',bs:67.30,st:41.61,aa:10.14,ad:0.02,ix:26.04,iy:25.46,sl:7.1,xw:0.251},
'602104':{n:'Urías, Ramón',bs:70.85,st:27.11,aa:13.72,ad:0.33,ix:28.41,iy:29.27,sl:7.7,xw:0.289},
'687515':{n:'Thomas, Colby',bs:74.82,st:28.86,aa:11.64,ad:-5.03,ix:27.36,iy:28.46,sl:7.7,xw:0.281},
'664728':{n:'Isbel, Kyle',bs:70.53,st:24.40,aa:2.38,ad:-4.31,ix:26.13,iy:31.15,sl:7.1,xw:0.251},
'662139':{n:'Varsho, Daulton',bs:75.55,st:29.45,aa:13.02,ad:-4.51,ix:26.30,iy:28.42,sl:7.9,xw:0.327},
'624424':{n:'Conforto, Michael',bs:73.96,st:32.00,aa:10.18,ad:1.11,ix:28.27,iy:27.75,sl:7.3,xw:0.33},
'516782':{n:'Marte, Starling',bs:72.65,st:35.40,aa:8.71,ad:-0.34,ix:28.59,iy:23.98,sl:7.3,xw:0.319},
'676694':{n:'Meyers, Jake',bs:68.39,st:32.42,aa:6.86,ad:-2.41,ix:30.58,iy:29.73,sl:6.9,xw:0.325},
'683227':{n:'Freeman, Cody',bs:67.31,st:25.68,aa:10.31,ad:-2.62,ix:26.27,iy:34.53,sl:6.6,xw:0.269},
'700250':{n:'Rice, Ben',bs:73.35,st:33.21,aa:10.81,ad:-6.44,ix:28.53,iy:28.80,sl:7.4,xw:0.394},
'681624':{n:'Pages, Andy',bs:72.55,st:40.70,aa:7.87,ad:-4.01,ix:29.63,iy:31.27,sl:7.9,xw:0.316},
'682985':{n:'Greene, Riley',bs:75.56,st:44.54,aa:13.96,ad:1.12,ix:24.65,iy:32.08,sl:7.3,xw:0.335},
'686469':{n:'Pasquantino, Vinnie',bs:72.53,st:29.37,aa:9.75,ad:-9.20,ix:31.15,iy:32.09,sl:7.4,xw:0.334},
'678554':{n:'Mead, Curtis',bs:73.34,st:32.73,aa:4.83,ad:-2.10,ix:28.07,iy:30.37,sl:7.2,xw:0.289},
'663898':{n:'Rodgers, Brendan',bs:74.05,st:31.55,aa:9.86,ad:-8.21,ix:28.64,iy:36.05,sl:7.3,xw:0.296},
'650859':{n:'Rengifo, Luis',bs:69.54,st:33.64,aa:7.21,ad:3.75,ix:26.31,iy:26.52,sl:7.1,xw:0.302},
'624585':{n:'Soler, Jorge',bs:74.02,st:33.56,aa:8.42,ad:-7.75,ix:29.02,iy:28.17,sl:7.7,xw:0.294},
'655316':{n:'Monasterio, Andruw',bs:68.38,st:34.83,aa:13.45,ad:-4.36,ix:25.37,iy:34.77,sl:7.0,xw:0.28},
'681481':{n:'Carpenter, Kerry',bs:71.86,st:34.98,aa:17.25,ad:-0.49,ix:29.22,iy:25.76,sl:7.5,xw:0.335},
'666185':{n:'Carlson, Dylan',bs:68.72,st:36.09,aa:10.81,ad:0.65,ix:25.44,iy:27.71,sl:6.9,xw:0.285},
'650333':{n:'Arraez, Luis',bs:62.68,st:37.44,aa:5.62,ad:4.62,ix:26.06,iy:31.50,sl:5.9,xw:0.303},
'681807':{n:'Fry, David',bs:70.40,st:31.09,aa:15.32,ad:-5.46,ix:33.43,iy:28.60,sl:7.9,xw:0.204},
'596146':{n:'Kepler, Max',bs:71.30,st:31.84,aa:7.74,ad:-7.05,ix:30.09,iy:32.57,sl:7.4,xw:0.332},
'702616':{n:'Holliday, Jackson',bs:70.62,st:31.89,aa:8.29,ad:5.56,ix:27.56,iy:26.18,sl:6.9,xw:0.314},
'605170':{n:'Caratini, Victor',bs:72.32,st:34.93,aa:10.74,ad:-3.60,ix:24.11,iy:37.32,sl:7.0,xw:0.329},
'695336':{n:'Saggese, Thomas',bs:69.84,st:37.86,aa:7.76,ad:5.51,ix:26.44,iy:27.22,sl:6.9,xw:0.28},
'660844':{n:'Rivas, Leo',bs:66.72,st:38.12,aa:15.81,ad:-3.45,ix:23.34,iy:31.67,sl:7.1,xw:0.288},
'686948':{n:'Baldwin, Drake',bs:75.30,st:31.69,aa:9.35,ad:3.15,ix:28.22,iy:28.72,sl:7.2,xw:0.353},
'663624':{n:'Mountcastle, Ryan',bs:75.21,st:36.02,aa:7.36,ad:-1.08,ix:31.12,iy:27.59,sl:7.5,xw:0.313},
'595978':{n:'Hedges, Austin',bs:71.48,st:26.65,aa:13.30,ad:-9.50,ix:27.17,iy:36.99,sl:7.6,xw:0.249},
'605361':{n:'Martini, Nick',bs:69.66,st:30.38,aa:6.89,ad:-1.22,ix:28.47,iy:26.32,sl:6.7,xw:0.253},
'663993':{n:'Lowe, Nathaniel',bs:72.66,st:30.08,aa:6.60,ad:7.95,ix:29.96,iy:27.36,sl:7.2,xw:0.303},
'682998':{n:'Carroll, Corbin',bs:74.65,st:25.74,aa:10.98,ad:-3.34,ix:29.91,iy:36.64,sl:7.3,xw:0.372},
'670231':{n:'Rave, John',bs:73.85,st:25.12,aa:10.86,ad:-1.80,ix:28.36,iy:32.55,sl:7.3,xw:0.302},
'679032':{n:'Rojas, Johan',bs:70.29,st:24.33,aa:6.30,ad:2.74,ix:26.36,iy:28.32,sl:7.3,xw:0.265},
'553993':{n:'Suárez, Eugenio',bs:72.28,st:38.67,aa:18.35,ad:-5.25,ix:23.16,iy:35.45,sl:7.8,xw:0.32},
'680718':{n:'Barger, Addison',bs:75.88,st:28.73,aa:8.63,ad:-4.49,ix:25.57,iy:31.31,sl:7.7,xw:0.331},
'687637':{n:'Beavers, Dylan',bs:72.25,st:39.24,aa:7.91,ad:-4.40,ix:25.74,iy:31.14,sl:7.4,xw:0.344},
'502054':{n:'Pham, Tommy',bs:73.40,st:27.40,aa:8.21,ad:-0.91,ix:28.46,iy:32.67,sl:7.0,xw:0.318},
'691182':{n:'Amador, Adael',bs:70.64,st:29.86,aa:5.17,ad:-7.70,ix:25.88,iy:33.77,sl:7.3,xw:0.269},
'623993':{n:'Santander, Anthony',bs:72.02,st:24.14,aa:7.68,ad:-9.27,ix:26.68,iy:33.20,sl:7.2,xw:0.265},
'595879':{n:'Báez, Javier',bs:73.63,st:30.19,aa:9.97,ad:-5.68,ix:28.63,iy:29.90,sl:8.3,xw:0.27},
'686780':{n:'Pagés, Pedro',bs:72.59,st:30.44,aa:7.06,ad:-2.97,ix:28.85,iy:36.02,sl:7.1,xw:0.259},
'666397':{n:'Julien, Edouard',bs:70.17,st:41.60,aa:13.84,ad:5.65,ix:27.76,iy:29.36,sl:7.0,xw:0.329},
'666139':{n:'Lowe, Josh',bs:72.44,st:35.86,aa:7.15,ad:-0.39,ix:30.87,iy:29.20,sl:7.3,xw:0.298},
'682626':{n:'Alvarez, Francisco',bs:73.97,st:29.87,aa:7.68,ad:3.19,ix:27.67,iy:27.03,sl:7.2,xw:0.326},
'666182':{n:'Bichette, Bo',bs:69.15,st:37.47,aa:4.50,ad:1.21,ix:25.04,iy:24.67,sl:7.3,xw:0.353},
'671218':{n:'Ramos, Heliot',bs:74.00,st:31.51,aa:5.96,ad:1.54,ix:27.64,iy:27.58,sl:6.8,xw:0.32},
'665839':{n:'Valdez, Enmanuel',bs:70.40,st:27.40,aa:8.53,ad:-4.94,ix:23.55,iy:27.79,sl:7.4,xw:0.327},
'643446':{n:'McNeil, Jeff',bs:70.75,st:33.06,aa:8.65,ad:-4.93,ix:24.84,iy:29.94,sl:7.3,xw:0.33},
'665750':{n:'Taveras, Leody',bs:71.23,st:31.19,aa:6.32,ad:-4.09,ix:27.41,iy:31.32,sl:7.4,xw:0.232},
'664034':{n:'France, Ty',bs:71.02,st:34.79,aa:10.69,ad:5.17,ix:26.48,iy:27.55,sl:7.5,xw:0.328},
'670156':{n:'Mastrobuoni, Miles',bs:67.51,st:32.89,aa:8.12,ad:-2.52,ix:27.29,iy:33.71,sl:6.7,xw:0.322},
'676914':{n:'Schneider, Davis',bs:71.43,st:33.51,aa:20.83,ad:-6.30,ix:24.79,iy:34.69,sl:7.1,xw:0.323},
'669397':{n:'Allen, Nick',bs:64.52,st:30.28,aa:7.27,ad:-0.67,ix:27.06,iy:32.10,sl:6.3,xw:0.252},
'676609':{n:'Caballero, José',bs:69.07,st:31.56,aa:10.03,ad:-0.49,ix:23.88,iy:34.17,sl:6.8,xw:0.299},
'668904':{n:'Lewis, Royce',bs:73.64,st:28.92,aa:10.81,ad:-7.68,ix:26.49,iy:28.56,sl:8.0,xw:0.297},
'666149':{n:'Fitzgerald, Tyler',bs:69.20,st:35.15,aa:13.56,ad:-4.64,ix:25.56,iy:31.51,sl:7.4,xw:0.242},
'545361':{n:'Trout, Mike',bs:74.05,st:36.37,aa:7.59,ad:0.16,ix:25.30,iy:24.27,sl:7.5,xw:0.358},
'676572':{n:'Wagaman, Eric',bs:73.42,st:27.90,aa:6.88,ad:-2.72,ix:28.14,iy:32.33,sl:7.1,xw:0.315},
'680574':{n:'McLain, Matt',bs:69.71,st:32.06,aa:11.46,ad:-0.04,ix:27.05,iy:32.14,sl:6.9,xw:0.29},
'641584':{n:'Fraley, Jake',bs:71.60,st:37.51,aa:8.98,ad:-6.59,ix:28.05,iy:29.66,sl:7.1,xw:0.315},
'641355':{n:'Bellinger, Cody',bs:70.10,st:32.39,aa:12.88,ad:-3.06,ix:21.04,iy:30.07,sl:7.8,xw:0.327},
'686527':{n:'Canzone, Dominic',bs:73.31,st:31.92,aa:12.08,ad:-2.23,ix:29.08,iy:38.18,sl:7.3,xw:0.376},
'669257':{n:'Smith, Will',bs:69.78,st:33.79,aa:12.02,ad:0.26,ix:28.91,iy:31.31,sl:7.3,xw:0.378},
'668227':{n:'Arozarena, Randy',bs:72.30,st:25.25,aa:8.69,ad:0.44,ix:24.27,iy:31.17,sl:7.4,xw:0.327},
'686611':{n:'Crews, Dylan',bs:73.25,st:26.48,aa:6.58,ad:-1.26,ix:26.25,iy:30.45,sl:7.2,xw:0.307},
'694388':{n:'Loperfido, Joey',bs:72.01,st:37.80,aa:15.73,ad:5.63,ix:29.88,iy:25.70,sl:7.6,xw:0.316},
'650489':{n:'Castro, Willi',bs:71.61,st:37.27,aa:7.68,ad:-3.53,ix:24.19,iy:30.11,sl:7.2,xw:0.306},
'467793':{n:'Santana, Carlos',bs:71.28,st:26.70,aa:12.83,ad:-5.60,ix:26.95,iy:34.07,sl:7.6,xw:0.29},
'678882':{n:'Rafaela, Ceddanne',bs:71.02,st:32.58,aa:11.53,ad:-1.41,ix:26.79,iy:33.50,sl:7.5,xw:0.305},
'668715':{n:'Steer, Spencer',bs:70.88,st:28.35,aa:12.32,ad:-4.03,ix:25.62,iy:32.66,sl:7.4,xw:0.293},
'592669':{n:'Renfroe, Hunter',bs:74.51,st:25.60,aa:9.07,ad:-6.67,ix:29.13,iy:37.01,sl:7.6,xw:0.257},
'682177':{n:'Schneemann, Daniel',bs:70.93,st:34.90,aa:14.04,ad:3.10,ix:26.08,iy:33.82,sl:7.0,xw:0.297},
'682657':{n:'Martínez, Angel',bs:70.18,st:33.71,aa:12.39,ad:-7.00,ix:24.42,iy:37.44,sl:7.4,xw:0.255},
'669065':{n:'Stowers, Kyle',bs:75.00,st:33.87,aa:11.62,ad:0.31,ix:29.31,iy:31.50,sl:6.7,xw:0.375},
'680977':{n:'Donovan, Brendan',bs:69.32,st:30.35,aa:7.87,ad:1.83,ix:28.48,iy:24.89,sl:6.8,xw:0.346},
'805300':{n:'Marsee, Jakob',bs:70.49,st:33.30,aa:5.33,ad:-2.15,ix:29.79,iy:30.03,sl:6.8,xw:0.347},
'694497':{n:'Carter, Evan',bs:69.96,st:32.74,aa:8.76,ad:-8.34,ix:23.78,iy:34.89,sl:7.2,xw:0.312},
'663968':{n:'Mangum, Jake',bs:67.31,st:29.25,aa:2.28,ad:11.54,ix:28.52,iy:21.02,sl:6.5,xw:0.276},
'680862':{n:'MacIver, Willie',bs:70.63,st:31.38,aa:8.94,ad:4.06,ix:31.25,iy:25.89,sl:7.4,xw:0.256},
'669911':{n:'Toglia, Michael',bs:72.72,st:35.83,aa:14.76,ad:-2.52,ix:30.38,iy:28.31,sl:7.6,xw:0.271},
'695734':{n:'Lile, Daylen',bs:69.15,st:37.86,aa:9.35,ad:-1.17,ix:25.78,iy:26.53,sl:7.1,xw:0.348},
'647304':{n:'Naylor, Josh',bs:70.80,st:31.38,aa:7.43,ad:-8.04,ix:26.47,iy:25.13,sl:7.6,xw:0.335},
'702284':{n:'Young, Cole',bs:71.38,st:28.08,aa:7.62,ad:1.00,ix:23.90,iy:23.95,sl:6.8,xw:0.297},
'668942':{n:'Rojas, Josh',bs:67.78,st:32.12,aa:9.88,ad:1.16,ix:29.61,iy:24.25,sl:7.2,xw:0.263},
'670770':{n:'Friedl, TJ',bs:69.89,st:28.31,aa:9.30,ad:-7.73,ix:24.33,iy:40.32,sl:6.7,xw:0.303},
'521692':{n:'Perez, Salvador',bs:72.94,st:34.19,aa:12.45,ad:-5.39,ix:27.30,iy:30.43,sl:7.9,xw:0.357},
'669224':{n:'Wells, Austin',bs:73.39,st:31.84,aa:10.48,ad:-5.72,ix:23.71,iy:30.48,sl:7.6,xw:0.294},
'663656':{n:'Tucker, Kyle',bs:72.04,st:33.86,aa:11.45,ad:-7.77,ix:30.18,iy:28.19,sl:7.6,xw:0.372},
'669221':{n:'Murphy, Sean',bs:72.61,st:30.84,aa:12.45,ad:-3.97,ix:30.98,iy:30.71,sl:7.8,xw:0.314},
'701762':{n:'Kurtz, Nick',bs:77.21,st:39.10,aa:14.26,ad:1.75,ix:27.74,iy:24.80,sl:7.7,xw:0.372},
'596019':{n:'Lindor, Francisco',bs:70.96,st:33.84,aa:11.11,ad:-1.57,ix:26.01,iy:29.32,sl:7.5,xw:0.345},
'663757':{n:'Grisham, Trent',bs:71.04,st:30.80,aa:16.65,ad:1.36,ix:30.99,iy:24.33,sl:7.6,xw:0.37},
'694671':{n:'Langford, Wyatt',bs:73.14,st:33.72,aa:16.76,ad:-3.11,ix:27.37,iy:32.02,sl:7.0,xw:0.346},
'578428':{n:'Iglesias, Jose',bs:68.91,st:33.57,aa:2.72,ad:3.93,ix:27.29,iy:24.81,sl:6.6,xw:0.281},
'672761':{n:'Pérez, Wenceel',bs:70.58,st:29.71,aa:8.11,ad:-4.17,ix:24.17,iy:28.35,sl:7.0,xw:0.31},
'680737':{n:'Helman, Michael',bs:70.12,st:27.96,aa:12.04,ad:-9.22,ix:24.97,iy:34.08,sl:7.7,xw:0.25},
'650968':{n:'Pozo, Yohel',bs:69.48,st:25.74,aa:6.75,ad:-1.93,ix:29.28,iy:29.12,sl:7.7,xw:0.276},
'677008':{n:'Kjerstad, Heston',bs:69.42,st:38.03,aa:12.74,ad:2.18,ix:29.13,iy:28.67,sl:7.0,xw:0.29},
'642201':{n:'White, Eli',bs:72.22,st:34.42,aa:9.01,ad:2.35,ix:30.45,iy:28.11,sl:7.2,xw:0.31},
'805367':{n:'Meidroth, Chase',bs:67.43,st:29.38,aa:6.67,ad:2.07,ix:28.23,iy:29.15,sl:6.7,xw:0.3},
'805249':{n:'Kemp, Otto',bs:72.78,st:34.70,aa:11.78,ad:-7.79,ix:23.02,iy:32.56,sl:7.5,xw:0.31},
'686217':{n:'Frelick, Sal',bs:68.16,st:28.10,aa:8.58,ad:-1.70,ix:27.36,iy:27.70,sl:7.1,xw:0.299},
'681082':{n:'Stott, Bryson',bs:69.34,st:32.75,aa:7.46,ad:2.04,ix:23.70,iy:28.24,sl:7.2,xw:0.313},
'595777':{n:'Profar, Jurickson',bs:70.93,st:30.87,aa:10.82,ad:-7.59,ix:25.76,iy:34.45,sl:7.5,xw:0.325},
'527038':{n:'Flores, Wilmer',bs:65.53,st:32.14,aa:11.23,ad:-6.60,ix:25.26,iy:31.38,sl:6.9,xw:0.281},
'666134':{n:'Jones, Nolan',bs:72.72,st:35.44,aa:8.90,ad:-0.14,ix:27.33,iy:32.71,sl:6.9,xw:0.301},
'670764':{n:'Walls, Taylor',bs:68.78,st:34.34,aa:10.23,ad:3.94,ix:26.14,iy:26.15,sl:7.0,xw:0.261},
'665742':{n:'Soto, Juan',bs:73.59,st:28.12,aa:10.94,ad:3.83,ix:30.25,iy:23.22,sl:7.0,xw:0.429},
'642215':{n:'Wilson, Weston',bs:74.06,st:34.47,aa:15.10,ad:-4.59,ix:28.19,iy:31.88,sl:7.8,xw:0.33},
'663616':{n:'Larnach, Trevor',bs:72.18,st:34.09,aa:8.33,ad:-10.59,ix:27.24,iy:34.25,sl:7.3,xw:0.315},
'681962':{n:'Capra, Vinny',bs:68.47,st:33.72,aa:11.65,ad:-5.71,ix:27.41,iy:30.40,sl:7.2,xw:0.211},
'676439':{n:'Feduccia, Hunter',bs:69.82,st:34.91,aa:10.71,ad:-1.37,ix:25.74,iy:31.21,sl:7.1,xw:0.275},
'543807':{n:'Springer, George',bs:73.74,st:35.17,aa:13.05,ad:-0.25,ix:27.11,iy:22.31,sl:7.5,xw:0.404},
'641943':{n:'Palacios, Joshua',bs:71.96,st:30.34,aa:7.83,ad:3.72,ix:30.08,iy:26.69,sl:7.2,xw:0.299},
'645277':{n:'Albies, Ozzie',bs:68.98,st:34.91,aa:12.74,ad:-5.34,ix:21.59,iy:36.87,sl:7.2,xw:0.299},
'660670':{n:'Acuña Jr., Ronald',bs:76.41,st:38.71,aa:11.87,ad:6.16,ix:25.48,iy:30.20,sl:7.6,xw:0.397},
'672820':{n:'Sosa, Lenyn',bs:72.57,st:32.59,aa:10.48,ad:0.48,ix:27.52,iy:32.72,sl:7.4,xw:0.326},
'686668':{n:'Doyle, Brenton',bs:70.75,st:30.29,aa:11.52,ad:0.59,ix:29.09,iy:26.04,sl:7.2,xw:0.3},
'571970':{n:'Muncy, Max',bs:71.04,st:34.63,aa:17.87,ad:-4.66,ix:28.33,iy:37.65,sl:7.0,xw:0.374},
'682829':{n:'De La Cruz, Elly',bs:74.49,st:33.65,aa:8.28,ad:-0.26,ix:29.94,iy:36.97,sl:7.2,xw:0.322},
'543309':{n:'Higashioka, Kyle',bs:70.91,st:32.30,aa:12.58,ad:-6.84,ix:23.79,iy:29.44,sl:7.2,xw:0.295},
'641343':{n:'Bauers, Jake',bs:76.39,st:34.36,aa:11.92,ad:-2.88,ix:26.51,iy:29.37,sl:7.7,xw:0.356},
'649966':{n:'Urías, Luis',bs:69.42,st:27.81,aa:11.19,ad:-2.03,ix:25.94,iy:29.71,sl:7.5,xw:0.3},
'671289':{n:'Freeman, Tyler',bs:71.32,st:35.57,aa:2.89,ad:0.53,ix:28.39,iy:29.57,sl:6.9,xw:0.325},
'643376':{n:'Jansen, Danny',bs:69.48,st:29.84,aa:14.94,ad:-5.07,ix:30.23,iy:35.21,sl:6.9,xw:0.299},
'671221':{n:'Waters, Drew',bs:71.57,st:41.77,aa:8.71,ad:4.85,ix:26.96,iy:31.26,sl:6.6,xw:0.265},
'673357':{n:'Robert Jr., Luis',bs:75.61,st:36.52,aa:12.17,ad:-5.17,ix:27.20,iy:30.48,sl:7.8,xw:0.321},
'666176':{n:'Adell, Jo',bs:77.61,st:33.83,aa:8.00,ad:-5.87,ix:28.09,iy:26.15,sl:7.7,xw:0.365},
'641680':{n:'Heim, Jonah',bs:68.96,st:28.61,aa:10.97,ad:0.42,ix:30.88,iy:28.25,sl:7.5,xw:0.276},
'691594':{n:'Sanoja, Javier',bs:68.33,st:20.40,aa:2.22,ad:-3.02,ix:27.54,iy:27.39,sl:7.3,xw:0.282},
'677951':{n:'Witt Jr., Bobby',bs:74.34,st:28.59,aa:5.10,ad:-0.23,ix:25.23,iy:27.78,sl:7.0,xw:0.365},
'572233':{n:'Walker, Christian',bs:74.12,st:29.42,aa:9.08,ad:-4.63,ix:26.30,iy:31.45,sl:7.5,xw:0.314},
'656775':{n:'Mullins, Cedric',bs:71.12,st:29.18,aa:11.31,ad:-6.03,ix:24.15,iy:28.65,sl:7.5,xw:0.284},
'656555':{n:'Hoskins, Rhys',bs:71.01,st:33.64,aa:16.76,ad:-6.92,ix:28.57,iy:32.50,sl:8.2,xw:0.314},
'663886':{n:'Stephenson, Tyler',bs:70.17,st:37.44,aa:13.41,ad:0.51,ix:29.25,iy:29.36,sl:7.4,xw:0.313},
'573262':{n:'Yastrzemski, Mike',bs:71.16,st:30.46,aa:11.01,ad:-2.88,ix:24.69,iy:30.40,sl:7.5,xw:0.329},
'805373':{n:'Alvarez Jr., Nacho',bs:67.72,st:30.35,aa:6.21,ad:0.05,ix:26.62,iy:28.87,sl:7.5,xw:0.27},
'687551':{n:'Gilbert, Drew',bs:72.20,st:24.36,aa:5.22,ad:-11.08,ix:29.47,iy:32.68,sl:7.6,xw:0.27},
'694212':{n:'Basallo, Samuel',bs:75.49,st:29.99,aa:9.70,ad:-1.61,ix:24.58,iy:34.14,sl:7.4,xw:0.286},
'690022':{n:'Ritter, Ryan',bs:69.14,st:35.19,aa:10.42,ad:1.13,ix:27.41,iy:27.98,sl:6.7,xw:0.248},
'571448':{n:'Arenado, Nolan',bs:71.43,st:33.20,aa:10.54,ad:-9.01,ix:29.31,iy:34.92,sl:8.4,xw:0.289},
'683002':{n:'Henderson, Gunnar',bs:75.34,st:29.03,aa:8.48,ad:1.01,ix:25.82,iy:33.42,sl:7.3,xw:0.341},
'547180':{n:'Harper, Bryce',bs:74.17,st:35.54,aa:11.49,ad:-1.97,ix:29.42,iy:33.06,sl:7.3,xw:0.368},
'695681':{n:'Moore, Christian',bs:72.71,st:33.20,aa:7.85,ad:3.51,ix:24.36,iy:30.53,sl:7.0,xw:0.282},
'621028':{n:'Newman, Kevin',bs:68.08,st:31.72,aa:6.71,ad:-2.37,ix:27.21,iy:32.14,sl:6.6,xw:0.218},
'695238':{n:'Wagner, Will',bs:69.05,st:31.83,aa:4.72,ad:0.53,ix:27.35,iy:26.82,sl:6.5,xw:0.318},
'663698':{n:'Bart, Joey',bs:74.29,st:34.10,aa:8.81,ad:-1.35,ix:28.63,iy:33.75,sl:7.3,xw:0.318},
'695657':{n:'Montgomery, Colson',bs:77.04,st:32.84,aa:11.50,ad:-8.66,ix:28.12,iy:34.86,sl:7.8,xw:0.341},
'691718':{n:'Crow-Armstrong, Pete',bs:72.70,st:34.79,aa:14.52,ad:-3.35,ix:26.60,iy:36.07,sl:7.2,xw:0.321},
'669242':{n:'Edman, Tommy',bs:70.40,st:26.37,aa:9.80,ad:-1.94,ix:27.46,iy:29.74,sl:6.9,xw:0.321},
'692225':{n:'Campbell, Kristian',bs:73.29,st:34.67,aa:11.30,ad:7.97,ix:29.69,iy:29.48,sl:6.8,xw:0.296},
'673962':{n:'Jung, Josh',bs:70.28,st:37.65,aa:11.46,ad:2.59,ix:25.01,iy:32.15,sl:7.0,xw:0.304},
'679845':{n:'Loftin, Nick',bs:69.38,st:29.83,aa:8.39,ad:-7.71,ix:28.04,iy:35.02,sl:7.1,xw:0.294},
'643217':{n:'Benintendi, Andrew',bs:68.75,st:32.48,aa:15.87,ad:-5.12,ix:22.41,iy:35.25,sl:7.1,xw:0.32},
'677800':{n:'Abreu, Wilyer',bs:74.13,st:31.17,aa:9.44,ad:-1.18,ix:26.58,iy:31.32,sl:7.1,xw:0.335},
'664983':{n:'McCarthy, Jake',bs:69.75,st:32.35,aa:8.41,ad:-1.25,ix:32.42,iy:28.46,sl:7.0,xw:0.286},
'671056':{n:'Herrera, Iván',bs:74.40,st:32.00,aa:8.70,ad:-0.51,ix:27.46,iy:31.50,sl:7.8,xw:0.371},
'682668':{n:'Acuña, Luisangel',bs:70.70,st:25.29,aa:3.44,ad:4.80,ix:25.48,iy:29.05,sl:7.3,xw:0.271},
'572191':{n:'Taylor, Michael A.',bs:72.36,st:31.18,aa:14.07,ad:0.77,ix:30.89,iy:30.19,sl:7.1,xw:0.271},
'695506':{n:'Caglianone, Jac',bs:77.36,st:28.51,aa:8.63,ad:-4.26,ix:28.97,iy:32.99,sl:7.6,xw:0.321},
'607732':{n:'Stallings, Jacob',bs:67.14,st:31.74,aa:12.25,ad:3.49,ix:28.45,iy:27.33,sl:7.2,xw:0.211},
'502671':{n:'Goldschmidt, Paul',bs:72.62,st:31.88,aa:9.70,ad:2.40,ix:34.08,iy:21.04,sl:7.6,xw:0.329},
'666181':{n:'Benson, Will',bs:71.77,st:33.53,aa:14.23,ad:-4.80,ix:31.49,iy:27.45,sl:7.5,xw:0.342},
'666163':{n:'Rortvedt, Ben',bs:68.74,st:28.93,aa:11.02,ad:-1.19,ix:26.94,iy:29.06,sl:7.0,xw:0.24},
'677950':{n:'Thomas, Alek',bs:71.19,st:27.62,aa:9.96,ad:0.23,ix:26.98,iy:33.46,sl:7.0,xw:0.289},
'669236':{n:'Jackson, Jeremiah',bs:71.94,st:27.21,aa:11.88,ad:-0.40,ix:32.31,iy:30.37,sl:7.3,xw:0.295},
'596103':{n:'Slater, Austin',bs:69.63,st:37.41,aa:10.13,ad:5.50,ix:25.80,iy:29.45,sl:6.8,xw:0.332},
'663697':{n:'India, Jonathan',bs:71.99,st:28.21,aa:9.08,ad:-4.62,ix:27.95,iy:30.68,sl:7.3,xw:0.315},
'664040':{n:'Lowe, Brandon',bs:73.85,st:33.49,aa:14.82,ad:-2.57,ix:26.61,iy:34.10,sl:7.2,xw:0.335},
'455117':{n:'Maldonado, Martín',bs:71.19,st:31.80,aa:15.05,ad:-7.67,ix:29.43,iy:36.46,sl:7.6,xw:0.251},
'656577':{n:'Jackson, Alex',bs:76.11,st:30.83,aa:11.66,ad:-8.66,ix:27.30,iy:35.45,sl:7.8,xw:0.27},
'664761':{n:'Bohm, Alec',bs:71.75,st:29.79,aa:5.40,ad:4.45,ix:29.69,iy:26.63,sl:7.3,xw:0.324},
'682988':{n:'Locklear, Tyler',bs:71.47,st:33.99,aa:12.62,ad:1.36,ix:31.36,iy:26.54,sl:7.2,xw:0.252},
'666152':{n:'Hamilton, David',bs:70.53,st:29.98,aa:6.86,ad:-4.66,ix:29.88,iy:31.50,sl:7.3,xw:0.26},
'645444':{n:'Herrera, Jose',bs:66.95,st:33.15,aa:7.37,ad:-5.40,ix:25.96,iy:30.52,sl:7.2,xw:0.237},
'666624':{n:'Morel, Christopher',bs:75.97,st:27.26,aa:14.92,ad:-9.24,ix:26.38,iy:34.46,sl:8.2,xw:0.304},
'608324':{n:'Bregman, Alex',bs:71.03,st:28.13,aa:13.47,ad:-5.14,ix:24.76,iy:31.84,sl:7.1,xw:0.337},
'683011':{n:'Volpe, Anthony',bs:72.62,st:31.56,aa:10.97,ad:5.67,ix:29.27,iy:25.01,sl:7.2,xw:0.301},
'665487':{n:'Tatis Jr., Fernando',bs:73.97,st:29.73,aa:8.32,ad:0.57,ix:28.96,iy:29.99,sl:7.3,xw:0.37},
'621438':{n:'Taylor, Tyrone',bs:70.30,st:32.34,aa:8.07,ad:-8.41,ix:25.53,iy:30.80,sl:7.5,xw:0.298},
'668670':{n:'Rogers, Jake',bs:70.53,st:31.21,aa:15.91,ad:-2.04,ix:28.86,iy:32.34,sl:7.5,xw:0.274},
'621439':{n:'Buxton, Byron',bs:75.03,st:34.04,aa:14.12,ad:-6.23,ix:27.76,iy:28.24,sl:7.9,xw:0.35},
'592192':{n:'Canha, Mark',bs:68.67,st:32.38,aa:11.43,ad:-1.00,ix:26.62,iy:30.44,sl:7.4,xw:0.268},
'656811':{n:'O\'Hearn, Ryan',bs:71.76,st:33.39,aa:11.10,ad:1.87,ix:29.33,iy:26.21,sl:7.1,xw:0.343},
'571657':{n:'Farmer, Kyle',bs:66.58,st:33.49,aa:12.67,ad:-0.84,ix:27.50,iy:32.59,sl:6.8,xw:0.285},
'687859':{n:'Johnston, Troy',bs:70.57,st:32.02,aa:11.29,ad:-4.11,ix:27.47,iy:32.92,sl:7.1,xw:0.341},
'672356':{n:'Arias, Gabriel',bs:75.08,st:29.10,aa:9.71,ad:1.32,ix:35.62,iy:34.33,sl:7.6,xw:0.286},
'668885':{n:'Martin, Austin',bs:68.24,st:39.90,aa:10.27,ad:-3.45,ix:26.79,iy:30.60,sl:6.9,xw:0.345},
'656305':{n:'Chapman, Matt',bs:74.95,st:25.35,aa:5.60,ad:-3.83,ix:29.81,iy:27.44,sl:7.5,xw:0.34},
'663604':{n:'Lockridge, Brandon',bs:71.14,st:29.73,aa:5.05,ad:3.58,ix:30.85,iy:29.72,sl:6.7,xw:0.267},
'656180':{n:'Adams, Riley',bs:78.30,st:34.64,aa:8.45,ad:-1.03,ix:29.04,iy:30.64,sl:7.9,xw:0.275},
'687597':{n:'Beck, Jordan',bs:73.20,st:32.74,aa:10.71,ad:-3.31,ix:29.47,iy:27.63,sl:7.7,xw:0.301},
'701538':{n:'Merrill, Jackson',bs:71.99,st:37.49,aa:9.87,ad:1.01,ix:28.77,iy:27.55,sl:7.4,xw:0.347},
'691019':{n:'Teel, Kyle',bs:69.45,st:38.82,aa:11.18,ad:4.69,ix:28.41,iy:28.97,sl:6.7,xw:0.337},
'691176':{n:'Domínguez, Jasson',bs:74.06,st:31.35,aa:6.47,ad:-3.57,ix:24.00,iy:30.13,sl:7.8,xw:0.306},
'683766':{n:'Koss, Christian',bs:69.88,st:28.22,aa:8.95,ad:5.04,ix:29.46,iy:25.54,sl:7.1,xw:0.311},
'681351':{n:'O\'Hoppe, Logan',bs:71.97,st:32.91,aa:15.71,ad:-3.66,ix:28.65,iy:33.60,sl:7.6,xw:0.301},
'670242':{n:'Wallner, Matt',bs:76.57,st:28.22,aa:12.51,ad:-6.21,ix:31.36,iy:37.33,sl:7.4,xw:0.327},
'681460':{n:'Baldwin, Brooks',bs:70.67,st:29.96,aa:11.19,ad:2.88,ix:30.14,iy:29.54,sl:7.1,xw:0.307},
'660271':{n:'Ohtani, Shohei',bs:75.89,st:37.11,aa:14.94,ad:-2.02,ix:31.91,iy:27.66,sl:7.9,xw:0.425},
'807713':{n:'Shaw, Matt',bs:69.58,st:26.75,aa:10.90,ad:-1.92,ix:28.10,iy:31.58,sl:7.0,xw:0.302},
'676059':{n:'Westburg, Jordan',bs:70.74,st:29.79,aa:10.49,ad:-1.49,ix:32.36,iy:31.15,sl:6.7,xw:0.327},
'669234':{n:'Malloy, Justyn-Henry',bs:70.50,st:40.67,aa:16.05,ad:-0.92,ix:28.66,iy:32.13,sl:7.1,xw:0.295},
'553869':{n:'Díaz, Elias',bs:72.85,st:29.08,aa:6.15,ad:-4.43,ix:26.60,iy:38.26,sl:6.9,xw:0.267},
'664770':{n:'Lukes, Nathan',bs:68.07,st:31.39,aa:7.26,ad:8.47,ix:30.82,iy:25.91,sl:6.5,xw:0.315},
'514888':{n:'Altuve, Jose',bs:69.71,st:28.77,aa:15.31,ad:-5.66,ix:30.14,iy:30.10,sl:7.6,xw:0.3},
'606115':{n:'Arcia, Orlando',bs:70.60,st:26.78,aa:7.42,ad:-0.29,ix:26.83,iy:29.11,sl:7.8,xw:0.24},
'677595':{n:'Mauricio, Ronny',bs:73.80,st:29.19,aa:7.37,ad:-2.28,ix:27.43,iy:33.63,sl:7.6,xw:0.286},
'669261':{n:'Suwinski, Jack',bs:73.89,st:34.55,aa:13.97,ad:2.50,ix:27.46,iy:27.04,sl:7.4,xw:0.31},
'678877':{n:'Noel, Jhonkensy',bs:77.81,st:29.10,aa:6.80,ad:-5.25,ix:33.47,iy:35.76,sl:7.5,xw:0.202},
'691026':{n:'Winn, Masyn',bs:71.10,st:29.10,aa:5.55,ad:-3.86,ix:23.06,iy:34.01,sl:7.5,xw:0.286},
'664702':{n:'Straw, Myles',bs:67.31,st:35.54,aa:6.76,ad:3.10,ix:25.93,iy:26.37,sl:6.8,xw:0.295},
'689414':{n:'Hicks, Liam',bs:67.37,st:32.63,aa:9.06,ad:-1.86,ix:26.26,iy:30.10,sl:6.7,xw:0.315},
'701305':{n:'Dezenzo, Zach',bs:73.54,st:39.72,aa:13.79,ad:0.96,ix:28.65,iy:29.92,sl:7.6,xw:0.316},
'519317':{n:'Stanton, Giancarlo',bs:80.76,st:27.94,aa:10.60,ad:-4.29,ix:33.92,iy:25.85,sl:8.8,xw:0.354},
'663457':{n:'Nootbaar, Lars',bs:73.44,st:27.96,aa:9.21,ad:-3.12,ix:27.86,iy:34.75,sl:6.9,xw:0.317},
'656537':{n:'Hill, Derek',bs:72.52,st:35.04,aa:14.40,ad:0.65,ix:26.90,iy:32.03,sl:7.3,xw:0.309},
'680728':{n:'Del Castillo, Adrian',bs:72.40,st:33.58,aa:13.97,ad:-5.71,ix:28.54,iy:37.17,sl:7.0,xw:0.269},
'545341':{n:'Grichuk, Randal',bs:73.90,st:28.32,aa:10.16,ad:-6.32,ix:28.46,iy:32.23,sl:7.7,xw:0.326},
'673237':{n:'Diaz, Yainer',bs:72.19,st:28.28,aa:10.41,ad:0.97,ix:28.30,iy:32.41,sl:7.3,xw:0.326},
'593871':{n:'Polanco, Jorge',bs:71.07,st:30.37,aa:9.55,ad:-10.54,ix:27.87,iy:32.15,sl:7.2,xw:0.343},
'802415':{n:'Simpson, Chandler',bs:64.19,st:30.17,aa:3.51,ad:6.90,ix:31.99,iy:20.97,sl:6.3,xw:0.297},
'678009':{n:'Meadows, Parker',bs:69.86,st:30.41,aa:8.02,ad:-4.19,ix:29.17,iy:34.62,sl:7.3,xw:0.291},
'642086':{n:'Smith, Dominic',bs:67.73,st:35.24,aa:12.48,ad:-4.05,ix:26.37,iy:35.73,sl:6.9,xw:0.306},
'663837':{n:'Vierling, Matt',bs:71.67,st:31.57,aa:6.77,ad:1.71,ix:27.59,iy:29.68,sl:7.4,xw:0.338},
'657136':{n:'Wong, Connor',bs:72.29,st:30.52,aa:11.63,ad:-2.21,ix:28.20,iy:32.89,sl:7.3,xw:0.266},
'666018':{n:'Aranda, Jonathan',bs:70.47,st:35.57,aa:10.21,ad:3.64,ix:29.27,iy:27.32,sl:7.3,xw:0.382},
'643396':{n:'Kiner-Falefa, Isiah',bs:66.56,st:32.39,aa:4.38,ad:3.82,ix:27.79,iy:28.67,sl:6.9,xw:0.262},
'642715':{n:'Adames, Willy',bs:72.05,st:35.29,aa:18.45,ad:-3.91,ix:28.94,iy:31.55,sl:8.1,xw:0.327},
'682928':{n:'Abrams, CJ',bs:72.40,st:27.25,aa:10.86,ad:-3.79,ix:30.03,iy:31.70,sl:7.6,xw:0.309},
'687231':{n:'Hernaiz, Darell',bs:68.25,st:32.58,aa:6.17,ad:0.47,ix:27.18,iy:27.65,sl:7.1,xw:0.305},
'676801':{n:'McCormick, Chas',bs:71.53,st:33.97,aa:21.19,ad:-1.14,ix:33.27,iy:27.76,sl:7.7,xw:0.299},
'693304':{n:'Gonzales, Nick',bs:70.52,st:33.15,aa:8.92,ad:-0.08,ix:26.95,iy:29.96,sl:7.6,xw:0.291},
'663853':{n:'Gonzalez, Romy',bs:74.24,st:27.56,aa:5.86,ad:3.83,ix:28.46,iy:26.25,sl:6.8,xw:0.344},
'668804':{n:'Reynolds, Bryan',bs:72.22,st:37.89,aa:13.05,ad:1.07,ix:27.25,iy:28.29,sl:6.9,xw:0.338},
'542932':{n:'Berti, Jon',bs:72.28,st:29.16,aa:2.22,ad:9.41,ix:28.41,iy:22.66,sl:7.4,xw:0.28},
'643289':{n:'Dubón, Mauricio',bs:68.20,st:29.83,aa:5.48,ad:1.11,ix:28.32,iy:26.87,sl:7.4,xw:0.278},
'691723':{n:'Mayo, Coby',bs:74.73,st:35.57,aa:10.84,ad:-16.58,ix:27.56,iy:35.68,sl:7.3,xw:0.289},
'669289':{n:'Espinal, Santiago',bs:68.46,st:34.58,aa:6.71,ad:-1.82,ix:25.82,iy:31.74,sl:7.4,xw:0.254},
'669701':{n:'Smith, Josh',bs:69.06,st:36.52,aa:8.60,ad:-1.85,ix:27.10,iy:30.78,sl:6.7,xw:0.31},
'700932':{n:'Manzardo, Kyle',bs:70.56,st:37.02,aa:17.17,ad:-0.32,ix:31.39,iy:33.46,sl:7.4,xw:0.322},
'663538':{n:'Hoerner, Nico',bs:68.46,st:33.30,aa:5.82,ad:-1.78,ix:27.68,iy:27.07,sl:7.2,xw:0.322},
'457705':{n:'McCutchen, Andrew',bs:71.12,st:34.47,aa:14.52,ad:-0.75,ix:28.98,iy:24.88,sl:7.7,xw:0.333},
'680757':{n:'Kwan, Steven',bs:63.69,st:35.69,aa:3.17,ad:-2.44,ix:22.67,iy:29.76,sl:6.3,xw:0.31},
'657557':{n:'DeJong, Paul',bs:72.19,st:34.71,aa:15.96,ad:-4.08,ix:26.91,iy:34.25,sl:6.9,xw:0.259},
'696285':{n:'Young, Jacob',bs:68.34,st:31.11,aa:5.96,ad:3.91,ix:31.49,iy:26.21,sl:7.1,xw:0.297},
'682641':{n:'Matos, Luis',bs:72.04,st:26.90,aa:7.08,ad:-6.49,ix:27.50,iy:34.11,sl:7.3,xw:0.274},
'641598':{n:'Garver, Mitch',bs:71.78,st:29.36,aa:15.80,ad:-8.08,ix:27.29,iy:34.88,sl:7.3,xw:0.298},
'667472':{n:'Myers, Dane',bs:70.97,st:27.11,aa:10.95,ad:3.73,ix:27.44,iy:29.50,sl:7.2,xw:0.308},
'676391':{n:'Clement, Ernie',bs:67.54,st:31.97,aa:11.50,ad:-3.14,ix:28.26,iy:31.16,sl:7.0,xw:0.292},
'664056':{n:'Bader, Harrison',bs:73.50,st:25.31,aa:12.03,ad:-5.42,ix:27.16,iy:33.56,sl:7.2,xw:0.297},
'624641':{n:'Sosa, Edmundo',bs:72.34,st:33.88,aa:10.21,ad:-2.19,ix:25.97,iy:29.24,sl:8.1,xw:0.29},
'677942':{n:'Alexander, Blaze',bs:72.11,st:36.09,aa:8.88,ad:3.92,ix:28.46,iy:23.79,sl:7.4,xw:0.305},
'682729':{n:'Clase, Jonatan',bs:71.75,st:32.29,aa:6.96,ad:-1.77,ix:25.85,iy:31.20,sl:6.7,xw:0.284},
'663586':{n:'Riley, Austin',bs:75.89,st:32.17,aa:10.84,ad:-4.47,ix:28.17,iy:35.58,sl:7.6,xw:0.33},
'702332':{n:'Durbin, Caleb',bs:67.87,st:27.60,aa:8.07,ad:-3.99,ix:27.16,iy:27.84,sl:6.8,xw:0.312},
'683734':{n:'Vaughn, Andrew',bs:70.70,st:29.50,aa:8.06,ad:-2.21,ix:29.07,iy:29.69,sl:7.3,xw:0.349},
'668930':{n:'Turang, Brice',bs:70.70,st:31.19,aa:7.09,ad:8.10,ix:26.73,iy:31.94,sl:6.8,xw:0.335},
'683737':{n:'Busch, Michael',bs:69.62,st:36.73,aa:16.22,ad:-1.16,ix:26.61,iy:32.54,sl:7.0,xw:0.378},
'673490':{n:'Kim, Ha-Seong',bs:70.50,st:23.43,aa:5.56,ad:-1.84,ix:26.28,iy:33.36,sl:7.0,xw:0.297},
'628451':{n:'Ibáñez, Andy',bs:69.22,st:29.31,aa:6.48,ad:-2.44,ix:25.48,iy:28.71,sl:7.2,xw:0.304},
'650490':{n:'Díaz, Yandy',bs:73.57,st:24.40,aa:2.93,ad:7.05,ix:28.67,iy:29.90,sl:7.6,xw:0.353},
'678662':{n:'Tovar, Ezequiel',bs:71.63,st:36.10,aa:10.94,ad:0.61,ix:23.87,iy:29.12,sl:7.5,xw:0.319},
'680474':{n:'Schuemann, Max',bs:68.61,st:30.49,aa:8.20,ad:2.79,ix:28.65,iy:26.13,sl:6.8,xw:0.297},
'665161':{n:'Peña, Jeremy',bs:72.32,st:30.42,aa:10.89,ad:-8.17,ix:26.23,iy:32.03,sl:7.6,xw:0.334},
'687401':{n:'Ortiz, Joey',bs:72.38,st:27.92,aa:1.57,ad:-1.59,ix:28.26,iy:28.88,sl:7.5,xw:0.275},
'670042':{n:'Raley, Luke',bs:73.84,st:31.45,aa:14.43,ad:-1.68,ix:27.97,iy:30.61,sl:7.1,xw:0.312},
'663368':{n:'Perkins, Blake',bs:69.99,st:30.25,aa:8.63,ad:3.42,ix:30.33,iy:26.98,sl:7.1,xw:0.279},
'677594':{n:'Rodríguez, Julio',bs:76.48,st:31.56,aa:7.01,ad:-1.76,ix:29.76,iy:32.34,sl:7.7,xw:0.348},
'686681':{n:'Massey, Michael',bs:70.12,st:31.42,aa:13.37,ad:-6.48,ix:27.06,iy:32.31,sl:7.2,xw:0.265},
'660162':{n:'Moncada, Yoán',bs:73.37,st:38.25,aa:12.19,ad:-5.41,ix:26.53,iy:33.91,sl:7.4,xw:0.324},
'641857':{n:'McMahon, Ryan',bs:74.03,st:38.84,aa:12.94,ad:1.01,ix:32.01,iy:26.68,sl:7.4,xw:0.322},
'669127':{n:'Langeliers, Shea',bs:73.82,st:30.31,aa:11.45,ad:-3.12,ix:29.67,iy:33.67,sl:7.2,xw:0.328},
'669357':{n:'Gorman, Nolan',bs:72.71,st:34.06,aa:14.79,ad:-1.85,ix:30.40,iy:33.09,sl:7.6,xw:0.296},
'543877':{n:'Vázquez, Christian',bs:67.01,st:26.77,aa:7.62,ad:-1.14,ix:27.56,iy:33.20,sl:6.8,xw:0.271},
'656976':{n:'Smith, Pavin',bs:72.00,st:32.72,aa:13.32,ad:0.90,ix:28.92,iy:28.40,sl:7.4,xw:0.319},
'621020':{n:'Swanson, Dansby',bs:70.90,st:34.57,aa:15.65,ad:-1.65,ix:27.59,iy:32.43,sl:7.4,xw:0.345},
'669720':{n:'Hays, Austin',bs:71.90,st:30.77,aa:14.19,ad:-5.53,ix:28.56,iy:35.75,sl:7.1,xw:0.3},
'606466':{n:'Marte, Ketel',bs:74.62,st:32.03,aa:10.15,ad:-7.19,ix:22.87,iy:36.77,sl:7.8,xw:0.39},
'650402':{n:'Torres, Gleyber',bs:70.11,st:33.94,aa:9.22,ad:4.35,ix:26.43,iy:30.22,sl:7.2,xw:0.363},
'666211':{n:'Trammell, Taylor',bs:74.57,st:30.00,aa:11.46,ad:-4.26,ix:26.39,iy:30.06,sl:7.8,xw:0.271},
'690987':{n:'Hassell III, Robert',bs:68.65,st:38.10,aa:11.82,ad:7.21,ix:25.75,iy:33.70,sl:6.9,xw:0.273},
'621035':{n:'Taylor, Chris',bs:69.85,st:37.45,aa:12.58,ad:-1.84,ix:31.77,iy:34.27,sl:7.1,xw:0.27},
'692216':{n:'Kayfus, CJ',bs:71.07,st:38.05,aa:11.37,ad:-2.05,ix:21.56,iy:29.95,sl:6.7,xw:0.322},
'669394':{n:'Burger, Jake',bs:74.65,st:24.95,aa:7.61,ad:-4.09,ix:31.77,iy:31.55,sl:7.4,xw:0.324},
'680776':{n:'Duran, Jarren',bs:74.78,st:26.52,aa:5.55,ad:0.15,ix:30.46,iy:31.73,sl:7.5,xw:0.326},
'671213':{n:'Casas, Triston',bs:75.12,st:36.01,aa:15.02,ad:-5.20,ix:29.50,iy:32.80,sl:8.0,xw:0.304},
'575929':{n:'Contreras, Willson',bs:75.99,st:32.78,aa:9.43,ad:-1.77,ix:30.31,iy:27.94,sl:8.0,xw:0.358},
'669364':{n:'Edwards, Xavier',bs:66.88,st:31.12,aa:2.68,ad:2.44,ix:24.40,iy:28.51,sl:6.4,xw:0.295},
'606192':{n:'Hernández, Teoscar',bs:72.94,st:31.91,aa:10.41,ad:-0.38,ix:29.75,iy:30.51,sl:7.8,xw:0.323},
'669450':{n:'Hummel, Cooper',bs:71.75,st:28.57,aa:12.04,ad:-6.67,ix:28.33,iy:31.92,sl:7.2,xw:0.313},
'681508':{n:'Gasper, Mickey',bs:70.57,st:26.93,aa:9.33,ad:-4.88,ix:28.97,iy:31.92,sl:6.5,xw:0.236},
'681146':{n:'Bride, Jonah',bs:68.24,st:30.94,aa:16.31,ad:-1.65,ix:30.76,iy:34.30,sl:7.3,xw:0.223},
'693307':{n:'Dingler, Dillon',bs:71.65,st:39.77,aa:10.80,ad:-0.12,ix:28.34,iy:27.62,sl:7.7,xw:0.351},
'687462':{n:'Horwitz, Spencer',bs:68.51,st:35.89,aa:10.01,ad:-1.97,ix:25.23,iy:30.10,sl:7.0,xw:0.326},
'702176':{n:'Roden, Alan',bs:70.10,st:27.04,aa:9.79,ad:-5.48,ix:28.22,iy:34.95,sl:7.2,xw:0.227},
'669016':{n:'Marsh, Brandon',bs:71.38,st:38.49,aa:9.45,ad:-0.41,ix:29.36,iy:27.56,sl:7.1,xw:0.33},
'687221':{n:'Rushing, Dalton',bs:73.14,st:34.10,aa:13.99,ad:-5.20,ix:28.11,iy:32.38,sl:7.6,xw:0.283},
'682663':{n:'Ramírez, Agustín',bs:75.23,st:25.18,aa:7.31,ad:-2.91,ix:30.15,iy:30.34,sl:7.5,xw:0.332},
'518934':{n:'LeMahieu, DJ',bs:67.59,st:28.31,aa:5.67,ad:12.65,ix:32.95,iy:22.09,sl:7.2,xw:0.295},
'671277':{n:'García Jr., Luis',bs:72.40,st:28.56,aa:10.72,ad:-2.56,ix:28.68,iy:33.39,sl:7.4,xw:0.339},
'642708':{n:'Rosario, Amed',bs:73.20,st:30.19,aa:6.60,ad:-4.45,ix:22.65,iy:31.53,sl:7.3,xw:0.331},
'608348':{n:'Kelly, Carson',bs:70.39,st:33.05,aa:11.58,ad:-4.07,ix:29.69,iy:30.94,sl:7.0,xw:0.321},
'687263':{n:'Neto, Zach',bs:71.41,st:39.04,aa:18.06,ad:-5.66,ix:21.57,iy:36.31,sl:7.1,xw:0.344},
'700246':{n:'Williams, Carson',bs:73.63,st:34.06,aa:15.34,ad:-2.66,ix:29.24,iy:28.11,sl:7.6,xw:0.233},
'682653':{n:'Bernabel, Warming',bs:69.21,st:33.84,aa:4.27,ad:-17.41,ix:25.31,iy:33.56,sl:7.6,xw:0.273},
'666158':{n:'Lux, Gavin',bs:69.58,st:33.31,aa:11.28,ad:2.40,ix:26.47,iy:32.09,sl:7.4,xw:0.299},
'592206':{n:'Castellanos, Nick',bs:70.55,st:39.90,aa:15.04,ad:-4.65,ix:29.00,iy:30.80,sl:7.7,xw:0.302},
'670224':{n:'Misner, Kameron',bs:73.18,st:37.08,aa:12.31,ad:-7.42,ix:29.01,iy:34.62,sl:7.8,xw:0.247},
'701358':{n:'Smith, Cam',bs:74.50,st:38.09,aa:7.51,ad:-1.20,ix:30.35,iy:29.39,sl:7.3,xw:0.304},
'592663':{n:'Realmuto, J.T.',bs:72.05,st:34.18,aa:12.36,ad:1.09,ix:27.46,iy:28.50,sl:7.5,xw:0.316},
'605141':{n:'Betts, Mookie',bs:69.09,st:34.69,aa:9.46,ad:-5.77,ix:28.77,iy:33.37,sl:7.0,xw:0.33},
'680869':{n:'Gelof, Zack',bs:72.08,st:34.59,aa:21.40,ad:0.02,ix:28.95,iy:28.14,sl:7.3,xw:0.219},
'683146':{n:'Baty, Brett',bs:74.80,st:35.47,aa:8.44,ad:3.73,ix:30.26,iy:26.66,sl:7.4,xw:0.334},
'691023':{n:'Walker, Jordan',bs:78.07,st:31.42,aa:6.18,ad:-5.32,ix:31.76,iy:30.07,sl:8.3,xw:0.278},
'621566':{n:'Olson, Matt',bs:73.94,st:33.88,aa:8.73,ad:1.14,ix:30.53,iy:32.51,sl:7.5,xw:0.36},
'663647':{n:'Hayes, Ke\'Bryan',bs:71.19,st:26.44,aa:4.27,ad:1.41,ix:25.86,iy:34.54,sl:6.8,xw:0.282},
'687363':{n:'Scott II, Victor',bs:69.03,st:32.20,aa:9.74,ad:-1.83,ix:24.08,iy:31.77,sl:6.4,xw:0.287},
'608701':{n:'Refsnyder, Rob',bs:73.22,st:31.85,aa:12.14,ad:0.02,ix:29.22,iy:29.16,sl:7.6,xw:0.338},
'656941':{n:'Schwarber, Kyle',bs:77.32,st:30.28,aa:14.65,ad:-6.01,ix:25.29,iy:33.53,sl:7.5,xw:0.403},
'677587':{n:'Rocchio, Brayan',bs:70.00,st:29.02,aa:11.02,ad:-5.92,ix:23.84,iy:34.27,sl:7.3,xw:0.295},
'686765':{n:'Sogard, Nick',bs:68.03,st:32.65,aa:15.61,ad:-5.03,ix:27.69,iy:39.52,sl:7.1,xw:0.302},
'664238':{n:'Moore, Dylan',bs:71.75,st:31.07,aa:7.74,ad:-2.50,ix:30.12,iy:27.00,sl:7.2,xw:0.262},
'518595':{n:'d\'Arnaud, Travis',bs:70.13,st:32.76,aa:14.88,ad:-3.95,ix:29.28,iy:31.59,sl:7.7,xw:0.271},
'668901':{n:'Vientos, Mark',bs:71.24,st:31.87,aa:14.57,ad:1.19,ix:28.77,iy:28.13,sl:7.6,xw:0.32},
'665019':{n:'Clemens, Kody',bs:72.19,st:26.98,aa:12.30,ad:-2.92,ix:27.58,iy:33.43,sl:7.3,xw:0.331},
'596142':{n:'Sánchez, Gary',bs:73.06,st:29.40,aa:13.33,ad:-7.78,ix:25.68,iy:36.87,sl:7.6,xw:0.315},
'647351':{n:'Toro, Abraham',bs:69.57,st:31.95,aa:11.19,ad:-2.76,ix:28.84,iy:35.48,sl:7.6,xw:0.302},
'660821':{n:'Sánchez, Jesús',bs:75.85,st:27.85,aa:7.11,ad:-1.78,ix:28.42,iy:35.03,sl:6.9,xw:0.323},
'695578':{n:'Wood, James',bs:76.05,st:39.68,aa:11.10,ad:1.92,ix:30.13,iy:32.68,sl:7.7,xw:0.361},
'642136':{n:'Thaiss, Matt',bs:72.22,st:27.73,aa:6.95,ad:0.91,ix:27.31,iy:30.76,sl:7.5,xw:0.294},
'688363':{n:'Pauley, Graham',bs:69.64,st:28.52,aa:9.11,ad:-4.97,ix:25.16,iy:32.59,sl:7.1,xw:0.299},
'592518':{n:'Machado, Manny',bs:74.48,st:26.48,aa:7.58,ad:-0.34,ix:31.10,iy:30.81,sl:7.8,xw:0.355},
'672275':{n:'Bailey, Patrick',bs:71.56,st:32.94,aa:8.54,ad:-3.54,ix:28.71,iy:30.36,sl:7.3,xw:0.264},
'669477':{n:'Schmitt, Casey',bs:71.66,st:35.02,aa:11.39,ad:-7.72,ix:23.54,iy:32.65,sl:7.5,xw:0.328},
'687952':{n:'Encarnacion-Strand, Christian',bs:73.62,st:35.19,aa:15.45,ad:-3.97,ix:27.79,iy:32.91,sl:7.4,xw:0.275},
'596115':{n:'Story, Trevor',bs:71.10,st:29.39,aa:10.50,ad:-4.54,ix:29.91,iy:35.37,sl:7.4,xw:0.311},
'500743':{n:'Rojas, Miguel',bs:68.05,st:32.08,aa:7.58,ad:-4.10,ix:28.61,iy:34.77,sl:7.1,xw:0.293},
'643565':{n:'Tauchman, Mike',bs:69.08,st:34.21,aa:8.53,ad:1.12,ix:29.63,iy:30.43,sl:7.2,xw:0.321},
'543510':{n:'McCann, James',bs:71.72,st:36.01,aa:10.97,ad:-3.58,ix:27.58,iy:38.29,sl:7.0,xw:0.313},
'571771':{n:'Hernández, Enrique',bs:71.12,st:29.74,aa:10.36,ad:-3.91,ix:31.00,iy:32.35,sl:7.5,xw:0.287},
'669326':{n:'Teodosio, Bryce',bs:68.93,st:32.69,aa:9.42,ad:1.77,ix:29.29,iy:30.19,sl:6.6,xw:0.222},
'663330':{n:'Jones, Jahmai',bs:73.60,st:29.77,aa:12.96,ad:-5.66,ix:29.39,iy:32.42,sl:7.6,xw:0.399},
'665804':{n:'Amaya, Miguel',bs:72.18,st:34.93,aa:11.07,ad:-11.27,ix:26.97,iy:31.03,sl:7.7,xw:0.295},
'624413':{n:'Alonso, Pete',bs:75.26,st:33.82,aa:10.12,ad:1.06,ix:27.14,iy:28.26,sl:7.1,xw:0.386},
'672724':{n:'Peraza, Oswald',bs:73.59,st:26.25,aa:7.55,ad:-2.72,ix:29.66,iy:29.51,sl:7.7,xw:0.248},
'605137':{n:'Bell, Josh',bs:73.08,st:33.65,aa:10.05,ad:-2.92,ix:28.39,iy:27.57,sl:8.0,xw:0.359},
'694192':{n:'Chourio, Jackson',bs:73.93,st:26.47,aa:7.22,ad:1.20,ix:30.36,iy:28.11,sl:7.5,xw:0.307},
'677649':{n:'Duran, Ezequiel',bs:71.50,st:28.50,aa:6.00,ad:-0.62,ix:25.01,iy:30.39,sl:7.2,xw:0.247},
'686555':{n:'Collins, Isaac',bs:72.69,st:28.81,aa:4.11,ad:-2.28,ix:30.03,iy:32.20,sl:6.7,xw:0.322},
'645302':{n:'Robles, Victor',bs:66.75,st:33.03,aa:9.88,ad:-3.61,ix:31.32,iy:23.60,sl:6.8,xw:0.237},
'672744':{n:'Canario, Alexander',bs:75.99,st:35.17,aa:13.54,ad:1.88,ix:27.55,iy:28.95,sl:8.1,xw:0.295},
'669707':{n:'Triolo, Jared',bs:71.63,st:37.29,aa:8.81,ad:-2.47,ix:26.94,iy:28.26,sl:7.8,xw:0.31},
'671732':{n:'Butler, Lawrence',bs:73.75,st:30.46,aa:6.82,ad:1.73,ix:31.23,iy:28.81,sl:7.1,xw:0.304},
'701350':{n:'Anthony, Roman',bs:75.15,st:30.10,aa:10.64,ad:-1.33,ix:25.39,iy:36.04,sl:7.4,xw:0.372},
'671739':{n:'Harris II, Michael',bs:74.32,st:30.76,aa:6.90,ad:-0.98,ix:28.53,iy:30.79,sl:8.0,xw:0.315},
'666971':{n:'Gurriel Jr., Lourdes',bs:70.59,st:36.88,aa:10.50,ad:-6.02,ix:26.06,iy:31.10,sl:7.5,xw:0.315},
'661388':{n:'Contreras, William',bs:73.28,st:29.05,aa:10.76,ad:2.65,ix:27.98,iy:30.48,sl:7.1,xw:0.331},
'691016':{n:'Soderstrom, Tyler',bs:73.96,st:30.55,aa:9.58,ad:1.20,ix:31.46,iy:28.02,sl:7.5,xw:0.341},
'657656':{n:'Laureano, Ramón',bs:72.19,st:35.14,aa:15.57,ad:1.02,ix:31.59,iy:32.78,sl:7.0,xw:0.362},
'642133':{n:'Tellez, Rowdy',bs:74.75,st:29.76,aa:8.04,ad:-7.70,ix:25.95,iy:35.26,sl:8.0,xw:0.328},
'700337':{n:'Quero, Edgar',bs:67.50,st:31.51,aa:6.02,ad:9.50,ix:29.62,iy:25.13,sl:6.7,xw:0.29},
'696030':{n:'Osuna, Alejandro',bs:71.23,st:29.85,aa:4.69,ad:5.08,ix:24.07,iy:28.47,sl:7.0,xw:0.338},
'681297':{n:'Cowser, Colton',bs:73.56,st:39.15,aa:16.08,ad:-3.43,ix:28.28,iy:36.28,sl:7.3,xw:0.293},
'657077':{n:'Verdugo, Alex',bs:67.37,st:30.93,aa:1.84,ad:-0.63,ix:23.41,iy:32.06,sl:6.2,xw:0.306},
'694374':{n:'Tawa, Tim',bs:73.08,st:31.82,aa:11.12,ad:-5.37,ix:26.05,iy:32.59,sl:7.1,xw:0.29},
'672016':{n:'Clarke, Denzel',bs:74.30,st:31.11,aa:4.25,ad:2.06,ix:27.40,iy:27.89,sl:7.7,xw:0.254},
'666969':{n:'García, Adolis',bs:72.13,st:28.02,aa:8.77,ad:-0.46,ix:25.17,iy:31.31,sl:7.6,xw:0.304},
'592626':{n:'Pederson, Joc',bs:73.37,st:28.29,aa:10.00,ad:-5.85,ix:24.62,iy:29.75,sl:7.6,xw:0.315},
'660688':{n:'Ruiz, Keibert',bs:66.07,st:34.19,aa:10.37,ad:-8.98,ix:24.83,iy:36.89,sl:7.0,xw:0.287},
'808982':{n:'Lee, Jung Hoo',bs:68.34,st:39.44,aa:5.21,ad:-4.62,ix:21.12,iy:30.21,sl:7.5,xw:0.321},
'666160':{n:'Moniak, Mickey',bs:73.77,st:33.63,aa:11.58,ad:-4.33,ix:30.78,iy:29.13,sl:7.7,xw:0.337},
'657041':{n:'Thomas, Lane',bs:72.74,st:27.55,aa:8.96,ad:-3.94,ix:29.21,iy:28.94,sl:6.9,xw:0.243},
'543760':{n:'Semien, Marcus',bs:68.43,st:34.77,aa:15.77,ad:-3.86,ix:23.99,iy:30.49,sl:7.7,xw:0.318},
'646240':{n:'Devers, Rafael',bs:71.58,st:29.89,aa:9.96,ad:4.52,ix:25.92,iy:28.55,sl:7.6,xw:0.367},
'664023':{n:'Happ, Ian',bs:71.71,st:32.75,aa:10.27,ad:-5.53,ix:26.70,iy:33.97,sl:6.9,xw:0.354},
'672640':{n:'Lopez, Otto',bs:71.70,st:29.93,aa:7.40,ad:-2.31,ix:28.52,iy:30.48,sl:6.8,xw:0.33},
'542303':{n:'Ozuna, Marcell',bs:72.88,st:36.85,aa:13.94,ad:-0.91,ix:26.10,iy:32.40,sl:7.2,xw:0.354},
'668939':{n:'Rutschman, Adley',bs:70.07,st:34.56,aa:9.37,ad:-1.32,ix:26.39,iy:26.00,sl:6.9,xw:0.325},
'665862':{n:'Chisholm Jr., Jazz',bs:73.91,st:32.79,aa:15.65,ad:-5.82,ix:25.81,iy:31.52,sl:7.8,xw:0.346},
'672386':{n:'Kirk, Alejandro',bs:72.58,st:24.00,aa:7.70,ad:4.71,ix:31.44,iy:29.85,sl:7.2,xw:0.359},
'457759':{n:'Turner, Justin',bs:66.33,st:34.35,aa:9.16,ad:1.74,ix:22.00,iy:37.07,sl:6.4,xw:0.297},
'681715':{n:'Hernández, Heriberto',bs:73.36,st:30.03,aa:15.64,ad:-0.90,ix:26.88,iy:33.14,sl:7.7,xw:0.334},
'665828':{n:'Cabrera, Oswaldo',bs:69.31,st:32.14,aa:8.56,ad:-0.83,ix:27.14,iy:29.16,sl:7.3,xw:0.284},
'518692':{n:'Freeman, Freddie',bs:69.92,st:42.93,aa:10.64,ad:0.71,ix:30.54,iy:27.07,sl:6.9,xw:0.35},
'593428':{n:'Bogaerts, Xander',bs:72.23,st:31.00,aa:10.29,ad:-7.11,ix:29.13,iy:34.87,sl:7.3,xw:0.327},
'664059':{n:'Haggerty, Sam',bs:71.78,st:32.23,aa:3.05,ad:-0.46,ix:30.00,iy:27.49,sl:6.9,xw:0.304},
'670223':{n:'Mervis, Matt',bs:73.63,st:33.76,aa:18.87,ad:-11.49,ix:29.26,iy:33.70,sl:8.3,xw:0.223},
'663728':{n:'Raleigh, Cal',bs:75.28,st:34.31,aa:17.84,ad:-8.10,ix:24.49,iy:35.92,sl:7.9,xw:0.371},
'805779':{n:'Wilson, Jacob',bs:63.88,st:35.13,aa:2.83,ad:-1.02,ix:25.67,iy:30.57,sl:6.1,xw:0.304},
'665966':{n:'Narváez, Carlos',bs:72.31,st:30.10,aa:9.20,ad:2.46,ix:29.20,iy:30.69,sl:7.6,xw:0.293},
'666310':{n:'Naylor, Bo',bs:72.35,st:31.96,aa:13.45,ad:-8.01,ix:31.18,iy:34.98,sl:7.8,xw:0.292},
'700242':{n:'Sweeney, Trey',bs:73.56,st:26.61,aa:8.16,ad:-3.24,ix:26.87,iy:34.09,sl:7.5,xw:0.245},
'607043':{n:'Nimmo, Brandon',bs:72.25,st:29.06,aa:6.65,ad:2.11,ix:31.49,iy:26.88,sl:7.2,xw:0.321},
'624512':{n:'McGuire, Reese',bs:70.68,st:32.65,aa:13.91,ad:-7.87,ix:29.26,iy:31.89,sl:8.2,xw:0.254},
'570482':{n:'Urshela, Gio',bs:68.63,st:36.18,aa:10.96,ad:3.59,ix:28.18,iy:31.95,sl:7.2,xw:0.286},
'665489':{n:'Guerrero Jr., Vladimir',bs:76.80,st:27.61,aa:1.15,ad:-4.67,ix:28.77,iy:34.40,sl:7.6,xw:0.384},
'642851':{n:'Wynns, Austin',bs:70.88,st:34.42,aa:13.42,ad:-7.57,ix:29.05,iy:33.96,sl:7.5,xw:0.295},
'608369':{n:'Seager, Corey',bs:72.55,st:34.23,aa:12.85,ad:3.51,ix:29.05,iy:31.99,sl:6.7,xw:0.4},
'656896':{n:'Rivera, Emmanuel',bs:68.31,st:32.36,aa:6.26,ad:0.16,ix:25.05,iy:30.08,sl:6.9,xw:0.267},
'642180':{n:'Wade, Tyler',bs:65.00,st:31.76,aa:7.32,ad:-1.34,ix:27.29,iy:27.92,sl:6.7,xw:0.247},
'670541':{n:'Alvarez, Yordan',bs:76.13,st:36.68,aa:10.18,ad:-4.94,ix:28.17,iy:36.08,sl:7.7,xw:0.393},
'641487':{n:'Crawford, J.P.',bs:71.11,st:35.98,aa:4.61,ad:1.77,ix:27.69,iy:36.39,sl:7.2,xw:0.329},
'657757':{n:'Sheets, Gavin',bs:74.79,st:27.52,aa:8.36,ad:-7.49,ix:29.18,iy:34.10,sl:7.7,xw:0.34},
'691777':{n:'Muncy, Max',bs:73.12,st:31.16,aa:9.33,ad:-5.73,ix:28.23,iy:33.09,sl:7.3,xw:0.267},
'666023':{n:'Fermin, Freddy',bs:69.57,st:34.49,aa:8.84,ad:-0.62,ix:27.65,iy:28.81,sl:7.3,xw:0.271},
'456781':{n:'Solano, Donovan',bs:65.95,st:33.95,aa:8.81,ad:-1.80,ix:26.99,iy:28.91,sl:6.9,xw:0.259},
'623168':{n:'Heineman, Tyler',bs:66.16,st:28.99,aa:6.22,ad:-12.16,ix:28.46,iy:34.68,sl:7.1,xw:0.273},
'678246':{n:'Vargas, Miguel',bs:70.63,st:35.43,aa:11.90,ad:-2.99,ix:28.07,iy:35.31,sl:7.6,xw:0.319},
'690993':{n:'Keith, Colt',bs:70.75,st:32.95,aa:11.90,ad:-2.76,ix:28.67,iy:31.60,sl:6.8,xw:0.341},
'807799':{n:'Yoshida, Masataka',bs:71.84,st:32.74,aa:9.79,ad:-1.45,ix:25.13,iy:31.35,sl:7.4,xw:0.314},
'672580':{n:'Garcia, Maikel',bs:71.91,st:27.12,aa:4.53,ad:0.52,ix:25.94,iy:33.92,sl:7.3,xw:0.335},
'691720':{n:'Karros, Kyle',bs:69.06,st:37.84,aa:7.45,ad:-7.21,ix:28.91,iy:28.41,sl:7.1,xw:0.261},
'641933':{n:'O\'Neill, Tyler',bs:73.95,st:35.83,aa:19.08,ad:-7.29,ix:24.87,iy:33.70,sl:7.7,xw:0.36},
'682622':{n:'Marte, Noelvi',bs:73.24,st:31.02,aa:9.86,ad:-4.48,ix:27.45,iy:34.77,sl:7.4,xw:0.304},
'609280':{n:'Andujar, Miguel',bs:71.69,st:25.84,aa:6.27,ad:-6.77,ix:30.72,iy:32.73,sl:7.8,xw:0.298},
'665833':{n:'Cruz, Oneil',bs:78.79,st:33.45,aa:9.17,ad:-7.27,ix:26.72,iy:35.35,sl:7.8,xw:0.324},
'680779':{n:'Davis, Henry',bs:73.95,st:26.35,aa:8.58,ad:-7.52,ix:27.67,iy:30.40,sl:7.3,xw:0.293},
'664774':{n:'Wade Jr., LaMonte',bs:70.02,st:31.83,aa:9.06,ad:0.30,ix:23.26,iy:32.33,sl:6.7,xw:0.281},
'681546':{n:'Outman, James',bs:72.62,st:37.50,aa:17.73,ad:-5.41,ix:27.81,iy:32.48,sl:7.8,xw:0.265},
'680777':{n:'Jeffers, Ryan',bs:72.35,st:28.59,aa:9.92,ad:-3.28,ix:27.33,iy:29.14,sl:7.3,xw:0.325},
'672695':{n:'Perdomo, Geraldo',bs:68.26,st:35.39,aa:7.43,ad:-1.82,ix:25.55,iy:25.28,sl:6.9,xw:0.356},
'677588':{n:'Tena, José',bs:70.80,st:35.06,aa:3.58,ad:2.38,ix:25.91,iy:30.74,sl:6.8,xw:0.302},
'670623':{n:'Paredes, Isaac',bs:68.96,st:32.50,aa:15.57,ad:-15.42,ix:25.83,iy:37.82,sl:8.0,xw:0.32},
'624428':{n:'Frazier, Adam',bs:65.89,st:39.18,aa:11.39,ad:3.02,ix:22.09,iy:24.04,sl:6.9,xw:0.279},
'667670':{n:'Rooker, Brent',bs:73.55,st:36.28,aa:12.27,ad:-6.13,ix:27.22,iy:32.82,sl:7.1,xw:0.351},
'681393':{n:'Norby, Connor',bs:69.34,st:41.44,aa:19.70,ad:4.18,ix:26.06,iy:32.28,sl:7.0,xw:0.307},
'694384':{n:'Schanuel, Nolan',bs:67.53,st:38.50,aa:8.63,ad:-1.01,ix:23.25,iy:30.75,sl:6.7,xw:0.327},
'620443':{n:'Torrens, Luis',bs:70.76,st:29.85,aa:9.74,ad:6.14,ix:29.94,iy:25.43,sl:7.2,xw:0.338},
'663743':{n:'Fortes, Nick',bs:71.99,st:19.57,aa:3.46,ad:-7.61,ix:27.76,iy:30.61,sl:7.3,xw:0.27},
'807712':{n:'Keaschall, Luke',bs:66.93,st:35.57,aa:8.14,ad:-1.13,ix:27.60,iy:33.09,sl:6.4,xw:0.324},
'665561':{n:'Marchán, Rafael',bs:65.89,st:32.40,aa:11.28,ad:-1.56,ix:28.00,iy:30.60,sl:7.5,xw:0.261},
'592450':{n:'Judge, Aaron',bs:77.03,st:38.36,aa:14.02,ad:-6.08,ix:33.10,iy:30.56,sl:8.1,xw:0.46},
'668709':{n:'Bleday, JJ',bs:71.68,st:31.67,aa:15.48,ad:-11.07,ix:31.47,iy:31.98,sl:7.5,xw:0.276},
'656716':{n:'McKinstry, Zach',bs:67.45,st:37.41,aa:9.99,ad:1.16,ix:26.40,iy:27.37,sl:6.8,xw:0.305},
'669743':{n:'Call, Alex',bs:66.19,st:33.48,aa:7.04,ad:7.98,ix:27.40,iy:27.64,sl:6.5,xw:0.321},
'691781':{n:'House, Brady',bs:72.42,st:35.41,aa:8.51,ad:3.38,ix:27.21,iy:26.67,sl:7.5,xw:0.284},
'810938':{n:'Williamson, Ben',bs:69.71,st:32.93,aa:2.53,ad:5.80,ix:28.60,iy:25.48,sl:6.9,xw:0.269},
'686797':{n:'Lee, Brooks',bs:69.51,st:30.91,aa:11.30,ad:-4.63,ix:27.91,iy:30.06,sl:7.2,xw:0.289},
'621493':{n:'Ward, Taylor',bs:69.47,st:32.12,aa:9.10,ad:-2.89,ix:25.72,iy:33.46,sl:7.1,xw:0.333},
'665926':{n:'Giménez, Andrés',bs:69.22,st:31.67,aa:8.49,ad:2.64,ix:29.34,iy:29.11,sl:7.0,xw:0.308},
'691406':{n:'Caminero, Junior',bs:78.54,st:26.21,aa:7.98,ad:-5.28,ix:28.64,iy:35.91,sl:8.4,xw:0.346},
'672515':{n:'Moreno, Gabriel',bs:70.92,st:33.78,aa:8.27,ad:4.39,ix:26.33,iy:33.38,sl:6.9,xw:0.346},
'673548':{n:'Suzuki, Seiya',bs:73.38,st:31.07,aa:7.98,ad:-3.01,ix:27.86,iy:34.35,sl:7.2,xw:0.352},
'692585':{n:'Fernández, Yanquiel',bs:74.53,st:28.60,aa:10.57,ad:-11.42,ix:27.69,iy:36.38,sl:8.0,xw:0.243},
'679529':{n:'Torkelson, Spencer',bs:73.08,st:37.92,aa:13.56,ad:-8.14,ix:27.97,iy:30.72,sl:7.8,xw:0.334},
'696100':{n:'Goodman, Hunter',bs:74.38,st:25.24,aa:13.39,ad:-7.25,ix:29.53,iy:38.77,sl:7.3,xw:0.324},
'592885':{n:'Yelich, Christian',bs:73.38,st:36.29,aa:9.83,ad:6.92,ix:29.92,iy:26.73,sl:7.5,xw:0.33},
'677347':{n:'Paris, Kyren',bs:73.20,st:37.39,aa:16.22,ad:-5.38,ix:25.47,iy:26.60,sl:7.5,xw:0.265},
'690924':{n:'Fulford, Braxton',bs:71.57,st:29.17,aa:11.04,ad:-8.28,ix:26.04,iy:36.47,sl:6.6,xw:0.262},
'621043':{n:'Correa, Carlos',bs:73.81,st:33.07,aa:7.67,ad:-1.54,ix:28.79,iy:28.46,sl:7.2,xw:0.338},
'545121':{n:'Vargas, Ildemaro',bs:70.51,st:23.62,aa:5.74,ad:-6.56,ix:24.59,iy:28.08,sl:7.4,xw:0.287},
'607208':{n:'Turner, Trea',bs:71.19,st:27.81,aa:7.99,ad:-2.90,ix:28.80,iy:29.31,sl:7.6,xw:0.321},
'676475':{n:'Burleson, Alec',bs:72.36,st:31.79,aa:10.04,ad:0.34,ix:23.41,iy:31.58,sl:7.5,xw:0.345},
'691785':{n:'Mayer, Marcelo',bs:74.12,st:31.92,aa:7.48,ad:-2.82,ix:27.46,iy:29.71,sl:7.8,xw:0.263},
'642731':{n:'Estrada, Thairo',bs:71.80,st:30.38,aa:11.65,ad:-4.80,ix:26.94,iy:35.98,sl:7.3,xw:0.264},
'630105':{n:'Cronenworth, Jake',bs:70.95,st:31.07,aa:7.45,ad:-0.65,ix:28.35,iy:30.59,sl:7.0,xw:0.319},
'608070':{n:'Ramírez, José',bs:70.93,st:29.80,aa:8.76,ad:-9.29,ix:22.67,iy:32.52,sl:7.2,xw:0.342}
};

// ── Module-level helpers (stable references, safe for useCallback) ──────────

const COUNT_RE = {
  '0-0': 0.320, '1-0': 0.370, '2-0': 0.430, '3-0': 0.530,
  '0-1': 0.270, '1-1': 0.310, '2-1': 0.370, '3-1': 0.450,
  '0-2': 0.170, '1-2': 0.195, '2-2': 0.230, '3-2': 0.310,
};
const takeValue   = (b, s) => b === 3 ? 0.560 : (COUNT_RE[`${b + 1}-${s}`] ?? 0.320);
const strikeValue = (b, s) => s === 2 ? 0.000 : (COUNT_RE[`${b}-${s + 1}`] ?? 0.320);

const parseCSV = (line) => {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  result.push(cur.trim());
  return result;
};

const categorizeZone = (zone) => {
  if (!zone) return 'chase';
  const z = parseInt(zone);
  // Gameday zones: 1-9 = in strike zone, 11-14 = shadow (border corners), else = chase
  const map = { 1:'upper_inner',2:'upper_middle',3:'upper_outer',4:'middle_inner',5:'middle_middle',6:'middle_outer',7:'lower_inner',8:'lower_middle',9:'lower_outer' };
  if (map[z]) return map[z];
  if (z === 11 || z === 12 || z === 13 || z === 14) return 'shadow';
  return 'chase';
};

const bucketKey = (b, s, zoneType) => {
  const cb = (b === 3 && s === 0) ? '3-0'
           : (b === 3 && s === 1) ? '3-1'
           : (b === 3 && s === 2) ? '3-2'
           : (s === 2)            ? '2str'
           : 'other';
  return `${cb}__${zoneType}`;
};

// ── Mini Zone Grid (inline table cell) ──────────────────────────────────────
const LEAGUE_AVG_XWOBA = 0.312; // 2025 MLB league average xwOBA

const MiniZoneGrid = ({ grid }) => {
  if (!grid || !grid.length) return <div style={{ color: '#334155', fontSize: 10 }}>—</div>;

  const cellColor = (xwoba) => {
    // Color relative to league average: red = well below, green = well above
    const diff = xwoba - LEAGUE_AVG_XWOBA;
    const t = Math.max(0, Math.min(1, (diff + 0.12) / 0.24)); // ±0.12 range
    let r, g, b;
    if (t < 0.5) {
      const u = t * 2;
      r = Math.round(220 + (250 - 220) * u);
      g = Math.round(38  + (204 - 38)  * u);
      b = Math.round(38  + (21  - 38)  * u);
    } else {
      const u = (t - 0.5) * 2;
      r = Math.round(250 + (34  - 250) * u);
      g = Math.round(204 + (197 - 204) * u);
      b = Math.round(21  + (94  - 21)  * u);
    }
    return { bg: `rgb(${r},${g},${b})` };
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      {grid.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 2 }}>
          {row.map((cell, ci) => {
            const { bg } = cellColor(cell.xwoba);
            return (
              <div key={ci} style={{
                width: 40, height: 40, borderRadius: 4,
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#000', fontFamily: "'Outfit', sans-serif" }}>
                  {cell.xwoba.toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ── Zone Grid Component ──────────────────────────────────────────────────────
const ZoneGrid = ({ grid, avg }) => {
  // Color scale: green → lime → yellow → orange → red (matching app palette)
  const zoneColor = (t) => {
    // t = 0 (worst/red) to 1 (best/green)
    if (t >= 0.85) return { bg: '#166534', text: '#22c55e' };       // dark green
    if (t >= 0.65) return { bg: '#1a4731', text: '#4ade80' };       // green
    if (t >= 0.50) return { bg: '#3b4a1a', text: '#a3e635' };       // lime
    if (t >= 0.35) return { bg: '#422006', text: '#f59e0b' };       // yellow/amber
    if (t >= 0.20) return { bg: '#431407', text: '#f97316' };       // orange
    return            { bg: '#450a0a', text: '#ef4444' };           // red
  };

  if (!grid || !grid.length) {
    return (
      <div>
        <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>xwOBA ZONE PROFILE</div>
        <div style={{ color: '#475569', fontSize: 12 }}>No zone data available</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>xwOBA ZONE PROFILE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 'fit-content' }}>
        {grid.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4 }}>
            {row.map((cell, ci) => {
              const diff = cell.xwoba - LEAGUE_AVG_XWOBA;
              const t = Math.max(0, Math.min(1, (diff + 0.12) / 0.24));
              const { bg, text } = zoneColor(t);
              return (
                <div key={ci} style={{
                  width: 72, height: 56, borderRadius: 8,
                  background: bg, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${text}40`
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: text, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                    {cell.xwoba.toFixed(3)}
                  </div>
                  <div style={{ fontSize: 9, color: text + '99', marginTop: 3 }}>n={cell.n}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>avg: {(avg ?? 0).toFixed(3)}</div>
    </div>
  );
};

const HitterPlusApp = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'hitter_plus', direction: 'desc' });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [statcastFile, setStatcastFile] = useState(null);
  const [troutResults, setTroutResults] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [dataSource, setDataSource] = useState(null); // 'supabase' | 'csv'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]           = useState(null);
  const [showInfo, setShowInfo]     = useState(false);

  // ── Supabase fetch — loads pre-computed Trout+ stats (tiny table, fast) ──
  const fetchFromSupabase = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    setProcessing(true); setError(null); setProgress(10);
    console.log('fetchFromSupabase START', { season: ACTIVE_SEASON, url: SUPABASE_URL });

    try {
      const base = `${SUPABASE_URL}/rest/v1`;
      const headers = {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
      };

      // Fetch metadata
      const metaRes = await fetch(`${base}/scraper_meta?id=eq.${ACTIVE_SEASON}&select=*`, { headers });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta?.[0]) setLastUpdated(meta[0].last_updated);
      }
      setProgress(20);

      // Fetch pre-computed Trout+ stats (~500 rows, fast)
      const statsRes = await fetch(`${base}/trout_stats_${ACTIVE_SEASON}?select=*&limit=1000`, { headers });
      if (!statsRes.ok) throw new Error(`HTTP ${statsRes.status}: ${await statsRes.text()}`);
      const stats = await statsRes.json();
      console.log('Trout stats fetched:', stats.length, 'players');
      console.log('Sample row:', JSON.stringify(stats[0]));
      // Check ID matching
      const batIds = new Set(stats.map(s => String(s.batter_id)).filter(Boolean));
      console.log('batter_ids in stats:', batIds.size, 'sample:', [...batIds].slice(0,5));

      if (!stats || stats.length === 0) throw new Error('No Trout+ stats found — run the GitHub Actions scraper');
      setProgress(60);

      // Convert to troutResults format expected by combinedPlayers
      const results = stats.map(r => ({
        player_name: r.player_name,
        trout_plus: r.trout_plus,
        total_pa: r.total_pa,
        swing_pct: r.swing_pct,
        overall_xwoba: r.overall_xwoba,
        zone_grid: [
          [{zone:'upper_inner', xwoba:r.zone_upper_inner, n:1}, {zone:'upper_middle', xwoba:r.zone_upper_middle, n:1}, {zone:'upper_outer', xwoba:r.zone_upper_outer, n:1}],
          [{zone:'middle_inner',xwoba:r.zone_middle_inner,n:1}, {zone:'middle_middle',xwoba:r.zone_middle_middle,n:1}, {zone:'middle_outer',xwoba:r.zone_middle_outer,n:1}],
          [{zone:'lower_inner', xwoba:r.zone_lower_inner, n:1}, {zone:'lower_middle', xwoba:r.zone_lower_middle, n:1}, {zone:'lower_outer', xwoba:r.zone_lower_outer, n:1}],
        ],
      }));

      setTroutResults(results);
      setDataSource('supabase');
      setProgress(100);

    } catch (err) {
      console.error('Supabase fetch error:', err);
      setError(`Supabase fetch failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, []);

  // Auto-fetch on mount if Supabase credentials are available
  useEffect(() => {
    if (SUPABASE_URL && SUPABASE_ANON) {
      fetchFromSupabase();
    }
  }, []);

  const [activeTab, setActiveTab] = useState('leaderboard');

  // ── Mechanics+ Calculation ──────────────────────────────────
  const mechanicsData = useMemo(() => {
    const raw = Object.entries(BAT_DATA).map(([id, d]) => ({
      player_id: id, name: d.n, bat_speed: d.bs, swing_tilt: d.st,
      attack_angle: d.aa, attack_direction: d.ad, intercept_x: d.ix,
      intercept_y: d.iy, swing_length: d.sl, xwoba: d.xw,
      swing_efficiency: d.bs / d.sl
    }));

    const fields = [
      { key: 'bat_speed', label: 'Bat Speed' },
      { key: 'attack_angle', label: 'Attack Angle' },
      { key: 'swing_efficiency', label: 'Swing Efficiency' },
      { key: 'attack_direction', label: 'Attack Direction' },
      { key: 'swing_tilt', label: 'Swing Path Tilt' },
      { key: 'intercept_x', label: 'Intercept X' },
      { key: 'intercept_y', label: 'Intercept Y' }
    ];

    // Pearson correlations with xwoba
    const correlations = {};
    fields.forEach(f => {
      const pairs = raw.map(p => ({ m: p[f.key], x: p.xwoba })).filter(p => !isNaN(p.m) && !isNaN(p.x));
      const n = pairs.length;
      const sX = pairs.reduce((s, p) => s + p.m, 0);
      const sY = pairs.reduce((s, p) => s + p.x, 0);
      const sXY = pairs.reduce((s, p) => s + p.m * p.x, 0);
      const sX2 = pairs.reduce((s, p) => s + p.m * p.m, 0);
      const sY2 = pairs.reduce((s, p) => s + p.x * p.x, 0);
      const num = n * sXY - sX * sY;
      const den = Math.sqrt((n * sX2 - sX * sX) * (n * sY2 - sY * sY));
      correlations[f.key] = { value: den !== 0 ? num / den : 0, label: f.label };
    });

    // Weighted z-score composite
    const rawScores = raw.map(player => {
      let score = 0;
      fields.forEach(f => {
        const v = player[f.key];
        const r = correlations[f.key]?.value || 0;
        if (!isNaN(v) && r !== 0) {
          const vals = raw.map(p => p[f.key]).filter(x => !isNaN(x));
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          const std = Math.sqrt(vals.reduce((s, x) => s + (x - mean) ** 2, 0) / vals.length);
          if (std > 0) score += ((v - mean) / std) * r;
        }
      });
      return score;
    });

    const rawMean = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
    const rawStd = Math.sqrt(rawScores.reduce((s, v) => s + (v - rawMean) ** 2, 0) / rawScores.length);

    const players = raw.map((p, i) => {
      const z = rawStd > 0 ? (rawScores[i] - rawMean) / rawStd : 0;
      return { ...p, mechanics_plus: 100 + z * 10 };
    });

    return { players, correlations, fields };
  }, []);

  // ── Trout+ Direct Processing (from Supabase rows) ───────────────────────
  const processPlayerData = useCallback(async (playerData) => {
    setProgress(75);
    const results = [];
    const allPlayers = Object.keys(playerData);

    allPlayers.forEach((player, idx) => {
      const d = playerData[player];
      if (d.paSet.size < 100) return;

      const zones = ['upper_inner','upper_middle','upper_outer','middle_inner','middle_middle','middle_outer','lower_inner','lower_middle','lower_outer','shadow','chase'];
      const allP = d.pitches.filter(p => p.xwoba !== null);
      const profile = {}; zones.forEach(z => { profile[z] = { xwoba: 0.3, n: 0 }; });
      profile.overall_xwoba = allP.length > 0 ? allP.reduce((s, p) => s + p.xwoba, 0) / allP.length : 0.3;
      zones.forEach(z => {
        const zp = allP.filter(p => p.zone_category === z);
        profile[z].n = zp.length;
        profile[z].xwoba = zp.length >= 10 ? zp.reduce((s, p) => s + p.xwoba, 0) / zp.length : profile.overall_xwoba;
      });

      const paMap = {};
      d.pitches.forEach(p => {
        if (!paMap[p.paKey]) paMap[p.paKey] = [];
        paMap[p.paKey].push(p);
      });
      Object.values(paMap).forEach(pa => pa.sort((a, b) => a.pitch_number - b.pitch_number));

      let totalScore = 0, totalWeight = 0;
      Object.values(paMap).forEach(pa => {
        const paLen = pa.length;
        const lastPitch = pa[paLen - 1];
        const paWalk = lastPitch.isWalk;
        const paKLooking = lastPitch.isKLooking;
        const paKSwinging = pa.some(p => p.isKSwinging);
        const paChaseK = paKSwinging && ['chase','shadow'].includes(lastPitch.zone_category);
        const paBonus = paWalk ? 10 : paKLooking ? -8 : paChaseK ? -10 : 0;

        pa.forEach((pitch, pitchIdx) => {
          const zd = profile[pitch.zone_category] || { xwoba: profile.overall_xwoba };
          const inSZ = !['shadow','chase'].includes(pitch.zone_category);
          const isSh = pitch.zone_category === 'shadow';
          const isCh = pitch.zone_category === 'chase';
          const isHot = inSZ && zd.xwoba >= profile.overall_xwoba + 0.030;
          const isCold = inSZ && zd.xwoba <= profile.overall_xwoba - 0.030;
          const { swing: sw, balls: b, strikes: s } = pitch;
          let score = 50;

          if (b === 3) {
            if      (isCh)  score = sw ? 0  : 100;
            else if (isSh)  score = sw ? 25 : 90;
            else if (isHot) score = sw ? 95 : 50;
            else            score = sw ? 50 : 50;
          } else if (s === 2) {
            if      (isCh)  score = sw ? 0  : 100;
            else if (isSh)  score = sw ? 40 : 92;
            else            score = sw ? 78 : 22;
          } else {
            if      (isCh)  score = sw ? 0  : 100;
            else if (isSh)  score = sw ? 20 : 85;
            else if (isHot) score = sw ? 95 : 32;
            else if (isCold) score = sw ? 68 : 52;
            else            score = sw ? 80 : 38;
          }

          score = Math.max(0, Math.min(100, score + paBonus));
          if (pitch.isWalk) score = score + 15;
          const posWeight = Math.min(1.5, 1.0 + pitchIdx * 0.1);
          totalScore += score * posWeight;
          totalWeight += posWeight;
        });
      });

      const raw_score = totalWeight > 0 ? totalScore / totalWeight : 50;
      const swingPct = d.pitches.length > 0 ? d.pitches.filter(p => p.swing).length / d.pitches.length : 0;
      const zoneGrid = [
        ['upper_inner','upper_middle','upper_outer'],
        ['middle_inner','middle_middle','middle_outer'],
        ['lower_inner','lower_middle','lower_outer'],
      ].map(row => row.map(z => ({ zone: z, xwoba: profile[z]?.xwoba ?? profile.overall_xwoba, n: profile[z]?.n ?? 0 })));

      results.push({ player_name: player, raw_score, total_pa: d.paSet.size, swing_pct: swingPct, zone_grid: zoneGrid, overall_xwoba: profile.overall_xwoba });
      if (idx % 20 === 0) setProgress(75 + (idx / allPlayers.length) * 20);
    });

    if (results.length > 0) {
      const mean = results.reduce((s, p) => s + p.raw_score, 0) / results.length;
      const std = Math.sqrt(results.reduce((s, p) => s + (p.raw_score - mean) ** 2, 0) / results.length);
      results.forEach(p => { p.trout_plus = 100 + ((p.raw_score - mean) / std) * 10; });
    }

    setTroutResults(results);
    setProgress(100);
    setProcessing(false);
  }, []);

  // ── Trout+ CSV Processing ─── (helpers moved to module level) ───────────

  const processStatcast = useCallback(async (file) => {
    setProcessing(true); setError(null); setProgress(0);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = parseCSV(lines[0]);
      const req = ['player_name','zone','estimated_woba_using_speedangle','description','strikes','balls'];
      const missing = req.filter(c => !headers.includes(c));
      if (missing.length > 0) throw new Error(`Missing columns: ${missing.join(', ')}`);

      setProgress(10);
      const playerData = {};

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = parseCSV(lines[i]);
        const row = {}; headers.forEach((h, idx) => row[h] = vals[idx] || '');
        const player = row.player_name; if (!player) continue;
        if (!playerData[player]) playerData[player] = { pitches: [], paSet: new Set() };
        playerData[player].paSet.add(`${row.game_pk || ''}_${row.at_bat_number || Math.random()}`);

        const swing       = ['hit_into_play','foul','swinging_strike','swinging_strike_blocked','foul_tip','foul_bunt'].includes(row.description) ? 1 : 0;
        const isWalk      = ['ball','blocked_ball','hit_by_pitch'].includes(row.description) && parseInt(row.balls) === 3 ? 1 : 0;
        const isKLooking  = row.description === 'called_strike' && parseInt(row.strikes) === 2 ? 1 : 0;
        const isKSwinging = ['swinging_strike','swinging_strike_blocked','foul_tip'].includes(row.description) && parseInt(row.strikes) === 2 ? 1 : 0;
        const paKey       = `${row.game_pk || ''}_${row.at_bat_number || ''}`;
        playerData[player].pitches.push({
          zone_category: categorizeZone(row.zone),
          xwoba: row.estimated_woba_using_speedangle ? parseFloat(row.estimated_woba_using_speedangle) : null,
          swing, isWalk, isKLooking, isKSwinging, paKey,
          pitch_number: parseInt(row.pitch_number) || 0,
          strikes: parseInt(row.strikes) || 0, balls: parseInt(row.balls) || 0
        });
        if (i % 10000 === 0) setProgress(10 + (i / lines.length) * 30);
      }

      setProgress(45);
      const results = [];
      const allPlayers = Object.keys(playerData);

      allPlayers.forEach((player, idx) => {
        const d = playerData[player];
        if (d.paSet.size < 100) return;

        // Build profile
        const zones = ['upper_inner','upper_middle','upper_outer','middle_inner','middle_middle','middle_outer','lower_inner','lower_middle','lower_outer','shadow','chase'];
        const allP = d.pitches.filter(p => p.xwoba !== null);
        const profile = {}; zones.forEach(z => { profile[z] = { xwoba: 0.3, n: 0 }; });
        profile.overall_xwoba = allP.length > 0 ? allP.reduce((s, p) => s + p.xwoba, 0) / allP.length : 0.3;
        zones.forEach(z => {
          const zp = allP.filter(p => p.zone_category === z);
          profile[z].n = zp.length;
          profile[z].xwoba = zp.length >= 10 ? zp.reduce((s, p) => s + p.xwoba, 0) / zp.length : profile.overall_xwoba;
        });

        // ── Group pitches into PAs and sort by pitch_number ──────────────────
        const paMap = {};
        d.pitches.forEach(p => {
          if (!paMap[p.paKey]) paMap[p.paKey] = [];
          paMap[p.paKey].push(p);
        });
        Object.values(paMap).forEach(pa => pa.sort((a, b) => a.pitch_number - b.pitch_number));

        // ── Score each PA as a sequence ───────────────────────────────────────
        // Individual pitch scores use the same matrix as before.
        // Pitch position weight: later pitches in a PA carry more weight since
        // they occur in more leveraged counts (2-strike, full count, etc.).
        // PA outcome bonus/penalty applied on top of pitch scores.
        let totalScore  = 0;
        let totalWeight = 0;

        Object.values(paMap).forEach(pa => {
          const paLen = pa.length;

          // Determine PA outcome for bonus/penalty
          const lastPitch = pa[paLen - 1];
          const paWalk      = lastPitch.isWalk;
          const paKLooking  = lastPitch.isKLooking;
          const paKSwinging = pa.some(p => p.isKSwinging);
          const paChaseK    = paKSwinging && ['chase','shadow'].includes(lastPitch.zone_category);
          const paBonus     = paWalk ? 10 : paKLooking ? -8 : paChaseK ? -10 : 0;

          pa.forEach((pitch, pitchIdx) => {
            const zd   = profile[pitch.zone_category] || { xwoba: profile.overall_xwoba };
            const inSZ = !['shadow','chase'].includes(pitch.zone_category);
            const isSh = pitch.zone_category === 'shadow';
            const isCh = pitch.zone_category === 'chase';
            const isHot = inSZ && zd.xwoba >= profile.overall_xwoba + 0.030;
            const { swing: sw, balls: b, strikes: s } = pitch;

            // ── Scoring matrix ────────────────────────────────────────────────
            // Shadow (zones 11-14): genuine corner pitches — borderline decisions.
            //   Swinging is defensible, especially with 2 strikes or in hitter counts.
            //   Taking is good but not automatic like a true chase.
            // Chase: clear waste pitch — swinging always wrong, taking always right.
            // Hot zone: player xwOBA in zone >= overall + 0.015.
            // ── Scoring matrix ─────────────────────────────────────────────────
            //
            // PHILOSOPHY:
            // 1. Reward swinging at strikes. Hot zone swings > neutral > cold.
            // 2. Reward laying off pitches outside the zone. Shadow takes are the
            //    most impressive since corners are hardest to identify as balls.
            // 3. Don't punish cold zone takes — smart to lay off your weak zones.
            //    Exception: 2-strike counts — must protect regardless of zone.
            // 4. 3-ball counts neutralize in-zone swing/take decisions (except hot
            //    zone swings which are always rewarded). Walk bonus handled separately.
            // 5. 2-strike counts: all in-zone swings treated equally — can't control
            //    where the pitch goes, just need to protect the zone.
            // 6. Shadow takes (zones 11-14) rewarded highly — true outside corner,
            //    hardest pitches to lay off. Chase takes always 100.
            //
            // ZONE DEFINITIONS:
            //   Hot  = player xwOBA in zone >= overall + 0.030
            //   Cold = player xwOBA in zone <= overall - 0.030
            //   Neutral = everything else in the strike zone
            //   Shadow = Gameday zones 11-14 (outside corners)
            //   Chase  = everything else outside the zone
            //
            // SCORE GUIDE (0-100, higher = better decision):
            //   Chase swing:        0   — never correct
            //   Chase take:       100   — always correct
            //   Shadow take:    85-92   — impressive, hardest layoff
            //   Shadow swing:   20-40   — outside zone, not great
            //   Hot zone swing: 90-100  — ideal, attack your zone
            //   Neutral swing:  70-78   — good, attacking strikes
            //   Cold swing:     55-65   — ok unless 2-strike (then = neutral)
            //   Hot zone take:  30-40   — left a good pitch
            //   Neutral take:   40-48   — took a hittable pitch
            //   Cold take:      55-65   — smart layoff (not penalized)
            //   3-ball in-zone: ~50     — neutralized, walk bonus handles it
            //   2-strike in-zone: all swings = 78, all takes penalized

            const isCold = inSZ && zd.xwoba <= profile.overall_xwoba - 0.030;
            let score = 50;

            if (b === 3) {
              // ── 3-BALL COUNTS ──────────────────────────────────────────────
              // In-zone swing/take neutralized (~50) except hot zone swing.

              if      (isCh)  score = sw ? 0  : 100; // chase: always punish/reward
              else if (isSh)  score = sw ? 25 : 90;  // shadow: lean strongly take
              else if (isHot) score = sw ? 95 : 50;  // hot zone: reward swing, neutral take
              else            score = sw ? 50 : 50;  // neutral/cold: neutralized

            } else if (s === 2) {
              // ── 2-STRIKE COUNTS ────────────────────────────────────────────
              // Must protect the zone — all in-zone swings equal, takes penalized.
              // Shadow takes highly rewarded — laying off a corner with 2 strikes is elite.
              if      (isCh)  score = sw ? 0  : 100; // chase: still punish/reward
              else if (isSh)  score = sw ? 40 : 92;  // shadow: swing ok, take = elite
              else            score = sw ? 78 : 22;  // all in-zone equal: swing good, take bad

            } else {
              // ── ALL OTHER COUNTS ────────────────────────────────────────────
              // Full zone/cold zone logic applies.
              if      (isCh)  score = sw ? 0  : 100;
              else if (isSh)  score = sw ? 20 : 85;  // shadow: strongly prefer take
              else if (isHot) score = sw ? 95 : 32;  // hot: swing it, penalize take
              else if (isCold) score = sw ? 68 : 52; // cold: reward swing, slight take penalty
              else            score = sw ? 80 : 38;  // neutral: reward swing, reduce take
            }

            // Apply PA outcome bonus/penalty
            score = Math.max(0, Math.min(100, score + paBonus));
            // Extra reward on the specific pitch that draws a walk
            if (pitch.isWalk) score = score + 15;

            // Position weight: pitches later in the PA get more weight
            // pitch 1 = 1.0x, each subsequent pitch adds 0.1x, max 1.5x
            const posWeight = Math.min(1.5, 1.0 + pitchIdx * 0.1);
            totalScore  += score * posWeight;
            totalWeight += posWeight;
          });
        });

        const raw_score = totalWeight > 0 ? totalScore / totalWeight : 50;
        // Swing% and 3x3 zone xwOBA grid for display
        const swingPct = d.pitches.length > 0
          ? d.pitches.filter(p => p.swing).length / d.pitches.length
          : 0;

        const zoneGrid = [
          ['upper_inner','upper_middle','upper_outer'],
          ['middle_inner','middle_middle','middle_outer'],
          ['lower_inner','lower_middle','lower_outer'],
        ].map(row => row.map(z => ({
          zone: z,
          xwoba: profile[z]?.xwoba ?? profile.overall_xwoba,
          n: profile[z]?.n ?? 0,
        })));

        results.push({ player_name: player, raw_score, total_pa: d.paSet.size, swing_pct: swingPct, zone_grid: zoneGrid, overall_xwoba: profile.overall_xwoba });
        if (idx % 20 === 0) setProgress(45 + (idx / allPlayers.length) * 45);
      });

      // Normalize to mean=100, stdev=10
      if (results.length > 0) {
        const mean = results.reduce((s, p) => s + p.raw_score, 0) / results.length;
        const std = Math.sqrt(results.reduce((s, p) => s + (p.raw_score - mean) ** 2, 0) / results.length);
        results.forEach(p => { p.trout_plus = 100 + ((p.raw_score - mean) / std) * 10; });
      }

      setTroutResults(results);
      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, []);


  // ── Combined Hitter+ Data ──────────────────────────────────
  const combinedPlayers = useMemo(() => {
    if (!troutResults) return [];

    // player_name in trout_stats is now the MLBAM ID string (e.g. "665487")
    // BAT_DATA player_id is also the MLBAM ID — match directly
    const troutById = {};
    troutResults.forEach(t => {
      troutById[String(t.player_name)] = t;
      if (t.batter_id) troutById[String(t.batter_id)] = t;
    });

    return mechanicsData.players
      .filter(p => troutById[String(p.player_id)] !== undefined)
      .map(p => {
        const td = troutById[String(p.player_id)];
        return {
          ...p,
          trout_plus: td.trout_plus,
          swing_pct: td.swing_pct,
          zone_grid: td.zone_grid,
          overall_xwoba: td.overall_xwoba,
          hitter_plus: (1 + 0.85) / (1 / td.trout_plus + 0.85 / p.mechanics_plus)
        };
      })
      .sort((a, b) => b.hitter_plus - a.hitter_plus)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [mechanicsData, troutResults]);

  // ── Trout+ vs xwOBA Pearson Correlation ────────────────────
  const troutXwobaCorr = useMemo(() => {
    if (combinedPlayers.length < 5) return null;
    const pairs = combinedPlayers.filter(p => p.trout_plus != null && p.xwoba != null);
    const n = pairs.length;
    if (n < 5) return null;
    const mx = pairs.reduce((s, p) => s + p.trout_plus, 0) / n;
    const my = pairs.reduce((s, p) => s + p.xwoba, 0) / n;
    const num = pairs.reduce((s, p) => s + (p.trout_plus - mx) * (p.xwoba - my), 0);
    const den = Math.sqrt(
      pairs.reduce((s, p) => s + (p.trout_plus - mx) ** 2, 0) *
      pairs.reduce((s, p) => s + (p.xwoba - my) ** 2, 0)
    );
    return den > 0 ? num / den : 0;
  }, [combinedPlayers]);

  // ── Hitter+ vs xwOBA Pearson Correlation ─────────────────────
  const hitterXwobaCorr = useMemo(() => {
    if (combinedPlayers.length < 5) return null;
    const pairs = combinedPlayers.filter(p => p.hitter_plus != null && p.xwoba != null);
    const n = pairs.length;
    if (n < 5) return null;
    const mx = pairs.reduce((s, p) => s + p.hitter_plus, 0) / n;
    const my = pairs.reduce((s, p) => s + p.xwoba, 0) / n;
    const num = pairs.reduce((s, p) => s + (p.hitter_plus - mx) * (p.xwoba - my), 0);
    const den = Math.sqrt(
      pairs.reduce((s, p) => s + (p.hitter_plus - mx) ** 2, 0) *
      pairs.reduce((s, p) => s + (p.xwoba - my) ** 2, 0)
    );
    return den > 0 ? num / den : 0;
  }, [combinedPlayers]);

  // ── Mech+ vs xwOBA Pearson Correlation ─────────────────────
  const mechXwobaCorr = useMemo(() => {
    if (combinedPlayers.length < 5) return null;
    const pairs = combinedPlayers.filter(p => p.mechanics_plus != null && p.xwoba != null);
    const n = pairs.length;
    if (n < 5) return null;
    const mx = pairs.reduce((s, p) => s + p.mechanics_plus, 0) / n;
    const my = pairs.reduce((s, p) => s + p.xwoba, 0) / n;
    const num = pairs.reduce((s, p) => s + (p.mechanics_plus - mx) * (p.xwoba - my), 0);
    const den = Math.sqrt(
      pairs.reduce((s, p) => s + (p.mechanics_plus - mx) ** 2, 0) *
      pairs.reduce((s, p) => s + (p.xwoba - my) ** 2, 0)
    );
    return den > 0 ? num / den : 0;
  }, [combinedPlayers]);

  // ── Sorting & Filtering ─────────────────────────────────────
  const sortedPlayers = useMemo(() => {
    const list = [...combinedPlayers];
    list.sort((a, b) => {
      const av = a[sortConfig.key], bv = b[sortConfig.key];
      if (typeof av === 'string') return sortConfig.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortConfig.direction === 'asc' ? av - bv : bv - av;
    });
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [combinedPlayers, sortConfig, searchTerm]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setStatcastFile(file);
      processStatcast(file);
    } else {
      setError('Please upload a .csv file');
    }
  };

  const getColor = (val) => {
    if (val >= 120) return '#f59e0b';
    if (val >= 110) return '#22c55e';
    if (val >= 100) return '#a3e635';
    if (val >= 90) return '#94a3b8';
    return '#ef4444';
  };

  const getLabel = (val) => {
    if (val >= 130) return 'ELITE+';
    if (val >= 120) return 'ELITE';
    if (val >= 110) return 'GREAT';
    if (val >= 100) return 'ABOVE AVG';
    if (val >= 90) return 'AVERAGE';
    if (val >= 80) return 'BELOW AVG';
    return 'POOR';
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a0e17 0%, #111827 40%, #0f172a 100%)',
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace',",
      color: '#e2e8f0'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1e293b; }
        ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .row-hover { transition: all 0.15s ease; }
        .row-hover:hover { background: rgba(59, 130, 246, 0.08) !important; transform: translateX(2px); }
        .btn-hover { transition: all 0.2s ease; }
        .btn-hover:hover { transform: translateY(-1px); filter: brightness(1.15); }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%)',
        position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 900,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em'
            }}>HITTER+</h1>
            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 400 }}>MECHANICS + DECISIONS</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Season badge */}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
              background: ACTIVE_SEASON === 2026 ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
              color: ACTIVE_SEASON === 2026 ? '#22c55e' : '#60a5fa', letterSpacing: '0.08em'
            }}>
              {ACTIVE_SEASON} SEASON
            </span>
            {/* Last updated */}
            {lastUpdated && (
              <span style={{ fontSize: 11, color: '#475569' }}>
                Updated {lastUpdated}
              </span>
            )}
            {/* Refresh button — only in Supabase mode */}
            {SUPABASE_URL && SUPABASE_ANON && (
              <button onClick={fetchFromSupabase} disabled={processing} className="btn-hover" style={{
                background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#22c55e', padding: '8px 14px', borderRadius: 8, cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: processing ? 0.5 : 1
              }}>
                <RefreshCw size={14} style={{ animation: processing ? 'spin 1s linear infinite' : 'none' }} />
                REFRESH
              </button>
            )}
            <button onClick={() => setShowInfo(!showInfo)} className="btn-hover" style={{
              background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#94a3b8', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Info size={14} /> METHODOLOGY
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>

        {/* ── Info Panel ── */}
        {showInfo && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)',
            borderRadius: 12, padding: 24, marginBottom: 24, animation: 'slideIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>How Hitter+ Works</h3>
              <button onClick={() => setShowInfo(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, fontSize: 13, lineHeight: 1.7 }}>
              <div>
                <div style={{ color: '#3b82f6', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>⚡ Mechanics+ (50%)</div>
                <p style={{ color: '#94a3b8' }}>
                  Correlation-weighted z-score composite of 7 swing mechanics: bat speed, attack angle, swing efficiency,
                  attack direction, swing path tilt, intercept X, and intercept Y. Each mechanic is weighted by its
                  Pearson correlation with xwOBA. Scaled to mean=100, SD=10.
                </p>
              </div>
              <div>
                <div style={{ color: '#8b5cf6', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>🎯 Trout+ (50%)</div>
                <p style={{ color: '#94a3b8' }}>
                  Pitch-by-pitch decision scoring (0-100 per pitch) based on zone location, count situation,
                  and player hot zones (zone xwOBA ≥ overall + .030). Rewards swinging at hittable pitches
                  in hot zones and laying off chases. Scaled to mean=100, SD=10.
                </p>
              </div>
              <div>
                <div style={{ color: '#ec4899', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>🏆 Hitter+</div>
                <p style={{ color: '#94a3b8' }}>
                  Simple average of Mechanics+ and Trout+. Captures the complete hitter: both <em>how</em> they swing
                  and <em>when</em> they swing. 100 = league average, 110+ = great, 120+ = elite.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Upload Section ── */}
        {!troutResults && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)', border: '2px dashed rgba(59, 130, 246, 0.25)',
            borderRadius: 16, padding: '48px 32px', textAlign: 'center', marginBottom: 24,
            animation: 'fadeIn 0.5s ease'
          }}>
            {processing ? (
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
                  Processing Statcast Data...
                </div>
                <div style={{ width: 300, height: 6, background: '#1e293b', borderRadius: 3, margin: '16px auto', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`, height: '100%', borderRadius: 3, transition: 'width 0.3s ease',
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                    backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite'
                  }} />
                </div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{Math.round(progress)}% complete</div>
              </div>
            ) : (
              <div>
                <Upload size={40} style={{ color: '#3b82f6', marginBottom: 16 }} />
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                  Upload Statcast CSV for Trout+
                </div>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
                  Mechanics+ is pre-calculated from embedded bat tracking data ({mechanicsData.players.length} players).
                  Upload pitch-by-pitch Statcast data to calculate Trout+ and generate Hitter+ scores.
                </div>
                <label className="btn-hover" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
                  borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif", border: 'none'
                }}>
                  <Upload size={16} /> Choose CSV File
                  <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
                </label>
                <div style={{ color: '#475569', fontSize: 11, marginTop: 12 }}>
                  Required columns: player_name, zone, estimated_woba_using_speedangle, description, strikes, balls
                </div>
              </div>
            )}
            {error && (
              <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: 8, marginTop: 16, fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {troutResults && combinedPlayers.length > 0 && (
          <div style={{ animation: 'slideIn 0.4s ease' }}>
            {/* Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'PLAYERS', value: combinedPlayers.length, color: '#3b82f6' },
                { label: 'AVG MECH+', value: (combinedPlayers.reduce((s, p) => s + p.mechanics_plus, 0) / combinedPlayers.length).toFixed(1), color: '#3b82f6' },
                { label: 'AVG TROUT+', value: (combinedPlayers.reduce((s, p) => s + p.trout_plus, 0) / combinedPlayers.length).toFixed(1), color: '#8b5cf6' },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.1)',
                  borderRadius: 10, padding: '14px 16px'
                }}>
                  <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: "'Outfit', sans-serif" }}>{stat.value}</div>
                  {stat.sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{stat.sub}</div>}
                </div>
              ))}
              {/* Hitter+ vs xwOBA correlation card */}
              {hitterXwobaCorr !== null && (() => {
                const r = hitterXwobaCorr;
                const pct = Math.abs(r) * 100;
                const corrColor = r >= 0.5 ? '#22c55e' : r >= 0.3 ? '#a3e635' : r >= 0.1 ? '#f59e0b' : '#ef4444';
                const corrLabel = r >= 0.5 ? 'STRONG' : r >= 0.3 ? 'MODERATE' : r >= 0.1 ? 'WEAK' : 'NONE';
                return (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${corrColor}30`,
                    borderRadius: 10, padding: '14px 16px'
                  }}>
                    <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
                      HITTER+ × xwOBA r
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: corrColor, fontFamily: "'Outfit', sans-serif" }}>
                      {r.toFixed(3)}
                    </div>
                    <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 2,
                        background: `linear-gradient(90deg, ${corrColor}99, ${corrColor})`
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: corrColor, marginTop: 4, fontWeight: 600 }}>{corrLabel}</div>
                  </div>
                );
              })()}
              {/* Trout+ vs xwOBA Pearson r */}
              {troutXwobaCorr !== null && (() => {
                const r = troutXwobaCorr;
                const pct = Math.abs(r) * 100;
                const corrColor = r >= 0.5 ? '#22c55e' : r >= 0.3 ? '#a3e635' : r >= 0.1 ? '#f59e0b' : '#ef4444';
                const corrLabel = r >= 0.5 ? 'STRONG' : r >= 0.3 ? 'MODERATE' : r >= 0.1 ? 'WEAK' : 'NONE';
                return (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${corrColor}30`,
                    borderRadius: 10, padding: '14px 16px'
                  }}>
                    <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
                      TROUT+ × xwOBA r
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: corrColor, fontFamily: "'Outfit', sans-serif" }}>
                      {r.toFixed(3)}
                    </div>
                    <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 2,
                        background: `linear-gradient(90deg, ${corrColor}99, ${corrColor})`
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: corrColor, marginTop: 4, fontWeight: 600 }}>{corrLabel}</div>
                  </div>
                );
              })()}
              {/* Mech+ vs xwOBA correlation card */}
              {mechXwobaCorr !== null && (() => {
                const r = mechXwobaCorr;
                const pct = Math.abs(r) * 100;
                const corrColor = r >= 0.5 ? '#22c55e' : r >= 0.3 ? '#a3e635' : r >= 0.1 ? '#f59e0b' : '#ef4444';
                const corrLabel = r >= 0.5 ? 'STRONG' : r >= 0.3 ? 'MODERATE' : r >= 0.1 ? 'WEAK' : 'NONE';
                return (
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${corrColor}30`,
                    borderRadius: 10, padding: '14px 16px'
                  }}>
                    <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
                      MECH+ × xwOBA r
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: corrColor, fontFamily: "'Outfit', sans-serif" }}>
                      {r.toFixed(3)}
                    </div>
                    <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 2,
                        background: `linear-gradient(90deg, ${corrColor}99, ${corrColor})`
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: corrColor, marginTop: 4, fontWeight: 600 }}>{corrLabel}</div>
                  </div>
                );
              })()}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input
                type="text" placeholder="Search players..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 10, color: '#e2e8f0',
                  fontSize: 14, outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
                    {[
                      { key: 'rank', label: '#', w: 44 },
                      { key: 'name', label: 'PLAYER', w: 180 },
                      { key: 'hitter_plus', label: 'HITTER+', w: 100 },
                      { key: 'mechanics_plus', label: 'MECH+', w: 90 },
                      { key: 'trout_plus', label: 'TROUT+', w: 90 },
                      { key: 'swing_pct', label: 'SWING%', w: 80 },
                      { key: 'xwoba', label: 'xwOBA', w: 70 },
                      { key: 'zone_map', label: 'ZONE MAP', w: 160 },
                    ].map(col => (
                      <th key={col.key} onClick={() => col.key !== 'zone_map' && handleSort(col.key)} style={{
                        padding: '12px 10px', textAlign: col.key === 'name' ? 'left' : 'center',
                        cursor: col.key === 'zone_map' ? 'default' : 'pointer', color: '#64748b', fontWeight: 600, fontSize: 10,
                        letterSpacing: '0.1em', borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                        minWidth: col.w, whiteSpace: 'nowrap', userSelect: 'none'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {col.label}
                          {sortConfig.key === col.key && (sortConfig.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, idx) => {
                    const isSelected = selectedPlayer?.player_id === player.player_id;
                    return (
                      <React.Fragment key={player.player_id}>
                        <tr className="row-hover"
                          onClick={() => setSelectedPlayer(isSelected ? null : player)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : idx % 2 === 0 ? 'rgba(15, 23, 42, 0.3)' : 'transparent',
                            borderBottom: isSelected ? 'none' : '1px solid rgba(59, 130, 246, 0.05)'
                          }}>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#475569', fontWeight: 600, fontSize: 11 }}>
                            {player.rank}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#e2e8f0', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                            {player.name}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block', padding: '4px 12px', borderRadius: 6,
                              fontWeight: 700, fontSize: 14,
                              background: `${getColor(player.hitter_plus)}18`, color: getColor(player.hitter_plus),
                              fontFamily: "'Outfit', sans-serif"
                            }}>
                              {player.hitter_plus.toFixed(1)}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: getColor(player.mechanics_plus), fontWeight: 500 }}>
                            {player.mechanics_plus.toFixed(1)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: getColor(player.trout_plus), fontWeight: 500 }}>
                            {player.trout_plus.toFixed(1)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>
                            {player.swing_pct != null ? (player.swing_pct * 100).toFixed(1) + '%' : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>
                            {player.xwoba.toFixed(3)}
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <MiniZoneGrid grid={player.zone_grid ?? troutResults?.find(t => t.player_name === player.name)?.zone_grid} />
                          </td>
                        </tr>

                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Player Detail */}
            {selectedPlayer && (
              <div style={{
                marginTop: 16, background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 12, padding: 24,
                animation: 'slideIn 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>
                      {selectedPlayer.name}
                    </h3>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700,
                      background: `${getColor(selectedPlayer.hitter_plus)}20`, color: getColor(selectedPlayer.hitter_plus)
                    }}>
                      {getLabel(selectedPlayer.hitter_plus)}
                    </span>
                  </div>
                  <button onClick={() => setSelectedPlayer(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Score Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'HITTER+', value: selectedPlayer.hitter_plus, gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)' },
                    { label: 'MECHANICS+', value: selectedPlayer.mechanics_plus, gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
                    { label: 'TROUT+', value: selectedPlayer.trout_plus, gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
                  ].map((card, i) => (
                    <div key={i} style={{
                      background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(59, 130, 246, 0.1)',
                      borderRadius: 10, padding: 16, textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>{card.label}</div>
                      <div style={{
                        fontSize: 32, fontWeight: 900, fontFamily: "'Outfit', sans-serif",
                        background: card.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                      }}>
                        {card.value.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Zone Grid + Swing% */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  {/* xwOBA Zone Grid */}
                  <ZoneGrid
                    grid={selectedPlayer.zone_grid ?? troutResults?.find(t => t.player_name === selectedPlayer.name)?.zone_grid}
                    avg={selectedPlayer.overall_xwoba ?? troutResults?.find(t => t.player_name === selectedPlayer.name)?.overall_xwoba}
                  />

                  {/* Swing% + xwOBA stat */}
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>DISCIPLINE</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Swing%', value: selectedPlayer.swing_pct != null ? (selectedPlayer.swing_pct * 100).toFixed(1) + '%' : '—' },
                        { label: 'xwOBA', value: selectedPlayer.xwoba?.toFixed(3) ?? '—' },
                      ].map((stat, i) => (
                        <div key={i} style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, padding: '12px' }}>
                          <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{stat.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#cbd5e1', fontFamily: "'Outfit', sans-serif" }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mechanics Breakdown */}
                <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>SWING MECHANICS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                  {[
                    { label: 'Bat Speed', value: `${selectedPlayer.bat_speed.toFixed(1)} mph` },
                    { label: 'Attack Angle', value: `${selectedPlayer.attack_angle.toFixed(1)}°` },
                    { label: 'Swing Efficiency', value: selectedPlayer.swing_efficiency.toFixed(2) },
                    { label: 'Attack Direction', value: `${selectedPlayer.attack_direction.toFixed(1)}°` },
                    { label: 'Swing Tilt', value: `${selectedPlayer.swing_tilt.toFixed(1)}°` },
                    { label: 'Intercept X', value: `${selectedPlayer.intercept_x.toFixed(1)}"` },
                    { label: 'Intercept Y', value: `${selectedPlayer.intercept_y.toFixed(1)}"` },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <label className="btn-hover" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                color: '#94a3b8', borderRadius: 8, cursor: 'pointer', fontSize: 12
              }}>
                <Upload size={14} /> Upload New CSV
                <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {troutResults && combinedPlayers.length === 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 12, padding: 24, textAlign: 'center', marginTop: 20
          }}>
            <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 16, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
              No Player Matches Found
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, maxWidth: 480, margin: '0 auto' }}>
              No players from the Statcast CSV matched the embedded bat tracking data. Make sure player names
              in the CSV use "Last, First" format (e.g. "Soto, Juan"). Found {troutResults.length} Trout+ scores
              and {mechanicsData.players.length} Mechanics+ scores but no overlapping names.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HitterPlusApp;
