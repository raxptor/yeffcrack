var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var all_mods = require('./scripts/mods/all.js');

var algocheck = require('./scripts/algocheck.js');
var conf = require('./algoconf.json');

var args = process.argv.slice(2);
for (var x in args) {
	if (args[x] == '--dry-run') {
		algocheck.dry_run = true;
	}
}

const db = new sqlite3.Database(conf.database, (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		db.run("pragma synchronous=0");
		algocheck.run_algocheck(db, conf);
	}
});


