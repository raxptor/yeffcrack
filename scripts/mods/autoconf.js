var config = require('../../algoconf.json');

define(function(require, exports, module) {
    var all_mods = require('./all.js');
    exports.transpose = {
        automake: function(cracks, state, output) {
		output.push({
			type: "transpose",
			autogrid: true
		});
        },
    },
    exports.pair_sort = {
        automake: function(cracks, state, output) {
            if (state.group_width == 2) {
                var wrong = false;
                for (var i=0;i<state.input.length && i < 30;i++) {
                    var first = Math.floor(state.input[i]/10) % 10;
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
                    output.push({
                        type: "pair_sort",
                        data: {
                            prefixes: "67890",
                            remove_prefix: true,
                            bycols: false
                        }
                    });
                    output.push({
                        type: "pair_sort",
                        data: {
                            "prefixes": "67890",
                            remove_prefix: true,
                            bycols: false
                        }
                    });
                    output.push({
                        type: "pair_sort",
                        data: {
                            "prefixes": "09876",
                            remove_prefix: true,
                            bycols: false
                        }
                    });
                }
            }
        },
        check: function(cracks, state) {
            return state.group_width == 2;
        }
    }      
    exports.group_up = {
        automake: function(cracks, state, output) {
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
        check: function(cracks, state) {
            return state.group_width == undefined;
        }
    }
    exports.columnar_transposition = {
        automake: function(cracks, state, output) {
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
    exports.meta_transposition = {
        automake: function(cracks, state, output) {
            if (state.group_width == 2) {
                output.push({
                    type: "meta_transposition"
                });
            }
        },
        check: function(cracks, state) {
            return state.group_width == 2;
        }
    }
    exports.complete_spirals = {
	automake: function(cracks, state, output) {
		var spirals = ["SpiralTL", "SpiralTR", "SpiralBR", "SpiralBL"];
		var old = output.length;
		for (var i=0;i<spirals.length;i++) {
			for (var m=0;m<4;m++) {
			output.push({
				type: "grid_pattern",
				data: {
					mode: spirals[i],
					inverse: (m%2 == 0),
					reverse: (m >=2),
				},
				unique: "spiral",
				autogrid: true
			});
			}
		}
	},
    }
});