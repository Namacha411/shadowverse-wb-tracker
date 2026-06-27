<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		getDecks,
		getWinRate,
		getRecentRecords,
		getDeckWinRates,
		getClassWinRates,
		getFormatWinRates,
		createRecord
	} from '$lib/db';
	import type { Deck, GameRecord } from '$lib/types';
	import { CLASS_NAMES, CLASS_IDS, FORMAT_NAMES } from '$lib/types';

	let totalWin = $state(0);
	let totalCount = $state(0);
	let recentRecords = $state<GameRecord[]>([]);
	let decks = $state<Deck[]>([]);
	let deckRates = $state<{ deck: Deck; win: number; total: number }[]>([]);
	let classRates = $state<{ class_id: number; win: number; total: number }[]>([]);
	let formatRates = $state<{ format_id: number; win: number; total: number }[]>([]);

	const deckMap = $derived(Object.fromEntries(decks.map((d) => [d.hash, d])));

	// --- クイック追加フォーム ---
	let showAddForm = $state(false);
	let formDeckHash = $state('');
	let formOpponentClassId = $state<number | null>(null);
	let formIsFirst = $state(true);
	let formResult = $state<'win' | 'lose'>('win');
	let formRatingDiff = $state('');
	let formNote = $state('');
	let formSubmitting = $state(false);
	let formError = $state('');

	async function loadDashboard() {
		const [rate, recent, rawRates, rawDecks, rawClassRates, rawFormatRates] = await Promise.all([
			getWinRate(),
			getRecentRecords(5),
			getDeckWinRates(),
			getDecks(),
			getClassWinRates(),
			getFormatWinRates()
		]);
		totalWin = rate.win;
		totalCount = rate.total;
		recentRecords = recent;
		decks = rawDecks;

		const dm = Object.fromEntries(rawDecks.map((d) => [d.hash, d]));
		deckRates = rawRates
			.filter((r) => dm[r.deck_hash])
			.map((r) => ({ deck: dm[r.deck_hash], win: r.win, total: r.total }));

		classRates = rawClassRates;
		formatRates = rawFormatRates;
	}

	onMount(loadDashboard);

	function toggleAddForm() {
		if (decks.length === 0) {
			goto('/decks/new');
			return;
		}
		showAddForm = !showAddForm;
		if (showAddForm) {
			formDeckHash = decks[0].hash;
			formOpponentClassId = null;
			formIsFirst = true;
			formResult = 'win';
			formRatingDiff = '';
			formNote = '';
			formError = '';
		}
	}

	async function handleAddRecord(e: Event) {
		e.preventDefault();
		formError = '';
		if (!formDeckHash) {
			formError = 'デッキを選択してください。';
			return;
		}
		formSubmitting = true;
		try {
			await createRecord({
				deck_hash: formDeckHash,
				opponent_class_id: formOpponentClassId,
				is_first: formIsFirst,
				result: formResult,
				rating_diff: formRatingDiff !== '' ? parseInt(formRatingDiff, 10) : null,
				note: formNote.trim() || null
			});
			showAddForm = false;
			await loadDashboard();
		} catch (err: unknown) {
			formError = err instanceof Error ? err.message : String(err);
		} finally {
			formSubmitting = false;
		}
	}

	function winRateText(win: number, total: number): string {
		if (total === 0) return '- %';
		return `${Math.round((win / total) * 100)} %`;
	}

	function formatIdFromHash(hash: string | undefined): number {
		if (!hash) return 0;
		return parseInt(hash.split('.')[0]);
	}
</script>

<div class="page-header">
	<h1>ダッシュボード</h1>
	<button class="btn-add" onclick={toggleAddForm}>
		{showAddForm ? '✕ 閉じる' : '＋ 対戦記録を追加'}
	</button>
</div>

