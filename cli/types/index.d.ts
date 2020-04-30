// Project: https://www.cypress.io
// GitHub:  https://github.com/cypress-io/cypress
// Definitions by: Gert Hengeveld <https://github.com/ghengeveld>
//                 Mike Woudenberg <https://github.com/mikewoudenberg>
//                 Robbert van Markus <https://github.com/rvanmarkus>
//                 Nicholas Boll <https://github.com/nicholasboll>
// TypeScript Version: 2.9
// Updated by the Cypress team: https://www.cypress.io/about/

/// <reference path="./cy-blob-util.d.ts" />
/// <reference path="./cy-bluebird.d.ts" />
/// <reference path="./cy-moment.d.ts" />
/// <reference path="./cy-minimatch.d.ts" />
/// <reference path="./cy-chai.d.ts" />
/// <reference path="./lodash/index.d.ts" />
/// <reference path="./sinon/index.d.ts" />
/// <reference path="./sinon-chai/index.d.ts" />
/// <reference path="./mocha/index.d.ts" />
/// <reference path="./jquery/index.d.ts" />
/// <reference path="./chai-jquery/index.d.ts" />

// jQuery includes dependency "sizzle" that provides types
// so we include it too in "node_modules/sizzle".
// This way jQuery can load it using 'reference types="sizzle"' directive

// "moment" types are with "node_modules/moment"
/// <reference types="moment" />

// load ambient declaration for "cypress" NPM module
// hmm, how to load it better?
/// <reference path="./cypress-npm-api.d.ts" />

// Cypress, cy, Log inherits EventEmitter.
type EventEmitter2 = import("eventemitter2").EventEmitter2

type Nullable<T> = T | null

interface EventEmitter extends EventEmitter2 {
  proxyTo: (cy: Cypress.cy) => null
  emitMap: (eventName: string, args: any[]) => Array<(...args: any[]) => any>
  emitThen: (eventName: string, args: any[]) => Bluebird.BluebirdStatic
}

// Cypress adds chai expect and assert to global
declare const expect: Chai.ExpectStatic
declare const assert: Chai.AssertStatic

/**
 * Global variables `cy` added by Cypress with all API commands.
 * @see https://on.cypress.io/api
 *
```
cy.get('button').click()
cy.get('.result').contains('Expected text')
```
 */
declare const cy: Cypress.cy & EventEmitter

/**
 * Global variable `Cypress` holds common utilities and constants.
 * @see https://on.cypress.io/api
 *
```
Cypress.config("pageLoadTimeout") // => 60000
Cypress.version // => "1.4.0"
Cypress._ // => Lodash _
```
 */
declare const Cypress: Cypress.Cypress & EventEmitter
