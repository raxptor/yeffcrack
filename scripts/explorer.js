define(function(require, exports, module) {
	var all_mods = require('./mods/all.js');
	var autoconf = require('./mods/autoconf.js');
	var util = require('./util.js');

	exports.dry_run = false;

	exports.run_algocheck = function(db, config) {
		console.log("Running algocheck", config, " dry_run", this.dry_run);
		var begin = config.cracks_fixed_begin.slice(0);
		var end = config.cracks_fixed_end.slice(0);
		var dry_run = this.dry_run;

		function mk_crack(def) {
			var ck = {
				type: def.type,
				cls: all_mods[def.type],
				autogrid: def.autogrid
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
		var prep = db.prepare("INSERT OR IGNORE INTO decrypt (uncracked, meta_transposition_order, length, complexity, eval, penalty, bigrams, steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
		function run_cracks(cracks, on_result) {
			var d = { input: "" };
			for (var i=0;i<cracks.length;i++) {
				try {
					d.data = cracks[i].data;
					delete d.output;
					if (cracks[i].set_grid) {
						d.grid = { width: cracks[i].set_grid };
					}
					cracks[i].cls.process(d);
					if (d.error) {
						console.error(d.error);
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
				on_result(d);
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
		var rule_skips = 0;
		var allowed_grids = { };

		function get_allowed_grids(width) {
			if (config.allowed_grids) {
				return config.allowed_grids;
			}
			if (allowed_grids[width] !== undefined)
				return allowed_grids[width];
			var tmp = [];
			for (var i=2;i<width;i++) {
				if ((width % i) == 0)
					tmp.push(i);
			}
			allowed_grids[width] = tmp;
			return tmp;			
		}

		function stats() {
			console.log(`Processed ${total_count} variants with ${uniq_count} unique outputs (${norm_dupes} norm dupes), ${bad_eval} bad ${config.analyze_prop}, ${junk_count} junk. Rule skips ${rule_skips}. Culled trees=${culled} => Inserts:${db_inserts} OK:${db_ok} Err:${db_err}`);
		}

		function on_output(d, ckdefs) {

			if (((++total_count) % 1000) == 0) {
				stats();
			}

			var have = false;
			if (config.require_in_output) {
				for (var i=0;i<ckdefs.length;i++) {
					if (ckdefs[i].type == config.require_in_output) {
						have = true;
						break;
					}
				}
				if (!have) {
					rule_skips++;
					return;
				}
			}			

			var prop = d[config.analyze_prop];
			if (typeof prop == 'number')
				prop = Math.floor(prop);
		
			if (config.coltransp_only && !d.meta_transposition_order) {
				rule_skips++;
				return;
			}

			var txt = all_mods.output_to_string(d.output);

			if (config.require_lengths.length > 0 && config.require_lengths.indexOf(txt.length) == -1) {
				rule_skips++;
				return;
			}

			var key;
			if (d.meta_transposition_order)
				key = txt + "/" + d.meta_transposition_order.join();
			else
				key = txt;
				
			
			if (txt.length > 20 && !added[key]) {
				//console.log(txt, config.analyze_prop, "=", prop);
				added[key] = true;	

				var norm = util.normalize(txt);
				if (added_norm[norm]) {
					norm_dupes++;
				} else {
					added_norm[norm] = true;
				}

				uniq_count++;
				var bigrams = util.compute_repeated_bigrams(txt);
				var penalty = util.compute_penalty(txt);
				if (penalty > config.penalty_max) {
					junk_count++;
				} else if (prop < config.eval_min || prop > config.eval_max) {
					bad_eval++;
				} else {
					db_inserts++;
					if (!dry_run) {
						var meta_transp_key = null;
						if (d.meta_transposition_order) {
							var tokens = new Array(2 * d.meta_transposition_order.length);
							var p = 0;
							let encode = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
							for (var t in d.meta_transposition_order) {
								var o = d.meta_transposition_order[t];
								tokens[p++] = encode.charAt(Math.floor(o / 25));
								tokens[p++] = encode.charAt(o % 25);
							}
							meta_transp_key = tokens.join('');
						}
						var steps = [];
						for (var x=0;x<ckdefs.length;x++) {
							if (ckdefs[x].set_grid !== undefined) {
								steps.push({
									type: "make_grid",
									data: {
										"width": ckdefs[x].set_grid
									}
								})
							}
							steps.push({
								type: ckdefs[x].type,
								data: ckdefs[x].data
							});
						}
						prep.run([txt, meta_transp_key, txt.length, ckdefs.length - begin.length - end.length, prop, penalty, bigrams, JSON.stringify(steps)], function(err) {
							if (err) { console.error(err); db_err++; } else db_ok++;
						});
					}
				}
			}
		}

		var depth_end = begin.length + config.max_depth;
		var visit_cat = {};
		
		function run_all(inserts, tags, depth) {

			if (depth < begin.length) {
				inserts[depth] = begin[depth];
				run_all(inserts, tags, depth + 1);
				return;
			}

			// Run the cracks up to this point.
			var ckdefs = inserts.slice(0, depth);
			var ckdefs_full = ckdefs.concat(end);
			var local_depth = depth - begin.length;

			//console.log("eval base", ckdefs);
			//console.log("Running partial cracks", ckdefs, " depth", depth);
			run_cracks(ckdefs, function(d) {

				if (d.input.length < 10) {
					//console.log("too short");
					return;
				}

				var grid_width = (d.grid !== undefined) ? d.grid.width : 0;
				var group_width = d.group_width || 0;
				var category_index = 1024 * d.input.length + 128 * grid_width + group_width;
				if (visit_cat[category_index] === undefined) {
					visit_cat[category_index] = {
					};
				}
				var cat = visit_cat[category_index];
				var key = all_mods.output_to_string(d.input);
				if (d.meta_transposition_order)
					key += + "/" + d.meta_transposition_order.join(',');

				if (cat[key] === undefined) {
					cat[key] = depth;
				} else if (depth < cat[key]) {
					cat[key] = depth;
				} else {
					//console.log("cat[", category_index ,"] Already visited at depth ", cat[key]," now at", depth, " culling...");
					culled++;
					return;
				}

				// now run it for real.
				run_cracks(ckdefs_full, function(d) {
					on_output(d, ckdefs_full);
				});
				
				// no more.
				if (depth == depth_end) {
					return;
				}

				var allowed_grids = get_allowed_grids(d.input.length);

				var to_consider = [];
				for (var i=0;i<config.autocracks.length;i++)
				{
					var ck = config.autocracks[i];
					if (!autoconf[ck] || !autoconf[ck].automake) {
						console.log(ck, " has no automake");
						continue;
					}
					// Automakes aren't checked.
					var l0 = to_consider.length;
					autoconf[ck].automake(ckdefs, d, to_consider, tags, local_depth);
				}

				for (var i=0;i<config.cracks_insert.length;i++)
				{
					var auto = autoconf[config.cracks_insert[i].type];
					if (auto) {
						// Checks are for manual entries.
						if (auto.check && !auto.check(ckdefs, d)) {
							//console.log("Skipping ", config.cracks_insert[i], " because check.");
							continue;
						}
					}
					to_consider.push(config.cracks_insert[i]);
				}

				var p = ckdefs.length;
				ckdefs.push(null);
				for (var i=0;i<to_consider.length;i++) {
					inserts[depth] = mk_crack(to_consider[i]);
					var t = to_consider[i].unique;
					if (t && tags[t]) {
						continue;
					}
					if (t) tags[t] = true;

					if (inserts[depth].autogrid) {
						for (var g=0;g<allowed_grids.length;g++) {
							inserts[depth].set_grid = allowed_grids[g];
							run_all(inserts, tags, depth + 1);
						}
					} else {
						run_all(inserts, tags, depth + 1);
					}
					if (t) tags[t] = false;
				}
			});
		}

		for (var x in begin) {
			begin[x] = mk_crack(begin[x]);
		}
		for (var x in end) {
			end[x] = mk_crack(end[x]);
		}

		var inserts = new Array(32);
		run_all(inserts, {}, 0);
		stats();
		console.log("Done!");
	}
})
