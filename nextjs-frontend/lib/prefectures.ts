/**
 * Prefecture-related types and utilities
 */

export interface PrefectureStats {
  prefecture: string;
  spot_count: number;
  goshuin_count: number;
}

export interface PrefectureStatsResponse {
  by_prefecture: PrefectureStats[];
  total_prefectures: number;
  total_spots: number;
  total_goshuin: number;
}

/**
 * Japanese hiragana groupings for prefecture organization
 */
export const HIRAGANA_GROUPS = {
  あ: ["愛知県", "青森県", "秋田県", "石川県", "茨城県", "岩手県", "愛媛県", "大阪府", "岡山県", "沖縄県"],
  か: ["香川県", "鹿児島県", "神奈川県", "岐阜県", "京都府", "熊本県", "群馬県", "高知県"],
  さ: ["埼玉県", "佐賀県", "滋賀県", "静岡県", "島根県"],
  た: ["千葉県", "東京都", "栃木県", "鳥取県", "富山県", "徳島県"],
  な: ["長崎県", "長野県", "奈良県", "新潟県"],
  は: ["北海道", "兵庫県", "広島県", "福井県", "福岡県", "福島県"],
  ま: ["三重県", "宮城県", "宮崎県"],
  や: ["山形県", "山口県", "山梨県"],
  わ: ["和歌山県"],
} as const;

export type HiraganaGroup = keyof typeof HIRAGANA_GROUPS;

/**
 * Get the hiragana group for a prefecture
 */
export function getPrefectureGroup(prefecture: string): HiraganaGroup | null {
  for (const [group, prefectures] of Object.entries(HIRAGANA_GROUPS)) {
    if (prefectures.includes(prefecture)) {
      return group as HiraganaGroup;
    }
  }
  return null;
}

/**
 * Group prefectures by hiragana
 */
export function groupPrefecturesByHiragana(
  stats: PrefectureStats[]
): Record<HiraganaGroup, PrefectureStats[]> {
  const grouped: Record<string, PrefectureStats[]> = {
    あ: [],
    か: [],
    さ: [],
    た: [],
    な: [],
    は: [],
    ま: [],
    や: [],
    わ: [],
  };

  for (const stat of stats) {
    const group = getPrefectureGroup(stat.prefecture);
    if (group) {
      grouped[group].push(stat);
    }
  }

  return grouped as Record<HiraganaGroup, PrefectureStats[]>;
}
