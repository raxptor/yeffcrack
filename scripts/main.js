define(function(require, exports, module) {

	var all_mods = require('scripts/mods/all.js');

	function draw_cracks(cks) {
		var root = document.getElementById('cracks-list');
		var uis = [];		
		for (var x in cks) {
			var ck = cks[x];
			var el_enabled = document.createElement('input');
			el_enabled.setAttribute("type", "checkbox");
			el_enabled.checked = true;
			(function(el, ck) {
				el.onchange = function() {
					ck.enabled = el.checked;
					document.fn_reprocess();
				}
			})(el_enabled, ck);
			var el_crack = document.createElement('x-crack');
			var el_info = document.createElement('x-crack-info');
			var el_content = document.createElement('x-crack-content');
			el_crack.appendChild(el_enabled);
			el_crack.appendChild(el_info);
			el_crack.appendChild(el_content);
			var name = document.createElement('span');
			name.innerText = all_mods[ck.type].title;
			el_info.appendChild(name);
			uis.push(all_mods[ck.type].make_ui({
				fn_rebuild: function() { document.fn_rebuild(); },
				fn_reprocess: function() { document.fn_reprocess(); },
				container: el_content,
				data: ck.data
			}));
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

	function process_cracks(cracks, uis) {
		var d = {
		};
		for (var i=0;i<cracks.length;i++) {
			if (!cracks[i].enabled)
				continue;
			d.ui = uis[i];
			d.data = cracks[i].data;
			delete d.output;
			cracks[i].cls.process(d);
			if (d.error)
				console.log(d.error);
			console.log(cracks[i].type, "outputed", d.output);
			d.input = d.output;
		}
	}
	
	exports.startup = function() {
		var cracks = create_default_instances(['input', 'remove_nulls', 'make_grid', 'transpose', 'pair_up', 'transpose', 'cut_half', 'polybius', 'grid_view', 'output']);
		var uis;
		document.fn_rebuild = function() {
			console.log("Reload!");
			var root = document.getElementById('cracks-list');
			while (root.childNodes.length > 0) {
				root.removeChild(root.childNodes[0]);
			}
			uis = draw_cracks(cracks);
			process_cracks(cracks, uis);
		}
		document.fn_reprocess = function() {
			process_cracks(cracks, uis);
		}
		document.fn_rebuild();
	};
});
