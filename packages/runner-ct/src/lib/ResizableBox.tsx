import * as React from 'react'

interface ResizableBoxProps extends React.HTMLProps<HTMLDivElement> {
  width: number,
  minWidth: number,
  maxWidth: number,
  disabled?: boolean,
  onIsResizingChange?: (isResizingNow: boolean) => void,
  onWidthChange: (newWidth: number) => void
}

export const ResizableBox: React.FC<ResizableBoxProps> = ({
  width,
  onWidthChange,
  onIsResizingChange,
  children,
  disabled = false,
  minWidth,
  maxWidth,
  ...other
}) => {
  const isResizingRef = React.useRef(false)
  const startWidthRef = React.useRef(width)
  const startClientXRef = React.useRef(width)
  const resizingRef = React.useRef<HTMLDivElement>(null)

  const handleResize = React.useCallback((e: MouseEvent) => {
    e.preventDefault()

    if (isResizingRef.current) {
      const newWidth = startWidthRef.current + e.clientX - startClientXRef.current

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onWidthChange(newWidth)
      }
    }
  }, [minWidth, maxWidth])

  const stopResize = React.useCallback(() => {
    isResizingRef.current = false
    document.removeEventListener('mouseup', stopResize)
    document.removeEventListener('mousemove', handleResize)

    if (onIsResizingChange) {
      onIsResizingChange(false)
    }
  }, [handleResize])

  const initResizing = React.useCallback((e) => {
    isResizingRef.current = true
    startClientXRef.current = e.clientX
    startWidthRef.current = resizingRef.current.getBoundingClientRect().width

    if (onIsResizingChange) {
      onIsResizingChange(true)
    }

    document.addEventListener('mouseup', stopResize)
    document.addEventListener('mousemove', handleResize)
  }, [stopResize])

  return (
    <div style={!disabled ? { display: 'flex' } : { userSelect: 'none' }}>
      <div style={{ width }} ref={resizingRef} {...other}>
        {children}
      </div>

      {!disabled && (
        <div
          data-cy="resizer"
          className="Resizer vertical"
          style={{ height: '100vh' }}
          onMouseDown={initResizing}
        />
      )}
    </div>
  )
}
