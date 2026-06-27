<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getRecord, getDecks, updateRecord } from '$lib/db';
	import type { Deck } from '$lib/types';
	import { CLASS_NAMES, CLASS_IDS } from '$lib/types';

	const id = $derived(parseInt($page.params.id, 10));

	let decks = $state<Deck[]>([]);
	let deckHash = $state('');
	let opponentClassId = $state<number | null>(null);
	let isFirst = $state(true);
	let result = $state<'win' | 'lose'>('win');
	let ratingDiff = $state<string>('');
	let note = $state('');
	let error = $state('');
	let submitting = $state(false);
	let loadError = $state('');

	onMount(async () => {
		try {
			const [record, allDecks] = await Promise.all([getRecord(id), getDecks()]);
			decks = allDecks;
			deckHash = record.deck_hash;
			opponentClassId = record.opponent_class_id;
			isFirst = record.is_first === 1;
			result = record.result;
			ratingDiff = record.rating_diff !== null ? String(record.rating_diff) : '';
			note = record.note ?? '';
		} catch (e: unknown) {
			loadError = e instanceof Error ? e.message : String(e);
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		if (!deckHash) {
			error = 'デッキを選択してください。';
			return;
		}
		submitting = true;
		try {
			await updateRecord(id, {
				deck_hash: deckHash,
				opponent_class_id: opponentClassId,
				is_first: isFirst,
				result,
				rating_diff: ratingDiff !== '' ? parseInt(ratingDiff, 10) : null,
				note: note.trim() || null
			});
			goto(`/records/${id}`);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="back"><a href="/records/{id}">← 対戦記録詳細</a></div>
<h1>対戦記録 編集</h1>

{#if loadError}
	<p class="error">{loadError}</p>
{:else}
	<form onsubmit={handleSubmit}>
		<div class="field">
			<label for="deck">使用デッキ</label>
			<select id="deck" bind:value={deckHash}>
				{#each decks as d}
					<option value={d.hash}>{d.name} ({CLASS_NAMES[d.class_id] ?? '?'})</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<div class="field-label">先後</div>
			<div class="radio-group">
				<label class="radio">
					<input type="radio" bind:group={isFirst} value={true} />
					先手
				</label>
				<label class="radio">
					<input type="radio" bind:group={isFirst} value={false} />
					後手
				</label>
			</div>
		</div>

		<div class="field">
			<div class="field-label">結果</div>
			<div class="radio-group">
				<label class="radio win">
					<input type="radio" bind:group={result} value="win" />
					勝ち
				</label>
				<label class="radio lose">
					<input type="radio" bind:group={result} value="lose" />
					負け
				</label>
			</div>
		</div>

		<div class="field">
			<label for="opp">相手クラス（任意）</label>
			<select id="opp" bind:value={opponentClassId}>
				<option value={null}>未記録</option>
				{#each CLASS_IDS as cid}
					<option value={cid}>{CLASS_NAMES[cid]}</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<label for="rating">レート増減（任意）</label>
			<input
				id="rating"
				type="number"
				bind:value={ratingDiff}
				placeholder="例: +20 や -15"
			/>
		</div>

		<div class="field">
			<label for="note">メモ（任意）</label>
			<textarea id="note" bind:value={note} rows="3" placeholder="勝敗の要因など"></textarea>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div class="actions">
			<button type="submit" class="btn-primary" disabled={submitting}>
				{submitting ? '更新中...' : '更新する'}
			</button>
			<a href="/records/{id}" class="btn-cancel">キャンセル</a>
		</div>
	</form>
{/if}

<style>
	.back a {
		color: #7c83fd;
		text-decoration: none;
		font-size: 13px;
	}

	h1 {
		font-size: 20px;
		color: #c0c0e0;
		margin: 16px 0 24px;
	}

	form {
		max-width: 480px;
	}

	.field {
		margin-bottom: 20px;
	}

	label,
	.field-label {
		display: block;
		font-size: 13px;
		color: #9090b0;
		margin-bottom: 6px;
	}

	select,
	input[type='number'],
	textarea {
		width: 100%;
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
		color: #e0e0ff;
		padding: 10px 12px;
		font-size: 14px;
		outline: none;
		font-family: inherit;
	}

	select:focus,
	input:focus,
	textarea:focus {
		border-color: #7c83fd;
	}

	textarea {
		resize: vertical;
	}

	.radio-group {
		display: flex;
		gap: 20px;
	}

	.radio {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		font-size: 14px;
		color: #c0c0e0;
	}

	.radio.win {
		color: #4caf8a;
	}

	.radio.lose {
		color: #e05c5c;
	}

	.error {
		color: #e05c5c;
		font-size: 13px;
		margin-bottom: 12px;
	}

	.actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.btn-primary {
		background: #7c83fd;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 10px 24px;
		font-size: 14px;
		cursor: pointer;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-cancel {
		color: #7070a0;
		text-decoration: none;
		font-size: 13px;
	}
</style>
