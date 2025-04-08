# Writing Cross-Platform JavaScript

Cypress works on Linux, macOS and Windows. This includes both installing from npm, as well as for local development. Code should be written in a platform agnostic style.

## Handling File Paths

Throughout the code base, we access the file system in various ways, and need to be conscious of how we do so to ensure Cypress can be used and developed seamlessly on multiple platforms. One thing to keep in mind is file paths and file separators. macOS and Linux systems use `/`, and Windows uses `\`.


As a general rule, we want to use **native paths** where possible. There are a few reasons for this. Wherever we display a file path, we want to use the native file separator, since that is what the user will expect on their platform. In general, we can use the Node.js `path` module to handle this:

```js
// on linux-like systems
path.join('cypress', 'e2e') //=> `cypress/e2e`

// on Windows
path.join('cypress', 'e2e') //=> `cypress\e2e`
```

There are some exceptions to this, namely the [`globby`](https://www.npmjs.com/package/globby) module, which only supports `/` (see [here](https://github.com/sindresorhus/globby#api)) when writing glob patterns. In these cases, where an API is posix only, you can use `path.posix.join`, which will always use `/`, even on a Windows system:

```js
// don't do 
const files = await globby('my-project\cypress\e2e\**\*')

// do
const files = await globby('my-project/cypress/e2e/**/*')

// or you can convert it by splitting by path.sep
// and joining with `path.posix.join`
const glob = path.posix.join('my-project/cypress/e2e/**/*'.split(path.sep))
```

The general rule of using `path` where possible applies to moving around the file system, too:

```js
path.resolve('../', '/../', '../')
// '/home' on Linux
// '/Users' on OSX
// 'C:\\Users' on Windows
```

In general, you want to avoid writing file system code using `/` and `\`, and use Node.js APIs where possible - those are cross platform and guaranteed to work.

## Use Node.js Scripts 

For many developers, it's tempting to write a quick bash script to automate tasks. Maybe you'd like to delete all `.js` files, so you add a script to `package.json`:

```json
{ 
  "scripts": {
    "clean": "rm -rf **/*.js"
  }
}
```

This will stop developers on Windows from running `yarn clean` unless they are specifically using a POSIX shell (like Git Bash). Instead, opt for a Node.js script where possible, or use a cross-platform Node.js module. In this case, we could use the [`rimraf`](https://www.npmjs.com/package/rimraf) module:

```json
{ 
  "devDependencies": {
    "rimraf": "5.0.10"
  },
  "scripts": {
    "clean": "rimraf '**/*.js'"
  }
}
```

Now your script is cross-platform.

## Use the os Module

You can use the `os` module to handle platform differences. One such example is line endings; `\n` on linux systems, and `\r\n` on Windows. Instead. use `os.EOL`. To check the current platform, use `os.arch()`:

```ts
import os from 'os'

os.EOL // \n on linux, \r\n on windows

os.platform()
// 'linux' on Linux
// 'win32' on Windows (32-bit / 64-bit)
// 'darwin' on OSX
```
