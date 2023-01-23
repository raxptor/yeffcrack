var async = require('async');
var child_process = require('child_process');

exports.num_buckets = 3;
exports.bucket_size = 6;

exports.crack_it = function(db, select, method, process) {
	function more() {
		var num_buckets = exports.num_buckets;
		var num_each = exports.bucket_size;
		var sql2 = select + " LIMIT " + (num_buckets*num_each);
		db.all(sql2, function(err, rows) {
			if (err) {
				console.log(sql2, err);
				return;
			}
			if (rows.length == 0) {
				console.log("All done!");
				return;
			}
			var buckets = [];
			for (var q=0;q<num_buckets;q++)
			buckets.push([]);				
			for (var i=0;i<rows.length;i++)
				buckets[i%buckets.length].push(rows[i]);
			// Parallel.
			async.each(buckets, function(task, cb) {
				console.log("Launching task with ", task.length, " entries for method ", method);
				let binpath = `c:\\users\\dan\\source\\repos\\yeffcrack\\release\\yeffcrack.exe`;
				let script = child_process.execFile(binpath, ["--stdin-analyze", method], {}, function(err, out, stderr) {
					var results = JSON.parse(out);
					for (var cipher in results) {
						var r = results[cipher];
						process(cipher, r);
					}
					console.log("Processed", Object.keys(results).length, "items");
					cb();
				});
				var lines = [];
				for (var x in task)
				{
					lines.push(task[x].uncracked);
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