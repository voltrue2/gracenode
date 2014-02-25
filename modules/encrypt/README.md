***
Encrypt
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

