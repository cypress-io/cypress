## v8-snapshot/stealthy-require

The goal of this project is to test various scenarios involving the require cache. `stealthy-require` is used to
clear the require cache and potentially bypass the cache entirely for a given module. We can then execute
tests that will test various scenarios (`spec/non-native.js`). Specifically we compare a lot of different combinations
of using the cache and not using the cache to ensure that the modules that are loaded correctly with and without the cache.
First snapshot `entry-all-cached.js`. Then, to execute the tests:

```
electron -r ./hook-require.js ./spec/non-native.js
``` 
