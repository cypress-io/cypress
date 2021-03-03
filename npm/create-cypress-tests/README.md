# Create Cypress Tests 

Installs and injects all the required configuration to run cypress tests.

## Quick overview

```
cd my-app
npx create-cypress-test 
npx cypress open
```

![demo](./demo.gif)

## Package manager

This wizard will automatically determine which package do you use. If `yarn` available as global dependency it will use yarn to install dependencies and create lock file. 

If you need to use `npm` over `yarn` you can do the following

```
npx create-cypress-tests --use-npm
```

By the way you can use yarn to run the installation wizard 😉

```
yarn create cypress-tests
```

## Typescript 

This package will also automatically determine if typescript if available in this project and inject the required typescript configuration for cypress. If you are starting a new project and want to create typescript configuration, please do the following:

```
npm init
npm install typescript
npx create-cypress-tests 
```

## Configuration 

Here is a list of available configuration options: 

`--use-npm` – use npm if yarn available
`--ignore-typescript` – will not create typescript configuration if available 
`--ignore-examples` – will create a 1 empty spec file (`cypress/integration/spec.js`) to start with
`--component-tests` – will not ask should setup component testing or not

## License

The project is licensed under the terms of [MIT license](../../LICENSE)
