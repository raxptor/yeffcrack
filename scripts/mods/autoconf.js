define(function(require, exports, module) {
	var all_mods = require('./all.js');
	exports.make_grid = {
        automake: function(cracks, state, output) {
            var len = state.input.length;            
            for (var i=2;i<100;i++) {
                if (len%i == 0) {
                    output.push({
                        type: "make_grid",
                        data: {
                            width: i
                        }
                    });
                }
            }
        },
        check: function(cracks, state) {
            if (cracks[cracks.length-1].type == "make_grid") {
                return false;
            }
            return true;
        }
    };
    function is_full_grid(d) {
        if (d.grid === undefined) return false;
        var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
        return height * d.grid.width == d.input.length;
    }
    exports.grid_pattern = {
        check: function(cracks, state) {
            //console.log("is full grid ?", is_full_grid(state));
            return is_full_grid(state);
        }
    }
    exports.transpose = {
        automake: function(cracks, state, output) {
            if (is_full_grid(state) && cracks[cracks.length-1].type != "transpose") {
                output.push({
                    type: "transpose",
                });
            }
        },
        check: function(cracks, state) {
            return is_full_grid(state) && cracks[cracks.length-1].type != "transpose";
        }
    },
    exports.pair_sort = {
        automake: function(cracks, state, output) {
            if (state.group_width == 2) {
                var wrong = false;
                for (var i=0;i<state.input.length;i++) {
                    if ((state.input[i] % 100) < 60) {
                        wrong = true;
                        break;
                    }
                }
                if (!wrong) {
                    output.push({
                        type: "pair_sort",
                        data: {
                            prefixes: "67890",
                            bycols: false
                        }
                    });
                    output.push({
                        type: "pair_sort",
                        data: {
                            "prefixes": "67890",
                            bycols: false
                        }
                    });
                    output.push({
                        type: "pair_sort",
                        data: {
                            "prefixes": "09876",
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
                    }
                });
            }
        },
        check: function(cracks, state) {
            return state.group_width === undefined;
        }
    }    
});