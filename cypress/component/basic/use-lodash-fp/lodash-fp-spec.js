const { _ } = Cypress
const { get } = require('lodash/fp')

describe('Lodash/fp', () => {
  it('works', () => {
    const person = {
      name: 'Joe',
    }
    expect(_.get(person, 'name'), 'regular Lodash').to.equal('Joe')
    expect(get('name')(person), 'lodash/fp').to.equal('Joe')
  })
})
