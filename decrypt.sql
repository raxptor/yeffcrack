BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "decrypt" (
	"uncracked"	TEXT NOT NULL,
	"length"	INTEGER NOT NULL,
	"complexity"	INTEGER NOT NULL DEFAULT 0,
	"eval"	NUMERIC NOT NULL,
	"penalty"	INTEGER NOT NULL DEFAULT 0,
	"meta_transposition_order"	TEXT,
	"quadgram_rating"	NUMERIC,
	"cracked"	TEXT,
	"frak_scores"	TEXT,
	"best_width"	INTEGER,
	"alphabet"	TEXT,
	"steps"	TEXT,
	"freq_rating"	INTEGER,
	"touched"	INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "decrypt_eval" ON "decrypt" (
	"eval"	ASC
);
CREATE INDEX IF NOT EXISTS "decrypt_len" ON "decrypt" (
	"length"
);
CREATE INDEX IF NOT EXISTS "decrypt_quadgram" ON "decrypt" (
	"quadgram_rating"	DESC
);
CREATE UNIQUE INDEX IF NOT EXISTS "decrypt_real_key" ON "decrypt" (
	"meta_transposition_order"	ASC,
	"uncracked"	ASC
);
CREATE INDEX IF NOT EXISTS "decrypt_complexity_eval" ON "decrypt" (
	"complexity"	ASC,
	"eval"	ASC
);
COMMIT;
