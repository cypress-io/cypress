import { expect } from 'chai'
import { buildTree } from './buildTree'
import { FileBase, TreeFile, TreeFolder } from './types'

const getLeaves = (tree: TreeFolder<FileBase>): Array<TreeFile<FileBase>> => {
  const folders: Array<TreeFolder<FileBase>> = []
  const files: Array<TreeFile<FileBase>> = []

  for (const item of tree.children) {
    if ('children' in item) {
      folders.push(item)
    } else {
      files.push(item)
    }
  }

  return [...files, ...folders.flatMap(getLeaves)]
}

describe('tree contents', () => {
  it('should contain all files', () => {
    const files = [
      'forOfStatement.js',
      'foo/y/bar.js',
      'foo/bar',
      'a/b/c',
    ].map((path) => ({ path }))

    const tree = buildTree(files, '/')

    expect(tree).to.not.be.undefined

    const leaves = getLeaves(tree!)

    files.forEach(({ path }) => {
      const pathSegments = path.split('/')
      const fileName = pathSegments[pathSegments.length - 1]

      expect(leaves).to.deep.include({ id: path, name: fileName, file: { path } })
    })
  })

  it('should contain folders with files', () => {
    const files = [
      'folder1/file1.js',
      'anotherFolder/file2.ts',
      'folder3/file3.tsx',
      'oneMore/file4.js',
    ].map((path) => ({ path }))

    const tree = buildTree(files, '/')!

    expect(tree).to.not.be.undefined

    expect(tree.children.length).to.eq(4)

    for (let i = 0; i < files.length; i++) {
      const { path } = files[i]
      const child = tree.children[i] as TreeFolder<FileBase>

      const [folder, file] = path.split('/')

      expect(child).to.have.property('id', folder)
      expect(child.children.length).to.eq(1)
      expect(child.children[0].id).to.eq(path)
      expect(child.children[0].name).to.eq(file)
    }
  })
})

// describe('tree collapsing', () => {
//   it('should collapse directories into a single node', () => {

//   })
// })
