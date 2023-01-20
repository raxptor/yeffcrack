var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var all_mods = require('./scripts/mods/all.js');

var algocheck = require('./scripts/algocheck.js');

const db = new sqlite3.Database("texts.sqlite3", (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		algocheck.run_algocheck(db, require('./algoconf.json'));
	}
});




