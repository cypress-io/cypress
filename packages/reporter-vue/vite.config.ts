import path from "path";
import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import Layouts from "vite-plugin-vue-layouts";
import ViteIcons, { ViteIconsResolver } from "vite-plugin-icons";
import ViteFonts from "vite-plugin-fonts";
import ViteComponents from "vite-plugin-components";
import Markdown from "vite-plugin-md";
import WindiCSS from "vite-plugin-windicss";
import VueI18n from "@intlify/vite-plugin-vue-i18n";
import Prism from "markdown-it-prism";
import LinkAttributes from "markdown-it-link-attributes";

export default defineConfig({
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "src")}/`
    }
  },
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/]
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),

    // https://github.com/stafyniaksacha/vite-plugin-fonts
    ViteFonts({
      google: {
        families: [
          {
            name: "Fira Code",
            styles: "ital,wght@0,400;1,200"
          },
          {
            name: "Mulish",
            styles: "ital,wght@0,400;0,700;1,400;1,700 "
          },
          {
            name: "Source Code Pro",
            styles: "ital,wght@0,400;1,200"
          }
        ]
      }
    }),

    // https://github.com/antfu/vite-plugin-icons
    ViteIcons(),

    ViteComponents({
      customComponentResolvers: ViteIconsResolver()
    }),

    // https://github.com/antfu/vite-plugin-windicss
    WindiCSS({
      safelist: "*"
    }),
    // https://github.com/intlify/vite-plugin-vue-i18n
    VueI18n({
      include: [path.resolve(__dirname, "locales/**")]
    })
  ],

  optimizeDeps: {
    include: ["vue", "vue-router"],
    exclude: ["vue-demi"]
  }
});
