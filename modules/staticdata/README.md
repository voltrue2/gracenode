#### <span id="staticdata-module">staticdata module</span>
***

Access
<pre>
// do this in your bootstrap file (index.js) before invoking gracenode.setup().
gracenode.use('gracenode', 'gracenode');
// once gracenode.setup is finished. you can access the module as following:
gracenode.staticdata
</pre>

Configurations
```javascript
// staticdata module supports CSV and JSON format
{
	"modules": {
		"staticdata": {
			"path": "directory path to the static files",
			"delimiter": optional and defaults to ',', // for parsing CSV files
			"quote": optional and defaults to '"' // for parsing CSV files
			"index": { // optional // for getOneByIndex and getManyByIndex
				"staticFileName": ["indexName", [...]]
			}
		}
	}
}
```

#####API: *create*
<pre>
StaticData create(String dataName)
</pre>
> Returns and instance of StaticData class
>> Example:
```javascript
/* 
In order to create a static data object from a static data file called "example.csv",
do the following:
*/
var example = gracenode.staticdata.create('example');
```

##### StaticData class

> **getOneByIndex**
<pre>
mixed getOneByIndex(String indexName, String indexKey, Function callback)
</pre>
**getManyByIndex**
<pre>
mixed getManyByIndex(String indexName, Array indexKeyList, Function callback)
</pre>
**getOne**
<pre>
mixed getOne(mixed key, Function callback)
</pre>
**getMany**
<pre>
mixed getMany(Array keyList, Function callback)
</pre>
**getAll**
<pre>
mixed getAll(Function calback)
</pre>