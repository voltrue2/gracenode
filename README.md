##How to set it up
<pre>
$ cd yourApp/
$ git clone https://github.com/voltrue2/GraceNode GraceNode
$ cd GraceNode/
$ npm install
</pre>

> If you execute the above commands and every thing goes fine, GraceNode is successfully installed along with its dependencies

##Create configuration files
<pre>
$ cd yourApp/
$ mkdir configs/
</pre>
> You will then create your configuration file(s) under configs/ directory. The format is JSON. For reference please refer to GraceNode/example-config.

##index.js file for bootstrapping
<pre>
$ cd yourApp/
$ ls -la
$ ..
$  .
$ index.js
$ GraceNode/
</pre>
> GraceNode needs to be set up for it to run correctly.
>> Below is the example code to set up GraceNode

<pre>
var gracenode = require('../GraceNode/gracenode');
// tell GraceNode where to look for configuration file(s)
// we will explain the effect of the function "gracenode.getRootPath()" later.
gracenode.setConfigPath(gracenode.getRootPath() + 'configs/');
// tell GraceNode the name(s) of configuration files to load
gracenode.setConfigFiles(['base.json', 'modules.json']);
// decide what module(s) of GraceNode to use in your application.
// we will explain this in more detail later.
gracenode.use('server', 'server');
gracenode.use('view', 'view');
gracenode.use('mysql', 'mysql');
// now start the set up process
gracenode.setup(function (error) {
    if (error) {
        throw new Error('GraceNode failed to set up: ' + error);
    }
    // GraceNode is ready to go

});
</pre>

## GraceNode Built-in Modules
> GraceNode has some built-in modules.

#### Automatically loaded by GraceNode on setup
- config
- log
- profiler
- lib

#### Other optional modules
- datacache
- mysql
- staticdata
- request
- server
- view
- session

### Built-in Modules

#### config 

Access
<pre>
gracenode.config
</pre>

####API

<pre>
mixed getOne(string propName)
</pre>
> Returns the value of configuration property
>> Example
```php
// configuration JSON
{ "foo": 
    { 
         "boo": 1
    }
}
// query the value of "foo"
$foo = gracenode.config.getOne("foo");
// $foo = array("boo" => 1)

// query the value of "boo"
$boo = gracenode.config.getOne("foo.boo");
// $boo = 1
