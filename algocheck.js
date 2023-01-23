var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var all_mods = require('./scripts/mods/all.js');

var algocheck = require('./scripts/algocheck.js');
var conf = require('./algoconf.json');

const db = new sqlite3.Database(conf.database, (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		algocheck.run_algocheck(db, conf);
	}
});




