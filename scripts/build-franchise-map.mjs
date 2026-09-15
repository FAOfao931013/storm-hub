#!/usr/bin/env node

/**
 * Build franchise mapping from HeroesToolChest herodata
 * Fetches hero data and extracts franchise information for each hero
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HERODATA_URL = 'https://raw.githubusercontent.com/HeroesToolChest/heroes-data2/main/heroesdata/2.55.16.97039/data/herodata_97039.json';

async function fetchHeroData() {
  console.log('Fetching hero data from HeroesToolChest...');
  const response = await fetch(HERODATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch hero data: ${response.statusText}`);
  }
  return await response.json();
}

function normalizeFranchise(franchise) {
  // Map Classic and other variants to standard names
  const mapping = {
    'classic': 'Nexus',
    'Classic': 'Nexus',
    'Warcraft': 'Warcraft',
    'Starcraft': 'Starcraft',
    'Diablo': 'Diablo',
    'Overwatch': 'Overwatch',
    'Nexus': 'Nexus'
  };
  return mapping[franchise] || 'Nexus';
}

function buildFranchiseMap(heroData) {
  const franchiseMap = {};
  
  // Extract heroes from the data structure (heroes-data2 format)
  const heroes = heroData?.items || heroData?.heroes || heroData;
  
  if (!heroes || typeof heroes !== 'object') {
    console.warn('No heroes found in data, returning empty map');
    return franchiseMap;
  }

  for (const [heroId, hero] of Object.entries(heroes)) {
    if (!hero) continue;
    
    // Use hyperlinkId (primary), attributeId, or the key itself
    const shortName = hero.hyperlinkId || hero.attributeId || heroId;
    const franchise = hero.franchise || hero.universe || 'Nexus';
    
    franchiseMap[shortName] = normalizeFranchise(franchise);
    
    // Also add the attributeId as an alternate key if different
    if (hero.attributeId && hero.attributeId !== shortName) {
      franchiseMap[hero.attributeId] = normalizeFranchise(franchise);
    }
  }

  return franchiseMap;
}

async function main() {
  try {
    const heroData = await fetchHeroData();
    const franchiseMap = buildFranchiseMap(heroData);
    
    const outputPath = join(__dirname, '../data/zhcn/franchise.json');
    writeFileSync(outputPath, JSON.stringify(franchiseMap, null, 2), 'utf-8');
    
    console.log(`✓ Franchise map built successfully!`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Heroes: ${Object.keys(franchiseMap).length}`);
    
    // Display franchise distribution
    const distribution = {};
    Object.values(franchiseMap).forEach(franchise => {
      distribution[franchise] = (distribution[franchise] || 0) + 1;
    });
    console.log('\nFranchise distribution:');
    Object.entries(distribution).sort((a, b) => b[1] - a[1]).forEach(([franchise, count]) => {
      console.log(`  ${franchise}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error building franchise map:', error);
    process.exit(1);
  }
}

main();
