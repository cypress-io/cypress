import { RunIconFragmentDoc } from '../generated/graphql-test'
import RunIcon from './RunIcon.vue'

describe('<RunIcon />', { viewportWidth: 80, viewportHeight: 200 }, () => {
  it('playground', () => {
    cy.mountFragmentList(RunIconFragmentDoc, {
      type: (ctx) => {
        return []
      },
      render: (gqlList) => (
        <div class="p-3 flex flex-col align-middle justify-center w-screen">
          <RunIcon gql={gqlList[0]} />
          <hr/>
          <RunIcon gql={gqlList[1]} />
          <hr/>
          <RunIcon gql={gqlList[2]} />
        </div>
      ),
    })
  })
})
