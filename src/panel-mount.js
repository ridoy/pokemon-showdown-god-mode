// Mounts the calc panel over the battle room's chat/log and provides a toggle to
// swap between the two. The panel is shown only while a battle is active.
import { CalcPanel } from "./calc-panel.js";
import { hasActiveBattle, readSnapshot, snapshotSignature } from "./battle-state.js";

const POLL_MS = 800;

export class PanelMount {
  constructor() {
    this.panel = new CalcPanel();
    this.showCalc = false;
    this.lastSig = null;
    this.curLog = null;
    this.hiddenLog = null;
    this._mounted = false;

    this.toggleBtn = document.createElement("button");
    this.toggleBtn.className = "godmode-toggle";
    this.toggleBtn.textContent = "Calc";
    this.toggleBtn.addEventListener("click", () => this._toggle());

    this.wrap = document.createElement("div");
    this.wrap.className = "godmode-wrap";
    this.wrap.appendChild(this.panel.el);
  }

  start() {
    this._ensureInDom();
    this._tick();
    setInterval(() => this._tick(), POLL_MS);
    window.addEventListener("resize", () => {
      if (this.curLog) this._mirror(this.curLog.getBoundingClientRect());
    });
  }

  _ensureInDom() {
    if (this._mounted) return;
    document.body.appendChild(this.wrap);
    document.body.appendChild(this.toggleBtn);
    this._mounted = true;
    this._applyVisibility();
  }

  // Find the battle log of the currently-focused battle room (the visible one).
  _findActiveBattleLog() {
    const logs = document.querySelectorAll(".battle-log");
    for (const l of logs) {
      if (l.offsetParent !== null) return l; // rendered & visible
    }
    return null;
  }

  _tick() {
    if (!hasActiveBattle()) {
      this._hideEverything();
      return;
    }
    const log = this._findActiveBattleLog();
    if (!log) {
      this._hideEverything();
      return;
    }
    this.curLog = log;
    this._mirror(log.getBoundingClientRect());

    const sig = snapshotSignature();
    if (sig !== this.lastSig) {
      this.lastSig = sig;
      this.panel.sync(readSnapshot());
    }

    this.toggleBtn.style.display = "";
    this._applyVisibility();
  }

  // Mirror the log's on-screen box so the calc occupies the same space.
  _mirror(rect) {
    this.wrap.style.top = rect.top + "px";
    this.wrap.style.left = rect.left + "px";
    this.wrap.style.width = rect.width + "px";
    this.wrap.style.height = rect.height + "px";
    this.toggleBtn.style.top = rect.top + 4 + "px";
    this.toggleBtn.style.left = rect.right - 58 + "px";
  }

  _toggle() {
    this.showCalc = !this.showCalc;
    this._applyVisibility();
  }

  _applyVisibility() {
    if (this.showCalc && this.curLog) {
      this.wrap.style.display = "block";
      this.curLog.style.display = "none";
      this.hiddenLog = this.curLog;
      this.toggleBtn.textContent = "Chat";
    } else {
      this.wrap.style.display = "none";
      this._restoreLog();
      this.toggleBtn.textContent = "Calc";
    }
  }

  _restoreLog() {
    if (this.hiddenLog) {
      this.hiddenLog.style.display = "";
      this.hiddenLog = null;
    }
  }

  _hideEverything() {
    this.curLog = null;
    this.lastSig = null;
    this.toggleBtn.style.display = "none";
    this.wrap.style.display = "none";
    this._restoreLog();
  }
}
