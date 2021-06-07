/// <reference types="cypress" />

import React, { useCallback, useMemo, useRef } from 'react'
import cs from 'classnames'
import { throttle } from 'lodash'
import { SearchInput, FileTree, SpecificTreeNode, TreeFile, FileBase, TreeFolder, VirtualizedTreeRef } from '@cypress/design-system'

import { useFuzzySort } from './useFuzzySort'

import styles from './SpecList.module.scss'

export interface SpecListProps {
  className?: string

  specs: Cypress.Cypress['spec'][]
  selectedFile?: string
  searchRef: React.MutableRefObject<HTMLInputElement>
  onFileClick: (path: string) => void
}

const fuzzyTransform = <T, >(node: T, indexes: number[]) => ({
  ...node,
  indexes,
})

export const SpecList: React.FC<SpecListProps> = ({ searchRef, className, specs, selectedFile, onFileClick }) => {
  const fileTreeRef = useRef<VirtualizedTreeRef>()

  const files = useMemo(() => specs.map((spec) => ({ path: spec.relative })), [specs])

  const { setSearch, matches } = useFuzzySort({
    search: '',
    transformResult: fuzzyTransform,
    items: files,
    options: { key: 'path' },
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onInput = useMemo(() => throttle(setSearch, 100), [])

  const onFilePress = useCallback((file: SpecificTreeNode<TreeFile<FileBase>>) => onFileClick(file.node.id), [onFileClick])
  const onFolderKeyDown = useCallback((folder: SpecificTreeNode<TreeFolder<FileBase>>, event: React.KeyboardEvent<HTMLDivElement>) => {
    if (folder.isFirst && event.key === 'ArrowUp') {
      event.preventDefault()

      searchRef.current.focus()
    }
  }, [searchRef])

  const onEnter = useCallback(() => fileTreeRef.current.focus(), [])

  const onVerticalArrowKey = useCallback((arrow: 'up' | 'down') => {
    if (arrow === 'down') {
      onEnter()
    }
  }, [onEnter])

  return (
    <nav
      className={cs(styles.nav, className)}
      data-cy='specs-list'
    >
      <SearchInput
        className={styles.searchInput}
        inputRef={searchRef}
        placeholder='Find spec...'
        aria-label="Search specs"
        data-cy='search-specs'
        onInput={onInput}
        onEnter={onEnter}
        onVerticalArrowKey={onVerticalArrowKey}
      />
      {/* Tree requires a wrapping div when nested below flex or grid */}
      <div>
        {/* TODO: Do we need any other rootDirectories? */}
        <FileTree
          innerRef={fileTreeRef}
          files={matches}
          rootDirectory="/"
          emptyPlaceholder="No specs found"
          selectedId={selectedFile}
          leftOffset={0.5}
          onFilePress={onFilePress}
          onFolderKeyDown={onFolderKeyDown}
        />
      </div>
    </nav>
  )
}
