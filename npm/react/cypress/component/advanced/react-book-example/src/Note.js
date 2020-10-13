import React from 'react'

class Note extends React.Component {
  state = {
    content: '',
    saved: '',
  }

  onChange = evt => {
    this.setState({
      content: evt.target.value,
    })
    console.log('updating content')
  }

  save = () => {
    this.setState({
      saved: `Saved: ${this.state.content}`,
    })
  }

  load = () => {
    var me = this
    setTimeout(() => {
      me.setState({
        data: [{ title: 'test' }, { title: 'test2' }],
      })
    }, 3000)
  }

  render() {
    return (
      <React.Fragment>
        <label htmlFor="change">Change text</label>
        <input id="change" placeholder="change text" onChange={this.onChange} />
        <div data-testid="saved">{this.state.saved}</div>
        {this.state.data && (
          <div data-testid="data">
            {this.state.data.map(item => (
              <div data-testid="item" className="item">
                {item.title}
              </div>
            ))}
          </div>
        )}
        <div>
          <button onClick={this.save}>Save</button>
          <button onClick={this.load}>Load</button>
        </div>
      </React.Fragment>
    )
  }
}

export default Note
