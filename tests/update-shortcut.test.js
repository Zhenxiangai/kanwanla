const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("the panel header always exposes a one-click forced update control", () => {
  const html = read("sidepanel.html");
  const js = read("sidepanel.js");
  const css = read("sidepanel.css");

  assert.match(
    html,
    /class="header-action-row"[\s\S]*id="headerUpdateBtn"[\s\S]*id="settingsBtn"/,
  );
  assert.match(html, /id="headerUpdateBtn"[\s\S]*data-ui-i18n="checkUpdate"/);
  assert.match(js, /function renderHeaderUpdateButton\(/);
  assert.match(js, /function handleHeaderUpdateClick\(/);
  assert.match(
    js,
    /handleHeaderUpdateClick[\s\S]*action:\s*"checkForUpdates"[\s\S]*handleUpdatePrimaryClick/,
  );
  assert.match(
    js,
    /getElementById\("headerUpdateBtn"\)[\s\S]*addEventListener\("click",\s*handleHeaderUpdateClick\)/,
  );
  assert.match(css, /\.header-update-btn\[data-state="available"\]/);
});