{#if showAddForm}
	<div class="add-form-card">
		<h2 class="form-title">対戦記録 新規追加</h2>
		<form onsubmit={handleAddRecord}>
			<div class="form-row">
				<div class="field">
					<label for="f-deck">使用デッキ</label>
					<select id="f-deck" bind:value={formDeckHash}>
						{#each decks as d}
							<option value={d.hash}>{d.name} ({CLASS_NAMES[d.class_id] ?? '?'})</option>
						{/each}
					</select>
				</div>

				<div class="field">
					<div class="field-label">先後</div>
					<div class="radio-group">
						<label class="radio">
							<input type="radio" bind:group={formIsFirst} value={true} />
							先手
						</label>
						<label class="radio">
							<input type="radio" bind:group={formIsFirst} value={false} />
							後手
						</label>
					</div>
				</div>

				<div class="field">
					<div class="field-label">結果</div>
					<div class="radio-group">
						<label class="radio win">
							<input type="radio" bind:group={formResult} value="win" />
							勝ち
						</label>
						<label class="radio lose">
							<input type="radio" bind:group={formResult} value="lose" />
							負け
						</label>
					</div>
				</div>
			</div>

			<div class="form-row">
				<div class="field">
					<label for="f-opp">相手クラス（任意）</label>
					<select id="f-opp" bind:value={formOpponentClassId}>
						<option value={null}>未記録</option>
						{#each CLASS_IDS as id}
							<option value={id}>{CLASS_NAMES[id]}</option>
						{/each}
					</select>
				</div>

				<div class="field">
					<label for="f-rating">レート増減（任意）</label>
					<input id="f-rating" type="number" bind:value={formRatingDiff} placeholder="例: 20 や -15" />
				</div>

				<div class="field field-note">
					<label for="f-note">メモ（任意）</label>
					<input id="f-note" type="text" bind:value={formNote} placeholder="勝敗の要因など" />
				</div>
			</div>

			{#if formError}
				<p class="form-error">{formError}</p>
			{/if}

			<div class="form-actions">
				<button type="submit" class="btn-primary" disabled={formSubmitting}>
					{formSubmitting ? '保存中...' : '保存する'}
				</button>
				<button type="button" class="btn-cancel" onclick={() => (showAddForm = false)}>
					キャンセル
				</button>
			</div>
		</form>
	</div>
{/if}

<div class="stats-row">
	<div class="stat-card">
		<div class="stat-label">全体勝率</div>
		<div class="stat-value">{winRateText(totalWin, totalCount)}</div>
		<div class="stat-sub">{totalWin}勝 / {totalCount}戦</div>
	</div>
	{#each formatRates as fr}
		<div class="stat-card">
			<div class="stat-label">{FORMAT_NAMES[fr.format_id] ?? `フォーマット${fr.format_id}`}</div>
			<div class="stat-value">{winRateText(fr.win, fr.total)}</div>
			<div class="stat-sub">{fr.win}勝 / {fr.total}戦</div>
		</div>
	{/each}
</div>

<section>
	<h2>直近の対戦</h2>
	{#if recentRecords.length === 0}
		<p class="empty">対戦記録がありません。</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>日時</th>
					<th>デッキ名</th>
					<th>クラス</th>
					<th>フォーマット</th>
					<th>先後</th>
					<th>結果</th>
					<th>相手クラス</th>
					<th>レート増減</th>
					<th>メモ</th>
				</tr>
			</thead>
			<tbody>
				{#each recentRecords as r}
					{@const deck = deckMap[r.deck_hash]}
					<tr>
						<td><a href="/records/{r.id}">{r.played_at.slice(0, 16)}</a></td>
						<td>{deck?.name ?? '-'}</td>
						<td>{CLASS_NAMES[deck?.class_id ?? 0] ?? '-'}</td>
						<td>{FORMAT_NAMES[formatIdFromHash(deck?.hash)] ?? '-'}</td>
						<td>{r.is_first ? '先手' : '後手'}</td>
						<td class={r.result}>{r.result === 'win' ? '勝' : '敗'}</td>
						<td>{r.opponent_class_id ? (CLASS_NAMES[r.opponent_class_id] ?? '?') : '-'}</td>
						<td>{r.rating_diff != null ? (r.rating_diff >= 0 ? '+' : '') + r.rating_diff : '-'}</td>
						<td class="memo">{r.note || '-'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<section>
	<h2>クラス別勝率</h2>
	{#if classRates.length === 0}
		<p class="empty">データがありません。</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>クラス</th>
					<th>勝率</th>
					<th>戦績</th>
				</tr>
			</thead>
			<tbody>
				{#each classRates as cr}
					<tr>
						<td>{CLASS_NAMES[cr.class_id] ?? '?'}</td>
						<td>{winRateText(cr.win, cr.total)}</td>
						<td>{cr.win}勝 {cr.total - cr.win}敗</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<section>
	<h2>デッキ別勝率</h2>
	{#if deckRates.length === 0}
		<p class="empty">データがありません。</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>デッキ名</th>
					<th>クラス</th>
					<th>フォーマット</th>
					<th>勝率</th>
					<th>戦績</th>
				</tr>
			</thead>
			<tbody>
				{#each deckRates as dr}
					<tr>
						<td>{dr.deck.name}</td>
						<td>{CLASS_NAMES[dr.deck.class_id] ?? '?'}</td>
						<td>{FORMAT_NAMES[formatIdFromHash(dr.deck.hash)] ?? '-'}</td>
						<td>{winRateText(dr.win, dr.total)}</td>
						<td>{dr.win}勝 {dr.total - dr.win}敗</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	h1 {
		font-size: 22px;
		color: #c0c0e0;
		margin: 0;
	}

	h2 {
		font-size: 16px;
		margin: 24px 0 10px;
		color: #9090b0;
	}

	.btn-add {
		background: #7c83fd;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 13px;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-add:hover {
		background: #6570e8;
	}

	/* クイック追加フォーム */
	.add-form-card {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 20px 24px;
		margin-bottom: 24px;
	}

	.form-title {
		font-size: 14px;
		color: #9090b0;
		margin: 0 0 16px;
	}

	.form-row {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}

	.field {
		display: flex;
		flex-direction: column;
		min-width: 140px;
	}

	.field-note {
		flex: 1;
		min-width: 200px;
	}

	label,
	.field-label {
		font-size: 12px;
		color: #7070a0;
		margin-bottom: 6px;
	}

	select,
	input[type='number'],
	input[type='text'] {
		background: #0f0f1e;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
		color: #e0e0ff;
		padding: 8px 10px;
		font-size: 13px;
		outline: none;
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
	}

	select:focus,
	input:focus {
		border-color: #7c83fd;
	}

	.radio-group {
		display: flex;
		gap: 16px;
		align-items: center;
		padding-top: 4px;
	}

	.radio {
		display: flex;
		align-items: center;
		gap: 5px;
		cursor: pointer;
		font-size: 13px;
		color: #c0c0e0;
	}

	.radio.win {
		color: #4caf8a;
	}

	.radio.lose {
		color: #e05c5c;
	}

	.form-error {
		color: #e05c5c;
		font-size: 12px;
		margin: 4px 0 8px;
	}

	.form-actions {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-top: 8px;
	}

	.btn-primary {
		background: #7c83fd;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 20px;
		font-size: 13px;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-cancel {
		background: none;
		border: none;
		color: #7070a0;
		font-size: 13px;
		cursor: pointer;
		font-family: inherit;
	}

	/* 統計カード */
	.stats-row {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
	}

	.stat-card {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 20px 28px;
		min-width: 160px;
	}

	.stat-label {
		font-size: 12px;
		color: #7070a0;
		margin-bottom: 6px;
	}

	.stat-value {
		font-size: 32px;
		font-weight: 700;
		color: #7c83fd;
	}

	.stat-sub {
		font-size: 12px;
		color: #7070a0;
		margin-top: 4px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	th {
		text-align: left;
		color: #7070a0;
		border-bottom: 1px solid #2a2a4a;
		padding: 6px 8px;
		font-weight: 500;
	}

	td {
		padding: 8px;
		border-bottom: 1px solid #1e1e3a;
		color: #c0c0e0;
	}

	td a {
		color: #7c83fd;
		text-decoration: none;
	}

	td.memo {
		max-width: 200px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: #9090b0;
	}

	:global(td.win) {
		color: #4caf8a;
		font-weight: 600;
	}

	:global(td.lose) {
		color: #e05c5c;
		font-weight: 600;
	}

	.empty {
		color: #606080;
		font-size: 13px;
		margin-top: 8px;
	}
</style>
