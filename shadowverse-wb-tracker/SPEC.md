# シャドバWB 戦績記録アプリ SPEC

## 概要

Shadowverse: Worlds Beyond（シャドバWB）のランク戦・レート戦の戦績と対局中の思考を記録・振り返るためのデスクトップアプリ。

- **技術スタック**: Tauri 2.x (SvelteKit 2.x + Rust) + SQLite (tauri-plugin-sql)
- **パッケージマネージャ**: Bun
- **対象プラットフォーム**: Windows / macOS
- **ネットワーク**: 完全ローカル動作（サーバー不要）

---

## デッキ仕様の前提知識

Deck Portal の共有URLは以下の形式で、サーバーへのデータ保存なしにURLのみでデッキリストが完結している。

```
https://shadowverse-wb.com/ja/deck/detail/?hash=1.5.cM8E.cM8E.cxFE.cxFE...
```

| 位置 | 内容 |
|------|------|
| 第1セグメント | フォーマット種別（`1` = ローテーション、`2` = アンリミテッド） |
| 第2セグメント | クラスID（整数） |
| 第3セグメント以降 | カードID（40枚分、重複=同名複数枚） |

QRコードにはこのURLがそのまま埋め込まれているため、QR画像をスキャンすれば `hash` パラメータを取得できる。期限切れは発生しない。

### クラスID対応表

| class_id | クラス名 |
|----------|----------|
| 1 | エルフ |
| 2 | ロイヤル |
| 3 | ウィッチ |
| 4 | ドラゴン |
| 5 | ナイトメア |
| 6 | ビショップ |
| 7 | ネメシス |

※ヴァンパイアは Worlds Beyond で廃止。ネクロマンサーはナイトメアに改名。
各クラスの QR コードを実測して確定済み。

---

## データベース設計

### テーブル定義

```sql
CREATE TABLE decks (
    hash       TEXT     PRIMARY KEY,           -- Deck Portal の hash パラメータ全体
    name       TEXT     NOT NULL,              -- ユーザーが付けるデッキ名
    class_id   INTEGER  NOT NULL,              -- hash の第2セグメント（パース済み）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE records (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    deck_hash         TEXT     NOT NULL REFERENCES decks(hash),
    opponent_class_id INTEGER,                 -- 相手クラス（NULL = 未記録）
    is_first          BOOLEAN  NOT NULL,       -- 1 = 先手, 0 = 後手
    result            TEXT     NOT NULL CHECK(result IN ('win', 'lose')),
    rating_diff       INTEGER,                 -- NULL = レート戦以外（カジュアル・2Pick等）
    note              TEXT,                    -- 勝敗理由など自由記述
    played_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    record_id    INTEGER  NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    turn         INTEGER  NOT NULL,            -- 何ターン目の局面か
    advantage    INTEGER  CHECK(advantage BETWEEN 0 AND 100),
                                               -- 主観的勝率感（50=五分, NULL=未入力）
    chosen_play  TEXT,                         -- 実際に選んだ手
    alternatives TEXT,                         -- 他択（自由記述）
    note         TEXT,                         -- 選択理由・読み・流れ
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 設計メモ

- `decks.hash` が PK。`id` カラムは不要。
- `records.rating_diff` は NULL 許容。レート戦以外の記録も想定。
- `reviews.advantage` は UI 上スライダー（0〜100）で入力。
  - `0`  = 敗色濃厚、`50` = 五分五分、`100` = 勝ちほぼ確定
  - 未入力（NULL）を許容する。
- `reviews` は `records` に CASCADE DELETE。対戦記録を消すと検討ログも消える。

---

## 画面構成・ルーティング

**SvelteKit** のファイルルーティングを使用（adapter-static + SPA モード）。

```
/                              ダッシュボード
/records                       対戦記録一覧
/records/new                   対戦記録 新規作成
/records/:id                   対戦記録詳細（検討ログ一覧を含む）
/records/:id/reviews/new       検討ログ 追加
/records/:id/reviews/:rid/edit 検討ログ 編集
/records/:id/reviews/:rid/export カードプレビュー & エクスポート
/decks                         デッキ一覧
/decks/new                     デッキ登録
/decks/:hash                   デッキ詳細（そのデッキでの戦績）
/settings                      設定
```

### 各画面の責務

| 画面 | 主な内容 |
|------|---------|
| ダッシュボード | 全体勝率・最近の対戦5件・デッキ別勝率サマリ |
| 対戦記録一覧 | フィルタ（デッキ / 先後 / 結果）付き一覧 |
| 対戦記録 新規作成 | デッキ選択 → 先後・結果・レート増減・備考入力 |
| 対戦記録詳細 | 記録内容表示 + 検討ログ一覧（ターン順） |
| 検討ログ 追加/編集 | ターン・勝率感・選択した手・他択・メモ入力 |
| カードプレビュー & エクスポート | OGP風カードのプレビュー + PNG保存/クリップボードコピー |
| デッキ登録 | QRスキャン or URL直接入力 → デッキ名を付けて保存 |
| デッキ詳細 | デッキ情報 + そのデッキの勝率・対戦履歴 |

### ナビゲーション

常時表示のサイドバーに以下の4項目のみ配置する。

- ダッシュボード
- 対戦記録
- デッキ
- 設定

### ガード処理

`/records/new` でデッキが1件も登録されていない場合は `/decks/new` へリダイレクトし、案内メッセージを表示する。

---

## ディレクトリ構成

```
shadowverse-wb-tracker/
├── src-tauri/                   # Rust layer
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs               # Tauri SQL プラグイン登録・マイグレーション定義
│   │   └── db/
│   │       └── migrations/
│   │           └── 001_init.sql # テーブル定義
│   ├── tauri.conf.json
│   └── Cargo.toml
│
└── src/                         # SvelteKit layer
    ├── routes/
    │   ├── +layout.ts           # SSR 無効化
    │   ├── +layout.svelte       # サイドバー共通レイアウト
    │   ├── +page.svelte         # ダッシュボード
    │   ├── records/
    │   │   ├── +page.svelte     # 一覧
    │   │   ├── new/
    │   │   │   └── +page.svelte # 新規作成
    │   │   └── [id]/
    │   │       ├── +page.svelte # 詳細
    │   │       └── reviews/
    │   │           ├── new/
    │   │           │   └── +page.svelte
    │   │           └── [rid]/
    │   │               └── edit/
    │   │                   └── +page.svelte
    │   ├── decks/
    │   │   ├── +page.svelte     # 一覧
    │   │   └── new/
    │   │       └── +page.svelte # 登録
    │   └── settings/
    │       └── +page.svelte
    └── lib/
        ├── db.ts                # SQL プラグイン経由の全DB操作
        └── types.ts             # 共有型定義・クラスID定数
