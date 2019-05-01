exports['e2e network error handling Cypress baseurl check tries 5 times in run mode 1'] = `

Cypress could not verify that the server set as your \`baseUrl\` is running: http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

We will retry 3 more times in 1 second...

Cypress could not verify that the server set as your \`baseUrl\` is running: http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

We will retry 2 more times in 2 seconds...

Cypress could not verify that the server set as your \`baseUrl\` is running: http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

We will retry 1 more time in 2 seconds...
Cypress could not verify that the server set as your \`baseUrl\` is running:

  > http://never-gonna-exist.invalid

Your tests likely make requests to this \`baseUrl\` and these tests will fail if you don't boot your server.

Please start this server and then run Cypress again.

`