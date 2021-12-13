import { expect } from 'chai'
import * as path from 'path'
import { findPagesDir } from '../../plugins/next/findPagesDir'

describe('Next.js findPagesDir', () => {
  it('should find the correct pagesDir', () => {
    const nextPluginFixturePath = path.join(__dirname, '../fixtures/next-plugin')

    let projectRoot = nextPluginFixturePath

    expect(findPagesDir(projectRoot)).to.equal(projectRoot)

    projectRoot = path.join(nextPluginFixturePath, 'next-project-one')
    expect(findPagesDir(projectRoot)).to.equal(path.join(projectRoot, 'pages'))

    projectRoot = path.join(nextPluginFixturePath, 'next-project-two')
    expect(findPagesDir(projectRoot)).to.equal(path.join(projectRoot, 'src/pages'))
  })
})
