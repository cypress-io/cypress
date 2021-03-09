import React from 'react'
import _ from 'lodash'
import SplitPane from 'react-split-pane'

export const Foo: React.FC = () => {
  const items = ['a', 'b', 'c']

  return (<SplitPane>
    {_.map(items, (letter) => <div>Hello world!!!! {letter}</div>)}
  </SplitPane>)
}
