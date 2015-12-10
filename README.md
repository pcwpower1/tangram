# Tangram

Tangram은 마크업 도구로 자바스크립트나 PHP의 도움없이 마크업 페이지를 다양한 형태로 구성할 수 있도록 도와줍니다.
HTML이나 CSS 외에는 필요하지 않습니다.

## Getting Started

### Basic syntax

Tangram은 기능 설정을 위해 **주석(comments)**을 사용합니다. 이는 HTML 가독성을 해치지 않기 위함입니다.

```html
<!-- tg-[indicator]=(>){"key": "value"} -->
     --            ---  --------------
    prefix       blocker  indication
```

위와 같은 주석을 적용하고 하는 요소 위에 선언하여 적용합니다.

#### indicator
Tagnram은 자신이 가진 기능을 *indicator*라고 부릅니다. 이 indicator에 의해 내부적으로 어떤 기능을 수행할 지를 결정하게 됩니다.
indicator는 prefix를 dash('-')로 연결하여 사용합니다.

#### prefix
prefix는 *tg*(Tangram의 줄임말)를 사용합니다.

#### blocker
*blocker*는 indicator와 indication의 연결고리로 실제로는 block의 형성 여부를 결정합니다.
여기서 말하는 *block*이라는 것은 indicator가 처리해야 하는 요소들이 2개 이상일 경우 이를 묶어주는 것을 말합니다.

처리해야 할 요소가 2개 이상이라면 **=\>**을 사용해야 하며, 반드시 닫는(closed) indicator가 필요합니다.

```html
<!-- tg-display=>{"key": "value"} -->
<div>첫번째 요소</div>
<div>두번째 요소</div>
<!-- tg-display --> // closed indicator
```

처리해야 할 요소가 1개라면 block을 만들 필요가 없으므로 **=**을 blocker로 사용하면 됩니다.

```html
<!-- tg-text="key" -->
<p>이 요소 내의 텍스트는 변경될 것입니다.</p>
```

> *=>* 나 *=* 중 어떤 것을 blocker로 사용할지는 요소의 개수에 따라서 결정되기도 하지만, 어떤 indicator를 사용하는냐에 따라 결정되기도 합니다.
> indicator에 따라 block을 형성할 수도 형성하지 못할 수도 있으므로 indicator 사용법을 참고하시기 바랍니다.

#### indication

indicator가 어떤 기능을 해야 할지 결정한다면, *indication*은 그 기능의 세부적인 내용을 설정하는데 그 목적이 있습니다.

indication은 표준 JSON 리터럴로 구성되어야 하며, 그렇지 않을 경우 indicator가 동작하지 않습니다.
indication은 각각의 indicator별로 그 형태를 달리 하므로 indicator 사용법을 참고하시기 바랍니다.

### Configuration JSON

Tangram은 indicator에 따라 어떤 설정을 요구하게 되는데, 이 설정 중 일부는 외부 파일에 저장하도록 되어 있습니다.
이는 설정을 위한 주석이 길어지는 것을 방지하기 위한 목적도 가지고 있습니다.

```json
{
  "key1": "value",
  "key2": { }
}
```

이 설정 파일의 이름은 마크업 페이지의 이름과 동일해야 합니다.
만약, 마크업 페이지가 *index.html*라는 이름을 가지고 있다면 설정 파일은 동일한 경로 내에 *index.json*이라는 이름으로 위치해 있어야 합니다.

> 마크업 페이지와 같은 이름이라는 규약 덕분에 별도의 설정을 하지 않아도 Tangram이 설정 파일을 자동으로 인식 가능합니다.

### Language attribute

Tangram은 마크업 페이지가 사용하는 언어가 어떤 언어인지를 인식하기 위해 HTML 요소의 *lang* 속성의 값을 감지합니다.

`html[lang="ko"]`인 경우, 해당 페이지는 한국어 페이지이므로 언어 설정과 관련된 모든 indicator는 한국어를 기반으로 동작하게 됩니다.
lang 속성의 값은 [Language Subtag Registry](http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)를 확인하시기 바랍니다.

## Indicators

### Scope

