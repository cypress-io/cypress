import { objectType } from 'nexus'

export const AutInspectA11yNode = objectType({
  name: 'AutInspectA11yNode',
  description: 'One node in the AUT accessibility tree. `selector` targets the underlying element and can be passed to `autInspectDom` for deeper inspection.',
  definition (t) {
    t.nonNull.string('role', {
      description: 'ARIA role — explicit `role` attribute, or the implicit role for the tag (e.g. `h1` → `heading`, `nav` → `navigation`).',
    })

    t.string('name', {
      description: 'Computed accessible name (aria-label, aria-labelledby, img alt, label text, or textContent for roles that take their name from content). Truncated to 200 chars.',
    })

    t.int('level', {
      description: 'Heading level (1–6). Null for non-heading roles.',
    })

    t.string('value', {
      description: 'Current value for form controls (text inputs, textareas). Null otherwise. Truncated to 200 chars.',
    })

    t.boolean('checked', {
      description: 'Checked state for `checkbox` / `radio` roles. Null for other roles.',
    })

    t.boolean('disabled', {
      description: 'Disabled state (`disabled` attribute or `aria-disabled="true"`). Null when not a form-control-like role.',
    })

    t.nonNull.string('selector', {
      description: 'Unique CSS selector for the element — `#id` / `[data-testid]` / `[data-cy]` when unique, otherwise a positional `nth-of-type` path from `<html>`.',
    })

    t.nonNull.list.nonNull.field('children', {
      type: 'AutInspectA11yNode',
      description: 'Nested accessibility nodes, in document order. Purely-layout elements are collapsed.',
    })
  },
})
