# Notes

Does not run in Cypress 14.3.1 and under due to `extends` configuration resolution not working correctly with `ts-node`. This would fail with `'Unknown file extension ".ts'`See [ts-node 2100](https://github.com/TypeStrong/ts-node/issues/2100) and PR [#31520](https://github.com/cypress-io/cypress/pull/31520) where this was fixed for Cypress via moving to `tsx`.
