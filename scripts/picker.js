define(function(require, exports, module) {
	exports.pick = function(opts, fn) {
		var modal = document.createElement('x-modal');
		document.body.appendChild(modal);
		var box = document.createElement('x-dialog-box');

		function leave() {
			document.body.removeChild(box);
			document.body.removeChild(modal);
		}

		for (var x in opts) {
			(function(x) {
				var btn = document.createElement('button');
				btn.textContent = opts[x];
				btn.classList.add('picker');
				btn.onclick = function() {
					leave();
					fn(x);
				}
				box.appendChild(btn);
			})(x);
		}

		var btn = document.createElement('button');
		btn.textContent = 'CANCEL';
		btn.classList.add('picker');

		btn.onclick = function() {
			leave();
		};
		box.appendChild(btn);
		document.body.appendChild(box);
	}
})
