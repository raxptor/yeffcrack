define(function(require, exports, module) {
	exports.input = {
		create: function(d) { // returns 'data' object
			return {
				text: `75628 28591 62916 48164 91748 58464 74748 28483 81638 18174 74826 26475 83828 49175 74658 37575 75936 36565 81638 17585 75756 46282 92857 46382 75748 38165 81848 56485 64858 56382 72628 36281 81728 16463 75828 16483 63828 58163 63630 47481 91918 46385 84656 48565 62946 26285 91859 17491 72756 46575 71658 36264 74818 28462 82649 18193 65626 48484 91838 57491 81657 27483 83858 28364 62726 26562 83759 27263 82827 27283 82858 47582 81837 28462 82837 58164 75748 58162 92000`
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('textarea');
			ta.textContent = String(d.data.text).replace('\n', '').replace('\r', '').trim();
			console.log(d);
			d.container.appendChild(ta);
			return ta;
		},
		title: "Input",
		process: function(d) {
			console.log("process", d);
			var txt = d.data.text;
			var map = {
				'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8':8, '9':9
			};
			var output = [];
			for (var i=0;i<txt.length;i++) {
				var r = map[txt.charAt(i)];
				if (r !== undefined)
					output.push(r);
			}
			d.output = output;
		}
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
					output[j++] = d.input[i] * 10 + d.input[i+1];
				}
				d.output = output;
			}
			if (d.grid)
				d.grid.width = d.grid.width / 2;
			console.log(d.input);
			return d.input;
		},
		make_ui: function(root) {
			
		},
		title: "PairUp"
	};
	exports.remove_nulls = {
		create: function() { return {
			last_nulls: {
				0: true
			},
			always_nulls: ""
		}; },
		process: function(d) {
			var output = [];
			for (var i=0;i<d.input.length;i++)
				if (d.data.always_nulls.indexOf(d.input[i]) == -1)
					output.push(d.input[i]);
			var last_nulls = d.data.last_nulls;
			var kill = 0;
			while (output.length > 0 && last_nulls[output[output.length-1]] === true) {
				output.pop();
				if (++kill > 3000) {
					console.log("aah");
					break;
				}
			}
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
		title: "RemoveNulls"
	};
	exports.output = {
		create: function() { return {}; },
		process: function(d) {
			if (d.ui) {
				d.ui.textContent = d.input.join('');
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('textarea');
			ta.textContent = "";
			d.container.appendChild(ta);
			return ta;
		},
		title: "Output"
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
			}
		},
		make_ui: function(d) {
		},
		title: "Transpose"
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
		title: "CutHalf"
	};
	exports.polybius = {
		create: function() { 
			return {
				box: "ABCDEFGHIKLMNOPQRSTUVWXYZ"
			}; 
		},
		process: function(d) {
			var out = [];
			for (var i=0;i<d.input.length;i++) {
				var a = Math.floor(d.input[i] / 10);
				var b = d.input[i] % 10;
				var c = (a-1)*5+(b-1);
				if (c >= 0 && c < 25) {
					out.push(d.data.box.charAt(c));
				}
			}
			d.output = out;
		},
		make_ui: function(d) {
		},
		title: "Polybius"
	};	
	exports.grid_view = {
		create: function() { 
			return {}; 
		},
		process: function(d) {
			d.output = d.input;
			if (d.ui && d.grid) {
				var rows = [];
				var height = Math.floor((d.input.length + d.grid.width - 1)/(d.grid.width));
				for (var y=0;y<height;y++) {
					rows.push(d.input.slice(y*d.grid.width, (y+1)*d.grid.width).join(' '));
				}
				d.ui.textContent = rows.join('\n');
			}
		},
		make_ui: function(d) {
			var ta = document.createElement('textarea');
			ta.classList.add('gridview');
			ta.textContent = "";
			d.container.appendChild(ta);
			return ta;			
		},
		title: "Grid View"
	};	

	exports.polybius_view = {
		create: function() { return {}; },
		process: function(d) {
			d.output = d.input;
		},
		make_ui: function(root) {
			
		},
		title: "Polybius View"
	};	
});