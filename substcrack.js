var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var all_mods = require('./scripts/mods/all.js');
var algocheck = require('./scripts/algocheck.js');
var child_process = require('child_process');
var async = require('async');

const db = new sqlite3.Database("texts.sqlite3", (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		function more() {
			db.all("SELECT uncracked, abs(eval-686) as ic_diff from decrypt WHERE cracked is NULL ORDER BY ic_diff ASC LIMIT 5", function(err, rows) {
				var buckets = [];
				for (var q=0;q<4;q++)
				buckets.push([]);				
				for (var i=0;i<rows.length;i++)
					buckets[i%buckets.length].push(rows[i]);
				// Parallel.
				async.each(buckets, function(task, cb) {
					console.log("Launching task with ", task.length, " entries...");
					let binpath = `c:\\users\\dan\\source\\repos\\yeffcrack\\release\\yeffcrack.exe`;
					let script = child_process.execFile(binpath, ["--stdin-analyze", "subst"], {}, function(err, out, stderr) {
						var results = JSON.parse(out);
						for (var cipher in results) {
							var r = results[cipher];
							if (r.quadgram_rating && r.cracked) {
								db.run("UPDATE decrypt SET quadgram_rating = ?, cracked = ? WHERE uncracked = ? AND (quadgram_rating IS NULL OR quadgram_rating < ?)", [r.quadgram_rating, r.cracked, cipher, r.quadgram_rating], function(err) {
									if (err) {
										console.error("DB err=", err);
									}
								});
							}
						}
						console.log("Processed", Object.keys(results).length, "items");
						cb();
					});
					var lines = [];
					for (var x in task)
					{
						lines.push(rows[x].uncracked);
					}
					script.stdin.write(lines.join("\n"));
					script.stdin.end();
				}, function() {
					console.log("Getting next batch.");
					more();
				});
			});
		}
		more();
	}
});




