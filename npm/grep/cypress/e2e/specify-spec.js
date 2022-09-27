/// <reference types="cypress" />

// specify is the same as it()

specify('hello world', () => {})

specify('works', () => {})

specify('works 2 @tag1', { tags: '@tag1' }, () => {})

specify('works 2 @tag1 @tag2', { tags: ['@tag1', '@tag2'] }, () => {})

specify('works @tag2', { tags: '@tag2' }, () => {})
