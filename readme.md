# Pokémon Showdown God Mode

Chrome extension that embeds an **interactive Gen 3 damage calculator** directly into the
Pokémon Showdown battle UI. When you're in a battle, a **Calc** button appears on the
chat/log panel; clicking it swaps the chat out for a full damage calculator in the same
space (click again to get the chat back).

## Features

- **Auto-populates the two Pokémon currently on the field** — yours and your opponent's.
- **Smogon set dropdown** for each side (Gen 3 / ADV dex sets) to plug in EV spreads,
  natures, items, abilities, and moves. Everything stays editable.
- **Live damage both ways** — your mon → their mon and their mon → your mon, move by move,
  with percentages and KO chances.
- Field controls (weather, Reflect, Light Screen). Switch between your team members or
  revealed opponents from a dropdown.
- Hidden only when no battle is active.

Built on the up-to-date [`@smogon/calc`](https://github.com/smogon/damage-calc) engine.

## Development

```bash
npm install
npm run build      # bundles src/ -> dist/bundle.js
npm run dev        # rebuild on change
```

## Setup instructions

1. Run `npm install && npm run build` (or download a release with `dist/` prebuilt).
2. Visit `chrome://extensions`.
3. Enable **Developer Mode**.
4. Click **Load unpacked** and select this folder.
5. Open a Gen 3 battle on https://play.pokemonshowdown.com and click the **Calc** button.

> Requires Chrome 111+ (uses a Manifest V3 `world: "MAIN"` content script).
