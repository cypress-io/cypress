import React from 'react'

const style = {
  alignItems: 'flex-start',
  display: 'flex',
  justifyContent: 'center',
}

const arrowStyle = {
  alignSelf: 'center',
  fontSize: 20,
  padding: '0 20px',
}

export default ({ children }) => {
  const childrenWithArrows = []
  React.Children.forEach(children, (child, index) => {
    if (index > 0) {
      childrenWithArrows.push(
        <div key={index} style={arrowStyle}>
          →
        </div>,
      )
    }
    childrenWithArrows.push(child)
  })
  return <div style={style}>{childrenWithArrows}</div>
}
