#!/usr/bin/env node
/**
 * Create simple PNG tab icons using node-canvas
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create simple SVG icons (WeChat may support these, fallback to colored circles)
function createTabIconSVG(icon, color, selectedColor) {
  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81">`;
  const end = `</svg>`;
  
  let shape = '';
  switch(icon) {
    case 'hero':
      // Shield icon
      shape = `<path d="M40.5 10 L20 20 L20 40 C20 55 40.5 70 40.5 70 C40.5 70 61 55 61 40 L61 20 Z" fill="${color}" stroke="${color}" stroke-width="3"/>`;
      break;
    case 'hero-active':
      shape = `<path d="M40.5 10 L20 20 L20 40 C20 55 40.5 70 40.5 70 C40.5 70 61 55 61 40 L61 20 Z" fill="${selectedColor}" stroke="${selectedColor}" stroke-width="3"/>`;
      break;
    case 'storm':
      // Lightning bolt
      shape = `<path d="M45 10 L30 40 L40 40 L35 70 L60 35 L50 35 Z" fill="${color}" stroke="${color}" stroke-width="2"/>`;
      break;
    case 'storm-active':
      shape = `<path d="M45 10 L30 40 L40 40 L35 70 L60 35 L50 35 Z" fill="${selectedColor}" stroke="${selectedColor}" stroke-width="2"/>`;
      break;
    case 'favorite':
      // Star icon
      shape = `<path d="M40.5 15 L48 35 L68 35 L52 48 L58 68 L40.5 55 L23 68 L29 48 L13 35 L33 35 Z" fill="${color}" stroke="${color}" stroke-width="2"/>`;
      break;
    case 'favorite-active':
      shape = `<path d="M40.5 15 L48 35 L68 35 L52 48 L58 68 L40.5 55 L23 68 L29 48 L13 35 L33 35 Z" fill="${selectedColor}" stroke="${selectedColor}" stroke-width="2"/>`;
      break;
    case 'about':
      // Info icon (i in circle)
      shape = `<circle cx="40.5" cy="40.5" r="25" fill="none" stroke="${color}" stroke-width="3"/><circle cx="40.5" cy="28" r="3" fill="${color}"/><rect x="37" y="35" width="7" height="20" rx="2" fill="${color}"/>`;
      break;
    case 'about-active':
      shape = `<circle cx="40.5" cy="40.5" r="25" fill="none" stroke="${selectedColor}" stroke-width="3"/><circle cx="40.5" cy="28" r="3" fill="${selectedColor}"/><rect x="37" y="35" width="7" height="20" rx="2" fill="${selectedColor}"/>`;
      break;
  }
  
  return base + shape + end;
}

const dir = join(__dirname, 'src/static/tab');
mkdirSync(dir, { recursive: true });

const icons = {
  'hero': '#999999',
  'hero-active': '#9682ff',
  'storm': '#999999',
  'storm-active': '#9682ff',
  'favorite': '#999999',
  'favorite-active': '#9682ff',
  'about': '#999999',
  'about-active': '#9682ff'
};

Object.entries(icons).forEach(([name, color]) => {
  const isActive = name.includes('-active');
  const baseName = name.replace('-active', '');
  const iconColor = isActive ? '#9682ff' : '#999999';
  
  const svg = createTabIconSVG(name, iconColor, iconColor);
  const path = join(dir, `${name}.svg`);
  writeFileSync(path, svg);
  console.log(`Created ${name}.svg`);
});

console.log('\n✓ Tab icons created!');

