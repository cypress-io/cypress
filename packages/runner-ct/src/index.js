import '@packages/runner/src/main.scss'

// in CI we want to continue to use the full (legacy) runner-ct instead of main-lite
// main-lite does not import everything, but until we get run mode working with the
// new unification code, we need CI to use the legacy runner-ct
// new DefinePlugin({ WEBPACK_MAIN_ENTRY: process.env.CI ? './main' : './main-lite' }),
//
/// #if process.env.CI
import './main'
/// #else
import './main-lite'
/// #endif
