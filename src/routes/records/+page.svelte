<script lang="ts">
	import { onMount } from 'svelte';
	import { getRecords, getDecks } from '$lib/db';
	import type { GameRecord, Deck } from '$lib/types';
	import { CLASS_NAMES, FORMAT_NAMES } from '$lib/types';

	let records = $state<GameRecord[]>([]);
	let decks = $state<Deck[]>([]);
	let filterDeck = $state('');
	let filterFormat = $state('');
	let filterFirst = $state('');
	let filterResult = $state('');

	onMount(async () => {
		[records, decks] = await Promise.all([getRecords(), getDecks()]);
	});

	const deckMap = $derived(Object.fromEntries(decks.map((d) => [d.hash, d])));

	function formatIdFromHash(hash: string | undefined): number {
		if (!hash) return 0;
		return parseInt(hash.split('.')[0]);
	}

	const filtered = $derived(
		records.filter((r) => {
			if (filterDeck && r.deck_hash !== filterDeck) return false;
			if (filterFormat && formatIdFromHash(deckMap[r.deck_hash]?.hash) !== parseInt(filterFormat))
				return false;
			if (filterFirst === '1' && !r.is_first) return false;
			if (filterFirst === '0' && r.is_first) return false;
			if (filterResult && r.result !== filterResult) return false;
			return true;
		})
	);
</script>

<div class="header">
	<h1>対戦記録</h1>
	<a href="/records/new" class="btn-primary">＋ 記録追加</a>
</div>

<div class="filters">
	<select bind:value={filterDeck}>
		<option value="">すべてのデッキ</option>
		{#each decks as d}
			<option value={d.hash}>{d.name}</option>
		{/each}
	</select>

	<select bind:value={filterFormat}>
		<option value="">すべてのフォーマット</option>
		{#each Object.entries(FORMAT_NAMES) as [id, name]}
			<option value={id}>{name}</option>
		{/each}
	</select>

	<select bind:value={filterFirst}>
		<option value="">先後どちらも</option>
		<option value="1">先手</option>
		<option value="0">後手</option>
	</select>

	<select bind:value={filterResult}>
		<option value="">勝敗どちらも</option>
		<option value="win">勝ち</option>
		<option value="lose">負け</option>
	</select>
</div>

{#if filtered.length === 0}
	<p class="empty">条件に一致する記録がありません。</p>
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
			{#each filtered as r}
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

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	h1 {
		font-size: 20px;
		color: #c0c0e0;
	}

	.btn-primary {
		background: #7c83fd;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 13px;
		cursor: pointer;
		text-decoration: none;
	}

	.filters {
		display: flex;
		gap: 10px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	select {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		color: #c0c0e0;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 13px;
		outline: none;
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
	}
</style>
