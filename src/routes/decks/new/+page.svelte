<script lang="ts">
	import { goto } from '$app/navigation';
	import { invoke } from '@tauri-apps/api/core';
	import { createDeck } from '$lib/db';
	import { CLASS_NAMES } from '$lib/types';

	let urlInput = $state('');
	let nameInput = $state('');
	let error = $state('');
	let submitting = $state(false);
	let scanning = $state(false);
	let fileInput: HTMLInputElement;

	function parseHash(url: string): string {
		try {
			const u = new URL(url);
			const hash = u.searchParams.get('hash');
			if (hash) return hash;
		} catch {
			// URL パースに失敗した場合は生の入力をハッシュとして扱う
		}
		// hash= を含む文字列から抽出
		const m = url.match(/hash=([^\s&]+)/);
		if (m) return m[1];
		// それ以外はそのまま返す
		return url.trim();
	}

	function previewClass(url: string): string {
		const hash = parseHash(url);
		const seg = hash.split('.')[1];
		const id = parseInt(seg, 10);
		if (!isNaN(id) && CLASS_NAMES[id]) return CLASS_NAMES[id];
		return '';
	}

	async function handleQrFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		scanning = true;
		error = '';
		try {
			const buffer = await file.arrayBuffer();
			const bytes = Array.from(new Uint8Array(buffer));
			const url = await invoke<string>('parse_qr_image', { data: bytes });
			urlInput = url;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			scanning = false;
			(e.target as HTMLInputElement).value = '';
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		const hash = parseHash(urlInput);
		if (!hash) {
			error = 'URL または hash を入力してください。';
			return;
		}
		if (!nameInput.trim()) {
			error = 'デッキ名を入力してください。';
			return;
		}
		submitting = true;
		try {
			await createDeck(hash, nameInput.trim());
			goto('/decks');
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	let classPreview = $derived(previewClass(urlInput));
</script>

<div class="back"><a href="/decks">← デッキ一覧</a></div>
<h1>デッキ登録</h1>

<form onsubmit={handleSubmit}>
	<div class="field">
		<label for="url">Deck Portal URL または hash</label>
		<input
			id="url"
			type="text"
			bind:value={urlInput}
			placeholder="https://shadowverse-wb.com/ja/deck/detail/?hash=1.5.cM8E..."
		/>
		<input
			type="file"
			accept="image/*"
			style="display:none"
			bind:this={fileInput}
			onchange={handleQrFile}
		/>
		<button type="button" class="btn-qr" disabled={scanning} onclick={() => fileInput.click()}>
			{scanning ? '読み込み中...' : 'QRコードから読み込む'}
		</button>
		{#if classPreview}
			<div class="preview">クラス: {classPreview}</div>
		{/if}
	</div>

	<div class="field">
		<label for="name">デッキ名</label>
		<input id="name" type="text" bind:value={nameInput} placeholder="例: 疾走ロイヤル" />
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<div class="actions">
		<button type="submit" class="btn-primary" disabled={submitting}>
			{submitting ? '登録中...' : '登録する'}
		</button>
		<a href="/decks" class="btn-cancel">キャンセル</a>
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
		max-width: 560px;
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

	.btn-qr {
		margin-top: 8px;
		background: transparent;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
		color: #7c83fd;
		padding: 7px 14px;
		font-size: 13px;
		cursor: pointer;
	}

	.btn-qr:hover:not(:disabled) {
		border-color: #7c83fd;
	}

	.btn-qr:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.preview {
		font-size: 12px;
		color: #7c83fd;
		margin-top: 6px;
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
