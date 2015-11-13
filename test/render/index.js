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

	it('can render a large template', function () {
		var data = {
			wiki: 'Wiki',
			internet: 'Internet',
			listOne: [
				{
					url: '/wiki/Internet_access',
					title: 'Internet access',
					text: 'Access'
				},
				{
					url: '/wiki/Internet_censorship',
					title: 'Internet censorship',
					text: 'Censorship'
				},
				{
					url: '/wiki/Internet_democracy',
					title: 'Internet democracy',
					text: 'Democracy'
				},
				{
					url: '/wiki/Digital_divide',
					title: 'Digital divide',
					text: 'Digital divide'
				},
				{
					url: '/wiki/Digital_rights',
					title: 'Digital rights',
					text: 'Digital rights'
				},
				{
					url: '/wiki/Freedom_of_informantion',
					title: 'Freedom of information',
					text: 'Freedom of information'
				},
				{
					url: '/wiki/History_of_the_Internet',
					title: 'Histtory of the Internet',
					text: 'History of the Internet'
				},
				{
					url: '/wiki/Internet_phenomena',
					title: 'Internet phenomena',
					text: 'Ineternet phenomena'
				},
				{
					url: '/wiki/Net_neutrality',
					title: 'Net neutrality',
					text: 'Net neutrality'
				},
				{
					url: '/wiki/Internet_pioneers',
					title: 'Internet pioneers',
					text: 'Pioneers'
				},
				{
					url: '/wiki/Internet_privacy',
					title: 'Internet privacy',
					text: 'Privacy'
				},
				{
					url: '/wiki/Sociology_of_the_Internet',
					title: 'Sociology of the Internet',
					text: 'Sociology'
				},
				{
					url: '/wiki/Global_Internet_usage',
					title: 'Global Internet usage',
					text: 'Usage'
				}
			],
			listTwo: [
				'Domain Name System',
				'Hypertext Transfer Protocol',
				'Internet Protocol',
				'Internet protocol suite',
				'Internet service provider',
				'IP address',
				'Internet Message Access Protocol',
				'imple Mail Transfer Protocol'
			],
			listThree: [
				'Algeria',
				'Angola',
				'Benin',
				'Botswana',
				'Burkina Faso',
				'Burundi',
				'Cameroon',
				'ape Verde',
				'Central African Republic',
				'Chad',
				'Comoros',
				'Democratic Republic of the Congo',
				'Djibouti',
				'Egypt',
				'Equatorial Guinea',
				'Eritrea',
				'Ethiopia',
				'Gabon',
				'The Gambia',
				'Ghana',
				'Guinea',
				'Guinea-Bissau',
				'Ivory Coast (Côte d\'Ivoire)',
				'Kenya',
				'Lesotho',
				'Liberia',
				'Libya',
				'Madagascar',
				'Malawi',
				'Mali',
				'Mauritania',
				'Mauritius',
				'Morocco',
				'Mozambique',
				'Namibia',
				'Niger',
				'Nigeria',
				'Rwanda',
				'São Tomé and Príncipe',
				'Senegal',
				'Seychelles',
				'Sierra Leone',
				'Somalia',
				'South Africa',
				'South Sudan',
				'Sudan',
				'Swaziland',
				'Tanzania',
				'Togo',
				'Tunisia',
				'Uganda',
				'Zambia',
				'Zimbabwe'
			]
		};
		var rendered = gn.render('/large/1.html', data);
		var expected = fs.readFileSync(__dirname + '/expected/4.html', 'utf8');
		assert.equal(expected, rendered);
	});

	it('can render using cache to a large template', function () {
		var data = {
			wiki: 'Wiki',
			internet: 'Internet',
			listOne: [
				{
					url: '/wiki/Internet_access',
					title: 'Internet access',
					text: 'Access'
				},
				{
					url: '/wiki/Internet_censorship',
					title: 'Internet censorship',
					text: 'Censorship'
				},
				{
					url: '/wiki/Internet_democracy',
					title: 'Internet democracy',
					text: 'Democracy'
				},
				{
					url: '/wiki/Digital_divide',
					title: 'Digital divide',
					text: 'Digital divide'
				},
				{
					url: '/wiki/Digital_rights',
					title: 'Digital rights',
					text: 'Digital rights'
				},
				{
					url: '/wiki/Freedom_of_informantion',
					title: 'Freedom of information',
					text: 'Freedom of information'
				},
				{
					url: '/wiki/History_of_the_Internet',
					title: 'Histtory of the Internet',
					text: 'History of the Internet'
				},
				{
					url: '/wiki/Internet_phenomena',
					title: 'Internet phenomena',
					text: 'Ineternet phenomena'
				},
				{
					url: '/wiki/Net_neutrality',
					title: 'Net neutrality',
					text: 'Net neutrality'
				},
				{
					url: '/wiki/Internet_pioneers',
					title: 'Internet pioneers',
					text: 'Pioneers'
				},
				{
					url: '/wiki/Internet_privacy',
					title: 'Internet privacy',
					text: 'Privacy'
				},
				{
					url: '/wiki/Sociology_of_the_Internet',
					title: 'Sociology of the Internet',
					text: 'Sociology'
				},
				{
					url: '/wiki/Global_Internet_usage',
					title: 'Global Internet usage',
					text: 'Usage'
				}
			],
			listTwo: [
				'Domain Name System',
				'Hypertext Transfer Protocol',
				'Internet Protocol',
				'Internet protocol suite',
				'Internet service provider',
				'IP address',
				'Internet Message Access Protocol',
				'imple Mail Transfer Protocol'
			],
			listThree: [
				'Algeria',
				'Angola',
				'Benin',
				'Botswana',
				'Burkina Faso',
				'Burundi',
				'Cameroon',
				'ape Verde',
				'Central African Republic',
				'Chad',
				'Comoros',
				'Democratic Republic of the Congo',
				'Djibouti',
				'Egypt',
				'Equatorial Guinea',
				'Eritrea',
				'Ethiopia',
				'Gabon',
				'The Gambia',
				'Ghana',
				'Guinea',
				'Guinea-Bissau',
				'Ivory Coast (Côte d\'Ivoire)',
				'Kenya',
				'Lesotho',
				'Liberia',
				'Libya',
				'Madagascar',
				'Malawi',
				'Mali',
				'Mauritania',
				'Mauritius',
				'Morocco',
				'Mozambique',
				'Namibia',
				'Niger',
				'Nigeria',
				'Rwanda',
				'São Tomé and Príncipe',
				'Senegal',
				'Seychelles',
				'Sierra Leone',
				'Somalia',
				'South Africa',
				'South Sudan',
				'Sudan',
				'Swaziland',
				'Tanzania',
				'Togo',
				'Tunisia',
				'Uganda',
				'Zambia',
				'Zimbabwe'
			]
		};
		var s = Date.now();
		var rendered = gn.render('/large/1.html', data, 1000);
		var e = Date.now();
		var time1 = e - s;
		var expected = fs.readFileSync(__dirname + '/expected/4.html', 'utf8');
		assert.equal(expected, rendered);
		s = Date.now();
		rendered = gn.render('/large/1.html', data, 1000);
		e = Date.now();
		var time2 = e - s;
		assert.equal(expected, rendered);
		assert.equal(time1 > time2, true);	
	
		console.log('Render time:', time1 + 'ms', 'Cached time:', time2 + 'ms');
	});

});
