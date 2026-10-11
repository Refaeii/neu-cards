/*
 * neu-cards.js - visual-editor wrappers for the Maple neumorphic dashboard
 * Put in: /config/www/neu-cards.js
 * Resource: /local/neu-cards.js  (type: JavaScript module)
 * Requires: button-card + the neu_* button_card_templates in the dashboard.
 *
 * Cards:  custom:neu-room-card   custom:neu-media-card   custom:neu-shutter-card
 */

const NEU_VERSION = "1.1.2";

class NeuBase extends HTMLElement {
  connectedCallback() {
    this.style.display = "block";
    this.style.height = "100%";
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = config;
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._card) this._card.hass = hass;
  }

  // subclasses return the button-card config
  _buttonConfig() {
    return {};
  }

  async _build() {
    // wait until button-card itself is loaded (resources load in any order)
    await customElements.whenDefined("button-card");
    const helpers = await window.loadCardHelpers();
    const card = helpers.createCardElement(this._buttonConfig());
    card.style.height = "100%";
    // HA asks the parent to rebuild once a lazy element is ready
    card.addEventListener("ll-rebuild", (ev) => {
      ev.stopPropagation();
      this._build();
    }, { once: true });
    if (this._hass) card.hass = this._hass;
    this.replaceChildren(card);
    this._card = card;
  }

  getCardSize() {
    return 4;
  }
}

/* ---------------- Room ---------------- */
class NeuRoomCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    const v = {
      name: c.name || "Room",
      size: c.size || "small",
      tone: c.tone || "amber",
      temp: c.temp || "",
      climate: c.climate || "",
      lock: c.lock || "",
      media: c.media || "",
      cover: c.cover || "",
      devices: c.devices || [],
      dimmer: c.dimmer !== false,
    };
    if (c.icon_on) v.icon_on = c.icon_on;
    if (c.icon_off) v.icon_off = c.icon_off;
    const cfg = { type: "custom:button-card", template: "neu_room", variables: v };
    if (c.entity) cfg.entity = c.entity;
    return cfg;
  }

  getCardSize() {
    return this._config && this._config.size === "big" ? 6 : 4;
  }

  getGridOptions() {
    const s = (this._config && this._config.size) || "small";
    if (s === "big") return { columns: 12, rows: 6, min_rows: 4 };
    if (s === "wide") return { columns: 12, rows: 4, min_rows: 3 };
    return { columns: 6, rows: 4, min_rows: 3 };
  }

  static getStubConfig(hass) {
    const light = Object.keys(hass.states).find((e) => e.startsWith("light."));
    return { entity: light, name: "New Room", size: "small", tone: "amber" };
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "name", required: true, selector: { text: {} } },
        { name: "entity", selector: { entity: { domain: "light" } } },
        {
          type: "grid",
          name: "",
          schema: [
            {
              name: "size",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: "small", label: "Small" },
                    { value: "wide", label: "Wide" },
                    { value: "big", label: "Big" },
                  ],
                },
              },
            },
            {
              name: "tone",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: "amber", label: "Amber" },
                    { value: "sage", label: "Sage" },
                    { value: "blue", label: "Blue" },
                  ],
                },
              },
            },
          ],
        },
        { name: "temp", selector: { entity: { domain: "sensor", device_class: "temperature" } } },
        { name: "cover", selector: { entity: { domain: "cover" } } },
        { name: "media", selector: { entity: { domain: "media_player" } } },
        {
          type: "expandable",
          name: "",
          title: "More",
          flatten: true,
          schema: [
            { name: "climate", selector: { entity: { domain: "climate" } } },
            { name: "lock", selector: { entity: { domain: "lock" } } },
            { name: "devices", selector: { entity: { multiple: true } } },
            { name: "dimmer", selector: { boolean: {} } },
            {
              type: "grid",
              name: "",
              schema: [
                { name: "icon_on", selector: { icon: {} } },
                { name: "icon_off", selector: { icon: {} } },
              ],
            },
          ],
        },
      ],
      computeLabel: (s) =>
        ({
          name: "Room name",
          entity: "Main light (bulb button + dimmer)",
          size: "Card size",
          tone: "Glow colour",
          temp: "Temperature sensor",
          cover: "Shutter",
          media: "Speaker (now playing)",
          climate: "AC / climate",
          lock: "Door lock",
          devices: "Devices to count (N devices - M active)",
          dimmer: "Show dimmer slider",
          icon_on: "Icon on",
          icon_off: "Icon off",
        })[s.name],
    };
  }
}

