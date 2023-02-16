define(function(require, exports, module) {

	var all_mods = require('scripts/mods/all.js');
	var codegen = require('scripts/mods/codegen.js');
	var picker = require('scripts/picker.js');

	function serialize(cracks) {
		var storage = [2];
		for (var x in cracks) {
			storage.push( {
				t: cracks[x].type,
				d: cracks[x].data,
				e: cracks[x].enabled
			});
		}
		return btoa(JSON.stringify(storage));
	}

	function deserialize(txt) {
		if (txt.length < 4)
			return;
		var arr = JSON.parse(atob(txt.substr(1)));
		console.log("It is", arr);
		var cracks = [];
		if (arr[0] == 1) {
			// patch v1 to v2
			for (var x=1;x<arr.length;x++) if (arr[x].t == "pair_up") { arr[x].t = "group_up"; arr[x].d = { width: 2} }
			arr[0] = 2;
		}
		if (arr == undefined || arr.length < 2 || arr[0] != 2)
			return null;
		for (var x=1;x<arr.length;x++) {
			if (!all_mods[arr[x].t])
				continue;
			cracks.push({
				type: arr[x].t,
				data: arr[x].d,
				enabled: arr[x].e,
				cls: all_mods[arr[x].t]
			});
		}
		console.log("Deserialized", cracks);
		return cracks;
	}

	function mk_insert_button(cracks, idx) {
		var btn = document.createElement('button');
		btn.textContent = "InsertCk " + idx;
		btn.classList.add('insert');
		btn.onclick = function() {
			var list = [];
			for (var x in all_mods.modules_for_add) {
				list.push(all_mods[all_mods.modules_for_add[x]].title);
			}
			picker.pick(list, function(opt) {
				var tn = all_mods.modules_for_add[opt];
				var mod = all_mods[tn];
				console.log("picked", opt, " ", idx);
				cracks.splice(idx, 0, {
					cls: mod,
					type: tn,
					data: mod.create(),
					enabled: true
				});
				document.fn_rebuild();
			});
		};
		return btn;
	}

	function mk_delete_button(cracks, idx) {
		var btn = document.createElement('button');
		btn.textContent = "Rm";
		btn.classList.add('insert');
		btn.onclick = function() {
			cracks.splice(idx, 1);
			document.fn_rebuild();
		}
		return btn;
	}

	function draw_cracks(cks) {
		var root = document.getElementById('cracks-list');
		var uis = [];
		for (var x in cks) {
			var ck = cks[x];
			var el_enabled = document.createElement('input');
			el_enabled.setAttribute("type", "checkbox");
			el_enabled.checked = ck.enabled;
			(function(el, ck) {
				el.onchange = function() {
					ck.enabled = el.checked;
					document.fn_reprocess();
				}
			})(el_enabled, ck);
			var el_crack = document.createElement('x-crack');
			var el_info = document.createElement('x-crack-info');
			var el_content = document.createElement('x-crack-content');
			if (!ck.cls.prevent_delete) {
				el_crack.appendChild(mk_delete_button(cks, x));
			}
			el_crack.appendChild(el_enabled);
			el_crack.appendChild(el_info);
			el_crack.appendChild(el_content);
			var name = document.createElement('span');
			name.innerText = x + "." + all_mods[ck.type].title;
			el_info.appendChild(name);
			uis.push(all_mods[ck.type].make_ui({
				fn_rebuild: function() { document.fn_rebuild(); },
				fn_reprocess: function() { document.fn_reprocess(); },
				container: el_content,
				data: ck.data
			}));
			var cont = document.createElement('x-buttons');
			(function(x) {
				if (Number(x) > 0 || !cks[0].type.startsWith('input'))
				cont.appendChild(mk_insert_button(cks, Number(x)));
			})(x);
			root.appendChild(cont);
			root.appendChild(el_crack);
		}
		return uis;
	}

	function create_default_instances(types) {
		var cracks = [];
		for (var x in types) {
			cracks.push({
				type: types[x],
				cls: all_mods[types[x]],
				data: all_mods[types[x]].create(),
				enabled: true
			});
		}
		return cracks;
	}

	function generate_code(cracks, start, input, process_start_d, process_result_d) {
		var lines = [];
		var inp = [];
		var inp_len;
		console.log("INPUT:", input, typeof input);
		if (typeof input == "string") {
			inp.push(input);
			inp_len = input.length;
		} else {
			for (var x in input) {
				var cc = input[x];
				if (typeof cc == 'number') {
					if (cc >= 100) {
						var val = cc % 100;
						inp.push("\\x" + Math.floor(val/10) + Math.floor(val%10));
					} else {
						inp.push("\\x" + Math.floor(cc));
					}
				} else {
					inp.push(cc);
				}
			}
			inp_len = inp.length;
		}
		lines.push("//" + location.hash);
		lines.push("#include <memory.h>");
		lines.push("#include <stdio.h>");
		lines.push("#include <string.h>");		
		lines.push("#include \"all.h\"");
		lines.push("void permutation_walk(char* p, MTRand* rand, int len);");
		lines.push("const char* word_get_random(int length, MTRand* rand);");
		lines.push("int score(const char* buf, int length);");
		lines.push("typedef struct Algo_t {");
		for (var c=start;c<cracks.length;c++) {
			if (!cracks[c].enabled)
				continue;
			var gen = codegen[cracks[c].type];
			if (gen && gen.struct) {
				gen.struct({
					prefix: cracks[c].type + "_" + c,
					lines: lines,
					data: cracks[c].data
				});
			}
		}

		lines.push("} Algo;");
		lines.push(`int algo_size() { return sizeof(Algo); }`);
		lines.push(`int algo_is_fractionated() { return ${process_result_d.is_fractionated ? 1 : 0}; };`);
		lines.push(`void algo_initial_guess(void* ptr, int as_given, MTRand* rand) {\n\tAlgo* inst = (Algo*)ptr;`);
		for (var c=start;c<cracks.length;c++) {
			if (!cracks[c].enabled)
				continue;
			var gen = codegen[cracks[c].type];
			if (gen && gen.initial_guess) {
				gen.initial_guess({
					prefix: cracks[c].type + "_" + c,
					lines: lines,
					data: cracks[c].data
				});
			}
		}
		lines.push("}");
		lines.push(`void algo_random_walk(void* ptr, long mask, MTRand* rand) {\n\tAlgo* inst = (Algo*)ptr;`);
		for (var c=start;c<cracks.length;c++) {
			if (!cracks[c].enabled)
				continue;
			var gen = codegen[cracks[c].type];
			if (gen && gen.random_walk) {
				if (gen.mask_name)
					lines.push("\tif (mask & " + gen.mask_name() + ") {");
				else
					lines.push("\t{");
				gen.random_walk({
					prefix: cracks[c].type + "_" + c,
					lines: lines,
					data: cracks[c].data
				});
				lines.push("\t}");
			}
		}
		lines.push("}");

		lines.push(`void algo_reset(void* ptr, algo_reset_data* rd) {\n\tAlgo* inst = (Algo*)ptr;`);
		for (var c=start;c<cracks.length;c++) {
			if (!cracks[c].enabled)
				continue;
			var gen = codegen[cracks[c].type];
			if (gen && gen.reset) {
				lines.push("\tif (rd->" + cracks[c].type + ") {");
				gen.reset({
					prefix: cracks[c].type + "_" + c,
					lines: lines,
					data: cracks[c].data
				});
				lines.push("\t}");
			}
		}
		lines.push("}");

		//lines.push(`int algo_score(void* ptr, t_score_fn fn, int print) {\n\tAlgo* inst = (Algo*)ptr;`);
		lines.push(`void algo_run(algo_run_data* run, int print) { Algo* inst = (Algo*)run->crack;`);
		lines.push("int input_len = " + inp_len + ";");
		lines.push("const unsigned char *input = \"" + inp.join('') + "\";");
		lines.push("");
		lines.push("const unsigned char* cur_in = input;");
		lines.push("int cur_in_len = input_len;");
		lines.push("unsigned char* cur_out = run->tmp0;");
		lines.push("int cur_out_len = input_len;");
		lines.push("");
		var d = process_start_d;
		d.input = input;
		delete d.ui;
		var bs = 0;		
		for (var c=start;c<cracks.length;c++) {
			if (!cracks[c].enabled)
				continue;
			d.data = cracks[c].data;
			lines.push("// " + cracks[c].cls.title);
			var gen = codegen[cracks[c].type];
			if (gen && gen.write) {
				gen.write({
					prefix: cracks[c].type + "_" + c,
					lines: lines,
					data: cracks[c].data,
					process_d: d,
				});
				lines.push("cur_in_len = cur_out_len;");
				lines.push("cur_in = cur_out;");
				lines.push("cur_out = run->tmp" + ((++bs)%2) + ";");
			}
			cracks[c].cls.process(d);
			d.input = d.output;
		}
		lines.push(`	
		if (print) {
			printf("Output is: ");
			for (int i = 0; i < cur_in_len; i++)
				printf("%c", cur_in[i]);
			printf(" ");`);

		for (var c=start;c<cracks.length;c++) {
			if (!cracks[c].enabled)
				continue;
			var gen = codegen[cracks[c].type];
			if (gen && gen.print) {
				lines.push("printf(\" " + cracks[c].type + ":\");");
				gen.print({
					prefix: cracks[c].type + "_" + c,
					lines: lines,
					data: cracks[c].data
				});
			}
		}	
		lines.push(`
			printf("\\n");
		}`);
		lines.push("	run->output = (char*)cur_in;");
		lines.push("	run->length = cur_in_len;");
		lines.push("}");
		return lines.join("\n").replaceAll("\t\t\t", "");
	}

	function process_cracks(cracks, uis) {
		var d = { input: "" };
		var input_at_step = 1;
		var input_data = "";
		var got_crack_step = false;
		var d_at_start = null;
		for (var i=0;i<cracks.length;i++) {
			if (!cracks[i].enabled)
				continue;
			try {
				d.ui = uis[i];
				d.data = cracks[i].data;
				delete d.output;
				if (cracks[i].cls.crack_step && !d_at_start) {
					d_at_start = JSON.parse(JSON.stringify(d));
				}
				cracks[i].cls.process(d);
				if (d.error)
					console.log(d.error);
				//console.log(cracks[i].type, "outputed", d.output);
				if (!got_crack_step && (cracks[i].cls.crack_step || (i == cracks.length-1))) {
					input_at_step = i;
					input_data = d.input;
					console.log("Actual input happens at step ", input_at_step, " with data ", d.input);
					got_crack_step = true;
				}
				d.input = d.output;
			} catch (e) {
				console.error(e);
				return false;
			}
		}
		if  (uis) {
			document.getElementById('code').textContent = generate_code(cracks, input_at_step, input_data, d_at_start, d)
		}
		return true;
	}
	
	exports.startup = function() {
		/* 'make_grid', 'transpose', 'group_up', 'transpose', 'cut_half', 'polybius', 'grid_view', */
		var cracks = deserialize(location.hash) || create_default_instances(['input', 'output']);
		var uis;
		document.fn_rebuild = function() {
			console.log("Reload!");
			var root = document.getElementById('cracks-list');
			while (root.childNodes.length > 0) {
				root.removeChild(root.childNodes[0]);
			}
			uis = draw_cracks(cracks);
			document.fn_reprocess(uis);
		}
		document.fn_reprocess = function() {
			this.location.hash = '#' + serialize(cracks);
			if (!process_cracks(cracks, uis)) {
				document.body.classList.add('error');
			} else {
				document.body.classList.remove('error');
			}
		}
		document.fn_rebuild();
	};

	exports.load_steps = function(steps) {
		for (var i=0;i<steps.length;i++) {
			steps[i].enabled = true;
		}
		steps.push({
			type: "output",
			enabled: true
		});
		location.hash = serialize(steps);
		this.startup();
	}

});
