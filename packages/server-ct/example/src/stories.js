import { computed, h, ref } from 'vue'
import { Story } from './story'

export const Stories = {
  props: ['stories'],

  setup (props) {
    // alpha or popular
    const sortBy = ref('alpha')

    const sortByAlpha = h('button', { onClick: () => sortBy.value = 'alpha' }, 'Alphabetically')
    const sortByPop = h('button', {
      onClick: () => {
        sortBy.value = 'popular'
      },
    }, 'Popular')

    if (!props.stories.length) {
      return () => h('div', { class: 'no-stories' }, 'No stories. Please check back later.')
    }

    const sortedStories = computed(() => {
      if (sortBy.value === 'popular') {
        return props.stories.sort((x, y) => {
          return y.points < x.points ? 1 : -1
        })
      }

      return props.stories.sort((x, y) => y.name < x.name ? 1 : -1)
    })

    const $stories = computed(() => {
      return sortedStories.value.map((story, idx) => {
        return h(
          Story, {
            story: { ...story, id: idx + 1 },
            key: story.name,
            testId: idx + 1,
          },
        )
      })
    })

    return () => h('div', [sortByAlpha, sortByPop, ...$stories.value])
  },
}
