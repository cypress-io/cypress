# Development

To get started with this repo, compile the plugin's code and the examples code

```shell
npm run transpile
npm run build
npm run cy:open
```

- run TypeScript compiler in watch mode with `npx tsc -w`
- run Cypress with `npx cypress open` and select the spec you want to work with
- edit `lib/index.ts` where all the magic happens

This library is published by CI automatically following semantic versioning
