/// <reference path="../../src/index.d.ts" />

// @ts-check

describe('block with no tags', () => {
  it('inside describe 1', () => {})

  it('inside describe 2', () => {})
})

describe('block with tag smoke', { tags: '@smoke' }, () => {
  it('inside describe 3', () => {})

  it('inside describe 4', () => {})
})

describe('block without any tags', () => {
  // note the parent suite has no tags
  // so this test should run when using --env grepTags=@smoke
  it('test with tag smoke', { tags: '@smoke' }, () => {})
})

it('is a test outside any suites', () => {})
