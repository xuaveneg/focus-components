'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Simple, lightweight, usable local autocomplete library for modern browsers
 * Because there weren’t enough autocomplete scripts in the world? Because I’m completely insane and have NIH syndrome? Probably both. :P
 * @author Lea Verou http://leaverou.github.io/awesomplete
 * MIT license
 */

(function () {

	var _ = function _(input, o) {
		var me = this;

		// Setup

		this.input = $(input);
		this.input.setAttribute('autocomplete', 'false');
		this.input.setAttribute('aria-autocomplete', 'list');

		o = o || {};

		configure.call(this, {
			minChars: 2,
			maxItems: 10,
			autoFirst: false,
			filter: _.FILTER_CONTAINS,
			sort: _.SORT_BYLENGTH,
			item: function item(text, input) {
				return $.create('li', {
					innerHTML: text.replace(RegExp($.regExpEscape(input.trim()), 'gi'), '<mark>$&</mark>'),
					'aria-selected': 'false'
				});
			},
			replace: function replace(text) {
				this.input.value = text;
			}
		}, o);

		this.index = -1;

		// Create necessary elements

		this.container = $.create('div', {
			className: 'awesomplete',
			around: input
		});

		this.ul = $.create('ul', {
			hidden: '',
			inside: this.container
		});

		this.status = $.create('span', {
			className: 'visually-hidden',
			role: 'status',
			'aria-live': 'assertive',
			'aria-relevant': 'additions',
			inside: this.container
		});

		// Bind events

		$.bind(this.input, {
			'input': this.evaluate.bind(this),
			'blur': this.close.bind(this),
			'keydown': function keydown(evt) {
				var c = evt.keyCode;

				// If the dropdown `ul` is in view, then act on keydown for the following keys:
				// Enter / Esc / Up / Down
				if (me.opened) {
					if (c === 13 && me.selected) {
						// Enter
						evt.preventDefault();
						me.select();
					} else if (c === 27) {
						// Esc
						me.close();
					} else if (c === 38 || c === 40) {
						// Down/Up arrow
						evt.preventDefault();
						me[c === 38 ? 'previous' : 'next']();
					}
				}
			}
		});

		$.bind(this.input.form, { 'submit': this.close.bind(this) });

		$.bind(this.ul, { 'mousedown': function mousedown(evt) {
				var li = evt.target;

				if (li !== this) {

					while (li && !/li/i.test(li.nodeName)) {
						li = li.parentNode;
					}

					if (li) {
						me.select(li);
					}
				}
			} });

		if (this.input.hasAttribute('list')) {
			this.list = '#' + input.getAttribute('list');
			input.removeAttribute('list');
		} else {
			this.list = this.input.getAttribute('data-list') || o.list || [];
		}

		_.all.push(this);
	};

	_.prototype = {
		set list(list) {
			if (Array.isArray(list)) {
				this._list = list;
			} else if (typeof list === 'string' && list.indexOf(',') > -1) {
				this._list = list.split(/\s*,\s*/);
			} else {
				// Element or CSS selector
				list = $(list);

				if (list && list.children) {
					this._list = slice.apply(list.children).map(function (el) {
						return el.textContent.trim();
					});
				}
			}

			if (document.activeElement === this.input) {
				this.evaluate();
			}
		},

		get selected() {
			return this.index > -1;
		},

		get opened() {
			return this.ul && this.ul.getAttribute('hidden') == null;
		},

		close: function close() {
			this.ul.setAttribute('hidden', '');
			this.index = -1;

			$.fire(this.input, 'awesomplete-close');
		},

		open: function open() {
			this.ul.removeAttribute('hidden');

			if (this.autoFirst && this.index === -1) {
				this.goto(0);
			}

			$.fire(this.input, 'awesomplete-open');
		},

		next: function next() {
			var count = this.ul.children.length;

			this.goto(this.index < count - 1 ? this.index + 1 : -1);
		},

		previous: function previous() {
			var count = this.ul.children.length;

			this.goto(this.selected ? this.index - 1 : count - 1);
		},

		// Should not be used, highlights specific item without any checks!
		goto: function goto(i) {
			var lis = this.ul.children;

			if (this.selected) {
				lis[this.index].setAttribute('aria-selected', 'false');
			}

			this.index = i;

			if (i > -1 && lis.length > 0) {
				lis[i].setAttribute('aria-selected', 'true');
				this.status.textContent = lis[i].textContent;
			}

			$.fire(this.input, 'awesomplete-highlight');
		},

		select: function select(selected) {
			selected = selected || this.ul.children[this.index];

			if (selected) {
				var prevented;

				$.fire(this.input, 'awesomplete-select', {
					text: selected.textContent,
					preventDefault: function preventDefault() {
						prevented = true;
					}
				});

				if (!prevented) {
					this.replace(selected.textContent);
					this.close();
					$.fire(this.input, 'awesomplete-selectcomplete');
				}
			}
		},

		evaluate: function evaluate() {
			var me = this;
			var value = this.input.value;

			if (value.length >= this.minChars && this._list.length > 0) {
				this.index = -1;
				// Populate list with options that match
				this.ul.innerHTML = '';

				this._list.filter(function (item) {
					return me.filter(item, value);
				}).sort(this.sort).every(function (text, i) {
					me.ul.appendChild(me.item(text, value));

					return i < me.maxItems - 1;
				});

				if (this.ul.children.length === 0) {
					this.close();
				} else {
					this.open();
				}
			} else {
				this.close();
			}
		}
	};

	// Static methods/properties

	_.all = [];

	_.FILTER_CONTAINS = function (text, input) {
		return RegExp($.regExpEscape(input.trim()), 'i').test(text);
	};

	_.FILTER_STARTSWITH = function (text, input) {
		return RegExp('^' + $.regExpEscape(input.trim()), 'i').test(text);
	};

	_.SORT_BYLENGTH = function (a, b) {
		if (a.length !== b.length) {
			return a.length - b.length;
		}

		return a < b ? -1 : 1;
	};

	// Private functions

	function configure(properties, o) {
		for (var i in properties) {
			var initial = properties[i],
			    attrValue = this.input.getAttribute('data-' + i.toLowerCase());

			if (typeof initial === 'number') {
				this[i] = parseInt(attrValue);
			} else if (initial === false) {
				// Boolean options must be false by default anyway
				this[i] = attrValue !== null;
			} else if (initial instanceof Function) {
				this[i] = null;
			} else {
				this[i] = attrValue;
			}

			if (!this[i] && this[i] !== 0) {
				this[i] = i in o ? o[i] : initial;
			}
		}
	}

	// Helpers

	var slice = Array.prototype.slice;

	function $(expr, con) {
		return typeof expr === 'string' ? (con || document).querySelector(expr) : expr || null;
	}

	function $$(expr, con) {
		return slice.call((con || document).querySelectorAll(expr));
	}

	$.create = function (tag, o) {
		var element = document.createElement(tag);

		for (var i in o) {
			var val = o[i];

			if (i === 'inside') {
				$(val).appendChild(element);
			} else if (i === 'around') {
				var ref = $(val);
				ref.parentNode.insertBefore(element, ref);
				element.appendChild(ref);
			} else if (i in element) {
				element[i] = val;
			} else {
				element.setAttribute(i, val);
			}
		}

		return element;
	};

	$.bind = function (element, o) {
		if (element) {
			for (var event in o) {
				var callback = o[event];

				event.split(/\s+/).forEach(function (event) {
					element.addEventListener(event, callback);
				});
			}
		}
	};

	$.fire = function (target, type, properties) {
		var evt = document.createEvent('HTMLEvents');

		evt.initEvent(type, true, true);

		for (var j in properties) {
			evt[j] = properties[j];
		}

		target.dispatchEvent(evt);
	};

	$.regExpEscape = function (s) {
		return s.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
	};

	// Initialization

	function init() {
		$$('input.awesomplete').forEach(function (input) {
			new _(input);
		});
	}

	// Are we in a browser? Check for Document constructor
	if (typeof Document !== 'undefined') {
		// DOM already loaded?
		if (document.readyState !== 'loading') {
			init();
		} else {
			// Wait for it
			document.addEventListener('DOMContentLoaded', init);
		}
	}

	_.$ = $;
	_.$$ = $$;

	// Make sure to export Awesomplete on self when in a browser
	if (typeof self !== 'undefined') {
		self.Awesomplete = _;
	}

	// Expose Awesomplete as a CJS module
	if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		module.exports = _;
	}

	return _;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlzLXJlYWN0LWNsYXNzLWNvbXBvbmVudC5qcyJdLCJuYW1lcyI6WyJfIiwiaW5wdXQiLCJvIiwibWUiLCIkIiwic2V0QXR0cmlidXRlIiwiY29uZmlndXJlIiwiY2FsbCIsIm1pbkNoYXJzIiwibWF4SXRlbXMiLCJhdXRvRmlyc3QiLCJmaWx0ZXIiLCJGSUxURVJfQ09OVEFJTlMiLCJzb3J0IiwiU09SVF9CWUxFTkdUSCIsIml0ZW0iLCJ0ZXh0IiwiY3JlYXRlIiwiaW5uZXJIVE1MIiwicmVwbGFjZSIsIlJlZ0V4cCIsInJlZ0V4cEVzY2FwZSIsInRyaW0iLCJ2YWx1ZSIsImluZGV4IiwiY29udGFpbmVyIiwiY2xhc3NOYW1lIiwiYXJvdW5kIiwidWwiLCJoaWRkZW4iLCJpbnNpZGUiLCJzdGF0dXMiLCJyb2xlIiwiYmluZCIsImV2YWx1YXRlIiwiY2xvc2UiLCJldnQiLCJjIiwia2V5Q29kZSIsIm9wZW5lZCIsInNlbGVjdGVkIiwicHJldmVudERlZmF1bHQiLCJzZWxlY3QiLCJmb3JtIiwibGkiLCJ0YXJnZXQiLCJ0ZXN0Iiwibm9kZU5hbWUiLCJwYXJlbnROb2RlIiwiaGFzQXR0cmlidXRlIiwibGlzdCIsImdldEF0dHJpYnV0ZSIsInJlbW92ZUF0dHJpYnV0ZSIsImFsbCIsInB1c2giLCJwcm90b3R5cGUiLCJBcnJheSIsImlzQXJyYXkiLCJfbGlzdCIsImluZGV4T2YiLCJzcGxpdCIsImNoaWxkcmVuIiwic2xpY2UiLCJhcHBseSIsIm1hcCIsImVsIiwidGV4dENvbnRlbnQiLCJkb2N1bWVudCIsImFjdGl2ZUVsZW1lbnQiLCJmaXJlIiwib3BlbiIsImdvdG8iLCJuZXh0IiwiY291bnQiLCJsZW5ndGgiLCJwcmV2aW91cyIsImkiLCJsaXMiLCJwcmV2ZW50ZWQiLCJldmVyeSIsImFwcGVuZENoaWxkIiwiRklMVEVSX1NUQVJUU1dJVEgiLCJhIiwiYiIsInByb3BlcnRpZXMiLCJpbml0aWFsIiwiYXR0clZhbHVlIiwidG9Mb3dlckNhc2UiLCJwYXJzZUludCIsIkZ1bmN0aW9uIiwiZXhwciIsImNvbiIsInF1ZXJ5U2VsZWN0b3IiLCIkJCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJ0YWciLCJlbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsInZhbCIsInJlZiIsImluc2VydEJlZm9yZSIsImV2ZW50IiwiY2FsbGJhY2siLCJmb3JFYWNoIiwiYWRkRXZlbnRMaXN0ZW5lciIsInR5cGUiLCJjcmVhdGVFdmVudCIsImluaXRFdmVudCIsImoiLCJkaXNwYXRjaEV2ZW50IiwicyIsImluaXQiLCJEb2N1bWVudCIsInJlYWR5U3RhdGUiLCJzZWxmIiwiQXdlc29tcGxldGUiLCJleHBvcnRzIiwibW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7Ozs7QUFPQyxhQUFZOztBQUVULEtBQUlBLElBQUksU0FBSkEsQ0FBSSxDQUFVQyxLQUFWLEVBQWlCQyxDQUFqQixFQUFvQjtBQUNILE1BQUlDLEtBQUssSUFBVDs7QUFFNUI7O0FBRTRCLE9BQUtGLEtBQUwsR0FBYUcsRUFBRUgsS0FBRixDQUFiO0FBQ0EsT0FBS0EsS0FBTCxDQUFXSSxZQUFYLENBQXdCLGNBQXhCLEVBQXdDLE9BQXhDO0FBQ0EsT0FBS0osS0FBTCxDQUFXSSxZQUFYLENBQXdCLG1CQUF4QixFQUE2QyxNQUE3Qzs7QUFFQUgsTUFBSUEsS0FBSyxFQUFUOztBQUVBSSxZQUFVQyxJQUFWLENBQWUsSUFBZixFQUFxQjtBQUNoQ0MsYUFBVSxDQURzQjtBQUVoQ0MsYUFBVSxFQUZzQjtBQUdoQ0MsY0FBVyxLQUhxQjtBQUloQ0MsV0FBUVgsRUFBRVksZUFKc0I7QUFLaENDLFNBQU1iLEVBQUVjLGFBTHdCO0FBTWhDQyxTQUFNLGNBQVVDLElBQVYsRUFBZ0JmLEtBQWhCLEVBQXVCO0FBQzVCLFdBQU9HLEVBQUVhLE1BQUYsQ0FBUyxJQUFULEVBQWU7QUFDckJDLGdCQUFXRixLQUFLRyxPQUFMLENBQWFDLE9BQU9oQixFQUFFaUIsWUFBRixDQUFlcEIsTUFBTXFCLElBQU4sRUFBZixDQUFQLEVBQXFDLElB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QztBQUN4QztBQUM0QixNQUFJN0MsU0FBUzhDLFVBQVQsS0FBd0IsU0FBNUIsRUFBdUM7QUFDbERGO0FBQ2hCLEdBRjJCLE1BR0s7QUFDaEM7QUFDZ0I1QyxZQUFTcUMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDTyxJQUE5QztBQUNoQjtBQUNHOztBQUVEL0csR0FBRUksQ0FBRixHQUFNQSxDQUFOO0FBQ0FKLEdBQUU2RixFQUFGLEdBQU9BLEVBQVA7O0FBRUo7QUFDSSxLQUFJLE9BQU9xQixJQUFQLEtBQWdCLFdBQXBCLEVBQWlDO0FBQ1JBLE9BQUtDLFdBQUwsR0FBbUJuSCxDQUFuQjtBQUN4Qjs7QUFFTDtBQUNJLEtBQUksUUFBT29ILE9BQVAseUNBQU9BLE9BQVAsT0FBbUIsUUFBdkIsRUFBaUM7QUFDUkMsU0FBT0QsT0FBUCxHQUFpQnBILENBQWpCO0FBQ3hCOztBQUVELFFBQU9BLENBQVA7QUFFSCxDQS9YQSxHQUFEIiwiZmlsZSI6ImlzLXJlYWN0LWNsYXNzLWNvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBTaW1wbGUsIGxpZ2h0d2VpZ2h0LCB1c2FibGUgbG9jYWwgYXV0b2NvbXBsZXRlIGxpYnJhcnkgZm9yIG1vZGVybiBicm93c2Vyc1xyXG4gKiBCZWNhdXNlIHRoZXJlIHdlcmVu4oCZdCBlbm91Z2ggYXV0b2NvbXBsZXRlIHNjcmlwdHMgaW4gdGhlIHdvcmxkPyBCZWNhdXNlIEnigJltIGNvbXBsZXRlbHkgaW5zYW5lIGFuZCBoYXZlIE5JSCBzeW5kcm9tZT8gUHJvYmFibHkgYm90aC4gOlBcclxuICogQGF1dGhvciBMZWEgVmVyb3UgaHR0cDovL2xlYXZlcm91LmdpdGh1Yi5pby9hd2Vzb21wbGV0ZVxyXG4gKiBNSVQgbGljZW5zZVxyXG4gKi9cclxuXHJcbihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIF8gPSBmdW5jdGlvbiAoaW5wdXQsIG8pIHtcclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuXHJcblx0Ly8gU2V0dXBcclxuXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5wdXQgPSAkKGlucHV0KTtcclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnB1dC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdmYWxzZScpO1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlucHV0LnNldEF0dHJpYnV0ZSgnYXJpYS1hdXRvY29tcGxldGUnLCAnbGlzdCcpO1xyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgbyA9IG8gfHwge307XHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWd1cmUuY2FsbCh0aGlzLCB7XHJcblx0XHQgICAgICAgICAgICAgICAgbWluQ2hhcnM6IDIsXHJcblx0XHQgICAgICAgICAgICAgICAgbWF4SXRlbXM6IDEwLFxyXG5cdFx0ICAgICAgICAgICAgICAgIGF1dG9GaXJzdDogZmFsc2UsXHJcblx0XHQgICAgICAgICAgICAgICAgZmlsdGVyOiBfLkZJTFRFUl9DT05UQUlOUyxcclxuXHRcdCAgICAgICAgICAgICAgICBzb3J0OiBfLlNPUlRfQllMRU5HVEgsXHJcblx0XHQgICAgICAgICAgICAgICAgaXRlbTogZnVuY3Rpb24gKHRleHQsIGlucHV0KSB7XHJcblx0XHRcdCAgICAgICAgICAgICAgICByZXR1cm4gJC5jcmVhdGUoJ2xpJywge1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICBpbm5lckhUTUw6IHRleHQucmVwbGFjZShSZWdFeHAoJC5yZWdFeHBFc2NhcGUoaW5wdXQudHJpbSgpKSwgJ2dpJyksICc8bWFyaz4kJjwvbWFyaz4nKSxcclxuXHRcdFx0XHQgICAgICAgICAgICAnYXJpYS1zZWxlY3RlZCc6ICdmYWxzZSdcclxuXHRcdFx0fSk7XHJcblx0XHR9LFxyXG5cdFx0ICAgICAgICAgICAgICAgIHJlcGxhY2U6IGZ1bmN0aW9uICh0ZXh0KSB7XHJcblx0XHRcdCAgICAgICAgICAgICAgICB0aGlzLmlucHV0LnZhbHVlID0gdGV4dDtcclxuXHRcdH1cclxuXHR9LCBvKTtcclxuXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXggPSAtMTtcclxuXHJcblx0Ly8gQ3JlYXRlIG5lY2Vzc2FyeSBlbGVtZW50c1xyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSAkLmNyZWF0ZSgnZGl2Jywge1xyXG5cdFx0ICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2F3ZXNvbXBsZXRlJyxcclxuXHRcdCAgICAgICAgICAgICAgICBhcm91bmQ6IGlucHV0XHJcblx0fSk7XHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVsID0gJC5jcmVhdGUoJ3VsJywge1xyXG5cdFx0ICAgICAgICAgICAgICAgIGhpZGRlbjogJycsXHJcblx0XHQgICAgICAgICAgICAgICAgaW5zaWRlOiB0aGlzLmNvbnRhaW5lclxyXG5cdH0pO1xyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSAkLmNyZWF0ZSgnc3BhbicsIHtcclxuXHRcdCAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICd2aXN1YWxseS1oaWRkZW4nLFxyXG5cdFx0ICAgICAgICAgICAgICAgIHJvbGU6ICdzdGF0dXMnLFxyXG5cdFx0ICAgICAgICAgICAgJ2FyaWEtbGl2ZSc6ICdhc3NlcnRpdmUnLFxyXG5cdFx0ICAgICAgICAgICAgJ2FyaWEtcmVsZXZhbnQnOiAnYWRkaXRpb25zJyxcclxuXHRcdCAgICAgICAgICAgICAgICBpbnNpZGU6IHRoaXMuY29udGFpbmVyXHJcblx0fSk7XHJcblxyXG5cdC8vIEJpbmQgZXZlbnRzXHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmJpbmQodGhpcy5pbnB1dCwge1xyXG5cdFx0ICAgICAgICAgICAgJ2lucHV0JzogdGhpcy5ldmFsdWF0ZS5iaW5kKHRoaXMpLFxyXG5cdFx0ICAgICAgICAgICAgJ2JsdXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXHJcblx0XHQgICAgICAgICAgICAna2V5ZG93bic6IGZ1bmN0aW9uKGV2dCkge1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgdmFyIGMgPSBldnQua2V5Q29kZTtcclxuXHJcblx0XHRcdC8vIElmIHRoZSBkcm9wZG93biBgdWxgIGlzIGluIHZpZXcsIHRoZW4gYWN0IG9uIGtleWRvd24gZm9yIHRoZSBmb2xsb3dpbmcga2V5czpcclxuXHRcdFx0Ly8gRW50ZXIgLyBFc2MgLyBVcCAvIERvd25cclxuXHRcdFx0ICAgICAgICAgICAgICAgIGlmKG1lLm9wZW5lZCkge1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICBpZiAoYyA9PT0gMTMgJiYgbWUuc2VsZWN0ZWQpIHsgLy8gRW50ZXJcclxuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICBtZS5zZWxlY3QoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IDI3KSB7IC8vIEVzY1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgICAgIG1lLmNsb3NlKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgaWYgKGMgPT09IDM4IHx8IGMgPT09IDQwKSB7IC8vIERvd24vVXAgYXJyb3dcclxuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICBtZVtjID09PSAzOD8gJ3ByZXZpb3VzJyA6ICduZXh0J10oKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuYmluZCh0aGlzLmlucHV0LmZvcm0sIHsnc3VibWl0JzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpfSk7XHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmJpbmQodGhpcy51bCwgeydtb3VzZWRvd24nOiBmdW5jdGlvbihldnQpIHtcclxuXHRcdCAgICAgICAgICAgICAgICB2YXIgbGkgPSBldnQudGFyZ2V0O1xyXG5cclxuXHRcdCAgICAgICAgICAgICAgICBpZiAobGkgIT09IHRoaXMpIHtcclxuXHJcblx0XHRcdCAgICAgICAgICAgICAgICB3aGlsZSAobGkgJiYgIS9saS9pLnRlc3QobGkubm9kZU5hbWUpKSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgIGxpID0gbGkucGFyZW50Tm9kZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0ICAgICAgICAgICAgICAgIGlmIChsaSkge1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICBtZS5zZWxlY3QobGkpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fX0pO1xyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW5wdXQuaGFzQXR0cmlidXRlKCdsaXN0JykpIHtcclxuXHRcdCAgICAgICAgICAgICAgICB0aGlzLmxpc3QgPSAnIycgKyBpbnB1dC5nZXRBdHRyaWJ1dGUoJ2xpc3QnKTtcclxuXHRcdCAgICAgICAgICAgICAgICBpbnB1dC5yZW1vdmVBdHRyaWJ1dGUoJ2xpc3QnKTtcclxuXHR9XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG5cdFx0ICAgICAgICAgICAgICAgIHRoaXMubGlzdCA9IHRoaXMuaW5wdXQuZ2V0QXR0cmlidXRlKCdkYXRhLWxpc3QnKSB8fCBvLmxpc3QgfHwgW107XHJcblx0fVxyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5hbGwucHVzaCh0aGlzKTtcclxuICAgIH07XHJcblxyXG4gICAgXy5wcm90b3R5cGUgPSB7XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldCBsaXN0KGxpc3QpIHtcclxuXHRcdCAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShsaXN0KSkge1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgdGhpcy5fbGlzdCA9IGxpc3Q7XHJcblx0XHR9XHJcblx0XHQgICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGxpc3QgPT09ICdzdHJpbmcnICYmIGxpc3QuaW5kZXhPZignLCcpID4gLTEpIHtcclxuXHRcdFx0XHQgICAgICAgICAgICAgICAgdGhpcy5fbGlzdCA9IGxpc3Quc3BsaXQoL1xccyosXFxzKi8pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7IC8vIEVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yXHJcblx0XHRcdCAgICAgICAgICAgICAgICBsaXN0ID0gJChsaXN0KTtcclxuXHJcblx0XHRcdCAgICAgICAgICAgICAgICBpZiAobGlzdCAmJiBsaXN0LmNoaWxkcmVuKSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgIHRoaXMuX2xpc3QgPSBzbGljZS5hcHBseShsaXN0LmNoaWxkcmVuKS5tYXAoZnVuY3Rpb24gKGVsKSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICAgICAgcmV0dXJuIGVsLnRleHRDb250ZW50LnRyaW0oKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdCAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gdGhpcy5pbnB1dCkge1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgdGhpcy5ldmFsdWF0ZSgpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXQgc2VsZWN0ZWQoKSB7XHJcblx0XHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXggPiAtMTtcclxuXHR9LFxyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0IG9wZW5lZCgpIHtcclxuXHRcdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51bCAmJiB0aGlzLnVsLmdldEF0dHJpYnV0ZSgnaGlkZGVuJykgPT0gbnVsbDtcclxuXHR9LFxyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uICgpIHtcclxuXHRcdCAgICAgICAgICAgICAgICB0aGlzLnVsLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpO1xyXG5cdFx0ICAgICAgICAgICAgICAgIHRoaXMuaW5kZXggPSAtMTtcclxuXHJcblx0XHQgICAgICAgICAgICAgICAgJC5maXJlKHRoaXMuaW5wdXQsICdhd2Vzb21wbGV0ZS1jbG9zZScpO1xyXG5cdH0sXHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuOiBmdW5jdGlvbiAoKSB7XHJcblx0XHQgICAgICAgICAgICAgICAgdGhpcy51bC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpO1xyXG5cclxuXHRcdCAgICAgICAgICAgICAgICBpZiAodGhpcy5hdXRvRmlyc3QgJiYgdGhpcy5pbmRleCA9PT0gLTEpIHtcclxuXHRcdFx0ICAgICAgICAgICAgICAgIHRoaXMuZ290bygwKTtcclxuXHRcdH1cclxuXHJcblx0XHQgICAgICAgICAgICAgICAgJC5maXJlKHRoaXMuaW5wdXQsICdhd2Vzb21wbGV0ZS1vcGVuJyk7XHJcblx0fSxcclxuXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdCAgICAgICAgICAgICAgICB2YXIgY291bnQgPSB0aGlzLnVsLmNoaWxkcmVuLmxlbmd0aDtcclxuXHJcblx0XHQgICAgICAgICAgICAgICAgdGhpcy5nb3RvKHRoaXMuaW5kZXggPCBjb3VudCAtIDE/IHRoaXMuaW5kZXggKyAxIDogLTEpO1xyXG5cdH0sXHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91czogZnVuY3Rpb24gKCkge1xyXG5cdFx0ICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IHRoaXMudWwuY2hpbGRyZW4ubGVuZ3RoO1xyXG5cclxuXHRcdCAgICAgICAgICAgICAgICB0aGlzLmdvdG8odGhpcy5zZWxlY3RlZD8gdGhpcy5pbmRleCAtIDEgOiBjb3VudCAtIDEpO1xyXG5cdH0sXHJcblxyXG5cdC8vIFNob3VsZCBub3QgYmUgdXNlZCwgaGlnaGxpZ2h0cyBzcGVjaWZpYyBpdGVtIHdpdGhvdXQgYW55IGNoZWNrcyFcclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ290bzogZnVuY3Rpb24gKGkpIHtcclxuXHRcdCAgICAgICAgICAgICAgICB2YXIgbGlzID0gdGhpcy51bC5jaGlsZHJlbjtcclxuXHJcblx0XHQgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWQpIHtcclxuXHRcdFx0ICAgICAgICAgICAgICAgIGxpc1t0aGlzLmluZGV4XS5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLCAnZmFsc2UnKTtcclxuXHRcdH1cclxuXHJcblx0XHQgICAgICAgICAgICAgICAgdGhpcy5pbmRleCA9IGk7XHJcblxyXG5cdFx0ICAgICAgICAgICAgICAgIGlmIChpID4gLTEgJiYgbGlzLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0ICAgICAgICAgICAgICAgIGxpc1tpXS5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLCAndHJ1ZScpO1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMudGV4dENvbnRlbnQgPSBsaXNbaV0udGV4dENvbnRlbnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ICAgICAgICAgICAgICAgICQuZmlyZSh0aGlzLmlucHV0LCAnYXdlc29tcGxldGUtaGlnaGxpZ2h0Jyk7XHJcblx0fSxcclxuXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKHNlbGVjdGVkKSB7XHJcblx0XHQgICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSBzZWxlY3RlZCB8fCB0aGlzLnVsLmNoaWxkcmVuW3RoaXMuaW5kZXhdO1xyXG5cclxuXHRcdCAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWQpIHtcclxuXHRcdFx0ICAgICAgICAgICAgICAgIHZhciBwcmV2ZW50ZWQ7XHJcblxyXG5cdFx0XHQgICAgICAgICAgICAgICAgJC5maXJlKHRoaXMuaW5wdXQsICdhd2Vzb21wbGV0ZS1zZWxlY3QnLCB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgIHRleHQ6IHNlbGVjdGVkLnRleHRDb250ZW50LFxyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgICAgIHByZXZlbnRlZCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdCAgICAgICAgICAgICAgICBpZiAoIXByZXZlbnRlZCkge1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICB0aGlzLnJlcGxhY2Uoc2VsZWN0ZWQudGV4dENvbnRlbnQpO1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgICQuZmlyZSh0aGlzLmlucHV0LCAnYXdlc29tcGxldGUtc2VsZWN0Y29tcGxldGUnKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsdWF0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHQgICAgICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcclxuXHRcdCAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmlucHV0LnZhbHVlO1xyXG5cclxuXHRcdCAgICAgICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID49IHRoaXMubWluQ2hhcnMgJiYgdGhpcy5fbGlzdC5sZW5ndGggPiAwKSB7XHJcblx0XHRcdCAgICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gLTE7XHJcblx0XHRcdC8vIFBvcHVsYXRlIGxpc3Qgd2l0aCBvcHRpb25zIHRoYXQgbWF0Y2hcclxuXHRcdFx0ICAgICAgICAgICAgICAgIHRoaXMudWwuaW5uZXJIVE1MID0gJyc7XHJcblxyXG5cdFx0XHQgICAgICAgICAgICAgICAgdGhpcy5fbGlzdFxyXG5cdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgICAgIHJldHVybiBtZS5maWx0ZXIoaXRlbSwgdmFsdWUpO1xyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0LnNvcnQodGhpcy5zb3J0KVxyXG5cdFx0XHRcdC5ldmVyeShmdW5jdGlvbih0ZXh0LCBpKSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICAgICAgbWUudWwuYXBwZW5kQ2hpbGQobWUuaXRlbSh0ZXh0LCB2YWx1ZSkpO1xyXG5cclxuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICByZXR1cm4gaSA8IG1lLm1heEl0ZW1zIC0gMTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdCAgICAgICAgICAgICAgICBpZiAodGhpcy51bC5jaGlsZHJlbi5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0XHQgICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdCAgICAgICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ICAgICAgICAgICAgICAgIGVsc2Uge1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG5cdFx0fVxyXG5cdH1cclxuICAgIH07XHJcblxyXG4vLyBTdGF0aWMgbWV0aG9kcy9wcm9wZXJ0aWVzXHJcblxyXG4gICAgXy5hbGwgPSBbXTtcclxuXHJcbiAgICBfLkZJTFRFUl9DT05UQUlOUyA9IGZ1bmN0aW9uICh0ZXh0LCBpbnB1dCkge1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVnRXhwKCQucmVnRXhwRXNjYXBlKGlucHV0LnRyaW0oKSksICdpJykudGVzdCh0ZXh0KTtcclxuICAgIH07XHJcblxyXG4gICAgXy5GSUxURVJfU1RBUlRTV0lUSCA9IGZ1bmN0aW9uICh0ZXh0LCBpbnB1dCkge1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVnRXhwKCdeJyArICQucmVnRXhwRXNjYXBlKGlucHV0LnRyaW0oKSksICdpJykudGVzdCh0ZXh0KTtcclxuICAgIH07XHJcblxyXG4gICAgXy5TT1JUX0JZTEVOR1RIID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xyXG5cdFx0ICAgICAgICAgICAgICAgIHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xyXG5cdH1cclxuXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhIDwgYj8gLTEgOiAxO1xyXG4gICAgfTtcclxuXHJcbi8vIFByaXZhdGUgZnVuY3Rpb25zXHJcblxyXG4gICAgZnVuY3Rpb24gY29uZmlndXJlKHByb3BlcnRpZXMsIG8pIHtcclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBwcm9wZXJ0aWVzKSB7XHJcblx0XHQgICAgICAgICAgICAgICAgdmFyIGluaXRpYWwgPSBwcm9wZXJ0aWVzW2ldLFxyXG5cdFx0ICAgICAgICAgICAgICAgICAgICBhdHRyVmFsdWUgPSB0aGlzLmlucHV0LmdldEF0dHJpYnV0ZSgnZGF0YS0nICsgaS50b0xvd2VyQ2FzZSgpKTtcclxuXHJcblx0XHQgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbml0aWFsID09PSAnbnVtYmVyJykge1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgdGhpc1tpXSA9IHBhcnNlSW50KGF0dHJWYWx1ZSk7XHJcblx0XHR9XHJcblx0XHQgICAgICAgICAgICAgICAgZWxzZSBpZiAoaW5pdGlhbCA9PT0gZmFsc2UpIHsgLy8gQm9vbGVhbiBvcHRpb25zIG11c3QgYmUgZmFsc2UgYnkgZGVmYXVsdCBhbnl3YXlcclxuXHRcdFx0ICAgICAgICAgICAgICAgIHRoaXNbaV0gPSBhdHRyVmFsdWUgIT09IG51bGw7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChpbml0aWFsIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuXHRcdFx0ICAgICAgICAgICAgICAgIHRoaXNbaV0gPSBudWxsO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdCAgICAgICAgICAgICAgICB0aGlzW2ldID0gYXR0clZhbHVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdCAgICAgICAgICAgICAgICBpZiAoIXRoaXNbaV0gJiYgdGhpc1tpXSAhPT0gMCkge1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgdGhpc1tpXSA9IChpIGluIG8pPyBvW2ldIDogaW5pdGlhbDtcclxuXHRcdH1cclxuXHR9XHJcbiAgICB9XHJcblxyXG4vLyBIZWxwZXJzXHJcblxyXG4gICAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxuICAgIGZ1bmN0aW9uICQoZXhwciwgY29uKSB7XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZXhwciA9PT0gJ3N0cmluZyc/IChjb24gfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3IoZXhwcikgOiBleHByIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gJCQoZXhwciwgY29uKSB7XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzbGljZS5jYWxsKChjb24gfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3JBbGwoZXhwcikpO1xyXG4gICAgfVxyXG5cclxuICAgICQuY3JlYXRlID0gZnVuY3Rpb24odGFnLCBvKSB7XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvKSB7XHJcblx0XHQgICAgICAgICAgICAgICAgdmFyIHZhbCA9IG9baV07XHJcblxyXG5cdFx0ICAgICAgICAgICAgICAgIGlmIChpID09PSAnaW5zaWRlJykge1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgJCh2YWwpLmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG5cdFx0fVxyXG5cdFx0ICAgICAgICAgICAgICAgIGVsc2UgaWYgKGkgPT09ICdhcm91bmQnKSB7XHJcblx0XHRcdCAgICAgICAgICAgICAgICB2YXIgcmVmID0gJCh2YWwpO1xyXG5cdFx0XHQgICAgICAgICAgICAgICAgcmVmLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHJlZik7XHJcblx0XHRcdCAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHJlZik7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChpIGluIGVsZW1lbnQpIHtcclxuXHRcdFx0ICAgICAgICAgICAgICAgIGVsZW1lbnRbaV0gPSB2YWw7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGksIHZhbCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICB9O1xyXG5cclxuICAgICQuYmluZCA9IGZ1bmN0aW9uKGVsZW1lbnQsIG8pIHtcclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcclxuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBldmVudCBpbiBvKSB7XHJcblx0XHRcdCAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBvW2V2ZW50XTtcclxuXHJcblx0XHRcdCAgICAgICAgICAgICAgICBldmVudC5zcGxpdCgvXFxzKy8pLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcbiAgICB9O1xyXG5cclxuICAgICQuZmlyZSA9IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgcHJvcGVydGllcykge1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcclxuXHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSApO1xyXG5cclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiBpbiBwcm9wZXJ0aWVzKSB7XHJcblx0XHQgICAgICAgICAgICAgICAgZXZ0W2pdID0gcHJvcGVydGllc1tqXTtcclxuXHR9XHJcblxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuZGlzcGF0Y2hFdmVudChldnQpO1xyXG4gICAgfTtcclxuXHJcbiAgICAkLnJlZ0V4cEVzY2FwZSA9IGZ1bmN0aW9uIChzKSB7XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xyXG4gICAgfVxyXG5cclxuLy8gSW5pdGlhbGl6YXRpb25cclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KCkge1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAkJCgnaW5wdXQuYXdlc29tcGxldGUnKS5mb3JFYWNoKGZ1bmN0aW9uIChpbnB1dCkge1xyXG5cdFx0ICAgICAgICAgICAgICAgIG5ldyBfKGlucHV0KTtcclxuXHR9KTtcclxuICAgIH1cclxuXHJcbi8vIEFyZSB3ZSBpbiBhIGJyb3dzZXI/IENoZWNrIGZvciBEb2N1bWVudCBjb25zdHJ1Y3RvclxyXG4gICAgaWYgKHR5cGVvZiBEb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHQvLyBET00gYWxyZWFkeSBsb2FkZWQ/XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnbG9hZGluZycpIHtcclxuXHRcdCAgICAgICAgICAgICAgICBpbml0KCk7XHJcblx0fVxyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuXHRcdC8vIFdhaXQgZm9yIGl0XHJcblx0XHQgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGluaXQpO1xyXG5cdH1cclxuICAgIH1cclxuXHJcbiAgICBfLiQgPSAkO1xyXG4gICAgXy4kJCA9ICQkO1xyXG5cclxuLy8gTWFrZSBzdXJlIHRvIGV4cG9ydCBBd2Vzb21wbGV0ZSBvbiBzZWxmIHdoZW4gaW4gYSBicm93c2VyXHJcbiAgICBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuQXdlc29tcGxldGUgPSBfO1xyXG4gICAgfVxyXG5cclxuLy8gRXhwb3NlIEF3ZXNvbXBsZXRlIGFzIGEgQ0pTIG1vZHVsZVxyXG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IF87XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIF87XHJcblxyXG59KCkpO1xyXG4iXX0=