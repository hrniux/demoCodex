import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('pixel-orchard');
console.log(JSON.stringify(result, null, 2));
