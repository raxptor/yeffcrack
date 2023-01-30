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
		bulk.crack_it(db, "SELECT uncracked FROM decrypt WHERE frak_scores is NULL ORDER BY complexity ASC", "frakcrack", function(cipher, r) {
			if (r.frak_scores) {
				db.run("UPDATE decrypt SET frak_scores = ? WHERE uncracked = ?", [r.frak_scores, cipher], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});
