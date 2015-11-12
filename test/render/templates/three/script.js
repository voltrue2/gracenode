(function () {
	var test = 'Test Variable';
	var num = parseInt('{{num}}', 10);

	function doSomething() {
		for (var i = 0; i < parseInt('{{max}}', 10); i++) {
			console.log(i, test, num + 1);
		}
	}
	
	// do something here
	doSomething();
}());
