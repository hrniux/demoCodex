import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('cinder-canal');
console.log(JSON.stringify(result, null, 2));
