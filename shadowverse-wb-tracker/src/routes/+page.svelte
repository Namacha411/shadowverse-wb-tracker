<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getDecks,
		getWinRate,
		getRecentRecords,
		getDeckWinRates,
		getClassWinRates,
		getFormatWinRates
	} from '$lib/db';
	import type { Deck, GameRecord } from '$lib/types';
	import { CLASS_NAMES, FORMAT_NAMES } from '$lib/types';

	let totalWin = $state(0);
	let totalCount = $state(0);
	let recentRecords = $state<GameRecord[]>([]);
	let decks = $state<Deck[]>([]);
	let deckRates = $state<{ deck: Deck; win: number; total: number }[]>([]);
	let classRates = $state<{ class_id: number; win: number; total: number }[]>([]);
	let formatRates = $state<{ format_id: number; win: number; total: number }[]>([]);

	const deckMap = $derived(Object.fromEntries(decks.map((d) => [d.hash, d])));

	onMount(async () => {
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
	});

	function winRateText(win: number, total: number): string {
		if (total === 0) return '- %';
		return `${Math.round((win / total) * 100)} %`;
	}

	function formatIdFromHash(hash: string | undefined): number {
		if (!hash) return 0;
		return parseInt(hash.split('.')[0]);
	}
</script>

<h1>ダッシュボード</h1>

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
	h1 {
		font-size: 22px;
		margin-bottom: 20px;
		color: #c0c0e0;
	}

	h2 {
		font-size: 16px;
		margin: 24px 0 10px;
		color: #9090b0;
	}

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