/* ---------------- Media ---------------- */
class NeuMediaCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    return {
      type: "custom:button-card",
      template: "neu_media",
      entity: c.entity,
      variables: { name: c.name || "" },
    };
  }

  getGridOptions() {
    return { columns: 12, rows: 4, min_rows: 4 };
  }

  static getStubConfig(hass) {
    return { entity: Object.keys(hass.states).find((e) => e.startsWith("media_player.")) };
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: "media_player" } } },
        { name: "name", selector: { text: {} } },
      ],
      computeLabel: (s) => ({ entity: "Speaker", name: "Room label" })[s.name],
    };
  }
}

/* ---------------- Shutter ---------------- */
class NeuShutterCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    return {
      type: "custom:button-card",
      template: "neu_shutter",
      entity: c.entity,
      variables: { name: c.name || "" },
    };
  }

  getGridOptions() {
    return { columns: 6, rows: 3, min_rows: 3 };
  }

  static getStubConfig(hass) {
    return { entity: Object.keys(hass.states).find((e) => e.startsWith("cover.")) };
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: "cover" } } },
        { name: "name", selector: { text: {} } },
      ],
      computeLabel: (s) => ({ entity: "Shutter", name: "Name" })[s.name],
    };
  }
}


/* ---------------- shared palette ---------------- */
const NEU_COLORS = [
  { value: "#E8A552", label: "Amber" },
  { value: "#5B7DB1", label: "Blue" },
  { value: "#7FB069", label: "Sage" },
  { value: "#C8553D", label: "Red" },
  { value: "#8a7f73", label: "Taupe" },
];
const colorSel = { select: { mode: "dropdown", options: NEU_COLORS } };
const bc = (template, extra = {}) => ({ type: "custom:button-card", template, ...extra });

/* ---------------- Header (title + clock + mode buttons) ---------------- */
const MODE_CONFIRM = {
  away: "Lights off, shutters closed, doors locked, alarm armed.",
  night: "Lights off, shutters closed, doors locked, alarm armed (night).",
};
const MODE_ICONS = { home: "mdi:home", away: "mdi:airplane-takeoff", night: "mdi:weather-night", vacation: "mdi:beach", guest: "mdi:account-multiple", sleep: "mdi:sleep" };

class NeuHeaderCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    const cfg = bc("neu_header", { variables: { title: c.title || "My Home", user: c.user || "", icon: c.icon || "mdi:home", temp: c.temp || "" } });
    const me = c.mode_entity;
    const st = me && this._hass && this._hass.states[me];
    const options = c.modes || (st && st.attributes.options) || [];
    // the template's own "modes" field is hidden; buttons go in "pills"
    // (button-card concatenates arrays when merging templates, so we can't override it)
    cfg.styles = { custom_fields: { modes: [{ display: "none" }], pills: [{ flex: "0 1 420px" }] } };
    if (me && options.length) {
      cfg.custom_fields = {
        modes: "",
        pills: {
          card: {
            type: "horizontal-stack",
            cards: options.map((o) => {
              const pill = bc("neu_mode", {
                entity: me,
                variables: { option: o, icon: (c.mode_icons && c.mode_icons[o]) || MODE_ICONS[String(o).toLowerCase()] || "mdi:circle-medium" },
              });
              const ask = c.confirm_modes || ["Away", "Night"];
              if (ask.includes(o)) {
                pill.tap_action = { confirmation: { text: `Switch the house to ${o}?` + (MODE_CONFIRM[String(o).toLowerCase()] ? "\n" + MODE_CONFIRM[String(o).toLowerCase()] : "") } };
              }
              return pill;
            }),
          },
        },
      };
    } else {
      cfg.custom_fields = { modes: "" };
    }
    return cfg;
  }
  set hass(hass) {
    const first = !this._hass;
    super.hass = hass;
    if (first && this._config && this._config.mode_entity && !this._config.modes) this._build();
  }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
  static getStubConfig() { return { title: "My Home", mode_entity: "input_select.house_mode" }; }
  static getConfigForm() {
    return {
      schema: [
        { name: "title", required: true, selector: { text: {} } },
        { type: "grid", name: "", schema: [
          { name: "user", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ] },
        { name: "temp", selector: { entity: { domain: "sensor", device_class: "temperature" } } },
        { name: "mode_entity", selector: { entity: { domain: ["input_select", "select"] } } },
        { name: "confirm_modes", selector: { select: { multiple: true, custom_value: true, options: ["Home", "Away", "Night"] } } },
      ],
      computeLabel: (s) => ({ title: "Home name", user: "Greeting name (empty = logged-in user)", icon: "Icon", temp: "Outdoor temperature", mode_entity: "Mode helper (buttons = its options)", confirm_modes: "Ask to confirm (default: Away, Night)" })[s.name],
    };
  }
}

