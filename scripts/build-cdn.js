#!/usr/bin/env node
/**
 * Build UMD min bundle and stage CDN-ready artifacts under packages/web-sdk/cdn/
 *
 * Output layout (upload cdn/ to your CDN origin, e.g. cdn.tappd.io):
 *   web-sdk/v1/tappd-sdk.min.js          — latest v1 line (mutable alias)
 *   web-sdk/v1/tappd-sdk.min.js.map
 *   web-sdk/1.0.5/tappd-sdk.min.js       — immutable version pin
 *   web-sdk/1.0.5/tappd-sdk.min.js.map
 *   manifest.json
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pkgRoot = path.resolve(__dirname, '..');
const pkg = require(path.join(pkgRoot, 'package.json'));
const version = pkg.version;
const CDN_BASE = process.env.TAPPD_CDN_BASE || 'https://cdn.tappd.io';

const distMin = path.join(pkgRoot, 'dist', 'tappd-sdk.min.js');
const distMap = path.join(pkgRoot, 'dist', 'tappd-sdk.min.js.map');
const cdnRoot = path.join(pkgRoot, 'cdn');

function sha384Base64(filePath) {
  const buf = fs.readFileSync(filePath);
  return 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
}

function copyBundle(destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(distMin, path.join(destDir, 'tappd-sdk.min.js'));
  if (fs.existsSync(distMap)) {
    fs.copyFileSync(distMap, path.join(destDir, 'tappd-sdk.min.js.map'));
  }
}

console.log(`Building @tappd/web-sdk@${version} CDN bundle…`);
execSync('npm run build:umd', { cwd: pkgRoot, stdio: 'inherit' });

if (!fs.existsSync(distMin)) {
  console.error('Missing dist/tappd-sdk.min.js — webpack build failed');
  process.exit(1);
}

const stat = fs.statSync(distMin);
const integrity = sha384Base64(distMin);

const targets = [
  path.join(cdnRoot, 'web-sdk', 'v1'),
  path.join(cdnRoot, 'web-sdk', version),
];

for (const dir of targets) {
  copyBundle(dir);
  console.log('  →', path.relative(pkgRoot, dir) + '/tappd-sdk.min.js');
}

const latestUrl = `${CDN_BASE}/web-sdk/v1/tappd-sdk.min.js`;
const versionedUrl = `${CDN_BASE}/web-sdk/${version}/tappd-sdk.min.js`;

const manifest = {
  name: '@tappd/web-sdk',
  version,
  builtAt: new Date().toISOString(),
  cdnBase: CDN_BASE,
  files: {
    'tappd-sdk.min.js': {
      bytes: stat.size,
      integrity,
      urls: {
        latest: latestUrl,
        versioned: versionedUrl,
      },
    },
  },
  usage: {
    script: `<script src="${latestUrl}" integrity="${integrity}" crossorigin="anonymous"></script>`,
    init: `const tappd = new TappdSDK.TappdSDK({ appId: 'YOUR_APP_ID', apiUrl: 'https://sdk.tappd.io/api/v1/sdk' });`,
  },
};

fs.mkdirSync(cdnRoot, { recursive: true });
fs.writeFileSync(path.join(cdnRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log('');
console.log(`CDN bundle ready (${(stat.size / 1024).toFixed(1)} KB minified)`);
console.log(`  Latest:    ${latestUrl}`);
console.log(`  Versioned: ${versionedUrl}`);
console.log(`  Manifest:  ${path.relative(pkgRoot, path.join(cdnRoot, 'manifest.json'))}`);
console.log(`  SRI:       ${integrity}`);
