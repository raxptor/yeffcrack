var sqlite3 = require('sqlite3');
var bulk = require('./scripts/bulkcrack.js');
var conf = require('./algoconf.json');

const db = new sqlite3.Database(conf.database, (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		bulk.bucket_size = 2;
		bulk.num_buckets = 6;
		bulk.crack_it(db, "SELECT uncracked, abs(eval-686) as ic_diff, length, freq_rating from decrypt WHERE cracked is NULL ORDER BY is_test_data ASC, abs(length-98) asc, coalesce(freq_rating, 1000000) ASC, ic_diff ASC", "subst", function(cipher, r) {
			if (r.quadgram_rating && r.cracked) {
				console.log(r);
				db.run("UPDATE decrypt SET quadgram_rating = ?, cracked = ? WHERE uncracked = ? AND (quadgram_rating IS NULL OR quadgram_rating < ?)", [r.quadgram_rating, r.cracked, cipher, r.quadgram_rating], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});

