import { h } from 'vue'

const storyStyle = `
  background: #f6f6ef;
  padding: 10px;
`

const linkStyle = `
  color: grey; 
  font-size: 10px;
  padding: 0 0 0 5px;
`

export const Story = {
  props: ['story'],

  setup (props) {
    const link = h('a', {
      href: props.story.url,
      class: 'hn-small',
      style: linkStyle,
    }, props.story.url)

    return () => {
      return h('div', {
        class: 'story',
        style: storyStyle,
      }, [
        `${props.story.id}. ${props.story.name}`,
        link,
      ])
    }
  },
}
