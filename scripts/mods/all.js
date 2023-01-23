define(function(require, exports, module) {

	exports.modules_for_add = ['input', 'input_text', 'reverse', 'make_grid', 'pair_sort', 'char2num', 'bifid', 'bifid_rows', 'rail_fence', 'skip_nth', 'group_up', 'ungroup', 'remove_characters', 'transpose', 'cut_half', 'grid_pattern', 'cut_half_tb', 'polybius', 'grid_view', 'coltransp', 'stats'];

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

	function add_input_box(d, prop) { 
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

	function make_pattern_perm(d, update_d_grid_size) {
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
			case "RmColR": {
				var idx = 0;
				for (var y=0;y<height;y++) {
					for (var x=0;x<d.grid.width-1;x++) {
						perm.push(y*d.grid.width + x);
					}
				}
				if (update_d_grid_size)
					d.grid.width = d.grid.width - 1;
				break;
			}
			case "DiagTranspose0" : {
				diag_transp(perm, d, 0, 0, 1, -1, 0, 1);
				break;
			}

		}
		return perm;
	}	
	exports.grid_pattern = {
		create: function(d) { // returns 'data' object
			return {
				mode: "RowFlipOdd"
			}
		},
		make_pattern_perm: make_pattern_perm,
		make_ui: function(d) {

			var selectList = document.createElement("select");
			var opts = {
				"RowFlipOdd"       : "Reverse odd rows",
				"HorizMirror"      : "Mirror horizontally",
				"RmColR"           : "Remove rightmost column",
				"DiagTranspose0"   : "DiagTranspose"
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
		},
		title: "Grid Pattern",
		process: function(d) {
			var output = [];
			if (d.grid && d.grid.width > 1) {
				var perm = make_pattern_perm(d, true);
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
				width: 3
			}
		},
		make_perm_rf: make_perm_rf,
		make_ui: function(d) {
			add_input_box(d, "width");
			add_inverse_ui(d);
		},
		title: "Rail Fence",
		process: function(d) {
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
		},
		title: "Char2Num",
		process: function(d) {
			var out = [];
			for (var i=0;i<d.input.length;i++) {
				var utp = d.data.str.indexOf(d.input[i]);
				if (utp != -1 && d.data.str[utp] != '_')
					out.push(utp);
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
				d.error = "Already grouped";
				d.output = d.input;
				return;
			}
			var output = [];
			var filler = d.data.width * 100000;
			var len = d.input.length - (d.data.width - 1)
			var i = 0;
			for (var i=0;i<len;i+=d.data.width) {
				var val = 0;
				for (var j=0;j<d.data.width;j++) {
					val *= 10;
					val += d.input[i + j];
				}
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
				var p = ungroup_number_to_str(d.input[x]);
				for (var i=0;i<p.length;i++)
					output.push(p.charAt(i) - '0');
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
						output.push(o2[i]);
					}
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
			var output = [];
			for (var i=0;i<d.input.length;i++)
				if (d.data.always_nulls.indexOf(d.input[i]) == -1)
					output.push(d.input[i]);
			d.output = output;
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
				if (typeof d.input == "string")
					d.ui.textContent = d.input;
				else {
					var tmp = [];
					for (var i=0;i<d.input.length;i++) {
						var v = d.input[i];
						if (typeof v == "number" && v >= 100)
							tmp.push(String(v).substring(1));
						else
							tmp.push(v);
					}
					d.ui.textContent = tmp.join('');
				}
			}
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
					d.error = "No transpose of incomplete matrix"
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
			var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
			var output = [];
			for (var y=0;y<height;y++) {
				var src_y = y;
				if (d.data.double)
					src_y = order[y].index;
				for (var x=0;x<d.grid.width;x++) {
					var outp = order[x].index;
					var idx = src_y * d.grid.width + outp;
					if (idx < d.input.length)
						output.push(d.input[idx]);
					else
						output.push('-1');
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

			var double = document.createElement('input');
			double.type = "checkbox";
			double.checked = d.data.double;
			double.onchange = function() {
				d.data.double = double.checked;
				document.fn_reprocess();
			}
			d.container.appendChild(double);

			var s2 = document.createElement('span');
			s2.textContent = 'Double';
			d.container.appendChild(s2);


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
				d.grid.width = d.grid.width / 2;
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
				bycols: false
			}; 
		},
		process: function(d) {
			var rows = [];
			for (var p=0;p<d.data.prefixes.length;p++) 
				rows.push([]);

			for (var i=0;i<d.input.length;i++) {
				var str = ungroup_number_to_str(d.input[i]);
				if (str.length > 1) {
					var idx = d.data.prefixes.indexOf(str.charAt(0));
					if (idx >= 0 && idx < rows.length)
						rows[idx].push(d.input[i]);
				}
			}
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
	function make_polyb_subst(d) {
		var real = new Array(25);
		var left = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
		var inp = d.data.box;
		for (var i=0;i<25;i++) {
			var c = inp.charAt(i);
			if (c != '?') {
				real[i] = c;
				left = left.replace(c, '');
			}
		}
		var c = 0;
		for (var i=0;i<25;i++) {
			if (inp.charAt(i) == '?') {
				real[i] = left.charAt(c++);
			}
		}
		return real;
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
			var real = make_polyb_subst(d);
			if (!d.data.inverse) {
				for (var i=0;i<d.input.length;i++) {
					var a = Math.floor(d.input[i] / 10) % 10;
					var b = d.input[i] % 10;
					var y = (5+a-1) % 5;
					var x = (5+b-1) % 5;
					var c = y*5+x;
					if (c >= 0 && c < 25) {
						indices.push(c);
						out.push(real[c]);
					}
				}
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
	exports.grid_view = {
		create: function() { 
			return {}; 
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
						rr.appendChild(b);
					}
					root.appendChild(rr);
				}
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('x-grid');
			d.container.appendChild(ta);
			return ta;
		},
		title: "Grid View"
	};	
});