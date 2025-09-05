# Theme folder for shiki

The theme here is meant to be generated

## To Transform

To transform `cypress.theme.template.json` into `cypress.theme.json` use the command `yarn generate-shiki-theme`.
This command is run as part of the build process and should not need to be run manually unless you are changing the template.

## How the template works

In the template, the colors are called by their name in Tailwind prefixed by a dash.

For example if you have `-jade-500` in the template, it will be replaced by `#00814D`, Jade 500 in the generated theme. 

All colors from the theme are available