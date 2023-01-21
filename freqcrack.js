var sqlite3 = require('sqlite3');
var bulk = require('./scripts/bulkcrack.js');

const db = new sqlite3.Database("texts.sqlite3", (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		bulk.bucket_size = 128;
		bulk.crack_it(db, "SELECT uncracked FROM decrypt WHERE freq_rating is NULL", "freq", function(cipher, r) {
			if (r.freq_rating) {
				db.run("UPDATE decrypt SET freq_rating = ? WHERE uncracked = ?", [r.freq_rating, cipher], function(err) {
					if (err) {
						console.error("DB err=", err);
					}
				});
			}
		});
	}
});




