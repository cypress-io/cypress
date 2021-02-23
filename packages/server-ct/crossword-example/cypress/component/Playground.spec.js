import { mount } from '@cypress/vue'

describe('it works', () => {
  it('works', () => {
    const template = `
  <div id="list-demo">
  <button v-on:click="add">Add</button>
  <button v-on:click="remove">Remove</button>
  <transition-group name="list" tag="p">
    <span v-for="item in items" v-bind:key="item" class="list-item">
      {{ item }}
    </span>
  </transition-group>
</div>
  `

    const styleEl = document.createElement('style')

    styleEl.innerText = `.list-item {
  display: inline-block;
  margin-right: 10px;
}
.list-enter-active, .list-leave-active {
  transition: all 1s;
}
.list-enter, .list-leave-to /* .list-leave-active below version 2.1.8 */ {
  opacity: 0;
  transform: translateY(30px);
}`

    cy.document().then((doc) => {
      doc.head.appendChild(styleEl)
    })

    mount({
      template,
      data () {
        return {
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          nextNum: 10,
        }
      },
      methods: {
        randomIndex () {
          return Math.floor(Math.random() * this.items.length)
        },
        add () {
          this.items.splice(this.randomIndex(), 0, this.nextNum++)
        },
        remove () {
          this.items.splice(this.randomIndex(), 1)
        },
      },
    }, {
      stubs: {
        'transition-group': false,
      },
    })
  })
})
