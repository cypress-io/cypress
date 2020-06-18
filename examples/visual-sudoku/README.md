# example: visual tests for Sudoku

> This React Sudoku app was cloned from [raravi/sudoku](https://github.com/raravi/sudoku).

Visual testing uses open source [palmerhq/cypress-image-snapshot](https://github.com/palmerhq/cypress-image-snapshot) plugin.

## Usage

1. Make sure the root project has been built .

```bash
# in the root of the project
npm install
npm run build
```

2. Run `npm install` in this folder to symlink the `cypress-react-unit-test` dependency.

```bash
# in this folder
npm install
```

3. Start Cypress

```bash
npm run cy:open
# or just run headless tests
npm test
```

## Running Tests

Example failing test [src/App.cy-spec.js](src/App.cy-spec.js)

![failing test](images/test.png)

Because there is a difference in the numbers displayed on the board

![Visual diff](images/board-diff.png)

The saved snapshots are saved in [cypress/snapshots](cypress/snapshots) folder and committed to the repo.

## Consistent images

If we generate images on Mac, they will be different from images generated on Linux CI

- the images will be twice as large because in the headed mode Mac's DPI is 2x
- even in non-interactive mode using `cypress run`, due to fonts rendering, the images will be slightly different from Linux images

Thus I recommend generating / updating images using a Docker container [cypress/included](https://github.com/cypress-io/cypress-docker-images/tree/master/included). You can run it using npm script `npm run docker:run` which executes

```
# map the entire repo as a volume
# and set the working directory to the current folder
docker run -it -v $PWD/../..:/e2e \
  -w /e2e/examples/visual-sudoku cypress/included:4.5.0
```

If you want to update the saved snapshots, run the script with environment variable

```shell
npm run docker:run -- --env updateSnapshots=true
```

See [cypress-image-snapshot docs](https://github.com/palmerhq/cypress-image-snapshot#updating-snapshots).

## Full example

For a larger Do-It-Yourself example with an hour long list of explanation videos, see [bahmutov/sudoku](https://github.com/bahmutov/sudoku) repository.
