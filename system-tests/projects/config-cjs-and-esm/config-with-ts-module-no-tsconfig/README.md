# Notes

Does not run in Cypress 14.3.1 and under due to `ts-node` trying to set `module` equal to `commonjs` when we are dealing with an ESM. See issue [#27359](https://github.com/cypress-io/cypress/issues/27359) and PR [#31520](https://github.com/cypress-io/cypress/pull/31520) where this was fixed by moving to `tsx`.