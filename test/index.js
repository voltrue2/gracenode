var singleRun = process.argv[process.argv.length - 2].replace('--single=', '');
var groupRun = process.argv[process.argv.length - 1].replace('--group=', '');
if (singleRun !== 'false') {
	require('./' + singleRun);
} else if (groupRun !== 'false') {
	var list = groupRun.split(',');
	for (var i = 0, len = list.length; i < len; i++) {
		require('./' + list[i]);
	}
} else {
	// test boilerplate
	require('./boilerplate');
	// test configurations w/ ENV
	require('./config');
	// test dev gracenode
	require('./dev');
	// test starting up of gracenode
	require('./start');
	// test with gracenode-server
	//require('./server');
	// test with express
	require('./express');
	// test daemon of gracenode
	require('./daemon');
	// test gracenode.http
	require('./http');
	// test gracenode.udp
	require('./udp');
	// test gracenode.rpc
	require('./rpc');
	// test gracenode.render
	require('./render');
	// test performance
	require('./performance');
}
