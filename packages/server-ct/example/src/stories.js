import { computed, h } from 'vue'
import { Story } from './story'

export const Stories = {
  props: ['stories', 'sortBy'],

  setup (props) {
    // alpha or popular
    if (!props.stories.length) {
      return () => h('div', { class: 'no-stories' }, 'No stories. Please check back later.')
    }

    const sortedStories = computed(() => {
      if (props.sortBy === 'popular') {
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

    return () => h('div', $stories.value)
  },
}
