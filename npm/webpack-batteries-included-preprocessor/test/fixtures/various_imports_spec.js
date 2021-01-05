// results in error found in linked issue without including node_modules
// for .mjs files. don't upgrade graphql from 14.0.0 or it won't reproduce
// the issue properly
// https://github.com/cypress-io/cypress/issues/8361
import graphql from 'graphql' // eslint-disable-line no-unused-vars

import { fromJs } from './file-types/js-file'
import { fromJsx } from './file-types/jsx-file'
import { fromCoffee } from './file-types/coffee-file'
import { fromMjs } from './file-types/mjs-file'

import json from './json_file'

expect(fromJs).equal('from js')
expect(fromJsx).to.be.an('object')
expect(fromCoffee).equal('from coffee')
expect(fromMjs).equal('from mjs')
expect(json).to.eql({ json: 'contents' })
