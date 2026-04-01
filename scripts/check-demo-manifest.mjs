import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = (relativePath) => readFileSync(path.join(repoRoot, relativePath), 'utf8');

function fail(message) {
  console.error(`check-demo-manifest failed: ${message}`);
  process.exitCode = 1;
}

function countHtmlFiles() {
  const ignoredDirectories = new Set(['.git', '.codex', 'node_modules', 'output']);

  const walk = (relativeDir) => {
    const absoluteDir = path.join(repoRoot, relativeDir);
    let total = 0;

    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name) || entry.name.startsWith('.')) {
          continue;
        }
        total += walk(path.join(relativeDir, entry.name));
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.html')) {
        total += 1;
      }
    }

    return total;
  };

  return walk('.');
}

function countMenuCards() {
  const scriptPath = path.join(repoRoot, 'src/js/index-menu.js');
  let script;

  try {
    script = readFileSync(scriptPath, 'utf8');
  } catch {
    fail('src/js/index-menu.js is missing from the working tree, so the menu-card check cannot run.');
    return null;
  }

  const hrefMatches = script.match(/href:\s*"[^"]+\.html"/g);
  return hrefMatches ? hrefMatches.length : 0;
}

function countFeaturedCards() {
  const scriptPath = path.join(repoRoot, 'src/js/index-menu.js');
  const script = readFileSync(scriptPath, 'utf8');
  const featuredMatches = script.match(/featured:\s*true/g);
  return featuredMatches ? featuredMatches.length : 0;
}

function parseHomepageCounts() {
  const html = readText('index.html');
  const totalMatch = html.match(/id="menu-total">\s*(\d+)\s*<\/strong>/);
  const featuredMatch = html.match(/id="menu-featured">\s*(\d+)\s*<\/strong>/);

  if (!totalMatch || !featuredMatch) {
    return null;
  }

  return {
    total: Number(totalMatch[1]),
    featured: Number(featuredMatch[1]),
  };
}

function parseReadmeCounts() {
  const readme = readText('README.md');
  const match = readme.match(
    /当前仓库包含\s*(\d+)\s*个可直接运行的 HTML 页面，其中\s*`index\.html`\s*聚合了\s*(\d+)\s*个主推作品/
  );

  if (!match) {
    return null;
  }

  return {
    htmlCount: Number(match[1]),
    homeCardCount: Number(match[2]),
  };
}

const htmlCount = countHtmlFiles();
const menuCardCount = countMenuCards();
if (menuCardCount === null) {
  process.exit(1);
}
const featuredCardCount = countFeaturedCards();
const homepageCounts = parseHomepageCounts();
const readmeCounts = parseReadmeCounts();
const problems = [];

if (!readmeCounts) {
  problems.push('README.md does not contain the expected manifest sentence.');
} else {
  if (readmeCounts.htmlCount !== htmlCount) {
    problems.push(`README HTML count ${readmeCounts.htmlCount} does not match actual count ${htmlCount}.`);
  }

  if (readmeCounts.homeCardCount !== menuCardCount) {
    problems.push(
      `README homepage card count ${readmeCounts.homeCardCount} does not match index menu card count ${menuCardCount}.`
    );
  }
}

if (!homepageCounts) {
  problems.push('index.html does not contain the expected homepage count pills.');
} else {
  if (homepageCounts.total !== menuCardCount) {
    problems.push(`Homepage total pill ${homepageCounts.total} does not match index menu card count ${menuCardCount}.`);
  }

  if (homepageCounts.featured !== featuredCardCount) {
    problems.push(
      `Homepage featured pill ${homepageCounts.featured} does not match featured card count ${featuredCardCount}.`
    );
  }
}

if (problems.length > 0) {
  fail(problems.join(' '));
} else {
  console.log(
    JSON.stringify({
      ok: true,
      htmlCount,
      menuCardCount,
      featuredCardCount,
      homepageCounts,
      readmeCounts,
    })
  );
}
