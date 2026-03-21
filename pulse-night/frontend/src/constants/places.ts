import { Place } from '../types/place';

// 仙台駅周辺を中心とした初期表示位置
export const SENDAI_CENTER = {
  latitude: 38.2632,
  longitude: 140.8711,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

// 仙台エリアのスポットデータ（MVP用サンプル）
export const PLACES: Place[] = [
  // 駅
  {
    id: '1',
    name: '仙台駅',
    latitude: 38.2601,
    longitude: 140.8825,
    category: 'station',
  },
  // 国分町エリア - 居酒屋
  {
    id: '2',
    name: '炭焼き居酒屋 国分町店',
    latitude: 38.2635,
    longitude: 140.8700,
    category: 'izakaya',
  },
  {
    id: '3',
    name: '海鮮酒場 一番町',
    latitude: 38.2620,
    longitude: 140.8740,
    category: 'izakaya',
  },
  {
    id: '4',
    name: '焼鳥ダイニング 国分町',
    latitude: 38.2645,
    longitude: 140.8685,
    category: 'izakaya',
  },
  // クラブ
  {
    id: '5',
    name: 'CLUB SHAFT',
    latitude: 38.2640,
    longitude: 140.8710,
    category: 'club',
  },
  {
    id: '6',
    name: 'CLUB JUNK BOX',
    latitude: 38.2650,
    longitude: 140.8695,
    category: 'club',
  },
  // 相席屋
  {
    id: '7',
    name: '相席屋 仙台国分町店',
    latitude: 38.2630,
    longitude: 140.8720,
    category: 'aiseki',
  },
  {
    id: '8',
    name: '相席ラウンジ 一番町',
    latitude: 38.2618,
    longitude: 140.8730,
    category: 'aiseki',
  },
  // キャバクラ
  {
    id: '9',
    name: 'キャバクラ 国分町A',
    latitude: 38.2655,
    longitude: 140.8675,
    category: 'cabaret',
  },
  {
    id: '10',
    name: 'ラウンジ 国分町B',
    latitude: 38.2642,
    longitude: 140.8668,
    category: 'cabaret',
  },
  // ホスト
  {
    id: '11',
    name: 'ホストクラブ 国分町',
    latitude: 38.2660,
    longitude: 140.8690,
    category: 'host',
  },
];
