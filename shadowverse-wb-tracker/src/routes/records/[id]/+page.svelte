<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getRecord, getDeck, getReviews, deleteRecord, deleteReview } from '$lib/db';
	import type { GameRecord, Deck, Review } from '$lib/types';
	import { CLASS_NAMES } from '$lib/types';

	const id = $derived(parseInt($page.params.id, 10));

	let record = $state<GameRecord | null>(null);
	let deck = $state<Deck | null>(null);
	let reviews = $state<Review[]>([]);
	let loadError = $state('');

	onMount(async () => {
		try {
			const [r, revs] = await Promise.all([getRecord(id), getReviews(id)]);
			record = r;
			reviews = revs;
			deck = await getDeck(r.deck_hash);
		} catch (e: unknown) {
			loadError = e instanceof Error ? e.message : String(e);
		}
	});

	async function handleDeleteRecord() {
		if (!confirm('この対戦記録を削除しますか？\n検討ログも一緒に削除されます。')) return;
		await deleteRecord(id);
		goto('/records');
	}

	async function handleDeleteReview(rid: number) {
		if (!confirm('この検討ログを削除しますか？')) return;
		await deleteReview(rid);
		reviews = await getReviews(id);
	}

	function advantageLabel(v: number | null): string {
		if (v === null) return '-';
		if (v >= 70) return `${v}（有利）`;
		if (v <= 30) return `${v}（不利）`;
		return `${v}（五分）`;
	}
</script>

<div class="back"><a href="/records">← 対戦記録一覧</a></div>

{#if loadError}
	<p class="error">{loadError}</p>
{:else if record}
	<div class="record-header">
		<h1>
			{#if deck}{deck.name}{/if}
			<span class="vs">vs</span>
			{record.opponent_class_id ? (CLASS_NAMES[record.opponent_class_id] ?? '?') : '不明'}
		</h1>
		<div class="header-actions">
			<a href="/records/{id}/edit" class="btn-edit-header">編集</a>
			<button class="btn-danger" onclick={handleDeleteRecord}>削除</button>
		</div>
	</div>

	<div class="meta">
		<span class="badge {record.result}">{record.result === 'win' ? '勝ち' : '負け'}</span>
		<span class="badge neutral">{record.is_first ? '先手' : '後手'}</span>
		{#if record.rating_diff != null}
			<span class="badge neutral"
				>レート {record.rating_diff >= 0 ? '+' : ''}{record.rating_diff}</span
			>
		{/if}
		<span class="date">{record.played_at.slice(0, 16)}</span>
	</div>

	{#if record.note}
		<div class="note-box">
			<div class="note-label">メモ</div>
			<div class="note-body">{record.note}</div>
		</div>
	{/if}

	<div class="reviews-header">
		<h2>検討ログ</h2>
		<a href="/records/{id}/reviews/new" class="btn-primary">＋ 追加</a>
	</div>

	{#if reviews.length === 0}
		<p class="empty">検討ログはまだありません。</p>
	{:else}
		<div class="review-list">
			{#each reviews as rev}
				<div class="review-card">
					<div class="review-top">
						<span class="turn-badge">Turn {rev.turn}</span>
						{#if rev.advantage !== null}
							<span class="advantage">勝率感: {advantageLabel(rev.advantage)}</span>
						{/if}
						<div class="review-actions">
							<a href="/records/{id}/reviews/{rev.id}/edit" class="btn-edit">編集</a>
							<button class="btn-danger-sm" onclick={() => handleDeleteReview(rev.id)}>削除</button>
						</div>
					</div>
					{#if rev.chosen_play}
						<div class="review-section">
							<span class="label">選択した手:</span>
							<span>{rev.chosen_play}</span>
						</div>
					{/if}
					{#if rev.alternatives}
						<div class="review-section">
							<span class="label">他択:</span>
							<span>{rev.alternatives}</span>
						</div>
					{/if}
					{#if rev.note}
						<div class="review-section">
							<span class="label">読み・メモ:</span>
							<span>{rev.note}</span>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{:else}
	<p class="loading">読み込み中...</p>
{/if}

<style>
	.back a {
		color: #7c83fd;
		text-decoration: none;
		font-size: 13px;
	}

	.record-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 16px 0 12px;
	}

	.header-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.btn-edit-header {
		color: #7c83fd;
		text-decoration: none;
		font-size: 12px;
		border: 1px solid #7c83fd;
		border-radius: 4px;
		padding: 5px 12px;
	}

	h1 {
		font-size: 20px;
		color: #c0c0e0;
	}

	.vs {
		color: #7070a0;
		font-size: 14px;
		margin: 0 8px;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.badge {
		border-radius: 4px;
		padding: 3px 10px;
		font-size: 12px;
		font-weight: 600;
	}

	.badge.win {
		background: #1e4a3a;
		color: #4caf8a;
	}

	.badge.lose {
		background: #4a1e1e;
		color: #e05c5c;
	}

	.badge.neutral {
		background: #2a2a4a;
		color: #a0a0c0;
	}

	.date {
		color: #606080;
		font-size: 12px;
	}

	.note-box {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 12px 16px;
		margin-bottom: 20px;
	}

	.note-label {
		font-size: 11px;
		color: #7070a0;
		margin-bottom: 4px;
	}

	.note-body {
		font-size: 13px;
		color: #c0c0e0;
		white-space: pre-wrap;
	}

	.reviews-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 24px 0 12px;
	}

	h2 {
		font-size: 16px;
		color: #9090b0;
	}

	.btn-primary {
		background: #7c83fd;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 13px;
		cursor: pointer;
		text-decoration: none;
	}

	.btn-danger {
		background: transparent;
		color: #e05c5c;
		border: 1px solid #e05c5c;
		border-radius: 4px;
		padding: 5px 12px;
		font-size: 12px;
		cursor: pointer;
	}

	.review-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.review-card {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 14px 16px;
	}

	.review-top {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 10px;
	}

	.turn-badge {
		background: #7c83fd22;
		color: #7c83fd;
		border-radius: 4px;
		padding: 2px 8px;
		font-size: 12px;
		font-weight: 600;
	}

	.advantage {
		font-size: 12px;
		color: #9090b0;
	}

	.review-actions {
		margin-left: auto;
		display: flex;
		gap: 8px;
	}

	.btn-edit {
		color: #7c83fd;
		text-decoration: none;
		font-size: 12px;
		border: 1px solid #7c83fd;
		border-radius: 4px;
		padding: 2px 8px;
	}

	.btn-danger-sm {
		background: transparent;
		color: #e05c5c;
		border: 1px solid #e05c5c;
		border-radius: 4px;
		padding: 2px 8px;
		font-size: 12px;
		cursor: pointer;
	}

	.review-section {
		font-size: 13px;
		color: #c0c0e0;
		margin-top: 6px;
		line-height: 1.5;
	}

	.label {
		color: #7070a0;
		margin-right: 6px;
		font-size: 12px;
	}

	.empty {
		color: #606080;
		font-size: 13px;
	}

	.loading {
		color: #606080;
		font-size: 13px;
	}

	.error {
		color: #e05c5c;
		font-size: 13px;
	}
</style>
