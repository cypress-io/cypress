find ./ -depth -name "*spec.js" -exec sh -c 'mv "$1" "${1%spec.js}cy.js"' _ {} \;
find ./ -depth -name "*spec.ts" -exec sh -c 'mv "$1" "${1%spec.ts}cy.ts"' _ {} \;
find ./ -depth -name "*spec.jsx" -exec sh -c 'mv "$1" "${1%spec.jsx}cy.jsx"' _ {} \;
find ./ -depth -name "*spec.tsx" -exec sh -c 'mv "$1" "${1%spec.tsx}cy.tsx"' _ {} \;
