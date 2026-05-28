// ==UserScript==
// @name         Bilibili Fitness Timer
// @namespace    https://github.com/RyanChouHua/bili-fitness-timer
// @version      0.2.0
// @description  Turn Bilibili video clips into workout intervals with sets and rest timers.
// @match        https://www.bilibili.com/*
// @match        https://m.bilibili.com/*
// @match        https://bilibili.com/*
// @downloadURL  https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
// @updateURL    https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
// @supportURL   https://github.com/RyanChouHua/bili-fitness-timer/issues
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  "use strict";
  const timestampLibraryBaseUrl = "https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/timestamps";
  const timestampPattern = String.raw`(?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?|(?:(?:\d+\s*时)?(?:\d+\s*分)?\d+(?:\.\d+)?\s*秒|(?:\d+\s*时)?\d+\s*分(?:\s*\d+(?:\.\d+)?\s*秒)?)`;
  const bvidPattern = /BV[0-9A-Za-z]{10}/i;
  function isBilibiliUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname === "bilibili.com" || parsed.hostname.endsWith(".bilibili.com");
    } catch {
      return false;
    }
  }
  function normalizeBvid(value) {
    const match = value.match(bvidPattern);
    if (!match) {
      return null;
    }
    return `BV${match[0].slice(2)}`;
  }
  function extractBvidFromUrl(url) {
    try {
      const parsed = new URL(url);
      if (!isBilibiliUrl(url)) {
        return null;
      }
      for (const [key, value] of parsed.searchParams) {
        if (key.toLowerCase() === "bvid" || key.toLowerCase() === "bv_id") {
          const fromQuery = normalizeBvid(value);
          if (fromQuery) {
            return fromQuery;
          }
        }
      }
      return normalizeBvid(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    } catch {
      return normalizeBvid(url);
    }
  }
  function getTimestampLibraryUrl(bvid) {
    return `${timestampLibraryBaseUrl}/${encodeURIComponent(bvid)}.json`;
  }
  function parseTimestamp(value) {
    const text = value.trim();
    const chinese = text.match(/^(?:(\d+)\s*时)?(?:(\d+)\s*分)?(?:(\d+(?:\.\d+)?)\s*秒?)$/);
    if (chinese && (chinese[1] || chinese[2] || chinese[3])) {
      return Number(chinese[1] ?? 0) * 3600 + Number(chinese[2] ?? 0) * 60 + Number(chinese[3] ?? 0);
    }
    const parts = text.split(":");
    if (parts.length < 2 || parts.length > 3) {
      return null;
    }
    if (parts.some((part) => part.trim() === "" || Number.isNaN(Number(part)))) {
      return null;
    }
    const numbers = parts.map(Number);
    if (numbers.length === 2) {
      return numbers[0] * 60 + numbers[1];
    }
    return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
  }
  function formatTimestamp(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor(safeSeconds % 3600 / 60);
    const s = safeSeconds % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  function parsePlan(input) {
    const errors = [];
    const parsedExercises = [];
    const lines = input.split(/\r?\n/);
    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) {
        return;
      }
      const timeMatch = line.match(
        new RegExp(`(?<start>${timestampPattern})\\s*(?:-|~|至|到)\\s*(?<end>${timestampPattern})`)
      );
      const setMatch = line.match(/(?<sets>\d+)\s*(?:x|X|×|组)\s*(?<min>\d+)(?:\s*[-~]\s*(?<max>\d+))?/);
      const restMatch = line.match(/(?:rest|休息)\s*(?<rest>\d+)/i);
      if (!(timeMatch == null ? void 0 : timeMatch.groups)) {
        errors.push(`第 ${index + 1} 行：缺少时间段，例如 00:12-00:28`);
        return;
      }
      if (!(setMatch == null ? void 0 : setMatch.groups)) {
        errors.push(`第 ${index + 1} 行：缺少组数和次数，例如 3x8-12`);
        return;
      }
      const start = parseTimestamp(timeMatch.groups.start);
      const end = parseTimestamp(timeMatch.groups.end);
      if (start === null || end === null) {
        errors.push(`第 ${index + 1} 行：时间戳格式无法识别`);
        return;
      }
      if (end <= start) {
        errors.push(`第 ${index + 1} 行：结束时间必须晚于开始时间`);
        return;
      }
      const beforeTime = line.slice(0, timeMatch.index).trim();
      const name = beforeTime || `动作 ${parsedExercises.length + 1}`;
      const sets = Number(setMatch.groups.sets);
      const minReps = Number(setMatch.groups.min);
      const maxReps = Number(setMatch.groups.max ?? setMatch.groups.min);
      const restSeconds = (restMatch == null ? void 0 : restMatch.groups) ? Number(restMatch.groups.rest) : 45;
      if (sets <= 0 || minReps <= 0 || maxReps < minReps || restSeconds < 0) {
        errors.push(`第 ${index + 1} 行：组数、次数或休息时间无效`);
        return;
      }
      parsedExercises.push({
        id: `${index}-${start}-${end}`,
        name,
        start,
        end,
        sets,
        minReps,
        maxReps,
        restSeconds
      });
    });
    return {
      exercises: parsedExercises,
      errors
    };
  }
  function serializeExercises(items) {
    return items.map(
      (exercise) => `${exercise.name} ${formatTimestamp(exercise.start)}-${formatTimestamp(exercise.end)} ${exercise.sets}x${exercise.minReps}${exercise.maxReps === exercise.minReps ? "" : `-${exercise.maxReps}`} rest${exercise.restSeconds}`
    ).join("\n");
  }
  function normalizeExercise(value, index = 0) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const exercise = value;
    const id = typeof exercise.id === "string" ? exercise.id : `${index}-${Number(exercise.start)}-${Number(exercise.end)}`;
    if (typeof exercise.name !== "string" || typeof exercise.start !== "number" || typeof exercise.end !== "number" || typeof exercise.sets !== "number" || typeof exercise.minReps !== "number" || typeof exercise.maxReps !== "number" || typeof exercise.restSeconds !== "number") {
      return null;
    }
    if (!Number.isFinite(exercise.start) || !Number.isFinite(exercise.end) || !Number.isFinite(exercise.sets) || !Number.isFinite(exercise.minReps) || !Number.isFinite(exercise.maxReps) || !Number.isFinite(exercise.restSeconds) || exercise.end <= exercise.start || exercise.sets <= 0 || exercise.minReps <= 0 || exercise.maxReps < exercise.minReps || exercise.restSeconds < 0) {
      return null;
    }
    return {
      id,
      name: exercise.name,
      start: exercise.start,
      end: exercise.end,
      sets: exercise.sets,
      minReps: exercise.minReps,
      maxReps: exercise.maxReps,
      restSeconds: exercise.restSeconds
    };
  }
  function normalizeExerciseList(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item, index) => normalizeExercise(item, index)).filter((item) => item !== null);
  }
  function normalizeImportedPlanData(value) {
    if (!value || typeof value !== "object") {
      throw new Error("JSON 必须是对象");
    }
    const payload = value;
    const exercises2 = normalizeExerciseList(payload.exercises);
    const savedExercises = normalizeExerciseList(payload.savedExercises);
    const importedExercises = exercises2.length > 0 ? exercises2 : savedExercises;
    const rawInput2 = typeof payload.rawInput === "string" && payload.rawInput.trim() ? payload.rawInput : serializeExercises(importedExercises);
    if (!rawInput2.trim() && importedExercises.length === 0) {
      throw new Error("JSON 缺少 rawInput 或 exercises");
    }
    return {
      bvid: typeof payload.bvid === "string" ? normalizeBvid(payload.bvid) : null,
      rawInput: rawInput2,
      exercises: importedExercises
    };
  }
  const panelId = "bili-fitness-timer-panel";
  const styleId = "bili-fitness-timer-style";
  const preferencesStorageKey = "bili-fitness-timer:preferences";
  const defaultSettings = {
    beepDuration: 2,
    pauseDuringRest: true
  };
  let video = null;
  let exercises = [];
  let rawInput = "";
  let settings = { ...defaultSettings };
  let collapsed = false;
  let inputCollapsed = false;
  let previewCollapsed = false;
  let selectedStartIndex = 0;
  let panelPosition = null;
  let saveStatusText = "已自动保存";
  let onlineImportBusy = false;
  let runtime = {
    mode: "idle",
    exerciseIndex: 0,
    setIndex: 0,
    restRemaining: 0,
    beforePauseMode: "idle"
  };
  let restTimerId;
  let navigationWatcherId;
  let viewportWatcherReady = false;
  let activeStorageKey = "";
  let initInProgress = false;
  let navigationReloadInProgress = false;
  const guardedVideos = /* @__PURE__ */ new WeakSet();
  function getCurrentBvid() {
    return extractBvidFromUrl(location.href);
  }
  function getStorageKey() {
    const bvid = getCurrentBvid();
    return `bili-fitness-timer:${bvid ?? location.pathname}`;
  }
  function loadPlan() {
    var _a, _b;
    const fallback = {
      rawInput: "",
      settings: { ...defaultSettings },
      savedExercises: []
    };
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (!saved) {
        return fallback;
      }
      const parsed = JSON.parse(saved);
      const savedExercises = normalizeExerciseList(parsed.savedExercises);
      return {
        rawInput: typeof parsed.rawInput === "string" ? parsed.rawInput : serializeExercises(savedExercises),
        settings: {
          beepDuration: typeof ((_a = parsed.settings) == null ? void 0 : _a.beepDuration) === "number" ? parsed.settings.beepDuration : defaultSettings.beepDuration,
          pauseDuringRest: typeof ((_b = parsed.settings) == null ? void 0 : _b.pauseDuringRest) === "boolean" ? parsed.settings.pauseDuringRest : defaultSettings.pauseDuringRest
        },
        savedExercises
      };
    } catch {
      return fallback;
    }
  }
  function savePlan(statusText = "已自动保存") {
    const parseResult = parsePlan(rawInput);
    const savedExercises = parseResult.errors.length === 0 ? parseResult.exercises : exercises;
    localStorage.setItem(
      getStorageKey(),
      JSON.stringify({
        rawInput,
        settings,
        savedExercises
      })
    );
    saveStatusText = parseResult.errors.length === 0 ? statusText : "输入有错误，已保留上次有效动作";
  }
  function loadPreferences() {
    try {
      const saved = localStorage.getItem(preferencesStorageKey);
      if (!saved) {
        return { panelPosition: null, inputCollapsed: false, previewCollapsed: false };
      }
      const parsed = JSON.parse(saved);
      const position = parsed.panelPosition;
      const nextPreferences = {
        panelPosition: null,
        inputCollapsed: parsed.inputCollapsed === true,
        previewCollapsed: parsed.previewCollapsed === true
      };
      if (position && typeof position.left === "number" && typeof position.top === "number") {
        nextPreferences.panelPosition = {
          left: position.left,
          top: position.top
        };
      }
      return nextPreferences;
    } catch {
      return { panelPosition: null, inputCollapsed: false, previewCollapsed: false };
    }
    return { panelPosition: null, inputCollapsed: false, previewCollapsed: false };
  }
  function savePreferences() {
    localStorage.setItem(
      preferencesStorageKey,
      JSON.stringify({
        panelPosition,
        inputCollapsed,
        previewCollapsed
      })
    );
  }
  function isMobileViewport() {
    return window.matchMedia("(max-width: 720px)").matches;
  }
  function clampPanelPosition(position, panel) {
    const margin = 10;
    const rect = panel.getBoundingClientRect();
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
    return {
      left: Math.min(Math.max(position.left, margin), maxLeft),
      top: Math.min(Math.max(position.top, margin), maxTop)
    };
  }
  function applyPanelPosition(panel) {
    if (isMobileViewport()) {
      panel.style.left = "";
      panel.style.right = "";
      panel.style.top = "";
      panel.style.bottom = "";
      return;
    }
    if (!panelPosition) {
      panel.style.left = "";
      panel.style.right = "";
      panel.style.top = "";
      panel.style.bottom = "";
      return;
    }
    const nextPosition = clampPanelPosition(panelPosition, panel);
    panelPosition = nextPosition;
    panel.style.left = `${nextPosition.left}px`;
    panel.style.top = `${nextPosition.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }
  function setupPanelDrag(header, panel) {
    header.addEventListener("pointerdown", (event) => {
      if (isMobileViewport() || event.button !== 0) {
        return;
      }
      if (event.target.closest("button")) {
        return;
      }
      const startRect = panel.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      header.setPointerCapture(event.pointerId);
      header.classList.add("bft-header-dragging");
      const handleMove = (moveEvent) => {
        const next = clampPanelPosition(
          {
            left: startRect.left + moveEvent.clientX - startX,
            top: startRect.top + moveEvent.clientY - startY
          },
          panel
        );
        panelPosition = next;
        panel.style.left = `${next.left}px`;
        panel.style.top = `${next.top}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      };
      const handleUp = (upEvent) => {
        header.releasePointerCapture(upEvent.pointerId);
        header.classList.remove("bft-header-dragging");
        header.removeEventListener("pointermove", handleMove);
        header.removeEventListener("pointerup", handleUp);
        header.removeEventListener("pointercancel", handleUp);
        savePreferences();
      };
      header.addEventListener("pointermove", handleMove);
      header.addEventListener("pointerup", handleUp);
      header.addEventListener("pointercancel", handleUp);
    });
  }
  function exportPlan() {
    const parseResult = parsePlan(rawInput);
    const savedExercises = parseResult.errors.length === 0 ? parseResult.exercises : exercises;
    const payload = {
      bvid: getCurrentBvid(),
      rawInput,
      settings,
      savedExercises,
      exercises: savedExercises
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bili-fitness-timer-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function importPlanFromFile(file) {
    var _a, _b;
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = normalizeImportedPlanData(parsed);
    rawInput = imported.rawInput;
    settings = {
      beepDuration: typeof ((_a = parsed.settings) == null ? void 0 : _a.beepDuration) === "number" ? parsed.settings.beepDuration : settings.beepDuration,
      pauseDuringRest: typeof ((_b = parsed.settings) == null ? void 0 : _b.pauseDuringRest) === "boolean" ? parsed.settings.pauseDuringRest : settings.pauseDuringRest
    };
    selectedStartIndex = 0;
    runtime = {
      mode: "idle",
      exerciseIndex: 0,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: "idle"
    };
    const parseResult = parsePlan(rawInput);
    exercises = parseResult.errors.length === 0 ? parseResult.exercises : imported.exercises;
    savePlan("已导入本地 JSON");
    render();
  }
  async function importPlanFromOnline() {
    const bvid = getCurrentBvid();
    if (!bvid) {
      saveStatusText = "未识别到当前视频 BV 号";
      render();
      return;
    }
    onlineImportBusy = true;
    saveStatusText = `正在在线导入 ${bvid}`;
    render();
    try {
      const response = await fetch(getTimestampLibraryUrl(bvid), {
        cache: "no-store"
      });
      if (response.status === 404) {
        throw new Error("未找到该视频的在线时间戳");
      }
      if (!response.ok) {
        throw new Error(`在线导入失败：HTTP ${response.status}`);
      }
      const imported = normalizeImportedPlanData(await response.json());
      if (imported.bvid && imported.bvid !== bvid) {
        throw new Error(`在线文件 BV 号不匹配：${imported.bvid}`);
      }
      const parseResult = parsePlan(imported.rawInput);
      if (parseResult.errors.length > 0) {
        throw new Error(`在线时间戳格式错误：${parseResult.errors[0]}`);
      }
      rawInput = imported.rawInput;
      exercises = parseResult.exercises;
      selectedStartIndex = 0;
      clearRestTimer();
      runtime = {
        mode: "idle",
        exerciseIndex: 0,
        setIndex: 0,
        restRemaining: 0,
        beforePauseMode: "idle"
      };
      savePlan(`已在线导入 ${bvid}`);
    } catch (error) {
      saveStatusText = error instanceof Error ? error.message : "在线导入失败";
    } finally {
      onlineImportBusy = false;
      render();
    }
  }
  function openImportPicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      var _a;
      const file = (_a = input.files) == null ? void 0 : _a[0];
      if (!file) {
        return;
      }
      void importPlanFromFile(file).catch(() => {
        window.alert("导入失败：请选择由健身计时器导出的 JSON 文件");
      });
    });
    input.click();
  }
  function getCurrentExercise() {
    return exercises[runtime.exerciseIndex] ?? null;
  }
  function clearRestTimer() {
    if (restTimerId !== void 0) {
      window.clearInterval(restTimerId);
      restTimerId = void 0;
    }
  }
  function playCurrentExercise() {
    const currentVideo = video;
    const exercise = getCurrentExercise();
    if (!currentVideo || !exercise) {
      return;
    }
    clearRestTimer();
    runtime.mode = "exercise";
    runtime.restRemaining = 0;
    currentVideo.currentTime = exercise.start;
    void currentVideo.play().catch(() => {
      render();
    });
    render();
  }
  function startTraining() {
    if (exercises.length === 0) {
      return;
    }
    selectedStartIndex = Math.min(selectedStartIndex, exercises.length - 1);
    runtime = {
      mode: "exercise",
      exerciseIndex: selectedStartIndex,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: "exercise"
    };
    playCurrentExercise();
  }
  function completeSet() {
    const currentVideo = video;
    const exercise = getCurrentExercise();
    if (!exercise) {
      return;
    }
    if (settings.pauseDuringRest) {
      currentVideo == null ? void 0 : currentVideo.pause();
    }
    runtime.mode = "rest";
    runtime.restRemaining = exercise.restSeconds;
    startRestCountdown();
    render();
  }
  function startRestCountdown() {
    clearRestTimer();
    restTimerId = window.setInterval(() => {
      if (runtime.mode !== "rest") {
        clearRestTimer();
        return;
      }
      runtime.restRemaining -= 1;
      if (runtime.restRemaining <= 0) {
        skipRest(true);
        return;
      }
      render();
    }, 1e3);
  }
  function moveToNextUnit() {
    const exercise = getCurrentExercise();
    if (!exercise) {
      runtime.mode = "complete";
      return false;
    }
    if (runtime.setIndex + 1 < exercise.sets) {
      runtime.setIndex += 1;
      return true;
    }
    if (runtime.exerciseIndex + 1 < exercises.length) {
      runtime.exerciseIndex += 1;
      runtime.setIndex = 0;
      return true;
    }
    runtime.mode = "complete";
    return false;
  }
  function skipRest(playBeep = false) {
    clearRestTimer();
    if (playBeep) {
      void beep(settings.beepDuration);
    }
    if (moveToNextUnit()) {
      playCurrentExercise();
    } else {
      video == null ? void 0 : video.pause();
      render();
    }
  }
  function togglePause() {
    if (runtime.mode === "paused") {
      runtime.mode = runtime.beforePauseMode;
      if (runtime.mode === "exercise") {
        void (video == null ? void 0 : video.play());
      } else if (runtime.mode === "rest") {
        startRestCountdown();
      }
      render();
      return;
    }
    if (runtime.mode === "idle" || runtime.mode === "complete") {
      return;
    }
    runtime.beforePauseMode = runtime.mode;
    runtime.mode = "paused";
    clearRestTimer();
    video == null ? void 0 : video.pause();
    render();
  }
  async function beep(durationSeconds) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(1e-3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(1e-3, context.currentTime + durationSeconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + durationSeconds);
    await new Promise((resolve) => window.setTimeout(resolve, durationSeconds * 1e3 + 80));
    await context.close();
  }
  function setLoopGuard(targetVideo = video) {
    if (!targetVideo || guardedVideos.has(targetVideo)) {
      return;
    }
    guardedVideos.add(targetVideo);
    targetVideo.addEventListener("timeupdate", () => {
      if (video !== targetVideo || runtime.mode !== "exercise") {
        return;
      }
      const exercise = getCurrentExercise();
      if (!exercise) {
        return;
      }
      if (targetVideo.currentTime >= exercise.end || targetVideo.currentTime < exercise.start - 0.25) {
        targetVideo.currentTime = exercise.start;
        if (targetVideo.paused) {
          void targetVideo.play();
        }
      }
    });
  }
  function waitForVideo(timeoutMs = 1e4) {
    const existing = document.querySelector("video");
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const found = document.querySelector("video");
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      window.setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
    });
  }
  function injectStyle() {
    if (document.getElementById(styleId)) {
      return;
    }
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
    #${panelId} {
      position: fixed;
      right: 14px;
      top: 88px;
      z-index: 2147483647;
      width: min(340px, calc(100vw - 28px));
      max-height: calc(100vh - 104px);
      color: #f6f7f9;
      background: rgba(22, 24, 29, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.34);
      font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }
    #${panelId} * {
      box-sizing: border-box;
    }
    #${panelId} button,
    #${panelId} select,
    #${panelId} textarea,
    #${panelId} input {
      font: inherit;
    }
    .bft-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 7px 9px;
      background: rgba(255, 255, 255, 0.06);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: grab;
      user-select: none;
      touch-action: none;
    }
    .bft-header-dragging {
      cursor: grabbing;
    }
    .bft-title {
      font-weight: 700;
      letter-spacing: 0;
    }
    .bft-body {
      display: grid;
      gap: 8px;
      padding: 9px;
      max-height: calc(100vh - 150px);
      overflow: auto;
    }
    .bft-collapsed .bft-body {
      display: none;
    }
    .bft-collapsed {
      width: auto;
      min-width: 96px;
    }
    .bft-control-stack {
      display: grid;
      gap: 7px;
      position: sticky;
      top: 0;
      z-index: 1;
      padding-bottom: 2px;
      background: linear-gradient(180deg, rgba(22, 24, 29, 0.98), rgba(22, 24, 29, 0.9));
    }
    .bft-status {
      display: grid;
      gap: 3px;
      padding: 7px;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 6px;
    }
    .bft-section {
      display: grid;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.035);
    }
    .bft-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 7px;
      background: rgba(255, 255, 255, 0.055);
    }
    .bft-section-body {
      display: grid;
      gap: 7px;
      padding: 7px;
    }
    .bft-tool-group {
      display: grid;
      gap: 4px;
    }
    .bft-tool-label {
      font-size: 11px;
      color: rgba(246, 247, 249, 0.58);
    }
    .bft-muted {
      color: rgba(246, 247, 249, 0.68);
    }
    .bft-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .bft-row > * {
      flex: 0 0 auto;
    }
    .bft-grow {
      flex: 1 1 120px;
    }
    .bft-input {
      width: 100%;
      min-height: 86px;
      resize: vertical;
      color: #f6f7f9;
      background: rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 6px;
      padding: 7px;
      outline: none;
    }
    .bft-input:focus,
    .bft-select:focus {
      border-color: #4cc9a7;
    }
    .bft-button {
      min-height: 26px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      color: #f6f7f9;
      background: rgba(255, 255, 255, 0.1);
      padding: 3px 7px;
      cursor: pointer;
      font-size: 12px;
    }
    .bft-button:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .bft-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .bft-primary {
      color: #07120f;
      background: #4cc9a7;
      border-color: #4cc9a7;
      font-weight: 700;
    }
    .bft-primary:hover {
      background: #6dd8ba;
    }
    .bft-danger {
      color: #ffd9d9;
      border-color: rgba(255, 114, 114, 0.42);
      background: rgba(255, 114, 114, 0.16);
    }
    .bft-select {
      min-height: 28px;
      color: #f6f7f9;
      background: rgba(0, 0, 0, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 6px;
      padding: 3px 6px;
    }
    .bft-check {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: rgba(246, 247, 249, 0.82);
    }
    .bft-list {
      display: grid;
      gap: 5px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .bft-item {
      display: grid;
      gap: 2px;
      width: 100%;
      color: inherit;
      text-align: left;
      cursor: pointer;
      padding: 6px 7px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
    }
    .bft-item:hover {
      background: rgba(255, 255, 255, 0.09);
    }
    .bft-item-active {
      border-color: rgba(76, 201, 167, 0.85);
      background: rgba(76, 201, 167, 0.12);
    }
    .bft-item-selected {
      border-color: rgba(255, 213, 97, 0.78);
    }
    .bft-empty {
      padding: 7px;
      color: rgba(246, 247, 249, 0.64);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
    }
    .bft-error {
      display: grid;
      gap: 3px;
      color: #ffb9b9;
      padding: 8px;
      border-radius: 6px;
      background: rgba(255, 81, 81, 0.12);
    }
    @media (max-width: 720px) {
      #${panelId} {
        left: 6px;
        right: 6px;
        top: auto;
        bottom: max(0px, env(safe-area-inset-bottom));
        width: auto;
        max-height: min(72dvh, 540px);
        border-radius: 8px 8px 0 0;
      }
      .bft-header {
        cursor: default;
        touch-action: auto;
      }
      .bft-body {
        gap: 7px;
        padding: 8px;
        max-height: calc(min(72dvh, 540px) - 42px);
      }
      .bft-input {
        min-height: 76px;
      }
      .bft-button,
      .bft-select {
        min-height: 34px;
      }
      .bft-tool-row .bft-button,
      .bft-control-row .bft-button {
        flex: 1 1 calc(33.333% - 6px);
        padding: 5px 6px;
        font-size: 12px;
      }
      .bft-control-row .bft-button {
        flex-basis: calc(50% - 6px);
      }
      .bft-tool-group .bft-button {
        flex: 1 1 calc(50% - 6px);
      }
      .bft-status {
        padding: 7px;
      }
      .bft-row {
        gap: 6px;
      }
      .bft-collapsed {
        left: auto;
        right: 8px;
        width: auto;
        min-width: 88px;
        border-radius: 8px;
      }
    }
    @media (min-width: 721px) and (max-width: 1024px) {
      #${panelId} {
        right: 12px;
        top: 72px;
        width: min(360px, calc(100vw - 24px));
        max-height: calc(100vh - 90px);
      }
      .bft-body {
        max-height: calc(100vh - 130px);
      }
      .bft-button,
      .bft-select {
        min-height: 32px;
      }
      .bft-tool-group .bft-button {
        flex: 1 1 calc(50% - 6px);
      }
    }
  `;
    document.head.append(style);
  }
  function createButton(label, onClick, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `bft-button ${className}`.trim();
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }
  function getStatusText() {
    const exercise = getCurrentExercise();
    if (runtime.mode === "complete") {
      return "训练完成";
    }
    if (!exercise) {
      return exercises.length > 0 ? "准备开始" : "请先录入动作";
    }
    if (runtime.mode === "rest") {
      return `休息 ${runtime.restRemaining}s`;
    }
    if (runtime.mode === "paused") {
      return "已暂停";
    }
    if (runtime.mode === "exercise") {
      return `动作中：第 ${runtime.setIndex + 1}/${exercise.sets} 组`;
    }
    return "准备开始";
  }
  function createSection(titleText, isCollapsed, onToggle, children) {
    const section = document.createElement("section");
    section.className = `bft-section ${isCollapsed ? "bft-section-collapsed" : ""}`.trim();
    const header = document.createElement("div");
    header.className = "bft-section-head";
    const title = document.createElement("strong");
    title.textContent = titleText;
    header.append(title, createButton(isCollapsed ? "展开" : "折叠", onToggle));
    section.append(header);
    if (!isCollapsed) {
      const body = document.createElement("div");
      body.className = "bft-section-body";
      body.append(...children);
      section.append(body);
    }
    return section;
  }
  function createToolGroup(labelText, buttons) {
    const group = document.createElement("div");
    group.className = "bft-tool-group";
    const label = document.createElement("span");
    label.className = "bft-tool-label";
    label.textContent = labelText;
    const buttonRow = document.createElement("div");
    buttonRow.className = "bft-row";
    buttonRow.append(...buttons);
    group.append(label, buttonRow);
    return group;
  }
  function render(options = {}) {
    let panel = document.getElementById(panelId);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = panelId;
      document.body.append(panel);
    }
    panel.className = collapsed ? "bft-collapsed" : "";
    applyPanelPosition(panel);
    const parseResult = parsePlan(rawInput);
    if (parseResult.errors.length === 0) {
      exercises = parseResult.exercises;
    }
    if (selectedStartIndex >= exercises.length) {
      selectedStartIndex = Math.max(0, exercises.length - 1);
    }
    if (runtime.exerciseIndex >= exercises.length) {
      runtime.exerciseIndex = 0;
      runtime.setIndex = 0;
      if (runtime.mode !== "complete") {
        runtime.mode = "idle";
      }
    }
    panel.replaceChildren();
    const header = document.createElement("div");
    header.className = "bft-header";
    const title = document.createElement("div");
    title.className = "bft-title";
    title.textContent = "健身计时器";
    const collapseButton = createButton(collapsed ? "展开" : "收起", () => {
      collapsed = !collapsed;
      render();
    });
    header.append(title, collapseButton);
    setupPanelDrag(header, panel);
    const body = document.createElement("div");
    body.className = "bft-body";
    const controlStack = document.createElement("div");
    controlStack.className = "bft-control-stack";
    const status = document.createElement("div");
    status.className = "bft-status";
    const current = getCurrentExercise();
    const statusTitle = document.createElement("strong");
    statusTitle.textContent = getStatusText();
    const statusDetail = document.createElement("span");
    statusDetail.className = "bft-muted";
    statusDetail.textContent = current ? `${current.name} · ${formatTimestamp(current.start)}-${formatTimestamp(current.end)} · ${current.minReps}${current.maxReps === current.minReps ? "" : `-${current.maxReps}`} 次` : `${exercises.length} 个动作`;
    const saveStatus = document.createElement("span");
    saveStatus.className = "bft-muted";
    saveStatus.textContent = saveStatusText;
    status.append(statusTitle, statusDetail, saveStatus);
    const textarea = document.createElement("textarea");
    textarea.className = "bft-input";
    textarea.placeholder = "俯卧撑 00:12-00:28 3x8-12 rest45";
    textarea.value = rawInput;
    textarea.addEventListener("input", () => {
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      rawInput = textarea.value;
      runtime.mode = runtime.mode === "complete" ? "idle" : runtime.mode;
      savePlan();
      render({
        restoreTextarea: {
          selectionStart,
          selectionEnd
        }
      });
    });
    const onlineImportButton = createButton("在线导入", () => {
      void importPlanFromOnline();
    });
    onlineImportButton.disabled = onlineImportBusy;
    const saveButton = createButton("保存", () => {
      savePlan("已手动保存");
      render();
    }, "bft-primary");
    const insertGroup = createToolGroup("时间", [
      createButton("插入开始", () => insertCurrentTime("start")),
      createButton("插入结束", () => insertCurrentTime("end"))
    ]);
    const templateGroup = createToolGroup("模板", [
      createButton("示例", () => {
        rawInput = "俯卧撑 00:12-00:28 3x8-12 rest45\n深蹲 01:05-01:22 4x10 rest60";
        savePlan();
        render();
      })
    ]);
    const fileGroup = createToolGroup("数据", [
      createButton("导出", exportPlan),
      createButton("导入", openImportPicker),
      onlineImportButton,
      saveButton
    ]);
    const settingsRow = document.createElement("div");
    settingsRow.className = "bft-row";
    const beepLabel = document.createElement("label");
    beepLabel.className = "bft-row";
    const beepText = document.createElement("span");
    beepText.textContent = "提示音";
    const beepSelect = document.createElement("select");
    beepSelect.className = "bft-select";
    [1, 2, 3, 5].forEach((value) => {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = `${value}s`;
      option.selected = settings.beepDuration === value;
      beepSelect.append(option);
    });
    beepSelect.addEventListener("change", () => {
      settings.beepDuration = Number(beepSelect.value);
      savePlan();
    });
    beepLabel.append(beepText, beepSelect);
    const pauseLabel = document.createElement("label");
    pauseLabel.className = "bft-check";
    const pauseInput = document.createElement("input");
    pauseInput.type = "checkbox";
    pauseInput.checked = settings.pauseDuringRest;
    pauseInput.addEventListener("change", () => {
      settings.pauseDuringRest = pauseInput.checked;
      savePlan();
    });
    pauseLabel.append(pauseInput, document.createTextNode("休息暂停视频"));
    settingsRow.append(beepLabel, pauseLabel);
    const startPickerRow = document.createElement("div");
    startPickerRow.className = "bft-row";
    const startPickerLabel = document.createElement("label");
    startPickerLabel.className = "bft-row bft-grow";
    const startPickerText = document.createElement("span");
    startPickerText.textContent = "从动作";
    const startPicker = document.createElement("select");
    startPicker.className = "bft-select bft-grow";
    startPicker.disabled = exercises.length === 0 || runtime.mode !== "idle" && runtime.mode !== "complete";
    exercises.forEach((exercise, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${index + 1}. ${exercise.name}`;
      option.selected = index === selectedStartIndex;
      startPicker.append(option);
    });
    startPicker.addEventListener("change", () => {
      selectedStartIndex = Number(startPicker.value);
      if (runtime.mode === "idle") {
        runtime.exerciseIndex = selectedStartIndex;
        runtime.setIndex = 0;
      }
      render();
    });
    startPickerLabel.append(startPickerText, startPicker);
    startPickerRow.append(startPickerLabel);
    const controls = document.createElement("div");
    controls.className = "bft-row bft-control-row";
    const startButton = createButton("开始训练", startTraining, "bft-primary");
    startButton.disabled = exercises.length === 0;
    const completeButton = createButton("完成本组", completeSet, "bft-primary");
    completeButton.disabled = runtime.mode !== "exercise";
    const skipButton = createButton("跳过休息", () => skipRest(false));
    skipButton.disabled = runtime.mode !== "rest";
    const pauseButton = createButton(runtime.mode === "paused" ? "继续" : "暂停", togglePause);
    pauseButton.disabled = runtime.mode === "idle" || runtime.mode === "complete";
    const resetButton = createButton("重置", () => {
      clearRestTimer();
      runtime = {
        mode: "idle",
        exerciseIndex: selectedStartIndex,
        setIndex: 0,
        restRemaining: 0,
        beforePauseMode: "idle"
      };
      video == null ? void 0 : video.pause();
      render();
    }, "bft-danger");
    controls.append(startButton, completeButton, skipButton, pauseButton, resetButton);
    const list = document.createElement("ul");
    list.className = "bft-list";
    exercises.forEach((exercise, index) => {
      const itemWrapper = document.createElement("li");
      const item = document.createElement("button");
      item.type = "button";
      item.className = [
        "bft-item",
        index === runtime.exerciseIndex && runtime.mode !== "idle" ? "bft-item-active" : "",
        index === selectedStartIndex ? "bft-item-selected" : ""
      ].filter(Boolean).join(" ");
      item.disabled = runtime.mode !== "idle" && runtime.mode !== "complete";
      item.addEventListener("click", () => {
        selectedStartIndex = index;
        runtime.exerciseIndex = index;
        runtime.setIndex = 0;
        if (video) {
          video.currentTime = exercise.start;
        }
        if (runtime.mode === "complete") {
          runtime.mode = "idle";
        }
        render();
      });
      const name = document.createElement("strong");
      name.textContent = exercise.name;
      const meta = document.createElement("span");
      meta.className = "bft-muted";
      meta.textContent = `${formatTimestamp(exercise.start)}-${formatTimestamp(exercise.end)} · ${exercise.sets} 组 · ${exercise.minReps}${exercise.maxReps === exercise.minReps ? "" : `-${exercise.maxReps}`} 次 · 休息 ${exercise.restSeconds}s`;
      item.append(name, meta);
      itemWrapper.append(item);
      list.append(itemWrapper);
    });
    if (exercises.length === 0) {
      const empty = document.createElement("li");
      empty.className = "bft-empty";
      empty.textContent = "暂无有效动作";
      list.append(empty);
    }
    controlStack.append(status, settingsRow, startPickerRow, controls);
    body.append(controlStack);
    const inputChildren = [textarea, insertGroup, templateGroup, fileGroup];
    if (parseResult.errors.length > 0) {
      const errorBox = document.createElement("div");
      errorBox.className = "bft-error";
      parseResult.errors.forEach((error) => {
        const line = document.createElement("span");
        line.textContent = error;
        errorBox.append(line);
      });
      inputChildren.push(errorBox);
    }
    body.append(
      createSection("数据录入", inputCollapsed, () => {
        inputCollapsed = !inputCollapsed;
        savePreferences();
        render();
      }, inputChildren),
      createSection(`动作预览 · ${exercises.length}`, previewCollapsed, () => {
        previewCollapsed = !previewCollapsed;
        savePreferences();
        render();
      }, [list])
    );
    panel.append(header, body);
    applyPanelPosition(panel);
    if (options.restoreTextarea && !inputCollapsed) {
      textarea.focus();
      textarea.setSelectionRange(
        options.restoreTextarea.selectionStart,
        options.restoreTextarea.selectionEnd
      );
    }
  }
  function insertCurrentTime(kind) {
    const timestamp = formatTimestamp((video == null ? void 0 : video.currentTime) ?? 0);
    const line = kind === "start" ? `动作 ${timestamp}-` : `${timestamp} 3x8-12 rest45`;
    rawInput = rawInput ? `${rawInput.trimEnd()}${kind === "start" ? "\n" : ""}${line}` : line;
    savePlan();
    render();
  }
  function resetRuntime() {
    runtime = {
      mode: "idle",
      exerciseIndex: selectedStartIndex,
      setIndex: 0,
      restRemaining: 0,
      beforePauseMode: "idle"
    };
  }
  function teardownPanel() {
    var _a;
    clearRestTimer();
    (_a = document.getElementById(panelId)) == null ? void 0 : _a.remove();
    activeStorageKey = "";
    video = null;
    resetRuntime();
  }
  function setupNavigationWatcher() {
    if (navigationWatcherId !== void 0) {
      return;
    }
    navigationWatcherId = window.setInterval(() => {
      const bvid = getCurrentBvid();
      if (!bvid) {
        if (document.getElementById(panelId)) {
          teardownPanel();
        }
        return;
      }
      const key = getStorageKey();
      if (!document.getElementById(panelId)) {
        void init();
        return;
      }
      if (key === activeStorageKey || navigationReloadInProgress) {
        return;
      }
      void (async () => {
        navigationReloadInProgress = true;
        try {
          const nextVideo = document.querySelector("video") ?? await waitForVideo(5e3);
          if (!nextVideo) {
            teardownPanel();
            return;
          }
          activeStorageKey = key;
          const plan = loadPlan();
          rawInput = plan.rawInput;
          settings = plan.settings;
          exercises = plan.savedExercises;
          selectedStartIndex = 0;
          clearRestTimer();
          resetRuntime();
          video = nextVideo;
          setLoopGuard(video);
          render();
        } finally {
          navigationReloadInProgress = false;
        }
      })();
    }, 1e3);
  }
  function setupViewportWatcher() {
    if (viewportWatcherReady) {
      return;
    }
    viewportWatcherReady = true;
    window.addEventListener("resize", () => {
      const panel = document.getElementById(panelId);
      if (!panel) {
        return;
      }
      applyPanelPosition(panel);
      if (!isMobileViewport()) {
        savePreferences();
      }
    });
  }
  async function init() {
    if (initInProgress || document.getElementById(panelId)) {
      return;
    }
    if (!getCurrentBvid()) {
      return;
    }
    initInProgress = true;
    try {
      const nextVideo = await waitForVideo();
      if (!nextVideo || !getCurrentBvid()) {
        return;
      }
      activeStorageKey = getStorageKey();
      const plan = loadPlan();
      const preferences = loadPreferences();
      rawInput = plan.rawInput;
      settings = plan.settings;
      exercises = plan.savedExercises;
      inputCollapsed = preferences.inputCollapsed;
      previewCollapsed = preferences.previewCollapsed;
      panelPosition = preferences.panelPosition;
      selectedStartIndex = 0;
      resetRuntime();
      video = nextVideo;
      injectStyle();
      setLoopGuard(video);
      render();
    } finally {
      initInProgress = false;
    }
  }
  setupNavigationWatcher();
  setupViewportWatcher();
  void init();
})();
