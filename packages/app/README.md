## App

This is the front-end for the Cypress App.

## Development

1. Use existing project to get a server (for example `cd packages/runner-ct && yarn cypress:open`)
2. It will open in a new browser on port 8080
3. Do `yarn start`. It will start the front-end for the new Cypress app 
4. To back to the browser opened in step 2
5. Visit http://localhost:8080/__vite__/ for the new front-end powered by Vite (currently running the RunnerCt)

### Icons

The icons will temporarily live in this package and will soon be moved to `packages/frontend-shared`.

## Cy's New Icon Library
Cy has a very custom icon library.
* Most of our icons are duo-tone
* They must be styled in both dark and light contexts (e.g. on a dark menu bar vs on a light background).
* Since they're duotone, you want to target the specific strokes and fills of the SVGs to color them.
* All of the niceties of our utility classes should work (e.g. `group-hover` or `group-focus`).

### Usage
#### Importing Icons
1. `import MyIcon from '~icons/cy/path-to-icon_x16'`
2. Automatic template discovery
```jsx
/* This just works. No imports necessary */
<i-cy-path-to-icon_x16 />
```

#### Styling Icons
```jsx
/* This renders a book icon from `./src/assets/book_x16.svg`
 * and makes it pink and purple
 */

<i-cy-book_x16 class="
  hover:icon-dark-pink-500
  hover:icon-light-purple-300
  icon-dark-pink-300
  icon-dark-purple-50
" />
```

### Implementation: Custom classes w/ a WindiCSS plugin
To support selecting specific paths while keeping tailwind's incredibly helpful interaction helpers (e.g. `group-hover` or `group-focus`), I made a WindiCSS plugin.

I also moved the Windi config into a `.windicss` directory at the root of the App directory.

#### Rules of Icons
For an icon to work well in the current system, here's what needs to happen when we import it:

1. Icon paths must define themselves as "icon-dark" or "icon-light" in their class names.
If an icon path doesn't define a class, nothing bad will happen, it just won't get targeted by any styling.

2. Icons with both a stroke and a fill aren't working correctly right now. They will soon.
You can see this in the video with the Settings cog. It uses and `evenodd` fill pattern and has a path that contains both a stroke and a fill.

3. Finally, you don't need to expose anything. `./src/assets/icons` is automatically watched and loaded 😮

## Diagram

![](./unified-runner-diagram.png)]
