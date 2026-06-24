// Helpers around the vendored Gen 3 (ADV) Smogon set data.
//
// The raw set data keys stats with the abbreviated ADV names used by the
// official damage calculator (`hp/at/df/sa/sd/sp`, where `sp` is Speed), which
// must be translated to @smogon/calc's `hp/atk/def/spa/spd/spe` before use.
import SETDEX_ADV from "./sets-data-gen3.js";

// ADV stat key -> @smogon/calc stat key
const STAT_KEY_MAP = {
  hp: "hp",
  at: "atk",
  df: "def",
  sa: "spa",
  sd: "spd",
  sp: "spe",
};

export const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
];

// Tier ordering so OU sets surface first in dropdowns.
const TIER_ORDER = ["OU", "UU", "UUBL", "BL", "NU", "RU", "PU", "ZU", "LC", "NFE", "Uber", "AG"];

function tierRank(setName) {
  const tier = setName.split(" ")[0];
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? TIER_ORDER.length : idx;
}

// Normalize a species name to something present in the set dex. Handles a few
// Gen 3 forme display names that differ from the set-dex keys.
const SPECIES_ALIASES = {
  "Deoxys-Normal": "Deoxys",
  "Castform-Sunny": "Castform",
  "Castform-Rainy": "Castform",
  "Castform-Snowy": "Castform",
};

export function resolveSpecies(species) {
  if (!species) return species;
  if (SETDEX_ADV[species]) return species;
  if (SPECIES_ALIASES[species] && SETDEX_ADV[SPECIES_ALIASES[species]]) {
    return SPECIES_ALIASES[species];
  }
  // Fall back to the base forme (text before the first hyphen).
  const base = species.split("-")[0];
  if (SETDEX_ADV[base]) return base;
  return species;
}

// Return ordered set names available for a species (OU-first), or [] if none.
export function getSetNamesFor(species) {
  const key = resolveSpecies(species);
  const sets = SETDEX_ADV[key];
  if (!sets) return [];
  return Object.keys(sets).sort((a, b) => tierRank(a) - tierRank(b));
}

// Return the raw set object for a species + set name.
export function getSet(species, setName) {
  const key = resolveSpecies(species);
  const sets = SETDEX_ADV[key];
  if (!sets) return null;
  return sets[setName] || null;
}

// Convert a raw ADV set into the option fields used by the calc panel / engine.
// Unlisted EVs default to 0, unlisted IVs default to 31 (standard calc behavior).
export function setToCalcOptions(set) {
  const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
  if (set.evs) {
    for (const k of Object.keys(set.evs)) evs[STAT_KEY_MAP[k]] = set.evs[k];
  }
  if (set.ivs) {
    for (const k of Object.keys(set.ivs)) ivs[STAT_KEY_MAP[k]] = set.ivs[k];
  }
  return {
    level: set.level || 100,
    nature: set.nature || "Hardy",
    item: set.item || "",
    ability: set.ability || "",
    moves: (set.moves || []).slice(),
    evs,
    ivs,
  };
}
