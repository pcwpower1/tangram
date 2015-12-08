define([], function() {
	//////////////////////////
	// String.prototype.trim()
	if (!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
		};
	}

	//////////////////////////
	// String.prototype.format()
	if (!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;

			return this.replace(/{(\d+)}/g, function(match, number) {
				return typeof args[number] !== 'undefined' ? args[number] : match;
			})
		}
	}

	//////////////////////////
	// window.JSON
	if (!window.JSON) {
		window.JSON = {
			parse: function(sJSON) { return eval('(' + sJSON + ')'); },
			stringify: (function () {
				var toString = Object.prototype.toString;
				var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
				var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
				var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
				var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
				return function stringify(value) {
					if (value == null) {
						return 'null';
					} else if (typeof value === 'number') {
						return isFinite(value) ? value.toString() : 'null';
					} else if (typeof value === 'boolean') {
						return value.toString();
					} else if (typeof value === 'object') {
						if (typeof value.toJSON === 'function') {
							return stringify(value.toJSON());
						} else if (isArray(value)) {
							var res = '[';
							for (var i = 0; i < value.length; i++)
								res += (i ? ', ' : '') + stringify(value[i]);
							return res + ']';
						} else if (toString.call(value) === '[object Object]') {
							var tmp = [];
							for (var k in value) {
								if (value.hasOwnProperty(k))
									tmp.push(stringify(k) + ': ' + stringify(value[k]));
							}
							return '{' + tmp.join(', ') + '}';
						}
					}
					return '"' + value.toString().replace(escRE, escFunc) + '"';
				};
			})()
		};
	}

	//////////////////////////
	// Array.prototype.forEach
	// Production steps of ECMA-262, Edition 5, 15.4.4.18
	// Reference: http://es5.github.io/#x15.4.4.18
	if (!Array.prototype.forEach) {

		Array.prototype.forEach = function(callback, thisArg) {

			var T, k;

			if (this == null) {
				throw new TypeError(' this is null or not defined');
			}

			// 1. Let O be the result of calling ToObject passing the |this| value as the argument.
			var O = Object(this);

			// 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
			// 3. Let len be ToUint32(lenValue).
			var len = O.length >>> 0;

			// 4. If IsCallable(callback) is false, throw a TypeError exception.
			// See: http://es5.github.com/#x9.11
			if (typeof callback !== "function") {
				throw new TypeError(callback + ' is not a function');
			}

			// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
			if (arguments.length > 1) {
				T = thisArg;
			}

			// 6. Let k be 0
			k = 0;

			// 7. Repeat, while k < len
			while (k < len) {

				var kValue;

				// a. Let Pk be ToString(k).
				//   This is implicit for LHS operands of the in operator
				// b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
				//   This step can be combined with c
				// c. If kPresent is true, then
				if (k in O) {

					// i. Let kValue be the result of calling the Get internal method of O with argument Pk.
					kValue = O[k];

					// ii. Call the Call internal method of callback with T as the this value and
					// argument list containing kValue, k, and O.
					callback.call(T, kValue, k, O);
				}
				// d. Increase k by 1.
				k++;
			}
			// 8. return undefined
		};
	}

	//////////////////////////
	// Array.prototype.indexOf
	// Production steps of ECMA-262, Edition 5, 15.4.4.14
	// Reference: http://es5.github.io/#x15.4.4.14
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(searchElement, fromIndex) {

			var k;

			// 1. Let O be the result of calling ToObject passing
			//    the this value as the argument.
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var O = Object(this);

			// 2. Let lenValue be the result of calling the Get
			//    internal method of O with the argument "length".
			// 3. Let len be ToUint32(lenValue).
			var len = O.length >>> 0;

			// 4. If len is 0, return -1.
			if (len === 0) {
				return -1;
			}

			// 5. If argument fromIndex was passed let n be
			//    ToInteger(fromIndex); else let n be 0.
			var n = +fromIndex || 0;

			if (Math.abs(n) === Infinity) {
				n = 0;
			}

			// 6. If n >= len, return -1.
			if (n >= len) {
				return -1;
			}

			// 7. If n >= 0, then Let k be n.
			// 8. Else, n<0, Let k be len - abs(n).
			//    If k is less than 0, then let k be 0.
			k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

			// 9. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ToString(k).
				//   This is implicit for LHS operands of the in operator
				// b. Let kPresent be the result of calling the
				//    HasProperty internal method of O with argument Pk.
				//   This step can be combined with c
				// c. If kPresent is true, then
				//    i.  Let elementK be the result of calling the Get
				//        internal method of O with the argument ToString(k).
				//   ii.  Let same be the result of applying the
				//        Strict Equality Comparison Algorithm to
				//        searchElement and elementK.
				//  iii.  If same is true, return k.
				if (k in O && O[k] === searchElement) {
					return k;
				}
				k++;
			}
			return -1;
		};
	}

	//////////////////////////
	// document.querySelectorAll()
	if (!document.querySelectorAll) {
		document.querySelectorAll = document.body.querySelectorAll = Object.querySelectorAll = function querySelectorAllPolyfill(r, c, i, j, a) {
			var d=document,
				s=d.createStyleSheet();
			a = d.all;
			c = [];
			r = r.replace(/\[for\b/gi, '[htmlFor').split(',');
			for (i = r.length; i--;) {
				s.addRule(r[i], 'k:v');
				for (j = a.length; j--;) {
					a[j].currentStyle.k && c.push(a[j]);
				}
				s.removeRule(0);
			}
			return c;
		};
	}

	//////////////////////////
	// document.querySelector()
	if (!document.querySelector) {
		document.querySelector = function (selectors) {
			var elements = document.querySelectorAll(selectors);
			return (elements.length) ? elements[0] : null;
		};
	}

	//addEventListener polyfill 1.0 / Eirik Backer / MIT Licence
	(function(win, doc){
		if(win.addEventListener)return;		//No need to polyfill

		function docHijack(p) {
			var old = doc[p];

			doc[p] = function(v) {
				return addListen(old(v))
			}
		}

		function addEvent(on, fn, self) {
			return (self = this).attachEvent('on' + on, function(e) {
				var e = e || win.event;
				e.preventDefault  = e.preventDefault  || function() {e.returnValue = false}
				e.stopPropagation = e.stopPropagation || function() {e.cancelBubble = true}
				fn.call(self, e);
			});
		}

		function addListen(obj, i){
			if(i = obj.length) {
				while(i--) {
					obj[i].addEventListener = addEvent;
				}
			} else {
				obj.addEventListener = addEvent;
			}

			return obj;
		}

		addListen([doc, win]);

		if('Element' in win) {			// IE8
			win.Element.prototype.addEventListener = addEvent;
		} else{							// IE < 8
			doc.attachEvent('onreadystatechange', function(){addListen(doc.all)});	// Make sure we also init at domReady
			docHijack('getElementsByTagName');
			docHijack('getElementById');
			docHijack('createElement');
			addListen(doc.all);
		}
	})(window, document);

	//////////////////////////
	// window.location.origin
	if (!window.location.origin) {
		window.location.origin = '{0}//{1}{2}'.format(window.location.protocol, window.location.hostname, window.location.port ? ':' + window.location.port: '');
	}

	/**
	 * JavaScript implementation of W3 DOM4 TreeWalker interface.
	 *
	 * See also:
	 * - https://dom.spec.whatwg.org/#interface-treewalker
	 *
	 * Attributes like "read-only" and "private" are ignored in this implementation
	 * due to ECMAScript 3 (as opposed to ES5) not supporting creation of such properties.
	 * There are workarounds, but under "keep it simple" and "don't do stupid things" they
	 * are ignored in this implementation.
	 */
	(function (win, doc) {
		var TreeWalker, NodeFilter, create, toString, is, mapChild, mapSibling,
			nodeFilter, traverseChildren, traverseSiblings, nextSkippingChildren;

		if (doc.createTreeWalker) {
			return;
		}

		Node = {
			ELEMENT_NODE: 1,
			TEXT_NODE: 3,
			PROCESSING_INSTRUCTION_NODE: 7,
			COMMENT_NODE: 8,
			DOCUMENT_NODE: 9,
			DOCUMENT_TYPE_NODE: 10,
			DOCUMENT_FRAGMENT_NODE: 11
		};

		// Cross-browser polyfill for these constants
		NodeFilter = {
			// Constants for acceptNode()
			FILTER_ACCEPT: 1,
			FILTER_REJECT: 2,
			FILTER_SKIP: 3,

			// Constants for whatToShow
			SHOW_ALL: 0xFFFFFFFF,
			SHOW_ELEMENT: 0x1,
			SHOW_ATTRIBUTE: 0x2, // historical
			SHOW_TEXT: 0x4,
			SHOW_CDATA_SECTION: 0x8, // historical
			SHOW_ENTITY_REFERENCE: 0x10, // historical
			SHOW_ENTITY: 0x20, // historical
			SHOW_PROCESSING_INSTRUCTION: 0x40,
			SHOW_COMMENT: 0x80,
			SHOW_DOCUMENT: 0x100,
			SHOW_DOCUMENT_TYPE: 0x200,
			SHOW_DOCUMENT_FRAGMENT: 0x400,
			SHOW_NOTATION: 0x800 // historical
		};

		/* Local utilities */

		create = Object.create || function (proto) {
				function Empty() {}
				Empty.prototype = proto;
				return new Empty();
			};

		mapChild = {
			first: 'firstChild',
			last: 'lastChild',
			next: 'firstChild',
			previous: 'lastChild'
		};

		mapSibling = {
			next: 'nextSibling',
			previous: 'previousSibling'
		};

		toString = mapChild.toString;

		is = function (x, type) {
			return toString.call(x).toLowerCase() === '[object ' + type.toLowerCase() + ']';
		};

		/* Private methods and helpers */

		/**
		 * See https://dom.spec.whatwg.org/#concept-node-filter
		 *
		 * @private
		 * @method
		 * @param {TreeWalker} tw
		 * @param {Node} node
		 */
		nodeFilter = function (tw, node) {
			// Maps nodeType to whatToShow
			if (!(((1 << (node.nodeType - 1)) & tw.whatToShow))) {
				return NodeFilter.FILTER_SKIP;
			}

			if (tw.filter === null) {
				return NodeFilter.FILTER_ACCEPT;
			}

			return tw.filter.acceptNode(node);
		};

		/**
		 * See https://dom.spec.whatwg.org/#concept-traverse-children
		 *
		 * @private
		 * @method
		 * @param {TreeWalker} tw
		 * @param {string} type One of 'first' or 'last'.
		 * @return {Node|null}
		 */
		traverseChildren = function (tw, type) {
			var child, node, parent, result, sibling;
			node = tw.currentNode[ mapChild[ type ] ];
			while (node !== null) {
				result = nodeFilter(tw, node);
				if (result === NodeFilter.FILTER_ACCEPT) {
					tw.currentNode = node;
					return node;
				}
				if (result === NodeFilter.FILTER_SKIP) {
					child = node[ mapChild[ type ] ];
					if (child !== null) {
						node = child;
						continue;
					}
				}
				while (node !== null) {
					sibling = node[ mapChild[ type ] ];
					if (sibling !== null) {
						node = sibling;
						break;
					}
					parent = node.parentNode;
					if (parent === null || parent === tw.root || parent === tw.currentNode) {
						return null;
					} else {
						node = parent;
					}
				}
			}
			return null;
		};

		/**
		 * See https://dom.spec.whatwg.org/#concept-traverse-siblings
		 *
		 * @private
		 * @method
		 * @param {TreeWalker} tw
		 * @param {TreeWalker} type One of 'next' or 'previous'.
		 * @return {Node|null}
		 */
		traverseSiblings = function (tw, type) {
			var node, result, sibling;
			node = tw.currentNode;
			if (node === tw.root) {
				return null;
			}
			while (true) {
				sibling = node[ mapSibling[ type ] ];
				while (sibling !== null) {
					node = sibling;
					result = nodeFilter(tw, node);
					if (result === NodeFilter.FILTER_ACCEPT) {
						tw.currentNode = node;
						return node;
					}
					sibling = node[ mapChild[ type ] ];
					if (result === NodeFilter.FILTER_REJECT) {
						sibling = node[ mapSibling[ type ] ];
					}
				}
				node = node.parentNode;
				if (node === null || node === tw.root) {
					return null;
				}
				if (nodeFilter(tw, node) === NodeFilter.FILTER_ACCEPT) {
					return null;
				}
			}
		};

		/**
		 * Based on WebKit's NodeTraversal::nextSkippingChildren
		 * https://trac.webkit.org/browser/trunk/Source/WebCore/dom/NodeTraversal.h?rev=137221#L103
		 */
		nextSkippingChildren = function (node, stayWithin) {
			if (node === stayWithin) {
				return null;
			}
			if (node.nextSibling !== null) {
				return node.nextSibling;
			}

			/**
			 * Based on WebKit's NodeTraversal::nextAncestorSibling
			 * https://trac.webkit.org/browser/trunk/Source/WebCore/dom/NodeTraversal.cpp?rev=137221#L43
			 */
			while (node.parentNode !== null) {
				node = node.parentNode;
				if (node === stayWithin) {
					return null;
				}
				if (node.nextSibling !== null) {
					return node.nextSibling;
				}
			}
			return null;
		};

		/**
		 * See https://dom.spec.whatwg.org/#interface-treewalker
		 *
		 * @constructor
		 * @param {Node} root
		 * @param {number} [whatToShow]
		 * @param {Function} [filter]
		 * @throws Error
		 */
		TreeWalker = function (root, whatToShow, filter) {
			var tw = this, active = false;

			if (!root || !root.nodeType) {
				throw new Error('DOMException: NOT_SUPPORTED_ERR');
			}

			tw.root = root;
			tw.whatToShow = Number(whatToShow) || 0;

			tw.currentNode = root;

			if (!is(filter, 'function')) {
				tw.filter = null;
			} else {
				tw.filter = create(win.NodeFilter.prototype);

				/**
				 * See https://dom.spec.whatwg.org/#dom-nodefilter-acceptnode
				 *
				 * @method
				 * @member NodeFilter
				 * @param {Node} node
				 * @return {number} Constant NodeFilter.FILTER_ACCEPT,
				 *  NodeFilter.FILTER_REJECT or NodeFilter.FILTER_SKIP.
				 */
				tw.filter.acceptNode = function (node) {
					var result;
					if (active) {
						throw new Error('DOMException: INVALID_STATE_ERR');
					}

					active = true;
					result = filter(node);
					active = false;

					return result;
				};
			}
		};

		TreeWalker.prototype = {

			constructor: TreeWalker,

			/**
			 * See https://dom.spec.whatwg.org/#ddom-treewalker-parentnode
			 *
			 * @method
			 * @return {Node|null}
			 */
			parentNode: function () {
				var node = this.currentNode;
				while (node !== null && node !== this.root) {
					node = node.parentNode;
					if (node !== null && nodeFilter(this, node) === NodeFilter.FILTER_ACCEPT) {
						this.currentNode = node;
						return node;
					}
				}
				return null;
			},

			/**
			 * See https://dom.spec.whatwg.org/#dom-treewalker-firstchild
			 *
			 * @method
			 * @return {Node|null}
			 */
			firstChild: function () {
				return traverseChildren(this, 'first');
			},

			/**
			 * See https://dom.spec.whatwg.org/#dom-treewalker-lastchild
			 *
			 * @method
			 * @return {Node|null}
			 */
			lastChild: function () {
				return traverseChildren(this, 'last');
			},

			/**
			 * See https://dom.spec.whatwg.org/#dom-treewalker-previoussibling
			 *
			 * @method
			 * @return {Node|null}
			 */
			previousSibling: function () {
				return traverseSiblings(this, 'previous');
			},

			/**
			 * See https://dom.spec.whatwg.org/#dom-treewalker-nextsibling
			 *
			 * @method
			 * @return {Node|null}
			 */
			nextSibling: function () {
				return traverseSiblings(this, 'next');
			},

			/**
			 * See https://dom.spec.whatwg.org/#dom-treewalker-previousnode
			 *
			 * @method
			 * @return {Node|null}
			 */
			previousNode: function () {
				var node, result, sibling;
				node = this.currentNode;
				while (node !== this.root) {
					sibling = node.previousSibling;
					while (sibling !== null) {
						node = sibling;
						result = nodeFilter(this, node);
						while (result !== NodeFilter.FILTER_REJECT && node.lastChild !== null) {
							node = node.lastChild;
							result = nodeFilter(this, node);
						}
						if (result === NodeFilter.FILTER_ACCEPT) {
							this.currentNode = node;
							return node;
						}
					}
					if (node === this.root || node.parentNode === null) {
						return null;
					}
					node = node.parentNode;
					if (nodeFilter(this, node) === NodeFilter.FILTER_ACCEPT) {
						this.currentNode = node;
						return node;
					}
				}
				return null;
			},

			/**
			 * See https://dom.spec.whatwg.org/#dom-treewalker-nextnode
			 *
			 * @method
			 * @return {Node|null}
			 */
			nextNode: function () {
				var node, result, following;
				node = this.currentNode;
				result = NodeFilter.FILTER_ACCEPT;

				while (true) {
					while (result !== NodeFilter.FILTER_REJECT && node.firstChild !== null) {
						node = node.firstChild;
						result = nodeFilter(this, node);
						if (result === NodeFilter.FILTER_ACCEPT) {
							this.currentNode = node;
							return node;
						}
					}
					following = nextSkippingChildren(node, this.root);
					if (following !== null) {
						node = following;
					} else {
						return null;
					}
					result = nodeFilter(this, node);
					if (result === NodeFilter.FILTER_ACCEPT) {
						this.currentNode = node;
						return node;
					}
				}
			}
		};

		/**
		 * See http://www.w3.org/TR/dom/#dom-document-createtreewalker
		 *
		 * @param {Node} root
		 * @param {number} [whatToShow=NodeFilter.SHOW_ALL]
		 * @param {Function|Object} [filter=null]
		 * @return {TreeWalker}
		 */
		doc.createTreeWalker = function (root, whatToShow, filter) {
			whatToShow = whatToShow === undefined ? NodeFilter.SHOW_ALL : whatToShow;

			if (filter && is(filter.acceptNode, 'function')) {
				filter = filter.acceptNode;
				// Support Gecko-ism of filter being a function.
				// https://developer.mozilla.org/en-US/docs/DOM/document.createTreeWalker
			} else if (!is(filter, 'function')) {
				filter = null;
			}

			return new TreeWalker(root, whatToShow, filter);
		};

		if (!win.NodeFilter) {
			win.NodeFilter = NodeFilter.constructor = NodeFilter.prototype = NodeFilter;
		}

		if (!win.TreeWalker) {
			win.TreeWalker = TreeWalker;
		}

	}(window, document));

	// getComputedStyle
	// https://github.com/jonathantneal/Polyfills-for-IE8/blob/master/getComputedStyle.js
	!('getComputedStyle' in window) && (window.getComputedStyle = (function () {
		function getPixelSize(element, style, property, fontSize) {
			var
				sizeWithSuffix = style[property],
				size = parseFloat(sizeWithSuffix),
				suffix = sizeWithSuffix.split(/\d/)[0],
				rootSize;

			fontSize = fontSize != null ? fontSize : /%|em/.test(suffix) && element.parentElement ? getPixelSize(element.parentElement, element.parentElement.currentStyle, 'fontSize', null) : 16;
			rootSize = property == 'fontSize' ? fontSize : /width/i.test(property) ? element.clientWidth : element.clientHeight;

			return (suffix == 'em') ? size * fontSize : (suffix == 'in') ? size * 96 : (suffix == 'pt') ? size * 96 / 72 : (suffix == '%') ? size / 100 * rootSize : size;
		}

		function setShortStyleProperty(style, property) {
			var
				borderSuffix = property == 'border' ? 'Width' : '',
				t = property + 'Top' + borderSuffix,
				r = property + 'Right' + borderSuffix,
				b = property + 'Bottom' + borderSuffix,
				l = property + 'Left' + borderSuffix;

			style[property] = (style[t] == style[r] == style[b] == style[l] ? [style[t]]
				: style[t] == style[b] && style[l] == style[r] ? [style[t], style[r]]
				: style[l] == style[r] ? [style[t], style[r], style[b]]
				: [style[t], style[r], style[b], style[l]]).join(' ');
		}

		function CSSStyleDeclaration(element) {
			var
				currentStyle = element.currentStyle,
				style = this,
				fontSize = getPixelSize(element, currentStyle, 'fontSize', null);

			for (property in currentStyle) {
				if (/width|height|margin.|padding.|border.+W/.test(property) && style[property] !== 'auto') {
					style[property] = getPixelSize(element, currentStyle, property, fontSize) + 'px';
				} else if (property === 'styleFloat') {
					style['float'] = currentStyle[property];
				} else {
					style[property] = currentStyle[property];
				}
			}

			setShortStyleProperty(style, 'margin');
			setShortStyleProperty(style, 'padding');
			setShortStyleProperty(style, 'border');

			style.fontSize = fontSize + 'px';

			return style;
		}

		CSSStyleDeclaration.prototype = {
			constructor: CSSStyleDeclaration,
			getPropertyPriority: function () {},
			getPropertyValue: function ( prop ) {
				return this[prop] || '';
			},
			item: function () {},
			removeProperty: function () {},
			setProperty: function () {},
			getPropertyCSSValue: function () {}
		};

		function getComputedStyle(element) {
			return new CSSStyleDeclaration(element);
		}

		return getComputedStyle;
	})(window));

	return 'polyfill';
});