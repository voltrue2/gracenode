#gracenode.cron
##How to schedule a new task
In your config, make sure you have the schedule set for your task to run, for example:
```
    "methods:" {
		"cron": {
			"myCronJob": {
				"schedule": "*/30 * * * * *"
			}
		}
	}
```
On one of your machine, retrieve a Cron object like this:
```
var cron = gracenode.cron.create('myCronJob');
```
Next up you should add a callback to executed on each tick, if you're running a cluster of seperate nodes make sure that this is only executed on your master.
```
cron.addCallback(function() {
    console.log('I will show every 30 seconds!');
});
```
Finally, start the cronjob:
```
cron.start();
```

##Methods
###cron.create(name)
Returns a new `Cron` object
```
var cron = gracenode.cron.create('myCronJob');
```

##Cron object
###constructor
```
var cron = new Cron('* * * * * *');
```

###cron.setTime(time)
Set the time a cronjob should be executed, for example every 5 minutes:
```
cron.setTime('0 */5 * * * *');
```

###cron.addCallback(func)
Add a callback to be executed on each tick
```
cron.addCallback(function () {
  console.log('I am executed on every tick!');
});
```

###cron.start()
Start the cronjob, will executed a callback on every tick
```
cron.start();
```

###cron.stop()
Stop the cronjob, will prevent each callback to be executed on every tick.
```
cron.stop();
```

###cron.getNextDate()
Get a date object when the next tick will happen. The cronjob does not have to be running for this function to work.
```
var nextTick = cron.getNextDate();
console.log('Next tick will take place:', nextTick);
```

###cron.getSecondsRemaining()
Get the seconds remaining until the next tick. The cronjob does not have to be running for this function to work.
```
console.log('The cronjob will execute in', cron.getSecondsRemaining(), 'seconds');
```
