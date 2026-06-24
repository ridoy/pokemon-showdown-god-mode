// The interactive damage-calculator UI. Two editable Pokémon columns
// (yours + theirs) auto-populated from the live battle, with Smogon set
// dropdowns and live move-by-move damage in both directions.
import { getSetNamesFor, getSet, setToCalcOptions, NATURES } from "./calc/sets.js";
import {
  buildPokemon,
  buildField,
  calcMove,
  itemList,
  abilityList,
  moveList,
} from "./calc/engine.js";

const STATS = [
  ["hp", "HP"],
  ["atk", "Atk"],
  ["def", "Def"],
  ["spa", "SpA"],
  ["spd", "SpD"],
  ["spe", "Spe"],
];
const STATUSES = [
  ["", "Healthy"],
  ["brn", "Burn"],
  ["par", "Paralyze"],
  ["psn", "Poison"],
  ["tox", "Badly Poisoned"],
  ["slp", "Sleep"],
  ["frz", "Freeze"],
];

// Tiny hyperscript helper.
function h(tag, attrs, children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v != null) el.setAttribute(k, v);
    }
  }
  if (children) {
    for (const c of [].concat(children)) {
      if (c == null) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
  }
  return el;
}

function option(value, label, selected) {
  const o = h("option", { value }, label);
  if (selected) o.selected = true;
  return o;
}

