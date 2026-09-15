#!/usr/bin/env node

/**
 * Build script for Chinese (zhcn) localization data
 * 
 * Downloads HeroesToolChest/heroes-data build 2.55.11.94387 and generates
 * slim per-hero JSON files with Chinese ability/talent text.
 * 
 * Usage: node scripts/build-zhcn.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BUILD_ID = '2.55.11.94387';
const BUILD_NUMBER = '94387';
const BASE_URL = 'https://raw.githubusercontent.com/HeroesToolChest/heroes-data/master';

const HERODATA_URL = `${BASE_URL}/heroesdata/${BUILD_ID}/data/herodata_${BUILD_NUMBER}_localized.json`;
const GAMESTRINGS_URL = `${BASE_URL}/heroesdata/${BUILD_ID}/gamestrings/gamestrings_${BUILD_NUMBER}_zhcn.json`;

console.log('🎮 Storm Hub - Chinese Localization Builder\n');
console.log(`Build: ${BUILD_ID}`);
console.log(`Source: HeroesToolChest/heroes-data (MIT License)\n`);

/**
 * Fetch JSON from URL
 */
async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error(`Failed to parse JSON: ${err.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Clean game markup and format Chinese text for display
 * Handles: color tags, newlines, images, scaling tokens, HTML remnants
 */
function cleanGamestring(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // 1. Strip color tags: <c val="#ColorName">...</c> or <c>...</c>
  cleaned = cleaned.replace(/<\/?c[^>]*>/g, '');
  
  // 2. Replace newline markers with actual newlines
  cleaned = cleaned.replace(/<n\/?>|<\/n>/g, '\n');
  
  // 3. Remove image tags entirely (quest icons, etc.)
  // Optional: add "任务：" prefix only for quest icons if helpful
  cleaned = cleaned.replace(/<img[^>]*StormTalentInTextQuestIcon[^>]*\/?>/gi, '');
  cleaned = cleaned.replace(/<img[^>]*\/?>/gi, '');
  
  // 4. Convert scaling tokens: ~~0.04~~ adjacent to numbers
  // e.g., "350~~0.04~~" -> "350(+4%每级)"
  cleaned = cleaned.replace(/(\d+(?:\.\d+)?)~~(0\.\d+)~~/g, (match, baseValue, scaling) => {
    const scalingPercent = Math.round(parseFloat(scaling) * 100);
    return `${baseValue}(+${scalingPercent}%每级)`;
  });
  
  // Handle standalone scaling tokens (just in case)
  cleaned = cleaned.replace(/~~(0\.\d+)~~/g, (match, scaling) => {
    const scalingPercent = Math.round(parseFloat(scaling) * 100);
    return `(+${scalingPercent}%每级)`;
  });
  
  // 5. Remove any remaining HTML-like tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // 6. Clean up whitespace
  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/ {2,}/g, ' ');
  // Replace multiple newlines with max 2 (paragraph break)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Normalize hero name to short_name format (lowercase, no punctuation)
 */
function normalizeHeroName(name) {
  return name.toLowerCase()
    .replace(/['\.\s-]/g, '')
    .replace(/ú/g, 'u')
    .replace(/û/g, 'u');
}

/**
 * Build join key for matching abilities/talents
 * Note: Uses capitalized False/True to match gamestrings format
 */
function buildJoinKey(nameId, buttonId, abilityType, isPassive = false) {
  const passiveStr = isPassive ? 'True' : 'False';
  return `${nameId}|${buttonId}|${abilityType}|${passiveStr}`;
}

/**
 * Main build process
 */
async function build() {
  console.log('📥 Downloading herodata...');
  const heroData = await fetchJson(HERODATA_URL);
  
  console.log('📥 Downloading gamestrings (zhcn)...');
  const gameStrings = await fetchJson(GAMESTRINGS_URL);
  
  console.log('🔨 Processing heroes...');
  
  const outputDir = join(__dirname, '..', 'data', 'zhcn', 'heroes');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  let heroCount = 0;
  let totalAbilities = 0;
  let totalTalents = 0;
  let matches = 0;
  let misses = 0;
  
  // Process each hero
  for (const [heroKey, hero] of Object.entries(heroData)) {
    if (!hero || heroKey === 'TestHero') continue;
    
    const shortName = normalizeHeroName(heroKey);
    const heroOutput = {
      shortName,
      heroName: heroKey,
      build: BUILD_ID,
      abilities: [],
      talents: []
    };
    
    // Process abilities
    if (hero.abilities) {
      // Abilities are grouped by type: basic, heroic, trait, etc.
      const abilityGroups = ['trait', 'basic', 'heroic', 'activable', 'hearth'];
      
      for (const groupKey of abilityGroups) {
        const abilities = hero.abilities[groupKey];
        if (!Array.isArray(abilities)) continue;
        
        for (const ability of abilities) {
          if (!ability) continue;
          
          const nameId = ability.nameId || '';
          const buttonId = ability.buttonId || '';
          const abilityType = ability.abilityType || '';
          
          if (!nameId) continue;
          
          // Try multiple join key combinations
          const joinKeys = [
            buildJoinKey(nameId, buttonId, abilityType, false),
            buildJoinKey(nameId, buttonId, abilityType, true),
            buildJoinKey(nameId, '', abilityType, false),
            buildJoinKey(nameId, buttonId, '', false)
          ];
          
          let name = null;
          let short = null;
          let full = null;
          
          for (const key of joinKeys) {
            if (gameStrings?.gamestrings?.abiltalent?.name?.[key]) {
              name = gameStrings.gamestrings.abiltalent.name[key];
              short = gameStrings.gamestrings.abiltalent.short?.[key];
              full = gameStrings.gamestrings.abiltalent.full?.[key];
              matches++;
              break;
            }
          }
          
          if (!name && nameId) {
            misses++;
          }
          
          if (name || short || full) {
            heroOutput.abilities.push({
              nameId,
              buttonId,
              abilityType,
              icon: ability.icon,
              hotkey: abilityType,
              trait: groupKey === 'trait',
              name: cleanGamestring(name),
              short: cleanGamestring(short),
              full: cleanGamestring(full)
            });
            totalAbilities++;
          }
        }
      }
    }
    
    // Process talents
    if (hero.talents) {
      for (const [tier, talents] of Object.entries(hero.talents)) {
        if (!Array.isArray(talents)) continue;
        
        for (const talent of talents) {
          if (!talent || !talent.nameId) continue;
          
          const nameId = talent.nameId;
          const buttonId = talent.buttonId || '';
          const abilityType = talent.abilityType || '';
          
          const joinKeys = [
            buildJoinKey(nameId, buttonId, abilityType, false),
            buildJoinKey(nameId, buttonId, abilityType, true),
            buildJoinKey(nameId, '', abilityType, false),
            buildJoinKey(nameId, buttonId, '', false)
          ];
          
          let name = null;
          let short = null;
          let full = null;
          
          for (const key of joinKeys) {
            if (gameStrings?.gamestrings?.abiltalent?.name?.[key]) {
              name = gameStrings.gamestrings.abiltalent.name[key];
              short = gameStrings.gamestrings.abiltalent.short?.[key];
              full = gameStrings.gamestrings.abiltalent.full?.[key];
              matches++;
              break;
            }
          }
          
          if (!name && nameId) {
            misses++;
          }
          
          if (name || short || full) {
            heroOutput.talents.push({
              nameId,
              buttonId,
              abilityType,
              icon: talent.icon,
              level: talent.tier,
              sort: talent.sort,
              name: cleanGamestring(name),
              short: cleanGamestring(short),
              full: cleanGamestring(full)
            });
            totalTalents++;
          }
        }
      }
    }
    
    // Write hero file if has content
    if (heroOutput.abilities.length > 0 || heroOutput.talents.length > 0) {
      const outputPath = join(outputDir, `${shortName}.json`);
      writeFileSync(outputPath, JSON.stringify(heroOutput, null, 2), 'utf8');
      heroCount++;
      
      if (heroCount <= 5 || shortName === 'abathur') {
        console.log(`  ✓ ${heroOutput.heroName} (${shortName}.json) - ${heroOutput.abilities.length} abilities, ${heroOutput.talents.length} talents`);
      }
    }
  }
  
  // Write meta.json
  const metaPath = join(__dirname, '..', 'data', 'zhcn', 'meta.json');
  const meta = {
    build: BUILD_ID,
    buildNumber: BUILD_NUMBER,
    heroCount,
    totalAbilities,
    totalTalents,
    matches,
    misses,
    generatedAt: new Date().toISOString(),
    source: 'HeroesToolChest/heroes-data',
    license: 'MIT'
  };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  
  console.log(`\n✅ Generated ${heroCount} hero files`);
  console.log(`   Abilities: ${totalAbilities}`);
  console.log(`   Talents: ${totalTalents}`);
  console.log(`   Matches: ${matches}`);
  console.log(`   Misses: ${misses}`);
  console.log(`\n📝 Output: data/zhcn/`);
  console.log(`   meta.json`);
  console.log(`   heroes/*.json (${heroCount} files)`);
  console.log(`\n🎉 Done!`);
}

// Run
build().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
