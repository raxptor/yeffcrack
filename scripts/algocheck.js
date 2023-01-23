define(function(require, exports, module) {
	var all_mods = require('./mods/all.js');
	var autoconf = require('./mods/autoconf.js');

	exports.run_algocheck = function(db, config) {
		console.log("Running algocheck", config);
		var begin = config.cracks_fixed_begin;
		var end = config.cracks_fixed_end;

		function mk_crack(def) {
			var ck = {
				type: def.type,
				cls: all_mods[def.type],
			};
			if (def.data === undefined) {
				if (!ck.cls) console.error("No definition for", ck.type);
				ck.data = ck.cls.create();
			} else {
				ck.data = def.data;
			}
			return ck;
		}

		var errors = 0;
		var pause = 0;

		function run_cracks(cracks, on_result) {
			var d = { input: "" };
			for (var i=0;i<cracks.length;i++) {
				try {
					d.data = cracks[i].data;
					delete d.output;
					cracks[i].cls.process(d);
					if (d.error) {
						//console.log(d.error);
						errors++;
					}
					d.input = d.output;
				} catch (e) {
					console.error(e);
					d.error = "Exception";
					throw e;
					return false;
				}
			}
			if (on_result) {
				if (++pause < 5000) {
					on_result(d);
				} else {
					console.log("Pause...");
					setTimeout(function() {
						on_result(d);
					}, 100);
					pause = 0;
				}
			}
			return !d.error;
		}

		var added = {};
		var total_count = 0;
		var uniq_count = 0;

		function on_output(d, ckdefs) {
			var prop = d[config.analyze_prop];
			if (typeof prop == 'number')
				prop = Math.floor(prop);

			if (((++total_count) % 1000) == 0) {
				console.log("Processed", total_count, "variants with", uniq_count, " unique outputs");
			}

			var txt = d.output.join('');
			if (txt.length > 30 && !added[d.output]) {
				//console.log(txt, config.analyze_prop, "=", prop, ckdefs);
				added[d.output] = true;
				uniq_count++;
				db.run("INSERT OR IGNORE INTO decrypt (uncracked, length, eval, steps) VALUES (?, ?, ?, ?)", [txt, txt.length, prop, JSON.stringify(ckdefs)]);
			}
		}

		var depth_end = begin.length + config.max_depth;

		function run_all(inserts, tags, depth) {

			if (depth < begin.length) {
				inserts[depth] = mk_crack(begin[depth]);
				run_all(inserts, tags, depth + 1);
				return;
			} 
			// Run the cracks up to this point.
			var ckdefs = [];
			for (var i=0;i<depth;i++) {
				ckdefs.push(mk_crack(inserts[i]));
			}

			if (depth == (depth_end+1)) {
				for (var i=0;i<end.length;i++) {
					ckdefs.push(mk_crack(end[i]));				
				}
				// console.log("Running cracks with end", ckdefs);
				run_cracks(ckdefs, function(d) {
					on_output(d, ckdefs)
				});
				return;
			}

			//console.log("eval base", ckdefs);
			run_cracks(ckdefs, function(d) {

				if (d.input.length < 10)
					return;

				var to_consider = [];
				for (var i=0;i<config.autocracks.length;i++)
				{
					var ck = config.autocracks[i];
					if (!autoconf[ck] || !autoconf[ck].automake) {
						continue;
					}
					if (autoconf[ck].check && !autoconf[ck].check(ckdefs, d)) {
						continue;
					}
					var l0 = to_consider.length;
					autoconf[ck].automake(ckdefs, d, to_consider);
				}

				for (var i=0;i<config.cracks_insert.length;i++)
				{
					var t = config.cracks_insert[i].unique;
					if (t && tags[t]) {
						// console.log("Skipping because tag", t);
						continue;
					}
					var auto = autoconf[config.cracks_insert[i].type];
					if (auto) {
						if (auto.check && !auto.check(ckdefs, d)) {
							// console.log("Skipping ", config.cracks_insert[i], " because check.");
							continue;
						}
					}
					to_consider.push(config.cracks_insert[i]);
				}

				//console.log("To consider", to_consider);
				var p = ckdefs.length;
				ckdefs.push(null);				
				for (var i=0;i<to_consider.length;i++) {
					inserts[depth] = to_consider[i];	
					ckdefs[p] = mk_crack(to_consider[i]);
					var t = to_consider[i].unique;
					if (t && tags[t]) {
						throw new "Tag " + t + " already set.";
					}
					if (t) tags[t] = true;
					run_all(inserts, tags, depth + 1);
					if (t) tags[t] = false;					
				}
			});
		}

		var inserts = new Array(32);
		run_all(inserts, {}, 0);
	}
})
