import { PlaceCategory } from '../types/place';

export const COLORS = {
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceLight: '#0f3460',
  primary: '#e94560',
  accent: '#533483',
  text: '#ffffff',
  textSecondary: '#a0a0b0',
  male: '#4a9eff',
  female: '#ff69b4',
  pin: {
    station: '#ffd700',
    izakaya: '#ff8c00',
    club: '#e94560',
    aiseki: '#ff69b4',
    cabaret: '#da70d6',
    host: '#4a9eff',
  } as Record<PlaceCategory, string>,
} as const;

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  station: '駅',
  izakaya: '居酒屋',
  club: 'クラブ',
  aiseki: '相席屋',
  cabaret: 'キャバクラ',
  host: 'ホスト',
};

export const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  station: '🚉',
  izakaya: '🍺',
  club: '🎵',
  aiseki: '💑',
  cabaret: '🥂',
  host: '🌹',
};
