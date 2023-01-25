var sqlite3 = require('sqlite3');
var bulk = require('./scripts/bulkcrack.js');
var conf = require('./algoconf.json');

const db = new sqlite3.Database(conf.database, (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		bulk.bucket_size = 1;
		bulk.num_buckets = 8;
		var query = "SELECT uncracked, abs(eval-" + conf.prio_eval + ") as eval_diff, meta_transposition_order, length, freq_rating from decrypt WHERE best_width is NULL AND meta_transposition_order IS NOT NULL ORDER BY eval_diff ASC, complexity ASC, penalty ASC, freq_rating ASC";
		console.log(query);
		bulk.crack_it(db, query, "colsubst", function(cipher, r) {
			if (r.quadgram_rating && r.cracked && r.alphabet && r.best_width) {
				db.run("UPDATE decrypt SET quadgram_rating = ?, cracked = ?, best_width = ?, alphabet = ? WHERE uncracked = ? AND meta_transposition_order = ? AND (quadgram_rating IS NULL OR quadgram_rating < ? OR best_width IS NULL)", [r.quadgram_rating, r.cracked, r.best_width, r.alphabet, cipher, r.meta_transposition_order, r.quadgram_rating], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});

