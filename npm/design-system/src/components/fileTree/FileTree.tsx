import React, { useCallback, useMemo } from 'react'

import { VirtualizedTree } from 'components/virtualizedTree/VirtualizedTree'
import { CollapsibleGroupHeader } from 'components/collapsibleGroup/CollapsibleGroupHeader'
import { OnNodePress } from 'components/virtualizedTree/types'
import { buildTree } from './buildTree'
import { FileBase, FilePressEvent, FileTreeProps, TreeFile, TreeFolder } from './types'

import type { IconifyIcon } from '@iconify/types'
import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'

interface MutableFilePressEvent extends Omit<FilePressEvent, 'defaultPrevented'> {
  defaultPrevented: boolean
}

export const FileTree = <T extends FileBase>({
  files,
  rootDirectory,
  onFolderPress,
  onFilePress,
}: FileTreeProps<T>) => {
  const tree = useMemo(() => buildTree(files, rootDirectory), [files, rootDirectory])

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
      tree={tree}
      defaultItemSize={20}
      // TODO: Set off of design-system spacing
      indentSize={1}
      showRoot={true}
      onNodePress={onNodePress}
      // eslint-disable-next-line react/jsx-no-bind
      onRenderParent={({ parent, isOpen, setOpen }) => (
        <CollapsibleGroupHeader
          title={parent.name}
          expanded={isOpen}
          icons={{ expanded: 'chevron-down', collapsed: 'chevron-right' }}
        />
      )}
      // eslint-disable-next-line react/jsx-no-bind
      onRenderLeaf={(innerProps) => (
        <FileLeaf
          {...innerProps}
          item={innerProps.leaf}
          indexes={[]}
        />
      )}
    />
  )
}

export interface NodeComponentProps<T> {
  item: T
  depth: number
  indexes: number[]
}

export interface FileComponentProps<T extends FileBase> extends NodeComponentProps<TreeFile<T>> {
  depth: number
  remeasure: () => void
}

export const icons: Record<string, { icon: IconifyIcon }> = {
  js: { icon: javascriptIcon },
  ts: { icon: typescriptIcon },
  tsx: { icon: reactTs },
  jsx: { icon: reactJs },
} as const

const FileLeaf = <T extends FileBase>({ item, indexes }: FileComponentProps<T>) => {
  const ext = getExt(item.name)
  const inlineIconProps = ext ? icons[ext] : {
    // If we don't have an icon for the extension, don't render an icon
    icon: '',
  }

  return (
    <>
      <InlineIcon {...inlineIconProps} />
      {/* <NameWithHighlighting
        item={item}
        indexes={indexes}
      /> */}
      {item.name}
    </>
  )
}

const extensionRegex = /(?:\.([^.]+))?$/

export const getExt = (path: string) => {
  const extensionMatches = path.match(extensionRegex)

  return extensionMatches ? extensionMatches[1] : ''
}
