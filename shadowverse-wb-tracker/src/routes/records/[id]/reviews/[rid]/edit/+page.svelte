<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getReview, updateReview } from '$lib/db';

	const recordId = $derived(parseInt($page.params.id, 10));
	const reviewId = $derived(parseInt($page.params.rid, 10));

	let turn = $state(1);
	let hasAdvantage = $state(false);
	let advantage = $state(50);
	let chosenPlay = $state('');
	let alternatives = $state('');
	let note = $state('');
	let error = $state('');
	let submitting = $state(false);

	onMount(async () => {
		try {
			const rev = await getReview(reviewId);
			turn = rev.turn;
			hasAdvantage = rev.advantage !== null;
			advantage = rev.advantage ?? 50;
			chosenPlay = rev.chosen_play ?? '';
			alternatives = rev.alternatives ?? '';
			note = rev.note ?? '';
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		submitting = true;
		try {
			await updateReview(reviewId, {
				turn,
				advantage: hasAdvantage ? advantage : null,
				chosen_play: chosenPlay.trim() || null,
				alternatives: alternatives.trim() || null,
				note: note.trim() || null
			});
			goto(`/records/${recordId}`);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="back"><a href="/records/{recordId}">← 対戦記録詳細</a></div>
<h1>検討ログ 編集</h1>

<form onsubmit={handleSubmit}>
	<div class="field">
		<label for="turn">ターン数</label>
		<input id="turn" type="number" min="1" bind:value={turn} />
	</div>

	<div class="field">
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={hasAdvantage} />
			勝率感を入力する
		</label>
		{#if hasAdvantage}
			<div class="slider-wrap">
				<input type="range" min="0" max="100" step="5" bind:value={advantage} />
				<div class="slider-labels">
					<span>敗色濃厚 (0)</span>
					<span class="slider-val">{advantage}</span>
					<span>勝ちほぼ確定 (100)</span>
				</div>
			</div>
		{/if}
	</div>

	<div class="field">
		<label for="chosen">選択した手</label>
		<textarea id="chosen" bind:value={chosenPlay} rows="2"></textarea>
	</div>

	<div class="field">
		<label for="alt">他択</label>
		<textarea id="alt" bind:value={alternatives} rows="2"></textarea>
	</div>

	<div class="field">
		<label for="note">読み・メモ</label>
		<textarea id="note" bind:value={note} rows="3"></textarea>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<div class="actions">
		<button type="submit" class="btn-primary" disabled={submitting}>
			{submitting ? '保存中...' : '更新する'}
		</button>
		<a href="/records/{recordId}" class="btn-cancel">キャンセル</a>
	</div>
</form>

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
		max-width: 540px;
	}

	.field {
		margin-bottom: 20px;
	}

	label {
		display: block;
		font-size: 13px;
		color: #9090b0;
		margin-bottom: 6px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		color: #c0c0e0;
		font-size: 14px;
		margin-bottom: 10px;
	}

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
		resize: vertical;
	}

	input:focus,
	textarea:focus {
		border-color: #7c83fd;
	}

	.slider-wrap {
		margin-top: 8px;
	}

	input[type='range'] {
		width: 100%;
		padding: 0;
		background: transparent;
		border: none;
		accent-color: #7c83fd;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: #7070a0;
		margin-top: 4px;
	}

	.slider-val {
		font-weight: 700;
		color: #7c83fd;
		font-size: 16px;
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
