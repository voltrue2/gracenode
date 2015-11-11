var assert = require('assert');
var render = require('../../src/render');

describe('gracenode.render', function () {
	
	it('can set up gracenode.render', function (done) {
		render.config(__dirname + '/templates');
		render.setup(done);
	});

	it('can render a template', function () {
		var data = {
			jspath: '/test/path',
			list: [
				'/test/list/1',
				'/test/list/2'
			],
			a: 'A',
			b: 'B',
			c: '/two'
		};
		var rendered = render.render('/one/index.html', data);
		var expected = '<!DOCTYPE html><html><head><script type="text/javascript" src="/test/path">';
		expected += '</script><script type="text/javascript" src="/test/list/1"></script>';
		expected += '<script type="text/javascript" src="/test/list/2"></script>';
		expected += '</head><body><div class="whatever">Foo</div><div>Required!!</div>';
		expected += '<h2>Variable&nbsp;b&nbsp;is&nbsp;B</h2><div>0&nbsp;=&nbsp;/test/list/1</div><div>1&nbsp;=&nbsp;/test/list/2</div>';
		expected += '{{ if (a === b):<h1>A&nbsp;is&nbsp;B</h1>else if (a !== b):<h1>A&nbsp;is&nbsp;NOT&nbsp;B</h1>endif }}';
		expected += '<div>Required!!</div><h2>Variable&nbsp;b&nbsp;is&nbsp;B</h2><div>0&nbsp;=&nbsp;/test/list/1</div>';
		expected += '<div>1&nbsp;=&nbsp;/test/list/2</div><script type="text/javascript">';
		expected += 'var list = [1,2,3,4,5,6,7,8,9];for (var i = 0, len = list.length; i < len; i++) {console.log(\'yes \' + i);}';
		expected += '</script><div>Test&nbsp;0</div><div>Test&nbsp;10</div><div>Test&nbsp;20</div>';
		expected += '<div>Test&nbsp;30</div><div>Test&nbsp;40</div><div>Test&nbsp;50</div><div>Test&nbsp;60</div>';
		expected += '<div>Test&nbsp;70</div><div>Test&nbsp;80</div><div>Test&nbsp;90</div><div>Test&nbsp;100</div></body></html>';
	
		assert.equal(expected, rendered);
	});

});
