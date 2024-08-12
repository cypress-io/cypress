## Purging Specific URLs from Cloudflare cache

In some cases, pre-released cypress binaries will 404 when being downloaded from the Cypress CDN.

```sh
yarn add -D cypress@https://cdn.cypress.io/beta/npm/vX.Y.Z/OPERATING_ARCH/BRANCH_AND_HASH_NAME/cypress.tgz

npm ERR! URL:https://cdn.cypress.io/beta/npm/vX.Y.Z/OPERATING_ARCH/BRANCH_AND_HASH_NAME/cypress.zip
npm ERR! Error: Failed downloading the Cypress binary.
npm ERR! Response code: 404
npm ERR! Response message: Not Found
npm ERR! 
```

When this happens, the Cloudflare URL cache for the pre-released binary likely needs to be cleared. This can be done with the following command:

```sh
node ./scripts/binary.js purge-urls --f ./path_to_file_with_urls_to_purge
```

Where `./path_to_file_with_urls_to_purge` is a text file of URLs separated by new lines. For example, the below text file would clear the cache for a given pre-release:

```text
https://cdn.cypress.io/beta/npm/vX.Y.Z/win32-x64/BRANCH_AND_HASH_NAME/cypress.tgz
https://cdn.cypress.io/beta/npm/vX.Y.Z/win32-x64/BRANCH_AND_HASH_NAME/cypress.zip
https://cdn.cypress.io/beta/npm/vX.Y.Z/linux-arm64/BRANCH_AND_HASH_NAME/cypress.tgz
https://cdn.cypress.io/beta/npm/vX.Y.Z/linux-arm64/BRANCH_AND_HASH_NAME/cypress.zip
https://cdn.cypress.io/beta/npm/vX.Y.Z/linux-x64/BRANCH_AND_HASH_NAME/cypress.tgz
https://cdn.cypress.io/beta/npm/vX.Y.Z/linux-x64/BRANCH_AND_HASH_NAME/cypress.zip
https://cdn.cypress.io/beta/npm/vX.Y.Z/darwin-x64/BRANCH_AND_HASH_NAME/cypress.tgz
https://cdn.cypress.io/beta/npm/vX.Y.Z/darwin-x64/BRANCH_AND_HASH_NAME/cypress.zip
https://cdn.cypress.io/beta/npm/vX.Y.Z/darwin-arm64/BRANCH_AND_HASH_NAME/cypress.tgz
https://cdn.cypress.io/beta/npm/vX.Y.Z/darwin-arm64/BRANCH_AND_HASH_NAME/cypress.zip

```

Note: you likely need to clear out the corresponding `.zip` files alongside the `.tgz` (included in the example)

You will need the Cloudflare cache variables mentioned in the [release process](https://github.com/cypress-io/cypress/blob/develop/guides/release-process.md#prerequisites).