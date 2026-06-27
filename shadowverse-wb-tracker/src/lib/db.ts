import Database from '@tauri-apps/plugin-sql';
import type {
	Deck,
	GameRecord,
	Review,
	CreateRecordPayload,
	CreateReviewPayload,
	UpdateReviewPayload
} from './types';

const DB_PATH = 'sqlite:shadowverse-wb.db';

let _db: Database | null = null;

async function getDb(): Promise<Database> {
	if (!_db) _db = await Database.load(DB_PATH);
	return _db;
}

// ---------- デッキ ----------

export async function getDecks(): Promise<Deck[]> {
	const db = await getDb();
	return db.select<Deck[]>('SELECT * FROM decks ORDER BY created_at DESC');
}

export async function getDeck(hash: string): Promise<Deck> {
	const db = await getDb();
	const rows = await db.select<Deck[]>('SELECT * FROM decks WHERE hash = $1', [hash]);
	if (rows.length === 0) throw new Error(`Deck not found: ${hash}`);
	return rows[0];
}

export async function createDeck(hash: string, name: string): Promise<void> {
	const segments = hash.split('.');
	const classId = parseInt(segments[1], 10);
	if (isNaN(classId)) throw new Error('Invalid deck hash: cannot parse class_id');
	const db = await getDb();
	await db.execute('INSERT INTO decks (hash, name, class_id) VALUES ($1, $2, $3)', [
		hash,
		name,
		classId
	]);
}

export async function deleteDeck(hash: string): Promise<void> {
	const db = await getDb();
	await db.execute('DELETE FROM decks WHERE hash = $1', [hash]);
}

// ---------- 対戦記録 ----------

export async function getRecords(deckHash?: string): Promise<GameRecord[]> {
	const db = await getDb();
	if (deckHash) {
		return db.select<GameRecord[]>(
			'SELECT * FROM records WHERE deck_hash = $1 ORDER BY played_at DESC',
			[deckHash]
		);
	}
	return db.select<GameRecord[]>('SELECT * FROM records ORDER BY played_at DESC');
}

export async function getRecord(id: number): Promise<GameRecord> {
	const db = await getDb();
	const rows = await db.select<GameRecord[]>('SELECT * FROM records WHERE id = $1', [id]);
	if (rows.length === 0) throw new Error(`Record not found: ${id}`);
	return rows[0];
}

export async function createRecord(payload: CreateRecordPayload): Promise<number> {
	const db = await getDb();
	const result = await db.execute(
		`INSERT INTO records (deck_hash, opponent_class_id, is_first, result, rating_diff, note)
     VALUES ($1, $2, $3, $4, $5, $6)`,
		[
			payload.deck_hash,
			payload.opponent_class_id,
			payload.is_first ? 1 : 0,
			payload.result,
			payload.rating_diff,
			payload.note
		]
	);
	return result.lastInsertId ?? 0;
}

export async function deleteRecord(id: number): Promise<void> {
	const db = await getDb();
	await db.execute('DELETE FROM records WHERE id = $1', [id]);
}

// ---------- 検討ログ ----------

export async function getReviews(recordId: number): Promise<Review[]> {
	const db = await getDb();
	return db.select<Review[]>(
		'SELECT * FROM reviews WHERE record_id = $1 ORDER BY turn ASC',
		[recordId]
	);
}

export async function getReview(id: number): Promise<Review> {
	const db = await getDb();
	const rows = await db.select<Review[]>('SELECT * FROM reviews WHERE id = $1', [id]);
	if (rows.length === 0) throw new Error(`Review not found: ${id}`);
	return rows[0];
}

export async function createReview(payload: CreateReviewPayload): Promise<void> {
	const db = await getDb();
	await db.execute(
		`INSERT INTO reviews (record_id, turn, advantage, chosen_play, alternatives, note)
     VALUES ($1, $2, $3, $4, $5, $6)`,
		[
			payload.record_id,
			payload.turn,
			payload.advantage,
			payload.chosen_play,
			payload.alternatives,
			payload.note
		]
	);
}

export async function updateReview(id: number, payload: UpdateReviewPayload): Promise<void> {
	const db = await getDb();
	await db.execute(
		`UPDATE reviews SET turn=$1, advantage=$2, chosen_play=$3, alternatives=$4, note=$5
     WHERE id=$6`,
		[payload.turn, payload.advantage, payload.chosen_play, payload.alternatives, payload.note, id]
	);
}

export async function deleteReview(id: number): Promise<void> {
	const db = await getDb();
	await db.execute('DELETE FROM reviews WHERE id = $1', [id]);
}

// ---------- ダッシュボード ----------

export async function getWinRate(
	deckHash?: string
): Promise<{ win: number; total: number }> {
	const db = await getDb();
	type Row = { win: number; total: number };
	let rows: Row[];
	if (deckHash) {
		rows = await db.select<Row[]>(
			`SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) AS win
       FROM records WHERE deck_hash = $1`,
			[deckHash]
		);
	} else {
		rows = await db.select<Row[]>(
			`SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) AS win
       FROM records`
		);
	}
	return { win: rows[0].win ?? 0, total: rows[0].total ?? 0 };
}

export async function getRecentRecords(limit = 5): Promise<GameRecord[]> {
	const db = await getDb();
	return db.select<GameRecord[]>(
		'SELECT * FROM records ORDER BY played_at DESC LIMIT $1',
		[limit]
	);
}

type DeckWinRate = { deck_hash: string; win: number; total: number };

export async function getDeckWinRates(): Promise<DeckWinRate[]> {
	const db = await getDb();
	return db.select<DeckWinRate[]>(
		`SELECT
      deck_hash,
      COUNT(*) AS total,
      SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) AS win
     FROM records
     GROUP BY deck_hash`
	);
}

type ClassWinRate = { class_id: number; win: number; total: number };

export async function getClassWinRates(): Promise<ClassWinRate[]> {
	const db = await getDb();
	return db.select<ClassWinRate[]>(
		`SELECT d.class_id,
		        COUNT(*) AS total,
		        SUM(CASE WHEN r.result='win' THEN 1 ELSE 0 END) AS win
		 FROM records r
		 JOIN decks d ON r.deck_hash = d.hash
		 GROUP BY d.class_id
		 ORDER BY total DESC`
	);
}

type FormatWinRate = { format_id: number; win: number; total: number };

export async function getFormatWinRates(): Promise<FormatWinRate[]> {
	const db = await getDb();
	return db.select<FormatWinRate[]>(
		`SELECT CAST(SUBSTR(d.hash, 1, INSTR(d.hash, '.') - 1) AS INTEGER) AS format_id,
		        COUNT(*) AS total,
		        SUM(CASE WHEN r.result='win' THEN 1 ELSE 0 END) AS win
		 FROM records r
		 JOIN decks d ON r.deck_hash = d.hash
		 GROUP BY format_id
		 ORDER BY format_id`
	);
}
