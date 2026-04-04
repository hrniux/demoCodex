import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('dock-drift');
console.log(JSON.stringify(result, null, 2));
