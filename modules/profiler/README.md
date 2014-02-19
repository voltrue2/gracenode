####gracenode.profiler

###Configuration
*N/A*

###API: *create*
<pre>
Profiler create(String name)
</pre>
> Returns an instance of Profiler class

### Profiler class
**start**
<pre>
void start()
</pre>
Starts profiling

**mark**
<pre>
void mark(String benchmarkPointName)
</pre>
Calculate elapsed time between marks and output on profiler.stop()

**stop**
<pre>
void stop()
</pre>
Stops profiler and output the profiling results