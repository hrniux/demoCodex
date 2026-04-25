import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('crystal-conduit');
console.log(JSON.stringify(result, null, 2));
