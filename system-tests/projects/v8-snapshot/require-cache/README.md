## v8-snapshot/require-cache

The goal of this project is to test scenarios involving the require cache.

### Cached module modifying require cache

Cached app is snapshotted and will modify the require cache. The cached app can be tested by snapshotting `cached-app.js` and running:

```
electron -r ./hook-require.js ./cached-app.js
``` 

### Uncached module modifying require cache

Uncached entry is snapshotted (but uncached app is not) and will modify the require cache. The uncached app can be tested by snapshotting `uncached-entry.js` and running:

```
electron -r ./hook-require.js ./uncached-app.js
``` 
