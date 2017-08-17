
<!--
# Add Cypress to Your App

Add Cypress to your app as we did before with `npm`:

```shell
$ npm install cypress --save-dev
```

...and make yourself an `npm` script in `package.json` to run it easily (we named it "test-cypress" this time because we're assuming you already have a "test" script, but the name is arbitrary):

***package.json***

```json
{
  "scripts": {
    "test-cypress": "cypress open"
  }
}
```

Now you can run Cypress from the command line by typing `npm run test-cypress`, do so now. Cypress will open and generate the needed files to get started. (You may delete `./cypress/integration/example_spec.js` if you wish, it is only provided as, you guessed it, an example.)

{% note info Which Project To Install To? %}
Does your application have multiple project repositories? Many modern applications do! Cypress should be installed with your *front-end project*, wherever you serve the front-end files for development.
{% endnote %}

-->
