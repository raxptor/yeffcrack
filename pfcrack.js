var sqlite3 = require('sqlite3');
var bulk = require('./scripts/bulkcrack.js');
var conf = require('./algoconf.json');

const db = new sqlite3.Database(conf.database, (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		bulk.bucket_size = 6;
		bulk.num_buckets = 5;
		var query = "SELECT uncracked, abs(eval-" + conf.prio_eval + ") as eval_diff, length from decrypt WHERE cracked is NULL ORDER BY penalty ASC, eval_diff ASC, complexity ASC";
		console.log(query);
		bulk.crack_it(db, query, "playfair", function(cipher, r) {
			if (r.quadgram_rating && r.cracked && r.alphabet) {
				console.log(r);
				db.run("UPDATE decrypt SET quadgram_rating = ?, cracked = ?, alphabet = ? WHERE uncracked = ? AND (quadgram_rating IS NULL OR quadgram_rating < ?)", [r.quadgram_rating, r.cracked, r.alphabet, cipher, r.quadgram_rating], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});

