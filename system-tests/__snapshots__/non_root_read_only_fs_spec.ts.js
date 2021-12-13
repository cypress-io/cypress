exports['e2e readonly fs / warns when unable to write to disk'] = `
Folder /foo/bar/.projects/read-only-project-root is not writable.

Writing to this directory is required by Cypress in order to store screenshots and videos.

Enable write permissions to this directory to ensure screenshots and videos are stored.

If you don't require screenshots or videos to be stored you can safely ignore this warning.
The support file is missing or invalid.

Your \`supportFile\` is set to \`/foo/bar/.projects/read-only-project-root/cypress/support/support.js\`, but either the file is missing or it's invalid. The \`supportFile\` must be a \`.js\`, \`.ts\`, \`.coffee\` file or be supported by your preprocessor plugin (if configured).

Correct your \`cypress.config.js\`, create the appropriate file, or set \`supportFile\` to \`false\` if a support file is not necessary for your project.

Or you might have renamed the extension of your \`supportFile\` to \`.ts\`. If that's the case, restart the test runner.

Learn more at https://on.cypress.io/support-file-missing-or-invalid

`
