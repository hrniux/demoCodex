import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('kiln-caravan');
console.log(JSON.stringify(result, null, 2));
