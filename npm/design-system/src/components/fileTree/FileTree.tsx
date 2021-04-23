import React, { useMemo } from 'react'

import { VirtualizedTree } from 'components/virtualizedTree/VirtualizedTree'
import { CollapsibleGroupHeader, IconInfo } from 'components/collapsibleGroup/CollapsibleGroupHeader'
import { LeafProps, OnNodeKeyDown, OnNodePress, ParentProps } from 'components/virtualizedTree/types'
import { Placeholder } from 'core/text/placeholder'
import { buildTree } from './buildTree'
import { FileBase, FilePressEvent, FileTreeProps, TreeFile, TreeFolder } from './types'
import { FileTreeFile, NameWithHighlighting } from './FileTreeFile'

import styles from './FileTree.module.scss'

interface MutableFilePressEvent extends Omit<FilePressEvent, 'defaultPrevented'> {
  defaultPrevented: boolean
}

export const FileTree = <T extends FileBase>({
  files,
  rootDirectory,
  emptyPlaceholder,
  onRenderFolder,
  onRenderFile,
  onFolderPress,
  onFilePress,
  onFolderKeyDown,
  onFileKeyDown,
}: FileTreeProps<T>) => {
  const tree = useMemo(() => buildTree(files, rootDirectory), [files, rootDirectory])

  const ParentComponent = useMemo(() => onRenderFolder ?? DefaultFolder, [onRenderFolder])
  const LeafComponent = useMemo(() => onRenderFile ?? DefaultFile, [onRenderFile])

  const onNodePress = useMemo<OnNodePress<TreeFile<T>, TreeFolder<T>> | undefined>(() => onFolderPress || onFilePress ? (node, event) => {
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
  } : undefined, [onFolderPress, onFilePress])

  const onNodeKeyDown = useMemo<OnNodeKeyDown<TreeFile<T>, TreeFolder<T>> | undefined>(() => onFolderKeyDown || onFileKeyDown ? (node, event) => {
    if (node.type === 'parent') {
      onFolderKeyDown?.(node.data, event)
    } else {
      onFileKeyDown?.(node.data, event)
    }
  } : undefined, [onFolderKeyDown, onFileKeyDown])

  return (
    tree ? (
      <VirtualizedTree<TreeFile<T>, TreeFolder<T>>
      // No x scrollbar. Unfortunately, react-vtree sets overflow using `style`, so we also have to
        style={{ overflowX: 'hidden' }}
        tree={tree}
        // TODO: This is hardcoded to spacing ml, but the API doesn't accept REM, only pixels
        defaultItemSize={20}
        showRoot={true}
        onNodePress={onNodePress}
        onNodeKeyDown={onNodeKeyDown}
        onRenderParent={ParentComponent}
        onRenderLeaf={LeafComponent}
      />
    ) : (
      <div className={styles.placeholder}>
        <Placeholder>
          {emptyPlaceholder}
        </Placeholder>
      </div>
    )
  )
}

const icons: IconInfo = { expanded: 'chevron-down', collapsed: 'chevron-right', iconProps: { sizeWithoutCenter: true } }

const DefaultFolder = <T extends FileBase>({ parent: { id, name, indexes }, depth, isOpen }: ParentProps<TreeFolder<T>>) => (
  <CollapsibleGroupHeader
    className={styles.node}
    style={depth > 0 ? {
      paddingLeft: `${depth}rem`,
      backgroundSize: `${depth}rem 100%`,
    } : undefined}
    title={(
      <NameWithHighlighting
        name={name}
        path={id}
        indexes={indexes ?? []}
      />
    )}
    tooltipTitle={id}
    expanded={isOpen}
    icons={icons}
    lineHeight="tight"
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
    indexes={props.leaf.file.indexes ?? []}
  />
)
