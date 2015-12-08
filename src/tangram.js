'use strict';

define(['superagent-bluebird-promise',
	'query-string',
	'js-cookie',
	'ua-parser-js',
	'es6-promise'], function(request, queryString, cookies, uaparser) {
	var configs = {},
		userAgent = new uaparser().getResult(),
		menuContainerEl,
		mixMenuEl,
		langMenuEl;

	var STRING_TO_JSON_REGEXP = /[\r\n]+/g,
		MIX_REGEXP = /tg-(display|lang|include|attribute|scope)\s*=(>){0,1}\s*([\[\{]{0,1}[ㄱ-힣a-zA-Z0-9\"\:\,\ \/\.\-\_\[\{\}\]]+[\}\]]{0,1})/g,
		MIX_BLOCK_MARK = '>',
		MIX_DISPLAY_TYPE = 'display',
		MIX_DISPLAY_END_COMMENT = 'tg-display',
		MIX_LANG_TYPE = 'lang',
		MIX_LANG_END_COMMENT = 'tg-lang',
		MIX_INCLUDE_TYPE = 'include',
		MIX_INCLUDE_END_COMMENT = 'tg-include',
		MIX_ATTRIBUTE_TYPE = 'attribute',
		MIX_SCOPE_TYPE = 'scope',
		DEFAULT_MIX_NAME = 'all',
		MIX_SCOPE_TAG_NAME_REGEXP = /^tg-temp-([a-zA-Z]+)/g,
		CLICK_REGEXP = /tg-(click)\s*=\s*([\[\{]{0,1}[ㄱ-힣a-zA-Z0-9\"\:\,\ \/\.\-\_\[\{\}\]]+[\}\]]{0,1})/g,
		CLICK_TOGGLE_TYPE = 'toggleclass',
		CLICK_SHOW_TYPE = 'show',
		LOCALIZED_TEXT_REGEXP = /tg-text\s*=\s*([ㄱ-힣a-zA-Z0-9\.\-\_]+)/g,
		DEFAULT_LANG_CODE = 'ko',
		MIX_COOKIE_NAME = 'tg-mix',
		LANG_CODE_COOKIE_NAME = 'tg-lang',
		LANG_ATTRIBUTE_NAME = 'lang',
		DEVICE_TYPE = userAgent.device.type ? userAgent.device.type : 'desktop';

	/**
	 * 메뉴 컨테이너 요소를 구성한다.
	 * @returns {Element}
	 */
	menuContainerEl = (function composeContainer() {
		document.styleSheets[0].addRule('div[data-tg-menu] a:link', 'background-color: transparent');
		document.styleSheets[0].addRule('div[data-tg-menu] a:link', 'color: #5f5f5f');
		document.styleSheets[0].addRule('div[data-tg-menu] a:visited', 'background-color: transparent');
		document.styleSheets[0].addRule('div[data-tg-menu] a:visited', 'color: #5f5f5f');
		document.styleSheets[0].addRule('div[data-tg-menu] a:hover', 'background-color: #5f5f5f');
		document.styleSheets[0].addRule('div[data-tg-menu] a:hover', 'color: #f0f0f0');

		var container = document.createElement('div');

		container.setAttribute('data-tg-navi', '');

		container.style.position = 'fixed';
		container.style.bottom = 0;
		container.style.left = 0;
		container.style.lineHeight = '24px';
		container.style.borderTop = '5px solid #5f5f5f';
		container.style.zIndex = 9999;

		document.body.appendChild(container);

		return container;
	})();

	/**
	 * 메뉴 요소를 구성한다.
	 * @param parentEl 부모 요소
	 * @returns {Element} 메뉴 요소
	 */
	function composeMenu(parentEl) {
		var menuEl = document.createElement('div');

		menuEl.setAttribute('data-tg-menu', '');

		menuEl.style.display = 'inline-block';
		menuEl.style.verticalAlign = 'top';

		parentEl.appendChild(menuEl);

		return menuEl;
	}

	mixMenuEl = composeMenu(menuContainerEl);
	langMenuEl = composeMenu(menuContainerEl);

	/**
	 * 메뉴 앵커를 구성한다.
	 * @param parentEl 부모 요소
	 * @param displayName 앵커의 출력 텍스트
	 * @param name 앵커의 내부 이름
	 * @returns {Element} 앵커 요소
	 */
	function composeMenuAnchor(parentEl, displayName, name) {
		var anchorEl = document.createElement('a');

		anchorEl.setAttribute('href', '#');
		anchorEl.setAttribute('data-tg-anchor', name);

		anchorEl.style.display = 'block';
		anchorEl.style.padding = '0 7px';
		anchorEl.style.fontSize = '14px';
		anchorEl.style.fontWeight = 'bold';
		anchorEl.style.textDecoration = 'none';
		anchorEl.style.cursor = 'pointer';

		anchorEl.innerHTML = displayName;

		anchorEl.addEventListener('click', function(event) {
			var target = event.currentTarget || event.srcElement,
				anchorAttribute = target.getAttribute('data-tg-anchor'),
				type = anchorAttribute.split(':')[0],
				mixName,
				langCode;

			if (type === 'mix') {
				mixName = anchorAttribute.split(':')[1];
				langCode = getLangCode();

				setMixName(mixName);
			} else if (type === LANG_ATTRIBUTE_NAME) {
				mixName = getMixName();
				langCode = anchorAttribute.split(':')[1];

				setLangCode(langCode);
			}

			if (mixName && langCode) {
				solve(mixName, langCode);
			}
		});

		parentEl.appendChild(anchorEl);

		return anchorEl;
	}

	composeMenuAnchor(mixMenuEl, '전체', 'mix:{0}'.format(DEFAULT_MIX_NAME));

	function nextElementSibling(node) {
		if (node.nextElementSibling) {
			return node.nextElementSibling;
		}

		while (node.nextSibling) {
			node = node.nextSibling;

			if (node.nodeType === Node.ELEMENT_NODE) {
				return node;
			}
		}
	}

	/**
	 * HTML 문서로부터 언어 설정을 파악한다.
	 * @returns {Promise}
	 */
	function readLangText() {
		return new Promise(function(resolve, reject) {
			var fileName = window.location.pathname.lastIndexOf('/') < window.location.pathname.length - 1 ?
					window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) :
					'index.html',
				configUrl = '{0}{1}{2}.json'.format(window.location.origin,
					window.location.pathname.replace(fileName, ''),
					fileName.split('.')[0]);

			request
				.get(configUrl)
				.then(function(response) {
					var key, langCode;

					configs.lang = JSON.parse(response.text);

					for (key in configs.lang) {
						if (!configs.lang.hasOwnProperty(key)) continue;

						for (langCode in configs.lang[key]) {
							if (!configs.lang[key].hasOwnProperty(langCode)) continue;

							if (window.document.querySelectorAll('a[data-tg-anchor="lang:{0}"]'.format(langCode)).length == 0) {
								composeMenuAnchor(langMenuEl, langCode, 'lang:{0}'.format(langCode));
							}
						}
					}

					resolve();
				});
		});
	}

	/**
	 * 믹스 이름을 쿠키에 저장한다.
	 * @param mixName 믹스 이름
	 */
	function setMixName(mixName) {
		cookies.set(MIX_COOKIE_NAME, mixName);
	}

	/**
	 * 믹스 이름을 쿠키로부터 가져오고 쿠키에 없으면 기본값을 설정하고 가져온다.
	 * @returns {*} 믹스 이름
	 */
	function getMixName() {
		return cookies.get(MIX_COOKIE_NAME) ?
			cookies.get(MIX_COOKIE_NAME) : DEFAULT_MIX_NAME;
	}

	/**
	 * 언어 코드를 HTML 문서와 쿠키에 저장한다.
	 * @param langCode 언어 코드
	 */
	function setLangCode(langCode) {
		cookies.set(LANG_CODE_COOKIE_NAME, langCode);

		document.documentElement.setAttribute(LANG_ATTRIBUTE_NAME, langCode);
	}

	/**
	 * 언어 코드를 쿠키로부터 가져오고 쿠키에 없으면 HTML 문서로부터 가져온다.
	 * 만약 HTML 문서에도 없으면 기본값을 설정하고 가져온다.
	 * @returns {*} 언어 코드
	 */
	function getLangCode() {
		var langCode = cookies.get(LANG_CODE_COOKIE_NAME) ?
			cookies.get(LANG_CODE_COOKIE_NAME) : document.documentElement.getAttribute(LANG_ATTRIBUTE_NAME);

		if (!langCode) {
			langCode = DEFAULT_LANG_CODE;

			setLangCode(langCode);
		}

		return langCode;
	}

	/**
	 * 클릭 설정이 된 요소들을 찾기 위해 클릭 설정 주석을 찾아 탐색한다.
	 * @returns {*}
	 */
	function traverseClick() {
		return new Promise(function(resolve, reject) {
			var node,
				walker = document.createTreeWalker(document,
					NodeFilter.SHOW_COMMENT,
					function(node) {
						return node.nodeValue.match(CLICK_REGEXP) ?
							NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
					}, false);

			while (node = walker.nextNode()) {
				parseClickCommentNode(node);
			}

			resolve();
		});
	}

	/**
	 * 주석으로 이루어진 클릭 설정을 해석한다.
	 * @param node 클릭 설정을 가진 주석 노드
	 */
	function parseClickCommentNode(node) {
		var mixConfigs,
			body = node.nodeValue.replace(CLICK_REGEXP, '$2')
				.replace(/[\r\n]/g, '')
				.replace(STRING_TO_JSON_REGEXP, '"$1":')
				.trim(),
			key;

		try {
			mixConfigs = JSON.parse(body);

			for (key in mixConfigs) {
				if (!mixConfigs.hasOwnProperty(key)) continue;

				switch (key) {
					case CLICK_TOGGLE_TYPE:
						clickToggle(mixConfigs[key], node);

						break;

					case CLICK_SHOW_TYPE:
						clickShow(mixConfigs[key], node);

						break;
				}
			}
		} catch (e) {}
	}

	/**
	 * 요소 클릭 시 CSS 클래스를 토글시킨다.
	 * @param cssClass CSS 클래스 이름
	 * @param node 클릭 설정을 가진 주석 노드
	 */
	function clickToggle(cssClass, node) {
		var el = nextElementSibling(node);

		el.addEventListener('click', function(e) {
			var target = e.currentTarget || e.srcElement;

			if (target.classList.contains(cssClass)) {
				target.classList.remove(cssClass);
			} else {
				target.classList.add(cssClass);
			}
		});
	}

	/**
	 * 요소 클릭 시 셀렉터에 해당하는 요소를 표시하거나 감춘다.
	 * @param selector 대상 요소 셀렉터
	 * @param node 클릭 설정을 가진 주석 노드
	 */
	function clickShow(selector, node) {
		var el = nextElementSibling(node);

		el.addEventListener('click', function() {
			var targetEls = window.document.querySelectorAll(selector);

			Array.prototype.forEach.call(targetEls, function(targetEl) {
				targetEl.style.display = window.getComputedStyle(targetEl).display === 'none' ? 'block' : 'none';
			});
		});
	}

	/**
	 * 믹스 설정이 된 요소들의 상태를 조정하기 위해 믹스 설정 주석을 찾아 탐색한다.
	 * @param mixName 믹스 이름
	 * @param langCode 언어 코드
	 * @param callback 콜백 함수
	 * @returns {*}
	 */
	function traverseMix(mixName, langCode, callback) {
		return new Promise(function(resolve, reject) {
			var node,
				walker = document.createTreeWalker(document,
					NodeFilter.SHOW_COMMENT,
					function(node) {
						return node.nodeValue.match(MIX_REGEXP) ?
							NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
					}, false),
				called = [];

			while (node = walker.nextNode()) {
				called.push(callback.call(this, node, mixName, langCode));
			}

			Promise.all(called).then(function() {
				resolve();
			});
		});
	}

	/**
	 * 믹스 설정들로부터 언어 설정을 읽어온다.
	 * @param node 믹스 설정을 가진 주석 노드
	 */
	function readLangConfig(node) {
		var mixConfigs,
			type = node.nodeValue.replace(MIX_REGEXP, '$1').trim(),
			body = node.nodeValue.replace(MIX_REGEXP, '$3')
				.replace(/[\r\n]/g, '')
				.replace(STRING_TO_JSON_REGEXP, '"$1":')
				.trim(),
			mixName,
			langConfigs = [];

		try {
			mixConfigs = JSON.parse(body);

			if (type === MIX_DISPLAY_TYPE) {
				for (mixName in mixConfigs) {
					if (!mixConfigs.hasOwnProperty(mixName)) continue;

					if (window.document.querySelectorAll('a[data-tg-anchor="mix:{0}"]'.format(mixName)).length == 0) {
						composeMenuAnchor(mixMenuEl, mixName, 'mix:{0}'.format(mixName));
					}

					if (!mixConfigs[mixName]) continue;

					if (mixConfigs[mixName] instanceof Array) {
						langConfigs = langConfigs.concat(mixConfigs[mixName]);
					} else if (mixConfigs instanceof String) {
						langConfigs.push(mixConfigs[mixName]);
					}
				}
			} else if (type === MIX_SCOPE_TYPE &&
				mixConfigs[LANG_ATTRIBUTE_NAME] &&
				langConfigs.indexOf(mixConfigs[LANG_ATTRIBUTE_NAME]) < 0) {
				langConfigs.push(mixConfigs[LANG_ATTRIBUTE_NAME]);
			} else if (type === MIX_LANG_TYPE) {
				if (!(mixConfigs instanceof  Array)) {
					mixConfigs = [mixConfigs];
				}

				langConfigs = langConfigs.concat(mixConfigs);
			}

			Array.prototype.forEach.call(langConfigs, function(langCode) {
				if (window.document.querySelectorAll('a[data-tg-anchor="lang:{0}"]'.format(langCode)).length == 0) {
					composeMenuAnchor(langMenuEl, langCode, 'lang:{0}'.format(langCode));
				}
			});
		} catch (e) {
			console.log(e);
		}
	}

	/**
	 * 주석으로 이루어진 믹스 설정을 해석한다.
	 * @param node 믹스 설정을 가진 주석 노드
	 * @param mixName 믹스 이름
	 * @param langCode 언어 코드
	 */
	function parseMixCommentNode(node, mixName, langCode) {
		return new Promise(function (resolve, reject) {
			var mixConfigs,
				type = node.nodeValue.replace(MIX_REGEXP, '$1').trim(),
				blocked = node.nodeValue.replace(MIX_REGEXP, '$2').trim() === MIX_BLOCK_MARK,
				body = node.nodeValue.replace(MIX_REGEXP, '$3')
					.replace(/[\r\n]/g, '')
					.replace(STRING_TO_JSON_REGEXP, '"$1":')
					.trim();

			try {
				mixConfigs = JSON.parse(body);

				// 각 타입에 맞게 분기해야 하는데, 내부에서 비동기 처리가 발생하는 경우 resolve를 넘겨 모든 처리가 끝났을 때 호출해야 한다.
				// 비동기 처리가 일어나지 않는 경우 여기서 바로 resolve를 호출해주면 된다.
				if (type === MIX_DISPLAY_TYPE) {
					mixDisplay(mixConfigs, mixName, langCode, node, blocked);

					resolve();
				} else if (type === MIX_LANG_TYPE) {
					mixLang(mixConfigs, langCode, node, blocked);

					resolve();
				} else if (type === MIX_INCLUDE_TYPE) {
					mixInclude(mixConfigs, langCode, node, resolve);
				} else if (type === MIX_ATTRIBUTE_TYPE) {
					mixAttribute(mixConfigs, langCode, node);

					resolve();
				} else if (type === MIX_SCOPE_TYPE) {
					mixScope(mixConfigs, langCode, node);

					resolve();
				}
			} catch (e) {
				console.log(e);
			}
		});
	}

	/**
	 * display 설정이 된 믹스를 처리한다.
	 * @param mixConfigs 믹스 설정
	 * @param mixName 믹스 이름
	 * @param langCode 언어 코드
	 * @param node 믹스 설정을 가진 주석 노드
	 * @param blocked 믹스 설정의 블록 형성 여부
	 */
	function mixDisplay(mixConfigs, mixName, langCode, node, blocked) {
		var key,
			matchOnAll = false;

		// 전체 믹스인 경우
		if (mixName === DEFAULT_MIX_NAME) {
			for (key in mixConfigs) {
				if (!mixConfigs.hasOwnProperty(key)) continue;

				matchOnAll = matchMixConfigWithLang(mixConfigs, key, langCode);

				if (matchOnAll) break;
			}

			displayElements(node, matchOnAll, blocked, MIX_DISPLAY_END_COMMENT);

			return;
		}
		// 믹스 이름에 해당되지 않는 경우, 해당되는 요소들을 모두 감춘다.
		if (mixName !== DEFAULT_MIX_NAME && !mixConfigs[mixName]) {
			displayElements(node, false, blocked, MIX_DISPLAY_END_COMMENT);

			return;
		}

		// 현재의 언어 설정과 믹스 설정의 언어 중 일치하는 것이 있으면 요소들을 표시하고 아니면 감춘다.
		displayElements(node, matchMixConfigWithLang(mixConfigs, mixName, langCode), blocked, MIX_DISPLAY_END_COMMENT);
	}

	/**
	 * 믹스 설정 중 믹스 이름과 언어 코드와 일치하는 내용이 있는지 없는지 검사한다.
	 * @param mixConfigs 믹스 설정
	 * @param mixName 믹스 이름
	 * @param langCode 언어 코드
	 * @returns {boolean} 믹스 설정 중 믹스 이름과 언어 코드와 일치하는 내용이 있으면 true, 그렇지 않으면 false가 반환된다.
	 */
	function matchMixConfigWithLang(mixConfigs, mixName, langCode) {
		var langConfig = mixConfigs[mixName];

		// 언어 설정을 배열화한다.
		if (!langConfig || !(langConfig instanceof Array)) {
			langConfig = langConfig ? [langConfig] : [];
		}

		return langConfig.length == 0 || langConfig.indexOf(langCode) > -1;
	}

	/**
	 * 믹스에 해당되는 요소들을 표시하거나 감춘다.
	 * @param node 믹스 설정을 가진 주석 노드
	 * @param display 요소 표시 여부
	 * @param blocked 믹스 설정의 블록 형성 여부
	 * @param endComment 블록이 형성된 경우의 마지막 주석 블록의 이름
	 */
	function displayElements(node, display, blocked, endComment) {
		display = display ? 'block' : 'none';

		if (blocked) {
			while (node = node.nextSibling) {
				if (node.nodeType === Node.COMMENT_NODE &&
					node.nodeValue.trim() === endComment) {
					break;
				}

				if (node.nodeType === Node.TEXT_NODE ||
					node.nodeType === Node.COMMENT_NODE) continue;

				node.style.display = display;
			}
		} else {
			nextElementSibling(node).style.display = display;
		}
	}

	/**
	 * lang 설정이 된 믹스를 처리한다.
	 * @param mixConfigs 믹스 설정
	 * @param langCode 언어 코드
	 * @param node 믹스 설정을 가진 주석 노드
	 * @param blocked 믹스 설정의 블록 형성 여부
	 */
	function mixLang(mixConfigs, langCode, node, blocked) {
		displayElements(node, mixConfigs.indexOf(langCode) > -1, blocked, MIX_LANG_END_COMMENT);
	}

	/**
	 * include 설정이 된 믹스를 처리한다.
	 * @param mixConfigs 믹스 설정
	 * @param langCode 언어 코드
	 * @param node 믹스 설정을 가진 주석 노드
	 * @param resolve 상위 call stack의 promise resolver
	 */
	function mixInclude(mixConfigs, langCode, node, resolve) {
		var path,
			endCommentNode,
			langConfigs = [];

		// 종료 주석 노드가 없는 경우 무효 처리한다.
		if (!(endCommentNode = findIncludeEndComment(node))) return;

		path = configs.lang[mixConfigs] instanceof Object ?
			configs.lang[mixConfigs][langCode] :
			configs.lang[mixConfigs];

		if (!path) {
			resolve();

			return;
		}

		request
			.get(path)
			.then(function(response) {
				var dom = convertTextToDom(response.text);

				Array.prototype.forEach.call(dom, function(el) {
					endCommentNode.parentNode.insertBefore(el, endCommentNode);
				});

				resolve();
			});
	}

	/**
	 * include 설정에 대한 종료 주석을 찾는다.
	 * 종료 주석을 찾는 동안 발견되는 요소 노드는 모두 제거한다.
	 * @param node 믹스 설정을 가진 주석 노드
	 * @returns {boolean} include 종료 주석을 찾은 경우 true, 그렇지 못한 경우 false
	 */
	function findIncludeEndComment(node) {
		var removeBooked = [],
			endNode;

		while (node = node.nextSibling) {
			if (node.nodeType === Node.ELEMENT_NODE ||
				node.nodeType === Node.COMMENT_NODE &&
				node.nodeValue.trim() !== MIX_INCLUDE_END_COMMENT) {
				removeBooked.push(node);
			}

			if (node.nodeType === Node.COMMENT_NODE &&
				node.nodeValue.trim() === MIX_INCLUDE_END_COMMENT) {
				endNode = node;

				break;
			}
		}

		removeBooked.forEach(function(node) {
			node.parentNode.removeChild(node);
		});

		return endNode;
	}

	/**
	 * DOM 텍스트를 DOM으로 변환합니다.
	 * @param domText DOM 텍스트
	 * @returns {*} DOM 텍스트를 변환하여 만들어진 DOM
	 */
	function convertTextToDom(domText) {
		var doc;

		if (!domText || typeof domText !== 'string') {
			return undefined;
		}

		doc = document.createElement('div');

		doc.innerHTML = domText;

		return doc.childNodes;
	}

	/**
	 * attribute 설정이 된 믹스를 처리한다.
	 * @param mixConfigs 믹스 설정
	 * @param langCode 언어 코드
	 * @param node 믹스 설정을 가진 주석 노드
	 */
	function mixAttribute(mixConfigs, langCode, node) {
		var attribute;

		for (attribute in mixConfigs) {
			if (!mixConfigs.hasOwnProperty(attribute)) continue;

			if (!configs.lang[mixConfigs[attribute]][langCode]) continue;

			nextElementSibling(node).setAttribute(attribute, configs.lang[mixConfigs[attribute]][langCode]);
		}
	}

	/**
	 * scope 설정이 된 믹스를 처리한다.
	 * @param mixConfigs 믹스 설정
	 * @param langCode 언어 코드
	 * @param node 믹스 설정을 가진 주석 노드
	 * @param blocked 믹스 설정의 블록 형성 여부
	 */
	function mixScope(mixConfigs, langCode, node, blocked) {
		var scope = mixConfigs[MIX_SCOPE_TYPE],
			lang = mixConfigs[LANG_ATTRIBUTE_NAME];

		try {
			if (!scope && !lang) {
				return;
			}

			if (scope && !(scope instanceof Array)) {
				scope = [scope];
			}

			if (lang && !(lang instanceof Array)) {
				lang = [lang];
			}

			replaceScopeElement(nextElementSibling(node),
				(scope && scope.indexOf(DEVICE_TYPE) < 0) || (lang && lang.indexOf(langCode) < 0));
		} catch(e) {
			console.log(e);
		}
	}

	/**
	 * scope 설정의 대상이 되는 요소의 태그 이름을 변경시키거나 혹은 원래대로 돌려놓는다.
	 * scope 설정의 대상은 숨기는 것이 아니라 태그 이름을 변경하여 브라우저가 인식하지 못하도록 만든다.
	 * @param el 대상 요소
	 * @param hiding 감출 예정일 경우 true
	 */
	function replaceScopeElement(el, hiding) {
		// scope 설정으로 변경되었던 요소인지를 판단한다.
		var tagNameMatched = !!el.tagName.toLowerCase().match(MIX_SCOPE_TAG_NAME_REGEXP),
			replaceEl,
			i = 0,
			attribute;

		// 감춰야 하는 대상인데 이미 변경되었는지 아니면 감춰야 할 대상이 아닌지를 판단한다.
		// 둘 중 하나라도 해당되면 처리하지 않는다.
		if ((hiding && tagNameMatched) || (!hiding && !tagNameMatched)) return;

		// 태그 이름을 브라우저가 인식하지 못하도록 변경하거나 혹은 원래대로 돌려놓기 위해서 새로운 요소를 만든다.
		replaceEl = document.createElement(hiding ?
			'tg-temp-{0}'.format(el.tagName) :
			el.tagName.replace(MIX_SCOPE_TAG_NAME_REGEXP, '$1'));

		// 새로운 요소를 만들고 기존 대상으로부터 어트리뷰트를 모두 복사한다.
		for (; i < el.attributes.length; i++) {
			attribute = el.attributes.item(i);

			replaceEl.setAttribute(attribute.nodeName, attribute.nodeValue);
		}

		// 컨텐츠를 복사한다.
		replaceEl.innerHTML = el.innerHTML;

		el.parentNode.replaceChild(replaceEl, el);
	}

	/**
	 * 텍스트 대체를 위해 텍스트 대체 설정이 된 주석을 탐색한다.
	 * @param langCode 언어 코드
	 */
	function replaceText(langCode) {
		var node,
			iter = document.createNodeIterator(document.body,
				NodeFilter.SHOW_COMMENT,
				function(node) {
					return node.nodeValue.match(LOCALIZED_TEXT_REGEXP) ?
						NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
				}, false);

		while (node = iter.nextNode()) {
			parseTextCommentNode(node, langCode);
		}
	}

	/**
	 * 주석으로 이루어진 텍스트 설정을 해석하고 해당되는 텍스트로 교체한다.
	 * @param node 텍스트 설정을 가진 주석 노드
	 * @param langCode 언어 코드
	 */
	function parseTextCommentNode(node, langCode) {
		var textKey = node.nodeValue.replace(LOCALIZED_TEXT_REGEXP, '$1').trim();

		if (!configs.lang[textKey]) return;

		// 텍스트 설정에 HTML 코드를 넣어 그것이 마크업에 반영되도록 innerHTML 속성에 텍스트를 설정하도록 한다.
		nextElementSibling(node).innerHTML = configs.lang[textKey][langCode];
	}

	/**
	 * 믹스 설정에 따라 믹스 이름에 맞게 마크업을 조합한다.
	 * 또, 언어 설정에 따라 언어 설정이 된 요소의 텍스트를 언어에 맞게 변경한다.
	 * @param mixName 믹스 이름
	 * @param langCode 언어 코드
	 */
	function solve(mixName, langCode) {
		mixName = mixName || getMixName();
		langCode = langCode || getLangCode();

		traverseMix(mixName, langCode, parseMixCommentNode)
			.then(function() {
				replaceText(langCode);
			});
	}

	Promise
		.all([
			traverseMix(null, null, readLangConfig),
			traverseClick(),
			readLangText()
		])
		.then(function() {
			solve();
		});
});