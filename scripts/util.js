define(function(require, exports, module) {
	exports.normalize = function(str) {
		let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var assigned = {};
		var outp = [];
		var pp = 0;
		for (var i=0;i<str.length;i++) {
			var c = str.charAt(i);
			if (!assigned[c]) {
				assigned[c] = alphabet[pp++];
			}
			outp.push(assigned[c]);
		}
		return outp.join('');
	}

	// computes penalties for repeated letters from doubles and up.
	exports.compute_penalty = function(str) {
		var last = 0;
		var rl = 0;
		var occurences = [0,0,0,0,0,0,0,0,0,0,0,0];
		
		// We don't care about last 14 because maybe that is a junk row in the cipher.
		for (var i=0;i<(str.length-14);i++) {
			if (str[i] != last) {
				last = str[i];
				rl = 1;
			} else {
				++rl;
				if (rl == 10) 
					return 1234567890;
				occurences[rl]++;
			}
		}
		var sum = 0;
		var multiplier = 1;
		for (var i=2;i<10;i++) {
			sum += multiplier * occurences[i];
			multiplier *= 10;
		}

		return sum;
	}
})