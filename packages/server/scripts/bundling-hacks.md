## Succesfully Bundling

- excluding problematic modules to ensure succesfull bundle step


### Winston Issue

Replace the below inside `packages/server/lib/logger.js`

```
const logger = { info: () => {} }

/*
const logger = new (winston.Logger)({
  transports,

  exitOnError (err) {
    // cannot use a reference here since
    // defaultErrorHandler does not exist yet
    return logger.defaultErrorHandler(err)
  },

})
*/
```

### Config Issue

```
cp -R packages/server/config dist/darwin/config
```

### Deps Issues

Excluded `electron`, `socket.io` and installed the following inside `./dist/darwin`.

```
npm i -D socket.io
```
