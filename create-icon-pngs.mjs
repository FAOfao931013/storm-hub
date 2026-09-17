#!/usr/bin/env node
/**
 * Create simple PNG icons for roles and franchises
 * Creates 64x64 colored circle PNGs as placeholders
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple SVG and export as data URI (fallback for PNG)
function createColoredCircleSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="${color}" stroke="#fff" stroke-width="2"/>
</svg>`;
}

const roleColors = {
  'tank': '#4A90E2',
  'bruiser': '#E2A74A',
  'melee-assassin': '#E24A4A',
  'ranged-assassin': '#E24A8E',
  'healer': '#4AE272',
  'support': '#9B4AE2'
};

const franchiseColors = {
  'warcraft': '#D4AF37',
  'starcraft': '#4A90E2',
  'diablo': '#E24A4A',
  'overwatch': '#FF8C00',
  'nexus': '#9B4AE2'
};

function createPNGPlaceholder(name, color, type) {
  const dir = join(__dirname, 'src/static/icons', type);
  mkdirSync(dir, { recursive: true });
  
  // Create a minimal SVG
  const svg = createColoredCircleSVG(color);
  const path = join(dir, `${name}.svg`);
  writeFileSync(path, svg);
  
  console.log(`Created ${type}/${name}.svg with color ${color}`);
}

// Create role icons
Object.entries(roleColors).forEach(([name, color]) => {
  createPNGPlaceholder(name, color, 'roles');
});

// Create franchise icons
Object.entries(franchiseColors).forEach(([name, color]) => {
  createPNGPlaceholder(name, color, 'franchises');
});

console.log('\n✓ Icon SVG placeholders created!');
console.log('Note: WeChat mini-program may need PNG format.');
console.log('These are simple colored circles for now.');

