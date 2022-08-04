import { mount } from 'cypress/react'
import { Wrapper, Title } from './styled'

describe('styled components', () => {
  it('works', () => {
    mount(
      <Wrapper>
        <Title>Hello World, this is my first styled component!</Title>
      </Wrapper>
    )
  })
})