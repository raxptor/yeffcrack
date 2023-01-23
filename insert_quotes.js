const fs = require('fs');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database("quotes.sqlite3", (err) => {
	if (err) {
		console.error(err.message);
		console.log("Failed to open database.");
		exit(-1);
	} else {
		const allFileContents = fs.readFileSync('data/quotes.txt', 'utf-8');
		allFileContents.split(/\r?\n/).forEach(line =>  {
			var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
				db.run("INSERT INTO decrypt (uncracked, eval, length, steps) VALUES (?, ?, ?, ?)", [out.join(''), 666, out.length, scramblabet.join('')]);
			}
		});
	}
});



