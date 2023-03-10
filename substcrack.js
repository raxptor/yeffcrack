var bulk = require('./scripts/bulkcrack.js');
var init = require('./scripts/init.js');

init.get_db_and_conf(function(conf, db) {
	bulk.bucket_size = 6;
	bulk.num_buckets = 5;
	var query = "SELECT uncracked, meta_transposition_order, abs(eval-" + conf.prio_eval + ") as eval_diff, length, freq_rating from decrypt WHERE cracked is NULL ORDER BY eval_diff ASC, penalty ASC, freq_rating ASC";
	console.log(query);
	bulk.crack_it(db, query, "subst", function(cipher, r) {
		if (r.quadgram_rating && r.cracked && r.alphabet) {
			console.log(r);
			db.run("UPDATE decrypt SET quadgram_rating = ?, cracked = ?, alphabet = ? WHERE uncracked = ? AND (quadgram_rating IS NULL OR quadgram_rating < ?)", [r.quadgram_rating, r.cracked, r.alphabet, cipher, r.quadgram_rating], function(err) {
				if (err) {
					console.error("DB err=", err);
				}
			});
		}
	});
});

