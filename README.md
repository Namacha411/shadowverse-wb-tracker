# Shadowverse Worlds Beyond 戦績トラッカー

Shadowverse: Worlds Beyond の対戦記録を管理するデスクトップアプリです。

## 機能

- **ダッシュボード** — 全体勝率・フォーマット別/クラス別/デッキ別の勝率を一覧表示
- **対戦記録** — 使用デッキ・相手クラス・先後・勝敗・レート増減・メモを記録
- **検討ログ** — 対戦ごとにターン別の選択プレイや反省点を記録
- **デッキ管理** — QR コード読み取りまたは手動入力でデッキを登録
- **バックアップ** — DB ファイルを任意の場所に書き出し

対応フォーマット: ローテーション / アンリミテッド  

## インストール

[Releases](https://github.com/Namacha411/shadowverse-wb-tracker/releases) から最新版をダウンロードしてください。

| ファイル | 説明 |
|----------|------|
| `*_x64-setup.exe` | NSIS インストーラー（推奨） |
| `*_x64_en-US.msi` | MSI インストーラー |

> **注意:** 署名なしのバイナリのため、Windows Defender や SmartScreen の警告が表示される場合があります。「詳細情報」→「実行」で続行できます。

## 使い方

### デッキを登録する

1. サイドバーの「デッキ」→「＋ 新規登録」を開く
2. デッキの QR コードを画像ファイルで読み取るか、デッキハッシュを直接入力する
3. デッキ名を入力して保存

### 対戦を記録する

- **ダッシュボード**の「＋ 対戦記録を追加」ボタンからすばやく記録できます
- 詳細な記録は「対戦記録」→「＋ 新規追加」から行います

### 検討ログを残す

対戦記録の詳細画面から「＋ 検討ログを追加」でターンごとの選択プレイや反省を記録できます。

### バックアップ

「設定」画面の「バックアップ」ボタンで DB ファイルを保存できます。

## 開発

### 必要環境

- [Node.js](https://nodejs.org/) + [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/) + Cargo
- [Tauri の前提条件](https://tauri.app/start/prerequisites/) (Windows: Microsoft C++ Build Tools, WebView2)

### セットアップ

```bash
bun install
```

### 起動

```bash
# フロントエンド開発サーバーのみ (Tauri ネイティブ機能は使えない)
bun run dev

# Tauri アプリとして起動 (フル機能)
bun run tauri dev
```

### ビルド

```bash
bun run tauri build
```

成果物は `src-tauri/target/release/bundle/` に生成されます。

## 技術スタック

- [Tauri v2](https://tauri.app/) — デスクトップアプリフレームワーク
- [SvelteKit 5](https://svelte.dev/) — フロントエンド
- [SQLite](https://www.sqlite.org/) (`tauri-plugin-sql`) — データ永続化
- [rqrr](https://github.com/WanzenBug/rqrr) — QR コード解析

## コントリビューション

バグ報告・機能要望・プルリクエストを歓迎します。

- **バグ報告・要望:** [Issues](https://github.com/Namacha411/shadowverse-wb-tracker/issues) を作成してください
- **コード変更:** フォークして PR を送ってください。大きな変更の場合は事前に Issue で相談してもらえると助かります

## ライセンス

[MIT License](./LICENSE) — Copyright (c) 2026 Tanaka Hideyuki
