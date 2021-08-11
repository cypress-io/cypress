import { ref } from 'vue'
import SideBarItem from './SideBarItem.vue'
import IconCoffee from 'virtual:vite-icons/mdi/coffee'

describe('<SideBarItem />', { viewportWidth: 200, viewportHeight: 150 }, () => {
  it('playground', () => {
    const active = ref(0)
    const onClick = (value) => {
      if (active.value === value) {
        active.value = -1

        return
      }

      active.value = value
    }

    cy.mount(() => (
      <div class="m-10px w-140px border">
        <SideBarItem
          onClick={() => onClick(0)}
          active={active.value === 0}
          icon={IconCoffee}
        />
        <SideBarItem
          onClick={() => onClick(1)}
          icon={IconCoffee}
          active={active.value === 1}
        />
      </div>
    ))
  })
})
