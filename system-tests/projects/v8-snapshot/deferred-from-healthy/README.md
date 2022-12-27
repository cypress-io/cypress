## v8-snapshot/deferred-from-healthy

The goal of this project is to have a healthy dependency (healthy.js) that requires a deferred dependency (lib/deferred.js). First snapshot `entry.js`. You can then load up the
app by running:

```
electron -r ./hook-require.js ./app.js
``` 
