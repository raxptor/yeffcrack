var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var util = require('./scripts/util.js');

const db = new sqlite3.Database("texts.sqlite3", (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		var stmt = db.prepare("INSERT OR IGNORE INTO normalized (txt) VALUES (?)");
		db.all("SELECT uncracked FROM decrypt ORDER BY uncracked LIMIT 10000", function(err, rows) {
			for (var x in rows) {
				stmt.run([util.normalize(rows[x].uncracked)]);
			}
			stmt.finalize();
		});	
		
	}
});


