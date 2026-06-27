<script lang="ts">
	import { onMount } from 'svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { getDecks, deleteDeck } from '$lib/db';
	import type { Deck } from '$lib/types';
	import { CLASS_NAMES } from '$lib/types';

	function deckPortalUrl(hash: string): string {
		return `https://shadowverse-wb.com/ja/deck/detail/?hash=${hash}`;
	}

	async function handleOpenPortal(hash: string) {
		await openUrl(deckPortalUrl(hash));
	}

	let decks = $state<Deck[]>([]);

	onMount(async () => {
		decks = await getDecks();
	});

	async function handleDelete(hash: string, name: string) {
		if (!confirm(`「${name}」を削除しますか？\n関連する対戦記録も削除されます。`)) return;
		await deleteDeck(hash);
		decks = await getDecks();
	}
</script>

<div class="header">
	<h1>デッキ一覧</h1>
	<a href="/decks/new" class="btn-primary">＋ デッキ登録</a>
</div>

{#if decks.length === 0}
	<p class="empty">デッキが登録されていません。<a href="/decks/new">デッキを登録</a>してください。</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>デッキ名</th>
				<th>クラス</th>
				<th>登録日</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each decks as deck}
				<tr>
					<td>{deck.name}</td>
					<td>{CLASS_NAMES[deck.class_id] ?? '?'}</td>
					<td>{deck.created_at.slice(0, 10)}</td>
					<td>
						<div class="actions">
							<button class="btn-portal" onclick={() => handleOpenPortal(deck.hash)}>ポータル</button>
							<a href="/decks/{deck.hash}/edit" class="btn-edit">編集</a>
							<button class="btn-danger" onclick={() => handleDelete(deck.hash, deck.name)}>削除</button>
						</div>
					</td>
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
		margin-bottom: 20px;
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

	.btn-primary:hover {
		background: #6a72e8;
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

	.actions {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.btn-portal {
		background: transparent;
		color: #9090b0;
		border: 1px solid #3a3a5a;
		border-radius: 4px;
		padding: 3px 10px;
		font-size: 12px;
		cursor: pointer;
	}

	.btn-portal:hover {
		border-color: #7c83fd;
		color: #7c83fd;
	}

	.btn-edit {
		color: #7c83fd;
		text-decoration: none;
		font-size: 12px;
		border: 1px solid #7c83fd;
		border-radius: 4px;
		padding: 3px 10px;
	}

	.btn-edit:hover {
		background: #7c83fd22;
	}

	.btn-danger {
		background: transparent;
		color: #e05c5c;
		border: 1px solid #e05c5c;
		border-radius: 4px;
		padding: 3px 10px;
		font-size: 12px;
		cursor: pointer;
	}

	.btn-danger:hover {
		background: #e05c5c22;
	}

	.empty {
		color: #606080;
		font-size: 13px;
	}

	.empty a {
		color: #7c83fd;
	}
</style>
