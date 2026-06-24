// Entry point. Runs in the page's MAIN world (see manifest content_scripts.world),
// so it can read the Pokémon Showdown `app` global directly.
import { PanelMount } from "./panel-mount.js";

function boot() {
  try {
    new PanelMount().start();
    // eslint-disable-next-line no-console
    console.log("[PS God Mode] damage calc loaded");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[PS God Mode] failed to start", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
