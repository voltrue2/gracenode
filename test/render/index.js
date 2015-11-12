var fs = require('fs');
var assert = require('assert');
var gn = require('../../src/gracenode');

describe('gracenode.render', function () {
	
	it('can set up gracenode.render', function (done) {
		gn.config({
			render: {
				path: __dirname + '/templates'
			},
			router: {
				host: 'localhost',
				port: 4444
			}
		});
		gn.start(done);
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
			c: '/two',
			d: '日本語',
			e: '"quoted"'
		};
		var rendered = gn.render('/one/index.html', data);
		var expected = fs.readFileSync(__dirname + '/expected/1.html', 'utf8');
		assert.equal(expected, rendered);
	});

	it('can render a template and require css style and javascript', function () {
		var data = {
			title: 'ペットの名前一覧',
			subtitle: 'Table',
			list: [
				{ category: 'Dog', name: 'Fuchsia' },
				{ category: 'Cat', name: 'Genki' },
				{ category: 'Cat', name: '元気' }
			],
			num: 1000,
			color: '#00f',
			max: 10
		};
		var rendered = gn.render('/three/index.html', data);
		var expected = fs.readFileSync(__dirname + '/expected/2.html', 'utf8');
		assert.equal(expected, rendered);
	});

	it('can render complex object and array mix variables', function () {
		var data = {
			one: { type: 'string', value: 'One' },
			two: { type: 'number', value: 2 },
			three: { type: 'array', value: [3] }
		};
		var vars = {
			keys: Object.keys(data),
			data: data
		};
		var rendered = gn.render('/index.html', vars);
		var expected = fs.readFileSync(__dirname + '/expected/3.html', 'utf8');
		assert.equal(expected, rendered);
	});

});
