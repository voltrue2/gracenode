# Change Log

This is a list of manually mantained changes and updates for each version.

## Version 3.5.9

## Added

None

## Changed

#### RPC optimized: state object is kept per connection until disconnect

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.5.8

## Added

#### CI test for node version 7.3 added

## Changed

#### Replaced var with const where it makes sense

#### Dependency gracelog version udpated to 0.6.9

#### Dependency aeterno version updated to 0.6.5

#### Dependency cluster-mode version updated to 1.2.0

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.5.7

## Added

None

## Changed

#### CryptoEngine returns an error when detecting an invalid packet instead of throw

#### Transport packet protocol version 2 performance improved

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.5.6

## Added

None

## Changed

#### CryptoEngine returns an error when detecting an invalid packet instead of throw

#### Transport packet protocol version 2 performance improved

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.5.4

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### UUID removed "-"

#### Use const whever and whenever possible

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.5.3

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Corrected transport protocol version 2 header size

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.5.2

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Transport protocol parser added better error logging

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.5.1

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC parser loop will not disconnect if it gets caught in a loop that is too long

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.5.0

## Added

#### RPC and UDP added a new protocol: version 2 to allow batched commands

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Bug fix: HTTP disabling gzip was not working properly

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.4.54

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Binary transport default is binary not JSON

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.53

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Minimum supported version of node.js has changed from 0.12.0 to 4.0.0

#### Overall performance improvements by switching to minimum support version

#### RPC connection kill by error log removed stack trace

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.52

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Dependency gracelog version updated from 0.6.7 to 0.6.8

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.51

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Bug fix: RPC timed out cleaner function was using invalid function to kill timed out connections 

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.50

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Bug fix: Starting up logic had syn functions to test logging target directory writable or not

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.49

## Added

None

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Bug fix: RPC timeout cleaner was calling an invalid function isTimeout instead of isTimedout

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.4.48

## Added

#### gracenode.lib.bsearch() added

`gracenode.lib.bsearch` is a binary search to find an index of an object in an array

```javascript
// this will search for an object with a key "id = 100"
var index = gracenode.lib.bsearch(listOfObjects, 'id', 100);
```

#### gracenode.lib.brange() added

`gracenode.lib.brange` is a fast search to find objects in an array that match between two given values

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC timed out connection search performance improved

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.47

## Added

#### UDP added a new method .multipush(...)

A method to send a UDP packet to multiple clients effeciently.

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### Removed CryptoEngine memory cache

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.46

## Added

#### Added performance to test to unit tets

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC, UDP, and session removed verbose loggings

#### CryptoEngine added static methods of encrypt and decrypt: The instantiation has been deprecated

#### CryptoEngine added local memory cache of cipher data

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.45

## Added

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC and UDP encryption minor performane improvement

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.44

## Added

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC bug fix: Response of heartbeat if custom formatted, the binary becomes corrupt

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.43

## Added

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC and UDP encryption/decryption performance improvements (CTR-MODE)

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.41

## Added

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC added time-based timedout TCP connection cleaner

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.40

## Added

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### RPC and UDP added shutdown check when trying to send packets to clients

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.39

## Added

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### UDP added a new method .push(msg, address, port, callback)

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.38

## Added

#### [Planned] Gracenode process internal communication via UDP protocol (Mesh Network)

Gracenode internal communication (gic) is a de-centralized mesh network that enables all gracenode processes includingremote processes to comunicate to one another.

It is very useful to build distributed-network system in real-time.

## Changed

#### UDP changed state.status to state.STATUS

#### Debug logs are now verbose logs

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.37

## Added

None

## Changed

#### Updated dependency jshint version to 2.9.3

#### Updated dev dependency request version to 2.75.0

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.36

## Added

None

## Changed

#### HTTP, RPC, and UDP logging less verbose

#### RPC command handling added check for socket validity

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.35

## Added

None

## Changed

#### RPC command handling added check for socket validity

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.34

## Added

None

## Changed

#### RPC corrected the accepted incoming packet port range

Previously it was considering `65536` to be invalid.

#### UDP added accepted incoming packet port range

The range is `0` > and => `65536`.

## Version 3.4.33

## Added

None

## Changed

#### RPC kills connection if client port is out of the range of 0 and 65536 as invalid and/or malformed packet

#### All anonymous functions have been named

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.32

## Added

None

## Changed

#### RPC state added .clientAddress and .clientPort

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.31

## Added

None

## Changed

#### UDP session fixed using incorrect remote address and remote port

#### Naming ananymous functions (WIP)

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

# Version 3.4.30

## Added

None

## Changed

#### RPC default errors such as NOT_FOUND etc now has a string message instead of stringified JSON 

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.29

## Added

None

## Changed

#### RPC state object added a function respond(), which is the same as callback

#### Dependency gracelog version updated

to v0.6.7

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.28

## Added

None

## Changed

#### Dependency gracelog version updated

to v0.6.7

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.27

## Added

None

## Changed

#### Dependency gracelog version updated

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.26

## Added

None

## Changed

#### UDP send packet exception is now caught

#### Dependency gracelog version updated

#### RPC routing logging minor improvements

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.25

## Added

None

## Changed

#### RPC wirtting to a socket error is now caught properly and passed as an error to the callback

#### RPC socket exceptions are caught properly on close, destory, and removal of listeners

#### RPC server closes sockets on end event also

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.24

## Added

None

## Changed

#### Improved overall logging verbosity

#### RPC bot added for more thorough tests

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.23

## Added

None

## Changed

#### RPC server shutdown will forcefully close TCP connections from the server

#### RPC uint test improved

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.22

## Added

None

## Changed

#### RPC connhandler renamed to connection

#### RPC Connection instance removed crypt (it was typeo of crypto)

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.21

## Added

None

## Changed

#### RPC connection class refactored

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.20

## Added

None

## Changed

#### RPC shutdown race condition bug fix

#### RPC onClose() and onKill() callbacks no longer pass instance of connection

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.19

## Added

None

## Changed

#### RPC server shutdown now forces connections to close while shutting down

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.18

## Added

None

## Changed

#### RPC per connection logging bug fix: now respects log level

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.17

## Added

None

## Changed

#### Removed connection map from RPC to avoid memory leak

#### RPC improved per connection logging to use less memory

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.16

## Added

None

## Changed

#### RPC payload parser does not auto-parse as JSON anymore

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.15

## Added

None

## Changed

#### RPC heartbeat check stops after connection close

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.14

## Added

None

## Changed

#### RPC fixed exception on null error w/ status > 1

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.13

## Added

#### RPC added .setHeartbeatResponseFormat(format [function])

`.setHeartbeatResponseFormat()` allows you to send custom heartbeat response data to the client.

## Changed

#### RPC response status default has been corrected for errors

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.12

## Added

None

## Changed

#### RPC default normal response status bug corrected

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.11

## Added

None

## Changed

#### RPC default response status bug corrected

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.10

## Added

None

## Changed

#### Updated dependency version gracelog v0.6.4

#### Updated dependency version aeterno v0.6.4

#### Session improved some logging

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.9

## Added

None

## Changed

#### UDP and RPC uses 2 separate sessions internally when used together to avoid race condition of seq

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.8

## Added

None

## Changed

#### BREAKING Bug fix: v3.4.7 broke UDP command handler

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.4.7

## Added

None

## Changed

#### RPC state object added command

#### RPC reply packet removed comand (reply packet cannot have command b/c reply flag is at the same offset) 

#### RPC corrected auto-status for reply

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.6

## Added

None

## Changed

#### RPC now uses the same transport module as UDP

#### transport module now added .getStatus()

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.4.5

## Added

None

## Changed

#### UDP can now change the max packet size

#### Dependency cluster-mode version updated to 1.1.0

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.4.4

## Added

None

## Changed

#### Decryption error handling no longer throws an error. Instead it returns and error

#### UDP configuration now support port

#### UDP multiple command registration name check bug fixed

#### RPC configuration now supports port

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.4.3

## Added

None

## Changed

#### UDP and RPC encryption from server does not require seq

#### Corrected README.md

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.4.2

## Added

None

## Changed

#### gracenode.lib.transport added

#### HTTP, UDP, and RPC added address family to .info()

#### .stop() call trace is added to logs when application calls .stop()

#### UDP/TCP transport packet bug fix parsing seq using the same offset as command

#### UDP push packets uses seq

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


# Version 3.4.0

## Added

None

#### C# Cient class added

`client/cs/Packet.cs` and `client/cs/Crypto.cs` have been added.

These classes handle `UDP` and `RPC` packet protocol.

## Changed

#### UDP status values changed

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


# Version 3.3.0

## Added

None

## Changed

#### UDP server hanged its packet protocol to binary from JSON

**WANRING**: This change is a breaking change.

This change removes the support for JSON formatted packet protocol from UDP server and replaces with binary protocol as follows:

#### Request Packet Structure

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 16 Big Endian|Command ID           |
|Byte Offset 6 |uint 16 Big Endian|**Sequence**         |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

**Protocol Version**: Currently protocol version is 0.

#### Reply Packet Structure

UDP server can also push packets as response to command requests.

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 8            |**Reply Flag**       |
|Byte Offset 5 |uint 8            |**Status**           |
|Byte Offset 6 |uint 16 Big Endian|Sequence             |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

**Protocol Version**: Currently protocol version is 0.

**Reply Flag** The value is `0x01`.

**Status** The value of Status can be manually set by the application.

#### Push Packet Structure

|Offset        |Size              |Meaning              |
|:------------:|:----------------:|:-------------------:|
|Byte Offset 0 |uint 8            |**Protocol Version** |
|Byte Offset 0 |uint 32 Big Endian|Payload Size         |
|Byte Offset 4 |uint 8            |**Push Flag**        |
|Byte Offset 5 |uint 8            |**Status**           |
|Byte Offset 6 |uint 16 Big Endian|**Sequence**         |
|Byte Offset 8 |                  |Payload              |
|              |uint 32 Big Endian|**Magic Stop Symbol**|

**Protocol Version**: Currently protocol version is 0.

