var singleRun = process.argv[process.argv.length - 1].replace('--single=', '');
if (singleRun !== 'false') {
	require('./' + singleRun);
} else {
	// test boilerplate
	require('./boilerplate');
	// test dev gracenode
	require('./dev');
	// test starting up of gracenode
	require('./start');
	// test with gracenode-server
	require('./server');
	// test with express
	require('./express');
	// test daemon of gracenode
	require('./daemon');
	// test gracenode.udp
	require('./udp');
	// test gracenode.http
	require('./http');
	// test gracenode.render
	require('./render');
}
