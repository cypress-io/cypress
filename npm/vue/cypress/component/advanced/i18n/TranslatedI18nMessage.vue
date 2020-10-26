<!-- uses special loader to load i18n blocks -->
<!-- see https://github.com/intlify/vue-i18n-loader -->
<!-- You can also inline the translations like <i18n>{...}</i18n> -->
<i18n src="./translations.json"/>

<template>
  <div id="app">
    <label for="locale">locale</label>
    <select v-model="$i18n.locale" id="locale">
      <option v-for="locale in $i18n.availableLocales" :key="locale">
        {{ locale }}
      </option>
    </select>
    <p>message: {{ $t('hello') }}</p>
  </div>
</template>