define(function(require, exports, module) {
	

	var jim_routes = require("./jimroutes.js");
	exports.modules_for_add = ['input', 'input_text', 'reverse', 'make_grid', 'pair_sort', 'char2num', 'bifid', 'bifid_rows', 'rail_fence', 'skip_nth', 'group_up', 'ungroup', 'remove_characters', 'transpose', 'cut_half', 'grid_pattern', 'cut_half_tb', 'polybius', 'playfair', 'grid_view', 'coltransp', 'meta_transposition', 'null_mask', 'stats', 'bigram_view', 'fix_length', 'output', 'shuffle'];

	// calls process for each row.
	function rowify(mod, d) {
		if (!d.grid) {
			mod.process(d, true);
		} else {
			var i = 0;
			var w = d.grid.width;
			var outp = [];
			var inp = d.input;
			var k = 0;
			while (i < inp.length && ++k < 1000) {
				d.input = inp.slice(i, i + w);
				mod.process(d, true);
				outp = outp.concat(d.output);
				i += w;
			}
			d.output = outp;
		}
	}

	function add_toggle_ui(d, prop, label) {
		var inverse = document.createElement('input');
		inverse.type = "checkbox";
		inverse.checked = d.data[prop];
		inverse.onchange = function() {
			d.data[prop] = inverse.checked;
			document.fn_reprocess();
		}
		d.container.appendChild(inverse);
		var s = document.createElement('span');
		s.textContent = label;
		d.container.appendChild(s);
	}

	function add_inverse_ui(d) {
		add_toggle_ui(d, "inverse", "Encrypt");
	}

	function add_input_box(d, prop, desc) { 
		if (desc) {
			var s = document.createElement('div');
			s.textContent = desc;
			d.container.appendChild(s);
		}		
		var fixed = document.createElement('input');
		fixed.value = d.data[prop];
		fixed.style.width = "300px";
		fixed.onchange = function() {
			d.data[prop] = fixed.value;
			document.fn_reprocess();
		}
		d.container.appendChild(fixed);
	}

	function apply_perm(d, perm, invert) {
		var output = new Array(d.input);
		if (invert) {
			// inverted
			for (var i=0;i<d.input.length;i++) {
				if (i >= perm.length) {
					console.error("Invalid permutation for length!");
					continue;
				}
				var s = perm[i];
				if (s < d.input.length)
					output[s] = d.input[i];
				else
					console.error("Invalid permutation for length!");
			}
		} else {
			for (var i=0;i<perm.length;i++) {
				var s = perm[i];
				if (s < d.input.length)
					output[i] = d.input[s];
				else
					console.error("Invalid permutation for length!");
			}
		}
		d.output = output;
	}

	function ungroup_number_to_str(val) {
		if (val >= 100000) {
			var howmany = Math.floor(val/100000);
			return String(val).slice(6-howmany, 6);
		} else {
			return String(val);
		}
	}

	function outputify(val) {
		if (typeof val == 'number')
			return ungroup_number_to_str(val);
		return val;
	}

	function output_to_string(arr) {
		var out = [];
		for (var x in arr) {
			if (typeof arr[x] == 'number')
				out.push(ungroup_number_to_str(arr[x]));
			else
				out.push(arr[x]);
		}
		return out.join('');
	}

	exports.output_to_string = output_to_string;

	exports.input = {
		create: function(d) { // returns 'data' object
			return {
				text: `75628 28591 62916 48164 91748 58464 74748 28483 81638 18174 74826 26475 83828 49175 74658 37575 75936 36565 81638 17585 75756 46282 92857 46382 75748 38165 81848 56485 64858 56382 72628 36281 81728 16463 75828 16483 63828 58163 63630 47481 91918 46385 84656 48565 62946 26285 91859 17491 72756 46575 71658 36264 74818 28462 82649 18193 65626 48484 91838 57491 81657 27483 83858 28364 62726 26562 83759 27263 82827 27283 82858 47582 81837 28462 82837 58164 75748 58162 92000`
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('textarea');
			ta.textContent = String(d.data.text).replace('\n', '').replace('\r', '').trim();
			ta.onchange = function() {
				d.data.text = ta.value;
				d.fn_reprocess();
			};
			d.container.appendChild(ta);
			return ta;
		},
		title: "Input - numbers (ignore space)",
		process: function(d) {
			var txt = d.data.text;
			var map = {
				'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8':8, '9':9,
				'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I':9, 'J': 10
			};
			var output = [];
			for (var i=0;i<txt.length;i++) {
				var r = map[txt.charAt(i)];
				if (r !== undefined)
					output.push(r);
			}
			d.output = output;
		},
	};
	exports.input_text = {
		create: function(d) { // returns 'data' object
			return {
				text: `ABCDE`
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('textarea');
			ta.textContent = String(d.data.text).replace('\n', '').replace('\r', '').trim();
			ta.onchange = function() {
				d.data.text = ta.value;
				d.fn_reprocess();
			};
			d.container.appendChild(ta);
			return ta;
		},
		title: "Input - text",
		process: function(d) {
			d.output = d.data.text;
		},
	};	
	exports.make_grid = {
		create: function(d) { // returns 'data' object
			return {
				width: 28,
			}
		},
		make_ui: function(d) {
			var width = document.createElement('input');
			width.value = d.data.width;
			d.container.appendChild(width);
			var sugg = document.createElement('span');
			d.container.appendChild(sugg);
			width.onchange = function() {
				d.data.width = Number(width.value);
				d.fn_reprocess();
			};
			return {
				width: width,
				sugg: sugg
			};
		},
		title: "Make Grid",
		process: function(d) {
			var s = [];
			for (var i=2;i<100;i++) {
				if ((d.input.length % i) == 0)
					s.push(i);
			}
			if (d.ui) {
				d.ui.sugg.textContent = " Suggested: " + s.join(', ');
			}
			d.grid = {
				width: d.data.width
			}
			d.output = d.input;
		}
	};

	function diag_transp(perm, d, x, y, dx, dy, spx, spy)
	{
		var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
		var len = 2*(d.grid.width + height);
		var used = {};
		var count = 0;
		for (var i=0;i<len;i++)
		{
			for (var j=-len;j<=len;j++)
			{
				var tx = x + dx*j;
				var ty = y + dy*j;
				if (tx >= 0 && tx < d.grid.width && ty >= 0 && ty < height) {
					var idx = ty * d.grid.width + tx;
					if (idx < d.input.length) {
						if (!used[idx]) {
							used[idx] = true;
							++count;
						}
						perm.push(idx);
						if (count == d.input.length)
							break;
					}
				}
			}
			x += spx;
			y += spy;
		}
	}

	function invert_perm(p) {
		var out = new Array(p.length);
		for (var i=0;i<p.length;i++) {
			out[p[i]] = i;
		}
		return out;
	}

	function make_pattern_perm_uncached(d) {
		var perm = [];
		var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
		switch (d.data.mode) {
			case "RowFlipOdd": {
				var idx = 0;
				var row = 0;
				while (perm.length < d.input.length) {
					for (var x=0;x<d.grid.width;x++) {
						if ((row%2) == 0)
							perm.push(row*d.grid.width + x);
						else
							perm.push((row+1)*d.grid.width - x - 1);
					}
					++row;
				}
				break;
			}
			case "HorizMirror": {
				var idx = 0;
				var row = 0;
				while (perm.length < d.input.length) {
					for (var x=0;x<d.grid.width;x++) {
						perm.push((row+1)*d.grid.width - x - 1);
					}
					++row;
				}
				break;
			}	
			case "VertMirror": {
				for (var y=height-1;y>=0;y--) {
					for (var x=0;x<d.grid.width;x++) 
						perm.push(y * d.grid.width + x);
				}
				break;
			}
			case "SpiralTL": {
				jim_routes.spiral(perm, d.grid.width, height, 0);
				break;
			}
			case "SpiralTR": {
				jim_routes.spiral(perm, d.grid.width, height, 1);
				break;
			}
			case "SpiralBR": {
				jim_routes.spiral(perm, d.grid.width, height, 2);
				break;
			}
			case "SpiralBL": {
				jim_routes.spiral(perm, d.grid.width, height, 3);
				break;
			}
			case "Chinese": {
				jim_routes.chinese(perm, d.grid.width, height);
				break;
			}
			case "RmColR": {
				var idx = 0;
				for (var y=0;y<height;y++) {
					for (var x=0;x<d.grid.width-1;x++) {
						perm.push(y*d.grid.width + x);
					}
				}
				break;
			}
			case "DiagTranspose0" : {
				diag_transp(perm, d, 0, 0, 1, -1, 0, 1);
				break;
			}

		}
		if (d.data.reverse)
			perm = perm.reverse();
		return perm;
	}

	function post_pattern_apply(d) {
		if (d.data.mode == "RmColR") {
			d.grid.width = d.grid.width - 1;
		}
	}

	var pattern_caches = {};
	function make_pattern_perm(d) {
		var key = d.grid.width + "/" + d.input.length + "/" + d.data.mode + "/" + d.data.reverse;
		if (pattern_caches[key] === undefined) {
			pattern_caches[key] = make_pattern_perm_uncached(d);
		}
		return pattern_caches[key];
	}

	exports.grid_pattern = {
		create: function(d) { // returns 'data' object
			return {
				mode: "RowFlipOdd",
				reverse: false
			}
		},
		make_pattern_perm: make_pattern_perm,
		make_ui: function(d) {

			var selectList = document.createElement("select");
			var opts = {
				"RowFlipOdd"       : "Reverse odd rows",
				"HorizMirror"      : "Mirror horizontally",
				"VertMirror"       : "Mirror vertically",
				"RmColR"           : "Remove rightmost column",
				"DiagTranspose0"   : "DiagTranspose",
				"SpiralTL"         : "SpiralTL",
				"SpiralTR"         : "SpiralTR",
				"SpiralBR"         : "SpiralBR",
				"SpiralBL"         : "SpiralBL",
				"Chinese"          : "Chinese",
			};
			var cont = [];
			for (var x in opts) {
				var k = document.createElement('option');
				k.value = x;
				k.text = opts[x];
				cont.push(x);
				if (d.data.mode == x)
					k.selected = true;
					selectList.appendChild(k);
			}
			selectList.onchange = function() {
				d.data.mode = cont[selectList.selectedIndex];
				document.fn_reprocess();
			}			
			d.container.appendChild(selectList);
			add_inverse_ui(d);
			add_toggle_ui(d, "reverse", "Reversed");
		},
		title: "Grid Pattern",
		process: function(d) {
			var output = [];
			if (d.grid && d.grid.width > 1) {
				var perm = make_pattern_perm(d);
				if (d.data.inverse) {
					// regular
					var output = new Array(d.input);
					for (var i=0;i<d.input.length;i++) {
						if (i >= perm.length)
							continue
						var s = perm[i];
						if (s < d.input.length)
							output[s] = d.input[i];
					}
				} else {
					// regular
					for (var i=0;i<perm.length;i++) {
						var s = perm[i];
						if (s < d.input.length)
							output.push(d.input[s]);
					}
				}
				d.output = output;
				post_pattern_apply(d);
			} else {
				d.output = d.input;
			}
		}
	};


	function make_perm_rf(width, length) {
		var rfs = [];
		for (var i=0;i<width;i++) rfs.push([]);
		var up = true;
		var r = 0;
		for (var i=0;i<length;i++) {
			rfs[r].push(i);
			if (up) {
				if (++r == width) {
					r = r - 2;
					up = false;
				}
			} else {
				if (--r < 0) {
					r = 1;
					up = true;
				}
			}
		}
		var output = [];
		for (var i=0;i<width;i++)
			output = output.concat(rfs[i]);
		return output;
	}

	exports.rail_fence = {
		create: function(d) { // returns 'data' object
			return {
				width: 2,
				by_rows: false
			}
		},
		make_perm_rf: make_perm_rf,
		make_ui: function(d) {
			add_input_box(d, "width");
			add_inverse_ui(d);
			add_toggle_ui(d, "by_rows", "By rows");
		},
		title: "Rail Fence",
		process: function(d, by_rows) {
			if (d.data.by_rows && !by_rows)  {
				return rowify(this, d);
			}
			apply_perm(d, make_perm_rf(d.data.width, d.input.length), !d.data.inverse);
		}
	};

	exports.char2num = {
		create: function(d) { // returns 'data' object
			return {
				str: "_ABCDELMNOP"
			}
		},
		make_perm_rf: make_perm_rf,
		make_ui: function(d) {
			add_input_box(d, "str");
			add_inverse_ui(d);
		},
		title: "Char2Num",
		process: function(d) {
			var out = [];			
			for (var i=0;i<d.input.length;i++) {
				if (d.data.inverse) {
					var idx = d.input[i];
					if (idx >= 0 && idx < d.data.str.length)
						out.push(d.data.str.charAt(idx));
				} else {
					var utp = d.data.str.indexOf(d.input[i]);
					if (utp != -1 && d.data.str[utp] != '_')
						out.push(utp);
				}
			}
			d.output = out;
		}
	};	

	exports.group_up = {
		create: function() {
			return {
				width: 2
			}; 
		},
		process: function(d) {
			if (d.group_width == d.data.width) {
				d.output = d.input;
				return;
			} else if (d.group_width) {
				d.output = d.input;
				return;
			}
			var output = [];
			var filler = d.data.width * 100000;
			var len = d.input.length - (d.data.width - 1)
			var i = 0;
			for (var i=0;i<len;i+=d.data.width) {			
				var val = 0;
				var scam = false;
				for (var j=0;j<d.data.width;j++) {
					if (d.input[i + j] == '?') {
						scam = true;
						break;
					}
					val *= 10;
					val += d.input[i + j];
				}
				if (scam)
					output.push("?");
				else
					output.push(filler + val);
			}
			d.output = output;
			d.group_width = d.data.width;
			if (d.grid && (d.grid.width % 2) == 0)
				d.grid.width = d.grid.width / 2;
			if (d.columns_are_random)
				d.is_fractionated = true;
		},
		make_ui: function(d) {
			var width = document.createElement('input');
			width.value = d.data.width;
			d.container.appendChild(width);
			width.onchange = function() {
				d.data.width = Number(width.value);
				d.fn_reprocess();
			};
		},
		title: "Group"
	};
	exports.ungroup = {
		create: function() {
			return {
			}; 
		},
		process: function(d) {
			var output = [];
			for (var x in d.input) {
				if (d.input[x] == '?') {
					output.push('?');
				} else {
					var p = ungroup_number_to_str(d.input[x]);
					for (var i=0;i<p.length;i++)
						output.push(p.charAt(i) - '0');
				}
			}
			d.output = output;
			delete d.group_width;
		},
		make_ui: function(d) {
		},
		title: "Ungroup"
	};	
	exports.reverse = {
		create: function() { return {}; },
		process: function(d) {
			var output = new Array(d.input.length);
			for (var i=0;i<d.input.length;i++) {
				output.push(d.input[d.input.length-1-i]);
			}
			d.output = output;
		},
		make_ui: function(root) {
			
		},
		title: "Reverse"
	};	
	exports.bifid = {
		create: function() { return {
			inverse: false
		}; },
		process: function(d) {
			/*if ((d.input.length % 2) != 0) {
				d.error = "Length not divisible by 2... " + d.input.length;
				d.output = [];
			} else 
			*/{
				if (d.data.inverse) {
					var output = new Array(d.input.length);
					var j = 0;
					for (var i=0;i<d.input.length;i+=2) {
						output[j++] = d.input[i];
					}
					for (var i=0;i<d.input.length;i+=2) {
						output[j++] = d.input[i+1];
					}
				} else {
					var o1 = [];
					var o2 = [];
					for (var i=0;i<d.input.length;i++) {
						if (i < d.input.length/2)
							o1.push(d.input[i]);
						else
							o2.push(d.input[i]);
					}
					output = [];
					for (var i=0;i<o1.length;i++)
					{
						output.push(o1[i]);
						if (i < o2.length)
							output.push(o2[i]);
					}
					//if (o2.length > o1.length)
					//	output.push(o2[o2.length-1]);
				}
				d.output = output;
			}
			return d.input;
		},
		make_ui: function(d) {
			add_inverse_ui(d);
		},
		title: "BIFID"
	};
	exports.skip_nth = {
		create: function() { return {
			which: 3,
			offset: 0
		}; },
		process: function(d) {
			var output = [];
			var j = 0;
			var which = d.data.which;
			var offset = d.data.offset;
			for (var i=0;i<d.input.length;i++) {
				if (i % (which+offset) != (which-1))
					output[j++] = d.input[i];
			}
			d.output = output;
		},
		make_ui: function(d) {
			var width = document.createElement('input');
			width.value = d.data.which;
			d.container.appendChild(width);
			width.onchange = function() {
				d.data.which = Number(width.value);
				d.fn_reprocess();
			};
		},
		title: "Skip N:th"
	};
	exports.bifid_rows = {
		create: function() { return {}; },
		process: function(d) {
			if (d.grid) {
				var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
				var output = new Array(d.input.length);
				var j = 0;
				// ABCD       AE BF
				// EFGH   =>  CG DH
				// IJKL       IM JN
				// MNOP       KO LP
				for (var y=0;y<(height-1);y+=2) {
					var r0 = (y+0) * d.grid.width;
					var r1 = (y+1) * d.grid.width;
					for (var x=0;x<d.grid.width;x++) {
						if (r0+x < d.input.length)
							output[j++] = d.input[r0+x];
						if (r1+x < d.input.length)
							output[j++] = d.input[r1+x];
					}
				}
				d.output = output;
			}
			return d.input;
		},
		make_ui: function(root) {
			
		},
		title: "BIFID ROWS"
	};		
	exports.remove_characters = {
		create: function() { return {
			always_nulls: ""
		}; },
		process: function(d) {
			if (d.group_width != undefined) {
				d.output = d.input;
			} else {
				var output = [];
				for (var i=0;i<d.input.length;i++)
					if (d.data.always_nulls.indexOf(d.input[i]) == -1)
						output.push(d.input[i]);
				d.output = output;
			}
		},
		make_ui: function(d) {
			var ns = document.createElement('input');
			ns.value = d.data.always_nulls;
			d.container.appendChild(ns);
			ns.onchange = function() {
				d.data.always_nulls = ns.value;
				d.fn_reprocess();
			};
			return {
				ns: ns
			};
		},
		title: "RemoveCharacters"
	};
	exports.output = {
		create: function() { return {}; },
		process: function(d) {
			if (d.ui) {
				d.ui.textContent = output_to_string(d.input);
				if (d.meta_transposition_order) {
					d.ui.textContent += "\n\nMetaTranspositionOrder:" + d.meta_transposition_order.join(' ');
				}
			}
			d.output = d.input;
		},
		make_ui: function(d) {
			var ta = document.createElement('textarea');
			ta.textContent = "";
			d.container.appendChild(ta);
			return ta;
		},
		title: "Output",
		prevent_delete: true
	};
	exports.stats = {
		create: function() { return {}; },
		process: function(d) {
			var txt;
			var counts = {};
			if (typeof d.input == "string") {
				for (var x in d.input) {
					var c = d.input.charAt(x);
					if (!counts[c])
						counts[c] = 1;
					else
						counts[c] = counts[c]+1;
				}
			}
			else {
				for (var x in d.input) {
					var c = d.input[x];
					if (!counts[c])
						counts[c] = 1;
					else
						counts[c] = counts[c]+1;
				}
			}
			var u=0, n=0;
			for (var k in counts) {
				u += counts[k] * (counts[k]-1);
				n += counts[k];
			}
			var ic = 10000 * u/(n*(n-1));
			d.ic = ic;
			if (d.ui) {
				console.log("Counts are", counts);
				console.log(u, n);
				d.ui.innerHTML = `<div>N = ${n}</div><span>IC = ${ic.toFixed(1)} (en=686)</span>`;
 			}
			d.output = d.input;
		},
		make_ui: function(d) {
			var icdiv = document.createElement('div');
			var ta = document.createElement('textarea');
			ta.textContent = "";
			d.container.appendChild(icdiv);
			return icdiv;
		},
		title: "Statistics",
	};
	exports.transpose = {
		create: function() { 
			return {}; 
		},
		process: function(d) {
			if (d.grid) {
				var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
				if (height * d.grid.width != d.input.length) {
					// d.error = "No transpose of incomplete matrix"
				}
				var output = [];
				for (var x=0;x<d.grid.width;x++) {
					for (var y=0;y<height;y++) {
						var idx = y * d.grid.width + x;
						if (idx < d.input.length)
							output.push(d.input[idx]);
					}
				}
				d.output = output;
				d.grid.width = height;
			} else {
				d.output = d.input;
			}
		},
		make_ui: function(d) {
		},
		title: "Transpose"
	};

	function make_order(d) {
		var order = [];
		for (var i=0;i<d.data.keyword.length;i++) {
			order.push({
				value: d.data.keyword.charCodeAt(i),
				index: i
			});
		}
		order.sort(function(a,b){return a.value - b.value});
		if (!d.data.inverse) {
			var o = [];
			for (var i=0;i<order.length;i++)
				o[order[i].index] = { index: i };
			order = o;
		}
		return order;
	};

	exports.meta_transposition = {
		create: function() { 
			return {
			}; 
		},
		process: function(d) {
			if (d.group_width !== 2) {
				d.error = "Group width isn't 2";
				d.output = d.input;
			} else {
				// We make outputs that say which column and row it is.
				var width = d.data.width;
				// We set up the input order here.
				var output = [];
				var transp_source = [];
				for (var i=0;i<d.input.length;i++) {
					output.push(i);
				}
				do_polybius_subst(transp_source, d.input, "ABCDEFGHIKLMNOPQRSTUVWXYZ") ;
				d.group_width = -1; // Magic for coltransp indices.
				d.meta_transposition_source = d.input;
				d.output = output;
				// console.log("MetaTransposition source=", d.meta_transposition_source, " output=",d.output)
			}
		},
		make_ui: function(d) {
		},
		title: "Meta Transposition"
	}

	function mulberry32(a) {
		return function() {
		  var t = a += 0x6D2B79F5;
		  t = Math.imul(t ^ t >>> 15, t | 1);
		  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		  return ((t ^ t >>> 14) >>> 0);
		}
	}

	exports.shuffle = {
		create: function() { 
			return {
				seed: 0
			}; 
		},
		process: function(d) {
			var tmp = [];
			for (var i=0;i<d.input.length;i++)
				tmp.push(d.input[i]);
			var out = [];
			var r = mulberry32(Number(d.data.seed));
			while (tmp.length > 0) {
				var x = r() % tmp.length;
				out.push(tmp[x]);
				tmp.splice(x, 1);
			}
			d.output = out;
		},
		make_ui: function(d) {
			add_input_box(d, "seed", "Random Seed");
		},
		title: "Random Shuffle"
	}


	exports.coltransp = {
		create: function() { 
			return {
				keyword: "MANCHESTER", 
				inverse: false,
				double: false
			}; 
		},
		make_order: make_order,
		process: function(d) {
			d.output = d.input;
			var order = make_order(d);
			if (order.length < 2)
				return;
			d.grid = { width: order.length };
			var height = Math.floor((d.input.length)/(d.grid.width));
			var height_round_up = Math.floor((d.input.length + d.grid.width-1)/(d.grid.width));
			var output = [];

			if (d.data.inverse) {
				// encrypt
				for (var x=0;x<d.grid.width;x++) {
					var src_col = order[x].index;
					for (var y=0;y<(height+1);y++) {
						var idx = y * d.grid.width + src_col;
						if (idx < d.input.length)
							output.push(d.input[idx]);
					}
				}
			} else {
				var outbuf = new Array(d.grid.width * height_round_up);
				var remainder = d.input.length - d.grid.width * height;
				var readp = 0;
				var in_order = new Array(order.length);
				for (var x=0;x<d.grid.width;x++) {
					in_order[order[x].index] = x;
				}
				for (var i=0;i<outbuf.length;i++) outbuf[i] = '!';
				for (var x=0;x<d.grid.width;x++) {
					var src_col = in_order[x];
					var col_height = src_col < remainder ? height + 1 : height;
					for (var y=0;y<col_height;y++) {
						var idx = y * d.grid.width + src_col;
						outbuf[idx] = d.input[readp++];
					}
				}
				if (readp != d.input.length)
					console.error("readp = ", readp, " total=" , d.input.length);
				for (var y=0;y<height_round_up;y++) {
					var src_y = y;
					if (d.data.double)
						src_y = order[y].index;
					for (var x=0;x<d.grid.width;x++) {
						var idx = src_y * d.grid.width + x;
						if (output[idx] != '!')
							output.push(outbuf[idx]);
					}
				}
			}
			d.output = output;
			d.columns_are_random = true;
		},
		make_ui: function(d) {
			var fixed = document.createElement('input');
			fixed.value = d.data.keyword;
			fixed.style.width = "300px";
			fixed.onchange = function() {
				d.data.keyword = fixed.value;
				document.fn_reprocess();
			}
			d.container.appendChild(fixed);

			add_inverse_ui(d);
			add_toggle_ui(d, "double", "Double");

			var ta = document.createElement('x-grid');
			d.container.appendChild(ta);
			return ta;
		},
		title: "Transposition",
		crack_step: true
	};	
	exports.cut_half = {
		create: function() { 
			return {}; 
		},
		process: function(d) {
			d.output = output;
			if (d.grid) {
				var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
				var output = [];
				for (var y=0;y<height;y++) {
					for (var x=0;x<d.grid.width;x++) {
						if (x < d.grid.width/2)
							continue;
						var idx = y * d.grid.width + x;
						if (idx < d.input.length)
							output.push(d.input[idx]);
					}
				}
				d.grid.width = Math.floor(d.grid.width / 2);
				d.output = output;
			}
		},
		make_ui: function(d) {
		},
		title: "CutHalfLR"
	};
	exports.pair_sort = {
		title: "Pair Sort",
		create: function() { 
			return {
				prefixes: '67890',
				bycols: false,
				remove_prefix: true
			}; 
		},
		process: function(d, by_rows) {
			if (d.data.by_rows && !by_rows)  {
				return rowify(this, d);
			}

			var rows = [];
			for (var p=0;p<d.data.prefixes.length;p++) 
				rows.push([]);

			for (var i=0;i<d.input.length;i++) {
				var str = ungroup_number_to_str(d.input[i]);
				if (str.length > 1) {
					var idx = d.data.prefixes.indexOf(str.charAt(0));
					if (idx >= 0 && idx < rows.length) {
						if (d.data.remove_prefix)
							rows[idx].push(Number(str.slice(1)));
						else
							rows[idx].push(d.input[i]);
					}
				}
			}
			if (d.data.remove_prefix && d.group_width == 2)
				delete d.group_width;
			var output = [];
			if (d.data.bycols) {
				for (var i=0;i<d.input.length;i++) {
					for (var j=0;j<rows.length;j++) {
						if (i < rows[j].length)
							output.push(rows[j][i]);
					}
				}
			} else {
				for (var j=0;j<rows.length;j++) {
					output = output.concat(rows[j]);
				}
			}
			d.output = output;
		},
		make_ui: function(d) {
			add_input_box(d, "prefixes");
			add_toggle_ui(d, "bycols", "ReadByCols");
			add_toggle_ui(d, "remove_prefix", "RemovePrefix");
			add_toggle_ui(d, "by_rows", "ByRows");
		},
	}
	exports.cut_half_tb = {
		create: function() { 
			return {}; 
		},
		process: function(d) {
			d.output = output;
			if (d.grid) {
				var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
				var output = [];
				for (var i=0;i<d.grid.width*height/2;i++) {
					output.push(d.input[i]);
				}
				d.output = output;
			}
		},
		make_ui: function(d) {
		},
		title: "CutHalfTB"
	};
	exports.fix_length = {
		create: function() { 
			return {
				target_length: 500,
				offset: 0
			};
		},
		process: function(d) {
			var output = [];
			var diff = d.data.target_length - d.input.length;
			var tmp = d.input.splice(0, d.input.length);
			if (diff > 0) {
				var k = [];
				for (var x=0;x<diff;x++) k.push('?');
				tmp.splice(d.data.offset, 0, ...k);
			} else {
				/*
				var o = d.data.offsetf;
				if ((o-diff) > d.input.length) 
					o = d.input.length + diff;
					*/
				
				tmp.splice(d.data.offset, -diff);
			}
			d.output = tmp;
		},
		make_ui: function(d) {
			add_input_box(d, "target_length", "Target Length");
			add_input_box(d, "offset", "Mod Offset");
		},
		title: "Fix Length"
	},
	exports.null_mask = {
		create: function() { 
			return {
				mask: "010101",
				inverted: false
			};
		},
		process: function(d) {
			var output = [];
			var m = d.data.mask;
			if (m.length > 0) {
				for (var i=0;i<d.input.length;i++) {
					if (d.data.inverted != (d.data.mask.charAt(i % d.data.mask.length) == '1'))
						output.push(d.input[i]);
				}
			}
			d.output = output;
		},
		make_ui: function(d) {
			add_input_box(d, "mask");
			add_toggle_ui(d, "inverted", "Inverted" );
		},
		title: "Null Mask"
	};		
	function make_polyb_subst(d) {
		var real = new Array(25);
		var left = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
		var inp = d.data.box.toUpperCase();
		for (var i=0;i<25;i++) {
			var c = inp.charAt(i);
			if (i < inp.length && c != '?') {
				real[i] = c;
				left = left.replace(c, '');
			}
		}
		var c = 0;
		for (var i=0;i<25;i++) {
			if (i >= inp.length || inp.charAt(i) == '?') {
				real[i] = left.charAt(c++);
			}
		}
		return real;
	}
	function do_polybius_subst(out, input, real, indices) {
		for (var i=0;i<input.length;i++) {
			var a = Math.floor(input[i] / 10) % 10;
			var b = input[i] % 10;
			var y = (5+a-1) % 5;
			var x = (5+b-1) % 5;
			var c = y*5+x;
			if (c >= 0 && c < 25) {
				if (indices !== undefined)
					indices.push(c);
				var c = real[c];
				if (c >= '0' && c <= '9')
					out.push(Number(c));
				else
					out.push(c);
			} else {
				out.push('[');
			}
		}
	}	
	exports.polybius = {
		create: function() { 
			return {
				box: "ABCDEFGHIKLMNOPQRSTUVWXYZ",
				inverse: false
			}; 
		},
		make_polyb_subst: make_polyb_subst,
		process: function(d) {
			var out = [];
			var indices = [];

			// These are meta columnar transposition values that we need to translate into indices.
			// After that we undo the meta and get back what we would have had without it.
			if (d.group_width === -1) {
				var order_source = [];
				var hex = "0123456789ABCDEF";
				var real_input = [];
				for (var i=0;i<d.input.length;i++) {
					var idx = d.input[i] % 10000;
					order_source.push(idx);
					real_input.push(d.meta_transposition_source[idx]);
				}
				d.meta_transposition_order = order_source;
				d.input = real_input;
			}

			var real = make_polyb_subst(d);
			if (!d.data.inverse) {
				do_polybius_subst(out, d.input, real, indices);
			} else {
				// encrypt
				for (var i=0;i<d.input.length;i++) {
					var c;
					if (typeof d.input == 'string') 
						c = d.input.charAt(i);
					else
						c = d.input[i];
					var k = real.indexOf(c);
					if (k != -1) {
						out.push(1+Math.floor(k / 5));
						out.push(1+(k % 5));
						indices.push(k);
					}				
				}
				if (d.grid) d.grid.width = d.grid.width * 2;
			}

			if (d.ui) {
				var root = d.ui;
				while (root.childNodes.length > 0) {
					root.removeChild(root.childNodes[0]);
				}

				var count = [];
				for (var i=0;i<d.data.box.length;i++)
					count.push(0);
				for (var i=0;i<indices.length;i++)
					count[indices[i]]++;

				for (var y=0;y<5;y++) {
					var rr = document.createElement('x-grid-row');
					for (var x=0;x<5;x++) {
						var b = document.createElement('x-grid-entry');
						b.textContent = real[y*5+x];
						rr.appendChild(b);
					}
					var spacer = document.createElement('x-grid-entry');
					spacer.style.opacity = 0.0;
					rr.appendChild(spacer);
					for (var x=0;x<5;x++) {
						var b = document.createElement('x-grid-entry');
						b.textContent = count[y*5+x];// d.data.box[y*5+x];
						rr.appendChild(b);
					}

					root.appendChild(rr);
				}
			}

			d.output = out;
			delete d.group_width;
		},
		make_ui: function(d) {
			
			var fixed = document.createElement('input');
			fixed.value = d.data.box;
			fixed.style.width = "300px";
			fixed.onchange = function() {
				d.data.box = fixed.value;
				while (d.data.box.length < 25)
					d.data.box = d.data.box + "?";
				fixed.value = d.data.box;
				document.fn_reprocess();
			}
			d.container.appendChild(fixed);

			var inverse = document.createElement('input');
			inverse.type = "checkbox";
			inverse.checked = d.data.inverse;
			inverse.onchange = function() {
				d.data.inverse = inverse.checked;
				document.fn_reprocess();
			}
			d.container.appendChild(inverse);

			var s = document.createElement('span');
			s.textContent = 'Encrypt';
			d.container.appendChild(s);

			var ta = document.createElement('x-grid');
			d.container.appendChild(ta);
			
			return ta;
		},
		title: "Polybius",
		crack_step: true
	};	
	exports.playfair = {
		create: function() { 
			return {
				box: "ABCDEFGHIKLMNOPQRSTUVWXYZ",
				inverse: false
			}; 
		},
		make_playfair_subst: make_polyb_subst,
		process: function(d) {
			// These are meta columnar transposition values that we need to translate into indices.
			// After that we undo the meta and get back what we would have had without it.
			if (d.group_width === -1) {
				console.log("Does not support meta transposition with playfair.")
				return;
			}
			var real = make_polyb_subst(d);
			let letters = Math.floor(d.input.length/2);
			let length = letters * 2;
			var out = new Array(length);
			var indices = new Array(length);

			if (typeof d.input[0] == 'number') {
				throw "No number support";
			} else {				
				for (var i=0;i<length;i++) {
					var idx = real.indexOf(d.input[i]);
					if (idx == -1) {
						d.error = "Invalid playfair input " + d.input[i] + " " + real;
						return;
					}
					indices[i] = idx;
				}
			}

			for (var i=0;i<length;i+=2) {
				var c0 = indices[i] % 5;
				var r0 = Math.floor(indices[i] / 5);
				var c1 = indices[i+1] % 5;
				var r1 = Math.floor(indices[i+1] / 5);
				var r2, c2, r3, c3;
				if (c0 == c1 && r0 == r1) {
					d.error = "Duplicate letter in playfair input";
					d.output = [];
					return;
				}
				if (r0 == r1) {
					r2 = r0;
					r3 = r1;
					c2 = (c0 + 4) % 5;
					c3 = (c1 + 4) % 5;
				} else if (c0 == c1) {
					c2 = c0;
					c3 = c1;
					r2 = (r0 + 4) % 5;
					r3 = (r1 + 4) % 5;
				} else {
					c2 = c1;
					c3 = c0;
					r2 = r0;
					r3 = r1;
				}
				out[i] = real[r2 * 5 + c2];
				out[i+1] = real[r3 * 5 + c3];
			}

			if (d.ui) {
				var root = d.ui;
				while (root.childNodes.length > 0) {
					root.removeChild(root.childNodes[0]);
				}	
				var count = [];
				for (var i=0;i<25;i++)
					count.push(0);
				for (var i=0;i<indices.length;i++)
					count[indices[i]]++;	
				for (var y=0;y<5;y++) {
					var rr = document.createElement('x-grid-row');
					for (var x=0;x<5;x++) {
						var b = document.createElement('x-grid-entry');
						b.textContent = real[y*5+x];
						rr.appendChild(b);
					}
					var spacer = document.createElement('x-grid-entry');
					spacer.style.opacity = 0.0;
					rr.appendChild(spacer);
					for (var x=0;x<5;x++) {
						var b = document.createElement('x-grid-entry');
						b.textContent = count[y*5+x];// d.data.box[y*5+x];
						rr.appendChild(b);
					}	
					root.appendChild(rr);
				}
			}	
			d.output = out;
		},

		make_ui: function(d) {			
			add_input_box(d, "box");
			add_inverse_ui(d);
			var ta = document.createElement('x-grid');
			d.container.appendChild(ta);
			return ta;
		},
		title: "Playfair",
		crack_step: false
	};
	exports.bigram_view = {
		create: function() { 
			return {
			}; 
		},
		process: function(d) {
			d.output = d.input;
			if (d.ui) {
				var root = d.ui;
				while (root.childNodes.length > 0) {
					root.removeChild(root.childNodes[0]);
				}

				var symbols = {};
				var bigrams = {};
				var nsyms = 0;
				for (var i=0;i<d.input.length;i++) {
					var s = outputify(d.input[i]);
					if (symbols[s] === undefined) {
						symbols[s] = true;
						nsyms++;
					}
					if (i > 0) {
						var s0 = d.input[i-1];
						var key = outputify(s0) + '/' + outputify(s);
						if (!bigrams[key]) 
							bigrams[key] = 1;
						else
							bigrams[key] = bigrams[key] + 1;
					}
				}

				var rr = document.createElement('x-grid-row');
				var dummy = document.createElement('x-grid-entry');
				dummy.textContent = '.';
				rr.appendChild(dummy);
				for (var x in symbols) {
					var b = document.createElement('x-grid-entry');
					b.textContent = x;
					rr.appendChild(b);
				}				
				root.appendChild(rr);

				var colors = ["#CCCCCC", "#BBBBBB", "#22C941", "#F09FA6", "#08f", "#E249EE",  "#63FFAC", "#B79762", "#8FB0FF", "#997D87"];				
				var counts = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
				var repeated = 0;
				for (var y in symbols) {
					var rr = document.createElement('x-grid-row');
					var p = document.createElement('x-grid-entry');
					p.textContent = y;
					rr.appendChild(p);
					for (var x in symbols) {
						var b = document.createElement('x-grid-entry');
						var key = outputify(x) + '/' + outputify(y);
						var count = bigrams[key] || 0;
						if (count > 1) repeated++;
						counts[count]++;
						if (x == y && count > 0) {
							b.style.boxShadow = "inset 0px 0px 0px 2px #800";
						}

						if (count < colors.length) 
							b.style.backgroundColor = colors[count];
						else
							b.style.backgroundColor = colors[colors.length-1];
							
						b.textContent = count;
						rr.appendChild(b);
					}
					root.appendChild(rr);
				}

				var t = document.createElement('x-grid-row');
				root.appendChild(t);
				t.textContent = "Total repeated:" + repeated;
				for (var i=2;i<counts.length;i++) {
					if (counts[i] > 0)
						t.textContent += "  " + i +":" + counts[i] + " ";
				}				
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('x-grid');
			d.container.appendChild(ta);
			return ta;
		},
		title: "Bigram View"
	};
	exports.grid_view = {
		create: function() { 
			return {
				highlight: ""
			}; 
		},
		process: function(d) {
			d.output = d.input;
			if (d.ui && d.grid) {
				var root = d.ui;
				while (root.childNodes.length > 0) {
					root.removeChild(root.childNodes[0]);
				}
				var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
				var colors = ["#FFFF00", "#1CE6FF", "#FF4A46", "#008941", "#F06FA6", "#FFDBE5", "#E249EE",  "#63FFAC", "#B79762", "#8FB0FF", "#997D87",
				"#809693", "#FEFFE6", "#5B8440", "#4FC601", "#3B5DFF", "#4AFB53", "#FF2F80", "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
				"#DDEFFF", "#000035", "#7B4F4B", "#A1C299",  "#0AA6D8", "#013349", "#00846F", "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
				"#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66", "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C" ];
				var colmap = {};
				var colindex = 0;
				var hl = d.data.highlight || "";
				for (var y=0;y<height;y++) {
					var rr = document.createElement('x-grid-row');
					for (var x=0;x<d.grid.width;x++) {
						var b = document.createElement('x-grid-entry');
						var idx = y*d.grid.width+x;
						if (idx < d.input.length) {

							var v = d.input[idx];
							if (colmap[v] === undefined) 
								colmap[v] = colindex++;
							var c = colmap[v];
							b.style.backgroundColor = colors[c];
							//b.style.color = colors[c];

							if (typeof v == 'string')
								b.textContent = v;
							else if (v >= 0) {
								b.textContent = ungroup_number_to_str(v); 
							} else {
								b.textContent = '?';
							}
						} else {
							b.textContent = '_';
						}
						if (hl.length > 0) {
							b.style.opacity = (b.textContent.startsWith(hl) || b.textContent.endsWith(hl)) ? "1.0" : "0.2";
						}
						rr.appendChild(b);
					}
					root.appendChild(rr);
				}
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('x-grid');
			d.container.appendChild(ta);
			add_input_box(d, "highlight", "Highlight");
			return ta;
		},
		title: "Grid View"
	};	
});