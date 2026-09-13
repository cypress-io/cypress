import path from 'path'
import { describe, expect, it } from 'vitest'
import { ESLint } from 'eslint'

import { baseConfig } from '../baseConfig'

const RULE = 'no-restricted-syntax'
const packageRoot = path.resolve(import.meta.dirname, '..', '..')

const syncFsReports = async (code: string) => {
  const eslint = new ESLint({ overrideConfigFile: true, baseConfig, cwd: packageRoot })
  const [result] = await eslint.lintText(code, { filePath: path.join(packageRoot, 'sample.ts') })

  return result.messages.filter((message) => message.ruleId === RULE)
}

describe('baseConfig sync fs rule', () => {
  // This rule shipped as an error in .eslintrc.js but came across as a warning
  // when packages moved to the flat config, so a sync fs call could land in a
  // migrated package without failing lint. Pin the severity, not just the match.
  it('reports a sync fs call as an error', async () => {
    const [report] = await syncFsReports(`import fs from 'fs'\nexport const contents = fs.readFileSync('/x', 'utf8')\n`)

    expect(report?.message).to.contain('Synchronous fs calls should not be used in Cypress')
    expect(report?.severity).to.equal(2)
  })

  it('reports a sync fs call reached through a property chain', async () => {
    const reports = await syncFsReports(`export function read (ctx: any) {\n  return ctx.fs.readFileSync('/x')\n}\n`)

    expect(reports).to.have.length(1)
  })

  it('exempts existsSync', async () => {
    const reports = await syncFsReports(`import fs from 'fs'\nexport const there = fs.existsSync('/x')\n`)

    expect(reports).to.be.empty
  })

  it('can be suppressed where sync io is deliberate', async () => {
    const reports = await syncFsReports(`import fs from 'fs'\n// eslint-disable-next-line ${RULE}\nexport const contents = fs.readFileSync('/x', 'utf8')\n`)

    expect(reports).to.be.empty
  })
})
