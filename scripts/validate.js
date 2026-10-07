#!/usr/bin/env node
/*
 * Validates the test registry and every live question bank.
 * Usage: node scripts/validate.js   (exit code 1 if any errors)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const TYPES = ["single", "multi", "text"];
const STATUSES = ["live", "soon"];
const KNOWN_KEYS = ["id", "category", "difficulty", "type", "question", "code", "options", "answer", "explanation"];

const normalize = (s) => String(s).trim().replace(/\s+/g, " ").toLowerCase();
const isText = (s) => typeof s === "string" && s.trim() !== "";
const isIndex = (n, len) => Number.isInteger(n) && n >= 0 && n < len;

// Run the browser data files in a sandbox where `window` is the global object.
const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);

function run(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    err(`${rel}: file not found`);
    return false;
  }
  try {
    vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: rel });
    return true;
  } catch (e) {
    err(`${rel}: ${e.message}`);
    return false;
  }
}

function checkBackticks(where, field, s) {
  if (typeof s === "string" && (s.match(/`/g) || []).length % 2 !== 0) {
    err(`${where}: unbalanced backticks in ${field}`);
  }
}

function validateBank(bankId, bank) {
  const where0 = `data/${bankId}.js`;
  if (!Array.isArray(bank) || bank.length === 0) {
    err(`${where0}: registerBank("${bankId}", ...) was not called with a non-empty array`);
    return null;
  }

  const ids = new Set();
  const stats = { total: bank.length, category: {}, type: {}, difficulty: {} };

  bank.forEach((q, i) => {
    const where = `${where0} #${i + 1}${q && q.id ? ` (${q.id})` : ""}`;
    if (!q || typeof q !== "object") {
      err(`${where}: not an object`);
      return;
    }

    Object.keys(q).forEach((k) => {
      if (!KNOWN_KEYS.includes(k)) warn(`${where}: unknown field "${k}"`);
    });

    if (!isText(q.id)) err(`${where}: missing id`);
    else {
      if (!/^[a-z0-9-]+$/.test(q.id)) err(`${where}: id must be lower-case letters, digits and hyphens`);
      if (!q.id.startsWith(`${bankId}-`)) err(`${where}: id should start with "${bankId}-"`);
      if (ids.has(q.id)) err(`${where}: duplicate id`);
      ids.add(q.id);
    }

    if (!isText(q.category)) err(`${where}: missing category`);
    if (![1, 2, 3].includes(q.difficulty)) err(`${where}: difficulty must be 1, 2 or 3`);
    if (!TYPES.includes(q.type)) err(`${where}: type must be one of ${TYPES.join(", ")}`);
    if (!isText(q.question)) err(`${where}: missing question`);
    if (!isText(q.explanation)) err(`${where}: missing explanation`);
    if (q.code !== undefined && !isText(q.code)) err(`${where}: code must be a non-empty string if present`);

    checkBackticks(where, "question", q.question);
    checkBackticks(where, "explanation", q.explanation);

    if (q.type === "single" || q.type === "multi") {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        err(`${where}: needs at least 2 options`);
        return;
      }
      q.options.forEach((o, j) => {
        if (!isText(o)) err(`${where}: option ${j} is empty or not a string`);
        checkBackticks(where, `option ${j}`, o);
      });
      // Options are case-sensitive (e.g. `grep -i` vs `grep -I`), so compare them exactly.
      const seen = new Set(q.options.map((o) => String(o).trim()));
      if (seen.size !== q.options.length) err(`${where}: duplicate options`);

      if (q.type === "single") {
        if (!isIndex(q.answer, q.options.length)) err(`${where}: answer must be an option index (0-${q.options.length - 1})`);
      } else {
        if (!Array.isArray(q.answer) || q.answer.length === 0) err(`${where}: multi answer must be a non-empty array of indexes`);
        else {
          q.answer.forEach((a) => {
            if (!isIndex(a, q.options.length)) err(`${where}: answer index ${a} is out of range`);
          });
          if (new Set(q.answer).size !== q.answer.length) err(`${where}: duplicate answer indexes`);
          if (q.answer.length === q.options.length) warn(`${where}: every option is correct`);
        }
      }
    } else if (q.type === "text") {
      if (q.options !== undefined) err(`${where}: text questions must not have options`);
      if (!Array.isArray(q.answer) || q.answer.length === 0) err(`${where}: text answer must be a non-empty array of strings`);
      else {
        const seen = new Set();
        q.answer.forEach((a) => {
          if (!isText(a)) err(`${where}: accepted answer is empty or not a string`);
          else if (seen.has(normalize(a))) warn(`${where}: accepted answer "${a}" duplicates another after normalising`);
          else seen.add(normalize(a));
        });
      }
    }

    stats.category[q.category] = (stats.category[q.category] || 0) + 1;
    stats.type[q.type] = (stats.type[q.type] || 0) + 1;
    stats.difficulty[q.difficulty] = (stats.difficulty[q.difficulty] || 0) + 1;
  });

  return stats;
}

/* ---------- registry ---------- */

