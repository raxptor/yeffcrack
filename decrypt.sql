BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "decrypt" (
	"uncracked"	TEXT NOT NULL,
	"eval"	NUMERIC NOT NULL,
	"length"	INTEGER NOT NULL,
	"trigram_rating"	NUMERIC,
	"quadgram_rating"	NUMERIC,
	"cracked"	TEXT,
	"steps"	TEXT,
	"freq_rating"	INTEGER,
	"is_test_data"	INTEGER DEFAULT 0,
	"touched"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("uncracked")
);
CREATE INDEX IF NOT EXISTS "decrypt_eval" ON "decrypt" (
	"eval"	ASC
);
CREATE INDEX IF NOT EXISTS "decrypt_len" ON "decrypt" (
	"length"
);
COMMIT;
