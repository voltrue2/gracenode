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
		var rendered = gn.render.render('/one/index.html', data);
		var expected = fs.readFileSync(__dirname + '/expected/1.html', 'utf8');
		assert.equal(expected, rendered);
	});

});
