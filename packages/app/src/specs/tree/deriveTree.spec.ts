// TODO: Either run in mocha or install vitest.
// import { it, expect, describe } from 'vitest'
import {
  getAllFileInDirectory,
  deriveSpecTree,
  filterDirectoryNodes,
  filterFileNodes,
  SpecTreeDirectoryNode,
  SpecListOptions,
  groupSpecTreeNodes,
  SpecTreeFileNode,
} from './deriveTree'
import type { FoundSpec } from '@packages/types/src'

export function createSpec (p: string, name: string): FoundSpec {
  const prefix = p.length > 0 ? `${p}/` : ``

  return {
    name: `${prefix}${name}.cy.ts`,
    specType: 'integration',
    absolute: `/${prefix}${name}.cy.ts`,
    baseName: name,
    fileName: name,
    specFileExtension: '.cy.ts',
    fileExtension: '.ts',
    relative: `${prefix}${name}.cy.ts`,
  }
}

const cypress_s1 = createSpec('cypress', 's1')
const cypress_d1_s2 = createSpec('cypress/d1', 's2')
const cypress_d1_d2_s3 = createSpec('cypress/d1/d2', 's3')
const cypress_q2_q3_q4_q5_s5 = createSpec('cypress/q2/q3/q4/q5', 's5')

function sortForTesting (specs: FoundSpec[]) {
  return specs.sort((x, y) => (x.name.length < y.name.length ? 1 : -1))
}

describe('deriveSpecTree', () => {
  it('works for deeply nested specs', () => {
    const specs = [
      cypress_s1,
      cypress_d1_s2,
      cypress_d1_d2_s3,
      cypress_q2_q3_q4_q5_s5,
    ]

    const opts: SpecListOptions<FoundSpec> = {
      sep: '/',
      search: '',
      collapsedDirs: new Set(),
    }

    const { root } = deriveSpecTree(specs, opts)

    expect(root.children.length).to.eq(1)

    let cypressNode = root.children.filter(filterDirectoryNodes)

    expect(cypressNode[0].name).to.eq('cypress')
    expect(cypressNode[0].relative).to.eq('cypress')
    expect(cypressNode[0].parentPath).to.eq('/')
    expect(cypressNode[0].depth).to.eq(1)
    expect(cypressNode[0].children.length).to.eq(3)

    let { files, directories } = groupSpecTreeNodes(cypressNode[0])

    expect(files.length).to.eq(1)
    expect(cypressNode.length).to.eq(1)
    expect(files[0].name).to.eq('s1.cy.ts')
    expect(files[0].data.relative).to.eq('cypress/s1.cy.ts')

    expect(directories.length).to.eq(2)
    expect(directories[0].name).to.eq('d1')
    expect(directories[0].relative).to.eq('cypress/d1')
    expect(directories[0].depth).to.eq(2)
    expect(directories[1].relative).to.eq('cypress/q2/q3/q4/q5')
    expect(
      (directories[1].children[0] as SpecTreeFileNode<FoundSpec>).name,
    ).to.eq('s5.cy.ts')

    expect(
      (directories[1].children[0] as SpecTreeFileNode<FoundSpec>).data.relative,
    ).to.eq('cypress/q2/q3/q4/q5/s5.cy.ts')

    const nodes = groupSpecTreeNodes(directories[0])

    expect(nodes.directories.length).to.eq(1)
    expect(nodes.files.length).to.eq(1)
    expect(nodes.directories[0].name).to.eq('d2')
    expect(nodes.directories[0].relative).to.eq('cypress/d1/d2')
    expect(nodes.directories[0].depth).to.eq(3)
    expect(nodes.files[0].name).to.eq('s2.cy.ts')
    expect(nodes.files[0].data.relative).to.eq('cypress/d1/s2.cy.ts')
  })

  it('works with non nested one file', () => {
    const q1 = createSpec('cypress', 'q1')
    const { root } = deriveSpecTree([q1])

    // only child is directory `cypress`
    expect(root.children.length).to.eq(1)
    expect(root.children[0].type).to.eq('directory')
    expect(root.children[0].name).to.eq('cypress')

    const cypressNode = root.children[0] as SpecTreeDirectoryNode<FoundSpec>
    const cypressChildrenFiles = cypressNode.children.filter(filterFileNodes)
    const cypressChildrenDirs =
      cypressNode.children.filter(filterDirectoryNodes)

    expect(cypressChildrenFiles.length).to.eq(1)
    expect(cypressChildrenDirs.length).to.eq(0)
    expect(sortForTesting(cypressChildrenFiles.map((x) => x.data))).to.eql([
      q1,
    ])
  })

  it('works with deeply nested one file', () => {
    const q1 = createSpec('cypress/a/b/c/d/e', 'q1')
    const { root } = deriveSpecTree([q1])

    // only child is directory `cypress`
    expect(root.children.length).to.eq(1)
    expect(root.children[0].type).to.eq('directory')
    expect(root.children[0].name).to.eq('cypress/a/b/c/d/e')

    const cypressNode = root.children[0] as SpecTreeDirectoryNode<FoundSpec>
    const cypressChildrenFiles = cypressNode.children.filter(filterFileNodes)
    const cypressChildrenDirs =
      cypressNode.children.filter(filterDirectoryNodes)

    expect(cypressChildrenFiles.length).to.eq(1)
    expect(cypressChildrenDirs.length).to.eq(0)
    expect(sortForTesting(cypressChildrenFiles.map((x) => x.data))).to.eql([
      q1,
    ])
  })

  it('works with many files', () => {
    const q1 = createSpec('cypress', 'q1')
    const q2 = createSpec('cypress', 'q2')
    const { root } = deriveSpecTree([q1, q2])

    // only child is directory `cypress`
    expect(root.children.length).to.eq(1)
    expect(root.children[0].type).to.eq('directory')
    expect(root.children[0].name).to.eq('cypress')

    const cypressNode = root.children[0] as SpecTreeDirectoryNode<FoundSpec>
    const cypressChildrenFiles = cypressNode.children.filter(filterFileNodes)
    const cypressChildrenDirs =
      cypressNode.children.filter(filterDirectoryNodes)

    expect(cypressChildrenFiles.length).to.eq(2)
    expect(cypressChildrenDirs.length).to.eq(0)
    expect(sortForTesting(cypressChildrenFiles.map((x) => x.data))).to.eql([
      q1,
      q2,
    ])
  })
})

describe('getAllFileInDirectory', () => {
  it('gets total files for a given directory', () => {
    const specs = [
      cypress_s1,
      cypress_d1_s2,
      cypress_d1_d2_s3,
      cypress_q2_q3_q4_q5_s5,
    ]

    const { map } = deriveSpecTree(specs)
    const node = map.get('cypress')!
    const fileNodes = getAllFileInDirectory(node)

    expect(fileNodes.length).to.eq(4)

    // order is not specified, user needs to sort it out.
    expect(sortForTesting(specs)).to.eql(
      sortForTesting(fileNodes.map((x) => x.data)),
    )
  })
})