마크업 페이지는 여러 환경에서 사용되는데, 큰 맥락에서 데스크톱, 모바일, 태블릿이 그 환경이 될 수 있습니다.
그리고, 특정 환경에서만 사용되는 요소들이 있을 수도 있습니다.

예를 들자면, *meta 요소*에 설정되는 *viewport*의 경우, (일반적으로)데스크톱에서는 사용되지 않지만 모바일이나 태블릿에서는 사용됩니다.
그런 경우, 해당 meta 요소에 *scope*을 설정하여 모바일 혹은 태블릿일 때에만 viewport를 적용할 수 있습니다.

#### Syntax

```html
<!-- tg-scope={"scope": [scope]...(, "lang": [lang-code]...])} -->
<element ...>
```

##### scope property

*scope* 속성은 다음과 같은 값을 가질 수 있습니다.

* desktop
* mobile
* tablet

이 속성은 *user-agent*를 감지하여 판별하므로 데스크톱 브라우저에서도 user-agent를 조작하여 모바일 혹은 태블릿 환경처럼 구성할 수 있습니다.

##### lang property

*lang* 속성은 scope 설정이 어떤 언어 설정 내에서만 동작할지를 지정합니다.
예를 들어, scope 설정을 한국어 페이지인 경우에만 동작하도록 하려면 `<!-- scope={..., "lang": "ko"} -->` 혹은 `<!-- tg-scope={..., "lang": ["ko"]} -->`와 같이 설정합니다.

### Attribute

요소의 속성(attribute) 중 일부 속성은 언어에 따라 달라져야 할 수도 있습니다.
Tangram의 *attribute* indicator를 사용하면 이를 언어 설정에 따라 간편하게 바꿀 수 있습니다.

#### Syntax

```html
<!-- tg-attribute={[attribute-name]: [attribute-key]])} -->
<element ...>
```

##### attribute-name

요소에 설정 가능한 속성의 이름을 지정하면 됩니다. 예를 들어, `img` 요소의 `alt` 속성이 *attribute-name*이 될 수 있습니다.

##### attribute-key

속성에 대응하는 key로 Configuration JSON에서 해당되는 key를 찾게 됩니다.
key에 대응하는 객체의 property 중 현재의 언어 코드와 일치하는 값을 속성의 값으로 대치하게 됩니다.

#### Example

```JSON
{
  "caption": {
    "ko": "캡션",
    "en": "caption"
  }
```

만약 위와 같은 Configuration JSON이 있다고 가정했을 때 `<!-- tg-attribute={"alt": "caption"} -->`과 같이 설정된 요소의 `alt` 속성은 한국어 페이지일 때 "캡션", 영어 페이지일 때는 "caption"으로 나오게 됩니다.

### Display

동일한 마크업 페이지 내에서 어떤 요소(혹은 요소 집합)는 특정한 조건에서만 표시되어야 하는 경우가 있습니다.
이럴 때에는 *display* indicator를 사용하여 이를 해결할 수 있습니다.

#### Syntax

```html
<!-- tg-display={<display-type>: [<language-code>]...)} -->
<element ...>
```

혹은 다음과 같이 *block*을 형성할 수도 있습니다.

```html
<!-- tg-display=>{<display-type>: [<language-code>]...)} -->
<element ...>
<element ...>
...
<!-- tg-display -->
```

##### display-type

특정 조건을 나타낼만한 이름을 문자열로 지정하면 됩니다.

##### language-code

