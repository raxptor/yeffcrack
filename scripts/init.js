const { env } = require('process');
var sqlite3 = require('sqlite3');

var fs = require('fs');

exports.get_conf = function() {
	var cfgpath = env["YEFF_CFG"] || "config.json";
	console.log("Loading configuration from path", cfgpath);
	try {
		var text = fs.readFileSync(cfgpath);
		return JSON.parse(text);
	} catch (e) {
		console.error("Error loading configuration.");
		console.error(e);
	}
}

exports.get_db_and_conf = function(andthen) {	
	var conf = exports.get_conf();
	const db = new sqlite3.Database(conf.database, (err) => {
		if (err) {
			console.error(err);
		} else {
			db.run("pragma synchronous=0");
			var async = require('async');
			var schema = fs.readFileSync("./decrypt.sql", "utf-8");
			async.forEachSeries(schema.split(";"), function(stmt, next) {
				if (stmt.trim().length > 0) {
					db.run(stmt, function(err) {
						if (err)
							console.error(err);
						else {
							next();
						}
					});
				} else {
					next();
				}
			}, function() {
				andthen(conf, db);
			});
		}
	});
}
