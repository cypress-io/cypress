import { shallow } from 'enzyme'
import _ from 'lodash'
import React from 'react'
import sinon from 'sinon'

import Command, { Message } from './command'

const longText = Array(110).join('-')
const withMarkdown = '**this** is _markdown_'
const fromMarkdown = '<strong>this</strong> is <em>markdown</em>'

const model = (props) => {
  return _.extend({
    event: false,
    id: 'c1',
    displayMessage: 'The message',
    name: 'The name',
    number: 1,
    numElements: 0,
    renderProps: {},
    state: 'passed',
    type: 'parent',
    hasDuplicates: false,
    duplicates: [],
  }, props)
}

const appStateStub = (props) => {
  return _.extend({
    pinnedSnapshotId: null,
  }, props)
}
const eventsStub = () => ({ emit: sinon.spy() })
const runnablesStoreStub = () => ({
  attemptingShowSnapshot: false,
  showingSnapshot: false,
})

describe('<Command />', () => {
  context('class names', () => {
    it('renders with the type class', () => {
      const component = shallow(<Command model={model()} />)

      expect(component).to.have.className('command-type-parent')
    })

    it('renders with the name class, whitespace converted to dashes', () => {
      const component = shallow(<Command model={model()} />)

      expect(component).to.have.className('command-name-The-name')
    })

    it('renders with the state class', () => {
      const component = shallow(<Command model={model()} />)

      expect(component).to.have.className('command-state-passed')
    })

    it('renders with the is-event class when an event', () => {
      const component = shallow(<Command model={model({ event: true })} />)

      expect(component).to.have.className('command-is-event')
    })

    it('renders with the is-invisible class when not visible', () => {
      const component = shallow(<Command model={model({ visible: false })} />)

      expect(component).to.have.className('command-is-invisible')
    })

    it('renders with the has-num-elements class when it has numElements', () => {
      const component = shallow(<Command model={model({ numElements: 1 })} />)

      expect(component).to.have.className('command-has-num-elements')
    })

    it('renders with the no-elements class when numElements is 0', () => {
      const component = shallow(<Command model={model({ numElements: 0 })} />)

      expect(component).to.have.className('no-elements')
    })

    it('renders with the multiple-elements class when numElements is more than 1', () => {
      const component = shallow(<Command model={model({ numElements: 2 })} />)

      expect(component).to.have.className('multiple-elements')
    })

    it('renders with the other-pinned class when another command is pinned', () => {
      const component = shallow(<Command model={model()} appState={appStateStub({ pinnedSnapshotId: 'c2' })} />)

      expect(component).to.have.className('command-other-pinned')
    })

    it('does not render with the other-pinned class when no command is pinned', () => {
      const component = shallow(<Command model={model()} appState={appStateStub()} />)

      expect(component).not.to.have.className('command-other-pinned')
    })

    it('does not render with the other-pinned class when it itself is pinned', () => {
      const component = shallow(<Command model={model()} appState={appStateStub({ pinnedSnapshotId: 'c1' })} />)

      expect(component).not.to.have.className('command-other-pinned')
    })

    it('renders with the is-pinned class when it itself is pinned', () => {
      const component = shallow(<Command model={model()} appState={appStateStub({ pinnedSnapshotId: 'c1' })} />)

      expect(component).to.have.className('command-is-pinned')
    })

    it('renders with the with-indicator class when it has a renderProps indicator', () => {
      const component = shallow(<Command model={model({ renderProps: { indicator: 'bad' } })} />)

      expect(component).to.have.className('command-with-indicator')
    })

    it('renders with the scaled class when it has a renderProps message over 100 chars long', () => {
      const component = shallow(<Command model={model({ displayMessage: longText })} />)

      expect(component).to.have.className('command-scaled')
    })

    it('does not render with the scaled class when it has a renderProps message less than 100 chars long', () => {
      const component = shallow(<Command model={model({ renderProps: { message: 'is short' } })} />)

      expect(component).not.to.have.className('command-scaled')
    })
  })

  context('name', () => {
    it('renders the name', () => {
      const component = shallow(<Command model={model()} />)

      expect(component.find('.command-method')).to.have.text('The name')
    })

    it('renders the display name if specified', () => {
      const component = shallow(<Command model={model({ displayName: 'The displayed name' })} />)

      expect(component.find('.command-method')).to.have.text('The displayed name')
    })

    it('renders the name or display name in parentheses if an event', () => {
      const component = shallow(<Command model={model({ event: true })} />)

      expect(component.find('.command-method')).to.have.text('(The name)')
    })
  })

  context('message', () => {
    it('renders the displayMessage', () => {
      const component = shallow(<Command model={model()} />)

      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain('The message')
    })

    it('does not truncate the message when over 100 chars', () => {
      const component = shallow(<Command model={model({ displayMessage: longText })} />)

      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain(longText)
    })

    it('renders markdown', () => {
      const component = shallow(<Command model={model({ displayMessage: withMarkdown })} />)

      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain(fromMarkdown)
    })

    it('includes the renderProps indicator as a class name when specified', () => {
      const component = shallow(<Command model={model({ renderProps: { indicator: 'bad' } })} />)

      expect(component.find(Message).first().shallow().find('.bad')).to.exist
    })
  })

  context('clicking', () => {
    let appState
    let events
    let component
    let runnablesStore

    beforeEach(() => {
      appState = appStateStub()
      events = eventsStub()
      runnablesStore = runnablesStoreStub()
      component = shallow(
        <Command
          model={model()}
          events={events}
          appState={appState}
          runnablesStore={runnablesStore}
        />
      )
      component.find('FlashOnClick').simulate('click')
    })

    it('sets the pinned snapshot id to the model id', () => {
      expect(appState.pinnedSnapshotId).to.equal('c1')
    })

    it('emits the pin:snapshot event with the model id', () => {
      expect(events.emit).to.have.been.calledWith('pin:snapshot', 'c1')
    })

    it('emits show:command', () => {
      expect(events.emit).to.have.been.calledWith('show:command', 'c1')
    })

    describe('clicking pin button again', () => {
      beforeEach(() => {
        events.emit.resetHistory()
        component.find('FlashOnClick').simulate('click')
      })

      it('sets the pinned snapshot id to null', () => {
        expect(appState.pinnedSnapshotId).to.be.null
      })

      it('emits the unpin:snapshot event with the model id', () => {
        expect(events.emit).to.have.been.calledWith('unpin:snapshot', 'c1')
      })

      it('attempts to show the snapshot', () => {
        expect(runnablesStore.attemptingShowSnapshot).to.be.true
      })

      it('doesn not emit show:command', () => {
        expect(events.emit).not.to.have.been.calledWith('show:command', 'c1')
      })
    })
  })

  context('invisible indicator', () => {
    it('renders a tooltip for the invisible indicator', () => {
      const component = shallow(<Command model={model({ visible: false })} />)

      expect(component.find('Tooltip').first().find('.command-invisible')).to.exist
    })

    it('renders the invisible indicator tooltip with the right title', () => {
      const component = shallow(<Command model={model({ visible: false })} />)

      expect(component.find('Tooltip').first()).to.have.prop('title', 'This element is not visible.')
    })
  })

  context('elements', () => {
    it('renders the number of elements', () => {
      const component = shallow(<Command model={model({ numElements: 3 })} />)

      expect(component.find('.num-elements')).to.have.text('3')
    })

    it('renders a tooltip for the number of elements', () => {
      const component = shallow(<Command model={model({ numElements: 3 })} />)

      expect(component.find('Tooltip').at(1).find('.num-elements')).to.exist
    })

    it('renders the number of elements tooltip with the right title', () => {
      const component = shallow(<Command model={model({ numElements: 3 })} />)

      expect(component.find('Tooltip').at(1)).to.have.prop('title', '3 matched elements')
    })
  })

  context('other contents', () => {
    it('renders a <FlashOnClick /> around the contents', () => {
      const component = shallow(<Command model={model()} />)

      expect(component.find('FlashOnClick')).to.exist
    })

    it('the <FlashOnClick /> has a pinned snapshot and console print message', () => {
      const component = shallow(<Command model={model()} />)

      expect(component.find('FlashOnClick')).to.have.prop('message', 'Printed output to your console')
    })

    it('renders the number', () => {
      const component = shallow(<Command model={model()} />)

      expect(component.find('.command-number')).to.have.text('1')
    })
  })

  context('snapshots', () => {
    let clock
    let events
    let runnablesStore
    let command

    before(() => {
      clock = sinon.useFakeTimers()
    })

    beforeEach(() => {
      events = eventsStub()
      runnablesStore = runnablesStoreStub()
      command = shallow(<Command
        model={model()}
        events={events}
        runnablesStore={runnablesStore}
      />)
    })

    after(() => {
      clock.restore()
    })

    describe('on mouse over', () => {
      beforeEach(() => {
        command.simulate('mouseOver')
      })

      it('set attemptingShowSnapshot to true on mouse over', () => {
        expect(runnablesStore.attemptingShowSnapshot).to.be.true
      })

      describe('and 50ms passes', () => {
        beforeEach(() => {
          clock.tick(50)
        })

        it('sets showingSnapshot to true', () => {
          expect(runnablesStore.showingSnapshot).to.be.true
        })

        it('emits show:snapshot event with model id', () => {
          expect(events.emit).to.have.been.calledWith('show:snapshot', 'c1')
        })
      })

      describe('and mouse out happens', () => {
        beforeEach(() => {
          command.simulate('mouseOut')
        })

        it('sets attemptingShowSnapshot to false', () => {
          expect(runnablesStore.attemptingShowSnapshot).to.be.false
        })

        describe('and 50ms passes', () => {
          beforeEach(() => {
            clock.tick(50)
          })

          it('does not set showingSnapshot to true', () => {
            expect(runnablesStore.showingSnapshot).to.be.false
          })

          it('does not emit show:snapshot event', () => {
            expect(events.emit).not.to.have.been.called
          })
        })

        describe('and 50ms passes without another mouse over', () => {
          beforeEach(() => {
            runnablesStore.showingSnapshot = true
            clock.tick(50)
          })

          it('sets showingSnapshot to false', () => {
            expect(runnablesStore.showingSnapshot).to.be.false
          })

          it('emits hide:snapshot with model id', () => {
            expect(events.emit).to.have.been.calledWith('hide:snapshot', 'c1')
          })
        })

        describe('and 50ms passes with another mouse over', () => {
          beforeEach(() => {
            runnablesStore.showingSnapshot = true
            runnablesStore.attemptingShowSnapshot = true
            clock.tick(50)
          })

          it('does not set showingSnapshot to false', () => {
            expect(runnablesStore.showingSnapshot).to.be.true
          })

          it('does not emit hide:snapshot', () => {
            expect(events.emit).not.to.have.been.called
          })
        })
      })
    })
  })

  context('duplicates', () => {
    const withDuplicates = { hasDuplicates: true, numDuplicates: 5 }

    it('renders with command-has-duplicates class if it has duplicates', () => {
      const component = shallow(<Command model={model(withDuplicates)} />)

      expect(component).to.have.className('command-has-duplicates')
    })

    it('renders without command-has-duplicates class if no duplicates', () => {
      const component = shallow(<Command model={model()} />)

      expect(component).not.to.have.className('command-has-duplicates')
    })

    it('renders with command-is-duplicate class if it is a duplicate', () => {
      const component = shallow(<Command model={model({ isDuplicate: true })} />)

      expect(component).to.have.className('command-is-duplicate')
    })

    it('renders without command-is-duplicate class if it is not a duplicate', () => {
      const component = shallow(<Command model={model()} />)

      expect(component).not.to.have.className('command-is-duplicate')
    })

    it('num duplicates renders with has-alias class if command is an alias', () => {
      const component = shallow(<Command model={model({ alias: 'foo' })} />)

      expect(component.find('.num-duplicates')).to.have.className('has-alias')
    })

    it('num duplicates renders without has-alias class if command is not an alias', () => {
      const component = shallow(<Command model={model()} />)

      expect(component.find('.num-duplicates')).not.to.have.className('has-alias')
    })

    it('displays number of duplicates', () => {
      const component = shallow(<Command model={model({ hasDuplicates: true, numDuplicates: 5 })} />)

      expect(component.find('.num-duplicates')).to.have.text('5')
    })

    it('opens after clicking expander', () => {
      const component = shallow(<Command model={model(withDuplicates)} />)

      component.find('.command-expander').simulate('click', { stopPropagation: () => {} })
      expect(component).to.have.className('command-is-open')
    })
  })
})
