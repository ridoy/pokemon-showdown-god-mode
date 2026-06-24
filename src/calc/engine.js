// Thin wrapper around @smogon/calc that the UI talks to.
import {
  calculate,
  Generations,
  Pokemon,
  Move,
  Field,
  ITEMS,
  ABILITIES,
  MOVES,
} from "@smogon/calc";

const genCache = {};
export function getGen(num) {
  if (!genCache[num]) genCache[num] = Generations.get(num);
  return genCache[num];
}

// Sorted name lists for the editor dropdowns, per generation.
export function itemList(num) {
  return (ITEMS[num] || []).slice().sort();
}
export function abilityList(num) {
  return (ABILITIES[num] || []).slice().sort();
}
export function moveList(num) {
  return Object.keys(MOVES[num] || {}).sort();
}

// Build a @smogon/calc Pokemon from a plain config object produced by the panel.
// @param {number} num - generation number
// @param {Object} cfg - { species, level, nature, item, ability, evs, ivs, boosts, status, curHP, maxHP }
export function buildPokemon(num, cfg) {
  const gen = getGen(num);
  const opts = {
    level: cfg.level || 100,
    nature: cfg.nature || "Hardy",
    evs: cfg.evs,
    ivs: cfg.ivs,
    boosts: cfg.boosts,
  };
  if (cfg.item) opts.item = cfg.item;
  if (cfg.ability) opts.ability = cfg.ability;
  if (cfg.status) opts.status = cfg.status;
  if (cfg.curHP != null) opts.curHP = cfg.curHP;
  return new Pokemon(gen, cfg.species, opts);
}

// Build a Field. `cfg` is { weather, attackerSide, defenderSide } where the
// side objects carry { isReflect, isLightScreen } etc.
export function buildField(num, cfg) {
  cfg = cfg || {};
  return new Field({
    gameType: "Singles",
    weather: cfg.weather || undefined,
    attackerSide: cfg.attackerSide || {},
    defenderSide: cfg.defenderSide || {},
  });
}

// Calculate one move. Returns a display-ready result, or null on failure.
export function calcMove(num, attacker, defender, moveName, field) {
  const gen = getGen(num);
  try {
    const move = new Move(gen, moveName);
    const result = calculate(gen, attacker, defender, move, field);
    const [minRaw, maxRaw] = result.range();
    const maxHP = result.defender.stats.hp;
    const pct = (raw) => Math.round((raw * 1000) / maxHP) / 10;
    let ko = null;
    try {
      ko = result.kochance();
    } catch (e) {
      ko = null;
    }
    return {
      move: move.name,
      isDamaging: maxRaw > 0,
      minRaw,
      maxRaw,
      minPct: pct(minRaw),
      maxPct: pct(maxRaw),
      koText: ko && ko.text ? ko.text : "",
      desc: safeDesc(result),
    };
  } catch (e) {
    return {
      move: moveName,
      isDamaging: false,
      minRaw: 0,
      maxRaw: 0,
      minPct: 0,
      maxPct: 0,
      koText: "",
      desc: "",
      error: String(e && e.message ? e.message : e),
    };
  }
}

function safeDesc(result) {
  try {
    return result.desc();
  } catch (e) {
    return "";
  }
}