**Push Flag** The value is `0x0`.

**Status** The value of Status for push packets is always `0x0`.

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***


## Version 3.2.0

## Added

None

## Changed

#### UDP server supports IPv6

To use IPv6, use the following configuration:

```
var gracenode = require('gracenode');
gracenode.config({
	// if you give IPv6 address, this is not required
	version: 'IPv6',
	address: 'fe80xxxxx' or '::0' for all address
});
```

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.1.0

## Added

None

## Changed

#### RPC can now register multiple command handlers to the same command ID and name

#### UDP can now register multiple command handlers to the same command ID and name

#### HTTP can now register multiple request handlers to the same URL

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.16

## Added

None

## Changed

#### UDP and RPC session can now be shared

#### Render can pass a function as a dynamic variable to be

Example:
```javascript
var data = {
	greeting: 'Hello',
	today: function () {
		return Date.now();
	}
};
gracenode.render('/path/to/my/template', data);
```

#### UDP and RPC encryption and decryption now uses Buffer class as node.js v6.0+ (still support older node version also)

<a href="https://nodejs.org/dist/latest-v6.x/docs/api/buffer.html#buffer_new_buffer_str_encoding" target="_blank">https://nodejs.org/dist/latest-v6.x/docs/api/buffer.html#buffer_new_buffer_str_encoding</a>

