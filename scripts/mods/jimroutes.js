define(function(require, exports, module) {
	exports.spiral = function(perm, width, height, rot) {
		var diameter = width > height ? width : height;
		var radius = diameter / 2;
		var cx = width / 2;
		var cy = height / 2;
		var x0, y0, dx, dy;
		var rs0, rs1;
		if (rot == 0) {
			x0 = 0; y0 = 0; dx = 1; dy = 0; rs0 = width; rs1 = height;
		} else if (rot == 1) {
			x0 = width - 1; y0 = 0; dx = 0; dy = 1; rs0 = height; rs1 = width;
		} else if (rot == 2) {
			x0 = width - 1; y0 = height - 1; dx = -1; dy = 0; rs0 = width; rs1 = height;
		} else if (rot == 3) {
			x0 = 0; y0 = height - 1; dx = 0; dy = -1; rs0 = height; rs1 = width;
		}
		x0 -= dx;
		y0 -= dy;
		var used = {};
		var steps = diameter;
		var count = 0;
		var done = false;
		for (var w=0;w<diameter;w++)
		{
			//console.log("I start spiral (", rs0, " ", rs1, ") steps=" + steps + " at ", x0, y0, " dim=", rs0, rs1);
			for (var runs=0;runs<4;runs++)
			{
				//console.log("My direction is ", dx, dy, " with run lengths ", rs0, rs1);
				var run_length;
				switch (runs) {
					case 0: run_length = rs0; break;
					case 1: run_length = rs0 - 1; break;
					case 2: run_length = rs0 - 1; break;
					case 3: run_length = rs0 - 2; break;
				}
				if (run_length <= 0) {
					//console.log("DONE");
					done = true;
					break;
				}
				for (var k=0;k<run_length;k++)
				{
					x0 += dx;
					y0 += dy;
					var idx = y0 * width + x0;
					//console.log("aaah" ,x0, y0);
					perm.push(idx);
					++count;
				}
				var t = dy;
				dy = dx;
				dx = -t;
				
				t = rs1;
				rs1 = rs0;
				rs0 = t;
			}
			if (done) {
				break;
			}
			rs0 -= 2;
			rs1 -= 2;
		}
		if (perm.length != width*height) {
			console.error("ERROR in spiral for ", width, height, rot);
			console.error("Perm length=", perm, " but expected", width*width);
		}
	}
});