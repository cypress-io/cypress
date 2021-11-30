import React from 'react'

export const automationElementId = '__cypress-string' as const

interface AutomationElementProps {
  randomString: string
}

export const AutomationElement: React.FC<AutomationElementProps> = ({
  randomString,
}) => {
  return (
    <div id={automationElementId} style={{ display: 'none' }}>
      {randomString}
    </div>
  )
}
