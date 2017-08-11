## Deployment

You can only deploy Cypress application and publish NPM module `cypress` if
you are a member of `cypress` NPM organization.

### Building the binary

First, you need to build, zip and upload application binary to Cypress server.
You can either specify each command separately

```
npm run binary-build
npm run binary-zip
npm run binary-upload
```

or use a single command

```
npm run binary-deploy
```

You can pass options to each command to avoid answering questions, for example

```
npm run binary-deploy -- --platform darwin --version 0.20.0
npm run binary-upload -- --platform darwin --version 0.20.0 --zip cypress.zip
```

If something goes wrong, see debug messages using `DEBUG=cypress:binary ...` environment
variable.

Because we had many problems reliably zipping built binary, for now we need
to build both Mac and Linux binary from Mac (Linux binary is built using
a Docker container), then zip it **from Mac**, then upload it.
