var singleRun = process.argv[process.argv.length - 1].replace('--single=', '');
if (singleRun !== 'false') {
	require('./' + singleRun);
} else {
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
	// test gracenode.router
	require('./router');
	// test gracenode.render
	require('./render');
}
