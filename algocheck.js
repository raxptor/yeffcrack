var amd = require('./scripts/amd-loader.js');
var all_mods = require('./scripts/mods/all.js');
var algocheck = require('./scripts/algocheck.js');

algocheck.run_algocheck(require('./algoconf.json'));

