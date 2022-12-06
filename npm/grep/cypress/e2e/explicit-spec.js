/// <reference types="cypress" />

it('tag1', { tags: '@tag1' }, () => {})

it('tag2', { tags: '@tag2' }, () => {})

it('tag3', { tags: '@tag3' }, () => {})

it('tag1 and 2', { tags: ['@tag1', '@tag2'] }, () => {})

it('tag1 and 3', { tags: ['@tag1', '@tag3'] }, () => {})

it('tag2 and 3', { tags: ['@tag2', '@tag3'] }, () => {})

it('all tags', { tags: ['@tag1', '@tag2', '@tag3'] }, () => {})
