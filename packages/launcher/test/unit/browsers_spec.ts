import { browsers } from '../../lib/browsers'
const snapshot = require('snap-shot-it')

describe('browsers', () => {
    it('returns the expected list of browsers', () => {
        snapshot(browsers)
    })
})