```javascript

// v6.0+
Buffer.from(str, 'base64');

// older node version
new Buffer(str, 'base64');

````

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.15

## Added

None

## Changed

#### Dependency cluster-mode module version updated to 1.0.1

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.14

## Added

None

## Changed

#### Bug fix: UDP and RPC command hooks .hook() now handles an array of command IDs/command names correctly

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.13

## Added

None

## Changed

#### Bug fix: UDP and RPC server handles single port correctly given in the configuration

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.12

## Added

None

## Changed

#### UDP server an now run with one port number instead of minimum of 2 port numbers

#### Bug fix: UDP and RPC .hook() can now register a hook function to all commands by passing a hook function only

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.11

## Added

None

## Changed

#### UDP and RPC hooks can now be registered by command names as we as command IDs

#### Basic C# test clients build scripts support Mac OS

#### Session validation for UDP and RPC minor improvments

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.10

## Added

#### RPC added session handshake

Added session handshake to keep remote IP and port in order to block highjacked sessions used with different connections

#### UDP added session handshake

Added session handshake to keep remote IP and port in order to block highjacked sessions used with different connections

#### CI tests added for node.js version 5+ and 6.0

#### render.getAllPaths() added

## Changed

#### RPC fixed heartbeat issues with multiple connections

#### Corrected HTTP unit tests for response asserts on HEAD requests

#### Changed the way gracenode loads internal modules to support require() change in node.js v6.0.0

#### gracenode.start() executiong order has changed: bootstapping of external module will be the last operation now

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.9

## Added

#### Running node.js version check added to UDP and RPC for immediate exit of process on detecting incorrect node.js version

## Changed

#### Bug fix in in memory session TTL running with cluster

TTL update was not including the duration of the session

#### Rewrote boilerplate script in node.js from bash

Added a user prompt to set HTTP server port and optional start of HTTP server when creating a project from boilerplate 

#### Minor parser optimaization for RPC packet parser

#### Cluster log output now has worker ID along with PID

#### Boilerplate added basic CSS and Javascript including exmaple template HTML files

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

#### RPC packet parser minor optimization

## Version 3.0.8

## Added

#### Session stored cipher data can now be either serialized (node.js native) Buffer or base64 encoded string

#### Default in memory session now supports cluster: session data is now shared among all the workers

#### gracenode.rpc.info() added

#### gracenode.udp.info() added

## Changed

#### Updated to cluster-mode version 1.0.0

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.7

## Added

None

## Changed

#### HTTP session for RPC and DUP added base64 string of cipherKey, cipherNonce, and macKey

#### Typo fix for UDP and RPC encryption/decription: Nonce

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.6

## Added

#### .cluster property added

## Changed

#### Session oneTimeSessionId() now supports cookies

#### Session bug fix for default in memory storage using oneTimeSessionId()

#### Update dependency aeterno version

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.5

## Added

None

## Changed

#### Updated Dependency versions

#### Removed node-uuid from dependency

#### Removed async from dependency

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.4

## Added

None

## Changed

#### Bug fix with RPC packet parsing

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

#e Version 3.0.3

## Added

None

## Changed

#### RPC and UDP encryption/decryption changed back to using AES-128-EBC

For more details read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/rpc#use-session-and-encryption">HERE</a>.

#### RPC removed timestamp from request and reply packet

#### Removed bitwise-xor package dependency

#### RPC server added timeout for shutdown

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.2

## Added

None

#### RPC and UDP encryption/decryption now uses AES-128-CBC indstead of AES-128-EBC for improved security

Reference: <a href="https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation">Block Cipher Mode of Operation</a>

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.1

## Added

None

## Changed

#### RPC server now calls the callback of .onClosed() when client disconnects/TCP error is detected/connection timeout

#### Minor logging improvements for RPC server

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 3.0.0

## Added

#### UDP server added

For details please read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/udp#udp-server">HERE</a>.

#### RPC server added

For details please read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/rpc#rpc-server">HERE</a>.

## Changed

#### Makefile correct to handle options properly

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 2.5.3

## Added

#### gracenode.session added

For details please read <a href="https://github.com/voltrue2/gracenode/tree/develop/src/session">HERE</a>.

#### gracenode.lib.uuid added

## Changed

#### gracenode.http hook error no longer uses error object's property code for status code

#### gracenode.http hooks' next function can now take HTTP status code as second argument

#### gracenode.lib.deepCopy() added

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

#### gracenode.lib.cloneObj()

## Removed

None

***

## Version 2.5.2

## Added

None

## Changed

#### Boilerplate view index now automatically registers all custom render functions

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

## Removed

None

***

## Version 2.5.1

## Added

None

## Changed

#### Render does not throw errors when detecting invalid logics when pre-rendering

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

## Removed

None

***

## Version 2.5.0

## Added

#### Boilerplate make command added make setup

`make setup` will create initial setup of your application using **gracenode** boilerplate

#### Unit tests added for boilerplating

#### gracenode.http add to replace gracenode.router

## Changed

#### Boilerplate Makefile now has help texts

When you start your new project after installing **gracenode**, you can fun `./node_modules/gracenode/bin/boilerplate` to create the basic structure of your project

to help jump start. This also creates a `make` for your project. Now when you execute `make`, it will output help texts of all avialble make commands.

#### Dependency version updated for cluster-mode

## Deprecated

#### gracenode.registerShutdownTask()

#### gracenode.router

Please use `gracenode.http` instead.

## Removed

None

***

## Version 2.4.1

## Added

None

## Changed

#### Router regular expression data type fix when there is no g or i in the regex

The router returned and error of invalid data type if the given regular expression had no 'g' or 'i'.

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.4.0

## Added

None

## Changed

#### Router added URL parameter data type as regular expression

Exmaple:

Defining a route with paramter data type as regular expression

```javascript
router.get('/my/api/{/^[a-zA-Z]*$/g:regexValue}');
```

The above example defines the URL parameter to be `regexValue` and it must be alphabest only.

#### Router responds as gzip only when requested with accept-enoding

`accept-encoding: gzip` must be sent with the request to have gzipped response.

#### Render added client-side auto-renderer

#### Added gracenode version in the logging (only when starting)

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.3.0

## Added

#### Added gracenode.require()

`gracenode.require()` requires a module from application root path.

Example:

```javascript
// application root: /var/www/myapp/
// module path: /var/www/my/myapp/mystuff/
// required location: /var/www/myapp/look/here/index.js
// without gracenode.require()
var mystuff = require('../../mystuff');
// with gracenode.require()
var mystuff = gracenode.require('mystuff');
```

## Changed

#### Router static can now route static files like using document root also

**Example**:

```javascript
var staticFileDirectoryList = [
        '/public/',
];
gracenode.router.static('/static', staticFileDirectoryList);
```

The above example will create routes as:

**NOTE**: `/public/` directory is treated as the document root directory and **IS NOT** present in routed URL.

```
GET /static/{file path}
GET /static/css/{file path}
GET /static/js/moredir/{file path}
// All subdirectories under /public will be routed
```

**Example**:

```javascript
var staticFileDirectoryList = [
        '/public/',
        '/asset/'
];
gracenode.router.static('/static', staticFileDirectoryList);
```

The above example will create routes as:

**NOTE**: `/public/` directory is **NOT** treated as the document root directory and **IS** present in routed URL.

When passing more than 1 static file directory paths, **gracenode** router will be routing static files as shown below:

```
GET /static/public/{file path}
GET /static/public/css/{file path}
GET /static/public/js/moredir/{file path}
GET /static/public/asset/{file path}
GET /static/public/asset/img/{file path}
GET /static/public/asset/video/{file path}
// All subdirectories under /public will be routed
```

#### Less info level logging in router

#### Improved a warn log for using .registerShutdownTask()

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.2.0

## Added

None

## Changed

#### Corrected unit test

#### Dependency cluster-mode version updated to 0.2.0

This version update fixes the issue with gracenode process exit code.

With the older version of cluster-mode module, even when you `gracenode.stop(error)`, the process exit with code 0 (no error).

This update fixes this issue.

#### Router for static file improved on .start()

The improvement makes it so that there is no additional file I/O on `gracenode.start()`.

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.1.5

## Added

#### make lint added

#### Boilerplate Makefile added make lint command

## Changed

#### Git pre commit script now uses javascript linting instead of shell

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.1.4

## Added

None

## Changed

#### Render will now remove and will not render loops (for and foreach) with empty array/object or invalid array/object

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.1.3

## Added

None

## Changed

#### Router static routing now automatically registeres sub directories

Example:

```javascript
gracenode.router.static('/static', [
	'asset/'
]);
```

The above code will register the following routes assuming that there are `asset/css`, `asset/js` are there:

```
/static/asset/{string:filename}
/static/asset/css/{string:filename}
/static/asset/js/{string:filename}
```

#### Render ignores for loop if invalid array is given

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.1.2

## Added

None

## Changed

#### Boilerplating now creates a makefile to aid managing your application process.

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.1.1

## Added

None

## Changed

#### The callback of gracenode.start() is now an option

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***


## Version 2.1.0

## Added

#### Added source code linting on gracenode.start()

gracenode will lint all javascript files in your application when starting.

**WARNING**:

This addition may cause your application to not start. Please read the error instruction carefully.

You may also **disable** `lint` by adding the following to your configurations:

```
{
	lint: {
		enable: false
	}
}
```

## Changed

#### Default logging configurations added for not giving any configs for logging

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.25

## Added

None

## Changed

#### Boilerplate improved

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.24

## Added

#### Boilerplate for setting up an application added

## Changed

#### Router request object has args object for errors as well

`req.args` used to be not avialable for errors, but now it is.

#### Router no longer timesout w/ invalid named param type request

The errored requets are responded with 400.

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.24

## Added

#### Boilerplate for setting up an application added

## Changed

#### Router request object has args object for errors as well

`req.args` used to be not avialable for errors, but now it is.

#### Router no longer timesout w/ invalid named param type request

The errored requets are responded with 400.

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.23

## Added

None

## Changed

#### Router hook update fixed for all routes

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.22

## Added

#### Render added literals

#### Render added custom functions for template variables

## Changed

#### Render bug fix: if confition rendering was inaccurate if no conditions were met

#### Router improved route search performance

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.21

## Added

None

## Changed

#### Added debugging logs in router

#### Default logging configuration improved

#### gracenode improved logging directory check on start 

## Deprecated

#### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.20

## Added

None

## Changed

#### Router fixed routing /

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.19

## Added

#### gracenode.router.static() added to serve static files

## Changed

### Router none-match routing check fixed (there was a possibility of exception)

### Render cache added extra check for race condition on get/discard

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.18

## Added

None

## Changed

### Router searchs fast routes for better performance.

The URL routes without parameters are searched with different method for faster search.

### Router parse URL performance has been improved (regex improvements)

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.17

## Added

None

## Changed

### Router bug fix for URL parameters when the value is 0

### Router request hooks are now assigned when you define the hooks and route instead of run-time

### Router URL parse is case insensitive by default and option sensitiive (boolean) added

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.16

## Added

None

## Changed

### Render if/for/foreach keep spaces when rendered

### Router request body parser improved

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.15

## Added

None

## Changed

### Dependency aeterno's version updated to 0.5.5

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.14

## Added

None

## Changed

### Router corrected JSON request body parsing

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.13

## Added

None

## Changed

### Router reuqest parser fixed for object type

### Dependency gracelog version updated 0.6.2

### Router parser caches the route list position for better performance

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.12

## Added

### Router response added .onClose(<callback>)

## Changed

### Router URL parser pre-compiles regex for better performance

### Logging bug fix for default logging

### Router GET and HEAD request handlers no longer ready request body by default

### Router response bug fix for non-gzipped encoding

### dependency gracelog version updated to 0.6.1

### Render parser for if has been improved

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.11

## Added

### Router added a listener for unexpected connection termination

## Changed

### Router error for missing code will be status code

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.10

## Added

None

## Changed

### Default configurations for log and cluster

Default Values

`log.bufferSize = 0`

`cluster.sync = false`

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.9

## Added

None

## Changed

### Router can now define typed parameters

### Router request handler is now validated for actually being functions

### Router hook's next callback can pass an error with a property code for http status

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.8

## Added

None

## Changed

### router response now loggs errors on res.error()

### gracenode.mod is now populated as it moves forward on starting of gracenode instead of populating all at the end

### start logging improved

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.7

## Added

### gracenode.render() added a new configuration `cacheSize` in bytes

## Changed

### gracenode.render() performance improved

### gracenode.render() now uses internal caching by default

## Version 2.0.6

## Added

### gracenode.onException() added

### Render added

gracenode added `.render()` to render HTML file etc.

## Changed

None

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.5

## Added

None

## Changed

### Bug fix: fixed the broken ./gracenode symbolic link

### gracenode router now does not start the server on master process in cluster mode

### gracenode now bootstrappes modules on master process in cluster mode

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.4

## Added

### req.cookies() added

## Changed

### README added for cookies

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.3

## Added

None

## Changed

### README corrected for router

### router logging improved

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.2

## Added

### gracenode.router added

## Changed

### Bug fix: gracenode.getConfig() fixed for returning non-existing config value

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.1

## Added

### gracenode.getConfig() added

## Changed

### Configuration parser has been improved

## Deprecated

### gracenode.registerShutdownTask()

## Removed

None

***

## Version 2.0.0

Version 2.0.0 has introduced a lot of changes including backward compatibility breaks.

- gracenode no longer handles meshnetwork out-of-the-box and removed all related functions.

- gracenode's new `.config()` function can either read from a file (.json) or an object. 

- gracenode no longer parses command-line arguments.

## Added

### gracenode.mod added

All bootstrapped modules will be under `gracenode.mod`.

### gracenode.config() added

This is a replacement for `gracenode.setConfigPath()` and `gracenode.setConfigFiles()`.

#### .config(configObj [object])

Set configurations as an object as an option.

This function can be called multiple times and it will merge all configuration objects being passed.

**NOTE**: The same configuration properties will be overwritten.

### .onExit(taskFunction [function])

Assigns a function to be executed on process exit of **gracenode**. The assigned function will have a callback function passed.

**Example**:

```javascript
gracenode.onExit(function (callback) {
	// do something before terminating the process
	callback();
});
```

#### Default Configurations

**gracenode** can be configured with the following properties by default:

```
{
	log: {
		rotationType: [string],
		useTimestamp: [boolean],
		bufferSize: [int],
		bufferFlushInterval: [int],
		oneFile: [boolean],
		file: [string],
		console: [boolean],
		remote: [object],
		color: [boolean],
		showHidden: [boolean],
		depth: [int],
		level: [string]
	},
	cluster: {
		max: [int],
		autoSpawn: [boolean],
		sync: [boolean]
	}
}
```

**NOTE**: To use configurations for bootstrapped module, simply use the same name as used in `.use()`.

##### log.rotationType

Defines log file rotation type.

The valid types are:

- `year`

- `month`

- `day`

- `hour`

Default is `day`,

##### log.useTimestamp

If `true`, the logging time will be in Unix timestamp.

Default is `false`.

##### log.bufferSize

Defines the buffer size for log data in bytes.

Default is 8128 bytes (8KB).

**NOTE**: File logging only.

##### log.bufferFlushInterval

Defines auto-buffer-flush interval in milliseconds.

Default is 5000ms (5 seconds).

**NOTE**: File logging only.

##### log.oneFile

If `true`, file logging will be combined in to one file for all log levels.

Default is `false`.

**NOTE**: File logging only.

##### log.file

Defines the path to the logging directory.

If this is not set, **gracenode** will NOT log to file, but stdout/stderr stream only.

Default is not set.

##### log.console

If `true`, all logging will be outputting to stdout/stderr stream.

Default is `true`.

##### log.remote

Defines the configurations to send logging data to a remote server via UDP protocol.

```
{
	host: [string],
	port: [int]
}
```

Default is not set.

##### log.color

If `true`, logging data will be colored.

Default is `false`.

##### log.showHidden

If `true`, logging objects will show hidden properties.

Default is `false`.

##### log.depth

Defines how far logging module should recursively output objects.

Default is not set.

##### log.level

Defines from which log level to output.

The valid log levels are:

- `verbose`

- `debug`

- `table`

- `trace`

- `info`

- `warn`

- `error`

- `fatal`

Use `>`, `>=` to control the definition of log level.

**Example**

```
'>= info'
```

The above example will be logging from log level info to lower (info, warn, error, fatal).

**NOTE**: From the top highest to lowest

##### cluster.max

Defines how many cluster worker processes.

If `0` is given, **gracenode** will not be running in cluster.

Default is `0`.

##### cluster.autoSpawn

If `true`, terminated worker processes will be automatically respawned and replaced.

Default is `false`.

##### cluster.sync

If `true`, all workers will share a list of existing workers and their `pid`.

This may lead to server stress.

Default is `true`.

### gracenode.stop() added

This is a replacement for `gracenode.exit()`.

### gracenode.onExit() added

This is a replacement for `gracenode.registerShutdownTask()`.

## Changed

### gracenode.use() changed

The behavior of `gracenode.use()` has changed.

#### .use(moduleName [string], pathOrMod [string or object], options [object])

Tells **gracenode** to bootstrap and set up a given module.

**Example**:

```javascript
gracenode.use('myMod', '/path/to/myMod');
```

or

```javascript
gracenode.use('myMod', require('/path/to/myMod'));
```

**gracenode** will be loading the module from `modulePath`.

#### options [object]

Assigns an optional functions to be executed for the bootstrapped module.

**Structure**:

```
{
	config: [function],
	setup: [function],
	exit: [function]
}
```

##### options.config [function]

A function to be executed when starting the **gracenode** process to read configuration data.

The assigned function be will passed a configuration data.

**Example**

```javascript
gracenode.use('myMod', '/path/to/my/mod/', {
	config: function (configData) {
		this.configData = configData;
	}
});
```

**NOTE**: `this` in the function is the bootstrapped module.

##### .options.setup [function]

A function to be executed when starting the **gracenode** process after `options.config()` if provided.

If `options.config()` is not provided, it will be called at the start of bootstrapping the module.

The function will be passed a callback function.

**Example**

```javascript
gracenode.use('myMod', {
	setup: function (callback) {
		// do something here
		callback();
	}
});
```

**NOTE**: `this` in the function is the bootstrapped module.

##### .options.exit [function]

A function to be executed on exitting of the **gracenode** process.

It is useful to clean up before the exit.

The function will be passed a callback function.

**Example**
```javascript
gracenode.use('myMod', '/path/to/my/mod/', {
	exit: function (callback) {
		// do something here
		callback();
	}
});
```

**NOTE**: `this` in the function is the bootstrapped module.

### 

## Deprecated

### gracenode.registerShutdownTask() has been deprecated

## Removed

### gracenode.exit() removed

### gracenode.setConfigPath() removed

### gracenode.setConfigFiles() removed

### gracenode.argv() removed

### gracenode.setHelpText() removed

### gracenode.defineOption() removed

### gracenode.exitOnBadOption() removed

### gracenode.addModulePath() removed

### gracenode.getProcessType() removed

### gracenode.load() removed 

### gracenode.unload() removed

### gracenode.require() removed

### gracenode.send() removed

### gracenode.meshNetJoin() removed

### gracenode.meshNetReceive() removed

### gracenode.meshNetEachNode() removed

### All events removed

gracenode is no longer an event emitter.

***

## Version 1.8.12

## Added

None

## Changed

#### Dependency aeterno and gracelog version updated

## Deprecated

None

## Removed

None

***

## Version 1.8.11

## Added

None

## Changed

#### Dependency aeterno module's version updated to 0.4.8

## Deprecated

None

## Removed

None

***

## Version 1.8.10

## Added

None

## Changed

#### Dependency gracelog module's version updated to 0.5.3

## Deprecated

None

## Removed

None

***

## Version 1.8.9

## Added

None

## Changed

#### Dependency gracelog module's version updated to 0.5.2 

## Deprecated

None

## Removed

None

***

## Version 1.8.8

## Added

None

## Changed

#### Dependency aeterno module's version updated to 0.4.7

<<<<<<< HEAD
There are many changes and added features for daemonizing your application:

https://github.com/voltrue2/gracenode#daemonizing-your-application-process

#### Dependency gracelog module's version updated to 0.5.1

There are many changes and added features for logging:

https://github.com/voltrue2/gracenode/tree/develop/modules/log

#### Dependency floodnet module's version updated to 0.1.0
=======
#### Dependency gracelog module's version updated to 0.5.1

#### Dependency flootnet module's version updated to 0.1.0
>>>>>>> 2.0

## Deprecated

None

## Removed

None

***

## Version 1.8.7

## Added

None

## Changed

#### Dependency aeterno module's versiuon updated

With the update, the listing of running daemon process' order is now correct and there are minor improvements included.

## Deprecated

None

## Removed

None

***

## Version 1.8.6

## Added

None

## Changed

#### Dependency aeterno module's versiuon updated

With this version update, daemon start command option `-a` or `-w` fixes the bug of watching file changes in the target directories.

## Deprecated

None

## Removed

None

***

## Version 1.8.5

## Added

None

## Changed

#### index.js of gracenode no longer needs to call aeterno.setApplicationPath()

## Deprecated

None

## Removed

None

***

## Version 1.8.4

## Added

None

## Changed

#### Dependency aeterno version updated

0.4.1

## Deprecated

None

## Removed

None

***

## Version 1.8.3

## Added

None

## Changed

#### Dependency aeterno version updated

Now gracenode usees `aeterno` version 0.4.0

## Deprecated

None

## Removed

None

***

## Version 1.8.2

## Added

None

## Changed

#### Dependency aeterno version updated

Now gracenode usees `aeterno` version 0.3.4

## Deprecated

None

## Removed

None

***

## Version 1.8.1

## Added

None

## Changed

#### Dependency aeterno version updated

Now gracenode usees `aeterno` version 0.3.1

## Deprecated

None

## Removed

#### No longer used internal daemon tool removed

***

## Version 1.8.0

## Added

#### New dependency aeterno added

## Changed

#### Daemon tool is now using aeterno

#### gracenode can now allow the application to daemonize programatically

## Deprecated

None

## Removed

#### Internal daemon tool

***

## Version 1.7.1

## Added

None

## Changed

#### Dependency floodnet version updated from 0.0.3 to 0.0.5

## Deprecated

None

## Removed

None

***

## Version 1.7.0

## Added

#### Mesh Network that uses redis added

By giving `"method": "redis"` in `meshnet` configuration, gracenode can now handle mesh network using redis instead of broadcast.

## Changed

#### Mesh Network code refactored

## Deprecated

None

## Removed

None

***

## Version 1.6.3

## Added

None

## Changed

#### Dependency node-dateitme version updated from 0.1.0 to 0.1.5

#### Lib module now has .createTimedState()

## Deprecated

None

## Removed

***

## Version 1.6.2

## Added node-datetime as a dependency

## Changed

#### Built-in lib module now has gracenode.lib.createDateTime()

#### Built-in lib module's existing functions (.getDates() and .createTimedData()) are now using node-datetime internally.

## Deprecated

None

## Removed

None

***

## Version 1.6.1

## Added

None

## Changed

#### Corrected error handling in .start() and .load()

#### Daemon reload will now exits with an error if it cannot reload

## Deprecated

None

## Removed

None

***

## Version 1.6.0

## Added

#### gracenode.load() added

Gracenode can now set up and load all modules without starting the application process.

Useful when you need to use `gracenode` as an add-on module to your exsisting project etc.

#### gracenode.unload() added

Gracefully unloads all loaded modules. This should be used when you are using `gracenode.load()`.

## Changed

#### deprecate.json format changed

#### debug check for deprecated function usage changed

#### gracenode version check's warning changed

## Deprecated

#### gracenode.setup() has been deprecated

Use `gracenode.start()` instead.

## Removed

None

***

## Version 1.5.5

## Added

#### gracenode.lib.padNumber() added

#### gracenode.lib.getDates() added

## Deprecated

None

## Removed

None

***

## Version 1.5.4

## Added

None

## Changed

#### Dependency version updated

gracelog version updated from 0.4.0 to 0.4.1

## Deprecated

None

## Removed

None

***

## Version 1.5.3

## Added

None

## Changed

#### .meshNetReceive() now internally uses .on() instead of .once()

## Deprecated

None

## Removed

None

***

## Version 1.5.2

## Added

#### .meshNetEachNode() added

#### Unit test added to daemon tool

## Changed

#### Daemon tool exists with error when failing to start, stop, restart, and reload

## Deprecated

None

## Removed

None

***

## Version 1.5.0

## Added

#### Built-in Mesh Network System Added

gracenode now has a built-in decentralized mesh network system. 

It supports broadcast to communicate between remote mesh nodes.

Require Congigurations:

```
{
	"enable": <boolean>
	"helloInterval": <number> // [optional] in milliseconds. default is 1000
	"checkInterval": <number> // [optional] in milliseconds. default is 2000
	"broadcast": <string> // [optional] default is "255.255.255.255"
	"port": <number> // [optional] default is 12345
	"encryptionKey": <string> // [optional] default is null. read more about it: https://nodejs.org/api/crypto.html#crypto_crypto_createcipher_algorithm_password
}
```

#### Mesh Network Methods Added

`gracenode.meshNetJoin(channel [string])`

Joins a mesh network channle.

`gracenode.meshNetSend(channel [string], data [object])`

Sends a message object to the other mesh network nodes on the same channel.

`gracenode.meshNetReceive(channel [string], callback [function])`

Listener for the mesh network channel.

## Changed

None

## Deprecated

None

## Removed

#### .getModuleSchema has now been removed

`.getModuleSchema` has been deprecated since version 1.3.3 and it is now removed.

***

## Version 1.4.1

## Added

None

## Changed

## Dependency gracelog's version has been updated from 0.3.0 to 0.4.0

This version fixes the issue with rotated file log data being in a wrong date and time.

## Deprecated

None

## Removed

None

***

## Version 1.4.0

## Added

None

## Changed

#### Dependency gracelog's version has been updated from 0.2.1 to 0.3.0

`modules.log` configurations can now use `useTimestamp` to log in Unix timestamp instead of server time.

**NOTE**: File rotation names are still in server time

## Version 1.3.21

## Added

None

## Changed

#### debug mode progress bar improved

## Deprecated

None

## Removed

None

***

## Version 1.3.20

## Added

None

## Changed

#### Minor code refactorying

## Deprecated

None

## Removed

None

***

## Version 1.3.19

## Added

None

## Changed

#### Added more detailed feedback log to daemon status output for start command

#### Debug progress bar output improved

## Deprecated

None

## Removed

None

***

## Version 1.3.18

## Added

#### .setHelpText() function added to gracenode core for command-line help interface

## Changed

#### Daemon reload command improved and added improved status feedback output

## Deprecated

None

## Removed

***

## Version 1.3.17

## Added

None

## Changed

#### Daemon tool added --verbose option as an alias of -v option

## Deprecated

None

## Removed

None

***

## Version 1.3.16

## Added

None

## Changed

#### Daemon restart added improved status output

#### Daemon stop command added time out and improved message output

#### Daemon tool added more verbose messages for -v option

## Version 1.3.15

## Added

None

## Changed

#### --help does not display [Object object] for application without "author" in its package.json

#### --help display can now handle "author" property as an object

#### Core module does not map files/directories that start with a dot

#### Improved core module loading logs

## Deprecated

None

## Removed

None

***

## Version 1.3.14

## Added

None

## Changed

#### gracenode.defineOption() now supports an array of options

`.defineOption()` can now allow you to define an option callback with multiple option names by giving an array instead of a string:

```javascript
gracenode.defineOption(['-t', '--test'], 'A test option.', testCallback);
```

## Deprecated

None

## Removed

None

***

## Version 1.3.13

## Added

#### Daemon Start added auto-reloading option

**Auto-Reloading** option

`gracenode` `daemon` tool offers `auto-reloading` as an option when you start your application as a daemon process.

What `auto-reloading` does is to watch the application files for any sign of change and when it detects a file change,
it automatically reloads the daemon process using the same method as `daemon reload`.

**How To Set Up Auto-Reloading**

You need to instruct `daemon` command which directory(ies) to watch for `auto-reloading`.

Example:

```
node daemon start -a controller/ modules/ configs/
```

The above example instructs the `daemon` command to watch `controller`, `modules`, and `configs` directories of the application
for `auto-reload`. If anything changes in these directories, the daemon process will automatically reload.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 1.3.12

## Added

#### lib module added .createTimedData()

For details please read here <a href="https://github.com/voltrue2/gracenode/blob/master/modules/lib/README.md#createtimeddataconfig-object">here</a>.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 1.3.11

## Added

#### Default minimum configuration mode added

Gracenode now tries to run the application with internal minimum default configurations.

## Changed

#### Improved the stability of daemon stop command execution

Daemon stop command now removes the socket file and exits the process.

Added an error catch to that flow and monitor process will NOT exit on failed socket file removal.

#### Minor improvements in daemon restart output

## Deprecated

None

## Removed

None

***

## Version 1.3.10

## Added

#### - lib module added .find()

Finds and returns matched elements and their indexes from an object/array by user defined function.

Example With Array:

```javascript
var list = [
        { name: 'Bob', age: 40 },
        { name: 'John', age: 37 },
        { name: 'Chris', age: 44 },
        { name: 'Dale', age: 51 }
];
var finder = function (elm) {
        return elm.age >= 40 && elm.age <= 50;
};
var matched = gracenode.lib.find(list, finder);
/*
matched: [
        { index: 0, element: { name: 'Bob', age: 40 } },
        { index: 2, element: { name: 'Chris', age: 44 } }
]
*/
```

Example With Object:

```javascript
var map = {
        a00: { name: 'Bob', age: 40 },
        a01: { name: 'John', age: 37 },
        a02: { name: 'Chris', age: 44 },
        a03: { name: 'Dale', age: 51 }
};
var finder = function (elm) {
        return elm.age >= 40 && elm.age <= 50;
};
var matched = gracenode.lib.find(map, finder);
/*
matched: [
        { index: 'a00', element: { name: 'Bob', age: 40 } },
        { index: 'a02', element: { name: 'Chris', age: 44 } }
]
*/
```

## Changed

#### - core module loader improved module name conflict detection on .setup()

Gracenode can detect module name conflicts even for modules that are not called by `gracenode.use()`.

When conflict is detected, gracenode stops running immediately.

Example:

```
exit gracenode with an error: module name conflict detected for [redis] in /home/nt/game/node_modules/redis and /home/nt/game/modules/redis
```

## Deprecated

None

## Removed

None

***

## Version 1.3.8

## Added

None

## Changed

#### - Daemon list refactored

#### - Daemon reload refactored

#### - Daemon restart refactored

#### - Daemon stop refactored

#### - Daemon start refactored

#### - Daemon status refactored

## Deprecated

None

## Removed

None

***

## Version 1.3.7

## Added

None

## Changed

#### - Help (--help) output reformatted

#### - Improved error out for alformed configurations

#### - Dependency gracelog's version updated

From `0.1.21` to `0.2.1`.

## Deprecated

None

## Removed

None

***

## Version 1.3.6

## Added

None

## Changed

#### - Bug fix for daemon list output when --log=/path/to/log/dir/ given

#### - Deamon reload status output improvements

#### - Improved the stability of daemon reload command to ensure there is always at least one worker process running

#### - gracenode.send() properly fails on message object parse failure

#### - Debug mode memory watch output now uses logger.table()

#### - Updated dependency gracelog version

Version updated from `0.1.20` to `0.1.21`.

## Deprecated

None

## Removed

None

***

## Version 1.3.5

## Added

None

## Changed

#### Improved daemon list command output

#### Minor improvements in Makefile

#### Updated a dependency version (gracelog)

Version updated from `0.1.18` to `0.1.20`.

#### Bug fix in ./daemon list command

The command could lis wrong pids for wrong processes.

#### Profiler module now uses log module's .table() to output the result

## Deprecated

None

## Removed

None

***

## Version 1.3.4

## Added

#### Added deprecated.json added to manage deprecated information

## Changed

#### Updated a dependency version

Updated gracelog version from `0.1.13` to `0.1.18`.

## Deprecated

None

## Removed

None

***

## Version 1.3.3

## Added

#### Debug mode now scans for deprecated gracenode functions

## Changed

#### Configuration name for debug mode changed

The configuration property name for `debug` mode has changed from `debugMode` to `gracenode-debug`.

#### Progress bar added to debug mode

## Deprecated

#### .getModuleSchema has been deprecated

Since `gracenode` no longer has built-in mysql modules, it makes sense to remove this function from it.

## Removed

None

***

## Version 1.3.2

## Added

#### Debug mode now runs memory usage monitor along with jshint on start of the application

## Changed

#### All gracenode code now lints with strict mode

#### Test timeout is now 5000ms instead of 2000ms

#### .registerShutdownTask() of gracenode now throws an exception for passing a 2nd argument other than a function

#### Logging level of debug mode changed

The log message when there is no lint error has been changed from `error` to `debug`.

## Deprecated

None

## Removed

None

***

## Version 1.3.1

## Added

#### Debug mode added

`gracenode` can optionally run your application in debug mode.

For more details please read <a href="https://github.com/voltrue2/gracenode#debug-mode">here</a>.

## Changed

#### daemon status added monitor version

## Deprecated

None

## Removed

None

***

## Version 1.3.0

## Added

#### daemon tool added reload

Reload option allows daemon tool to reload the daemonized application process with out stopping.

It is only available with applications that are build with `gracenode` framework or applications.

**NOTE:** The master process of the application will NOT be reloaded.

#### gracenode now listens to SIGHUP/kill -1 to reload wroker processes in cluster mode

## Changed

#### Bug in process message from master to workers

The sent message should have been a JSON.parsed object instead of a string.

## Deprecated

None

## Removed

None

***

## Version 1.2.4

## Added

None

## Changed

#### Minor change and commented out code removal

## Deprecated

None

## Removed

None

***

## Version 1.2.3

## Added

None

## Changed

#### .setConfigPath() now supports full path as an option

`.setConfigPath()` uses the given path string as a full path if the second argument is set `true`.

Example:

```
var grancenode = require('gracenode');
gracenode.setConfigPath('/full/path/to/my/config/directory/', true);
```

## Deprecated

None

## Removed

None

***

## Version 1.2.2

## Added

None

## Changed

#### Improved the way gracenode detects the application root path

`.getRootPath()` now returns correct root path of application even if `gracenode` is installed as an indirect dependency (dependency of dependency etc...)

#### lint error in script daemon fixed

#### Script preCommit.sh added for internal git pre-commit hook

#### Script lint.sh refactored

## Deprecated

None

## Removed

None

***

## Version 1.2.1

## Added

None

## Changed

#### log module's default log name does not have the full file path

#### Updated dependency gracelog version from 0.1.10 to 0.1.13

#### Minor bug fix in daemon log

## Deprecated

None

## Removed

None

***

## Version 1.2.0

## Added

#### Improved error logging for invalid configurations on set up

#### Outputs jshint errors when gracenode detects invalid configurations

## Changed

#### Improved error checking before calling .setup()

#### Logging level of sending/receiving messages from/to master and worker changed to verbose

#### Improved error handling for defineOption()

## Deprecated

None

## Removed

None

***

## Version 1.1.38

## Added

None

## Changed

#### Dependency gracelog version updated

#### Minor changes in client/js object-data.js

object-data.js is now data-object.js

## Deprecated

None

## Removed

None

***

## Version 1.1.37

## Added

None

## Changed

#### gracenode.defineOption() now supports get arguments As none-array

By setting `false` to the third argument as shown below, gracenode passes the arguments to defined variables in the callback function.

Example:

```
// node myapp -t one two three
gracenode.defineOption('-t', 'Expects 3 arguments.', false, function (arg1, arg2, arg3) {
	console.log(arg1, arg2, arg3);
	// one two three
});
```

## Deprecated

None

## Removed

None

***

## Version 1.1.36

## Added

None

## Changed

#### Daemon stop now waits for the daemon process to stop completely without timeout

#### Improved fatal logging for configuration failure

#### Improved exiting process of master in cluster mode when worker processes are illigally exiting

## Deprecated

None

## Removed

None

***

## Version 1.1.35

## Added

#### Added send() to send message from workers to master or from master to workers

#### New event worker.message added

In cluster mode, your application can now capture messages sent from workers to master by listening on `worker.message`.

#### New event master.message added

In cluster mode, your application can now capture messages sent from master to workers by listening on `master.message`.

## Changed

#### Minor code improvements

## Deprecated

None

## Removed

None

***

## Version 1.1.34

## Added

None

## Changed

#### Daemon status output has been cleaned up

#### Daemon feedback output optimized

#### Corrected daemon stop feedback

#### Improved daemon start/stop feedback

## Deprecated

None

## Removed

None

***

## Version 1.1.33

## Added

None

## Changed

#### Daemon status outputs error log for orphaned processes and pids

#### Improved feedback on daemon clean command error

## Deprecated

None

## Removed

None

*** 

## Version 1.1.32

## Added

None

## Changed

#### Daemon tool added auto cleaning of detached socket files

## Deprecated

None

## Removed

None

***

## Version 1.1.31

## Added

None

## Changed

#### Daemon process check improved

#### lib.walkDir performance improved

#### Test added for lib.walkDir

## Deprecated

None

## Removed

None

***

## Version 1.1.30

## Added

None

## Changed

#### Daemon restart no longer requires "wait 10 seconds"

#### Daemon start now checks the length of the application being avialable

`daemon start` command now checks and see if the application stays available for at least 60 seconds before it exits.
If the application exits in less than 60 seconds, the daemon tool will NOT respawn the application.

#### Daemon tool output text color changed

#### Log module version updated

## Deprecated

None

## Removed

None

***

## Version 1.1.29

## Added

None

## Changed

#### Dependency garcelog's version updated

#### Daemon restart improved feedback output

#### Daemon status imrproved output

## Deprecated

None

## Removed

None

***

## Version 1.1.28

## Added

None

#### Daemon start/stop now outputs accurate feedback of application process status

#### Daemon start without application path will now have index.js appended

#### Daemon stop improved the speed

## Deprecated

None

## Removed

None

***

## Version 1.1.27

## Added

#### Daemon tool added clean

There may be a situation where you end up with daemon socket files without process associated.

`node daemon clean` will find all detached socket files and clean them all.

## Changed

#### Log module now uses gracelog npm module

For more information on `gracelog` module please read <a href="https://github.com/voltrue2/gracelog#gracelog">here</a>.

Note: There are NO breaking changes.

#### Daemon tool no longer outputs fatal error for an error

#### Daemon tool now detects orphan process(es) without associated socket file

#### Daemon tool now detects orphan socket file without associdated application process(es)

## Deprecated

None

## Removed

None

***

## Version 1.1.26

## Added

None

## Changed

#### Bug fix daemon tool

Daemon tool was unable to stop the application process if the daemon was started without `--log=` option.

Affected version: `1.1.24` and `1.1.25`

## Deprecated

None

## Removed

None

***

## Version 1.1.25

## Added

#### Log module added isEnabled()

`gracenode.log.isEnabled(logLevelName)` checks the availability of specific log level such as `verbose`.

## Changed

#### Log module fix

On exiting gracenode process, log module can now let the process to proceed to exit even when it is failing to log to files.

#### Profiler .mark() now accepts null

`gracenode.profiler.mark()` now accepts `null` instead of message string.
If `null` is given, the profile time is marked the same as when a string is given, but the null message will be skipped.

#### Profiler skipps its operation completly if used log level is disabled

## Deprecated

None

## Removed

None

***

## Version 1.1.24

## Added

None

## Changed

#### Bug fix: daemon logger now properly rotates log files on restart

`restart` of daemon now triggers logger to rotate log files to proper date.

#### Bug fix: daemon logger now properly rotates log files on stop

`stop` of daemon now triggers logger to rotate log files to proper date.

## Deprecated

None

## Removed

None

*** 

## Version 1.1.23

## Added

None

## Changed

#### Log module now tolerates missing configurations

Log module can now fall back to default configurations if configurations are missing.

## Dprecated

None

## Removed

None

***

## Version 1.1.22

## Added

#### Gracenode version check on setup

Gracenode now checks application's expected version of gracenode and

compares it against currently installed gracenode's version.

If the installed gracenode's version is lower than the application's expected version of gracenode,

`gracenode.setup()` will fail with an error.

## Changed

#### Gracenode now allows an application to have more cluster processes in cluster-mode than the number of CPU available

NOTE: Please note that each child process is a new instance of V8 instance.

## Deprecated

None

## Removed

#### Deprecated script scripts/gracenode.js has now been removed

***

## Version 1.1.21

## Added

None

## Changed

#### Bug fix in defineOption()

The negative number as a value of an option was being ignored.

Example: `node app.js -option -100`

With the bug, above command's -100 was ignored.

#### Minor improvements

## Deprecated

None

## Removed

None

***

## Version 1.1.20

## Added

#### gracenode.exitOnBadOption() added

#### Daemon tool will now exit on bad options or no options

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 1.1.19

## Added

#### Added preinstall script to package.json

npm install now removes pre-existing `daemon` symbolic link and recreates the link.

## Changed

#### verbose output of application configuration reformatted

#### Minor improvements in core/

## Deprecated

None

## Removed

None

***

## Version 1.1.18

## Added

#### Uncaught exception before gracenode is ready will cause the process to exit with an error

## Changed

#### None cluster mode and master process now emit "setup.complete"

#### Daemon list changed the output format

## Deprecated

None

## Removed

None

***

## Version 1.1.17

## Added

None

## Changed

#### Daemon tool refactored

#### Daemon status fixed a race condition on message reply

#### Daemon list now displays SSH user that exected each daemon process

#### Daemon status added number of application restarts

## Deprecated

None

## Removed

None

***

## Version 1.1.16

## Added

None

## Changed

#### Daemon list performance improved

## Deprecated

None

## Removed

None

***

## Version 1.1.15

## Added

None

## Changed

#### Daemon tool improved on optional application path handling

#### Daemon tool no longer starts the application process with --daemon option

#### Daemon list improved

## Deprecated

None

## Removed

None

***

## Version 1.1.14

## Added

None

## Changed

#### Bug fix in initial install of gracenode

## Depreacated

None

## Removed

None

***

## Version 1.1.13

## Added

#### Daemon tool added status

A new option for daemon tool `status` added:

```
node daemon status /your/app/
```

Note: in order to use `status` option, you need to update your gracenode and `stop` and `start` your daemon process(s).

## Change

#### Symbolic link of daemon tool is no longer a directory

## Deprecated

None

## Removed

None

***

## Version 1.1.12

## Added

None

## Changed

#### Log module now has fall back with no configurations

Log module now falls back to `console.error()`  when there is no configurations ready.

#### Improved daemon error logging

## Version 1.1.11

## Added

None

## Changed

#### core module improved module name conflict checks

## Deprecated

#### scripts/gracenode.js

`gracenode.js` in `scripts/` directory has been deprecated as of version 1.1.11 as it was an experimental script.

## Removed

None

***

## Version 1.1.10

## Added

#### Client added object-data.js

## Changed

#### Daemon tool log file name format changed

#### Daemon tool error logging improved

#### Minor improvements in daemon tool log messages

## Deprecated

None

## Removed

None

***

## Version 1.1.9

## Added

None

## Changed

#### Bug fix: --help outputs nothing

## Deperacated

None

## Removed

None

***

## Version 1.1.8

## Added

None

## Changed

#### Daemon tool now has optional logging

Daemon tool can optionally keep log data in files.

To leave log files, execute:

```
node daemon start yourApp.js --log=/path/to/your/log/files/
```

#### Minor improvements in daemon tool

## Deperacated

None

## Removed

None

***

## Version 1.1.7

## Added

## Changed

#### Daemon tool now checks dying application

If the application dies 10 times in less than 10 seconds, daemon process will exit and stop.

#### Daemon tool restart blocks restart spam

Daemon restart now does not allow you to restart multiple times within 10 seconds.

## Deperacated

## Removed

***

## Version 1.1.6

## Added

#### Config module added .getAll()

`gracenode.config.getAll()` returns the whole configuration object.

## Changed

#### Daemon tool improved message logs

#### Daemon tool improved error checks

## Deprecated

None

## Removed

None

***

## Version 1.1.5

## Added

None

## Changed

#### Daemon tool can now daemonize any node.js application

Previously the daemon tool required your application to be build with gracenode to daemonize the process, but it is no longer a requirement.

#### Daemon tool improved

Daemon tool no longer requires gracenode application to communication via a socket file to manage start/stop.

#### Daemon tool list now groups each daemonized application process with its monitor

Output the list of daemonized application processes with correct grouping.

#### Daemon tool list added stop/restart instruction in its output

## Deprecated

None

## Removed

None

***

## Version 1.1.4

## Added

None

## Changed

#### daemon tool list with colors

#### Bug fix daemon tool list

Daemon tool `node daemon list` now displays correct pids.

## Deprecated

None

## Removed

None

***

## Version 1.1.3

## Added

None

## Changed

#### Daemon tool configuration updated

#### Daemon tool now blocks daemon process from duplicating by calling start with the same application path

#### Optimized config module

The initial loading of config files have been optimized.

## Deprecated

None

## Removed

None

***

## Version 1.1.2

## Added

None

## Changed

#### Fix in daemon list option

`ps aux | grep` command changed to `ps aux | grep "node "` to avoid false positive.

#### Bug fix in core process

If worker processes fail to se tup gracenode and die, master process was unable to exit the process and shutdown.

Fix.

## Deprecated

None

## Removed

None

***

## Version 1.1.1

## Added

#### daemon has added list option

To list the currently running daemon processes:

```
node daemon list
```

#### daemon has added restart option

To restart the currently running daemon processes:

```
node daemon restart
```

## Changed

None

## Deperacated

None

## Removed

None

***

## Version 1.1.0

## Added

#### gracenode now installs an executable script daemon in your application root after install

When you install gracenode via npm, gracenode will create a node.js script called `daemon` in your application root.

You can execute this script to start your application as daemon or stop your daemon application.

To start your application as a daemon:

`node daemon start`

To stop your daemon application:

`node daemon stop`

## Changed

#### Core index loggin cleaned up

## Deprecated

None

## Removed

None

***

## Version 1.0.25

## Added

#### Added daemon tool

To start your application as a daemon:

`scripts/daemon start path/to/your/app`

To stop your daemon application:

`scripts/daemon stop path/to/your/app`

Note: This is the first version of daemon tool. We are planning on improving this feature.

## Changed

#### Removed unnecessary optimization from cloneObj()

#### Improved the error catch for missing configuration files

## Deperacated

None

## Removed

None

***

## Version 1.0.24

## Added

None

## Changed

#### Optimized core/index.js and core/argv for v8's optimized compiler

#### Improved graceful shutdown in core process in preparation for daemon tool

Master process of the application now instructs all child processes to disconnect and shutdown.

#### Optimized log module for v8 optimized compiler

#### Optimized lib module cloneObj for v8 optimaized compiler

## Deperacated

None

## Removed

#### make command no longer installs scripts/gracenode.js to ~/bin/gracenode

***

## Version 1.0.23

## Added

None

## Changed

#### Makefile update for initial make command

#### Cluster mode now has autoSpawn option in configurations

Auto-respawning of dead child processes is now optional.

To enable auto-respawning add the following to your configurations:

```
{
	"cluster": {
		"enabled": true,
		"max": 2,
		"autoSpawn": true
	}
}
```

## Deprecated

None

## Removed

None

***

## Version 1.0.22

## Added

None

## Changed

#### Core process gracefuly shutdown improved

When workers die unexceptedly, the former graceful shutdown method had a hole where respawned works could become zombie workers.

Now the issue has been fixed properly.

## Deprecated

None

## Removed

None

***

## Version 1.0.21

## Added

None

## Changed

#### Lib module's cloneObj() now supports selective property copy

Lib module's `cloneObj()` now accepts a second argument optionally as an array of property names to clone only the given properties.

#### Core process fix for none-cluster mode graceful exit

## Deprecated

None

## Removed

None

***

## Version 1.0.20

## Added

None

## Changed

#### Core process graceful shutdown improved

Core process improved the way it handles graceful shutdown in preparation for built-in daemonization feature.

## Deprecated

None

## Removed

None

***

## Version 1.0.19

## Added

None

## Changed

#### Core process improved

The way master process handles graceful shutdown of each child processes haves improved.

#### Minor improvements

#### Executable gracenode install updated

Executing `node scripts/gracenode.js --install` will now install executable command `gracenode` in `~/bin/`

## Deprecated

None

## Removed

None

***

## Version 1.0.18

## Added

#### Custom jshint configurations added to package.json

## Changed

## Executable gracenode -l now ignores none-javascript files

## Command-line argument parser improved

The parser for command-line argments now support multiple values per options:

Example:

```
node yourApp -p /xxx/yyy/zzz/ /aaa/bbb/ccc/

