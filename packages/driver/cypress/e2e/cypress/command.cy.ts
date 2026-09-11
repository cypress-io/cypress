const { Command } = Cypress

describe('driver/src/cypress/command', () => {
  let command

  context('$Command', () => {
    context('._removeNonPrimitives', () => {
      before(() => {
        command = Command.create({ })
      })

      it('when args are undefined it does not remove non properties', () => {
        const args = undefined

        command._removeNonPrimitives(args)
        expect(args).to.be.undefined
      })

      it('when args is an object it filters out non-primitive properties ', () => {
        const args = ['.fake_get_selector', {
          opt1: 'option',
          opt2: {
            nested: 'hello',
          },
        }]

        command._removeNonPrimitives(args)
        expect(args).to.be.eq(args)
      })

      it('sets log to true if previously options set it to false', () => {
        const args = [{ log: false }]

        command._removeNonPrimitives(args)
        expect(args).to.have.length(1)
        expect(args[0]).to.have.property('log')
        expect(args[0].log).to.be.true
      })
    })

    context('.clone', () => {
      it('successfully clones command with arguments', () => {
        const args = ['.selector']

        command = Command.create({
          type: 'parent',
          name: 'command1',
          chainerId: 'id1',
          args,
        })

        const spy = cy.spy(command, '_removeNonPrimitives')
        let clonedCommand = command.clone()

        expect(clonedCommand).to.be.instanceOf(Command)
        expect(spy).to.have.been.calledWith(args)
        expect(clonedCommand.attributes).to.deep.eq(command.attributes)
      })

      it('successfully clones command with without arguments', () => {
        command = Command.create({
          type: 'parent',
          name: 'command1',
          chainerId: 'id1',
        })

        const spy = cy.spy(command, '_removeNonPrimitives')
        let clonedCommand = command.clone()

        expect(clonedCommand).to.be.instanceOf(Command)
        expect(spy).to.have.been.calledWith(undefined)
        expect(clonedCommand.attributes).to.deep.eq(command.attributes)
      })
    })
  })
})
