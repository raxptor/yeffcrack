const { join } = require('path');
var config = require('../init.js').get_conf();

define(function (require, exports, module) {
	var all_mods = require('./all.js');
	var mega = require('./megapatterns.js');
	exports.transpose = {		
		automake: function (cracks, state, output) {
			output.push({
				type: "transpose",
				autogrid: true
			});
		},
	},
	exports.pair_sort = {
		automake: function (cracks, state, output) {
			if (state.group_width == 2) {
				var wrong = false;
				for (var i = 0; i < state.input.length && i < 30; i++) {
					var first = Math.floor(state.input[i] / 10) % 10;
					var second = state.input[i] % 10;
					if (first != 0 && first != 6 && first != 7 && first != 8 && first != 9) {
						wrong = true;
						break;
					}
					if (second != 1 && second != 2 && second != 3 && second != 4 && second != 5) {
						wrong = true;
						break;
					}
				}
				if (!wrong) {
					var variants = ["67890", "09876"];
					for (var v=0;v<variants.length;v++) {
						for (var j = 0; j < 2; j++) {
							for (var i = 0; i < 2; i++) {
								output.push({
									type: "pair_sort",
									data: {
										prefixes: variants[v],
										remove_prefix: true,
										bycols: (j == 0),
										by_rows: (i == 0)
									}
								});
							}
						}
					}
				}
			}
		},
		check: function (cracks, state) {
			return state.group_width == 2;
		}
	}
	exports.group_up = {
		automake: function (cracks, state, output) {
			if (state.group_width === undefined) {
				output.push({
					type: "group_up",
					data: {
						width: 2
					},
					auto: true
				});
			}
		},
		check: function (cracks, state) {
			return state.group_width == undefined;
		}
	}
	exports.null_mask = {
		automake: function (cracks, state, output, tags) {
			if (tags["nf"]) return;
			for (var i = 2; i < 16; i++) {
				var max = Math.pow(2, i);
				for (var j = 0; j < max; j++) {
					var mask = [];
					for (var k = 0; k < i; k++) {
						if ((j & (1 << k)) == 0)
							mask.push('1');
						else
							mask.push('0')
					}
					output.push({
						type: "null_mask",
						data: {
							inverted: false,
							mask: mask.join('')
						},
						unique: "nf"
					});
				}
			}
		}
	};
	exports.columnar_transposition = {
		automake: function (cracks, state, output) {
			for (var x in config.coltrans_keywords) {
				output.push({
					type: "coltransp",
					data: {
						keyword: config.coltrans_keywords[x]
					}
				});
			}
		},
	}
	exports.fix_length = {
		automake: function (cracks, state, output, tags, rel_depth) {
			if (rel_depth != 0) return;
			for (var x in config.fix_to_lengths) {
				var l = config.fix_to_lengths[x];
				// don't care about overlap, it will be purged as duplicate.
				for (var i = 0; i < state.input.length; i++) {
					output.push({
						type: "fix_length",
						data: {
							target_length: l,
							offset: i
						}
					});
				}
			}
		},
	}
	exports.meta_transposition = {
		automake: function (cracks, state, output) {
			if (state.group_width == 2) {
				output.push({
					type: "meta_transposition"
				});
			}
		},
		check: function (cracks, state) {
			return state.group_width == 2;
		}
	}

	function mega_patterns(which_config) {
		return {
			automake: function (cracks, state, output) {
				if (state.grid) {
					var results = mega.make_megapatterns(config[which_config], state.input.length, state.grid.width)
					console.log("Mega patterns made ", Object.keys(results).length, " entries");
					for (var x in results) {
						output.push({
							type: "permutation",
							data: {
								perm: results[x].perm.join(","),
								name: results[x].name
							},
						});
					}
				}
			}
		}
	};

	exports.mega_patterns = mega_patterns("mega_patterns");
	exports.mega_patterns_2 = mega_patterns("mega_patterns_2");

	exports.complete_spirals = {
		automake: function (cracks, state, output) {
			var spirals = ["SpiralTL", "SpiralTR", "SpiralBR", "SpiralBL"];
			var old = output.length;
			for (var i = 0; i < spirals.length; i++) {
				for (var m = 0; m < 4; m++) {
					output.push({
						type: "grid_pattern",
						data: {
							mode: spirals[i],
							inverse: (m % 2 == 0),
							reverse: (m >= 2),
						},
						unique: "spiral",
						autogrid: true,
					});
				}
			}
		},
	}
});