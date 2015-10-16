# gracenode 2.0

©Nobuyori Takahashi < voltrue2@yahoo.com >

## What gracenode does

- Manages cluster process.

- Handles daemonizing of the application and auto-restarting on file changes.

- Bootstrap other modules to organize setting up of each module on starting of the application process.

- Provides a built-in logging module.

- Provides plethora of utility functions to aid development.

## Installation via npm

**NOTE:** If you are running your application as a daemon with older version of gracenode, please make sure to stop the daemon before installing the newer version.

`npm install gracenode`

## Add gracenode as your application's dependency

To install gracenode you can either add it to your package.json like so:

**Install From Git Repository**
```json
{
    "dependencies": {
        "gracenode": "git+https://github.com/voltrue2/gracenode.git#master"
    }
}
```

**Install From npm Repositiory**
```json
{
    "dependeicies": {
        "gracenode": "0.2.2"
    }
}
```

**Install From Git Without package.json**

`npm install git+https://github.com/voltrue2/gracenode.git#master`

## How To Use gracenode

In order to use gracenode, you need to properly set it up in your application root file (The file that starts your application).

### Configure Logging and Cluster Management

These are optional configurations, but you will want to know what they do.

```javascript
var gn = require('gracenode');

// Here the configurations are given as an object
gn.configure({
	log: {
		file: '/path/to/my/logging/dir/'
	},
	cluster: {
		// Maximum number of workers
		max: 0
	}
});

// Now start gracenode
gn.start(function () {
	// Your application is now ready!
});

```

**NOTE 1:** You may give the configurations as a JSON file also:

```javascript
gn.config(require('/path/to/my/config.json'));
```

**NOTE 2:** You may call `.config()` as many times a syou need to merge the configuration objects.

This is useful when you have shared common configurtions with other developers and your custom configrations for each.

#### Example:

```javascript
gn.config(require('/path/to/my/shared/config.json'));
gn.config(require('/path/to/my/custom/config.json'));
```

**NOTE 3:** More details for logging and cluster configurations will be given later in this `README`.

## Start Your Application As A Daemon

There are 2 different ways to start your application as a daemon.

#### Example 1:

Assuming `app.js` is your appliction file to execute.

`node app.js start -l /path/to/my/daemon/logging/`

#### Example 2:

gracenode creates `./gracenode` executable when you install gracenode.

Assuming `app.js` is your appliction file to execute.

`./gracenode app.js start -l /path/to/my/daemon/logging/`

**NOTE:** More details on the daemonization command options will be explain later in this `REAME`.