/* ---------------- Section title ---------------- */
class NeuTitleCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    return bc("neu_title", { variables: { title: c.title || "", note: c.note || "" } });
  }
  getGridOptions() { return { columns: "full", rows: "auto" }; }
  static getStubConfig() { return { title: "Section" }; }
  static getConfigForm() {
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "note", selector: { text: {} } },
      ],
      computeLabel: (s) => ({ title: "Title", note: "Right-side note" })[s.name],
    };
  }
}

/* ---------------- Quick scenes ---------------- */
class NeuScenesCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    const list = c.scenes || [];
    const cols = c.columns || Math.min(Math.max(list.length, 1), 4);
    return bc("neu_panel", {
      variables: { title: c.title || "Quick Scenes", note: c.note === undefined ? "tap to activate" : c.note },
      custom_fields: {
        body: {
          card: {
            type: "grid", columns: cols, square: false,
            cards: list.map((e, i) => bc("neu_scene", {
              entity: e,
              variables: { color: NEU_COLORS[i % 3].value, ...((c.scene_icons && c.scene_icons[e]) ? { icon: c.scene_icons[e] } : {}) },
            })),
          },
        },
      },
    });
  }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  static getStubConfig() { return { title: "Quick Scenes", scenes: [] }; }
  static getConfigForm() {
    return {
      schema: [
        { type: "grid", name: "", schema: [
          { name: "title", selector: { text: {} } },
          { name: "note", selector: { text: {} } },
        ] },
        { name: "scenes", selector: { entity: { multiple: true, domain: ["scene", "script", "automation", "input_button", "button"] } } },
        { name: "columns", selector: { number: { min: 1, max: 6, mode: "box" } } },
      ],
      computeLabel: (s) => ({ title: "Title", note: "Note", scenes: "Scenes / scripts (icon & name come from the entity)", columns: "Columns (empty = auto)" })[s.name],
    };
  }
}

/* ---------------- Energy / gauges panel (up to 4) ---------------- */
const G = [1, 2, 3, 4];
class NeuGaugesCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    const gauges = G.filter((n) => c[`g${n}_entity`]).map((n) => bc("neu_gauge", {
      entity: c[`g${n}_entity`],
      variables: {
        label: c[`g${n}_label`] || "",
        max: Number(c[`g${n}_max`]) || 100,
        decimals: c[`g${n}_decimals`] === undefined ? 1 : Number(c[`g${n}_decimals`]),
        color: c[`g${n}_color`] || NEU_COLORS[(n - 1) % 3].value,
      },
    }));
    return bc("neu_panel", {
      variables: { title: c.title || "Energy" },
      custom_fields: { body: { card: { type: "grid", columns: Math.min(gauges.length || 1, 2), square: false, cards: gauges } } },
    });
  }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  static getStubConfig() { return { title: "Energy" }; }
  static getConfigForm() {
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        ...G.map((n) => ({
          type: "expandable", name: "", title: `Gauge ${n}`, flatten: true,
          schema: [
            { name: `g${n}_entity`, selector: { entity: {} } },
            { type: "grid", name: "", schema: [
              { name: `g${n}_label`, selector: { text: {} } },
              { name: `g${n}_color`, selector: colorSel },
              { name: `g${n}_max`, selector: { number: { min: 0, mode: "box" } } },
              { name: `g${n}_decimals`, selector: { number: { min: 0, max: 3, mode: "box" } } },
            ] },
          ],
        })),
      ],
      computeLabel: (s) => {
        if (s.name === "title") return "Title";
        const k = s.name.split("_")[1];
        return { entity: "Sensor", label: "Label", color: "Colour", max: "Max (full ring)", decimals: "Decimals" }[k];
      },
    };
  }
}

