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
})