import { describe, expect, it } from '@jest/globals'
import { SpecWithRelativeRoot } from '@packages/types'
import fs from 'fs-extra'
import { scaffoldMigrationProject } from '../helper'
import { getTestCounts } from '../../../src/util/testCounts'
import path from 'path'

describe('getTestCounts', () => {
  it('should return zeros for no input', async () => {
    const specs = []

    const counts = await getTestCounts(specs)

    expect(counts).toEqual({
      totalSpecs: 0,
      totalTests: 0,
      exampleSpecs: 0,
      exampleTests: 0,
    })
  })

  describe('with e2e project', () => {
    let specs: SpecWithRelativeRoot[]

    beforeEach(async () => {
      const cwd = await scaffoldMigrationProject('e2e')

      const e2eSpecs = await fs.readdir(path.join(cwd, 'cypress/e2e'))

      specs = e2eSpecs.map((spec) => {
        const absolute = path.join(cwd, 'cypress/e2e', spec)

        return {
          absolute,
          relativeToCommonRoot: path.join('cypress/e2e', spec),
        } as SpecWithRelativeRoot
      })
      .filter((spec) => {
        return !fs.lstatSync(spec.absolute).isDirectory()
      })
    })

    it('should return counts for tests e2e migration project', async () => {
      const counts = await getTestCounts(specs)

      expect(counts.totalSpecs).toEqual(specs.length)
      // don't test for exact number since tests in sample project might change
      expect(counts.totalTests).toBeGreaterThan(0)
      expect(counts.exampleSpecs).toEqual(0)
      expect(counts.exampleTests).toEqual(0)
    })
  })
})