/* ---------------- Security panel ---------------- */
class NeuSecurityCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    const rows = [];
    if (c.locks && c.locks.length) rows.push(bc("neu_row", { variables: {
      title: c.locks_title || "All Doors", icon: "mdi:door-closed-lock", color: "#7FB069",
      entities: c.locks, ok_state: ["locked"], suffix: "locked" } }));
    if (c.cameras && c.cameras.length) rows.push(bc("neu_row", { variables: {
      title: c.cameras_title || "Cameras", icon: "mdi:cctv", color: "#5B7DB1",
      entities: c.cameras, ok_state: ["recording", "streaming", "idle"], suffix: "online", right: "fraction" } }));
    if (c.sensors && c.sensors.length) rows.push(bc("neu_row", { variables: {
      title: c.sensors_title || "Windows & Doors", icon: "mdi:window-closed-variant", color: "#7FB069",
      entities: c.sensors, ok_state: ["off"], suffix: "closed" } }));
    if (c.alarm) rows.push(bc("neu_row", { entity: c.alarm, variables: {
      title: c.alarm_title || "Alarm System", icon: "mdi:shield-check", color: "#7FB069",
      ok_state: ["armed_home", "armed_away", "armed_night", "armed_vacation", "armed_custom_bypass", "disarmed"],
      sub: "[[[[ return entity && entity.state === 'triggered' ? 'Alarm triggered!' : (entity ? entity.state.replace('_', ' ') : '') ]]]]" } }));
    return bc("neu_panel", {
      variables: { title: c.title || "Security", badge_entity: c.alarm || "" },
      custom_fields: { body: { card: { type: "vertical-stack", cards: rows } } },
    });
  }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  static getStubConfig() { return { title: "Security" }; }
  static getConfigForm() {
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "alarm", selector: { entity: { domain: "alarm_control_panel" } } },
        { name: "locks", selector: { entity: { multiple: true, domain: "lock" } } },
        { name: "cameras", selector: { entity: { multiple: true, domain: "camera" } } },
        { name: "sensors", selector: { entity: { multiple: true, domain: "binary_sensor" } } },
      ],
      computeLabel: (s) => ({ title: "Title", alarm: "Alarm panel (badge + row)", locks: "Door locks", cameras: "Cameras", sensors: "Door / window sensors" })[s.name],
    };
  }
}

/* ---------------- Single scene / gauge (loose cards) ---------------- */
class NeuSceneCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    const v = { color: c.color || "#E8A552" };
    if (c.name) v.name = c.name;
    if (c.icon) v.icon = c.icon;
    return bc("neu_scene", { entity: c.entity, section_mode: true, variables: v, styles: { card: [{ height: "100%" }] } });
  }
  getGridOptions() { return { columns: 4, rows: 2 }; }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find((e) => e.startsWith("scene.")) }; }
  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: ["scene", "script", "automation", "input_button", "button", "switch", "light"] } } },
        { type: "grid", name: "", schema: [
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
        ] },
        { name: "color", selector: colorSel },
      ],
      computeLabel: (s) => ({ entity: "Scene / script", name: "Name", icon: "Icon", color: "Colour" })[s.name],
    };
  }
}


/* ---------------- Lights grid (one tile per light) ---------------- */
const NEU_LIGHT_TILE = (entity, name, tone) => ({
  type: "custom:button-card",
  template: "neu_base",
  section_mode: false,
  entity,
  variables: { name: name || "", tone: tone || "amber" },
  tap_action: { action: "toggle", haptic: "light" },
  hold_action: { action: "more-info" },
  styles: {
    card: [
      { padding: "14px 6px 12px" },
      { "border-radius": "16px" },
      { height: "auto" },
      { cursor: "pointer" },
      { "box-shadow": "[[[ return entity && entity.state === 'on' ? '6px 6px 12px #D6CFC6, -6px -6px 12px #FBF8F4' : '3px 3px 7px #DCD5CC, -3px -3px 7px #F4EFE9' ]]]" },
    ],
  },
  custom_fields: {
    c: `[[[
      const on = entity && entity.state === 'on';
      const a = entity ? entity.attributes : {};
      const n = variables.name || a.friendly_name || '';
      const ic = a.icon || (on ? 'mdi:lightbulb' : 'mdi:lightbulb-outline');
      const st = !entity ? 'n/a' : entity.state === 'unavailable' ? 'Offline' : on ? (a.brightness ? Math.round(a.brightness / 2.55) + '%' : 'On') : 'Off';
      const glow = on ? 'glow-' + (variables.tone || 'amber') : 'raised-sm';
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;min-width:0">'
        + '<div class="tg ' + glow + '" style="width:40px;height:40px;border-radius:14px;--neu-icon:20px"><ha-icon icon="' + ic + '"></ha-icon></div>'
        + '<div class="disp ell" style="font-weight:600;font-size:13px;max-width:100%;color:' + (on ? '#4a4239' : '#8a7f73') + '">' + n + '</div>'
        + '<div class="mono" style="font-size:11px;margin-top:-4px;color:' + (on ? '#E8A552' : '#b5aa9e') + '">' + st + '</div></div>';
    ]]]`,
  },
});