// your option definition
gracenode.defineOption('-p', 'Awesome option -p.', function (paths) {
	// paths is an array that contains ['/xxx/yyy/zzz', '/aaa/bbb/ccc/']
});
```

## Deprecated

None

## Removed

None

***

## Version 1.0.17

## Added

#### Executable gracenode command added

Gracenode now has an executable command `scripts/gracenode`

To lint javascript file(s):

`scripts/gracenode -l path/to/files/or/directory`

To show gracenode version:

`scripts/gracenode -V`

## Changed

#### gracenode.defineOption's option parsing improved

#### make command now installs executable command gracenode to user's home directory

## Deprecated

None

## Removed

None

***

## Version 1.0.16

## Added

None

## Changed

#### gracenode.defineOption added third argument

`defineOption()` now allows you to define the callback function for the option.

```
gracenode.defineOption('-a', 'A is the first letter of the alphabet.', function (value) {
	// this callback will be executed if option -a is given
});

gracenode.defineOption('--test', 'This is a test option', function (value) {
	// do something
});
```

#### Client js request bug fix

## Deprecated

None

## Removed

None

***

## Version 1.0.15

## Added

None

## Changed

#### Bug fix in --help option

## Deprecated

None

## Removed

None

***

## Version 1.0.14

## Added

#### gracenode.defineOption() added

gracenode.defineOption allows you to define a command line option and add a shor t description for `--help`

#### gracenode has now --help option

`node myGracenodeApp/ --help` will display defined options and descriptions set by `.defineOption()`.

## Changed

#### gracenode.argv() now supports combined options

granode.argv() can now understand options combined such as `-abc`.

```
node myGracenodeApp/ -abc
// -abc is equivalent to givning -a -b -c
```

## Deprecated

None

## Removed

None

***

## Version 1.0.13

## Added

None

## Changed

#### Minor improvements in gracenode.setup()

#### Performance improvements in core module loading

#### Performance improvements in core .getModuleSchema()

## Deprecated

None

## Removed

None

***

## Version 1.0.12

## Added

#### Log module added a new log method .trace()

`.trace()` outputs a stack trace for debugging.

New Log Levels:

`verbose -> debug -> trace -> info -> warn -> error -> fatal`

## Changed

#### Improved gracenode setup error catch

## Deprecated

None

## Removed

None

***

## Version 1.0.11

## Added

None

## Changed

#### Core now outputs stack trace on uncaught exception log

## Deprecated

None

## Removed

None

***

## Version 1.0.10

## Added

None

## Changed

#### Log module now has .warn() as an alias of .warning()

#### .argv() now returns the argument value with proper data type (integer, string, array...)

#### Config module's lint error output formatted for better readability

#### Core process cleaned up some code

## Deprecated

None

## Removed

None

***

## Version 1.0.9

## Added

#### gracenode added .argv()

Parses arguments (process.argv) and return the value.

#### Lib module added .typeCast()

Converts a string to  appropriate data type.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 1.0.8

## Added

None

## Changed

#### Log module's configurations now accepts "level" as an array or a string

Now you can set level configurations of log module as:

```
"modules": {
	"log": {
		"console": true,
		"color": true,
		"level": [
			"verbose",
			"debug",
			"info",
			"warning",
			"error",
			"fatal"
		]
	}
}
```

Above is equivalent to 

```
"modules": {
	"log": {
		"console": true,
		"color": true,
		"level": {
			"verbose": true,
			"debug": true,
			"info": true,
			"warning": true,
			"error": true,
			"fatal": true
		}
	}
}
```

Above is equivalent to 

```
"modules": {
	"log": {
		"console": true,
		"color": true,
		"level": ">= verbose"
	}
}
```

#### Version of dependencies update

## Deprecated

None

## Removed

None

***

## Version 1.0.7

## Added

None

## Changed

#### Log module has rearranged the log prefix order

#### Core process has improved the graceful exit of child processes in cluster mode

## Depriceted

None

## Removed

None

***

## Version 1.0.6

## Added

None

## Changed

#### Log module added `.setPrefix`

You can now set prefix to every logging output in your application by invoking `.setPrefix`.

```
// set prefix when log is ready
gracenode.on('setup.log', function () {
	gracenode.log.setPrefix('PREFIX');
});
```

#### Core process now respawns a new worker on an error termination

## Deprecated

## Removed

None

***

## Version 1.0.5

## Added

None

## Changed

#### Core module has improved module name conflit checks

#### Core process has improved cluster mode graceful exit of worker processes

## Deprecated

## Removed

None

***

## Version 1.0.4

## Added

None

## Changed

#### Log module log data buffer

Log module no longer uses buffer for console logging (Node.js sdtout stream) as it is considered a development tool.

#### Core module improved module name conflicts detection and warning

## Deprecated

#### Log module's optional configuration "remote"

Log module has deprecated an optional configuration "remote" to send log data via UDP.

## Removed

None

***

## Version 1.0.3

## Added

None

## Changed

#### Improved profiler module set up in core index

#### Removed redundant configuration call for log module in core index

#### Improved error catching of module driver .expose()

#### Log module's bufferSize can now be 0

## Deprecated

None

## Removed

None

***

## Version 1.0.2

## Added

None

## Changed

#### Core module has removed the remaining override logic

#### Core module improved module name conflict checks

#### Core module loading simplified and performace improved

#### Core driver expose has been fixed

## Deprecated

None

## Removed

None

***

## Version 1.0.1

## Added

None

## Changed

#### Unit test updated

To execute the unit test, execute the following:

`make test`

The test requires that you have all gracenode modules installed in the same directory as your gracenode.

## Deprecated

None

## Removed

#### gracenode.override() removed

The deprecated (version 0.3.0) gracenode method .override() has now been removed from this version.

***

## Version 1.0.0

# Backward compatibility break

Gracenode framework has removed all internal additional modules.

In order to use the former built-in modules, you will need to add them to your package.json as dependencies:

```
"dependencies": {
	"gracenode": "1.0.0",
	"gracende-server": "0.1.8",
	"gracenode-view": "0.1.2"
}
```

Here is the list of additional modules for gracenode:

These modules can be installed from NPM.

###[gracenode-cron](https://github.com/briandeheus/gracenode-cron)
Module to run, start, stop, and setup cron tasks
###[gracenode-staticdata](https://github.com/voltrue2/gracenode-staticdata)
Allows for easy loading of static data such as JSON and CSV files.
###[gracenode-request](https://github.com/voltrue2/gracenode-request)
Handles requests to the server.
###[gracenode-server](https://github.com/voltrue2/gracenode-server)
Handles requests to the server.
###[gracenode-udp](https://github.com/voltrue2/gracenode-udp)
A module that makes it easier to handle UDP traffic from and to your server.
###[gracenode-view](https://github.com/voltrue2/gracenode-view)
Manages, loads and creates views you can server to clients.
###[gracenode-session](https://github.com/voltrue2/gracenode-session)
Handles sessions and automatically expires them if they are not accessed within a preset amount of time.
###[gracenode-encrypt](https://github.com/voltrue2/gracenode-encrypt)
Contains functions that make it easier to deal with crypography and password hashing.
###[gracenode-mysql](https://github.com/voltrue2/gracenode-mysql)
A wrapper to handle MySQL connections without the hassle of maintaining your connection pool.
###[gracenode-mongodb](https://github.com/voltrue2/gracenode-mongodb)
A wrapper to handle Mongodb functions and connections.
###[gracenode-memcache](https://github.com/voltrue2/gracenode-memcache)
Memcache management.
###[gracenode-iap](https://github.com/voltrue2/gracenode-iap)
Apple and GooglePlay in-app-purchase validation.
###[gracenode-wallet](https://github.com/voltrue2/gracenode-wallet)
Coin management.

### Log module, Profile module, and Lib module are still part of gracenode framework.

## Changed

#### Log module performance improved

Log module's auto flushing on gracenode exit is now centralized for better performance.

***

## Version 0.3.14

### Added

#### Log module added a new method

Log module now has a method called "forceFlush". 

this method will force the log data buffer to flush the log buffer and write immediately.

### Changed

None

### Deprecated

None

### Removed

#### Built-in server module's unit test removed.

We removed the test for built-in server module. gracenode-server module package now has the test instead.

#### Built-in view module's unit test removed.

We removed the test for built-in view module. gracenode-view module package now has the test instead.

#### Built-in mongodb module's unit test removed.

We removed the test for built-in mongodb module. gracenode-mongodb module package now has the test instead.

#### Built-in staticdata module's unit test removed.

We removed the test for built-in staticdata module. gracenode-staticdata module package now has the test instead.

#### Built-in iap module's unit test removed.

We removed the test for built-in iap module. gracenode-iap module package now has the test instead.

#### Bug fix in core/index.js

The bug in SIGINT, SIGQUIT, and SIGTERM exit fails has been fixed.

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.13, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.13

### Added

None

### Changed

#### Log module buffer flush interval fixed

Log module's optional configuration "bufferFlushInterval" is no longer undefined.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.13, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.11

### Added

None

### Changed

#### Critical buf fix in log module's file and remote

The bug in log module's file write and remote send has been fixed.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.11, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.10

### Added

None

### Changed

#### log module's event now passes an array of buffered log data

Log module's event "output" now passes an array of buffered log data which contains messages and timestamps.

#### config module error handling improved

Config module now handles error on invalid configurations and configurations not found better.

#### core module loader check improved

Core's module loader checks for module configurations not found error now handles the error before the module.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.10, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.9

### Added

None

### Changed

#### log module's  timed-auto-buffer-flush improved

Minor improvements in timed-auto-buffer-flush. Now the autoFlush waits for the previous operation to finish.

### Deprecated

#### additional built-in modules

Additional modules to be separated from gracenode core are now deprecated.

Modules to be separated:

- server
- view
- mysql
- mongodb
- mysql
- memcache
- encrypt
- staticdata
- session
- request
- cron
- iap
- udp
- wallet

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.9, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.8

### Added

None

### Changed

#### bug fix on log module auto flushing

"The log module's timer based auto-flush stops flushing automatically" has been fixed.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.8, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.7

### Added

None

### Changed

#### improved log module buffering

Log module's auto buffer flushing is improved.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.7, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.6

### Added

None

### Changed

#### log module buffering

Log module now buffers log data and flushes to file/remote/event when buffer is full.

It also flushes the log data at every x seconds.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.6, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.5

### Added

None

### Changed

#### core driver improved checks

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.5, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.4

### Added

None

### Changed

#### staticdata module CSV parser bug fix

Escaped values are now correctly parsed

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.4, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.4

### Added

None

### Changed

#### staticdata module CSV parser bug fix

Escaped values are now correctly parsed

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.4, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.3

### Added

None

### Changed

#### staticdata module CSV parser bug fix

Staticdata module's CSV parser fixed for parsing data with repeated commans in a single line.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.3, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.2

### Added

#### unit test added path finder

### Changed

None

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.2, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.1

### Added

None

### Changed

#### Deleted driver search log from module management to driver managent

#### gracenode-server module (v0.1.1) added support for HEAD request method

Built-in server module has also added the change.

#### gracenode-request module (v0.1.1) added support for HEAD request method

Built-in request module also added the change.

#### unit test

An issue with gracenode path has been solved.

### Deprecated

None

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.1, we still have the current module system and the new driver system.

Planned removal of the built-in modules is version 1.0.0

***

## Version 0.3.0

### Added

#### module driver system

To allow 3rd party node modules to behave as gracenode modules.

#### Changed

None

### Deprecated

#### built-in module system

Current built-in modules will be removed from gracenode and will be available on NPM repo as gracenode modules.

#### gracenode.override

Because gracenode.use() function now allows you to change the name of modules, gracenode.override has lost its purpose.

### Removed

None

# Future backward compatibility break

We will be removing the current built-in module system.

The current built-in modules will be all externalized and required to be included in your application's package.json.

As of version 0.3.0, we still have the current module system and the new driver system.

***

## Version 0.2.43

### Added

None

### Changed

#### iap module for google performance improvement

Iap module for google now reads public key file on setup of gracenode for better performance.

#### server module added multipart support

Server module can now handle request body with multipart header properly

### Deprecated

None

### Removed

None

## Version 0.2.42

### Added

None

### Changed

#### server module refactored

Server module has been refactored for better performance.

#### lib module randomFloat bug fix

If you pass float numbers smaller than 1, the function had a chance of returning greater than max given.

### Deprecated

None

### Removed

None

***

## Version 0.2.41

### Added

#### new unit test added to server module

Test for pre-defined 404 error handling has been added.

### Changed

None

### Deprecated

None

### Removed

None

***

## Version 0.2.40-b

Changes for version 0.2.40-b

### Added

None

### Changed

#### server module pre-defined error handling bug fix

Server module's pre-defined error handling on 404 had an issue of not correctly executing the assigned error controller.

Now this issue has been fixed.

### Deprecated

None

***

### Removed

None

***

## Version 0.2.40-a

Changes for version 0.2.40-a

### Added

None

### Changed

#### server module's router for "not found"

Server module's router now correctly uses the property in parsed URL object for not found 404 error.

### Deprecated

None

***

### Removed

None

***

## Version 0.2.40

Changes for version 0.2.40

### Added

None

### Changed

#### lib mdodule random function improved

Lib module's randomInt and randomFloat improved their random logic for better performance and better randomness.

#### server module routing and contorller management

Performance of router and controller management improved.

### Deprecated

None

### Removed

#### Deprecated function gracenode.allowOverride is now removed

gracenode.allowOverride function has been deprecated since version 0.2.30 in favor of gracenode.override and now it has been removed.

## Version 0.2.39

Changes for version 0.2.39

### Added

None

### Changed

#### server module: new response method added. response.download

A new method download added for file downloads.

Example: 

```
var csvData = 'colum A,column B\nAAA,BBB\nCCC,DDD';
response.download(csvData, 'example.csv');
```

#### server module corrected mime type of json response

#### gracenode core module loader improved

### Deprecated

None

### Removed

None

## Version 0.2.38

Changes for version 0.2.38

### Added

None

### Changed

#### server module: auto look-up of index.js method

Server module will now look for index.js if there is no method name in the request URLs.

#### view module no longer remove tabs and line breaks from HTML files

View module no longer removes tabs and line breaks from HTML files.

#### unit test added for view module

View module now has unit test.

`make test-module module=view` or `make test`

#### view module now handles a new file extension .tpl

For more details please read viuew module README.

### Deprecated

None

### Removed

None

***

## Version 0.2.37

Chages for version 0.2.37

### Added

#### encrypt module added a unit test

To execute encrypt module unit test execute:

`make test-module module=encrypt`

### Changed

#### log module configurations for "level"

By setting null, false to "level" or omitting "level" completely, you can now stop log module from logging at all.

#### staticdata module no longer throws an uncaught exception on none-indexed data

Staticdata modules no longer breaks with an exception when attempting to access values by index on none-indexed data.

#### view module variable parser improved

View module improved its variable replacement parser's error handling.

#### server module pre-defained error controller inherits original request response status

Pre-defined error handling controllers can now inherit original response status automatically.

### Deprecated

None

### Removed

None

***

## Version 0.2.36

Changes for version 0.2.36

### Added

None

### Changed

#### mysql module now allows blank password

Mysql module allows empty password for DB connections.

#### gracenode core: shutdown task handler better catches exceptions

Gracenode core's shutdown task handler improved exception handling to prevent process from hanging on exceptions.

### Deprecated

None

### Removed

None

***

## Version 0.2.35

Changes for version 0.2.35

### Added

None

### Changed

#### Iap module added a new method isValidated

This method evaluates the response of the purchase validation and returns true if the purchase is valid.

#### Iap module's unit test for apple purchase syntax changed

From:

`make test-iap path=/path/to/apple/receipt/sample/file service=apple`

To:

`make test-iap-apple path=/path/to/apple/receipt/sample/file`

#### Iap module added a unit test for google purchase

`make test-iap-google key=/path/to/public/key/directory path=/path/to/receipt/sample/file`

### Deprecated

None

### Removed

None

***

## Version 0.2.34

Changes for version 0.2.34

### Added

#### Unit test for iap module's apple purchase validation

Unit test for iap module added. Currently apple purchase test is available. 

`make test-iap path=/path/to/apple/receipt/sample/file service=apple`

#### make command added npm install.

Executing `make` now also installs dependencies.

### Changed

#### Mongodb module's dependency version updated from 1.3.14 to 1.4.3

#### Request module added new methods

GET, POST, PUT, and DELETE methods are added. For more detail please refer to request module README

## Deprecated

#### Request module deprecated send method

We have now deprecated send method in favor of new methods GET, POST, PUT, and DELETE.

This method will be removed in the future version.

## Removed

None

***

## Version 0.2.33

Changes for version 0.2.33

### Added

#### Unit test for mongodb module.

Mongodb module now has unit test for its APIs

For this unit test to properly work, you need to have mongoDB running at mongo://127.0.0.1:2701.

Example:

```
make test-module=mongodb
```

### Changed

#### Mongodb module findEeach function bug fix.

findEach function no longer returns an empty array at the last iteration.

### Deprecated

None

### Removed

None

***

## Version 0.2.32

Changes for version 0.2.32

### Added

None

### Changed

#### Server module removed "respondOnException" behavior.

Respond on exception has been removed due to its unstable nature and impact on performance.

### Deprecated

None

### Removed

#### Server module removed deprecated request object methods

Deprecated request object methods getData, postData, putData, and deleteData have been removed.

***

## Version 0.2.31

Changes for version 0.2.31

### Added

None

### Changed

#### Server module performance improved.

Server module now handles each request with unnecessary events.

### Deprecated

None

### Removed

None

***

## Version 0.2.30

Changes for version 0.2.30

### Added

None

---

### Changed

#### Server module error handler.

Internal error handler of server module now has consistent error data type (Error object).

The response of internal errors to the client will always be a compressed string.

#### Server module unit test added test for HTTPS server.

Server module unit test now tests starting of HTTPS server.

#### gracenode.override() added.

Gracenode now has a new method called "override". This method allows the application to override the built-in module of the same name.

Example:

```
var gn = require('gracenode');

gn.addModulePath('myModules/');

// this tells gracenode to use myModules/view instead of the built-in view module of gracenode
gn.override('view');

gn.setup(function () {
	// gracenode is ready
});
```

#### Staticdata module unit test added.

Tests staticdata module.

```
make test-module module=staticdata
```

### Deprecated

#### gracenode.allowOverride() is now deprecated and will be removed in the future version.

---

### Removed

None

***

## Version 0.2.29

Changes for version 0.2.29

### Added

Unit test "gracenode set up" added.

Unit test "gracenode module server" added.

#### How to execute unit test "gracenode set up"

This will test gracenode set up.

```
make test
```

#### How to execute unit test "gracenode server module"

This will test gracenode built-in module.

```
make test-module module=server
```

---

### Changed


#### Server module logging

Server module outputs error log on response errors.

---

### Deprecated

None

---

### Removed

None

***
