import React, { useCallback, useMemo } from 'react'

import { VirtualizedTree } from 'components/virtualizedTree/VirtualizedTree'
import { CollapsibleGroupHeader } from 'components/collapsibleGroup/CollapsibleGroupHeader'
import { LeafProps, OnNodePress, ParentProps } from 'components/virtualizedTree/types'
import { buildTree } from './buildTree'
import { FileBase, FilePressEvent, FileTreeProps, TreeFile, TreeFolder } from './types'
import { FileTreeFile } from './FileTreeFile'

import styles from './FileTree.module.scss'

interface MutableFilePressEvent extends Omit<FilePressEvent, 'defaultPrevented'> {
  defaultPrevented: boolean
}

export const FileTree = <T extends FileBase>({
  files,
  rootDirectory,
  onRenderFolder,
  onRenderFile,
  onFolderPress,
  onFilePress,
}: FileTreeProps<T>) => {
  const tree = useMemo(() => buildTree(files, rootDirectory), [files, rootDirectory])

  const ParentComponent = useMemo(() => onRenderFolder ?? DefaultFolder, [onRenderFolder])
  const LeafComponent = useMemo(() => onRenderFile ?? DefaultFile, [onRenderFile])

  const onNodePress = useCallback<(...args: Parameters<OnNodePress<TreeFile<T>, TreeFolder<T>>>) => void>((node, event) => {
    if (node.type === 'parent') {
      let customEvent: MutableFilePressEvent | undefined

      if (onFolderPress) {
        customEvent = {
          ...event,
          defaultPrevented: false,
          preventDefault: () => {},
        }

        customEvent.preventDefault = () => {
          customEvent!.defaultPrevented = true
        }

        onFolderPress(node.data, customEvent)
      }

      if (!customEvent?.defaultPrevented) {
        node.setOpen(!node.isOpen)
      }
    } else {
      onFilePress?.(node.data, {
        ...event,
        defaultPrevented: false,
        preventDefault: () => {},
      })
    }
  }, [onFolderPress, onFilePress])

  return (
    <VirtualizedTree<TreeFile<T>, TreeFolder<T>>
      // No x scrollbar. Unfortunately, react-vtree sets overflow using `style`, so we also have to
      style={{ overflowX: 'hidden' }}
      tree={tree}
      defaultItemSize={20}
      showRoot={true}
      onNodePress={onNodePress}
      onRenderParent={ParentComponent}
      onRenderLeaf={LeafComponent}
    />
  )
}

const DefaultFolder = <T extends FileBase>({ parent: { name }, depth, isOpen }: ParentProps<TreeFolder<T>>) => (
  <CollapsibleGroupHeader
    className={styles.node}
    style={depth > 0 ? {
      paddingLeft: `${depth}rem`,
      backgroundSize: `${depth}rem 100%`,
    } : undefined}
    title={name}
    expanded={isOpen}
    icons={{ expanded: 'chevron-down', collapsed: 'chevron-right' }}
  />
)

const DefaultFile = <T extends FileBase>(props: LeafProps<TreeFile<T>>) => (
  <FileTreeFile
    {...props}
    style={props.depth > 0 ? {
      paddingLeft: `${props.depth}rem`,
      backgroundSize: `${props.depth}rem 100%`,
    } : undefined}
    item={props.leaf}
    indexes={[]}
  />
)
