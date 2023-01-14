define(function(require, exports, module) {
	var all_mods = require('scripts/mods/all.js');
	exports.polybius = {
		struct: function(d) {
			d.lines.push(`\tchar ${d.prefix}_map[25];`);
		},
		initial_guess: function(d) {
			d.lines.push(`
				const char* def = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
				for (int i = 0; i < 25; i++) {
					inst->${d.prefix}_map[i] = def[i];
				}
				if (!as_given) {
					for (int i = 0; i < 24; i++) {
						int swap = (genRandLong(rand) & 0xff) % (25-i) + i;
						char t = inst->${d.prefix}_map[i];
						inst->${d.prefix}_map[i] = inst->${d.prefix}_map[swap];
						inst->${d.prefix}_map[swap] = t;
					}
				}`);
		},
		random_walk: function(d) {
			d.lines.push(`
				{
					int a, b;
					do {
					a = genRandLong(rand) & 31;
					b = genRandLong(rand) & 31;
					} while (a == b || a >= 25 || b >= 25);
					char t = inst->${d.prefix}_map[a];
					inst->${d.prefix}_map[a] = inst->${d.prefix}_map[b];
					inst->${d.prefix}_map[b] = t;
				}
			`);
		},		
		write: function(d) {
			d.lines.push(`
				for (int i = 0; i < cur_in_len; i++) {
					const char y = cur_in[i] >> 4;
					const char x = cur_in[i] & 0xf;
					cur_out[i] = inst->${d.prefix}_map[(y-1) * 5 + (x-1)];
				}
				cur_out_len = input_len;
			`);
		}
	};
	exports.coltransp = {
		struct: function(d) {
			var kl = d.data.keyword.length;
			d.lines.push(`\tchar ${d.prefix}_map[${kl}];`);
		},
		initial_guess: function(d) {
			var kl = d.data.keyword.length;
			var order = all_mods.coltransp.make_order(d);
			for (var i=0;i<order.length;i++) {
				d.lines.push(`inst->${d.prefix}_map[${i}] = ${order[i].index};`);
			}
			d.lines.push(`
				if (!as_given) {
					for (int i = 0; i < ${kl}; i++) {
						int swap = (genRandLong(rand) & 0xff) % (${kl}-i) + i;
						char t = inst->${d.prefix}_map[i];
						inst->${d.prefix}_map[i] = inst->${d.prefix}_map[swap];
						inst->${d.prefix}_map[swap] = t;
					}
				}`);
		},
		random_walk: function(d) {
			var kl = d.data.keyword.length;
			d.lines.push(`
				{
					int a, b;
					do {
					a = genRandLong(rand) & 63;
					b = genRandLong(rand) & 63;
					} while (a == b || a >= ${kl} || b >= ${kl});
					char t = inst->${d.prefix}_map[a];
					inst->${d.prefix}_map[a] = inst->${d.prefix}_map[b];
					inst->${d.prefix}_map[b] = t;
				}
			`);
		},		
		write: function(d) {
			var kl = d.data.keyword.length;
			d.lines.push(`
				for (int i = 0; i < cur_in_len; i++) {
					int col = i % ${kl};
					int row = i / ${kl};
					int c = row * ${kl} + inst->${d.prefix}_map[col];
					cur_out[i] = cur_in[c];
				}
				cur_out_len = input_len;
			`);
		}
	}

	exports.pair_up = {
		write: function(d) {
			var kl = d.data.keyword.length;
			d.lines.push(`
				for (int i = 0; i < cur_in_len-1; i+=2) {
					cur_out[i] = (cur_in[c] << 4) | cur_in[c+1];
				}
				cur_out_len = input_len;
			`);
		}
	}


});