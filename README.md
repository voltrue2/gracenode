#GraceNode
©2013 - 2014 Nobuyori Takahashi < <voltrue2@yahoo.com> >

##Installation

###Installation via NPM

To install GraceNode you can either add it to your package.json like so,

```
{ 
    "dependencies": {
        "GraceNode": "git+https://github.com/voltrue2/GraceNode.git#master"
    }
}
```
or NPM install directly via `npm install git+https://github.com/voltrue2/GraceNode.git#master`.

###Creating configuration files

In your root directory create a directory that is called 'configs'. Although you can name it whatever you want, for this instruction we have named our directory configs.

<pre>
$ mkdir configs/
$ touch configs/conf.json
</pre>

Refer to `example-config.json` for an example configuration file.

##Bootstrapping GraceNode

GraceNode needs to be set up for it to run correctly. In your application add:

```
var gracenode = require('GraceNode');
//Set the configuration path.
gracenode.setConfigPath('configs/');
//Add configuration files that need to be loaded.
gracenode.setConfigFiles(['conf.json']);

// decide what module(s) of GraceNode to use in your application.
gracenode.use('server');
gracenode.use('view');
gracenode.use('mysql');

// now start the set up process
gracenode.setup(function (error) {
    if (error) {
        throw new Error('GraceNode failed to set up: ' + error);
    }
    // GraceNode is ready to go

});
```
#Gracenode 
##Methods

###.setConfigPath(configDirectoryPath [string])
Tells GraceNode where to find the configuraitons files.
```
gracenode.setConfigPath('configs/');
```

###.setConfigFiles(configFileList [array])
Give GraceNode the list of configuration files to be used. The files must be in the directory given to setConfigFiles.
```
gracenode.setConfigFiles(['conf.json']);
```

###.use(moduleName [string], params [object*])
Tells GraceNode what modules to load when calling the setup functions.
```
gracenode.use('mysql');
gracenode.use('myModule');
```

###.setup(callback [function])
Start the setting up of GraceNode modules.
```
gracenode.setup(function(error) {
    if (error) return console.error('Could not load gracenode:', error);
});
```

###.exit(errorMessage [string*])
Exits GraceNode and attempts to gracefully shutdown the process. You can give it an error message in case you want to stop the process due to an error.
```
gracenode.exit('financialCrisis');
```
##Events
Gracenode has the capabilities to emit events, you can catch these events using:
```
gracenode.on('event.name', yourEventHandler);
```
###setup.config
Emitted when the config module has been set up.
###setup.log
Emitted when the log module has been setup.
###setup.complete
Emitted when the setup has been completed.
###setup.moduleName
Emitted when a specific module has been setup.
###uncaughtException
Emitted when GraceNode caught an uncaught exception.
###exit
Emitted when GraceNode exits.
###shutdown
Emitted when GraceNode detects SIGINT. This is before exit is emitted.



#Default Modules
By default GraceNode automatically loads the following modules. Click on the link to read more about them.
###[Config](modules/config)
Handles everything config related.
###[Log](modules/log)
Takes care of logging.
###[Profiler](modules/profiler)
Used to profile your application so you can easily determine bottlenecks in your application.
###[Lib](modules/lib)
Contains a plethora of commonly used functions like random integer generation.
#Additional Modules
###[StaticData](modules/staticdata)
Allows for easy loading of static data such as JSON and CSV files.
###[Request](modules/request)
Handles requests to the server.
###[Server](modules/server)
Handles requests to the server.
###[UDP](modules/udp)
A module that makes it easier to handle UDP traffic from and to your server.
###[View](modules/view)
Manages, loads and creates views you can server to clients.
###[Session](modules/session)
Handles sessions and automatically expires them if they are not accessed within a preset amount of time.
###[Encrypt](modules/encrypt)
Contains functions that make it easier to deal with crypography and password hashing.
###[MySQL](modules/mysql)
A wrapper to handle MySQL connections without the hassle of maintaining your connection pool.
###[Datacache](modules/datacache)
Allows you to cache queries to MySQL and other requests.
###[Asset](modules/asset)
Asset management.
###[Message](modules/message)
Allows you to easily manage messages throughoout your application.

#Other

> How to handle and pass parameters
```javascript
// controller
// request URI /foo/index/one/two/
module.exports.index = function (requestObject, one, two, response) {
	// one and two are  the values in the request URI
	// by having these parameters and the arguments, these arguments will become requirements
	// missing arguments will cause and error
};
```

