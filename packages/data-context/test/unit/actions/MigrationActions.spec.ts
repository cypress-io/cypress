import { expect } from 'chai'
import { getConfigWithDefaults, getDiff } from '../../../src/actions/MigrationActions'

describe('MigrationActions', () => {
  context('getConfigWithDefaults', () => {
    it('returns a config with defaults without touching the original', () => {
      const config = {
        foo: 'bar',
      }

      expect(getConfigWithDefaults(config)).to.have.property('env')
      expect(getConfigWithDefaults(config)).to.have.property('browsers')
      expect(config).not.to.have.property('env')
      expect(config).not.to.have.property('browsers')
    })
  })

  context('getDiff', () => {
    it('returns all the updated values', () => {
      const oldConfig = {
        foo: 'bar',
        other: 'config',
        removed: 'value',
        updated: 'oldValue',
      }

      const newConfig = {
        foo: 'hello',
        other: 'config',
        updated: 'newValue',
      }

      const diff = getDiff(oldConfig, newConfig)

      expect(diff).to.have.property('foo', 'hello')
      expect(diff).to.have.property('updated', 'newValue')
      expect(diff).not.to.have.property('removed')
    })
  })
})
