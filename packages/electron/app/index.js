// `@electron/packager` refuses to package an app directory whose `main` entry
// point is missing, and the sibling `package.json` declares no `main`, so it
// looks for this exact filename. Nothing here is ever executed: `packageAndExit`
// deletes the packaged `resources/app` as soon as packaging finishes, and `open`
// symlinks the real Cypress app over that path at launch.
