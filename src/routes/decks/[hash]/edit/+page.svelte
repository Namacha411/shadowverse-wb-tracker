<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getDeck, updateDeck } from '$lib/db';
	import { CLASS_NAMES } from '$lib/types';

	const hash = $derived($page.params.hash);

	let nameInput = $state('');
	let classPreview = $state('');
	let error = $state('');
	let submitting = $state(false);
	let loadError = $state('');

	onMount(async () => {
		try {
			const deck = await getDeck(hash);
			nameInput = deck.name;
			classPreview = CLASS_NAMES[deck.class_id] ?? '?';
		} catch (e: unknown) {
			loadError = e instanceof Error ? e.message : String(e);
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		if (!nameInput.trim()) {
			error = 'デッキ名を入力してください。';
			return;
		}
		submitting = true;
		try {
			await updateDeck(hash, nameInput.trim());
			goto('/decks');
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="back"><a href="/decks">← デッキ一覧</a></div>
<h1>デッキ編集</h1>

{#if loadError}
	<p class="error">{loadError}</p>
{:else}
	<form onsubmit={handleSubmit}>
		{#if classPreview}
			<div class="field">
				<div class="info-label">クラス</div>
				<div class="info-value">{classPreview}</div>
			</div>
		{/if}

		<div class="field">
			<label for="name">デッキ名</label>
			<input id="name" type="text" bind:value={nameInput} placeholder="例: 疾走ロイヤル" />
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div class="actions">
			<button type="submit" class="btn-primary" disabled={submitting}>
				{submitting ? '更新中...' : '更新する'}
			</button>
			<a href="/decks" class="btn-cancel">キャンセル</a>
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
		max-width: 560px;
	}

	.field {
		margin-bottom: 20px;
	}

	label,
	.info-label {
		display: block;
		font-size: 13px;
		color: #9090b0;
		margin-bottom: 6px;
	}

	.info-value {
		font-size: 14px;
		color: #c0c0e0;
		padding: 10px 12px;
		background: #141428;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
	}

	input {
		width: 100%;
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
		color: #e0e0ff;
		padding: 10px 12px;
		font-size: 14px;
		outline: none;
	}

	input:focus {
		border-color: #7c83fd;
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