> How to redirect to another URL
```javascript
// controller
// request URI /foo/index/
module.exports.index = function (requestObject, response) {
	response.redirect('/anotherPage/');
};
```

***
#### <span id="view-module">view module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.view
</pre>

Configurations
```javascript
"modules": {
	"view": {
		"preload": ["file path"...], // optional
		"minify": true or false // default is true > minify css and js files
	}
}
```

#####API: *create*

<pre>
View create()
</pre>
> Returns an instance of View object

##### View class

> **assign**
<pre>
void assign(String name, mixed value)
</pre>
> Assigns a variable to be embeded to view file(s)
>> Exmple:
<pre>
// controller
gracenode.view.assign('foo', 'hello world');
// view file
(:= foo :)
// output
hello world
</pre>

> **get**
<pre>
mixed get(String name)
</pre>
> Get assigned value

> **load**
<pre>
void load(String vilewFilePath, Function callback)
</pre>
> Loads a view file.
```javascript
// controller file
module.exports.index = function (requestObj, responseObj) {
	gracenode.view.assign('foo', 'hello world');
	gracenode.view.load('/foo/index.html', function (error, contentData) {
		if (error) {
			return responseObj.error(error);
		}
		responseObj.data(contentData);
	});
};
// this will output "hello world"
```

###### How to include view files
```html
<!-- include header HTML file -->
<div class="header">
(:include common/header.html :)
</div>
<!-- include CSS file -->
<style type="text/css">
(:include css/main.css :)
</style>
<!-- include Javascript file -->
<script type="text/javascript">
(:include js/main.js :)
</script>
<!-- include ALL files in the directory -->
<div class="content">
(:include content/ :)
</div>
```
>> All included files have access to the variables assigned by **assign** function.
>>> All assigned variables are also available as Javascript variables in the client under window.gracenode object

###### Notes
> There is no **if** nor **for-loop** in view module because view template files are just template files and should not contain any sort of logic.
>> If you need to generate a list of items or change the display depending on certain conditions, please use *Javascript* to do so. After all we are using Nodejs.

***
#### <span id="session-module">session module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.session
</pre>

Configurations
```javascript
"modules": {
	"session": {
		"hosts": ["host:port", "host:port"...],
		"ttl": int (in seconds),
		"options": object
	}
}
```

#####API: *getSession*

<pre>
void getSession(String sessionId, Function callback)
</pre>
> Passes a session object to the callback

#####API: *setSession*
<pre>
void setSession(String, sessionId, mixed value, Function callback)
</pre>

***
#### <span id="encrypt-module">encrypt module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.encrypt
</pre>

Configurations
N/A

#####API: *createHash*

<pre>
void createHash(String sourceStr, Int cost, Function callback)
</pre>
> Creates a hash with salt from **sourceStr**
>> This function uses <a href="https://github.com/ncb000gt/node.bcrypt.js/">bcrypt</a> module and it is based on blowfish encryption.
>>> bigger the cost the slower this function will become.

#####API: *validateHash*

<pre>
void validateHash(String str, String hash, Function callback)
</pre>
> Validates a hash and **str**

#####API: *createSalt*

<pre>
void createSalt(Int cost, Function callback)
</pre>
> Creates a salt.

#####API: *uuid*

<pre>
String uuid(Int version, Object options, Buffer buffer, Array offset)
</pre>
> Creates a uuid. This module uses <a href="https://github.com/broofa/node-uuid">node-uuid</a> module.
>> Possible values for **version** are *1* or *4*
>>> Version 1 is timestamp-base and version 4 is random-base

***
#### <span id="mysql-module">mysql module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.mysql
</pre>

Configurations
```javascript
"modules": {
	"mysql": {
		"configNameOfYourChoice": {
			"database": "databaseName",
			"host": "host or IP address",
			"maxPoolNum": number <optional> default is 10
			"user": "databaseUser",
			"password": "databasePassword",
			"type": "ro" or "rw" // "ro" for Read Only and "rw" for Read and Write
		}...
	}
}
```

#####API: *create*
<pre>
MySql create(String configName)
</pre>
> Returns an instance of MySql class

##### MySql class

