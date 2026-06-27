export type Deck = {
	hash: string;
	name: string;
	class_id: number;
	created_at: string;
};

export type GameRecord = {
	id: number;
	deck_hash: string;
	opponent_class_id: number | null;
	is_first: number; // SQLite BOOLEAN は 0/1
	result: 'win' | 'lose';
	rating_diff: number | null;
	note: string | null;
	played_at: string;
};

export type Review = {
	id: number;
	record_id: number;
	turn: number;
	advantage: number | null;
	chosen_play: string | null;
	alternatives: string | null;
	note: string | null;
	created_at: string;
};

export type CreateRecordPayload = {
	deck_hash: string;
	opponent_class_id: number | null;
	is_first: boolean;
	result: 'win' | 'lose';
	rating_diff: number | null;
	note: string | null;
};

export type CreateReviewPayload = {
	record_id: number;
	turn: number;
	advantage: number | null;
	chosen_play: string | null;
	alternatives: string | null;
	note: string | null;
};

export type UpdateReviewPayload = {
	turn: number;
	advantage: number | null;
	chosen_play: string | null;
	alternatives: string | null;
	note: string | null;
};

export type UpdateRecordPayload = {
	deck_hash: string;
	opponent_class_id: number | null;
	is_first: boolean;
	result: 'win' | 'lose';
	rating_diff: number | null;
	note: string | null;
};

export const CLASS_NAMES: Record<number, string> = {
	1: 'エルフ',
	2: 'ロイヤル',
	3: 'ウィッチ',
	4: 'ドラゴン',
	5: 'ナイトメア',
	6: 'ビショップ',
	7: 'ネメシス'
};

export const CLASS_IDS = Object.keys(CLASS_NAMES).map(Number);

export const FORMAT_NAMES: Record<number, string> = {
	1: 'ローテーション',
	2: 'アンリミテッド'
};