```

---

## データアクセス方針

CRUD 操作はカスタム Rust コマンドを使わず、**Tauri SQL プラグイン**経由でフロントエンドから直接 SQL を実行する。

フロントは必ず `lib/db.ts` 経由で呼び出す。コンポーネントから直接 SQL を書かない。

```ts
// lib/db.ts の主な関数
getDecks() / createDeck(hash, name) / deleteDeck(hash)
getRecords(deckHash?) / getRecord(id) / createRecord(payload) / deleteRecord(id)
getReviews(recordId) / createReview(payload) / updateReview(id, payload) / deleteReview(id)
getWinRate(deckHash?)  // ダッシュボード用集計
```

MVP 後に追加するコマンド（Rust）:
- `parse_qr_image(path)` — QRコード解析（rqrr クレート）
- `save_image` / `copy_to_clipboard` — エクスポート機能

---

## Cargo.toml 依存クレート（MVP）

```toml
[dependencies]
tauri            = { version = "2", features = [] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
serde            = { version = "1", features = ["derive"] }
serde_json       = "1"
```

MVP 後に追加:
```toml
rqrr  = "0.6"   # QRコード読み取り
image = "0.25"  # rqrr 用画像デコード
tauri = { version = "2", features = ["clipboard-manager"] }
```

---

## エクスポート機能

### 出力仕様

- **形式**: PNG
- **サイズ**: 1200 × 630px（OGP標準サイズ）
- **単位**: 検討ログ1ターン = カード1枚

### カードレイアウト（案）

```
┌─────────────────────────────────────────────┐
│  [自クラス] vs [相手クラス]  Turn N  先手/後手 │
│  ─────────────────────────────────────────── │
│  勝率感  ████████░░  72                      │
│                                              │
│  選択:  （chosen_play の内容）                │
│                                              │
│  他択:  （alternatives の内容）               │
│                                              │
│  読み:  （note の内容）                       │
│                                              │
│  #シャドバWB  #クラス名          アプリ名     │
└─────────────────────────────────────────────┘
```

### 実装方針

1. `Export.svelte` でカードを HTML/SVG としてレンダリング
2. `html-to-image` または `OffscreenCanvas` で PNG にラスタライズ
3. `export.rs` の `save_image` でローカル保存、または `copy_to_clipboard` でクリップボードに直コピー

クリップボードコピーに対応することで X への貼り付けがワンクリックになる。

---

## 未確定事項（実装前に要確認）

1. **`advantage` UI**: スライダーのステップ数・ラベル文言（「敗色濃厚」「五分」「勝ちほぼ確定」等）は実装時に調整。
2. **マイグレーション戦略**: プロトタイプ段階は `001_init.sql` 1ファイルで十分。スキーマ変更時にインクリメントする運用にする。
3. **ルーティング**: SvelteKit のファイルルーティングを使用（確定）。

---

## プロトタイプのスコープ（MVP）

以下に絞って動くものを先に作る。

- [ ] DBセットアップ（SQLite初期化・マイグレーション）
- [ ] デッキ登録（URL手入力のみ、QRは後回し）
- [ ] 対戦記録 新規作成・一覧・詳細
- [ ] 検討ログ 追加・編集
- [ ] ダッシュボード（勝率表示のみ）

QRスキャン・エクスポート・デッキ詳細ページはMVP後に追加する。
