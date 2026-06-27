CREATE TABLE IF NOT EXISTS decks (
    hash       TEXT     PRIMARY KEY,
    name       TEXT     NOT NULL,
    class_id   INTEGER  NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS records (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    deck_hash         TEXT     NOT NULL REFERENCES decks(hash),
    opponent_class_id INTEGER,
    is_first          BOOLEAN  NOT NULL,
    result            TEXT     NOT NULL CHECK(result IN ('win', 'lose')),
    rating_diff       INTEGER,
    note              TEXT,
    played_at         DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    record_id    INTEGER  NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    turn         INTEGER  NOT NULL,
    advantage    INTEGER  CHECK(advantage BETWEEN 0 AND 100),
    chosen_play  TEXT,
    alternatives TEXT,
    note         TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
