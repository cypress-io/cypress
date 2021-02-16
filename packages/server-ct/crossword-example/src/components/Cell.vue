<template>
  <span class="cell" data-testid="cell" :class="classes">
    <input type="text"
           data-testid="cell-input"
           :value="showLetter ? letter : value"
           :disabled="showLetter || blockedOut"
           autocomplete="false"
           ref="input"
           @beforeinput.prevent="filterManyLetters"
           @input="filterManyLetters"
    >
    <span/>
    <span class="number" data-testid="cell-number">
      {{ number !== 0 ? number : '' }}
    </span>
  </span>
</template>

<script>
  export default {
    props: {
      showLetter: { type: Boolean, default: false },
      editable: { type: Boolean, default: true },
      blockedOut: { type: Boolean, default: false },
      letter: { type: String, default: '' },
      number: { type: [String, Number], optional: true , default: ''},
      initialValue: { type: String, required: false, default: '' },
    },
    data() {
      return {
        value: this.initialValue
      }
    },
    methods: {
      filterManyLetters(e) {
        if (e.data == null) {
          this.value = '';
          return;
        }
        this.value = e.data[0]
      },
      focus() {
        this.$refs.input.focus()
      }
    },
    computed: {
      classes() {
        return this.blockedOut ? 'blocked-out' : ''
      }
    },
    watch: {
      value(newValue) {
        this.$emit('input', newValue)
      }
    },
  }
</script>

<style lang="scss" scoped>
  $cellSize: calc(2rem * var(--scale, 1));

  input {
    text-transform: uppercase;
    width: $cellSize;
    height: $cellSize;
    display: block;
    text-align: center;
    font-size: unset;
    font-family: unset;
    border: none;
    outline: none;
    box-shadow: none
  }

  .cell.blocked-out input {
    color: transparent;
    background: black;
  }

  .cell input:focus-within + span {
    color: deeppink;
    @media all and (-webkit-min-device-pixel-ratio:0) and (min-resolution: .001dpcm) {
      &:before {
        width: $cellSize;
        height: $cellSize;
      }
    }

    &:before {
      position: absolute;
      content: '';
      left: 0;
      top: 0;

      z-index: 0;

      width: -webkit-fill-available;
      height: -webkit-fill-available;

      box-shadow: 0 0 0 3px deeppink inset;
    }
  }
</style>

<style lang="scss" src="./crossword.scss"></style>

<style lang="scss" scoped>
  @media print {
    // Cell Overrides
    .cell {
      border: 1px solid black;
      box-shadow: none;
      background: white;
      -webkit-print-color-adjust: exact !important;

      span:first-of-type {
        display: none;
      }
    }
  }

</style>
