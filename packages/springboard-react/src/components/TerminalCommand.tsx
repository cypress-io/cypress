import * as React from 'react'

interface TerminalCommandProps {
  command: string
}

export const TerminalCommand: React.FC<TerminalCommandProps> = (props) => {
  const copyToClipboard = () => {
    const $el = document.createElement('input')

    $el.style.top = '-100000px'
    document.body.appendChild($el)
    $el.value = props.command
    $el.select()
    document.execCommand('copy')
    $el.remove()
  }

  return (
    <div className="flex h-10 w-100 bg-gray-900">
      <div className="py-1 flex w-100 flex items-center">
        <code className="text-yellow-200 px-2">
          $
        </code>
        <code className="text-white overflow-scroll flex items-center mr-2" id="command" style={{ whiteSpace: 'nowrap' }}>
          {props.command}
        </code>
      </div>
      <button
        onClick={copyToClipboard}
        className="bg-gray-300 px-2 py-1"
      >
        CP
      </button>
    </div>
  )
}
