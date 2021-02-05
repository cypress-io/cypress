export default {
  data () {
    return {
      count: 0,
    }
  },
  methods: {
    inc () {
      this.count += 1
    },
  },
  render (h) {
    const btn = h('button', {
      on: {
        click: this.inc,
      },
    }, 'Increment')
    const display = h('h3', {}, `Count is: ${this.count}`)

    return h('div', [btn, display])
  },
}
