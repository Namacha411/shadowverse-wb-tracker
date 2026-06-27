<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { deleteAllRecords, deleteAllData } from '$lib/db';

	let backupMsg = $state('');
	let backupError = $state('');
	let backupBusy = $state(false);

	type ConfirmTarget = 'records' | 'all' | null;
	let confirmTarget = $state<ConfirmTarget>(null);
	let deleteMsg = $state('');
	let deleteBusy = $state(false);

	async function handleBackup() {
		backupMsg = '';
		backupError = '';
		backupBusy = true;
		try {
			const msg = await invoke<string>('backup_database');
			backupMsg = msg;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			if (msg !== 'cancelled') backupError = msg;
		} finally {
			backupBusy = false;
		}
	}

	async function handleDelete() {
		if (!confirmTarget) return;
		deleteBusy = true;
		deleteMsg = '';
		try {
			if (confirmTarget === 'records') {
				await deleteAllRecords();
				deleteMsg = '対戦記録を削除しました。';
			} else {
				await deleteAllData();
				deleteMsg = '全データを削除しました。';
			}
		} catch (err: unknown) {
			deleteMsg = `エラー: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			deleteBusy = false;
			confirmTarget = null;
		}
	}
</script>

<h1>設定</h1>

<section class="setting-section">
	<h2>データのバックアップ</h2>
	<p class="desc">現在のデータベースをファイルに保存します。シーズン変更前にバックアップしておくことをお勧めします。</p>
	<button class="btn-primary" onclick={handleBackup} disabled={backupBusy}>
		{backupBusy ? '保存中...' : 'データをバックアップ'}
	</button>
	{#if backupMsg}
		<p class="msg-success">{backupMsg}</p>
	{/if}
	{#if backupError}
		<p class="msg-error">{backupError}</p>
	{/if}
</section>

<section class="setting-section danger-zone">
	<h2>データの削除</h2>
	<p class="desc">シーズン変更に伴いデータをリセットします。削除したデータは元に戻せません。</p>

	<div class="delete-actions">
		<div class="delete-item">
			<div>
				<div class="delete-title">対戦記録のみ削除</div>
				<div class="delete-sub">登録デッキは残します。</div>
			</div>
			<button
				class="btn-danger"
				onclick={() => { confirmTarget = 'records'; deleteMsg = ''; }}
				disabled={deleteBusy}
			>
				対戦記録を削除
			</button>
		</div>

		<div class="delete-item">
			<div>
				<div class="delete-title">全データを削除</div>
				<div class="delete-sub">対戦記録とデッキをすべて削除します。</div>
			</div>
			<button
				class="btn-danger"
				onclick={() => { confirmTarget = 'all'; deleteMsg = ''; }}
				disabled={deleteBusy}
			>
				全データを削除
			</button>
		</div>
	</div>

	{#if confirmTarget}
		<div class="confirm-box">
			<p class="confirm-msg">
				{#if confirmTarget === 'records'}
					対戦記録をすべて削除します。この操作は取り消せません。
				{:else}
					対戦記録とデッキをすべて削除します。この操作は取り消せません。
				{/if}
			</p>
			<div class="confirm-actions">
				<button class="btn-danger-confirm" onclick={handleDelete} disabled={deleteBusy}>
					{deleteBusy ? '削除中...' : 'はい、削除する'}
				</button>
				<button class="btn-cancel" onclick={() => (confirmTarget = null)} disabled={deleteBusy}>
					キャンセル
				</button>
			</div>
		</div>
	{/if}

	{#if deleteMsg}
		<p class={deleteMsg.startsWith('エラー') ? 'msg-error' : 'msg-success'}>{deleteMsg}</p>
	{/if}
</section>

<style>
	h1 {
		font-size: 20px;
		color: #c0c0e0;
		margin-bottom: 24px;
	}

	h2 {
		font-size: 15px;
		color: #9090b0;
		margin: 0 0 8px;
	}

	.setting-section {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 20px 24px;
		margin-bottom: 20px;
		max-width: 600px;
	}

	.danger-zone {
		border-color: #4a2a2a;
	}

	.desc {
		font-size: 13px;
		color: #7070a0;
		margin: 0 0 14px;
		line-height: 1.5;
	}

	.btn-primary {
		background: #7c83fd;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 9px 20px;
		font-size: 13px;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-danger {
		background: #3a1a1a;
		color: #e05c5c;
		border: 1px solid #5a2a2a;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 13px;
		cursor: pointer;
		font-family: inherit;
		white-space: nowrap;
	}

	.btn-danger:hover:not(:disabled) {
		background: #4a2020;
	}

	.btn-danger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-danger-confirm {
		background: #c0392b;
		color: #fff;
		border: none;
		border-radius: 6px;
		padding: 8px 18px;
		font-size: 13px;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-danger-confirm:disabled {
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

	.delete-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.delete-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 14px;
		background: #0f0f1e;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
	}

	.delete-title {
		font-size: 13px;
		color: #c0c0e0;
		margin-bottom: 2px;
	}

	.delete-sub {
		font-size: 12px;
		color: #606080;
	}

	.confirm-box {
		margin-top: 16px;
		padding: 14px 16px;
		background: #2a1515;
		border: 1px solid #5a2a2a;
		border-radius: 6px;
	}

	.confirm-msg {
		font-size: 13px;
		color: #e08080;
		margin: 0 0 12px;
	}

	.confirm-actions {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.msg-success {
		font-size: 13px;
		color: #4caf8a;
		margin: 12px 0 0;
	}

	.msg-error {
		font-size: 13px;
		color: #e05c5c;
		margin: 12px 0 0;
	}
</style>