// Build an editable config object for one side from a team entry + snapshot.
// sideKind: "mine" uses real revealed item/ability/moves; "theirs" uses the set.
function makeSideConfig(sideKind, entry, setName) {
  const species = entry.species;
  const names = getSetNamesFor(species);
  const chosen = setName && names.includes(setName) ? setName : names[0] || "";
  const base = chosen
    ? setToCalcOptions(getSet(species, chosen))
    : {
        level: entry.level || 100,
        nature: "Hardy",
        item: "",
        ability: "",
        moves: [],
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      };

  const cfg = {
    sideKind,
    species,
    setName: chosen,
    setNames: names,
    level: entry.level || base.level || 100,
    nature: base.nature,
    item: base.item,
    ability: base.ability,
    status: entry.status || "",
    boosts: Object.assign({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, entry.boosts || {}),
    evs: Object.assign({}, base.evs),
    ivs: Object.assign({}, base.ivs),
    moves: (base.moves || []).slice(0, 4),
    revealed: [],
  };

  if (sideKind === "mine") {
    // We know our own item/ability/moves for certain; the set only supplies the spread.
    if (entry.item) cfg.item = entry.item;
    if (entry.ability) cfg.ability = entry.ability;
    if (entry.moves && entry.moves.length) cfg.moves = entry.moves.slice(0, 4);
  } else {
    cfg.revealed = (entry.revealedMoves || []).slice();
    if (entry.item) cfg.item = entry.item;
    if (entry.ability) cfg.ability = entry.ability;
  }
  // Pad to 4 move slots.
  while (cfg.moves.length < 4) cfg.moves.push("");
  return cfg;
}

export class CalcPanel {
  constructor() {
    this.el = h("div", { class: "godmode-calc" });
    this.snapshot = null;
    this.left = null; // your side
    this.right = null; // their side
    this.field = { weather: "", mySide: {}, farSide: {} };
    this._dlIds = {};
    this._buildDatalists();
  }

  _buildDatalists() {
    const gen = 3;
    const mk = (id, values) => {
      const dl = h("datalist", { id });
      for (const v of values) dl.appendChild(h("option", { value: v }));
      return dl;
    };
    this._dlIds = {
      items: "gm-items",
      abilities: "gm-abilities",
      moves: "gm-moves",
    };
    this._datalists = h("div", { style: "display:none" }, [
      mk(this._dlIds.items, itemList(gen)),
      mk(this._dlIds.abilities, abilityList(gen)),
      mk(this._dlIds.moves, moveList(gen)),
    ]);
  }

  // Called by the mount when the live battle changes meaningfully.
  sync(snapshot) {
    this.snapshot = snapshot;
    if (!snapshot) return;
    const myEntry = snapshot.mine.team[snapshot.mine.activeIndex];
    const theirEntry = snapshot.theirs.team[snapshot.theirs.activeIndex];
    this.left = myEntry ? makeSideConfig("mine", myEntry) : null;
    this.right = theirEntry ? makeSideConfig("theirs", theirEntry) : null;
    this.field = {
      weather: snapshot.field.weather || "",
      mySide: Object.assign({}, snapshot.field.mySide),
      farSide: Object.assign({}, snapshot.field.farSide),
    };
    this.renderAll();
  }

  // Re-pick the active Pokémon for a side without losing field edits.
  _pickTeamMember(side, teamIndex) {
    const snap = this.snapshot;
    if (!snap) return;
    if (side === "left") {
      const entry = snap.mine.team[teamIndex];
      if (entry) this.left = makeSideConfig("mine", entry);
    } else {
      const entry = snap.theirs.team[teamIndex];
      if (entry) this.right = makeSideConfig("theirs", entry);
    }
    this.renderAll();
  }

  _swap() {
    const tmp = this.left;
    this.left = this.right;
    this.right = tmp;
    const t2 = this.field.mySide;
    this.field.mySide = this.field.farSide;
    this.field.farSide = t2;
    this.renderAll();
  }

  renderAll() {
    this.el.innerHTML = "";
    this.el.appendChild(this._datalists);
    if (!this.left || !this.right) {
      this.el.appendChild(h("div", { class: "gm-empty", text: "Waiting for both Pokémon to appear…" }));
      return;
    }
    this.el.appendChild(this._fieldRow());
    const cols = h("div", { class: "gm-cols" }, [
      this._sideColumn("left", this.left, "You"),
      h("button", { class: "gm-swap", title: "Swap sides", onClick: () => this._swap() }, "⇄"),
      this._sideColumn("right", this.right, "Opponent"),
    ]);
    this.el.appendChild(cols);
    this._results = h("div", { class: "gm-results" });
    this.el.appendChild(this._results);
    this.recompute();
  }

  _fieldRow() {
    const weatherSel = h(
      "select",
      { class: "gm-weather", onChange: (e) => { this.field.weather = e.target.value; this.recompute(); } },
      [
        option("", "No Weather", this.field.weather === ""),
        option("Sand", "Sand", this.field.weather === "Sand"),
        option("Sun", "Sun", this.field.weather === "Sun"),
        option("Rain", "Rain", this.field.weather === "Rain"),
        option("Hail", "Hail", this.field.weather === "Hail"),
      ]
    );
    const screen = (sideKey, prop, label) => {
      const cb = h("input", { type: "checkbox" });
      cb.checked = !!this.field[sideKey][prop];
      cb.addEventListener("change", () => { this.field[sideKey][prop] = cb.checked; this.recompute(); });
      return h("label", { class: "gm-screen" }, [cb, " " + label]);
    };
    return h("div", { class: "gm-field" }, [
      h("span", { class: "gm-field-label" }, "Field:"),
      weatherSel,
      screen("mySide", "isReflect", "Your Reflect"),
      screen("mySide", "isLightScreen", "Your Light Screen"),
      screen("farSide", "isReflect", "Their Reflect"),
      screen("farSide", "isLightScreen", "Their Light Screen"),
    ]);
  }

  _sideColumn(side, cfg, heading) {
    const snap = this.snapshot;
    const team = side === "left" ? snap.mine.team : snap.theirs.team;

    // Team picker
    const teamSel = h(
      "select",
      { class: "gm-team", onChange: (e) => this._pickTeamMember(side, parseInt(e.target.value, 10)) },
      team.map((t, i) =>
        option(String(i), t.species + (t.fainted ? " (fnt)" : ""), t.species === cfg.species)
      )
    );

    // Set picker
    const setSel = h(
      "select",
      {
        class: "gm-set",
        onChange: (e) => {
          const entry = team.find((t) => t.species === cfg.species) || { species: cfg.species };
          const rebuilt = makeSideConfig(cfg.sideKind, entry, e.target.value);
          if (side === "left") this.left = rebuilt;
          else this.right = rebuilt;
          this.renderAll();
        },
      },
      cfg.setNames.length
        ? cfg.setNames.map((n) => option(n, n, n === cfg.setName))
        : [option("", "(no sets)")]
    );

    const textField = (label, value, dlId, onChange) => {
      const inp = h("input", { class: "gm-input", value: value || "", list: dlId, onInput: onChange });
      return h("label", { class: "gm-row" }, [h("span", { class: "gm-lbl" }, label), inp]);
    };

    const natureSel = h(
      "select",
      { class: "gm-input", onChange: (e) => { cfg.nature = e.target.value; this.recompute(); } },
      NATURES.map((n) => option(n, n, n === cfg.nature))
    );

    const statusSel = h(
      "select",
      { class: "gm-input", onChange: (e) => { cfg.status = e.target.value; this.recompute(); } },
      STATUSES.map(([v, l]) => option(v, l, v === cfg.status))
    );

    const levelInp = h("input", {
      class: "gm-input gm-num",
      type: "number",
      min: "1",
      max: "100",
      value: String(cfg.level),
      onInput: (e) => { cfg.level = parseInt(e.target.value, 10) || 100; this.recompute(); },
    });

    // EV / IV grids
    const statGrid = (kind) =>
      h(
        "div",
        { class: "gm-stats" },
        STATS.map(([key, lbl]) => {
          const inp = h("input", {
            class: "gm-num",
            type: "number",
            min: "0",
            max: kind === "evs" ? "252" : "31",
            value: String(cfg[kind][key]),
            onInput: (e) => {
              cfg[kind][key] = parseInt(e.target.value, 10) || 0;
              this.recompute();
            },
          });
          return h("label", { class: "gm-stat" }, [h("span", {}, lbl), inp]);
        })
      );

    // Boosts
    const boostGrid = h(
      "div",
      { class: "gm-stats" },
      STATS.filter(([k]) => k !== "hp").map(([key, lbl]) => {
        const opts = [];
        for (let b = 6; b >= -6; b--) opts.push(option(String(b), (b > 0 ? "+" : "") + b, b === (cfg.boosts[key] || 0)));
        const sel = h("select", {
          class: "gm-num",
          onChange: (e) => { cfg.boosts[key] = parseInt(e.target.value, 10); this.recompute(); },
        }, opts);
        return h("label", { class: "gm-stat" }, [h("span", {}, lbl), sel]);
      })
    );

    // Move slots
    const moveInputs = h(
      "div",
      { class: "gm-moves" },
      [0, 1, 2, 3].map((i) => {
        const inp = h("input", {
          class: "gm-input gm-move",
          list: this._dlIds.moves,
          value: cfg.moves[i] || "",
          placeholder: "—",
          onInput: (e) => { cfg.moves[i] = e.target.value; this.recompute(); },
        });
        if (cfg.revealed && cfg.revealed.includes(cfg.moves[i])) inp.classList.add("gm-revealed");
        return inp;
      })
    );

    return h("div", { class: "gm-col" }, [
      h("div", { class: "gm-heading" }, heading + ": " + cfg.species),
      h("label", { class: "gm-row" }, [h("span", { class: "gm-lbl" }, "Mon"), teamSel]),
      h("label", { class: "gm-row" }, [h("span", { class: "gm-lbl" }, "Set"), setSel]),
      h("div", { class: "gm-inline" }, [
        h("label", { class: "gm-row gm-half" }, [h("span", { class: "gm-lbl" }, "Lv"), levelInp]),
        h("label", { class: "gm-row gm-half" }, [h("span", { class: "gm-lbl" }, "Nat"), natureSel]),
      ]),
      textField("Item", cfg.item, this._dlIds.items, (e) => { cfg.item = e.target.value; this.recompute(); }),
      textField("Abil", cfg.ability, this._dlIds.abilities, (e) => { cfg.ability = e.target.value; this.recompute(); }),
      h("label", { class: "gm-row" }, [h("span", { class: "gm-lbl" }, "Status"), statusSel]),
      h("div", { class: "gm-section-lbl" }, "EVs"),
      statGrid("evs"),
      h("div", { class: "gm-section-lbl" }, "IVs"),
      statGrid("ivs"),
      h("div", { class: "gm-section-lbl" }, "Boosts"),
      boostGrid,
      h("div", { class: "gm-section-lbl" }, "Moves"),
      moveInputs,
    ]);
  }

  _buildAttacker(cfg, asAttackerSideKey) {
    return buildPokemon(this.snapshot.gen, {
      species: cfg.species,
      level: cfg.level,
      nature: cfg.nature,
      item: cfg.item,
      ability: cfg.ability,
      status: cfg.status,
      evs: cfg.evs,
      ivs: cfg.ivs,
      boosts: cfg.boosts,
    });
  }

  recompute() {
    if (!this._results || !this.left || !this.right) return;
    this._results.innerHTML = "";
    const gen = this.snapshot ? this.snapshot.gen : 3;

    const leftMon = this._buildAttacker(this.left);
    const rightMon = this._buildAttacker(this.right);

    // Field as seen from each attacker's perspective. `mySide` is the left
    // (your) side; `farSide` is the right (their) side.
    const fieldLeftAtk = buildField(gen, {
      weather: this.field.weather,
      attackerSide: this.field.mySide,
      defenderSide: this.field.farSide,
    });
    const fieldRightAtk = buildField(gen, {
      weather: this.field.weather,
      attackerSide: this.field.farSide,
      defenderSide: this.field.mySide,
    });

    this._results.appendChild(
      this._directionBlock(`${this.left.species} → ${this.right.species}`, gen, leftMon, rightMon, this.left.moves, fieldLeftAtk, this.left.revealed)
    );
    this._results.appendChild(
      this._directionBlock(`${this.right.species} → ${this.left.species}`, gen, rightMon, leftMon, this.right.moves, fieldRightAtk, this.right.revealed)
    );
  }

  _directionBlock(title, gen, attacker, defender, moves, field, revealed) {
    const rows = [];
    for (const mv of moves) {
      if (!mv) continue;
      const r = calcMove(gen, attacker, defender, mv, field);
      const isRevealed = revealed && revealed.includes(mv);
      rows.push(
        h("div", { class: "gm-result-row" + (r.error ? " gm-err" : "") }, [
          h("span", { class: "gm-move-name" + (isRevealed ? " gm-revealed" : "") }, r.move),
          r.isDamaging
            ? h("span", { class: "gm-dmg" }, `${r.minPct} – ${r.maxPct}%`)
            : h("span", { class: "gm-dmg gm-status" }, r.error ? "err" : "—"),
          r.koText ? h("span", { class: "gm-ko" }, r.koText) : null,
        ])
      );
    }
    if (!rows.length) rows.push(h("div", { class: "gm-result-row" }, h("span", {}, "No moves set")));
    return h("div", { class: "gm-dir" }, [h("div", { class: "gm-dir-title" }, title), ...rows]);
  }
}
