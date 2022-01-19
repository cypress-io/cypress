import React from 'react'

interface AutomationElementProps {
  namespace: string
  randomString: string
}

export const AutomationElement: React.FC<AutomationElementProps> = ({
  namespace,
  randomString,
}) => {
  return (
    <div id={`${namespace}-string`} style={{ display: 'none' }}>
      {randomString}
    </div>
  )
}
