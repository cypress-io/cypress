/// <reference types="cypress" />

it('hello world', () => {})

it('works', () => {})

it('works 2 @tag1', { tags: '@tag1' }, () => {})

it('works 2 @tag1 @tag2', { tags: ['@tag1', '@tag2'] }, () => {})

it('works @tag2', { tags: '@tag2' }, () => {})
