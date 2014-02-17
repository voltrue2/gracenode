#### <span id="asset-module">asset module</span>
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
