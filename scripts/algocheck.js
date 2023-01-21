define(function(require, exports, module) {
	var all_mods = require('./mods/all.js');

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
					on_result(d);
					return false;
				}
			}
			/*
			if (d.error) {
				console.log(d.error); 
			} 
			*/
			if (on_result) {
				on_result(d);
			}
			return !d.error;
		}

		var added = {};
		var total_count = 0;
		var uniq_count = 0;

		function eval_inserts(inserts, count)
		{
			var ckdefs = [];
			for (var x in begin) {
				ckdefs.push(mk_crack(begin[x]));
			}
			for (var i=0;i<count;i++) {
				ckdefs.push(mk_crack(inserts[i]));
			}
			for (var x in end) {
				ckdefs.push(mk_crack(end[x]));
			}
			var grouped = false;
			for (var i=0;i<ckdefs.length;i++) {
				if (ckdefs[i].type == "group_up") {
					if (!grouped)
						grouped = true;
					else
						ckdefs.splice(i--, 1);
				}
			}
			//console.log(ckdefs);
			run_cracks(ckdefs, function(d) {
				var prop = d[config.analyze_prop];
				if (typeof prop == 'number')
					prop = Math.floor(prop);

				if (((++total_count) % 1000) == 0) {
					console.log("Processed", total_count, "variants with", uniq_count, " unique outputs");
				}

				var txt = d.output.join('');
				if (txt.length > 30 && !added[d.output]) {
					//console.log(config.analyze_prop, "=", prop, );
					added[d.output] = true;
					uniq_count++;
					db.run("INSERT OR IGNORE INTO decrypt (uncracked, length, eval, steps) VALUES (?, ?, ?, ?)", [txt, txt.length, prop, JSON.stringify(ckdefs)]);
				}
			});	
		}

		function run_all(inserts, depth) {
			for (var i=0;i<config.cracks_insert.length;i++)
			{
				inserts[depth] = config.cracks_insert[i];
				eval_inserts(inserts, depth+1);
				if (depth < (config.max_depth-1)) {
					if (depth < 3) {
						(function(depth, str) {
							var ins = JSON.parse(str);
							setTimeout(function() {
								run_all(ins, depth+1);
							}, 30);
						})(depth, JSON.stringify(inserts));
					} else {
						run_all(inserts, depth+1);
					}
				}
			}
		}

		var inserts = [null, null, null, null, null, null, null];
		run_all(inserts, 0);
	}
})
