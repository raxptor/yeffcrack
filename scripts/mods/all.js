define(function(require, exports, module) {

	exports.modules_for_add = ['input_text', 'make_grid', 'pair_up', 'remove_characters', 'transpose', 'cut_half', 'grid_pattern', 'cut_half_tb', 'polybius', 'grid_view', 'coltransp'];

	function add_inverse_ui(d) {
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
			console.log(d);
			d.container.appendChild(ta);
			return ta;
		},
		title: "Input - numbers (ignore space)",
		prevent_delete: true,
		process: function(d) {
			console.log("process", d);
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
			console.log(map, "=>", output);
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
		prevent_delete: true,
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
			width.onchange = function() {
				d.data.width = Number(width.value);
				d.fn_reprocess();
			};
			return {
				width: width
			};
		},
		title: "Make Grid",
		process: function(d) {
			d.grid = {
				width: d.data.width
			}
			d.output = d.input;
		}
	};

	function make_pattern_perm(d) {
		var perm = [];
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
				"RowFlipOdd"  : "Reverse odd rows",
				"HorizMirror" : "Mirror horizontally"
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
				var perm = make_pattern_perm(d);
				if (d.data.inverse) {
					// regular
					var output = new Array(d.input);
					for (var i=0;i<d.input.length;i++) {
						var s = perm[i];
						if (s < d.input.length)
							output[s] = d.input[i];
						else
							output.push(-1);
					}
				} else {
					// regular
					for (var i=0;i<perm.length;i++) {
						var s = perm[i];
						if (s < d.input.length)
							output.push(d.input[s]);
						else
							output.push(-1);
					}
				}
				d.output = output;
			} else {
				d.output = d.input;
			}
		}
	};
	exports.pair_up = {
		create: function() { return {}; },
		process: function(d) {
			if ((d.input.length % 2) != 0) {
				d.error = "Length not divisible by 2... " + d.input.length;
				d.output = [];
			} else {
				var output = new Array(d.input.length/2);
				var j = 0;
				for (var i=0;i<d.input.length;i+=2) {
					output[j++] = 100 + d.input[i] * 10 + d.input[i+1];
				}
				d.output = output;
			}
			if (d.grid)
				d.grid.width = d.grid.width / 2;
			if (d.columns_are_random)
				d.is_fractionated = true;
			return d.input;
		},
		make_ui: function(root) {
			
		},
		title: "PairUp"
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
	exports.transpose = {
		create: function() { 
			return {}; 
		},
		process: function(d) {
			d.output = output;
			if (d.grid) {
				var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
				var output = [];
				for (var x=0;x<d.grid.width;x++) {
					for (var y=0;y<height;y++) {
						var idx = y * d.grid.width + x;
						if (idx < d.input.length)
							output.push(d.input[idx]);
						else
							output.push(-1);
					}
				}
				d.output = output;
				d.grid.width = height;
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
	exports.polybius = {
		create: function() { 
			return {
				box: "ABCDEFGHIKLMNOPQRSTUVWXYZ",
				inverse: false
			}; 
		},
		process: function(d) {
			var out = [];
			var indices = [];

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
			if (!d.data.inverse) {
				for (var i=0;i<d.input.length;i++) {
					var a = Math.floor(d.input[i] / 10);
					var b = d.input[i] % 10;
					var y = (a-1) % 5;
					var x = (b-1) % 5;
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
				for (var y=0;y<height;y++) {
					var rr = document.createElement('x-grid-row');
					for (var x=0;x<d.grid.width;x++) {
						var b = document.createElement('x-grid-entry');
						var idx = y*d.grid.width+x;
						if (idx < d.input.length) {
							if (typeof d.input[idx] == 'string')
								b.textContent = d.input[idx];
							else if (d.input[idx] >= 0) {
								var val = d.input[idx];
								if (val >= 100)
									b.textContent = String(val).slice(1, 3);
								else
									b.textContent = val; 
							} else {
								b.textContent = '?';
							}
						} else {
							b.textContent = '!';
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