(function () {
  "use strict";

  /**
   * Simple 2048 implementation with keyboard and touch support.
   * - Grid size: 4x4
   * - Features: score, best score, undo (1 step), win/lose overlay, localStorage persistence
   */

  const GRID_SIZE = 4;
  const START_TILES = 2;
  const CHANCE_OF_FOUR = 0.1; // 10% chance to spawn a 4

  const STATE_KEY = "game-2048-state-v1";

  const tileContainer = document.getElementById("tile-container");
  const scoreValueEl = document.getElementById("score-value");
  const bestValueEl = document.getElementById("best-value");
  const overlayEl = document.getElementById("overlay");
  const overlayMessageEl = document.getElementById("overlay-message");
  const keepGoingBtn = document.getElementById("keep-going-btn");
  const tryAgainBtn = document.getElementById("try-again-btn");
  const newGameBtn = document.getElementById("new-game-btn");
  const undoBtn = document.getElementById("undo-btn");
  const boardEl = document.querySelector(".board");

  /** @type {number[][]} */
  let grid = createEmptyGrid(GRID_SIZE);
  let score = 0;
  let best = 0;
  let hasWon = false;
  let keepPlaying = false;
  let isGameOver = false;

  /** Undo snapshot */
  let undoGrid = null; // number[][] or null
  let undoScore = 0;
  let canUndo = false;

  /** Animation flags per frame */
  let tilesJustAdded = new Set(); // Set of "r,c"
  let tilesJustMerged = new Set(); // Set of "r,c"

  init();

  function init() {
    const saved = loadState();
    if (saved) {
      grid = saved.grid;
      score = saved.score;
      best = saved.best;
      hasWon = saved.hasWon;
      keepPlaying = saved.keepPlaying;
      isGameOver = saved.isGameOver;
    } else {
      startNewGame();
    }

    updateScoreUI();
    render();

    // Input handlers
    window.addEventListener("keydown", onKeyDown, { passive: false });
    setupTouch(boardEl);

    newGameBtn.addEventListener("click", () => {
      startNewGame();
      saveState();
      render();
    });

    undoBtn.addEventListener("click", () => {
      if (!canUndo || !undoGrid) return;
      grid = cloneGrid(undoGrid);
      score = undoScore;
      canUndo = false;
      computeBest();
      checkGameState();
      saveState();
      render();
    });

    keepGoingBtn.addEventListener("click", () => {
      keepPlaying = true;
      saveState();
      updateOverlay();
    });

    tryAgainBtn.addEventListener("click", () => {
      startNewGame();
      saveState();
      render();
    });
  }

  function startNewGame() {
    grid = createEmptyGrid(GRID_SIZE);
    score = 0;
    hasWon = false;
    keepPlaying = false;
    isGameOver = false;
    canUndo = false;
    undoGrid = null;
    undoScore = 0;
    tilesJustAdded.clear();
    tilesJustMerged.clear();
    for (let i = 0; i < START_TILES; i++) addRandomTile();
    computeBest();
    updateOverlay();
    updateScoreUI();
  }

  function computeBest() {
    best = Math.max(best || 0, score || 0);
  }

  function onKeyDown(e) {
    const key = e.key;
    let handled = false;
    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        handled = move("left");
        break;
      case "ArrowRight":
      case "d":
      case "D":
        handled = move("right");
        break;
      case "ArrowUp":
      case "w":
      case "W":
        handled = move("up");
        break;
      case "ArrowDown":
      case "s":
      case "S":
        handled = move("down");
        break;
    }
    if (handled) {
      e.preventDefault();
    }
  }

  function setupTouch(target) {
    let startX = 0;
    let startY = 0;
    let touching = false;

    target.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      touching = true;
    }, { passive: true });

    target.addEventListener("touchmove", (e) => {
      // Prevent scrolling while swiping on board
      if (touching) e.preventDefault();
    }, { passive: false });

    target.addEventListener("touchend", (e) => {
      if (!touching) return;
      touching = false;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const threshold = 24; // px
      if (Math.max(absX, absY) < threshold) return;

      if (absX > absY) {
        if (dx > 0) move("right"); else move("left");
      } else {
        if (dy > 0) move("down"); else move("up");
      }
    }, { passive: false });
  }

  function move(direction) {
    if (isGameOver) return false;
    if (hasWon && !keepPlaying) return false;

    // Prepare undo snapshot
    undoGrid = cloneGrid(grid);
    undoScore = score;

    tilesJustAdded.clear();
    tilesJustMerged.clear();

    let moved = false;
    let gained = 0;

    if (direction === "left" || direction === "right") {
      for (let r = 0; r < GRID_SIZE; r++) {
        const row = grid[r].slice();
        const { line: newLine, mergedAt, movedLine, gainedSum } = computeMergedLine(row, direction === "right");
        if (!arraysEqual(row, newLine)) moved = true;
        grid[r] = newLine;
        gained += gainedSum;
        // Mark merged positions for animation
        mergedAt.forEach((j) => {
          const c = direction === "right" ? (GRID_SIZE - 1 - j) : j;
          tilesJustMerged.add(keyOf(r, c));
        });
      }
    } else {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = [];
        for (let r = 0; r < GRID_SIZE; r++) col.push(grid[r][c]);
        const { line: newCol, mergedAt, movedLine, gainedSum } = computeMergedLine(col, direction === "down");
        // write back
        for (let r = 0; r < GRID_SIZE; r++) {
          if (grid[r][c] !== newCol[r]) moved = true;
          grid[r][c] = newCol[r];
        }
        gained += gainedSum;
        mergedAt.forEach((j) => {
          const r = direction === "down" ? (GRID_SIZE - 1 - j) : j;
          tilesJustMerged.add(keyOf(r, c));
        });
      }
    }

    if (!moved) {
      // Clear undo snapshot since nothing changed
      undoGrid = null;
      undoScore = score;
      return false;
    }

    score += gained;
    computeBest();

    addRandomTile();

    canUndo = true;

    checkGameState();
    saveState();
    updateScoreUI();
    render();
    return true;
  }

  function computeMergedLine(line, reverse) {
    const size = line.length;
    const arr = reverse ? line.slice().reverse() : line.slice();

    // compress non-zeros to the left
    const values = arr.filter((v) => v !== 0);

    const result = [];
    const mergedAt = [];
    let gainedSum = 0;

    for (let i = 0; i < values.length; i++) {
      if (i + 1 < values.length && values[i] === values[i + 1]) {
        const merged = values[i] * 2;
        result.push(merged);
        mergedAt.push(result.length - 1); // index in result (left-based)
        gainedSum += merged;
        i++; // skip next
      } else {
        result.push(values[i]);
      }
    }

    // pad with zeros to the right
    while (result.length < size) result.push(0);

    const finalLine = reverse ? result.slice().reverse() : result;
    return { line: finalLine, mergedAt, movedLine: result, gainedSum };
  }

  function addRandomTile() {
    const empties = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) empties.push([r, c]);
      }
    }
    if (empties.length === 0) return false;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    const value = Math.random() < CHANCE_OF_FOUR ? 4 : 2;
    grid[r][c] = value;
    tilesJustAdded.add(keyOf(r, c));
    return true;
  }

  function checkGameState() {
    // Win state
    if (!hasWon) {
      outer: for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] >= 2048) { hasWon = true; break outer; }
        }
      }
    }

    // Game over if no moves
    isGameOver = !canMove();
    updateOverlay();
  }

  function canMove() {
    // any empty cells?
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const v = grid[r][c];
        if (v === 0) return true;
        // neighbor equal?
        if (r + 1 < GRID_SIZE && grid[r + 1][c] === v) return true;
        if (c + 1 < GRID_SIZE && grid[r][c + 1] === v) return true;
      }
    }
    return false;
  }

  function updateOverlay() {
    if (hasWon && !keepPlaying) {
      overlayMessageEl.textContent = "你赢了！";
      overlayEl.classList.remove("hidden");
      keepGoingBtn.style.display = "inline-flex";
      return;
    }
    if (isGameOver) {
      overlayMessageEl.textContent = "游戏结束";
      overlayEl.classList.remove("hidden");
      keepGoingBtn.style.display = "none";
      return;
    }
    overlayEl.classList.add("hidden");
  }

  function render() {
    // Rebuild tiles
    while (tileContainer.firstChild) tileContainer.removeChild(tileContainer.firstChild);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const v = grid[r][c];
        if (!v) continue;
        const tile = document.createElement("div");
        tile.className = classNamesForTile(v, r, c);
        tile.style.gridRowStart = String(r + 1);
        tile.style.gridColumnStart = String(c + 1);
        tile.textContent = String(v);
        tile.setAttribute("aria-label", `${v}，位置 ${r + 1} 行 ${c + 1} 列`);
        tileContainer.appendChild(tile);
      }
    }

    // Clear animation flags after rendering
    tilesJustAdded.clear();
    tilesJustMerged.clear();
  }

  function classNamesForTile(value, r, c) {
    const classes = ["tile"];
    if (value <= 2048) classes.push(`tile-${value}`); else classes.push("tile-super");
    const key = keyOf(r, c);
    if (tilesJustAdded.has(key)) classes.push("tile-new");
    if (tilesJustMerged.has(key)) classes.push("tile-merged");
    return classes.join(" ");
  }

  function updateScoreUI() {
    scoreValueEl.textContent = String(score);
    bestValueEl.textContent = String(best);
  }

  function saveState() {
    const state = {
      grid,
      score,
      best,
      hasWon,
      keepPlaying,
      isGameOver,
    };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.grid)) return null;
      return data;
    } catch {
      return null;
    }
  }

  // Utilities
  function createEmptyGrid(size) {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  }

  function cloneGrid(src) {
    return src.map((row) => row.slice());
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function keyOf(r, c) {
    return r + "," + c;
  }
})();