run("data/tests.js");
const tests = sandbox.TESTS;
const summaries = [];

if (!Array.isArray(tests) || tests.length === 0) {
  err("data/tests.js: window.TESTS must be a non-empty array");
} else if (typeof sandbox.registerBank !== "function") {
  err("data/tests.js: registerBank() is not defined");
} else {
  const testHtml = fs.readFileSync(path.join(root, "test.html"), "utf8");
  const registryIds = new Set();

  tests.forEach((t, i) => {
    const where = `data/tests.js entry ${i + 1}${t && t.id ? ` (${t.id})` : ""}`;
    if (!t || !isText(t.id) || !/^[a-z0-9-]+$/.test(t.id)) {
      err(`${where}: id must be lower-case letters, digits and hyphens`);
      return;
    }
    if (registryIds.has(t.id)) err(`${where}: duplicate test id`);
    registryIds.add(t.id);
    if (!isText(t.title)) err(`${where}: missing title`);
    if (!isText(t.description)) err(`${where}: missing description`);
    if (!STATUSES.includes(t.status)) err(`${where}: status must be one of ${STATUSES.join(", ")}`);
    if (!(Number.isInteger(t.durationMinutes) && t.durationMinutes > 0)) err(`${where}: durationMinutes must be a positive integer`);

    if (t.status === "live") {
      if (!testHtml.includes(`<script src="data/${t.id}.js"></script>`)) {
        err(`test.html: missing <script src="data/${t.id}.js"></script>`);
      }
      if (run(`data/${t.id}.js`)) {
        const stats = validateBank(t.id, sandbox.BANKS && sandbox.BANKS[t.id]);
        if (stats) summaries.push({ id: t.id, stats });
      }
    }
  });

  // Banks on disk that the registry doesn't mention.
  fs.readdirSync(path.join(root, "data"))
    .filter((f) => f.endsWith(".js") && f !== "tests.js")
    .forEach((f) => {
      const id = f.replace(/\.js$/, "");
      if (!registryIds.has(id)) warn(`data/${f}: not listed in data/tests.js`);
    });
}

/* ---------- report ---------- */

const fmtCounts = (obj) => Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(", ");

summaries.forEach(({ id, stats }) => {
  console.log(`${id}: ${stats.total} questions`);
  console.log(`  categories  ${fmtCounts(stats.category)}`);
  console.log(`  types       ${fmtCounts(stats.type)}`);
  console.log(`  difficulty  ${fmtCounts(stats.difficulty)}`);
});

warnings.forEach((w) => console.log(`WARN  ${w}`));
errors.forEach((e) => console.log(`ERROR ${e}`));

if (errors.length) {
  console.log(`\nFAILED: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`\nOK: ${warnings.length} warning(s).`);
