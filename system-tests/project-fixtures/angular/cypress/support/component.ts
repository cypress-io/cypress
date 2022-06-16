import "zone.js";

/**
 * @hack fixes "Mocha has already been patched with Zone" error.
 */
// @ts-ignore
global.Mocha["__zone_patch__"] = false;

import "zone.js/testing";
