define(function(require, exports, module) {

	exports.make_chinese_vert = function(d) {
		var down = true;
		var out = [];
		for (var x=d.width-1;x>=0;x--) {
			var column = [];
			for (var y=0;y<height;y++) {
				column.push(y*d.width+x);
			}
			out = down ? out.concat(column) : out.concat(column.reverse());
			down = !down;
		}
	}

	function xy(d, i) {
		return {
			x: i % d.width,
			y: Math.floor(i / d.with)
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
		return perm.map(idx => {
			var c = xy(d, idx);
			return idx(d, c.x, d.height - c.y - 1);
		});
	}

	exports.make_megapatterns = function(config, length, width) {
		var height = Math.floor(length / width);
		if (length != height * width) {
			console.error("Megapatterns don't support incomplete rectangles.");
			return [];
		}
		var d = {
			width: width,
			height: height,
			length: length
		};

		var chinese = make_chinese_vert(d);
		console.log(chinese);
		console.log(vert_mirror(d, chinese));

		var start = [];
		for (var y=0;y<height;y++) {
			for (var x=0;x<width;x++) {

			}
		}
	};
});