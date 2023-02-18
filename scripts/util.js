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
		
		// We don't care about last 3
		for (var i=0;i<(str.length-3);i++) {
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

	// computes number of repeated bigrams
	exports.compute_repeated_bigrams = function(str) {
		if (str.length < 3)
			return 0;
		var seen = new Array(26*26);
		var s = str.charCodeAt(0) - 65;
		var reps = 0;
		for (var i=1;i<str.length;i++) {
			var t = str.charCodeAt(i) - 65;
			var idx = 25*s + t;
			if (seen[idx] > 0) {
				reps++;
			} else {
				seen[idx] = 1;
			}
			s = t;
		}
		return reps;
	}	
})