// ==UserScript==
// @name         Bilibili Fitness Timer
// @namespace    https://github.com/RyanChouHua/bili-fitness-timer
// @version      0.4.18
// @description  Turn Bilibili video clips into workout intervals with sets and rest timers.
// @match        https://www.bilibili.com/*
// @match        https://m.bilibili.com/*
// @match        https://bilibili.com/*
// @downloadURL  https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.user.js
// @updateURL    https://raw.githubusercontent.com/RyanChouHua/bili-fitness-timer/main/dist/bili-fitness-timer.meta.js
// @supportURL   https://github.com/RyanChouHua/bili-fitness-timer/issues
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  "use strict";
  const planStoragePrefix = "bili-fitness-timer:";
  const defaultPreferencesStorageKey = `${planStoragePrefix}preferences`;
  const timestampLibraryBaseUrl = "https://github.com/RyanChouHua/bili-fitness-timer/raw/refs/heads/main/timestamps";
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
  function getPlanStorageKey(id) {
    return `${planStoragePrefix}${id}`;
  }
  function booleanPreference(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
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
  function normalizeOptionalText(value) {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  function normalizeImportedPlanGroup(value) {
    if (!value || typeof value !== "object") {
      throw new Error("子分组必须是对象");
    }
    const payload = value;
    const exercises2 = normalizeExerciseList(payload.exercises);
    const savedExercises = normalizeExerciseList(payload.savedExercises);
    const importedExercises = exercises2.length > 0 ? exercises2 : savedExercises;
    const rawInput2 = typeof payload.rawInput === "string" && payload.rawInput.trim() ? payload.rawInput : serializeExercises(importedExercises);
    if (!rawInput2.trim() && importedExercises.length === 0) {
      throw new Error("子分组缺少 rawInput 或 exercises");
    }
    return {
      id: normalizeOptionalText(payload.id),
      title: normalizeOptionalText(payload.title),
      author: normalizeOptionalText(payload.author),
      notes: normalizeOptionalText(payload.notes),
      rawInput: rawInput2,
      exercises: importedExercises,
      settings: payload.settings ?? null
    };
  }
  function normalizeImportedPlanData(value) {
    if (!value || typeof value !== "object") {
      throw new Error("JSON 必须是对象");
    }
    const payload = value;
    const groups = Array.isArray(payload.groups) ? payload.groups.map((group, index) => {
      try {
        return normalizeImportedPlanGroup(group);
      } catch (error) {
        const message = error instanceof Error ? error.message : "格式错误";
        throw new Error(`第 ${index + 1} 个子分组：${message}`);
      }
    }) : [normalizeImportedPlanGroup(value)];
    if (groups.length === 0) {
      throw new Error("JSON 缺少子分组");
    }
    const firstGroup = groups[0];
    return {
      bvid: typeof payload.bvid === "string" ? normalizeBvid(payload.bvid) : null,
      title: normalizeOptionalText(payload.title),
      author: normalizeOptionalText(payload.author),
      notes: normalizeOptionalText(payload.notes),
      rawInput: firstGroup.rawInput,
      exercises: firstGroup.exercises,
      groups
    };
  }
  const panelId = "bili-fitness-timer-panel";
  const styleId = "bili-fitness-timer-style";
  const preferencesStorageKey = defaultPreferencesStorageKey;
  const defaultSettings = {
    beepDuration: 2,
    pauseDuringRest: true
  };
  const groupPageSize = 4;
  let video = null;
  let exercises = [];
  let rawInput = "";
  let settings = { ...defaultSettings };
  let collapsed = false;
  let previewLocked = true;
  let inputCollapsed = false;
  let activeWorkTab = "groups";
  let groupPage = 0;
  let selectedStartIndex = 0;
  let panelPosition = null;
  let panelSize = null;
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
  let activeGroupId = "";
  let activePlanTitle = "";
  let activePlanAuthor = "";
  let activePlanNotes = "";
  let planGroups = [];
  let pendingPlanInfoFocus = false;
  let initInProgress = false;
  let navigationReloadInProgress = false;
  const guardedVideos = /* @__PURE__ */ new WeakSet();
  function getCurrentBvid() {
    return extractBvidFromUrl(location.href);
  }
  function getCurrentStorageId() {
    return getCurrentBvid() ?? location.pathname;
  }
  function getStorageKey() {
    return getPlanStorageKey(getCurrentStorageId());
  }
  function createGroupId() {
    const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return `group-${random}`;
  }
  function optionalText(value) {
    if (typeof value !== "string") {
      return void 0;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : void 0;
  }
  function normalizeWorkTab(value) {
    return value === "groups" || value === "preview" || value === "settings" ? value : "groups";
  }
  function createEmptyGroup(title = "子分组 1") {
    const now = Date.now();
    return {
      id: createGroupId(),
      rawInput: "",
      settings: { ...defaultSettings },
      savedExercises: [],
      bvid: getCurrentBvid(),
      title,
      createdAt: now,
      updatedAt: now
    };
  }
  function normalizeStoredPlan(value, fallbackTitle, index = 0) {
    var _a, _b;
    if (!value || typeof value !== "object") {
      return null;
    }
    const parsed = value;
    const savedExercises = normalizeExerciseList(parsed.savedExercises);
    const id = optionalText(parsed.id) ?? `legacy-${index + 1}`;
    const title = optionalText(parsed.title) ?? fallbackTitle;
    return {
      id,
      rawInput: typeof parsed.rawInput === "string" ? parsed.rawInput : serializeExercises(savedExercises),
      settings: {
        beepDuration: typeof ((_a = parsed.settings) == null ? void 0 : _a.beepDuration) === "number" ? parsed.settings.beepDuration : defaultSettings.beepDuration,
        pauseDuringRest: typeof ((_b = parsed.settings) == null ? void 0 : _b.pauseDuringRest) === "boolean" ? parsed.settings.pauseDuringRest : defaultSettings.pauseDuringRest
      },
      savedExercises,
      bvid: typeof parsed.bvid === "string" ? normalizeBvid(parsed.bvid) : getCurrentBvid(),
      title,
      author: optionalText(parsed.author),
      notes: optionalText(parsed.notes),
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : void 0,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : void 0
    };
  }
  function createLibraryFromLegacy(parsed) {
    const legacyGroup = normalizeStoredPlan(parsed, document.title || getCurrentStorageId()) ?? createEmptyGroup();
    activeGroupId = legacyGroup.id;
    return {
      schemaVersion: 2,
      bvid: getCurrentBvid(),
      activeGroupId: legacyGroup.id,
      groups: [legacyGroup],
      updatedAt: legacyGroup.updatedAt
    };
  }
  function loadPlanLibrary() {
    const fallbackGroup = createEmptyGroup();
    const fallback = {
      schemaVersion: 2,
      bvid: getCurrentBvid(),
      activeGroupId: fallbackGroup.id,
      groups: [fallbackGroup],
      updatedAt: fallbackGroup.updatedAt
    };
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (!saved) {
        return fallback;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.groups)) {
        return createLibraryFromLegacy(parsed);
      }
      const groups = parsed.groups.map((group, index) => normalizeStoredPlan(group, `子分组 ${index + 1}`, index)).filter((group) => group !== null);
      if (groups.length === 0) {
        return fallback;
      }
      const activeId = optionalText(parsed.activeGroupId);
      const activeGroupId2 = activeId && groups.some((group) => group.id === activeId) ? activeId : groups[0].id;
      return {
        schemaVersion: 2,
        bvid: typeof parsed.bvid === "string" ? normalizeBvid(parsed.bvid) : getCurrentBvid(),
        activeGroupId: activeGroupId2,
        groups,
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : void 0
      };
    } catch {
      return fallback;
    }
  }
  function getActiveGroup(library = planGroups) {
    return library.find((group) => group.id === activeGroupId) ?? library[0] ?? null;
  }
  function applyPlanGroup(group, groups = planGroups) {
    planGroups = groups;
    activeGroupId = group.id;
    groupPage = Math.floor(Math.max(0, groups.findIndex((item) => item.id === group.id)) / groupPageSize);
    rawInput = group.rawInput;
    settings = group.settings;
    exercises = group.savedExercises;
    activePlanTitle = group.title ?? document.title;
    activePlanAuthor = group.author ?? "";
    activePlanNotes = group.notes ?? "";
    selectedStartIndex = 0;
    clearRestTimer();
    resetRuntime();
  }
  function loadPlan() {
    const library = loadPlanLibrary();
    planGroups = library.groups;
    activeGroupId = library.activeGroupId;
    groupPage = Math.floor(Math.max(0, planGroups.findIndex((group) => group.id === activeGroupId)) / groupPageSize);
    return getActiveGroup(library.groups) ?? createEmptyGroup();
  }
  function savePlan(statusText = "已自动保存", nextActiveGroupId = activeGroupId) {
    var _a;
    const parseResult = parsePlan(rawInput);
    const savedExercises = parseResult.errors.length === 0 ? parseResult.exercises : exercises;
    const now = Date.now();
    let hasActiveGroup = false;
    const nextGroups = planGroups.map((group) => {
      if (group.id !== nextActiveGroupId) {
        return group;
      }
      hasActiveGroup = true;
      return {
        ...group,
        rawInput,
        settings,
        savedExercises,
        bvid: getCurrentBvid(),
        title: activePlanTitle || group.title || document.title || getCurrentStorageId(),
        author: optionalText(activePlanAuthor),
        notes: optionalText(activePlanNotes),
        createdAt: group.createdAt ?? now,
        updatedAt: now
      };
    });
    if (!hasActiveGroup) {
      nextGroups.push({
        ...createEmptyGroup(activePlanTitle || "子分组 1"),
        id: nextActiveGroupId || createGroupId(),
        rawInput,
        settings,
        savedExercises,
        author: optionalText(activePlanAuthor),
        notes: optionalText(activePlanNotes),
        updatedAt: now
      });
    }
    planGroups = nextGroups;
    activeGroupId = nextActiveGroupId || ((_a = nextGroups[0]) == null ? void 0 : _a.id) || "";
    localStorage.setItem(
      getStorageKey(),
      JSON.stringify({
        schemaVersion: 2,
        bvid: getCurrentBvid(),
        activeGroupId,
        groups: nextGroups,
        updatedAt: now
      })
    );
    saveStatusText = parseResult.errors.length === 0 ? statusText : "输入有错误，已保留上次有效动作";
  }
  function persistPlanLibrary(statusText = "已保存分组") {
    localStorage.setItem(
      getStorageKey(),
      JSON.stringify({
        schemaVersion: 2,
        bvid: getCurrentBvid(),
        activeGroupId,
        groups: planGroups,
        updatedAt: Date.now()
      })
    );
    saveStatusText = statusText;
  }
  function loadPreferences() {
    try {
      const saved = localStorage.getItem(preferencesStorageKey);
      if (!saved) {
        return {
          panelPosition: null,
          panelSize: null,
          previewLocked: true,
          activeTab: "groups",
          inputCollapsed: false
        };
      }
      const parsed = JSON.parse(saved);
      const position = parsed.panelPosition;
      const size = parsed.panelSize;
      const nextPreferences = {
        panelPosition: null,
        panelSize: null,
        previewLocked: booleanPreference(parsed.previewLocked, true),
        activeTab: normalizeWorkTab(parsed.activeTab),
        inputCollapsed: booleanPreference(parsed.inputCollapsed, false)
      };
      if (position && typeof position.left === "number" && typeof position.top === "number") {
        nextPreferences.panelPosition = {
          left: position.left,
          top: position.top
        };
      }
      if (size && typeof size.width === "number" && typeof size.height === "number") {
        const savedSize = {
          width: size.width,
          height: size.height
        };
        if (savedSize.width > 540) {
          nextPreferences.panelPosition = null;
        } else {
          nextPreferences.panelSize = savedSize;
        }
      }
      return nextPreferences;
    } catch {
      return {
        panelPosition: null,
        panelSize: null,
        previewLocked: true,
        activeTab: "groups",
        inputCollapsed: false
      };
    }
    return {
      panelPosition: null,
      panelSize: null,
      previewLocked: true,
      activeTab: "groups",
      inputCollapsed: false
    };
  }
  function savePreferences() {
    localStorage.setItem(
      preferencesStorageKey,
      JSON.stringify({
        panelPosition,
        panelSize,
        previewLocked,
        activeTab: activeWorkTab,
        inputCollapsed
      })
    );
  }
  function isMobileViewport() {
    return window.matchMedia("(max-width: 640px)").matches;
  }
  function getPanelSizeLimits() {
    const margin = 10;
    const minWidth = Math.min(360, Math.max(280, window.innerWidth - margin * 2));
    const maxWidth = Math.max(minWidth, Math.min(540, window.innerWidth - margin * 2));
    const minHeight = Math.min(360, Math.max(280, window.innerHeight - margin * 2));
    return {
      minWidth,
      minHeight,
      maxWidth,
      maxHeight: Math.max(minHeight, window.innerHeight - margin * 2)
    };
  }
  function clampPanelSize(size) {
    const limits = getPanelSizeLimits();
    return {
      width: Math.min(Math.max(size.width, limits.minWidth), limits.maxWidth),
      height: Math.min(Math.max(size.height, limits.minHeight), limits.maxHeight)
    };
  }
  function applyPanelSize(panel) {
    if (collapsed || isMobileViewport() || !panelSize) {
      panel.style.width = "";
      panel.style.height = "";
      return;
    }
    const nextSize = clampPanelSize(panelSize);
    panelSize = nextSize;
    panel.style.width = `${nextSize.width}px`;
    panel.style.height = `${nextSize.height}px`;
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
      applyPanelSize(panel);
      panel.style.left = "";
      panel.style.right = "";
      panel.style.top = "";
      panel.style.bottom = "";
      return;
    }
    applyPanelSize(panel);
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
      if (collapsed || isMobileViewport() || event.button !== 0) {
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
  function setupPanelResize(handle, panel) {
    handle.addEventListener("pointerdown", (event) => {
      if (collapsed || isMobileViewport() || event.button !== 0) {
        return;
      }
      event.preventDefault();
      const startRect = panel.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      if (!panelPosition) {
        panelPosition = clampPanelPosition({ left: startRect.left, top: startRect.top }, panel);
        panel.style.left = `${panelPosition.left}px`;
        panel.style.top = `${panelPosition.top}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      }
      handle.setPointerCapture(event.pointerId);
      panel.classList.add("bft-resizing");
      const handleMove = (moveEvent) => {
        const nextSize = clampPanelSize({
          width: startRect.width + moveEvent.clientX - startX,
          height: startRect.height + moveEvent.clientY - startY
        });
        panelSize = nextSize;
        panel.style.width = `${nextSize.width}px`;
        panel.style.height = `${nextSize.height}px`;
        if (panelPosition) {
          const nextPosition = clampPanelPosition(panelPosition, panel);
          panelPosition = nextPosition;
          panel.style.left = `${nextPosition.left}px`;
          panel.style.top = `${nextPosition.top}px`;
          panel.style.right = "auto";
          panel.style.bottom = "auto";
        }
      };
      const handleUp = (upEvent) => {
        handle.releasePointerCapture(upEvent.pointerId);
        panel.classList.remove("bft-resizing");
        handle.removeEventListener("pointermove", handleMove);
        handle.removeEventListener("pointerup", handleUp);
        handle.removeEventListener("pointercancel", handleUp);
        savePreferences();
      };
      handle.addEventListener("pointermove", handleMove);
      handle.addEventListener("pointerup", handleUp);
      handle.addEventListener("pointercancel", handleUp);
    });
  }
  function exportPlan() {
    savePlan("已导出前自动保存");
    const parseResult = parsePlan(rawInput);
    const savedExercises = parseResult.errors.length === 0 ? parseResult.exercises : exercises;
    const nextGroups = planGroups.map(
      (group) => group.id === activeGroupId ? {
        ...group,
        rawInput,
        settings,
        savedExercises,
        title: activePlanTitle || group.title,
        author: optionalText(activePlanAuthor),
        notes: optionalText(activePlanNotes)
      } : group
    );
    const payload = {
      bvid: getCurrentBvid(),
      title: document.title || getCurrentStorageId(),
      activeGroupId,
      groups: nextGroups.map((group) => ({
        id: group.id,
        title: group.title,
        author: group.author,
        notes: group.notes,
        rawInput: group.rawInput,
        settings: group.settings,
        savedExercises: group.id === activeGroupId ? savedExercises : group.savedExercises,
        exercises: group.id === activeGroupId ? savedExercises : group.savedExercises,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      })),
      updatedAt: Date.now()
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
  function normalizeImportedSettings(value, fallback) {
    if (!value || typeof value !== "object") {
      return { ...fallback };
    }
    const parsed = value;
    return {
      beepDuration: typeof parsed.beepDuration === "number" ? parsed.beepDuration : fallback.beepDuration,
      pauseDuringRest: typeof parsed.pauseDuringRest === "boolean" ? parsed.pauseDuringRest : fallback.pauseDuringRest
    };
  }
  function createStoredPlanFromImportedGroup(group, importedBvid, fallbackTitle) {
    const now = Date.now();
    return {
      id: createGroupId(),
      rawInput: group.rawInput,
      settings: normalizeImportedSettings(group.settings, settings),
      savedExercises: group.exercises,
      bvid: importedBvid ?? getCurrentBvid(),
      title: group.title ?? fallbackTitle,
      author: group.author ?? void 0,
      notes: group.notes ?? void 0,
      createdAt: now,
      updatedAt: now
    };
  }
  function addImportedPlanGroups(imported, fallbackTitle, statusText) {
    const importedGroups = imported.groups.map(
      (group, index) => createStoredPlanFromImportedGroup(
        group,
        imported.bvid,
        imported.groups.length === 1 ? imported.title ?? fallbackTitle : group.title ?? `${fallbackTitle} ${index + 1}`
      )
    );
    const nextActiveGroup = importedGroups[0];
    if (!nextActiveGroup) {
      saveStatusText = "未找到可导入的子分组";
      render();
      return;
    }
    planGroups = [...planGroups, ...importedGroups];
    applyPlanGroup(nextActiveGroup, planGroups);
    const parseResult = parsePlan(rawInput);
    exercises = parseResult.errors.length === 0 ? parseResult.exercises : nextActiveGroup.savedExercises;
    savePlan(`${statusText} ${importedGroups.length} 个子分组`, nextActiveGroup.id);
    render();
  }
  async function importPlanFromFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = normalizeImportedPlanData(parsed);
    addImportedPlanGroups(
      imported,
      file.name.replace(/\.json$/i, ""),
      "已导入本地 JSON："
    );
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
      for (const group of imported.groups) {
        const parseResult = parsePlan(group.rawInput);
        if (parseResult.errors.length > 0) {
          throw new Error(`${group.title ?? "子分组"} 时间戳格式错误：${parseResult.errors[0]}`);
        }
      }
      addImportedPlanGroups(imported, document.title, `已在线导入 ${bvid}：`);
    } catch (error) {
      saveStatusText = error instanceof Error ? error.message : "在线导入失败";
    } finally {
      onlineImportBusy = false;
      if (!document.getElementById(panelId)) {
        return;
      }
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
  function activateGroup(groupId, statusText) {
    const group = planGroups.find((item) => item.id === groupId);
    if (!group) {
      saveStatusText = "未找到当前视频下的子分组";
      return false;
    }
    if (group.id === activeGroupId) {
      saveStatusText = statusText;
      return true;
    }
    savePlan("已保存当前子分组");
    const latestGroup = planGroups.find((item) => item.id === groupId);
    if (!latestGroup) {
      return false;
    }
    applyPlanGroup(latestGroup, planGroups);
    persistPlanLibrary(statusText);
    return true;
  }
  function switchToGroup(groupId) {
    activateGroup(groupId, "已切换当前视频子分组");
    render();
  }
  function editGroup(groupId) {
    if (activateGroup(groupId, "可在下方修改标题、作者和备注")) {
      pendingPlanInfoFocus = true;
    }
    render();
  }
  function createNewGroup() {
    savePlan("已保存当前子分组");
    const group = createEmptyGroup(`子分组 ${planGroups.length + 1}`);
    planGroups = [...planGroups, group];
    applyPlanGroup(group, planGroups);
    persistPlanLibrary("已创建并切换到空白子分组");
    render();
  }
  function duplicateCurrentGroup() {
    savePlan("已保存当前子分组");
    const current = getActiveGroup();
    if (!current) {
      return;
    }
    const now = Date.now();
    const nextTitle = `${current.title ?? "子分组"} 副本`;
    const group = {
      ...current,
      id: createGroupId(),
      title: nextTitle,
      createdAt: now,
      updatedAt: now
    };
    planGroups = [...planGroups, group];
    applyPlanGroup(group, planGroups);
    persistPlanLibrary(`已复制并切换到：${nextTitle}`);
    render();
  }
  function deleteGroup(groupId) {
    const target = planGroups.find((group) => group.id === groupId);
    if (!target) {
      saveStatusText = "未找到要删除的子分组";
      render();
      return;
    }
    if (planGroups.length <= 1) {
      window.alert("当前视频至少保留一个子分组");
      return;
    }
    const label = target.title ?? "当前子分组";
    if (!window.confirm(`删除当前视频子分组：${label}？`)) {
      return;
    }
    const wasActive = target.id === activeGroupId;
    const currentPage = groupPage;
    savePlan("已保存当前子分组");
    const targetIndex = planGroups.findIndex((group) => group.id === target.id);
    const nextGroups = planGroups.filter((group) => group.id !== target.id);
    if (nextGroups.length === 0) {
      return;
    }
    planGroups = nextGroups;
    if (wasActive) {
      const nextIndex = Math.min(Math.max(targetIndex, 0), nextGroups.length - 1);
      applyPlanGroup(nextGroups[nextIndex], planGroups);
    } else {
      const totalPages = Math.max(1, Math.ceil(planGroups.length / groupPageSize));
      groupPage = Math.min(Math.max(currentPage, 0), totalPages - 1);
    }
    persistPlanLibrary(wasActive ? "已删除当前子分组并切换到相邻子分组" : "已删除子分组");
    render();
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
    activeWorkTab = "preview";
    savePreferences();
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
  function resetTraining() {
    if (runtime.mode !== "idle" && runtime.mode !== "complete" && !window.confirm("确认重置当前训练进度？")) {
      return;
    }
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
  }
  function switchToExercise(index) {
    const exercise = exercises[index];
    if (!exercise) {
      return;
    }
    selectedStartIndex = index;
    clearRestTimer();
    runtime.exerciseIndex = index;
    runtime.setIndex = 0;
    runtime.restRemaining = 0;
    if (video) {
      video.currentTime = exercise.start;
    }
    if (runtime.mode === "paused") {
      runtime.beforePauseMode = "exercise";
      render();
      return;
    }
    if (runtime.mode === "exercise" || runtime.mode === "rest") {
      runtime.mode = "exercise";
      playCurrentExercise();
      return;
    }
    if (runtime.mode === "complete") {
      runtime.mode = "idle";
    }
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
      --bft-bg: #111417;
      --bft-bg-raised: #151a1d;
      --bft-surface: #1a1f22;
      --bft-surface-2: #20262a;
      --bft-surface-3: #283034;
      --bft-line: rgba(244, 247, 246, 0.14);
      --bft-line-strong: rgba(244, 247, 246, 0.22);
      --bft-text: #f4f7f6;
      --bft-muted: #aab6b2;
      --bft-subtle: #76837e;
      --bft-primary: #aeb8a0;
      --bft-primary-strong: #c4ccb6;
      --bft-primary-ink: #111417;
      --bft-accent: #7bcbe6;
      --bft-accent-strong: #00aeec;
      --bft-rest: #d7efff;
      --bft-danger: #f28b82;
      --bft-danger-bg: rgba(242, 139, 130, 0.15);
      --bft-radius: 8px;
      --bft-touch: 48px;
      --bft-shadow: 0 22px 64px rgba(0, 0, 0, 0.46);
      --bft-focus: 0 0 0 3px rgba(123, 203, 230, 0.28);
      position: fixed;
      right: 10px;
      top: 10px;
      z-index: 2147483647;
      width: min(calc(100vw - 20px), clamp(430px, 48vw, 760px));
      height: min(780px, calc(100dvh - 20px));
      max-height: calc(100dvh - 20px);
      color: var(--bft-text);
      background:
        linear-gradient(180deg, rgba(26, 31, 34, 0.98), rgba(17, 20, 23, 0.985));
      border: 1px solid var(--bft-line-strong);
      border-radius: var(--bft-radius);
      box-shadow: var(--bft-shadow);
      font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", sans-serif;
      overflow: hidden;
      container-type: inline-size;
      color-scheme: dark;
      isolation: isolate;
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
    #${panelId} button,
    #${panelId} select,
    #${panelId} input,
    #${panelId} textarea {
      color-scheme: dark;
    }
    #${panelId} button {
      touch-action: manipulation;
    }
    .bft-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 58px;
      padding: 10px 12px;
      background: rgba(32, 38, 42, 0.92);
      border-bottom: 1px solid var(--bft-line);
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
      color: var(--bft-text);
    }
    .bft-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .bft-brand-mark {
      display: inline-grid;
      place-items: center;
      width: 30px;
      height: 30px;
      flex: 0 0 auto;
      color: #071316;
      background: linear-gradient(135deg, var(--bft-accent-strong), var(--bft-primary));
      border-radius: var(--bft-radius);
      font-size: 12px;
      font-weight: 800;
    }
    .bft-title-stack {
      display: grid;
      gap: 1px;
      min-width: 0;
    }
    .bft-subtitle {
      min-width: 0;
      color: var(--bft-muted);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 0 0 auto;
    }
    .bft-body {
      display: block;
      padding: 12px;
      height: calc(100% - 58px);
      overflow-x: hidden;
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .bft-collapsed .bft-body {
      display: none;
    }
    .bft-collapsed {
      width: auto !important;
      height: auto !important;
      min-width: 96px;
    }
    .bft-collapsed .bft-brand-mark,
    .bft-collapsed .bft-subtitle {
      display: none;
    }
    .bft-control-stack {
      display: grid;
      gap: 10px;
      z-index: 1;
      padding-bottom: 2px;
      min-height: 0;
      overflow: visible;
    }
    .bft-main-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
      align-content: start;
      height: auto;
      min-height: 0;
      overflow: visible;
    }
    .bft-main-left,
    .bft-main-right {
      display: grid;
      gap: 10px;
      align-content: start;
      min-width: 0;
      min-height: 0;
      height: auto;
      overflow: visible;
    }
    .bft-main-right {
      grid-template-rows: auto;
      align-content: stretch;
    }
    .bft-status {
      display: grid;
      gap: 10px;
      padding: 12px;
      background:
        linear-gradient(180deg, rgba(40, 48, 52, 0.76), rgba(26, 31, 34, 0.92));
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
    }
    .bft-status-rest {
      border-color: rgba(215, 239, 255, 0.34);
    }
    .bft-status-complete {
      border-color: rgba(174, 184, 160, 0.42);
    }
    .bft-status-hero {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .bft-progress-tile {
      display: grid;
      place-items: center;
      width: 62px;
      min-height: 62px;
      padding: 7px;
      color: var(--bft-primary-ink);
      background: var(--bft-primary);
      border-radius: var(--bft-radius);
      box-shadow: inset 0 -1px 0 rgba(17, 20, 23, 0.22);
    }
    .bft-progress-tile span {
      color: rgba(17, 20, 23, 0.72);
      font-size: 10px;
      line-height: 1;
    }
    .bft-progress-tile strong {
      color: var(--bft-primary-ink);
      font-size: 24px;
      line-height: 1.1;
      font-weight: 850;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bft-status-copy {
      display: grid;
      gap: 5px;
      min-width: 0;
    }
    .bft-status-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }
    .bft-status-title {
      min-width: 0;
      color: var(--bft-text);
      font-size: 21px;
      line-height: 1.12;
      font-weight: 820;
      overflow-wrap: anywhere;
    }
    .bft-status-detail {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .bft-save-pill {
      flex: 0 0 auto;
      max-width: 45%;
      padding: 4px 8px;
      color: var(--bft-primary-strong);
      border: 1px solid rgba(174, 184, 160, 0.34);
      border-radius: 999px;
      background: rgba(174, 184, 160, 0.1);
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-metric-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .bft-metric {
      display: grid;
      gap: 2px;
      min-width: 0;
      padding: 8px 9px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      background: rgba(17, 20, 23, 0.42);
    }
    .bft-metric span {
      min-width: 0;
      color: var(--bft-subtle);
      font-size: 10.5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-metric strong {
      min-width: 0;
      color: var(--bft-text);
      font-size: 14px;
      line-height: 1.22;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px;
      padding: 4px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      background: rgba(17, 20, 23, 0.42);
    }
    .bft-tab {
      min-width: 0;
      min-height: 34px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-color: transparent;
      background: transparent;
    }
    .bft-tab-active {
      color: var(--bft-primary-ink);
      background: var(--bft-primary);
      border-color: var(--bft-primary);
      font-weight: 700;
    }
    .bft-work-panel {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      min-height: 0;
      overflow: visible;
      padding: 10px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      background: rgba(26, 31, 34, 0.72);
    }
    .bft-tool-group {
      display: grid;
      gap: 7px;
    }
    .bft-tool-group .bft-button {
      flex: 1 1 0;
    }
    .bft-left-input {
      display: grid;
      gap: 9px;
      padding: 10px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      background: rgba(26, 31, 34, 0.72);
    }
    .bft-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      min-width: 0;
    }
    .bft-section-header strong {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-tool-label {
      font-size: 11px;
      color: var(--bft-subtle);
    }
    .bft-panel-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }
    .bft-heading-copy {
      display: grid;
      gap: 1px;
      min-width: 0;
    }
    .bft-heading-copy strong,
    .bft-heading-copy span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-heading-copy strong {
      font-size: 13px;
    }
    .bft-group-summary {
      display: grid;
      gap: 2px;
      padding: 8px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      background: rgba(17, 20, 23, 0.34);
      min-width: 0;
    }
    .bft-group-summary strong,
    .bft-group-summary span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-group-summary strong {
      font-size: 13px;
      line-height: 1.3;
    }
    .bft-field-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 6px;
    }
    .bft-field-actions {
      justify-content: flex-end;
    }
    .bft-field {
      display: grid;
      gap: 4px;
      min-width: 0;
    }
    .bft-field-label {
      font-size: 11px;
      color: var(--bft-subtle);
    }
    .bft-control-deck {
      display: grid;
      gap: 10px;
      align-content: start;
    }
    .bft-start-row {
      align-items: stretch;
    }
    .bft-start-picker {
      width: 100%;
    }
    .bft-primary-action-row {
      display: flex;
      justify-content: center;
    }
    .bft-primary-training-button {
      width: min(100%, 420px);
      min-height: 82px;
      font-size: 19px;
      letter-spacing: 0;
      box-shadow: 0 12px 28px rgba(174, 184, 160, 0.18);
    }
    .bft-resting-button:disabled {
      opacity: 0.9;
      cursor: default;
      color: #10202a;
      border-color: rgba(215, 239, 255, 0.5);
      background: var(--bft-rest);
    }
    .bft-control-row {
      justify-content: center;
    }
    .bft-control-row .bft-button {
      flex: 0 1 180px;
      min-width: 132px;
    }
    .bft-safety-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 7px;
      min-width: 0;
    }
    .bft-safety-row .bft-tool-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bft-reset-button {
      flex: 0 0 auto;
      min-width: 92px;
    }
    .bft-muted {
      color: var(--bft-muted);
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
      min-height: 98px;
      resize: vertical;
      color: var(--bft-text);
      background: rgba(17, 20, 23, 0.58);
      border: 1px solid var(--bft-line-strong);
      border-radius: var(--bft-radius);
      padding: 9px;
      outline: none;
      overflow-x: auto;
      white-space: pre;
      word-break: normal;
    }
    .bft-text-input {
      width: 100%;
      min-width: 0;
      min-height: 28px;
      color: var(--bft-text);
      background: rgba(17, 20, 23, 0.58);
      border: 1px solid var(--bft-line-strong);
      border-radius: var(--bft-radius);
      padding: 7px 9px;
      outline: none;
    }
    .bft-notes-input {
      min-height: 58px;
    }
    .bft-input:focus,
    .bft-text-input:focus,
    .bft-select:focus {
      border-color: var(--bft-accent);
      box-shadow: var(--bft-focus);
    }
    .bft-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 36px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      color: var(--bft-text);
      background: rgba(40, 48, 52, 0.78);
      padding: 7px 11px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1.18;
      text-align: center;
      white-space: nowrap;
      transition: background 120ms ease, border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
    }
    .bft-button:hover {
      background: rgba(48, 58, 63, 0.9);
    }
    .bft-button:active:not(:disabled) {
      transform: translateY(1px);
    }
    .bft-button:focus-visible {
      outline: none;
      box-shadow: var(--bft-focus);
    }
    .bft-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .bft-button.bft-resting-button:disabled {
      opacity: 0.9;
      cursor: default;
      color: #10202a;
      border-color: rgba(215, 239, 255, 0.5);
      background: var(--bft-rest);
    }
    .bft-primary {
      color: var(--bft-primary-ink);
      background: var(--bft-primary);
      border-color: var(--bft-primary);
      font-weight: 800;
    }
    .bft-primary:hover {
      background: var(--bft-primary-strong);
    }
    .bft-tonal {
      color: var(--bft-primary-strong);
      background: rgba(174, 184, 160, 0.13);
      border-color: rgba(174, 184, 160, 0.34);
      font-weight: 700;
    }
    .bft-tonal:hover {
      background: rgba(174, 184, 160, 0.2);
    }
    .bft-outline {
      color: var(--bft-text);
      background: rgba(17, 20, 23, 0.12);
      border-color: var(--bft-line-strong);
    }
    .bft-outline:hover {
      background: rgba(40, 48, 52, 0.52);
    }
    .bft-quiet {
      color: var(--bft-muted);
      background: transparent;
      border-color: transparent;
    }
    .bft-quiet:hover {
      color: var(--bft-text);
      background: rgba(244, 247, 246, 0.08);
    }
    .bft-danger {
      color: #ffd9d7;
      border-color: rgba(242, 139, 130, 0.42);
      background: var(--bft-danger-bg);
    }
    .bft-select {
      min-height: 28px;
      color: var(--bft-text);
      background: rgba(17, 20, 23, 0.58);
      border: 1px solid var(--bft-line-strong);
      border-radius: var(--bft-radius);
      padding: 6px 9px;
    }
    .bft-select option {
      color: #1f2329;
      background: #ffffff;
    }
    .bft-check {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--bft-muted);
    }
    .bft-list {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .bft-manager-list {
      display: grid;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
      padding-right: 2px;
      scrollbar-width: thin;
    }
    .bft-manager-item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 7px;
      padding: 8px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      background: rgba(40, 48, 52, 0.36);
    }
    .bft-manager-active {
      border-color: rgba(174, 184, 160, 0.76);
      background: rgba(174, 184, 160, 0.12);
    }
    .bft-manager-content {
      display: grid;
      gap: 1px;
      min-width: 0;
    }
    .bft-manager-content strong,
    .bft-manager-content .bft-muted {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .bft-manager-content strong {
      font-size: 12px;
      line-height: 1.25;
    }
    .bft-manager-content .bft-muted {
      font-size: 11px;
      line-height: 1.3;
    }
    .bft-manager-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      flex-wrap: nowrap;
    }
    .bft-manager-item .bft-row,
    .bft-manager-actions {
      flex-wrap: nowrap;
    }
    .bft-manager-item .bft-button {
      min-height: 34px;
      padding: 5px 8px;
      font-size: 11.5px;
    }
    .bft-pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex-wrap: wrap;
      padding-top: 2px;
    }
    .bft-pager .bft-row {
      gap: 4px;
    }
    .bft-item {
      display: grid;
      gap: 2px;
      width: 100%;
      color: inherit;
      text-align: left;
      cursor: pointer;
      padding: 10px;
      min-height: 58px;
      border: 1px solid var(--bft-line);
      border-radius: var(--bft-radius);
      background: rgba(40, 48, 52, 0.36);
    }
    .bft-item:hover {
      background: rgba(48, 58, 63, 0.56);
    }
    .bft-item-active {
      border-color: rgba(123, 203, 230, 0.9);
      background: rgba(123, 203, 230, 0.14);
    }
    .bft-item-selected {
      border-color: rgba(174, 184, 160, 0.82);
    }
    .bft-empty {
      padding: 9px;
      color: var(--bft-muted);
      border-radius: var(--bft-radius);
      background: rgba(40, 48, 52, 0.36);
    }
    .bft-error {
      display: grid;
      gap: 3px;
      color: #ffd9d7;
      padding: 8px;
      border-radius: var(--bft-radius);
      background: var(--bft-danger-bg);
    }
    .bft-resize-handle {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      touch-action: none;
      opacity: 0.75;
    }
    .bft-resize-handle::after {
      content: "";
      position: absolute;
      right: 5px;
      bottom: 5px;
      width: 9px;
      height: 9px;
      border-right: 2px solid rgba(247, 248, 251, 0.52);
      border-bottom: 2px solid rgba(247, 248, 251, 0.52);
    }
    .bft-resizing,
    .bft-resizing * {
      user-select: none;
    }
    .bft-collapsed .bft-resize-handle {
      display: none;
    }
    @media (max-width: 640px) {
      #${panelId} {
        left: 6px;
        right: 6px;
        top: auto;
        bottom: max(0px, env(safe-area-inset-bottom));
        width: auto;
        height: min(86dvh, 640px);
        border-radius: 8px 8px 0 0;
      }
      .bft-header {
        cursor: default;
        touch-action: auto;
      }
      .bft-body {
        padding: 8px;
        height: calc(100% - 58px);
      }
      .bft-input {
        min-height: 104px;
      }
      .bft-field-grid {
        grid-template-columns: 1fr;
      }
      .bft-button,
      .bft-select,
      .bft-text-input {
        min-height: var(--bft-touch);
      }
      .bft-tool-row .bft-button {
        flex: 1 1 calc(50% - 6px);
        padding: 8px 9px;
        font-size: 12px;
      }
      .bft-primary-training-button {
        width: 100%;
        min-height: 84px;
        font-size: 18px;
      }
      .bft-control-row .bft-button {
        flex: 1 1 calc(50% - 6px);
        padding: 8px 9px;
        font-size: 12px;
      }
      .bft-tool-group .bft-button {
        flex: 1 1 calc(50% - 6px);
      }
      .bft-manager-list {
        max-height: 132px;
      }
      .bft-manager-item {
        grid-template-columns: 1fr;
      }
      .bft-manager-actions {
        justify-content: stretch;
      }
      .bft-manager-actions .bft-button {
        flex: 1 1 0;
        min-height: var(--bft-touch);
      }
      .bft-status {
        padding: 9px;
      }
      .bft-status-hero {
        grid-template-columns: minmax(0, 1fr);
      }
      .bft-progress-tile {
        width: 100%;
        min-height: 48px;
        grid-auto-flow: column;
        justify-content: start;
        gap: 8px;
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
      .bft-resize-handle {
        display: none;
      }
    }
    @media (min-width: 641px) and (max-width: 1180px) {
      #${panelId} {
        right: max(8px, env(safe-area-inset-right));
        top: max(8px, env(safe-area-inset-top));
        width: min(calc(100vw - 16px), 820px);
        height: calc(100dvh - 16px);
        max-height: calc(100dvh - 16px);
      }
      .bft-body {
        height: calc(100% - 58px);
      }
      .bft-button,
      .bft-select,
      .bft-text-input {
        min-height: var(--bft-touch);
      }
      .bft-manager-item .bft-button {
        min-height: var(--bft-touch);
      }
    }
    @container (min-width: 680px) {
      .bft-main-grid {
        grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
        align-items: start;
      }
      .bft-main-right {
        position: sticky;
        top: 0;
      }
    }
    @container (max-width: 430px) {
      .bft-metric-grid {
        grid-template-columns: 1fr;
      }
      .bft-save-pill {
        max-width: 38%;
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
    button.title = label;
    button.addEventListener("click", onClick);
    return button;
  }
  function createMetric(labelText, valueText) {
    const metric = document.createElement("div");
    metric.className = "bft-metric";
    const label = document.createElement("span");
    label.textContent = labelText;
    const value = document.createElement("strong");
    value.textContent = valueText;
    metric.append(label, value);
    return metric;
  }
  function createPanelHeading(titleText, detailText, action) {
    const heading = document.createElement("div");
    heading.className = "bft-panel-heading";
    const copy = document.createElement("div");
    copy.className = "bft-heading-copy";
    const title = document.createElement("strong");
    title.textContent = titleText;
    const detail = document.createElement("span");
    detail.className = "bft-muted";
    detail.textContent = detailText;
    copy.append(title, detail);
    heading.append(copy);
    if (action) {
      heading.append(action);
    }
    return heading;
  }
  function createTabBar() {
    const tabs = document.createElement("div");
    tabs.className = "bft-tabs";
    const items = [
      { id: "groups", label: "分组" },
      { id: "preview", label: "预览" },
      { id: "settings", label: "设置" }
    ];
    items.forEach((item) => {
      const button = createButton(item.label, () => {
        activeWorkTab = item.id;
        savePreferences();
        render();
      }, `bft-tab ${activeWorkTab === item.id ? "bft-tab-active" : "bft-quiet"}`);
      button.setAttribute("aria-pressed", String(activeWorkTab === item.id));
      tabs.append(button);
    });
    return tabs;
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
  function createToolGroup(labelText, buttons) {
    const group = document.createElement("div");
    group.className = "bft-tool-group";
    const label = document.createElement("span");
    label.className = "bft-tool-label";
    label.textContent = labelText;
    const buttonRow = document.createElement("div");
    buttonRow.className = "bft-row bft-tool-row";
    buttonRow.append(...buttons);
    group.append(label, buttonRow);
    return group;
  }
  function createTextField(labelText, value, onInput, multiline = false, shouldFocus = false) {
    const label = document.createElement("label");
    label.className = "bft-field";
    const caption = document.createElement("span");
    caption.className = "bft-field-label";
    caption.textContent = labelText;
    const field = multiline ? document.createElement("textarea") : document.createElement("input");
    field.className = multiline ? "bft-text-input bft-notes-input" : "bft-text-input";
    if (field instanceof HTMLInputElement) {
      field.type = "text";
    }
    field.value = value;
    field.addEventListener("input", () => {
      onInput(field.value);
      savePlan();
    });
    if (shouldFocus) {
      window.setTimeout(() => {
        field.focus();
        if (field instanceof HTMLInputElement) {
          field.select();
        }
      }, 0);
    }
    label.append(caption, field);
    return label;
  }
  function createPlanInfoForm() {
    const wrapper = document.createElement("div");
    wrapper.className = "bft-tool-group";
    const grid = document.createElement("div");
    grid.className = "bft-field-grid";
    grid.append(
      createTextField("标题", activePlanTitle, (value) => {
        activePlanTitle = value.trim();
      }, false, pendingPlanInfoFocus),
      createTextField("作者", activePlanAuthor, (value) => {
        activePlanAuthor = value.trim();
      })
    );
    pendingPlanInfoFocus = false;
    wrapper.append(
      grid,
      createTextField("备注", activePlanNotes, (value) => {
        activePlanNotes = value.trim();
      }, true)
    );
    const actions = document.createElement("div");
    actions.className = "bft-row bft-field-actions";
    actions.append(createButton("保存信息", () => {
      savePlan("已保存子分组信息");
      render();
    }, "bft-tonal"));
    wrapper.append(actions);
    return wrapper;
  }
  function compactText(value, maxLength = 72) {
    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }
  function getGroupActionCount(group) {
    if (group.savedExercises.length > 0) {
      return group.savedExercises.length;
    }
    return parsePlan(group.rawInput).exercises.length;
  }
  function createManagerList() {
    const wrapper = document.createElement("div");
    wrapper.className = "bft-manager-list";
    const groups = planGroups;
    if (groups.length === 0) {
      const empty = document.createElement("div");
      empty.className = "bft-empty";
      empty.textContent = "当前视频暂无子分组";
      wrapper.append(empty);
      return wrapper;
    }
    const totalPages = Math.max(1, Math.ceil(groups.length / groupPageSize));
    groupPage = Math.min(Math.max(groupPage, 0), totalPages - 1);
    const pageStart = groupPage * groupPageSize;
    const visibleGroups = groups.slice(pageStart, pageStart + groupPageSize);
    visibleGroups.forEach((group, pageIndex) => {
      const index = pageStart + pageIndex;
      const item = document.createElement("div");
      item.className = `bft-manager-item ${group.id === activeGroupId ? "bft-manager-active" : ""}`.trim();
      const content = document.createElement("div");
      content.className = "bft-manager-content";
      const title = document.createElement("strong");
      title.textContent = group.title || `子分组 ${index + 1}`;
      const meta = document.createElement("span");
      meta.className = "bft-muted";
      const updatedText = group.updatedAt ? new Date(group.updatedAt).toLocaleString() : "未知时间";
      meta.textContent = `${getGroupActionCount(group)} 个动作 · ${updatedText}`;
      const extraTexts = [
        group.author ? `作者：${compactText(group.author, 32)}` : "",
        group.notes ? `备注：${compactText(group.notes, 48)}` : ""
      ].filter(Boolean);
      const extra = document.createElement("span");
      extra.className = "bft-muted";
      extra.textContent = extraTexts.join(" · ");
      const actions = document.createElement("div");
      actions.className = "bft-manager-actions";
      const loadButton = createButton("切换", () => switchToGroup(group.id), "bft-tonal");
      loadButton.disabled = group.id === activeGroupId;
      actions.append(
        loadButton,
        createButton("修改", () => editGroup(group.id), "bft-outline"),
        createButton("删除", () => deleteGroup(group.id), "bft-danger")
      );
      content.append(title, meta);
      if (extraTexts.length > 0) {
        content.append(extra);
      }
      item.append(content, actions);
      wrapper.append(item);
    });
    return wrapper;
  }
  function createGroupPager() {
    const totalPages = Math.max(1, Math.ceil(planGroups.length / groupPageSize));
    groupPage = Math.min(Math.max(groupPage, 0), totalPages - 1);
    const pager = document.createElement("div");
    pager.className = "bft-pager";
    const meta = document.createElement("span");
    meta.className = "bft-muted";
    const pageStart = planGroups.length === 0 ? 0 : groupPage * groupPageSize + 1;
    const pageEnd = Math.min(planGroups.length, (groupPage + 1) * groupPageSize);
    meta.textContent = `${pageStart}-${pageEnd} / ${planGroups.length}`;
    const actions = document.createElement("div");
    actions.className = "bft-row";
    const prevButton = createButton("上一页", () => {
      groupPage = Math.max(0, groupPage - 1);
      render();
    }, "bft-outline");
    prevButton.disabled = groupPage === 0;
    const nextButton = createButton("下一页", () => {
      groupPage = Math.min(totalPages - 1, groupPage + 1);
      render();
    }, "bft-outline");
    nextButton.disabled = groupPage >= totalPages - 1;
    actions.append(prevButton, nextButton);
    pager.append(meta, actions);
    return pager;
  }
  function createGroupActions() {
    const wrapper = document.createElement("div");
    wrapper.className = "bft-tool-group";
    const summary = document.createElement("div");
    summary.className = "bft-group-summary";
    const title = document.createElement("strong");
    title.textContent = activePlanTitle || "未命名子分组";
    const author = document.createElement("span");
    author.className = "bft-muted";
    author.textContent = activePlanAuthor ? `作者：${activePlanAuthor}` : "作者：未填写";
    const label = document.createElement("span");
    label.className = "bft-tool-label";
    label.textContent = `视频分组 ${getCurrentStorageId()} · ${planGroups.length} 个子分组`;
    summary.append(title, author);
    wrapper.append(summary, label);
    return wrapper;
  }
  function createGroupCreateActions() {
    const wrapper = document.createElement("div");
    wrapper.className = "bft-tool-group";
    const actions = document.createElement("div");
    actions.className = "bft-row";
    actions.append(
      createButton("新建空白子分组", createNewGroup, "bft-tonal"),
      createButton("复制当前计划", duplicateCurrentGroup, "bft-outline")
    );
    wrapper.append(actions);
    return wrapper;
  }
  function createSettingsPanel() {
    const panel = document.createElement("div");
    panel.className = "bft-tool-group";
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
    panel.append(
      createPanelHeading("训练设置", "提示音和休息时视频行为"),
      settingsRow
    );
    return panel;
  }
  function createWorkPanel(parseResult, list) {
    const panel = document.createElement("div");
    panel.className = "bft-work-panel";
    if (activeWorkTab === "groups") {
      panel.append(
        createPanelHeading("计划分组", `${planGroups.length} 个子分组`),
        createGroupActions(),
        createManagerList(),
        createGroupPager(),
        createGroupCreateActions(),
        createPlanInfoForm()
      );
      return panel;
    }
    if (activeWorkTab === "preview") {
      const lockButton = createButton(previewLocked ? "解锁预览" : "锁定预览", () => {
        previewLocked = !previewLocked;
        savePreferences();
        render();
      }, "bft-tonal");
      panel.append(
        createPanelHeading(
          "动作预览",
          previewLocked ? "训练中锁定切换" : "训练中可切换动作",
          lockButton
        ),
        list
      );
      return panel;
    }
    panel.append(createSettingsPanel());
    if (parseResult.errors.length > 0) {
      const warning = document.createElement("div");
      warning.className = "bft-error";
      warning.textContent = "录入内容有错误，请在左侧“时间戳录入”处理。";
      panel.append(warning);
    }
    return panel;
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
    const brand = document.createElement("div");
    brand.className = "bft-brand";
    const brandMark = document.createElement("div");
    brandMark.className = "bft-brand-mark";
    brandMark.textContent = "BF";
    const titleStack = document.createElement("div");
    titleStack.className = "bft-title-stack";
    const title = document.createElement("div");
    title.className = "bft-title";
    title.textContent = "健身计时器";
    const subtitle = document.createElement("div");
    subtitle.className = "bft-subtitle";
    subtitle.textContent = activePlanTitle || getCurrentStorageId();
    titleStack.append(title, subtitle);
    brand.append(brandMark, titleStack);
    const collapseButton = createButton(collapsed ? "展开" : "收起", () => {
      collapsed = !collapsed;
      render();
    }, "bft-quiet");
    const headerActions = document.createElement("div");
    headerActions.className = "bft-header-actions";
    headerActions.append(collapseButton);
    header.append(brand, headerActions);
    setupPanelDrag(header, panel);
    const body = document.createElement("div");
    body.className = "bft-body";
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "bft-resize-handle";
    resizeHandle.title = "拖拽调整面板大小";
    setupPanelResize(resizeHandle, panel);
    const controlStack = document.createElement("div");
    controlStack.className = "bft-control-stack";
    const status = document.createElement("div");
    status.className = `bft-status bft-status-${runtime.mode}`;
    const current = getCurrentExercise();
    const statusHero = document.createElement("div");
    statusHero.className = "bft-status-hero";
    const progressTile = document.createElement("div");
    progressTile.className = "bft-progress-tile";
    const progressLabel = document.createElement("span");
    progressLabel.textContent = runtime.mode === "rest" ? "休息" : "当前";
    const progressValue = document.createElement("strong");
    progressValue.textContent = runtime.mode === "rest" ? `${runtime.restRemaining}s` : current ? `${runtime.exerciseIndex + 1}` : `${exercises.length}`;
    progressTile.append(progressLabel, progressValue);
    const statusCopy = document.createElement("div");
    statusCopy.className = "bft-status-copy";
    const statusHead = document.createElement("div");
    statusHead.className = "bft-status-head";
    const statusTitle = document.createElement("strong");
    statusTitle.className = "bft-status-title";
    statusTitle.textContent = getStatusText();
    const saveStatus = document.createElement("span");
    saveStatus.className = "bft-save-pill";
    saveStatus.textContent = saveStatusText;
    statusHead.append(statusTitle, saveStatus);
    const statusDetail = document.createElement("span");
    statusDetail.className = "bft-muted bft-status-detail";
    statusDetail.textContent = current ? `${current.name} · ${formatTimestamp(current.start)}-${formatTimestamp(current.end)} · ${current.minReps}${current.maxReps === current.minReps ? "" : `-${current.maxReps}`} 次` : `${exercises.length} 个动作`;
    const metricGrid = document.createElement("div");
    metricGrid.className = "bft-metric-grid";
    metricGrid.append(
      createMetric("动作", `${exercises.length}`),
      createMetric("当前", current ? `${runtime.exerciseIndex + 1}/${exercises.length}` : "-"),
      createMetric("休息", current ? `${current.restSeconds}s` : `${settings.beepDuration}s`)
    );
    statusCopy.append(statusHead, statusDetail);
    statusHero.append(progressTile, statusCopy);
    status.append(statusHero, metricGrid);
    const textarea = document.createElement("textarea");
    textarea.className = "bft-input";
    textarea.wrap = "off";
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
    }, "bft-outline");
    onlineImportButton.disabled = onlineImportBusy;
    const saveButton = createButton("保存", () => {
      savePlan("已手动保存");
      render();
    }, "bft-tonal");
    const insertGroup = createToolGroup("时间", [
      createButton("插入开始", () => insertCurrentTime("start"), "bft-outline"),
      createButton("插入结束", () => insertCurrentTime("end"), "bft-outline"),
      createButton("示例", () => {
        rawInput = "俯卧撑 00:12-00:28 3x8-12 rest45\n深蹲 01:05-01:22 4x10 rest60";
        savePlan();
        render();
      }, "bft-quiet")
    ]);
    const fileGroup = createToolGroup("数据", [
      createButton("导出", exportPlan, "bft-quiet"),
      createButton("导入", openImportPicker, "bft-quiet"),
      onlineImportButton,
      saveButton
    ]);
    const startPickerRow = document.createElement("div");
    startPickerRow.className = "bft-row bft-start-row";
    const startPickerLabel = document.createElement("label");
    startPickerLabel.className = "bft-row bft-grow bft-start-picker";
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
    let primaryTrainingLabel = "开始训练";
    let primaryTrainingAction = startTraining;
    let primaryTrainingDisabled = exercises.length === 0;
    let primaryTrainingClass = "bft-primary";
    if (runtime.mode === "exercise") {
      primaryTrainingLabel = "完成本组";
      primaryTrainingAction = completeSet;
      primaryTrainingDisabled = false;
    } else if (runtime.mode === "paused") {
      primaryTrainingLabel = "继续";
      primaryTrainingAction = togglePause;
      primaryTrainingDisabled = false;
    } else if (runtime.mode === "rest") {
      primaryTrainingLabel = `休息 ${runtime.restRemaining}s`;
      primaryTrainingAction = () => {
      };
      primaryTrainingDisabled = true;
      primaryTrainingClass = "bft-resting-button";
    }
    const primaryActionRow = document.createElement("div");
    primaryActionRow.className = "bft-primary-action-row";
    const primaryTrainingButton = createButton(
      primaryTrainingLabel,
      primaryTrainingAction,
      primaryTrainingClass
    );
    primaryTrainingButton.classList.add("bft-primary-training-button");
    primaryTrainingButton.disabled = primaryTrainingDisabled;
    primaryActionRow.append(primaryTrainingButton);
    const controls = document.createElement("div");
    controls.className = "bft-row bft-control-row";
    const skipButton = createButton("跳过休息", () => skipRest(false), "bft-outline");
    skipButton.disabled = runtime.mode !== "rest";
    const pauseButton = createButton("暂停", togglePause, "bft-tonal");
    pauseButton.disabled = runtime.mode !== "exercise" && runtime.mode !== "rest";
    controls.append(pauseButton, skipButton);
    const safetyRow = document.createElement("div");
    safetyRow.className = "bft-safety-row";
    const safetyLabel = document.createElement("span");
    safetyLabel.className = "bft-tool-label";
    safetyLabel.textContent = "安全操作";
    const resetButton = createButton("重置训练", resetTraining, "bft-danger");
    resetButton.classList.add("bft-reset-button");
    resetButton.disabled = runtime.mode === "idle" && runtime.exerciseIndex === selectedStartIndex && runtime.setIndex === 0 && runtime.restRemaining === 0;
    safetyRow.append(safetyLabel, resetButton);
    const controlDeck = document.createElement("div");
    controlDeck.className = "bft-control-deck";
    controlDeck.append(startPickerRow, primaryActionRow, controls, safetyRow);
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
      const canSwitchItem = runtime.mode === "idle" || runtime.mode === "complete" || !previewLocked;
      item.disabled = !canSwitchItem;
      item.addEventListener("click", () => {
        switchToExercise(index);
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
    const inputChildren = [textarea, insertGroup, fileGroup];
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
    const inputPanel = document.createElement("div");
    inputPanel.className = "bft-left-input";
    const inputHeader = document.createElement("div");
    inputHeader.className = "bft-section-header";
    const inputTitle = document.createElement("strong");
    inputTitle.textContent = "时间戳录入";
    const inputToggleButton = createButton(inputCollapsed ? "展开" : "折叠", () => {
      inputCollapsed = !inputCollapsed;
      savePreferences();
      render();
    }, "bft-quiet");
    inputHeader.append(inputTitle, inputToggleButton);
    inputPanel.append(inputHeader);
    if (!inputCollapsed) {
      inputPanel.append(...inputChildren);
    }
    controlStack.append(status, controlDeck, inputPanel);
    const mainGrid = document.createElement("div");
    mainGrid.className = "bft-main-grid";
    const mainLeft = document.createElement("div");
    mainLeft.className = "bft-main-left";
    const mainRight = document.createElement("div");
    mainRight.className = "bft-main-right";
    mainLeft.append(controlStack);
    mainRight.append(createTabBar(), createWorkPanel(parseResult, list));
    mainGrid.append(mainLeft, mainRight);
    body.append(mainGrid);
    panel.append(header, body, resizeHandle);
    applyPanelPosition(panel);
    if (options.restoreTextarea) {
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
    activeGroupId = "";
    planGroups = [];
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
          applyPlanGroup(plan, planGroups);
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
      applyPanelSize(panel);
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
      applyPlanGroup(plan, planGroups);
      previewLocked = preferences.previewLocked;
      activeWorkTab = preferences.activeTab;
      inputCollapsed = preferences.inputCollapsed;
      panelPosition = preferences.panelPosition;
      panelSize = preferences.panelSize;
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
