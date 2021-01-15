import { h, ref } from 'vue'
import { Stories } from './stories'
import { Navbar } from './navbar'

export const App = {
  props: ['stories'],

  setup (props, ctx) {
    const sortBy = ref('alpha')

    return () => {
      return h('div', [
        h(Navbar, {
          onSortBy: (sort) => {
            sortBy.value = sort
          },
        }),
        h(Stories, { stories: props.stories, sortBy: sortBy.value }),
      ])
    }
  },
}
