<!-- uses special loader to load i18n blocks -->
<!-- see https://github.com/intlify/vue-i18n-loader -->
<i18n>
{
  "en": {
    "hello": "hello world!"
  },
  "fa": {
    "hello": "سلام دنیا"
  },
  "ja": {
    "hello": "こんにちは、世界"
  },
  "ru": {
    "hello": "Привет мир"
  }
}
</i18n>

<template>
  <div id="app">
    <label for="locale">locale</label>
    <select v-model="locale" id="locale">
      <option>en</option>
      <option>fa</option>
      <option>ja</option>
      <option>ru</option>
    </select>
    <p>message: {{ $t('hello') }}</p>
  </div>
</template>

<script>
export default {
  name: 'TranslatedMessage',
  data () {
    return { locale: 'en' }
  },
  watch: {
    locale (val) {
      this.$i18n.locale = val
    }
  }
}
</script>
