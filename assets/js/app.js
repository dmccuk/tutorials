/*
 * Skills-test engine: landing page, timed test, scoring and results.
 * No dependencies. Works from file:// and on GitHub Pages.
 */
(function () {
  "use strict";

  var DIFFICULTY = { 1: "Easy", 2: "Medium", 3: "Hard" };

  /* ---------- helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Escape text and turn `backticks` into <code>.
  function fmt(s) {
    return escapeHtml(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  // Text answers are compared after trimming, collapsing whitespace and lower-casing.
  function normalize(s) {
    return String(s == null ? "" : s).trim().replace(/\s+/g, " ").toLowerCase();
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function range(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(i);
    return out;
  }

  // sessionStorage can be unavailable (private mode, blocked storage); the test still works without it.
  function load(key) {
    try { var raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function save(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  function forget(key) {
    try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function formatClock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return pad(Math.floor(s / 60)) + ":" + pad(s % 60);
  }

  function formatDuration(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + "m " + pad(s % 60) + "s";
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function percent(n, d) { return d ? Math.round((n / d) * 100) : 0; }

  function announce(msg) {
    var live = $("sr-live");
    if (!live) return;
    live.textContent = "";
    setTimeout(function () { live.textContent = msg; }, 50);
  }

  function findTest(id) {
    return (window.TESTS || []).filter(function (t) { return t.id === id; })[0] || null;
  }

  function storeKey(testId) { return "tutorials:attempt:" + testId; }

  /* ---------- scoring ---------- */

  function isAnswered(q, a) {
    if (a == null) return false;
    if (q.type === "multi") return Array.isArray(a) && a.length > 0;
    if (q.type === "text") return normalize(a) !== "";
    return typeof a === "number";
  }

  function isCorrect(q, a) {
    if (!isAnswered(q, a)) return false;
    if (q.type === "single") return a === q.answer;
    if (q.type === "multi") {
      var want = q.answer.slice().sort(function (x, y) { return x - y; });
      var got = a.slice().sort(function (x, y) { return x - y; });
      return want.length === got.length && want.every(function (v, i) { return v === got[i]; });
    }
    var given = normalize(a);
    return q.answer.some(function (ans) { return normalize(ans) === given; });
  }

  /* ---------- landing page ---------- */

  function initLanding() {
    var form = $("start-form");
    var nameInput = $("candidate");
    var list = $("test-list");
    var params = new URLSearchParams(location.search);
    var tests = window.TESTS || [];

    // An interviewer can link straight to a test with index.html?test=<id>.
    var wanted = findTest(params.get("test"));
    var firstLive = tests.filter(function (t) { return t.status === "live"; })[0];
    var selected = wanted && wanted.status === "live" ? wanted.id : firstLive && firstLive.id;

    list.innerHTML = tests.map(function (t) {
      var live = t.status === "live";
      return '<label class="test-card' + (live ? "" : " is-soon") + '">' +
        '<input type="radio" name="test" value="' + escapeHtml(t.id) + '"' +
          (live ? "" : " disabled") + (t.id === selected ? " checked" : "") + ">" +
        '<span class="test-card-body">' +
          '<span class="test-card-title">' + escapeHtml(t.title) + "</span>" +
          '<span class="test-card-desc">' + escapeHtml(t.description) + "</span>" +
          '<span class="test-card-meta">' +
            (live ? escapeHtml(t.durationMinutes + " minutes") : '<span class="badge">Coming soon</span>') +
          "</span>" +
        "</span></label>";
    }).join("");

    if (params.get("name")) nameInput.value = params.get("name");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = nameInput.value.trim().replace(/\s+/g, " ");
      var chosen = form.querySelector('input[name="test"]:checked');

      $("name-error").hidden = !!name;
      nameInput.setAttribute("aria-invalid", name ? "false" : "true");
      $("test-error").hidden = !!chosen;

      if (!name) { nameInput.focus(); return; }
      if (!chosen) { list.querySelector("input:not([disabled])").focus(); return; }

      location.href = "test.html?" + new URLSearchParams({ test: chosen.value, name: name }).toString();
    });
  }

  /* ---------- test page ---------- */

  function showError(msg) {
    $("error-msg").textContent = msg;
    $("error").hidden = false;
  }

  function newAttempt(test, bank, name) {
    var optionOrder = {};
    bank.forEach(function (q) {
      if (q.options) optionOrder[q.id] = shuffle(range(q.options.length));
    });
    return {
      testId: test.id,
      name: name,
      startedAt: Date.now(),
      durationMs: test.durationMinutes * 60 * 1000,
      order: shuffle(bank.map(function (q) { return q.id; })),
      optionOrder: optionOrder,
      answers: {},
      current: 0,
      finishedAt: null,
      reason: null
    };
  }

  // A stored attempt is reused only if it is for the same person and the bank hasn't changed.
  function isUsable(state, bank, byId, name) {
    return !!state && state.name === name &&
      Array.isArray(state.order) && state.order.length === bank.length &&
      state.order.every(function (id) {
        var q = byId[id];
        return q && (!q.options || (state.optionOrder[id] || []).length === q.options.length);
      });
  }

  function initTest() {
    var params = new URLSearchParams(location.search);
    var test = findTest(params.get("test"));
    var name = (params.get("name") || "").trim().replace(/\s+/g, " ");
    var bank = test && window.BANKS && window.BANKS[test.id];

    if (!test || test.status !== "live" || !bank) {
      showError("That test isn't available. Check the link, or choose a test from the start page.");
      return;
    }
    if (!name) {
      showError("Please enter your name on the start page first.");
      return;
    }

    document.title = test.title + " · Skills Test";
    $("test-title").textContent = test.title;

    var byId = {};
    bank.forEach(function (q) { byId[q.id] = q; });

    var key = storeKey(test.id);
    var state = load(key);
    if (!isUsable(state, bank, byId, name)) {
      state = newAttempt(test, bank, name);
      save(key, state);
    }

    var ctx = { test: test, bank: bank, byId: byId, key: key, state: state };

    if (state.finishedAt) {
      renderResults(ctx);
    } else if (Date.now() >= state.startedAt + state.durationMs) {
      finish(ctx, "timeout", state.startedAt + state.durationMs);
    } else {
      runQuiz(ctx);
    }
  }

  function finish(ctx, reason, at) {
    if (ctx.timerId) clearInterval(ctx.timerId);
    ctx.state.finishedAt = at || Date.now();
    ctx.state.reason = reason;
    save(ctx.key, ctx.state);
    var dialog = $("finish-dialog");
    if (dialog.open) dialog.close();
    $("quiz").hidden = true;
    renderResults(ctx);
    announce(reason === "timeout" ? "Time is up. Your results are shown below." : "Test finished. Your results are shown below.");
  }

  function runQuiz(ctx) {
    var state = ctx.state;
    var byId = ctx.byId;
    var total = state.order.length;
    var form = $("q-form");
    var grid = $("q-grid");
    var timer = $("timer");
    var deadline = state.startedAt + state.durationMs;

    function currentQ() { return byId[state.order[state.current]]; }
    function persist() { save(ctx.key, state); }

    function answeredCount() {
      return state.order.filter(function (id) { return isAnswered(byId[id], state.answers[id]); }).length;
    }

    function renderGrid() {
      grid.innerHTML = state.order.map(function (id, i) {
        var done = isAnswered(byId[id], state.answers[id]);
        var here = i === state.current;
        return '<button type="button" class="q-dot' + (done ? " is-done" : "") + '" data-index="' + i + '"' +
          (here ? ' aria-current="step"' : "") +
          ' aria-label="Question ' + (i + 1) + (done ? ", answered" : ", not answered") + '">' + (i + 1) + "</button>";
      }).join("");
      var n = answeredCount();
      $("answered-count").textContent = "(" + n + " of " + total + " answered)";
      $("progress-bar").style.width = percent(n, total) + "%";
    }

    function renderQuestion(focus) {
      var q = currentQ();
      var a = state.answers[q.id];
      var html = '<h2 id="q-heading" class="q-text" tabindex="-1">' + fmt(q.question) + "</h2>";
      if (q.code) html += '<pre class="code"><code>' + escapeHtml(q.code) + "</code></pre>";

      if (q.type === "text") {
        html += '<div class="field">' +
          '<label for="text-answer">Your answer</label>' +
          '<input id="text-answer" class="mono" type="text" autocomplete="off" autocapitalize="off" ' +
            'autocorrect="off" spellcheck="false" aria-describedby="q-heading text-hint" value="' + escapeHtml(a || "") + '">' +
          '<p id="text-hint" class="hint">Type the full command or output. Capital letters and extra spaces don\'t matter.</p>' +
          "</div>";
      } else {
        var multi = q.type === "multi";
        html += '<fieldset class="options" aria-describedby="q-heading">' +
          '<legend class="hint">' + (multi ? "Select all that apply" : "Select one answer") + "</legend>" +
          state.optionOrder[q.id].map(function (orig) {
            var checked = multi ? Array.isArray(a) && a.indexOf(orig) !== -1 : a === orig;
            return '<label class="option"><input type="' + (multi ? "checkbox" : "radio") + '" name="answer" value="' + orig + '"' +
              (checked ? " checked" : "") + "><span>" + fmt(q.options[orig]) + "</span></label>";
          }).join("") +
          "</fieldset>";
      }
      form.innerHTML = html;

      $("q-meta").textContent = "Question " + (state.current + 1) + " of " + total + " · " + q.category;
      $("prev-btn").disabled = state.current === 0;
      $("next-btn").hidden = state.current === total - 1;
      renderGrid();
      if (focus) $("q-heading").focus();
    }

    function goTo(i) {
      state.current = Math.max(0, Math.min(total - 1, i));
      persist();
      renderQuestion(true);
    }

    function readAnswer() {
      var q = currentQ();
      if (q.type === "text") {
        state.answers[q.id] = $("text-answer").value;
      } else if (q.type === "multi") {
        state.answers[q.id] = Array.prototype.map.call(
          form.querySelectorAll('input[name="answer"]:checked'),
          function (el) { return Number(el.value); });
      } else {
        var el = form.querySelector('input[name="answer"]:checked');
        state.answers[q.id] = el ? Number(el.value) : null;
      }
      persist();
      renderGrid();
    }

    function openFinish() {
      var left = total - answeredCount();
      var msg = left === 0
        ? "You have answered every question. You can't change your answers after finishing."
        : "You have " + left + " unanswered question" + (left === 1 ? "" : "s") +
          ". Unanswered questions score zero. You can't change your answers after finishing.";
      var dialog = $("finish-dialog");
      if (typeof dialog.showModal === "function") {
        $("finish-msg").textContent = msg;
        dialog.showModal();
      } else if (window.confirm("Finish the test? " + msg)) {
        finish(ctx, "submitted");
      }
    }

    var warned = { five: false, one: false };
    function tick() {
      var left = deadline - Date.now();
      timer.textContent = formatClock(left);
      timer.classList.toggle("is-warn", left <= 5 * 60 * 1000);
      timer.classList.toggle("is-danger", left <= 60 * 1000);
      if (!warned.five && left <= 5 * 60 * 1000) {
        warned.five = true;
        if (left > 60 * 1000) announce("5 minutes remaining.");
      }
      if (!warned.one && left <= 60 * 1000) {
        warned.one = true;
        if (left > 0) announce("1 minute remaining.");
      }
      if (left <= 0) finish(ctx, "timeout", deadline);
    }

    form.addEventListener("change", readAnswer);
    form.addEventListener("input", readAnswer);
    // Enter in the text box moves on, like pressing Next.
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (state.current < total - 1) goTo(state.current + 1); else openFinish();
    });
    $("prev-btn").addEventListener("click", function () { goTo(state.current - 1); });
    $("next-btn").addEventListener("click", function () { goTo(state.current + 1); });
    $("finish-btn").addEventListener("click", openFinish);
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".q-dot");
      if (btn) goTo(Number(btn.getAttribute("data-index")));
    });
    $("finish-cancel").addEventListener("click", function () { $("finish-dialog").close(); });
    $("finish-confirm").addEventListener("click", function () { finish(ctx, "submitted"); });

    $("quiz").hidden = false;
    timer.hidden = false;
    renderQuestion(false);
    tick();
    ctx.timerId = setInterval(tick, 500);
  }

  /* ---------- results ---------- */

  function summarise(ctx) {
    var state = ctx.state;
    var rows = state.order.map(function (id, i) {
      var q = ctx.byId[id];
      var a = state.answers[id];
      return { q: q, n: i + 1, a: a, answered: isAnswered(q, a), correct: isCorrect(q, a) };
    });

    // Categories in bank order, not shuffled order, so every report reads the same way.
    var cats = [];
    var byCat = {};
    ctx.bank.forEach(function (q) {
      if (!byCat[q.category]) { byCat[q.category] = { name: q.category, correct: 0, total: 0 }; cats.push(byCat[q.category]); }
    });
    rows.forEach(function (r) {
      byCat[r.q.category].total++;
      if (r.correct) byCat[r.q.category].correct++;
    });

    var score = rows.filter(function (r) { return r.correct; }).length;
    return {
      rows: rows,
      cats: cats,
      score: score,
      total: rows.length,
      pct: percent(score, rows.length),
      taken: Math.min(state.finishedAt - state.startedAt, state.durationMs)
    };
  }

  function statusOf(r) { return r.correct ? "correct" : r.answered ? "incorrect" : "unanswered"; }

  function finishedHow(state) {
    return state.reason === "timeout" ? "Time ran out" : "Submitted by candidate";
  }

  function resultsText(ctx, s) {
    var state = ctx.state;
    var lines = [
      "Skills test results: " + ctx.test.title,
      "Candidate: " + state.name,
      "Started: " + formatDate(state.startedAt),
      "Time taken: " + formatDuration(s.taken) + " (limit " + ctx.test.durationMinutes + " min)",
      "Finished: " + finishedHow(state),
      "Score: " + s.score + "/" + s.total + " (" + s.pct + "%)",
      "",
      "By category:"
    ];
    s.cats.forEach(function (c) {
      lines.push("- " + c.name + ": " + c.correct + "/" + c.total + " (" + percent(c.correct, c.total) + "%)");
    });
    lines.push("", "Questions (in the order shown):");
    s.rows.forEach(function (r) {
      lines.push(pad(r.n) + ". " + statusOf(r).toUpperCase() + "  " + r.q.id +
        " (" + r.q.category + ", " + DIFFICULTY[r.q.difficulty] + ")");
    });
    return lines.join("\n");
  }

  function reviewItem(ctx, r) {
    var q = r.q;
    var status = statusOf(r);
    var label = { correct: "Correct", incorrect: "Incorrect", unanswered: "Not answered" }[status];
    var html = '<li class="review-item is-' + status + '">' +
      '<div class="review-head"><span class="pill pill-' + status + '">' + label + "</span>" +
      '<span class="muted">Q' + r.n + " · " + escapeHtml(q.category) + " · " + DIFFICULTY[q.difficulty] + "</span></div>" +
      '<h3 class="review-q">' + fmt(q.question) + "</h3>";
    if (q.code) html += '<pre class="code"><code>' + escapeHtml(q.code) + "</code></pre>";

    if (q.type === "text") {
      var others = q.answer.slice(1).filter(function (a) { return !/^sudo /.test(a); }).slice(0, 4);
      html += '<p><span class="label">Your answer:</span> ' +
        (r.answered ? "<code>" + escapeHtml(r.a.trim()) + "</code>" : "<em>No answer</em>") + "</p>" +
        '<p><span class="label">Expected:</span> <code>' + escapeHtml(q.answer[0]) + "</code></p>";
      if (others.length) {
        html += '<p class="hint">Also accepted: ' + others.map(function (a) { return "<code>" + escapeHtml(a) + "</code>"; }).join(", ") +
          (q.answer.some(function (a) { return /^sudo /.test(a); }) ? ", and any of these with <code>sudo</code>" : "") + "</p>";
      }
    } else {
      var correctSet = q.type === "multi" ? q.answer : [q.answer];
      var picked = q.type === "multi" ? (r.answered ? r.a : []) : (r.answered ? [r.a] : []);
      html += '<ul class="review-options">' + ctx.state.optionOrder[q.id].map(function (orig) {
        var isAns = correctSet.indexOf(orig) !== -1;
        var isPicked = picked.indexOf(orig) !== -1;
        var tags = [];
        if (isPicked) tags.push('<span class="tag tag-picked">Your choice</span>');
        if (isAns) tags.push('<span class="tag tag-answer">Correct answer</span>');
        return '<li class="' + (isAns ? "is-answer " : "") + (isPicked ? "is-picked" : "") + '">' +
          '<span class="opt-text">' + fmt(q.options[orig]) + "</span> " + tags.join(" ") + "</li>";
      }).join("") + "</ul>";
    }

    html += '<div class="explanation"><span class="label">Explanation:</span> ' + fmt(q.explanation) + "</div></li>";
    return html;
  }

  function renderResults(ctx) {
    var state = ctx.state;
    var s = summarise(ctx);
    var timer = $("timer");
    timer.hidden = false;
    timer.textContent = "Finished";
    timer.classList.remove("is-warn", "is-danger");
    timer.setAttribute("aria-label", "Test finished");

    var catRows = s.cats.map(function (c) {
      var p = percent(c.correct, c.total);
      return "<tr><th scope=\"row\">" + escapeHtml(c.name) + "</th>" +
        '<td class="num">' + c.correct + " / " + c.total + "</td>" +
        '<td class="bar-cell"><span class="meter meter-small" aria-hidden="true"><span style="width:' + p + '%"></span></span>' +
        '<span class="num">' + p + "%</span></td></tr>";
    }).join("");

    var el = $("results");
    el.innerHTML =
      '<div class="card results-summary">' +
        '<p class="eyebrow">Results</p>' +
        '<h1 id="results-heading" tabindex="-1">' + escapeHtml(ctx.test.title) + "</h1>" +
        '<div class="score"><span class="score-num">' + s.score + '<span class="muted"> / ' + s.total + "</span></span>" +
          '<span class="score-pct">' + s.pct + "%</span></div>" +
        '<span class="meter" role="img" aria-label="Score ' + s.pct + ' percent"><span style="width:' + s.pct + '%"></span></span>' +
        '<dl class="facts">' +
          "<div><dt>Candidate</dt><dd>" + escapeHtml(state.name) + "</dd></div>" +
          "<div><dt>Started</dt><dd>" + escapeHtml(formatDate(state.startedAt)) + "</dd></div>" +
          "<div><dt>Time taken</dt><dd>" + formatDuration(s.taken) + " of " + ctx.test.durationMinutes + " min</dd></div>" +
          "<div><dt>Finished</dt><dd>" + finishedHow(state) + "</dd></div>" +
        "</dl>" +
      "</div>" +
      '<div class="result-actions no-print">' +
        '<button type="button" id="copy-btn" class="btn btn-primary">Copy results</button>' +
        '<button type="button" id="print-btn" class="btn">Print or save as PDF</button>' +
        '<a class="btn btn-ghost" href="index.html">Start page</a>' +
        '<button type="button" id="restart-btn" class="btn btn-ghost">New attempt</button>' +
      "</div>" +
      '<p id="copy-status" class="hint no-print" role="status"></p>' +
      '<textarea id="copy-fallback" class="copy-fallback no-print" rows="10" readonly hidden aria-label="Results text"></textarea>' +
      '<section class="card">' +
        "<h2>By category</h2>" +
        '<table class="cat-table"><thead><tr><th scope="col">Category</th><th scope="col">Correct</th><th scope="col">Score</th></tr></thead>' +
        "<tbody>" + catRows + "</tbody></table>" +
      "</section>" +
      '<section class="review-section">' +
        "<h2>Question review</h2>" +
        '<ol class="review">' + s.rows.map(function (r) { return reviewItem(ctx, r); }).join("") + "</ol>" +
      "</section>";
    el.hidden = false;

    var text = resultsText(ctx, s);
    $("copy-btn").addEventListener("click", function () {
      copyText(text).then(function (ok) {
        var fallback = $("copy-fallback");
        if (ok) {
          $("copy-status").textContent = "Results copied to the clipboard.";
          fallback.hidden = true;
        } else {
          $("copy-status").textContent = "Couldn't copy automatically. Select the text below and copy it.";
          fallback.value = text;
          fallback.hidden = false;
          fallback.focus();
          fallback.select();
        }
      });
    });
    $("print-btn").addEventListener("click", function () { window.print(); });
    $("restart-btn").addEventListener("click", function () {
      if (window.confirm("Start a new attempt? These results will be cleared from this browser tab, so copy or print them first.")) {
        forget(ctx.key);
        location.reload();
      }
    });

    $("results-heading").focus();
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  /* ---------- boot ---------- */

  var page = document.body.getAttribute("data-page");
  if (page === "landing") initLanding();
  else if (page === "test") initTest();
})();
