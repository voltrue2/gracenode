# Render

Render allows you to create dynamic content from templated static files.

It also supports caching rendered data for static templates to improve the run-time performance.

It is useful for web pages etc.

## gracenode.render(path [string], data [object], cacheTtl [*number])

## path

A path to the pre-rendered file data to render. 

## data

An object to be inserted into the rendered file data.

## cacheTtl

An option to use cache for rendered template data.

If this parameter is not given, it does not use cache

The cache data will be ignored if given `data` is different from the cached rendered data.

**NOTE**: cacheTtl is in miliseconds. If the cache needs to last for 24 hours, cacheTtl = 8640000.

**Default**: Default cache TTL is 1 hour. Pass `0` to ignore caching.

## Configurations

Render requires a path to read the template files from.

It will then read all template files and pre-render them on the application process start.

```
render: {
	path: '/path/to/my/templates',
	*cacheSize: <number>
}
```

**cacheSize** is an optional configuration to change the default cache size in `bytes`.

Default cache size is `2MB`.

**Example**:

```javascript
var gn = require('gracenode');
gn.config({
	render: {
		path: '/path/to/my/template/files/'
	}
});
```

## Embedding Dynamic Data

Render can insert dynamically define values to rendered template file data.

## Access Variables

**gracenode** allows access to the dynamically defined variables from the client-side javascript.

**Example** 

To access the variable named `example`:

```
<script type="text/javascript">

	console.log(window.gracenode.example);

</script>
```

All dynamically defined variables for rendered data can be accessed under `window.gracenode`.

## Embed Variables

**Syntax**

```
{{variableName}}
```

**Example**:

```html
<div>{{myCar}}</div>
```

```javascript
var rendered = gracenode.render('/myview.html', {
	myCar: 'BMW'
});
```
The above examples will result in `{{myCar}}` being replaced by `{ myCar: 'BMW' }`, so the rendered result is:

```html
<div>BMW</div>
```

### Pass a function as a variable

You may also pass a `function` as a variable to your template. The function **MUST** return some type of value.

It is very useful when you need to have complex logic to render templates.

The returned value of the function will be embedded as a dynamic variable.

Example:

```javascript
var data = {
	name: 'Bach',
	listOfMusic: function () {
		var html = '';
		for (var i = 0, len = listOfBachMusic.length; i < len; i++) {
			var item = listOfBachMusic[i];
			switch (item.genre) {
				case 'choir':
				html += '<li class="' + item.genre + ' choir-color">' + item.name + '</li>';
				break;
				case 'orchestra':
				html += '<li class="' + item.genre + ' orchestra-color">' + item.name + '</li>';
				break;
				case 'organ':
				html += '<li class="' + item.genre + ' organ-color">' + item.name + '</li>';		
				break;
				default:
				// do nothing show nothing
				break;
			}
		}
		return html;
	}
};
gracenode.render('path/to/template', data);
```

## Custom Registered Functions

Render allows user custom functions to be registered and used in render templates.

**Example**:

```javascript
gracenode.render.func('myFunction', function (variableValue) {
	// do somethig here
	return variableValue * 2; 
});
var data = {
	myValue: 4
};
var rendered = gracenode.render('/path/to/my/template', data);
```

```
This is my template. {{ myValue }} x 2 = {{ myFunction(myValue) }}.
```

```
This is my template. 4 x 2 = 8.
```

## Literals

Render allows you define `literals` so that render does not attempt to render certain section of your templates.

**Example**:

```
{{literal if (A === B): Example endif literal}}
```

The above example will not render as `if` statement but rendered literally instead.

## Handle Require Statement

Render can combine multiple pre-rendered template files into one file and render it as one render data.

**Syntax**

```
{{require(/path/to/my/partial.html)}}
```

## Handle If/Else If/Else Statements

Render handles simple if statements.

**WARNING**: You must not have nested if statements.

**WARNING**: You must not have if statement inside of for statement. 

**Syntax**

```
{{if ({a} === {b}):
	<div>{a}&nbps;is&nbsp;{b}</div>
endif}}
```

**Example**:

```html
{{if ({a} === {b}):
	<div>{a}&nbps;is&nbsp;{b}</div>
else if (a > b):
	<div>{a}&nbsp;is&nbsp;greater&nbps;than&nbsp;{b}</div>
else:
	<div>{a}&nbps;is&nbsp;NOT&nbsp;{b}</div>
endif}}
```

```javascript
var rendered = gracenode.render('myview.html', {
	a: 100,
	b: 10
});
```

**IMPORTANT**: The variables inside **if** must be `{variableName}` NOT `{{variableName}}`.

The above example will result in `<div>{a}&nbsp;is&nbsp;greater&nbps;than&nbsp;{b}</div>` to be in the rendered result:

```html
<div>100&nbsp;is&nbsp;greater&nbps;than&nbsp;10</div>
```

## Handle For Statements (Array Only)

Render handles simple for statements.

**WARNING**: You must not have nested for statements.

**WARNING**: You must not have if statement inside for statement.

**Syntax**

```
{{for (i = i < {list.length}; i++):
	<div>{i}:{list.i}</div>
endfor}}
```

**NOTE**: `{list.i}` = `list[i]`

**Example**:

```html
{{for (i = 0; i < {list.length}; i++):
	<div>{i}:{list.i}</div>
endfor}}
```

```javascript
var rendered = gracenode.render('/myview.html', {
	list: [
		'Apple',
		'Carrot',
		'Orange'
	]
});
```

**IMPORTANT**: The variables inside **for** must be `{variableName}` NOT `{{variableName}}`.

The above example will result in:

```html
<div>0:Apple</div>
<div>1:Carrot</div>
<div>2:Orange</div>
```

## Handle ForEach Statement (Object Only)

Render handles a simple for loop for object as `foreach`.

**Syntax**

```
{{foreach (key in {map}):
	<div>{key}:{map.key}</div>
endforeach}}
```

**NOTE**:

`{map.key}` = `map[key]`

**Example**

```html
{{foreach (key in {map}):
	<div>{key}:{map.key}</div>
endforeach}}
```

```javascript
var rendered = gracenode.render('/myview.html', {
	map: {
		meat: beef,
		meat: pork,
		fruit: apple,
		veggi: beans
	}
});
```

**IMPORTANT**: The variables inside **foreach** must be `{variableName}` NOT `{{variableName}}`.

The above example will result in:

```html
<div>meat:beef</div>
<div>meat:pork</div>
<div>fruit:apple</div>
<div>veggi:beans</div>
```

## Client-Side Automatic HTML Rendering

`gracenode.render()` supports client-side automatic rendering based on data.

## Auto-Render From Remotely Fetched Data

In order to auto-render HTML by remotely fetched data, add the following to the target HTML element:

```
<div data-gn-src="http://mywebapp.com/get/some/data"></div>
```

The above will get data from `http://mywebapp.com/get/some/data`, and render it to HTML.

## Auto-Render From Local Data

Cient-side auto-rendering can also render HTML element from locally available javascript value(s).

```
<div data-gn-local="myLocalData.listData"></div>
```

The above example will try to read data from `window.myLocalData.listData` and render it to HTML.
