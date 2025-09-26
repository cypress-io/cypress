
### E2E `@cypress/grep` verification

The `@cypress/grep` plugin requires the user to pass arguments to the Cypress CLI. Because of this, we have a large list of custom CLI scripts inside this package that run with different arguments. The results of the tests run are recorded to a `.json` output so we can compare the run in the future. This way, if any code changes, we should be able to detect regressions or intentional overwrites. If needing to write a new `.json` file or overwrite the existing file, the `OVERWRITE_EXPECTED` environment variable can be set when running the script. The comparison will no-op if a `PROJECT_NAME` environment variable is NOT present.

### Unit Tests

If making changes that only require a unit test, a `vitest` test can be added in the `test/` directory.