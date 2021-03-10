import * as React from 'react'
import './KeyboardHelper.scss'

const KeyboardShortcut: React.FC<{ shortcut: string[], description: string }> = ({
  shortcut,
  description,
}) => {
  const metaSymbol = window.navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'

  return (
    <li className='keyboard-shortcut'>
      <p> {description} </p>
      <div className='shortcut'>
        {shortcut.map((key) => (
          <div key={key} className='key'> {key === 'Meta' ? metaSymbol : key} </div>
        ))}
      </div>
    </li>
  )
}

export const KeyboardHelper: React.FC = () => {
  return (
    <div className='keyboard-helper-container'>
      <ul className='keyboard-helper'>
        <KeyboardShortcut shortcut={['/']} description='Search spec' />
        <KeyboardShortcut shortcut={['Meta', 'B']} description='Toggle specs list' />
      </ul>
    </div>
  )
}
