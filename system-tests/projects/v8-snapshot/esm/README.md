## v8-snapshot/esm

The goal of this project is to load an esm module that in turn loads a lodash function. First snapshot `entry.mjs`. You can then load up the
app by running:

```
electron -r ./hook-require.js ./app.js
``` 
