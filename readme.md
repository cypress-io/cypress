[![Circle CI](https://circleci.com/gh/brian-mann/eclectus.svg?style=svg&circle-token=a6d67217ee174805c91925400b4210ada937def9)](https://circleci.com/gh/brian-mann/eclectus)

## Docs / API

[Visit the Wiki](https://github.com/brian-mann/eclectus/wiki)

### Before Running NW
The `lib/secret_sauce.bin` file is required to run NW.  You can either run the `npm run watch` command, or run a one-off dist with:

```bash
npm run dist
```

### While Developing
```bash
npm run watch
```

##### Start the Key Server

```bash
cd cypress-api
npm run dev
```

### Booting NW
Alias 'nw' in your `.bash_profile`

```bash
alias nw="/Applications/nwjs.app/Contents/MacOS/nwjs"
```

Boot NW

```bash
nw .
```

With Chrome Dev Tools

```bash
nw . --debug
```

### Booting via the CLI

```bash
cy
```

### Deplying

```bash
npm run deploy
```

### Rolling back
1. Open `package.json`
2. Reduce version to what we want to roll back to
3. run `gulp deploy:manifest` to push this change live