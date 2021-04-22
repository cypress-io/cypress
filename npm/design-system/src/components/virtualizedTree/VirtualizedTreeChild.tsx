import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { useFocusManager } from '@react-aria/focus'
import { usePress } from '@react-aria/interactions'
import { PressEvent } from '@react-types/shared'

import { InternalChildProps, InternalOnRenderChildProps, isParent, LeafTreeBase, ParentTreeBase, SpecificTreeNode } from './types'
import { useCurrent } from 'hooks/useCurrent'

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
    onNodePress,
    setOpen,
    resize,
    onRenderLeaf,
    onRenderParent,
  }: InternalChildProps<TLeaf, TParent>) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [measuring, setMeasuring] = useState(false)

  const currentRef = useCurrent(ref)
  const currentMeasuring = useCurrent(measuring)

  const focusManager = useFocusManager()

  const id = data.node.id

  const onPress = useMemo(() => onNodePress ? {
    onPress: (event: PressEvent) => {
      const typedData = isParent(data.node) ? {
        type: 'parent' as const,
        data: data as SpecificTreeNode<TParent>,
        isOpen,
        setOpen,
        ref: currentRef,
      } : {
        type: 'leaf' as const,
        data: data as SpecificTreeNode<TLeaf>,
        isOpen,
        setOpen,
        ref: currentRef,
      }

      onNodePress(typedData, event)
    },
  } : {}, [data, isOpen, setOpen, onNodePress, currentRef])

  const { pressProps } = usePress(onPress)
  const pressOnKeyDown = pressProps.onKeyDown

  const remeasure = useCallback(() => setMeasuring(true), [])

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

  useLayoutEffect(() => {
    // On a new render (prop update), mark the component as ready to measure
    if (currentMeasuring.current) {
      return
    }

    setMeasuring(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, style, isOpen])

  useLayoutEffect(() => {
    // When we are measuring, measure the current DOM and update if necessary
    if (!measuring || !currentRef.current) {
      return
    }

    const measuredHeight = currentRef.current.getBoundingClientRect().height

    if (measuredHeight !== height) {
      resize(measuredHeight, true)
    }

    setMeasuring(false)
  }, [measuring, height, id, resize, currentRef])

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
