import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`check-demo-manifest failed: ${message}`);
  process.exitCode = 1;
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function readText(rootPath, relativePath) {
  return readFileSync(path.join(rootPath, relativePath), 'utf8');
}

function listHtmlFiles(rootPath = repoRoot) {
  const ignoredDirectories = new Set(['.git', '.codex', 'node_modules', 'output']);

  const walk = (relativeDir) => {
    const absoluteDir = path.join(rootPath, relativeDir);
    const files = [];

    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name) || entry.name.startsWith('.')) {
          continue;
        }
        files.push(...walk(path.join(relativeDir, entry.name)));
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(normalizeRelativePath(path.join(relativeDir, entry.name)));
      }
    }

    return files;
  };

  return walk('.');
}

export function parseMenuTargets(scriptText) {
  return [...scriptText.matchAll(/href:\s*"([^"]+\.html)"/g)].map((match) => match[1]);
}

export function findMissingTargets(targets, existingPaths) {
  const missing = [];
  const seen = new Set();

  for (const target of targets) {
    if (existingPaths.has(target) || seen.has(target)) {
      continue;
    }

    seen.add(target);
    missing.push(target);
  }

  return missing;
}

export function parseSpotlightHref(htmlText) {
  const directMatch = htmlText.match(/<a[^>]*id="menu-spotlight-link"[^>]*href="([^"]+)"/);
  if (directMatch) {
    return directMatch[1];
  }

  const reverseMatch = htmlText.match(/<a[^>]*href="([^"]+)"[^>]*id="menu-spotlight-link"/);
  return reverseMatch ? reverseMatch[1] : null;
}

function countFeaturedCards(scriptText) {
  const featuredMatches = scriptText.match(/featured:\s*true/g);
  return featuredMatches ? featuredMatches.length : 0;
}

function parseHomepageCounts(htmlText) {
  const totalMatch = htmlText.match(/id="menu-total">\s*(\d+)\s*<\/strong>/);
  const featuredMatch = htmlText.match(/id="menu-featured">\s*(\d+)\s*<\/strong>/);

  if (!totalMatch || !featuredMatch) {
    return null;
  }

  return {
      total: Number(totalMatch[1]),
      featured: Number(featuredMatch[1]),
    };
}

function parseReadmeCounts(readmeText) {
  const match = readmeText.match(
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

function readManifestSources(rootPath) {
  try {
    return {
      indexHtml: readText(rootPath, 'index.html'),
      indexMenu: readText(rootPath, 'src/js/index-menu.js'),
      readme: readText(rootPath, 'README.md'),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

export function buildManifestReport(rootPath = repoRoot) {
  const { indexHtml, indexMenu, readme } = readManifestSources(rootPath);
  const htmlFiles = listHtmlFiles(rootPath);
  const htmlFileSet = new Set(htmlFiles);
  const menuTargets = parseMenuTargets(indexMenu);
  const htmlCount = htmlFiles.length;
  const menuCardCount = menuTargets.length;
  const featuredCardCount = countFeaturedCards(indexMenu);
  const homepageCounts = parseHomepageCounts(indexHtml);
  const readmeCounts = parseReadmeCounts(readme);
  const spotlightHref = parseSpotlightHref(indexHtml);
  const missingMenuTargets = findMissingTargets(menuTargets, htmlFileSet);
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

  if (missingMenuTargets.length > 0) {
    problems.push(`Index menu contains missing HTML targets: ${missingMenuTargets.join(', ')}.`);
  }

  if (!spotlightHref) {
    problems.push('index.html does not contain the expected spotlight link.');
  } else {
    if (!htmlFileSet.has(spotlightHref)) {
      problems.push(`Homepage spotlight target ${spotlightHref} does not exist in the repository.`);
    }

    if (!menuTargets.includes(spotlightHref)) {
      problems.push(`Homepage spotlight target ${spotlightHref} is not present in src/js/index-menu.js cards.`);
    }
  }

  return {
    ok: problems.length === 0,
    htmlCount,
    menuCardCount,
    featuredCardCount,
    homepageCounts,
    readmeCounts,
    menuTargets,
    uniqueMenuTargetCount: new Set(menuTargets).size,
    missingMenuTargets,
    spotlightHref,
    problems,
  };
}

function main() {
  const report = buildManifestReport();

  if (report.problems.length > 0) {
    fail(report.problems.join(' '));
    return;
  }

  console.log(
    JSON.stringify({
      ok: true,
      htmlCount: report.htmlCount,
      menuCardCount: report.menuCardCount,
      featuredCardCount: report.featuredCardCount,
      homepageCounts: report.homepageCounts,
      readmeCounts: report.readmeCounts,
      uniqueMenuTargetCount: report.uniqueMenuTargetCount,
      spotlightHref: report.spotlightHref,
      missingMenuTargets: report.missingMenuTargets,
    })
  );
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (entryFile === currentFile) {
  main();
}