class NeuLightsCard extends NeuBase {
  _buttonConfig() {
    const c = this._config;
    const list = (c.lights || []).map((l) => (typeof l === "string" ? { entity: l } : l)).filter((l) => l.entity);
    const cols = c.columns || Math.min(Math.max(list.length, 1), 4);
    const grid = {
      type: "grid", columns: cols, square: false,
      cards: list.map((l) => NEU_LIGHT_TILE(l.entity, l.name, c.tone)),
    };
    if (!c.title) return grid;
    return bc("neu_panel", { variables: { title: c.title, note: c.note || "" }, custom_fields: { body: { card: grid } } });
  }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  static getStubConfig(hass) {
    return { lights: Object.keys(hass.states).filter((e) => e.startsWith("light.")).slice(0, 4) };
  }
  static getConfigForm() {
    return {
      schema: [
        { name: "lights", required: true, selector: { entity: { multiple: true, domain: "light" } } },
        { type: "grid", name: "", schema: [
          { name: "columns", selector: { number: { min: 1, max: 6, mode: "box" } } },
          { name: "tone", selector: { select: { mode: "dropdown", options: [
            { value: "amber", label: "Amber" }, { value: "sage", label: "Sage" }, { value: "blue", label: "Blue" } ] } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "title", selector: { text: {} } },
          { name: "note", selector: { text: {} } },
        ] },
      ],
      computeLabel: (s) => ({ lights: "Lights", columns: "Columns (empty = auto)", tone: "Glow colour", title: "Title (empty = tiles only)", note: "Note" })[s.name],
    };
  }
}

customElements.get("neu-header-card") || customElements.define("neu-header-card", NeuHeaderCard);
customElements.get("neu-title-card") || customElements.define("neu-title-card", NeuTitleCard);
customElements.get("neu-scenes-card") || customElements.define("neu-scenes-card", NeuScenesCard);
customElements.get("neu-gauges-card") || customElements.define("neu-gauges-card", NeuGaugesCard);
customElements.get("neu-security-card") || customElements.define("neu-security-card", NeuSecurityCard);
customElements.get("neu-scene-card") || customElements.define("neu-scene-card", NeuSceneCard);
customElements.get("neu-lights-card") || customElements.define("neu-lights-card", NeuLightsCard);
customElements.get("neu-room-card") || customElements.define("neu-room-card", NeuRoomCard);
customElements.get("neu-media-card") || customElements.define("neu-media-card", NeuMediaCard);
customElements.get("neu-shutter-card") || customElements.define("neu-shutter-card", NeuShutterCard);

window.customCards = window.customCards || [];
window.customCards.push(
  { type: "neu-room-card", name: "Neu Room", description: "Neumorphic room card (light, temp, shutter, speaker)", preview: true },
  { type: "neu-media-card", name: "Neu Media", description: "Neumorphic now-playing card", preview: true },
  { type: "neu-shutter-card", name: "Neu Shutter", description: "Neumorphic shutter card", preview: true },
  { type: "neu-header-card", name: "Neu Header", description: "Greeting, home name, clock and mode buttons", preview: true },
  { type: "neu-title-card", name: "Neu Title", description: "Section title with note", preview: true },
  { type: "neu-scenes-card", name: "Neu Quick Scenes", description: "Panel of scene / script buttons", preview: true },
  { type: "neu-scene-card", name: "Neu Scene Button", description: "Single scene / script button", preview: true },
  { type: "neu-gauges-card", name: "Neu Gauges (Energy)", description: "Panel with up to 4 ring gauges", preview: true },
  { type: "neu-security-card", name: "Neu Security", description: "Alarm, locks, cameras, sensors", preview: true },
  { type: "neu-lights-card", name: "Neu Lights", description: "Grid of light tiles - tap to toggle, hold for settings", preview: true }
);

console.info(`%c NEU-CARDS %c ${NEU_VERSION} `, "background:#E8A552;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#ECE7E1;color:#4a4239;border-radius:0 4px 4px 0;padding:2px 6px");
