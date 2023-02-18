define(function(require, exports, module) {

	var jim = require('./jimroutes.js');

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

	function make_spirals(d, fn) {
		for (var i=0;i<4;i++) {
			var tmp = [];
			jim.spiral(tmp, d.width, d.height, i);
			fn(tmp, "spiral" + i);
		}
		return tmp;
	}

	function diagonal(length, width, height, x, y, dx, dy, spx, spy) {
		var perm = [];
		var len = 2*(width + height);
		var used = {};
		var count = 0;
		for (var i=0;i<len;i++)
		{
			for (var j=-len;j<=len;j++)
			{
				var tx = x + dx*j;
				var ty = y + dy*j;
				if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
					var idx = ty * width + tx;
					if (idx < length) {
						if (!used[idx]) {
							used[idx] = true;
							++count;
						}
						perm.push(idx);
						if (count == length)
							break;
					}
				}
			}
			x += spx;
			y += spy;
		}
		return perm;
	}

	function make_diagonals(d, fn) {
		// is this enough?
		fn(diagonal(d.length, d.width, d.height, 0, 0, 1, -1, 0, 1), "diag-tl");
	}

	function make_h2v(d, fn) {
		var p0 = [];
		var p1 = [];
		for (var i=0;i<10000;i++) {
			var x0 = i;
			var y0 = i;
			// go right, go down
			for (var x=x0;x<d.width;x++) p0.push(idx(d, x, y0));
			for (var y=y0+1;y<d.height;y++) p0.push(idx(d, x0, y));
			// go down, go right
			for (var y=y0;y<d.height;y++) p1.push(idx(d, x0, y));
			for (var x=x0+1;x<d.width;x++) p1.push(idx(d, x, y0));
		}
		fn(p0, "r-d");
		fn(p1, "d-r");
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

	function transpose(d, perm) {
		return perm.map(i => {
			var c = xy(d, i);
			return d.height * c.y + c.x;
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

	var cache = {};

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

		var cache_key = JSON.stringify(d);
		if (cache[cache_key] !== undefined) {
			return cache[cache_key];
		}

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
				//console.log("Re-merging patterns top/bottom with same above as below");
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
				//console.log("Re-merging patterns top/bottom with all combinations above vs below");
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
			//console.log("Split patterns made", Object.keys(subpatterns).length, "entries");
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
				//console.log("Re-merging patterns left/right with same above as below");
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
				//console.log("Re-merging patterns left/right with all combinations above vs below");
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
			//console.log("Split patterns made", Object.keys(subpatterns).length, "entries");
			return subpatterns;
		}		

		var result = {};

		//console.log("Making patterns...", config.patterns);
		config.patterns.forEach(pattern => {
			switch (pattern) {
				case "chinese_horiz_botched": 
					make_chinese_horiz_all(d, function(perm, name) {
						insert_if_unique(d, result, perm, name);
					});
					break;
				case "chinese_vert_botched": 
					make_chinese_vert_all(d, function(perm, name) {
						insert_if_unique(d, result, perm, name);
					});
					break;
				case "chinese_horiz": 
					insert_if_unique(d, result, make_chinese_vert(d), "chinese_horiz");
					break;
				case "chinese_vert":
					insert_if_unique(d, result, make_chinese_vert(d), "chinese_vert");
					break;
				case "chinese": // just both
					insert_if_unique(d, result, make_chinese_vert(d), "chinese_horiz");
					insert_if_unique(d, result, make_chinese_vert(d), "chinese_vert");
					break;
				case "spirals": 
					make_spirals(d, function(perm, name) {
						insert_if_unique(d, result, perm, name);
					})
					break;
				case "diagonals": 
					make_diagonals(d, function(perm, name) {
						insert_if_unique(d, result, perm, name);
					})
					break;
				case "h2v":
					make_h2v(d, function(perm, name) {
						insert_if_unique(d, result, perm, name);
					});
					break;
			}
		});

		//console.log("Making variants...", config.variants);
		while (true) {
			var tmp = {};

			var added = false;
			for (var key in result) {
				tmp[key] = result[key];
			}

			function process(fn, variant_name) {
				for (var key in result) {
					var perm = result[key].perm;
					var name = result[key].name;
					var var_perm = fn(perm);
					var k = make_key(var_perm);
					if (tmp[k] === undefined) {
						tmp[k] = {
							perm: var_perm,
							name: name + variant_name
						};
						added = true;
					}
				}
			}
			config.variants.forEach(variant => {
				switch (variant) {
					case "horiz_mirror": process(perm => horiz_mirror(d, perm), ".horiz_mirr"); break;
					case "vert_mirror": process(perm => horiz_mirror(d, perm), ".vert_mirr"); break;
					case "transpose": process(perm => transpose(d, perm), ".transpose"); break;
					case "reverse": process(perm => perm.slice(0).reverse(), ".reverse"); break;
					case "inverse": process(perm => inverse(perm), ".inverse"); break;
				}
			});
			if (added) {
				result = tmp;
			} else {
				break;
			}
		}

		cache[cache_key] = result;
		return result;
	};
});