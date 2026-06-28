# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Shadowverse Worlds Beyond 戦績記録アプリ。Tauri v2 + SvelteKit 5 + TypeScript のデスクトップアプリで、SQLite にデータを保存する。

## Commands

```bash
# フロントエンド開発サーバー (Tauri ネイティブ機能は使えない)
npm run dev

# Tauri アプリ起動 (フル機能)
npm run tauri dev

# 型チェック
npm run check

# プロダクションビルド
npm run tauri build
```

Rust のコードを変更した場合は `npm run tauri dev` で再起動が必要。

## Architecture

### データフロー

フロントエンド (SvelteKit) → `src/lib/db.ts` → `@tauri-apps/plugin-sql` → SQLite (`shadowverse-wb.db`)

ネイティブ機能 (QR 読み取り・バックアップ) は `invoke()` で Rust コマンドを呼び出す。

### フロントエンド (`src/`)

- `src/lib/db.ts` — DB 操作の全関数。ここに全 CRUD をまとめる。他のコンポーネントはこのファイルのみインポートする。
- `src/lib/types.ts` — 共有型と定数。`CLASS_NAMES` / `FORMAT_NAMES` / ペイロード型はここで定義。
- `src/routes/+layout.svelte` — サイドバーナビゲーション付きの共通レイアウト。
- `src/routes/+page.svelte` — ダッシュボード。勝率・直近対戦・クラス別/デッキ別/フォーマット別統計を表示。

ルート構成:
```
/               ダッシュボード
/records        対戦記録一覧
/records/new    対戦記録追加
/records/[id]   対戦記録詳細 + 検討ログ一覧
/records/[id]/edit
/records/[id]/reviews/new
/records/[id]/reviews/[rid]/edit
/decks          デッキ一覧
/decks/new      デッキ登録 (QR コード読み取り or 手動入力)
/decks/[hash]/edit
/settings       バックアップ・データ削除
```

Svelte 5 のルーン (`$state`, `$derived`) を使用している。`let x = writable()` ではなく `let x = $state()` を使うこと。

### バックエンド (`src-tauri/src/`)

- `lib.rs` — Tauri コマンド定義と DB マイグレーション設定。
  - `parse_qr_image`: 画像バイト列を受け取り QR コードをデコード (`rqrr` クレート使用)
  - `backup_database`: ファイル保存ダイアログを開いて DB をコピー
- `db/migrations/001_init.sql` — 初期スキーマ。新しいテーブルやカラムを追加する場合は新しいマイグレーションファイルを追加し、`lib.rs` の `migrations` ベクタに追記する。

### データモデル

**デッキハッシュ** の構造: `{format_id}.{class_id}.{...rest}`
- `format_id`: 1=ローテーション, 2=アンリミテッド
- `class_id`: 1=エルフ, 2=ロイヤル, 3=ウィッチ, 4=ドラゴン, 5=ナイトメア, 6=ビショップ, 7=ネメシス

`class_id` と `format_id` はハッシュから派生するため `decks` テーブルに `class_id` を保持しているが、`format_id` はハッシュから都度計算する (`db.ts` の `getFormatWinRates` を参照)。

SQLite の BOOLEAN は `0/1` で保存される。フロントエンド側で `is_first ? 1 : 0` の変換が必要。

## Key Constraints

- DB 接続はシングルトン (`_db`) で管理。`getDb()` 経由でアクセスする。
- `@tauri-apps/plugin-sql` はパラメータバインドに `$1`, `$2`, ... を使う (PostgreSQL 記法)。
- スタイルはすべてコンポーネント内の `<style>` ブロックに書く。グローバル CSS ファイルはない。ダークテーマのカラーパレット: 背景 `#0f0f0f`、サイドバー `#1a1a2e`、アクセント `#7c83fd`。
