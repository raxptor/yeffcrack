var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var misc = require('./scripts/normalize.js');

const db = new sqlite3.Database("texts.sqlite3", (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		var touche = 1;
		bulk.bucket_size = 3;
		bulk.crack_it(db, "SELECT uncracked, freq_rating from decrypt WHERE is_test_data=0 AND touched <> " + touche + " ORDER BY COALESCE(quadgram_rating/length, 0) DESC", "subst", function(cipher, r) {
			if (r.quadgram_rating && r.cracked) {
				console.log(r);
				db.run("UPDATE decrypt SET touched = ? WHERE uncracked = ?", [touche, cipher]);
				db.run("UPDATE decrypt SET quadgram_rating = ?, cracked = ? WHERE uncracked = ? AND (quadgram_rating IS NULL OR quadgram_rating < ?)", [r.quadgram_rating, r.cracked, cipher, r.quadgram_rating], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});

