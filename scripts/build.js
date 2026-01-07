#!/usr/bin/env node
/**
 * Consent Guardian - Build Script
 *
 * Baut die Extension für Chrome, Firefox oder Safari.
 * Usage: node scripts/build.js [chrome|firefox|safari|all]
 *
 * @author Guido Mitschke
 * @copyright (c) 2025-2026 Today is Life GmbH
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const MANIFESTS = path.join(ROOT, 'manifests');

// Dateien die kopiert werden sollen
const FILES_TO_COPY = [
  // Lib
  'lib/browser-api.js',
  'lib/storage.js',
  'lib/tracker-db.js',
  'lib/i18n.js',

  // Content Scripts
  'content-scripts/banner-detector.js',
  'content-scripts/dark-pattern-analyzer.js',
  'content-scripts/consent-observer.js',
  'content-scripts/gdpr-link-finder.js',
  'content-scripts/main.js',

  // Background
  'background/background.js',

  // Popup
  'popup/popup.html',
  'popup/popup.js',

  // Dashboard
  'dashboard/index.html',
  'dashboard/dashboard.js',

  // Styles (compiled)
  'styles/output.css'
];

// Ordner die kopiert werden sollen
const DIRS_TO_COPY = [
  'icons',
  '_locales'
];

/**
 * Erstellt ein Verzeichnis rekursiv
 */
function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Kopiert eine Datei
 */
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  mkdirp(destDir);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

/**
 * Kopiert einen Ordner rekursiv
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️  Ordner nicht gefunden: ${src}`);
    return;
  }

  mkdirp(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Löscht einen Ordner rekursiv
 */
function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Baut die Extension für einen Browser
 */
function buildForBrowser(browser) {
  console.log(`\n🔨 Baue Extension für ${browser}...`);

  const distDir = path.join(DIST, browser);

  // Clean
  console.log('  🗑️  Lösche alten Build...');
  rmrf(distDir);
  mkdirp(distDir);

  // Manifest kopieren
  console.log('  📄 Kopiere Manifest...');
  const manifestSrc = path.join(MANIFESTS, browser, 'manifest.json');
  const manifestDest = path.join(distDir, 'manifest.json');

  if (!fs.existsSync(manifestSrc)) {
    console.error(`  ❌ Manifest nicht gefunden: ${manifestSrc}`);
    process.exit(1);
  }
  fs.copyFileSync(manifestSrc, manifestDest);

  // Dateien kopieren
  console.log('  📁 Kopiere Dateien...');
  let copiedCount = 0;
  let missingCount = 0;

  for (const file of FILES_TO_COPY) {
    const src = path.join(SRC, file);
    const dest = path.join(distDir, file);

    if (copyFile(src, dest)) {
      copiedCount++;
    } else {
      console.warn(`  ⚠️  Datei nicht gefunden: ${file}`);
      missingCount++;
    }
  }

  // Ordner kopieren
  for (const dir of DIRS_TO_COPY) {
    const src = path.join(SRC, dir);
    const dest = path.join(distDir, dir);
    copyDir(src, dest);
  }

  console.log(`  ✅ ${copiedCount} Dateien kopiert`);
  if (missingCount > 0) {
    console.log(`  ⚠️  ${missingCount} Dateien fehlen noch`);
  }

  // Statistik
  const size = getDirSize(distDir);
  console.log(`  📦 Build-Größe: ${formatBytes(size)}`);

  return distDir;
}

/**
 * Berechnet die Größe eines Ordners
 */
function getDirSize(dir) {
  let size = 0;

  if (!fs.existsSync(dir)) return 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      size += getDirSize(entryPath);
    } else {
      size += fs.statSync(entryPath).size;
    }
  }

  return size;
}

/**
 * Formatiert Bytes in lesbare Größe
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Erstellt ZIP für Firefox
 */
function createFirefoxZip(distDir) {
  // Hinweis: Für echte ZIP-Erstellung würde man archiver oder ähnliches nutzen
  // Hier nur Hinweis ausgeben
  console.log('\n📦 Firefox ZIP erstellen:');
  console.log(`   cd ${distDir} && zip -r ../consent-guardian-firefox.zip .`);
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';

  console.log('🛡️  Consent Guardian - Build Script');
  console.log('=====================================');

  // Prüfen ob CSS kompiliert wurde
  const cssPath = path.join(SRC, 'styles', 'output.css');
  if (!fs.existsSync(cssPath)) {
    console.log('\n⚠️  CSS noch nicht kompiliert. Führe aus:');
    console.log('   npm run build:css');
    console.log('');
  }

  const browsers = target === 'all'
    ? ['chrome', 'firefox', 'safari']
    : [target];

  const validBrowsers = ['chrome', 'firefox', 'safari'];

  for (const browser of browsers) {
    if (!validBrowsers.includes(browser)) {
      console.error(`❌ Unbekannter Browser: ${browser}`);
      console.error(`   Gültige Optionen: ${validBrowsers.join(', ')}, all`);
      process.exit(1);
    }

    buildForBrowser(browser);
  }

  console.log('\n✨ Build abgeschlossen!');
  console.log('\nNächste Schritte:');
  console.log('  Chrome:  chrome://extensions → "Entpackte Erweiterung laden" → dist/chrome');
  console.log('  Firefox: about:debugging → "Temporäre Erweiterung laden" → dist/firefox/manifest.json');
  console.log('  Safari:  Safari Web Extension Packager oder Xcode verwenden');
}

main();
