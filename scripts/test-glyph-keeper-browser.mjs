import { runNamedGridArcadeBrowserTest } from './grid-arcade-browser-presets.mjs';

const result = await runNamedGridArcadeBrowserTest('glyph-keeper');
console.log(JSON.stringify(result, null, 2));
