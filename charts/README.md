## Charts

This package stores the source `draw.io` files and generates the chart images on a precommit hook.

## TODO

- [ ] add `npm` task to create a new chart (based on a template?)
- [ ] add `npm` task that globs for `draw.io` files in `./src` and generates `./images` images (SVG/PNG/PDF?)
  - [ ] add husky precommit hook that calls into this same `npm` task
  - [ ] use the `draw.io` desktop application if found on the system
  - [ ] provide a link to download the github release if not found
  - [ ] bonus points: add required version of `draw.io` in `package.json` and verify `draw.io` binary is gte to that version
- [ ] regenerate README.md with links to to the `src` and `images`
- [ ] create templates to use as base starting charts / diagrams
- [ ] roll this package up into a public module that can be consumed by other repos

## Generate Images

- `/Applications/draw.io.app/Contents/MacOS/draw.io --help`
- `/Applications/draw.io.app/Contents/MacOS/draw.io ./src --recursive --output ./images --export --format png`
- `/Applications/draw.io.app/Contents/MacOS/draw.io ./src --recursive --output ./images --export --crop --border 50`
