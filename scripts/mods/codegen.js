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
					source_polybius(inst->${d.prefix}_map, rand);
				}`);
		},
		random_walk: function(d) {
			d.lines.push(`
				permutation_walk(inst->${d.prefix}_map, rand, 25);
			`);
		},
		mask_name: function(d) {
			return 'RNDWALK_POLYBIUS'
		},
		reset: function(d) {
			d.lines.push(`memcpy(inst->${d.prefix}_map, rd->polybius, 25);`);
		},
		write: function(d) {
			d.lines.push(`
				for (int i = 0; i < cur_in_len; i++) {
					const char y = cur_in[i] >> 4;
					const char x = cur_in[i] & 0xf;
					cur_out[i] = inst->${d.prefix}_map[(y-1) * 5 + (x-1)];
				}
				cur_out_len = cur_in_len;
			`);
		},
		print: function(d) {
			d.lines.push(`
				for (int i = 0; i < 25; i++) {
					printf("%c", inst->${d.prefix}_map[i]);
				}
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
					source_coltransp(inst->${d.prefix}_map, ${kl}, rand);
				}`);
		},
		random_walk: function(d) {
			var kl = d.data.keyword.length;
			d.lines.push(`
				{
					permutation_walk(inst->${d.prefix}_map, rand, ${kl});
				}
			`);
		},
		mask_name: function(d) {
			return 'RNDWALK_TRANSPOSITION'
		},
		write: function(d) {
			var kl = d.data.keyword.length;
			d.lines.push(`
				for (int i = 0; i < cur_in_len; i++) {
					int col = i % ${kl};
					int row = i / ${kl};
					int c;
					if (${d.data.double?"1":"0"})
						c = inst->${d.prefix}_map[row] * ${kl} + inst->${d.prefix}_map[col];
					else
						c = row * ${kl} + inst->${d.prefix}_map[col];
					cur_out[i] = cur_in[c];
				}
				cur_out_len = cur_in_len;
			`);
		},
		print: function(d) {
			var kl = d.data.keyword.length;
			d.lines.push(`
				for (int i = 0; i < ${kl}; i++) {
					printf(" %d", inst->${d.prefix}_map[i]);
				}
			`);
		}
	}

	exports.transpose = {
		write: function(d) {
			var gw = d.process_d.grid.width;
			var height = Math.floor((d.process_d.input.length + d.process_d.grid.width - 1)/(d.process_d.grid.width));
			d.lines.push(`
				int tp_out = 0;
				for (int x=0;x<${gw};x++)
				{
					for (int y=0;y<${height};y++)
					{
						int idx = y * ${gw} + x;
						if (idx < cur_in_len)
							cur_out[tp_out++] = cur_in[idx];
						else
							cur_out[tp_out++] = -1;
					}
				}
			`);
		},
	}

	exports.pair_up = {
		write: function(d) {
			d.lines.push(`
				for (int i = 0, o=0; i < cur_in_len-1; i+=2) {
					cur_out[o++] = (cur_in[i] << 4) | cur_in[i+1];
				}
				cur_out_len = cur_in_len/2;
			`);
		}
	}


});