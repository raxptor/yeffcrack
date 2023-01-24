BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "decrypt" (
	"uncracked"	TEXT NOT NULL,
	"length"	INTEGER NOT NULL,
	"eval"	NUMERIC NOT NULL,
	"penalty"	INTEGER NOT NULL DEFAULT 0,
	"quadgram_rating"	NUMERIC,
	"cracked"	TEXT,
	"alphabet"	TEXT,
	"steps"	TEXT,
	"freq_rating"	INTEGER,
	"touched"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("uncracked")
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
COMMIT;
