import fs from 'fs'
import readline from 'readline'
import type { SpecWithRelativeRoot } from '@packages/types'
import { getExampleSpecPaths } from '../codegen'
import templates from '../codegen/templates'

export default async (specs: SpecWithRelativeRoot[]) => {
  const templateSpecPaths = await getExampleSpecPaths(templates.e2eExamples)

  const specCountPromises = specs.map((spec) => {
    return new Promise<{path: string, isExample: boolean, testCounts: number}>((resolve, reject) => {
      let testCounts = 0

      readline.createInterface({
        input: fs.createReadStream(spec.absolute),
      })
      .on('line', (line) => {
        // test for "it(" appearing at beginning of line or with space before
        const isTest = /(^| )it\(/.test(line)

        if (isTest) {
          testCounts++
        }
      })
      .on('close', () => {
        resolve({
          path: spec.absolute,
          isExample: templateSpecPaths.some((templateSpec) => templateSpec === spec.relativeToCommonRoot),
          testCounts,
        })
      })
    })
  })

  const countResults = await Promise.all(specCountPromises)

  interface CountSummary {
    totalTests: number
    exampleSpecs: number
    exampleTests: number
  }

  const countSummary = countResults.reduce<CountSummary>((summary, curr) => {
    summary.totalTests += curr.testCounts
    if (curr.isExample) {
      summary.exampleSpecs++
      summary.exampleTests += curr.testCounts
    }

    return summary
  }, { totalTests: 0, exampleSpecs: 0, exampleTests: 0 })

  return {
    totalSpecs: specs.length,
    ...countSummary,
  }
}
