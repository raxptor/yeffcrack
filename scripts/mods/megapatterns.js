define(function(require, exports, module) {

	function make_chinese_vert(d) {
		var down = true;
		var out = [];
		for (var x=0;x<d.width;x++) {
			var column = [];
			for (var y=0;y<d.height;y++) {
				column.push(y*d.width+x);
			}
			out = down ? out.concat(column) : out.concat(column.reverse());
			down = !down;
		}
		return out;
	}

	function make_chinese_horiz(d) {
		var right = true;
		var out = [];
		for (var y=0;y<d.height;y++) {
			var row = [];
			for (var x=0;x<d.width;x++) {
				row.push(y*d.width+x);
			}
			out = right ? out.concat(row) : out.concat(row.reverse());
			right = !right;
		}
		return out;
	}

	function make_chinese_vert_all(d, fn) {
		var down = true;		
		var count = 1;
		for (var i=0;i<d.width;i++)
			count *= 2;

		for (var i=0;i<count;i++) {
			var m = i;
			var out = [];
			for (var x=0;x<d.width;x++) {
				var column = [];
				for (var y=0;y<d.height;y++) {
					column.push(y*d.width+x);
				}
				var which = ((m&1) == 1);
				out = which ? out.concat(column) : out.concat(column.reverse());
				m = m >>> 1;
			}
			fn(out, "chinese_vert_" + i);
		}		
		return out;
	}

	function make_chinese_horiz_all(d, fn) {
		var down = true;		
		var count = 1;
		for (var i=0;i<d.height;i++)
			count *= 2;
		for (var i=0;i<count;i++) {
			var m = i;
			var out = [];
			for (var y=0;y<d.height;y++) {
				var row = [];
				for (var x=0;x<d.width;x++) {				
					row.push(y*d.width+x);
				}
				var which = ((m&1) == 1);
				out = which ? out.concat(row) : out.concat(row.reverse());
				m = m >>> 1;
			}
			fn(out, "chinese_horiz_" + i);
		}		
		return out;
	}	

	function xy(d, i) {
		return {
			x: i % d.width,
			y: Math.floor(i / d.width)
		}
	}

	function idx(d, x, y) {
		return y * d.width + x;
	}

	function fgrid(d, f) {
		for (var y=0;y<d.height;y++) {
			for (var x=0;x<d.width;x++) {
				f(x,y);
			}
		}	
	}

	function vert_mirror(d, perm) {
		return perm.map(i => {
			var c = xy(d, i);
			return idx(d, c.x, d.height - c.y - 1);
		});
	}

	function horiz_mirror(d, perm) {
		return perm.map(i => {
			var c = xy(d, i);
			return idx(d, d.width - c.x - 1, c.y);
		});
	}

	function inverse(perm) {
		var n = new Array(perm.length);
		for (var i=0;i<perm.length;i++)
			n[perm[i]] = i;
		return n;
	}

	function make_key(perm) {
		return JSON.stringify(perm);
	}

	function insert_if_unique(d, coll, perm, name) {
		var k = make_key(perm);
		if (coll[k] === undefined) {
			coll[k] = {
				perm: perm,
				name: name
			};
			return true;
		}
		return false;
	}	

	function make_variations(d, from, out) {
		var added = false;
		for (var key in from) {
			out[key] = from[key];
		}
		for (var key in from) {
			var perm = from[key].perm;
			var name = from[key].name;
			if (!d.config.reduced_variants) {
				added |= insert_if_unique(d, out, horiz_mirror(d, perm), name + ".horiz");
				added |= insert_if_unique(d, out, vert_mirror(d, perm), name + ".vert");
				added |= insert_if_unique(d, out, perm.slice(0).reverse(), name + ".reverse");
				added |= insert_if_unique(d, out, inverse(perm), name + ".inverse");
			}
		}
		return added;
	}

	exports.make_megapatterns = function(config, length, width) {

		var height = Math.floor(length / width);
		if (length != height * width) {
			console.error("Megapatterns don't support incomplete rectangles.");
			return {};
		}

		var d = {
			width: width,
			height: height,
			length: length,
			config: config
		};		

		if (config.split == "tb") {
			var split = Math.floor(height / 2);
			if (split*2 != height) {
				console.error("Height is not divisible by 2! ", split*2, height);
				return {};
			}
			delete config.split;
			var subpatterns = exports.make_megapatterns(config, length/2, width);
			config.split = "tb";
			if (!config.split_product) {
				console.log("Re-merging patterns top/bottom with same above as below");
				for (var k in subpatterns) {
					var perm = subpatterns[k].perm;
					var nperm = [];
					for (var i=0;i<perm.length;i++) {
						var c = xy(d, perm[i]);
						nperm.push(idx(d, c.x, c.y));
						nperm.push(idx(d, c.x, c.y + split));
					}
					subpatterns[k].perm = nperm;
				}
			} else {
				console.log("Re-merging patterns top/bottom with all combinations above vs below");
				var out = {};
				for (var k in subpatterns) {
					var perm0 = subpatterns[k].perm;
					for (var l in subpatterns) {
						var perm1 = subpatterns[l].perm;
						var nperm = [];
						if (perm0.length != perm1.length) {
							console.error("Perm0 and Perm1 are different length");
							return {};
						}
						for (var i=0;i<perm0.length;i++) {
							var c0 = xy(d, perm0[i]);
							var c1 = xy(d, perm1[i]);
							nperm.push(idx(d, c0.x, c0.y));
							nperm.push(idx(d, c1.x, c1.y + split));
						}
						insert_if_unique(d, out, nperm, subpatterns[k].name + "/" + subpatterns[l].name);
					}
				}
				subpatterns = out;
			}
			console.log("Split patterns made", Object.keys(subpatterns).length, "entries");
			return subpatterns;
		}
		if (config.split == "lr") {
			var split = Math.floor(width / 2);
			if (split*2 != width) {
				console.error("Width is not divisible by 2! ", split*2, width);
				return {};
			}
			delete config.split;
			var subpatterns = exports.make_megapatterns(config, length/2, split);
			config.split = "lr";
			var dhalf = {
				width: split
			};			
			if (!config.split_product) {
				console.log("Re-merging patterns left/right with same above as below");
				for (var k in subpatterns) {
					var perm = subpatterns[k].perm;
					var nperm = [];
					for (var i=0;i<perm.length;i++) {
						var c = xy(dhalf, perm[i]);
						nperm.push(idx(d, c.x, c.y));
						nperm.push(idx(d, c.x + split, c.y));
					}
					subpatterns[k].perm = nperm;
				}
			} else {
				console.log("Re-merging patterns left/right with all combinations above vs below");
				var out = {};
				for (var k in subpatterns) {
					var perm0 = subpatterns[k].perm;
					for (var l in subpatterns) {
						var perm1 = subpatterns[l].perm;
						var nperm = [];
						if (perm0.length != perm1.length) {
							console.error("Perm0 and Perm1 are different length");
							return {};
						}
						for (var i=0;i<perm0.length;i++) {
							var c0 = xy(dhalf, perm0[i]);
							var c1 = xy(dhalf, perm1[i]);
							nperm.push(idx(d, c0.x, c0.y));
							nperm.push(idx(d, c1.x + split, c1.y));
						}
						insert_if_unique(d, out, nperm, subpatterns[k].name + "/" + subpatterns[l].name);
					}
				}
				subpatterns = out;
			}
			console.log("Split patterns made", Object.keys(subpatterns).length, "entries");
			return subpatterns;
		}		

		var result = {};
		if (config.messed_up_chinese) {
			if (!config.no_vertical) {
				make_chinese_vert_all(d, function(perm, name) {
					insert_if_unique(d, result, perm, name);
				});
			}
			if (!config.no_horizontal) {
				make_chinese_horiz_all(d, function(perm, name) {
					insert_if_unique(d, result, perm, name);
				});	
			}
		} else {
			insert_if_unique(d, result, make_chinese_vert(d), "chinese_vert");
			insert_if_unique(d, result, make_chinese_horiz(d), "chinese_horiz");
		}

		while (true) {
			var tmp = {};
			if (make_variations(d, result, tmp)) {
				console.log("Added more variations ", Object.keys(result).length, " => ", Object.keys(tmp).length);
				result = tmp;
			} else {
				console.log("Done making variations...");
				break;
			}
		}
		console.log("Total count", Object.keys(result).length);
		return result;
	};
});