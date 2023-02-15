var amd = require('./scripts/amd-loader.js');
var mp = require('./scripts/mods/megapatterns.js');

var p = mp.make_megapatterns({ 
    messed_up_chinese: true,
    reduced_variants: true,
    split_product: true,
    no_horizontal: false,
    no_vertical: true,
    split: "tb"
}, 14*14, 14);

