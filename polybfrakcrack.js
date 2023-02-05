var sqlite3 = require('sqlite3');
var bulk = require('./scripts/bulkcrack.js');
var conf = require('./algoconf.json');
;
const db = new sqlite3.Database(conf.database, (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		db.run("pragma synchronous=0");
		bulk.bucket_size = 1;
		bulk.num_buckets = 4;
		bulk.crack_it(db, "SELECT uncracked, meta_transposition_order FROM decrypt WHERE quadgram_rating is NULL ORDER BY RANDOM()", "frakcrack", function(cipher, r) {
			console.log(r);
			if (r.quadgram_rating) {
				db.run("UPDATE decrypt SET quadgram_rating = ? WHERE uncracked = ? AND meta_transposition_order = ?", [r.quadgram_rating, cipher, r.meta_transposition_order], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});
