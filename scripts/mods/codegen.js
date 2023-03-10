define(function(require, exports, module) {
	var all_mods = require('scripts/mods/all.js');
	exports.polybius = {
		struct: function(d) {
			d.lines.push(`\tchar ${d.prefix}_map[25];`);
		},
		initial_guess: function(d) {
			subst = all_mods.polybius.make_polyb_subst(d);
			d.lines.push(`
				const char* def = "${subst.join('')}";
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
					cur_out[i] = inst->${d.prefix}_map[((5+y-1)%5) * 5 + ((5+x-1)%5)];
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
				{ 
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
				}
			`);
		},
	};

	exports.grid_pattern = {
		write: function(d) {
			var len = d.process_d.input.length;
			var perm = all_mods.grid_pattern.make_pattern_perm(d.process_d);
			if (d.data.inverse) {
				var output = new Array(d.input);
				for (var i=0;i<len;i++) {
					var s = perm[i];
					if (s < len)
						d.lines.push(`cur_out[${s}] = cur_in[${i}];`);
					else
						d.lines.push(`cur_out[${s}] = 0;`);
				}
			} else {
				// regular
				for (var i=0;i<len;i++) {
					var s = perm[i];
					if (s < len)
						d.lines.push(`cur_out[${i}] = cur_in[${s}];`);
					else
						d.lines.push(`cur_out[${i}] = 0;`);
				}
				d.lines.push(`cur_out_len = ${perm.length};`);
			}
		}
	}

	exports.group_up = {
		write: function(d) {
			d.lines.push(`
				for (int i = 0, o=0; i < cur_in_len-1; i+=2) {
					cur_out[o++] = (cur_in[i] << 4) | cur_in[i+1];
				}
				cur_out_len = cur_in_len/2;
			`);
		}
	}

	exports.bifid = {
		struct: function(d) {
		},
		initial_guess: function(d) {
		},
		random_walk: function(d) {
		},
		mask_name: function(d) {
			return '0';
		},
		write: function(d) {
			d.lines.push(`
				int half = cur_in_len/2;
				for (int i = 0; i < half; i++) {
					cur_out[2*i] = cur_in[i];
					cur_out[2*i+1] = cur_in[i+half];
				}
				cur_out_len = cur_in_len;
			`);
		},
		print: function(d) {
		}
	}		

	exports.rowflip = {
		struct: function(d) {
			d.lines.push(`\tunsigned int ${d.prefix}_mask;`);
		},
		initial_guess: function(d) {
			var given = 0;
			for (var x=0;x<d.data.mask.length;x++) {
				if (d.data.mask.charAt(x) == '1')
					given += (1 <<x);
			}
			d.lines.push(`inst->${d.prefix}_mask = genRandLong(rand) & 0xffff;
			if (as_given) {
				inst->${d.prefix}_mask = ${given};
			}
			`);
			
		},
		random_walk: function(d) {
			d.lines.push(`inst->${d.prefix}_mask ^= 1 << (genRandLong(rand) & 0x1f);`);
		},
		mask_name: function(d) {
			return 'RNDWALK_ROWFLIP'
		},
		write: function(d) {
			var kl = d.process_d.grid.width;
			d.lines.push(`
				for (int i = 0; i < cur_in_len; i++) {
					int col = i % ${kl};
					int row = i / ${kl};
					int flip = inst->${d.prefix}_mask & (1 << row);
					int c;
					if (flip)
						c = row * ${kl} + ${kl-1} - col;
					else
						c = row * ${kl} + col;
					cur_out[i] = cur_in[c];
				}
				cur_out_len = cur_in_len;
			`);
		},
		print: function(d) {
			d.lines.push(`
				printf(" %d", inst->${d.prefix}_mask);
			`);
		}
	}	


});