<template>
  <div @click="changeText() && emitChangedText">
    <!-- @slot The header slot, an h1 tag by default -->
    <slot name="header"><h1>Hello World!</h1></slot>
    <button data-testid="byeButton" :key="random">
      <!-- @slot the default slot, inside of the button -->
      <slot>{{ text }}</slot>
    </button>
  </div>
</template>

<script lang="js">
  /**
   * This button is responsible for rendering an H1 tag
   * and a toggle-able button
   * */
  export default {
    props: {
      /** The "on" state -- rendered at first, before you click the button */
      helloText: { type: String, default: 'Hello' },

      /** The "off" state -- rendered after the button is clicked */
      goodbyeText: { type: String, default: 'Goodbye' }
    },
    data() {
      return {
        text: this.helloText,
        random: 0
      }
    },
    methods: {
      emitChangedText($event) {
        /**
         * Ah, the text changed event
         *
         * @event textChanged
         * @type {DocumentEvent}
         */
        this.$emit('textChanged', $event)
      },
      changeText() {
        // setTimeout(() => {
          this.text = this.text === this.helloText ? this.goodbyeText : this.helloText
        // }, 1)
      }
    },
    created() {
      // setInterval(() => {
      //   this.random = this.random + 1
      // }, 10)
    }
  }
</script>
