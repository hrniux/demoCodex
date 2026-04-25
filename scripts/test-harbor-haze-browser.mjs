import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('harbor-haze');
console.log(JSON.stringify(result, null, 2));
