#!/usr/bin/env node

import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';
const WHITE = '\x1b[97m';

const SYMBOLS = {
  Server: `${MAGENTA}\u0192${RESET}`,
  Client: `${CYAN}\u25CB${RESET}`,
  Prerender: `${GREEN}\u25CF${RESET}`,
};

const MODE_LABELS = {
  Server: `${MAGENTA}SSR${RESET}`,
  Client: `${CYAN}CSR${RESET}`,
  Prerender: `${GREEN}SSG${RESET}`,
};

function parseServerRoutes() {
  const src = readFileSync('src/app/app.routes.server.ts', 'utf-8');
  const rules = [];
  const regex = /path:\s*'([^']*)',\s*renderMode:\s*RenderMode\.(\w+)/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    rules.push({ pattern: m[1], mode: m[2] });
  }
  return rules;
}

function parseAppRoutes() {
  const src = readFileSync('src/app/app.routes.ts', 'utf-8');
  const routes = [];
  const lines = src.split('\n');
  let currentParent = '';
  let inChildren = false;
  let bracketDepth = 0;
  let childrenLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inChildren && i > childrenLine) {
      for (const ch of line) {
        if (ch === '[') bracketDepth++;
        if (ch === ']') bracketDepth--;
      }
      if (bracketDepth <= 0) {
        inChildren = false;
        currentParent = '';
      }
    }

    const pathMatch = trimmed.match(/^path:\s*'([^']*)'/);
    if (!pathMatch) continue;

    const pathValue = pathMatch[1];

    let isRedirect = false;
    for (let j = i; j <= Math.min(i + 3, lines.length - 1); j++) {
      const checkLine = lines[j].trim();
      if (checkLine.includes('redirectTo')) { isRedirect = true; break; }
      if (j > i && (checkLine === '},' || checkLine === '}')) break;
    }
    if (isRedirect) continue;

    if (inChildren) {
      routes.push(`/${currentParent}/${pathValue}`);
    } else {
      const fullPath = pathValue === '' ? '/'
        : pathValue === '**' ? '/**'
        : `/${pathValue}`;
      routes.push(fullPath);
      currentParent = pathValue;
    }

    if (!inChildren) {
      for (let j = i + 1; j <= Math.min(i + 15, lines.length - 1); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.includes('children:')) {
          inChildren = true;
          childrenLine = j;
          bracketDepth = 0;
          for (const ch of lines[j]) {
            if (ch === '[') bracketDepth++;
            if (ch === ']') bracketDepth--;
          }
          break;
        }
        if (nextLine === '},' || nextLine === '}') break;
      }
    }
  }

  return routes;
}

function getRenderMode(routePath, serverRules) {
  const pathWithoutSlash = routePath.startsWith('/') ? routePath.slice(1) : routePath;

  for (const rule of serverRules) {
    if (rule.pattern === '**') continue;

    if (rule.pattern.endsWith('/**')) {
      const prefix = rule.pattern.slice(0, -3);
      if (pathWithoutSlash === prefix || pathWithoutSlash.startsWith(prefix + '/')) {
        return rule.mode;
      }
    } else {
      if (pathWithoutSlash === rule.pattern) {
        return rule.mode;
      }
    }
  }

  const fallback = serverRules.find(r => r.pattern === '**');
  return fallback ? fallback.mode : 'Server';
}

function getDirSize(dir) {
  let total = 0;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) total += getDirSize(full);
      else total += statSync(full).size;
    }
  } catch { /* ignore */ }
  return total;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const serverRules = parseServerRoutes();
const routes = parseAppRoutes();

const routeData = routes.map(r => ({
  path: r,
  mode: getRenderMode(r, serverRules),
}));

const counts = { Server: 0, Client: 0, Prerender: 0 };
routeData.forEach(r => { counts[r.mode] = (counts[r.mode] || 0) + 1; });

const maxPathLen = Math.max(...routeData.map(r => r.path.length), 5);
const padPath = (s) => s.padEnd(maxPathLen + 4);

const browserSize = getDirSize('dist/journal-nordicuniversity-org/browser');
const serverSize = getDirSize('dist/journal-nordicuniversity-org/server');

console.log('');
console.log(`${BOLD}${WHITE}  Route (journal-nordicuniversity-org)${' '.repeat(Math.max(0, maxPathLen - 34))}Mode${RESET}`);
console.log(`  ${GRAY}${'─'.repeat(maxPathLen + 10)}${RESET}`);

routeData.forEach((r, i) => {
  const isLast = i === routeData.length - 1;
  const connector = isLast ? '\u2514' : '\u251C';
  const symbol = SYMBOLS[r.mode] || '?';
  const modeLabel = MODE_LABELS[r.mode] || r.mode;
  console.log(`  ${GRAY}${connector}${RESET} ${symbol} ${padPath(r.path)}${modeLabel}`);
});

console.log('');

if (browserSize > 0) {
  console.log(`  ${DIM}Output:${RESET}  ${WHITE}browser/${RESET} ${formatSize(browserSize)}  ${GRAY}|${RESET}  ${WHITE}server/${RESET} ${formatSize(serverSize)}`);
}

console.log('');

if (counts.Server > 0) {
  console.log(`  ${SYMBOLS.Server}  Server    ${DIM}(SSR)${RESET}  ${GRAY}server-rendered at runtime${RESET}       ${DIM}${counts.Server} routes${RESET}`);
}
if (counts.Client > 0) {
  console.log(`  ${SYMBOLS.Client}  Client    ${DIM}(CSR)${RESET}  ${GRAY}rendered on client side${RESET}          ${DIM}${counts.Client} routes${RESET}`);
}
if (counts.Prerender > 0) {
  console.log(`  ${SYMBOLS.Prerender}  Prerender ${DIM}(SSG)${RESET}  ${GRAY}pre-rendered at build time${RESET}       ${DIM}${counts.Prerender} routes${RESET}`);
}

console.log('');
