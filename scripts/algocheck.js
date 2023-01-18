define(function(require, exports, module) {
	var all_mods = require('./mods/all.js');

	exports.run_algocheck = function(config) {
		console.log("Running algocheck", config);
		var begin = config.cracks_fixed_begin;
		var end = config.cracks_fixed_end;

		function mk_crack(def) {
			var ck = {
				type: def.type,
				cls: all_mods[def.type],
			};
			if (def.data === undefined) {
				ck.data = ck.cls.create();
			} else {
				ck.data = def.data;
			}
			return ck;
		}

		function run_cracks(cracks, on_result) {
			var d = { input: "" };
			for (var i=0;i<cracks.length;i++) {
				try {
					d.data = cracks[i].data;
					delete d.output;
					cracks[i].cls.process(d);
					if (d.error)
						console.log(d.error);
					d.input = d.output;
				} catch (e) {
					console.error(e);
					d.error = "Exception";
					on_result(d);
					return false;
				}
			}
			if (d.error) {
				console.log(d.error); 
			} 
			if (on_result) {
				on_result(d);
			}
			return !d.error;
		}

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
			//console.log(ckdefs);
			run_cracks(ckdefs, function(d) {
				var prop = d[config.analyze_prop];
				if (typeof prop == 'number')
					prop = Math.floor(prop);
				console.log(config.analyze_prop, "=", prop, d.output.join(''));
			});	
		}

		function run_all(inserts, depth) {
			for (var i=0;i<config.cracks_insert.length;i++)
			{
				inserts[depth] = config.cracks_insert[i];
				eval_inserts(inserts, depth+1);
				if (depth < (config.max_depth-1))
					run_all(inserts, depth+1);
			}
		}

		var inserts = [null, null, null, null, null, null, null];
		run_all(inserts, 0);
	}
})
