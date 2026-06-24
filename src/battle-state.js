// Reads the Pokémon Showdown client's live battle state (the page `app` global)
// into a normalized, calc-friendly snapshot. This module runs in the page's MAIN
// world, so `window.app` is directly accessible.
//
// We are defensive about the client's object shapes: only `speciesForme`, `boosts`,
// `level`, `status`, `item`, `ability`, `moves`/`moveTrack` and `fainted` are read,
// each guarded, because the precise client `Pokemon` shape can vary across builds.

const WEATHER_MAP = {
  sandstorm: "Sand",
  sunnyday: "Sun",
  raindance: "Rain",
  hail: "Hail",
};

function getBattle() {
  const app = window.app;
  if (!app || !app.curRoom || !app.curRoom.battle) return null;
  const battle = app.curRoom.battle;
  if (!battle.myPokemon) return null;
  return battle;
}

// The client stores items/abilities/moves as IDs (e.g. "choiceband", "rockslide"),
// but @smogon/calc expects display names ("Choice Band"). `dex.<collection>.get`
// accepts either form and returns the canonical entry, so it normalizes both.
function dexName(collection, val) {
  if (!val) return "";
  try {
    const entry = collection.get(val);
    return entry && entry.name ? entry.name : val;
  } catch (e) {
    return val;
  }
}

// Is there a battle room currently focused with usable state?
export function hasActiveBattle() {
  return getBattle() != null;
}

function toName(forme) {
  return forme || "";
}

function parseLevelFromDetails(details) {
  if (!details) return 100;
  const m = /L(\d+)/.exec(details);
  return m ? parseInt(m[1], 10) : 100;
}

function hpPct(pkmn) {
  if (!pkmn) return 100;
  if (typeof pkmn.hp === "number" && typeof pkmn.maxhp === "number" && pkmn.maxhp > 0) {
    return Math.round((pkmn.hp / pkmn.maxhp) * 100);
  }
  return 100;
}

function normalizeStatus(status) {
  // Client uses short codes (brn, par, slp, frz, psn, tox); @smogon/calc wants the same.
  return status || "";
}

// Revealed move names for an opponent client Pokemon (best-effort).
function revealedMoves(pkmn) {
  if (!pkmn) return [];
  const out = [];
  if (Array.isArray(pkmn.moveTrack)) {
    for (const entry of pkmn.moveTrack) {
      const name = Array.isArray(entry) ? entry[0] : entry;
      if (name) out.push(name);
    }
  } else if (Array.isArray(pkmn.moves)) {
    out.push(...pkmn.moves);
  }
  return out;
}

function readSideCond(side) {
  const cond = side && side.sideConditions ? side.sideConditions : {};
  return {
    isReflect: !!cond.reflect,
    isLightScreen: !!cond.lightscreen,
  };
}

// Build the snapshot. Returns null when there is no usable battle.
export function readSnapshot() {
  const battle = getBattle();
  if (!battle) return null;

  const gen = battle.gen || 3;
  const dex = battle.dex;

  // --- My team (full info from the server request) ---
  const myActiveForme =
    battle.mySide && battle.mySide.active && battle.mySide.active[0]
      ? battle.mySide.active[0].speciesForme
      : null;
  const myActiveBoosts =
    battle.mySide && battle.mySide.active && battle.mySide.active[0]
      ? battle.mySide.active[0].boosts || {}
      : {};

  const myTeam = (battle.myPokemon || []).map((p) => ({
    species: toName(p.speciesForme),
    level: p.level || 100,
    item: dexName(dex.items, p.item),
    ability: dexName(dex.abilities, p.ability || p.baseAbility),
    status: normalizeStatus(p.status),
    moves: (Array.isArray(p.moves) ? p.moves : []).map((m) => dexName(dex.moves, m)),
    fainted: !!p.fainted,
    boosts: {},
  }));
  let myActiveIndex = myTeam.findIndex((p) => p.species === myActiveForme);
  if (myActiveIndex === -1) myActiveIndex = 0;
  if (myTeam[myActiveIndex]) myTeam[myActiveIndex].boosts = myActiveBoosts;

  // --- Opponent team (only revealed info) ---
  const farSide = battle.farSide || {};
  const farActive = farSide.active && farSide.active[0] ? farSide.active[0] : null;
  const farPokemon = Array.isArray(farSide.pokemon) ? farSide.pokemon : [];
  // Make sure the active mon is represented even if `pokemon` is sparse.
  const seen = new Set();
  const theirTeam = [];
  const pushTheir = (p, isActive) => {
    if (!p) return;
    const species = toName(p.speciesForme || p.name);
    const key = species + (isActive ? "*" : "");
    if (seen.has(species)) return;
    seen.add(species);
    theirTeam.push({
      species,
      level: p.level || parseLevelFromDetails(p.details),
      status: normalizeStatus(p.status),
      boosts: p.boosts || {},
      revealedMoves: revealedMoves(p).map((m) => dexName(dex.moves, m)),
      item: dexName(dex.items, p.item),
      ability: dexName(dex.abilities, p.ability || p.baseAbility),
      hpPct: hpPct(p),
      isActive: !!isActive,
    });
  };
  pushTheir(farActive, true);
  for (const p of farPokemon) pushTheir(p, p === farActive);
  let theirActiveIndex = theirTeam.findIndex((p) => p.isActive);
  if (theirActiveIndex === -1) theirActiveIndex = 0;

  return {
    gen,
    tier: battle.tier || (battle.id || ""),
    field: {
      weather: WEATHER_MAP[battle.weather] || "",
      mySide: readSideCond(battle.mySide),
      farSide: readSideCond(battle.farSide),
    },
    mine: { team: myTeam, activeIndex: myActiveIndex },
    theirs: { team: theirTeam, activeIndex: theirActiveIndex },
  };
}

// A cheap signature used to detect when the snapshot meaningfully changed
// (battle id, turn, and the two active species), so the panel can re-sync.
export function snapshotSignature() {
  const battle = getBattle();
  if (!battle) return "none";
  const my =
    battle.mySide && battle.mySide.active && battle.mySide.active[0]
      ? battle.mySide.active[0].speciesForme
      : "?";
  const their =
    battle.farSide && battle.farSide.active && battle.farSide.active[0]
      ? battle.farSide.active[0].speciesForme
      : "?";
  return [battle.id, battle.turn, my, their, battle.weather].join("|");
}