> **getOne**
<pre>
void getOne(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes a result to callback.
>> If no result is found, the funtion will throw an error.
```javascript
var mysql = gracenode.mysql.create('peopleDb');
mysql.getOne('SELECT age, gender FROM people WHERE name = ?', ['bob'], function (error, result) {
	if (error) {
		throw new Error('nothing found');
	}	
	// do something here
});
```

> **getMany**
<pre>
void getMany(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes results to callback
>> If no result is found, the function will throw an error.

> **searchOne**
<pre>
void searchOne(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes a result to callback
>> No result will **NOT** throw an error.


> **searchMany**
<pre>
void searchMany(String sql, Array params, Function callback)
</pre>
> Executes a "select" SQL query and passes results to callback
>> No result will **NOT** throw an error.

> **write**
<pre>
void write(String sql, Array params, Function callback)
</pre>
> Executes "insert/update/delete/truncate/alter/create/drop/" SQL query
>> Can **NOT** be executed if the *type* is "ro"

> **transaction**
<pre>
void transaction(Function taskCallback, Function callback)
</pre>
> Creates Mysql transaction and allows you to execute transactional SQL queries in taskCallback.
>> Commit will be executed automatically on successful execution of taskCallback
>>>> Can **NOT** be executed if the *type* is "ro"
```javascript
var mysql = gracenode.mysql.create('animalDb');
mysql.transaction(function (transactionMysql, finishCallback) {
	transactionMysql.write('INSERT INTO animal (name, species) VALUES(?, ?)', ['dog', 'knine'], function (error, res) {
		if (error) {
			return finishCallback(error);
		}
		transactionMysql.write('INSERT INTO food (animalName, amount) VALUES(?, ?)', ['dog', 10], function (error, res) {
			if (error) {
				return finishCallback(error);
			}
			// taskCallback is done. now move forward
			finishCallback();
		});
	});
}, 
function (error) {
	if (error) {
		throw new Error(error);
	}
	// All done and committed
});
```

> **placeHolder**
<pre>
Array placeHolder(Array params)
</pre>
> Creates and returns an array of *?* based on params given.
```javascript
var mysql = gracenode.create('people');
var params = ['jenny', 'ben', 'krista', 'ken'];
mysql.searchMany('SELECT * FROM people WHERE name IN (' + mylsq.placeHolder(params) + ')', params, function (error, res) {
	if (error) {
		throw new Error(error);
	}	
	// do something here
});
```

***
#### <span id="datacache-module">datacache module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.datacache
</pre>

Configurations
```javascript
"modules": {
	"hosts": ["hostName"...] or { "hostName": int (load balance)...},
	"ttl": int, // in seconds
	"options": Object
}
```

#####API: *create*

<pre>
Cache create(String name)
</pre>
> Returns an instance of Cache class. 
>> Cache class uses memcache.

##### Cache class

> **get**
<pre>
void get(String key, Function callback)
</pre>
> Read a value associated with the given key.
```javascript
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.datacache.create('people');
var sql = 'SELECT * FROM people WHERE name = ?';
var params = ['bob'];
peopleCache.get(sql + params.json(''), function (error, value) {
	if (error) {
		throw new Error(error);
	}
	if (value) {
		// we found the value > do something with it.
	} else {
		// no cache found
		peopleTable.getOne(sql, param, function (error, res) {
			if (error) {
				throw new Error(error);
			}
			// set cache
			peopleCache.set(sql + params.json(''), res, function (error) {
				if (error) {
					throw new Error(error);
				}
				// we are done
			});
		});
	});
});
```

> **set**
<pre>
void set(String key, mixed value, Function callback)
</pre>
> Sets a value associated with the given key.
```javascript
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.datacache.create('people');
var sql = 'SELECT * FROM people WHERE name = ?';
var params = ['bob'];
peopleCache.get(sql + params.json(''), function (error, value) {
	if (error) {
		throw new Error(error);
	}
	if (value) {
		// we found the value > do something with it.
	} else {
		// no cache found
		peopleTable.getOne(sql, param, function (error, res) {
			if (error) {
				throw new Error(error);
			}
			// set cache
			peopleCache.set(sql + params.json(''), res, function (error) {
				if (error) {
					throw new Error(error);
				}
				// we are done
			});
		});
	});
});
```

> How to flush old cache
```javascript
// flush old cache value on updated mysql data
var peopleTable = gracenode.mysql.create('people');
var peopleCache = gracenode.datacache.create('people');
var sql = 'UPDATE people SET age = ? WHERE name = ?';
var params = [40, 'bob'];
peopleTable.write(sql, params, function (error) {
	if (error) {
		throw new Error(error);
	}
	// successfully updated > now we need to flush out the old cache
	peopleCache.update(function (error) {
		if (error) {
			throw new Error(error);
		}
		// we are done
	});
});
```

***
#### <span id="asset-module">asset module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.asset
</pre>

Configurations
```javascript
"modules": {
	"asset": {
		"path": "pathToAssetDirectory"
	}
}
```

#####API: *getOne*

<pre>
Object getOne(String pathName)
</pre>
> Returns asset file object(s). 
>>
```javascript
// to get a file object of /img/backgrounds/bg001.png
var bg001 = gracenode.asset.getOne('img/backgrounds/bg001');
/*
* bg001 will be:
* { key: 'img/backgrounds/bg001', type: 'png', hash: 'fd8g0f8gd==' }
*/
// to get all file objects in /img/backgrounds/
var backgrounds = gracenode.asset.getOne('img/backgrounds/');
/*
* backgrounds will be:
* { bg001: {file object}, bg002: {file object}, bg003: {file object} }
*/
```

#####API: *getMany*

<pre>
Array getMany(Array pathNameList)
</pre>
> Returns an array of asset file object(s)

#####API: *getDataByKey*

<pre>
Object getDataByKey(String assetFileKey)
</pre>
> Returns an asset data object

```javascript
// to get the binary data of /img/backgrounds/bg001.png
var bg001 = gracenode.asset.getOne('img/backgrounds/bg001');
var bg001Data = gracenode.asset.getDataByKey(bg001.key);
/*
* bg001Data will be:
* { data: binary data of the file, path: '~asset/img/backgrounds/bg001.png' }
*/
```

#####API: getDataByKeyAndHash

<pre>
Object getDataByKeyAndHash(String assetFileKey, String assetFileHash, Function callback)
</pre>
> Returns an asset data object.
>> If the file hash is old, the function will read the file and update the cache map before returning the data object

```javascript
var bg001 = gracenode.asset.getOne('img/backgrounds/bg001');
gracenode.asset.getDataByKeyAndHash(bg001.key, bg001.hash, function (error, bg001Data) {
	if (error) {
		// handle error
	}
	// do something here
});
```

***
#### <span id="udp-module">udp module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.udp
</pre>

Configurations
```javascript
"modules": {
	"udp": {
		"servers": [
			{ name: "unique name for server", "host": "host name or IP", "port": port number }[...]
		],
		"requests": {
			"unique request name": { "host": "host name or IP", "port": port number }
		}
	}
}
```

#####API: *startServers*

<pre>
void startServers(Function callback)
</pre>
> Starts all UDP servers and calls the callback function when all the servers are up

#####API: *getServerByName*

<pre>
Object getServerByName(String serverName)
</pre>
> Returns a server object by a server name defined in the configurations
>> *startServer* MUST be called before invoking this function

Example
```javascript
var server = gracenode.udp.getServerByName('server');

// handle UDP message requests
server.on('message', function (messageBuffer, requestObj) {
	// do something
});

// handle error
server.on('error', function (error) {
	// handle error
});
```

#####API: send

<pre>
void send(String requestName, Mixed message, Object options, Function callback)
</pre>
> Sends a UDP packet message to destination named in the configurations
>> The callback returns error as the first argument and bytes sent as the second argument

***
#### <span id="iap-module">iap module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.iap
</pre>

Configurations
```javascript
"modules": {
	"iap": {
		"sandbox": true or false,
		"sql": {
			"read": "mysql module configuration name",
			"write": "mysql module configuration name"
		},
		"googlePublicKeyPath": "path to google play public key files" // the file names MUST be specific (for live: iap-live, for sandbox: iap-sandbox)
	}
}
```

#####API: *validateApplePurchase*

<pre>
void validateApplePurchase(String receipt, Function cb)
</pre>
> Sends an HTTPS request to Apple to validate the given receipt and responds back an object { validateState: 'validated' or 'error', status: 'pending' or 'handled' or 'canceled' }

#####API: *validateGooglePurchase*

<pre>
void validateGooglePurchase(Object receipt, Function cb)
</pre>
> Validates the receipt with public key using open SSL

#####API: *updateStatus*

<pre>
void updateStatus(Mixed receipt, String status, Function cb)
</pre>
> Updates the status of the given receipt. the valid status are: pending, handled, canceled.


***
#### <span id="wallet-module">wallet module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.wallet
</pre>

Configurations
```javascript
"modules": {
	"names": [an array of wallet names],
	"sql": {
		"read": "mysql module configuration name",
		"write": "mysql module configuration name"
	} 
}
```

#####API: *create*

<pre>
Wallet create(String walletName)
</pre>
> Returns an instance of Wallet class by a wallet name
>> The wallet name needs to be defined in the configuration file

##### Wallet class

> **getBalanceByUserId**
<pre>
void getBalanceByUserId(String uniqueUserId, Function callback)
</pre>
> Rerturns the current balance of a wallet in the callback as a second argument

> **addPaid**
<pre>
void addPaid(String uniqueReceiptHash, String uniqueUserId, Int price, Int value, Function onCallback<optional>, Function callback)
</pre>
> Adds the value to a wallet as "paid"
>> "paid" represents that the user has paid real money

>> If onCallback is given: the function will be called BEFORE committing the "add" transaction, if an error occuries in onCallback, the transaction can be rolled back

> **addFree**
<pre>
void addFree(String uniqueReceiptHash, String uniqueUserId, Int value, Function onCallback<optional>, Function callback)
</pre>
> Adds the value to a wallet as "free"
>> "free" represents that the user has been given the value as free gift

>> If onCallback is given: the function will be called BEFORE committing the "add" transaction, if an error occuries in onCallback, the transaction can be rolled back

Example:
```javascript
// example code with iap module
gracenode.iap.validateApplePurchase(receipt, function (error, response) {
	if (error) {
		// handle error here
	}
	
	// check the validated state
	if (response.validateState === 'validated') {
		// Apple has validated the purchase
		
		var hc = gracenode.wallet.create('hc');
		hc.addPaid(receipt, userId, itemPrice, itemValue, 
			
			// this callback will be called BEFORE the commit of "addPaid"
			function (continueCallback) {
				
				// update iap status to mark the receipt as "handled"
				gracenode.iap.updateStatus(receipt, 'handled', function (error) {
					if (error) {
						// error on updating the status to "handled"
						return continueCallback(error); // this will make "addPaid" to auto-rollback
					}

					// iap receipt status updated to "handled" now commit
					continueCallback();			

				})
			
			},
			
			// this callback is to finalize "addPaid" transaction
			function (error) {
				if (error) {
					// error on finalizing the transaction
				}

				// we are done!
			}	
	
		);
		
	}

});


```

> **spend**
<pre>
void spend(String uniqueUserId, Int value, String spendFor, Function onCallback, Function callback)
</pre>
> Spends value from a wallet if allowed
>> spendFor should represent what the user has spend the value for

>> If onCallback is given: the function will be called BEFORE committing the "spend" transaction, if an error occuries in onCallback, the transaction can be rolled back

Example:
```javascript
// example of how to use wallet.spend
var itemToBePurchased = 'test.item.1000';
var cost = 1000; // this is the amount that will be taken out of wallet 'hc'
var hc = gracenode.wallet.create('hc');
hc.spend(userId, cost, itemIdToBePurchase,
	
	// this callback will be called BEFORE the commit of "spend"
	function (continueCallback) {

		// give the user what the user is spending value for
		user.giveItemByUserId(userId, itemToBePurchased, function (error) {
			if (error) {
				// failed to give the user the item
				return continueCallback(error); // rollback
			}
			
			// succuessfully gave the user the item
			continueCallback();

		});	
	},

	// this callback is to finalize "spend" transaction
	function (error) {
		if (error) {
			// error on finalizing the transaction
		}

		// we are done!
	}

);

```

***
#### <span id="memcache-module">memcache module</span>
<a href="#top">Back to the list of built-in modules</a>
***

Access
<pre>
gracenode.memcache
</pre>

Configurations
```javascript
"modules": {
	"memcache": {
		"hosts": ["host:port", "host:port"...],
		"ttl": int (in seconds),
		"options": object
	}
}
```

#####API: *create*

<pre>
Cache create(String name)
</pre>
> Returns and instance of Cache object with "name" as a prefix of every key

##### Cache class

> **getOne**
<pre>
void getOne(String key, Function callback)
</pre>

> **getMany**
<pre>
void getMany(Array keyList, Function callback)
</pre>

> **set**
<pre>
void set(String, key, Mixed value, Function callback);
</pre>

> **replace**
<pre>
void relace(String key, Mixed value, Function callback)
</pre>

> **del**
<pre>
void del(String key, Function callback)
</pre>


### Useing GraceNode With Apache
> apache configuration example

```xml
# proxy to nodejs process
<VirtualHost *:80>
    ServerAdmin yourname@yourdomain.com
    DocumentRoot /var/www/yourdomain.com/htdocs
    ServerName yourdomain.com

    ProxyRequests off

    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    ProxyPreserveHost on
    ProxyPass /asset ! # do not proxy this path
    ProxyPass / http://yourdomain.com:8000/ # proxy everything else to GraceNode
    ProxyPassReverse / yourdomain.com:8000/

</VirtualHost>
```
