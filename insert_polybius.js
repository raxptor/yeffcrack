const fs = require('fs');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("polybius.sqlite3", (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		const allFileContents = fs.readFileSync('data/wordlist10000.txt', 'utf-8');
		var coll = [];
		allFileContents.split(/\r?\n/).forEach(line =>  {
			var word = line.toUpperCase().trim();
			word = word.replace('J', 'I');
			if (word.length < 3)
				return;
			var used = {};
			var outp = [];
			for (var i=0;i<word.length;i++) {
				var c = word[i];
				if (!used[c]) {
					used[c] = true;
					outp.push(c);
				}
			}			
			var alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
			for (var i=0;i<alphabet.length;i++) {
				var c = alphabet[i];
				if (!used[c]) {
					used[c] = true;
					outp.push(c);
				}
			}
			var polyb = outp.join('');
			coll.push(polyb);
			if (coll.length > 16) {
				db.run("INSERT INTO decrypt (uncracked, meta_transposition_order, eval, length) VALUES (?, ?, 666, 1)", [
					"5225121414145444424313114422453241545355533551315555422254325431514545455322232112143521433251333441114354545524225151412545515324412422411352444135411524335234222523522322223254521324223514545122",
					coll.join('')
				]);
				console.log(coll.join(''));
				coll = [];
			}			
			
			/*			
			var left = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
			var scramblabet = [];
			for (var i=0;i<25;i++) {
				var pick = Math.floor(Math.random()*10000000) % left.length;
				scramblabet.push(alphabet.charAt(left[pick]));
				left.splice(pick, 1);
			}	
			var out = [];
			var sol = [];
			var upr = line.toUpperCase();
			for (var i=0;i<upr.length;i++) {
				var c = upr.charAt(i);
				if (c == 'J') c = 'I';
				var d = alphabet.indexOf(c);
				if (d != -1) {
					sol.push(c);
					out.push(scramblabet[d]);
				}
			}

			if (out.length > 0) {
				console.log("Scramblabet is ", scramblabet.join(''));
				console.log(`Line from file: ${line}`);
				console.log(`${out.join('')} => ${sol.join('')}`);
				
			}
			*/
		});
	}
});



