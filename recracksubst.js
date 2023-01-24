var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var bulk = require('./scripts/bulkcrack.js');
var conf = require('./algoconf.json');

const db = new sqlite3.Database(conf.database, (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		var touche = 1;
		bulk.bucket_size = 1;
		bulk.crack_it(db, "SELECT uncracked, freq_rating from decrypt WHERE touched <> " + touche + " ORDER BY quadgram_rating DESC", "subst", function(cipher, r) {
			console.log(r);
			if (r.quadgram_rating && r.cracked && r.alphabet) {
				db.run("UPDATE decrypt SET touched = ? WHERE uncracked = ?", [touche, cipher]);
				db.run("UPDATE decrypt SET quadgram_rating = ?, cracked = ?, alphabet = ? WHERE uncracked = ? AND (quadgram_rating IS NULL OR quadgram_rating < ?)", [r.quadgram_rating, r.cracked, r.alphabet, cipher, r.quadgram_rating], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});