특정 언어의 상태에서 요소를 표시하고자 할 때 사용합니다.
만약, 언어의 제약을 두지 않으려면 빈 문자열(\"\")이나 빈 배열(\[\])로 표시합니다.
특정하고자 하는 언어가 1개라면 문자열로 지정해도 되고, 2개 이상이라면 배열로 지정해야 합니다.

#### Example

어떤 요소들을 'A타입'의 조건에서 영문 페이지인 경우에만 표시하고자 한다면 다음과 같이 설정합니다.

```html
<!-- tg-display=>{"A타입": "en"} -->
<element ...>
<element ...>
...
<!-- tg-display -->
```

또는 'B타입'의 조건에서 한국어 페이지 혹은 영어 페이지인 경우에 요소 하나를 표시하고자 한다면 다음과 같이 설정합니다.

```html
<!-- tg-display={"A타입": ["ko", "en"]} -->
<element ...>
```

### Lang

*lang* indicator를 사용하면 *display-type* 조건없이 언어 제약만으로 요소(혹은 요소 집합)을 표시하거나 표시하지 않을 수 있습니다.

#### Syntax

```html
<!-- tg-lang=[<language-code>] -->
<element ...>
```

혹은 하나의 언어에만 반응해야 하고 block을 형성해야 한다면 다음과 같이 설정해야 합니다.

```html
<!-- tg-lang="<language-code>" -->
<element ...>
<element ...>
...
<!-- tg-lang -->
```

##### language-code

특정 언어의 상태에서 요소를 표시하고자 할 때 사용합니다.
만약, 언어의 제약을 두지 않으려면 빈 문자열(\"\")이나 빈 배열(\[\])로 표시합니다.
특정하고자 하는 언어가 1개라면 문자열로 지정해도 되고, 2개 이상이라면 배열로 지정해야 합니다.

##### Example

한국어 페이지인 경우에만 요소를 표시하고 싶은 경우 다음과 같이 설정합니다.

```html
<!-- tg-lang="ko" -->
<element ...>
```

한국어 혹은 영어 페이지인 경우에 요소 집합을 표시하고 싶은 경우에는 다음과 같이 설정합니다.

```html
<!-- tg-lang=>["ko", "en"] -->
<element ...>
<element ...>
...
<!-- tg-lang -->
```

### Include

특정 영역에 다른 HTML 파일의 요소들을 가져와 표시하고 싶을 때에는 *include* indicator를 사용하면 됩니다.

> PHP의 include와 비슷합니다.

#### Syntax

```html
<!-- tg-include=>"<include-key>" -->
<!-- tg-include -->
```

*include* indicator의 경우 반드시 block을 형성해야 하며, block 내에 있는 요소는 include가 발생할 때 모두 제거되므로 주의하시기 바랍니다.

##### include-key

include indicator를 사용하려면 *include-key*를 지정해야 하는데, 이는 Configuration JSON에 설정해야 합니다.
include-key의 값은 문자열이며, 포함시키려고 하는 요소(혹은 요소 집합)가 기록되어 있는 파일의 경로를 설정합니다.

#### Example

{
  "include_page": "include.page.html"
}

위와 같은 Configuration JSON이 있다고 가정합니다.

```html
<!-- tg-include=>"include_page" -->
<p>이 요소는 include가 발생할 때 제거됩니다.</p>
<!-- tg-include-->
```

위와 같이 Configuration JSON에 설정된 'include_page'를 *include* indicator의 key로 사용하면 됩니다.
그렇게 하면 Tangram이 해당 key의 값인 'include.page.html'를 자신이 참조할 경로로 인식하여 경로의 HTML 요소들을 해당 block 내에 추가하게 됩니다.

### Text

다국어를 지원해야 하는 페이지를 마크업할 때 불편했던 점은 언어별로 마크업 페이지 파일을 따로 만들어야 한다는 점입니다.
그렇게 하지 않는다면 PHP를 사용해 분기 처리하는 방법이 있습니다.
하지만, 각각 관리 대상 파일의 증가와 가독성 저하라는 문제를 야기합니다.
그래서 Tangram은 Configuration JSON을 이용해 언어 설정에 따라 요소 내 텍스트를 변경할 수 있는 *text* indicator를 제공합니다.

#### Syntax

```html
<!-- tg-text=<text-key> -->
<element ...>
```

text indicator는 어떠한 경우에도 block을 형성하지 않습니다.

##### text-key

Configuration JSON에 설정하는 key로 그에 대한 값으로 `Object`를 설정해야 합니다.
이 Object는 이름을 language code로 하고 그에 대한 텍스트를 값으로 하는 property들을 가집니다.

#### Example

{
  "text_key": {
    "ko": "텍스트_값"
    "en": "text_value"
  }
}

위와 같이 Configuration JSON에 설정되어 있다고 가정합니다.

```html
<!-- tg-text=text_key -->
<p>이 요소의 텍스트가 변경될 것입니다.</p>
```

위와 같이 paragraph 요소에 text indicator가 설정되어 있고 한국어 페이지로 설정한 경우 해당 요소의 텍스트는 '텍스트_값'으로 변경됩니다.
만약 영어 페이지로 설정한 경우에는 요소의 텍스트가 'text_value'로 변경됩니다.

### Click

Tangram은 결코 어떠한 Javascript 라이브러리나 프레임워크를 대체하기 위해 만들어진 것이 아닙니다.
단지 마크업 편의를 증대시키기 위한 도구일 뿐입니다.
하지만, 마크업에서 어떤 요소에 대한 인터렉션의 간단한 구현은 요구되기도 하며 또 꽤 괜찮은 프로토타이핑 방법이기도 합니다.

그래서 Tangram에서는 아주 간단한 인터렉션을 손쉽게 일으킬 수 있는 *click* indicator를 지원하기로 했습니다.

> 차후에 이 기능이 마우스 호버 등의 인터렉션을 지원하도록 확장해야 한다면 최소한의 부분을 지원하게 될 것입니다.

#### Syntax

```html
<!-- tg-click={"<interaction-type>": "<interaction-ref>"} -->
```

##### interaction-type

설정된 요소에서 클릭 이벤트가 발생하게 됐을 때 처리해야 할 동작의 유형을 설정하게 됩니다.
그 유형은 다음과 같습니다.

* toggleclass: interaction-ref에 설정된 값을 CSS 클래스 이름으로 간주하고 해당 클래스를 해당되는 요소에 부여하거나 뺍니다.
* show: interaction-ref에 설정된 값을 selector로 간주하고 해당되는 요소를 표시하거나 숨깁니다.

##### interaction-ref

interaction-type에 따라 그 모양과 쓰임새가 달라지는 값입니다.

#### Example

```html
<!-- tg-click={"toggleclass": ".css-class", "show": ".test"} -->
<element ...>

<element class="test">
```

위와 같이 click indicator를 설정했을 때 첫번째 요소를 클릭하게 되면 첫번째 요소에 `toggleclass` 설정에 의해 .css-class라는 CSS 클래스가 부여되거나 빠지며, `show` 설정에 따라 두번째 요소가 보여지거나 숨겨지게 됩니다.

## Browser supported

마크업 도구로써 브라우저 지원 범위는 굉장히 민감한 부분입니다.
그래서 Tangram은 최대한 하위 브라우저까지 지원하도록 노력했습니다.

지원되는 브라우저는 다음과 같습니다:

* Internet Explorer(버전 7.0 이상)
* Chrome
* FireFox
* Safari

> IE의 경우, 7.0에서 click indicator의 일부 인터렉션이 지원되지 않습니다.
이는 Tangram을 구현할 때 필요로 하는 polyfill들을 최소화하기 위함입니다.
또한, 차후 지원 브라우저의 하한선을 높일 때에 polyfill을 빼도 문제가 없게끔 만들고자 하는 의도에서 비롯된 것입니다.

## Build

### Repository Cloning

Tangram을 사용하시려면, 우선 Tangram의 저장소를 여러분들의 로컬 시스템에 복제해주시기 바랍니다.

```sh
$ git clone https://github.com/tangramjs/tangram.git
```

### Dependencies management

Tangram의 의존성 관리는 **npm(Node Packagement Manager)**이 담당합니다.
npm은 [Node.js](https://nodejs.org)를 설치할 때 함께 설치됩니다.

npm 설치 후 저장소 내에서 다음과 같이 의존성을 설치합니다.

```sh
$ npm install
```

### Moduler

의존성들을 모아 하나로 빌드하기 위해 Webpack을 사용합니다.

### Task runner

빌드를 손쉽게 하기 위해 [Gulp](http://gulpjs.com)를 사용합니다.
다음과 같이 Gulp를 설치합니다.

```sh
$ npm install --global gulp
```

### Build

Tangram을 빌드할 때는 task runner인 `gulp`를 사용합니다.
빌드를 위해 gulpfile.js에서 build 태스크를 제공합니다.

```sh
$ gulp build
```

빌드가 성공적으로 완료되면 build 디렉토리에 tagnram.js가 만들어지므로 마크업 페이지에 `<script src="tangram.js">`와 같은 형태로 선언하여 사용하면 됩니다.
