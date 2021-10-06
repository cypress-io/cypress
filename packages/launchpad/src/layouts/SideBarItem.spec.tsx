import SideBarItem from './SideBarItem.vue'
import IconCoffee from '~icons/mdi/coffee'
import { SideBarItemFragmentDoc } from '../generated/graphql-test'

describe('<SideBarItem />', { viewportWidth: 200, viewportHeight: 150 }, () => {
  it('playground', () => {
    const onClick = (value) => {
      // TODO: trigger the ctx update
    }

    cy.mountFragmentList(SideBarItemFragmentDoc, {
      type: (ctx) => ctx.stubNavigationMenu.items,
      render: (gqlArr) => (
        <div class="m-10px w-140px border">
          <SideBarItem
            onClick={() => onClick(0)}
            gql={gqlArr[0]}
            icon={IconCoffee}
          />
          <SideBarItem
            onClick={() => onClick(1)}
            icon={IconCoffee}
            gql={gqlArr[1]}
          />
        </div>
      ),
    })
  })
})
