import { RunIconFragmentDoc } from '../generated/graphql-test'
import RunIcon from './RunIcon.vue'

describe('<RunIcon />', { viewportWidth: 80, viewportHeight: 200 }, () => {
  it('playground', () => {
    cy.mountFragmentList(RunIconFragmentDoc, {
      type: (ctx) => {
        return Object.values(ctx.stubCloudData.CloudRunStubs)
      },
      render: (gqlList) => (
        <div class="p-3 flex flex-col align-middle justify-center w-screen">
          {gqlList.map((gql) => (
            <>
              <RunIcon gql={gql} />
              <hr/>
            </>
          ))}
        </div>
      ),
    })
  })
})
