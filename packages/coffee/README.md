## linting

To lint CoffeeScript files, use `coffeelint` tool in this project.
For example, from `packages/launcher/package.json` the command to lint

```json
{
  "scripts": {
    "pretest": "npm run lint",
    "lint": "../coffee/node_modules/.bin/coffeelint test/*.coffee"
  }
}
```

The linting settings are in `packages/coffeelint.json` file.
