import React, { memo, useCallback, useMemo } from 'react'
import { useFocusManager } from '@react-aria/focus'
import { usePress } from '@react-aria/interactions'
import { PressEvent } from '@react-types/shared'

import { InternalChildProps, InternalOnRenderChildProps, isParent, LeafTreeBase, ParentTreeBase, SpecificTreeNode } from './types'
import { useMeasure } from 'hooks/useMeasure'

import styles from './VirtualizedTree.module.scss'

export const TreeChild = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    data,
    isOpen,
    style,
    height,
    indentSize,
    showRoot,
    shouldMeasure,
    onNodePress,
    setOpen,
    resize,
    onRenderLeaf,
    onRenderParent,
  }: InternalChildProps<TLeaf, TParent>) => {
  const focusManager = useFocusManager()

  const id = data.node.id

  const resizer = useCallback((height: number) => resize(height, true), [resize])
  const { ref, setRef, remeasure } = useMeasure(height, resizer, [data, style, isOpen], !shouldMeasure)

  const onPress = useMemo(() => onNodePress ? {
    onPress: (event: PressEvent) => {
      const typedData = isParent(data.node) ? {
        type: 'parent' as const,
        data: data as SpecificTreeNode<TParent>,
        isOpen,
        setOpen,
        ref,
      } : {
        type: 'leaf' as const,
        data: data as SpecificTreeNode<TLeaf>,
        isOpen,
        setOpen,
        ref,
      }

      onNodePress(typedData, event)
    },
  } : {}, [data, isOpen, setOpen, onNodePress, ref])

  const { pressProps } = usePress(onPress)
  const pressOnKeyDown = pressProps.onKeyDown

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        focusManager.focusNext()
        break
      case 'ArrowUp':
        focusManager.focusPrevious()
        break
      case 'ArrowRight': {
        if (isParent(data.node) && !isOpen) {
          setOpen(true)
        }

        break
      }
      case 'ArrowLeft': {
        if (isParent(data.node) && isOpen) {
          setOpen(false)
        }

        break
      }
      default:
        pressOnKeyDown?.(event)

        return
    }

    event.preventDefault()
  }, [data.node, isOpen, focusManager, pressOnKeyDown, setOpen])

  return id !== 'root' || showRoot ? (
    // Wrapper is required for indent margin to work correctly with the tree's absolute positioning
    <span style={style}>
      <div
        ref={setRef}
        {...pressProps}
        className={styles.child}
        style={indentSize ? { marginLeft: `${data.nestingLevel * indentSize}rem` } : undefined}
        // First item is assigned a tabindex to allow tabbing in and out of the tree
        tabIndex={data.isFirst ? 0 : -1}
        onKeyDown={onKeyDown}
      >
        <MemoedOnRenderChild
          data={data}
          isOpen={isOpen}
          setOpen={setOpen}
          remeasure={remeasure}
          onRenderLeaf={onRenderLeaf}
          onRenderParent={onRenderParent}
        />
      </div>
    </span>
  ) : null
}

const OnRenderChild = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    data: { node, nestingLevel },
    isOpen,
    setOpen,
    remeasure,
    onRenderLeaf,
    onRenderParent,
  }: InternalOnRenderChildProps<TLeaf, TParent>) =>
    isParent(node)
      ? onRenderParent({
        parent: node,
        depth: nestingLevel,
        isOpen,
        setOpen,
        remeasure,
      })
      : onRenderLeaf({
        leaf: node,
        depth: nestingLevel,
        remeasure,
      })

// Memo `onRender` callback results to double the speed of height calculation
const MemoedOnRenderChild = memo(OnRenderChild) as typeof OnRenderChild
