var sqlite3 = require('sqlite3');
var amd = require('./scripts/amd-loader.js');
var all_mods = require('./scripts/mods/all.js');
var explorer = require('./scripts/explorer.js');
var init = require('./scripts/init.js');

var args = process.argv.slice(2);
var clean_db = false;

for (var x in args) {
	if (args[x] == '--dry-run') {
		explorer.dry_run = true;
	}
	if (args[x] == '--clean') {
		clean_db = true;
	}	
}

init.get_db_and_conf(function(conf, db) {
	if (clean_db) {
		db.run("DELETE FROM decrypt");
	}
	console.log("Generating.... [" + conf.desc + "] into db [" + conf.database + "]");
	explorer.run_algocheck(db, conf);
});
