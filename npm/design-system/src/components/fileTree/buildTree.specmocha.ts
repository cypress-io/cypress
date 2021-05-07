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
    const files = ['forOfStatement.js', 'foo/y/bar.js', 'foo/bar', 'a/b/c'].map((path) => ({ path }))

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

describe('tree collapsing', () => {
  it('should collapse directories into a single node', () => {
    const files = [{ path: 'folder1/folder2/folder3/moreFolder/file1.js' }]

    const tree = buildTree(files, '/')!

    expect(tree).to.not.be.undefined

    expect(tree.children.length).to.eq(1)

    expect(tree.id).to.eq('folder1/folder2/folder3/moreFolder')
    expect(tree.name).to.eq('folder1/folder2/folder3/moreFolder')
    expect(tree.children[0].id).to.eq(files[0].path)
  })

  it('should collapse directories with multiple children into a single shared node', () => {
    const files = [
      { path: 'folder1/folder2/folder3/moreFolder/file1.js' },
      { path: 'folder1/folder2/diff/filesChanged/file2.js' },
    ]

    const tree = buildTree(files, '/')!

    expect(tree).to.not.be.undefined

    expect(tree.children.length).to.eq(2)

    const [file1Folder, file2Folder] = tree.children as [TreeFolder<FileBase>, TreeFolder<FileBase>]

    expect(tree.id).to.eq('folder1/folder2')
    expect(tree.name).to.eq('folder1/folder2')

    expect(file1Folder.id).to.eq('folder1/folder2/folder3/moreFolder')
    expect(file1Folder.name).to.eq('folder3/moreFolder')

    expect(file2Folder.id).to.eq('folder1/folder2/diff/filesChanged')
    expect(file2Folder.name).to.eq('diff/filesChanged')

    expect(file1Folder.children.length).to.eq(1)
    expect(file1Folder.children[0].id).to.eq('folder1/folder2/folder3/moreFolder/file1.js')
    expect(file1Folder.children[0].name).to.eq('file1.js')

    expect(file2Folder.children.length).to.eq(1)
    expect(file2Folder.children[0].id).to.eq('folder1/folder2/diff/filesChanged/file2.js')
    expect(file2Folder.children[0].name).to.eq('file2.js')
  })
})
