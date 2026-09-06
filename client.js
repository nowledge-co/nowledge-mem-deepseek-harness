window.__ModuleLoader__.load({ id: "nowledge-mem-deepseek-harness", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/ToolsMenu.js
var import_react = require("react");

// src/constants.js
var SESSION_ENABLE_PATH = "/__nowledge-mem/session-enable";
var COMPOSER_TOOLS_HOST_SLOT = "conversation.input.left";
var COMPOSER_TOOLS_HOST_ID = "composer-tools";
var COMPOSER_TOOLS_MENU_SLOT = "conversation.input.tools.menu";
var COMPOSER_TOOLS_MEM_ID = "nowledge-mem";

// src/composer-tools.js
function composerToolsLayout(itemCount) {
  if (!Number.isSafeInteger(itemCount) || itemCount <= 0) return "hidden";
  if (itemCount === 1) return "chip";
  return "menu";
}
function composerToolsMenuSpec() {
  return { kind: "list", scope: "session" };
}

// src/client/ToolsMenu.js
function ToolsDropdown({ children }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    if (!open) return void 0;
    const onPointerDown = (event) => {
      const host = event.target instanceof Element ? event.target.closest("[data-dsh-composer-tools]") : null;
      if (host === null) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  return (0, import_react.createElement)(
    "div",
    { "data-dsh-composer-tools": true },
    (0, import_react.createElement)("button", {
      type: "button",
      "data-dsh-composer-tools-trigger": true,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-label": "Session tools",
      title: "Session tools",
      onClick: () => {
        setOpen((value) => !value);
      }
    }, "Tools"),
    open ? (0, import_react.createElement)("div", {
      role: "menu",
      "data-dsh-composer-tools-menu": true
    }, children) : null
  );
}
function ComposerToolsHost({ renderSlot, sessionId, slots, subscribeMenu }) {
  const itemCount = (0, import_react.useSyncExternalStore)(
    (listener) => typeof subscribeMenu === "function" ? subscribeMenu(listener) : () => {
    },
    () => slots?.entries?.(COMPOSER_TOOLS_MENU_SLOT)?.length ?? 1,
    () => slots?.entries?.(COMPOSER_TOOLS_MENU_SLOT)?.length ?? 1
  );
  const layout = composerToolsLayout(itemCount);
  if (layout === "hidden" || typeof renderSlot !== "function") return null;
  const items = renderSlot(COMPOSER_TOOLS_MENU_SLOT, {
    variant: layout === "menu" ? "row" : "chip",
    sessionId
  });
  if (layout === "chip") return items;
  return (0, import_react.createElement)(ToolsDropdown, null, items);
}

// src/client/MemToggle.js
var import_react2 = require("react");

// src/client/api.js
function sessionEnableUrl(sessionId) {
  const params = new URLSearchParams({ sessionId });
  return `${SESSION_ENABLE_PATH}?${params}`;
}
async function readSnapshot(response) {
  const text = await response.text();
  let snapshot;
  try {
    snapshot = text === "" ? void 0 : JSON.parse(text);
  } catch {
    throw new Error(response.ok ? "invalid-json" : `HTTP ${response.status}`);
  }
  if (!response.ok || snapshot?.ok !== true) {
    const message = typeof snapshot?.error === "string" ? snapshot.error : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return snapshot;
}
async function fetchSessionEnable(sessionId, fetchImpl = fetch) {
  const response = await fetchImpl(sessionEnableUrl(sessionId), { credentials: "include" });
  return await readSnapshot(response);
}
async function putSessionEnable(sessionId, enabled, fetchImpl = fetch) {
  const response = await fetchImpl(SESSION_ENABLE_PATH, {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, enabled })
  });
  return await readSnapshot(response);
}

// src/client/MemToggle.js
function labelFor(enabled) {
  return enabled ? "Nowledge Mem is on for this session" : "Nowledge Mem is off for this session";
}
function MemToggle({ sessionId, variant = "chip" }) {
  const [enabled, setEnabled] = (0, import_react2.useState)(true);
  const [pending, setPending] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
    if (sessionId === void 0) return void 0;
    let cancelled = false;
    setPending(true);
    fetchSessionEnable(sessionId).then((snapshot) => {
      if (cancelled) return;
      setEnabled(snapshot.enabled === true);
      setError(null);
    }).catch((cause) => {
      if (cancelled) return;
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      if (!cancelled) setPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);
  const toggle = async () => {
    if (sessionId === void 0 || pending) return;
    const next = !enabled;
    setPending(true);
    setError(null);
    setEnabled(next);
    try {
      const snapshot = await putSessionEnable(sessionId, next);
      setEnabled(snapshot.enabled === true);
    } catch (cause) {
      setEnabled(!next);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  };
  const title = error ?? labelFor(enabled);
  const disabled = pending || sessionId === void 0;
  if (variant === "row") {
    return (0, import_react2.createElement)(
      "div",
      { "data-dsh-nowledge-mem-row": true },
      (0, import_react2.createElement)("span", null, "Nowledge Mem"),
      (0, import_react2.createElement)("button", {
        type: "button",
        role: "switch",
        "data-dsh-nowledge-mem": true,
        "aria-checked": enabled,
        "aria-pressed": enabled,
        "aria-label": labelFor(enabled),
        title,
        disabled,
        "data-error": error === null ? void 0 : "true",
        onClick: () => {
          void toggle();
        }
      }, enabled ? "On" : "Off")
    );
  }
  return (0, import_react2.createElement)("button", {
    type: "button",
    "data-dsh-nowledge-mem": true,
    "aria-pressed": enabled,
    "aria-label": labelFor(enabled),
    title,
    disabled,
    "data-error": error === null ? void 0 : "true",
    onClick: () => {
      void toggle();
    }
  }, "Mem");
}

// src/client/css.js
var STYLE_ID = "dsh-nowledge-mem-css";
var PLUGIN_CSS = `
[data-dsh-nowledge-mem] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 52px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-stroke-secondary, rgb(255 255 255 / 0.14));
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg, rgb(255 255 255 / 0.04));
  color: var(--dsw-alias-label-secondary, #c8c8c8);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  transition: color 120ms ease, background-color 120ms ease, opacity 120ms ease, border-color 120ms ease;
}
[data-dsh-nowledge-mem]::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.45;
  transition: opacity 120ms ease, box-shadow 120ms ease;
}
[data-dsh-nowledge-mem]:hover:not(:disabled),
[data-dsh-nowledge-mem]:focus-visible:not(:disabled) {
  color: var(--dsw-alias-label-secondary, #555);
  background: var(--dsw-alias-interactive-bg-hover, rgb(0 0 0 / 0.06));
  outline: none;
}
[data-dsh-nowledge-mem][aria-pressed='true'] {
  color: var(--dsw-alias-state-business-primary, #00a3a3);
  background: color-mix(in srgb, currentColor 12%, transparent);
}
[data-dsh-nowledge-mem][aria-pressed='true']::before {
  opacity: 1;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 18%, transparent);
}
[data-dsh-nowledge-mem]:disabled {
  opacity: 0.45;
  cursor: default;
}
[data-dsh-nowledge-mem][data-error='true'] {
  color: var(--dsw-alias-label-danger, #c43d3d);
}
[data-dsh-composer-tools] {
  position: relative;
  display: inline-flex;
  align-items: center;
}
[data-dsh-composer-tools-trigger] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-stroke-secondary, rgb(255 255 255 / 0.14));
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg, rgb(255 255 255 / 0.04));
  color: var(--dsw-alias-label-secondary, #c8c8c8);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
[data-dsh-composer-tools-trigger][aria-expanded='true'],
[data-dsh-composer-tools-trigger]:hover,
[data-dsh-composer-tools-trigger]:focus-visible {
  color: var(--dsw-alias-label-primary, #eee);
  outline: none;
}
[data-dsh-composer-tools-menu] {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  z-index: 40;
  min-width: 220px;
  padding: 6px;
  border: 1px solid var(--dsw-alias-stroke-secondary, rgb(255 255 255 / 0.14));
  border-radius: 12px;
  background: var(--dsw-alias-bg-elevated, #1c1c1c);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.28);
}
[data-dsh-nowledge-mem-row] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  padding: 4px 8px;
  border-radius: 8px;
  color: var(--dsw-alias-label-primary, #eee);
  font: inherit;
  font-size: 13px;
}
`;
function installCss(doc = document) {
  if (doc.getElementById(STYLE_ID)) return;
  const tag = doc.createElement("style");
  tag.id = STYLE_ID;
  tag.dataset.plugin = "nowledge-mem-deepseek-harness";
  tag.textContent = PLUGIN_CSS;
  doc.head.appendChild(tag);
}

// src/client/register.js
function registerComposerTools(ctx, { Host, Item }) {
  ctx.slots.inject(COMPOSER_TOOLS_HOST_SLOT, () => ctx.slots.register({
    name: COMPOSER_TOOLS_HOST_SLOT,
    id: COMPOSER_TOOLS_HOST_ID,
    order: 40,
    label: "Tools",
    children: {
      [COMPOSER_TOOLS_MENU_SLOT]: composerToolsMenuSpec()
    },
    inject: (sessionId) => ({
      sessionId,
      slots: ctx.slots,
      subscribeMenu: (listener) => {
        if (typeof ctx.on !== "function") return () => {
        };
        return ctx.on("slots/changed", (key) => {
          if (key === COMPOSER_TOOLS_MENU_SLOT) listener();
        });
      }
    })
  }, Host));
  ctx.slots.inject(COMPOSER_TOOLS_MENU_SLOT, () => ctx.slots.register({
    name: COMPOSER_TOOLS_MENU_SLOT,
    id: COMPOSER_TOOLS_MEM_ID,
    order: 0,
    label: "Nowledge Mem",
    inject: (sessionId) => ({ sessionId })
  }, Item));
}

// src/client/index.js
var inject = ["slots"];
function apply(ctx) {
  installCss();
  registerComposerTools(ctx, {
    Host: ComposerToolsHost,
    Item: MemToggle
  });
}
return module.exports; } });

//# sourceMappingURL=client.js.map
