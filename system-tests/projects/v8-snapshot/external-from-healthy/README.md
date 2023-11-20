## v8-snapshot/external-from-healthy

The goal of this project is to load an external module (a fake bluebird) from a healthy module. First snapshot `entry.js`. You can then load up the
app by running:

```
electron -r ./hook-require.js ./app.js
``` 
