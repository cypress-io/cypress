import { expect } from 'chai'
import path from 'path'
import fs from 'fs'
import { getPackageManager, clearCache } from '../../../lib/util/detect-package-manager'

describe('detectPackageManager', () => {
  beforeEach(() => {
    clearCache()
    try {
      fs.unlinkSync(path.resolve('.', 'yarn.lock'))
    /* eslint-disable no-empty */
    } catch {}

    try {
      fs.unlinkSync(path.resolve('.', 'package-lock.json'))
    /* eslint-disable no-empty */
    } catch {}
  })

  it('returns yarn when yarn.lock is present', async () => {
    fs.writeFileSync(path.resolve('.', 'yarn.lock'), '')
    const res = await getPackageManager()

    expect(res).to.eq('yarn')
  })

  it('returns npm when package-lock.json file is present', async () => {
    fs.writeFileSync(path.resolve('.', 'package-lock.json'), '')
    const res = await getPackageManager({ cwd: '.' })

    expect(res).to.eq('npm')
  })

  it('uses yarn if globally installed', async () => {
    // yarn is globally installed since Cypress uses it.
    const res = await getPackageManager()

    expect(res).to.eq('yarn')
  })
})
