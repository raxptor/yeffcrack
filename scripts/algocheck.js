define(function(require, exports, module) {
	var all_mods = require('./mods/all.js');
	var autoconf = require('./mods/autoconf.js');
	var util = require('./util.js');

	exports.dry_run = false;

	exports.run_algocheck = function(db, config) {
		console.log("Running algocheck", config, " dry_run", this.dry_run);
		var begin = config.cracks_fixed_begin;
		var end = config.cracks_fixed_end;
		var dry_run = this.dry_run;

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
		
		var prep = db.prepare("INSERT OR IGNORE INTO decrypt (uncracked, meta_transposition_order, length, eval, penalty, steps) VALUES (?, ?, ?, ?, ?, ?)");

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
					on_result(d);
					/*setTimeout(function() {
						on_result(d);
					}, 100);*/
					pause = 0;
				}
			}
			return !d.error;
		}

		var added = {};
		var added_norm = {};
		var normalized = {};
		var total_count = 0;
		var bad_eval = 0;
		var uniq_count = 0;
		var junk_count = 0;
		var norm_dupes = 0;
		var culled = 0;		
		var db_ok=0, db_err = 0;
		var db_inserts = 0;

		function on_output(d, ckdefs) {
			var prop = d[config.analyze_prop];
			if (typeof prop == 'number')
				prop = Math.floor(prop);

			if (((++total_count) % 1000) == 0) {
				console.log(`Processed ${total_count} variants with ${uniq_count} unique outputs (${norm_dupes} norm dupes), ${bad_eval} bad ${config.analyze_prop}, ${junk_count} junk. Culled trees=${culled} => Inserts:${db_inserts} OK:${db_ok} Err:${db_err}`);
			}

			var txt = d.output.join('');
			var key;
			if (d.meta_transposition_order)
				key = txt + "/" + d.meta_transposition_order.join();
			else
				key = txt;
			
			if (txt.length > 30 && !added[key]) {
				console.log(txt, config.analyze_prop, "=", prop);
				added[key] = true;	

				var norm = util.normalize(txt);
				if (added_norm[norm]) {
					norm_dupes++;
				} else {
					added_norm[norm] = true;
				}

				uniq_count++;
				var penalty = util.compute_penalty(txt);
				if (penalty > 1000000) {
					junk_count++;
				}
				if (prop < config.eval_min || prop > config.eval_max) {
					bad_eval++;
				} else {
					db_inserts++;
					if (!dry_run) {
						var meta_transp_key = null;
						if (d.meta_transposition_order)
							meta_transp_key = d.meta_transposition_order.join(',');
						prep.run([txt, meta_transp_key, txt.length, prop, penalty, JSON.stringify(ckdefs)], function(err) {
							if (err) { console.error(err); db_err++; } else db_ok++;
							console.log("inserted");
						});
					}
				}
			}
		}

		var depth_end = begin.length + config.max_depth;
		var visit_cat = {};

		function run_all(inserts, tags, depth) {

			if (depth < begin.length) {
				inserts[depth] = mk_crack(begin[depth]);
				run_all(inserts, tags, depth + 1);
				return;
			}

			// Run the cracks up to this point.
			var ckdefs = [];
			var ckdefs_full = [];
			for (var i=0;i<depth;i++) {
				var c = mk_crack(inserts[i]);
				ckdefs.push(c);
				ckdefs_full.push(c);
			}
			for (var i=0;i<end.length;i++) {
				ckdefs_full.push(mk_crack(end[i]));
			}			

			//console.log("eval base", ckdefs);
			run_cracks(ckdefs, function(d) {

				if (d.input.length < 10)
					return;

				var grid_width = (d.grid !== undefined) ? d.grid.width : 0;
				var group_width = d.group_width || 0;
				var category_index = 1024 * d.input.length + 128 * grid_width + group_width;
				if (visit_cat[category_index] === undefined) {
					visit_cat[category_index] = {
					};
				}
				var cat = visit_cat[category_index];
				var key = d.input.join('');
				if (d.meta_transposition_order)
					key += + "/" + d.meta_transposition_order.join(',');

				if (cat[key] === undefined) {
					cat[key] = depth;
				} else if (depth < cat[key]) {
					cat[key] = depth;
					// console.log("cat[", category_index ,"] Already visited at depth ", cat[key]," now at", depth, " updating...");
				} else {
					// console.log("cat[", category_index ,"] Already visited at depth ", cat[key]," now at", depth, " culling...");
					culled++;
					return;
				}

				// now run it for real.
				run_cracks(ckdefs_full, function(d) {
					on_output(d, ckdefs_full);
				});
				
				// no more.
				if (depth == (depth_end+1))
					return;

				var to_consider = [];
				for (var i=0;i<config.autocracks.length;i++)
				{
					var ck = config.autocracks[i];
					if (!autoconf[ck] || !autoconf[ck].automake) {
						console.log(ck, " has no automake");
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
						continue;
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
