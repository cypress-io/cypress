import { shallow } from 'enzyme'
import _ from 'lodash'
import React from 'react'
import sinon from 'sinon'

import Command, { Aliases, Message } from './command'

const longText = Array(110).join('-')
const withMarkdown = '**this** is _markdown_'
const fromMarkdown = '<strong>this</strong> is <em>markdown</em>'

const model = (props) => {
  return _.extend({
    event: false,
    id: 'c1',
    message: 'The message',
    name: 'The name',
    number: 1,
    numElements: 0,
    renderProps: {},
    state: 'passed',
    type: 'parent',
  }, props)
}

const eventsStub = () => ({ emit: sinon.spy() })
const runnablesStoreStub = () => ({
  attemptingShowSnapshot: false,
  showingSnapshot: false,
})

describe('<Command />', () => {
  it('emits show:command when clicking on command', () => {
    const events = eventsStub()
    const component = shallow(<Command model={model()} events={events} />)
    component.find('FlashOnClick').simulate('click')
    expect(events.emit).to.have.been.calledWith('show:command', 'c1')
  })

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

    it('renders with the has-no-elements class when numElements is 0', () => {
      const component = shallow(<Command model={model({ numElements: 0 })} />)
      expect(component).to.have.className('command-has-no-elements')
    })

    it('renders with the has-multiple-elements class when numElements is more than 1', () => {
      const component = shallow(<Command model={model({ numElements: 2 })} />)
      expect(component).to.have.className('command-has-multiple-elements')
    })

    it('renders with the with-indicator class when it has a renderProps indicator', () => {
      const component = shallow(<Command model={model({ renderProps: { indicator: 'bad' } })} />)
      expect(component).to.have.className('command-with-indicator')
    })

    it('renders with the scaled class when it has a renderProps message over 100 chars long', () => {
      const component = shallow(<Command model={model({ renderProps: { message: longText } })} />)
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
    it('renders the message', () => {
      const component = shallow(<Command model={model()} />)
      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain('The message')
    })

    it('truncates the message when over 100 chars', () => {
      const component = shallow(<Command model={model({ message: longText })} />)
      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain(_.truncate(longText, 100))
    })

    it('renders the renderProps message when specified', () => {
      const component = shallow(<Command model={model({ renderProps: { message: 'The display message' } })} />)
      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain('The display message')
    })

    it('does not truncate the renderProps message when over 100 chars', () => {
      const component = shallow(<Command model={model({ renderProps: { message: longText } })} />)
      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain(longText)
    })

    it('renders markdown in message', () => {
      const component = shallow(<Command model={model({ message: withMarkdown })} />)
      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain(fromMarkdown)
    })

    it('renders markdown in renderProps message', () => {
      const component = shallow(<Command model={model({ renderProps: { message: withMarkdown } })} />)
      expect(component.find(Message).first().shallow().find('.command-message-text').html()).to.contain(fromMarkdown)
    })

    it('includes the renderProps indicator as a class name when specified', () => {
      const component = shallow(<Command model={model({ renderProps: { indicator: 'bad' } })} />)
      expect(component.find(Message).first().shallow().find('.bad')).to.exist
    })
  })

  context('alias', () => {
    context('message', () => {
      let aliases

      beforeEach(() => {
        aliases = shallow(<Command model={model({ referencesAlias: ['barAlias', 'bazAlias'], aliasType: 'dom' })} />).find(Aliases).shallow()
      })

      it('renders the aliases for each one it references', () => {
        expect(aliases.find('.command-alias').length).to.equal(2)
      })

      it('renders the aliases with the right class', () => {
        expect(aliases.find('.command-alias').first()).to.have.className('dom')
      })

      it('renders the aliases in the right format', () => {
        expect(aliases.find('.command-alias').first()).to.have.text('@barAlias')
        expect(aliases.find('.command-alias').last()).to.have.text('@bazAlias')
      })

      it('renders tooltip for each alias it references', () => {
        expect(aliases.find('Tooltip').length).to.equal(2)
      })

      it('renders the right tooltip title for each alias it references', () => {
        const tooltips = aliases.find('Tooltip')
        expect(tooltips.first()).to.have.prop('title', "Found an alias for: 'barAlias'")
        expect(tooltips.last()).to.have.prop('title', "Found an alias for: 'bazAlias'")
      })
    })

    context('control', () => {
      it('renders the alias when it has an alias', () => {
        const component = shallow(<Command model={model({ alias: 'fooAlias' })} />)
        expect(component.find('.command-alias')).to.have.text('fooAlias')
      })

      it('renders the alias with the alias type as a class', () => {
        const component = shallow(<Command model={model({ alias: 'fooAlias', aliasType: 'dom' })} />)
        expect(component.find('.command-alias')).to.have.className('dom')
      })

      it('renders a tooltip for the alias', () => {
        const component = shallow(<Command model={model()} />)
        expect(component.find('Tooltip').first().find('.command-alias')).to.exist
      })

      it('renders the alias tooltip with the right title', () => {
        const component = shallow(<Command model={model({ alias: 'fooAlias' })} />)
        expect(component.find('Tooltip').first()).to.have.prop('title', "The message aliased as: 'fooAlias'")
      })
    })
  })

  context('invisible indicator', () => {
    it('renders a tooltip for the invisible indicator', () => {
      const component = shallow(<Command model={model({ visible: false })} />)
      expect(component.find('Tooltip').at(1).find('.command-invisible')).to.exist
    })

    it('renders the invisible indicator tooltip with the right title', () => {
      const component = shallow(<Command model={model({ visible: false })} />)
      expect(component.find('Tooltip').at(1)).to.have.prop('title', 'This element is not visible.')
    })
  })

  context('elements', () => {
    it('renders the number of elements', () => {
      const component = shallow(<Command model={model({ numElements: 3 })} />)
      expect(component.find('.command-num-elements')).to.have.text('3')
    })

    it('renders a tooltip for the number of elements', () => {
      const component = shallow(<Command model={model({ numElements: 3 })} />)
      expect(component.find('Tooltip').at(2).find('.command-num-elements')).to.exist
    })

    it('renders the number of elements tooltip with the right title', () => {
      const component = shallow(<Command model={model({ numElements: 3 })} />)
      expect(component.find('Tooltip').at(2)).to.have.prop('title', '3 matched elements')
    })
  })

  context('other contents', () => {
    it('renders a <FlashOnClick /> around the contents', () => {
      const component = shallow(<Command model={model()} />)
      expect(component.find('FlashOnClick')).to.exist
    })

    it('the <FlashOnClick /> has a console print message', () => {
      const component = shallow(<Command model={model()} />)
      expect(component.find('FlashOnClick')).to.have.prop('message', 'Printed output to your console!')
    })

    it('renders the number', () => {
      const component = shallow(<Command model={model()} />)
      expect(component.find('.command-number')).to.have.text('1')
    })
  })

  context.only('snapshots', () => {
    let clock
    let events
    let runnablesStore
    let commandWrapper

    before(() => {
      clock = sinon.useFakeTimers()
    })

    beforeEach(() => {
      events = eventsStub()
      runnablesStore = runnablesStoreStub()
      commandWrapper = shallow(<Command
        model={model()}
        events={events}
        runnablesStore={runnablesStore}
      />).find('.command-wrapper').first()
    })

    after(() => {
      clock.restore()
    })

    describe('on mouse over', () => {
      beforeEach(() => {
        commandWrapper.simulate('mouseOver')
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
          commandWrapper.simulate('mouseOut')
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
})
