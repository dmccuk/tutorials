# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**tutorials** (working name) is a skills-test website for technical interviews. An interviewer
sends a candidate a link, the candidate takes a timed test (often while screen-sharing), and
the result is shown at the end so it can be shared with the interviewer.

- **Now:** a single **Linux Administration** test.
- **Planned:** Ansible, Python, PowerShell, Bash/shell scripting, and more.
- **Later (possible):** its own domain, paid access for employers, and results delivered
  to the employer rather than shown to the candidate.

## Scope of this folder

- Root: `D:\claude_code\tutorials`. Only work inside this folder unless the owner asks
  otherwise.
- Git remote (once created): `github.com/dmccuk/tutorials`, served via **GitHub Pages**
  from the `main` branch root.
- Repo visibility: **public for now**, by the owner's choice. The owner is on GitHub Pro, so
  Pages would also work from a private repo; don't change visibility without asking.
- Git identity: Dennis McCarthy <dmccuk@gmail.com>. The `gh` CLI is logged in as `dmccuk`
  (active) with `repo` and `workflow` scopes. A second account, `londoniac`, is also logged
  in. Never switch to it or push as it.

## What Claude can do here

- Read, create and edit files in this folder.
- Run local commands (git, node, python, PowerShell, bash) to build, check and preview.
- Use `gh` to manage the `dmccuk/tutorials` repo: issues, PRs, Pages settings, Actions.

## Permission rules (must follow)

1. **Never delete anything without the owner's explicit permission.** This covers files,
   folders, branches, tags, repos, releases, issues, and git history. Ask first, every time.
2. **Ask before anything potentially disruptive or outward-facing**, including:
   - `git push` (especially force-push), rewriting history (`rebase`, `reset --hard`,
     `commit --amend` on pushed commits), or discarding uncommitted work.
   - Creating or changing GitHub repos, visibility, Pages, Actions, secrets or settings.
   - Installing global tools/packages or changing system or global git config.
   - Anything that costs money or publishes content.
3. Local, reversible work (editing files, local commits, running checks) does not need
   approval, but summarise what was changed.
4. Approval for one action doesn't carry over to the next. When unsure, ask.

## Architecture

Plain static site: no framework, no build step, no dependencies. It works when opened
straight from disk (`file://`) and on GitHub Pages.

```
index.html              Landing page: candidate name + test picker
test.html               Test runner (reads ?test=<id>)
assets/css/style.css    All styles (light/dark via CSS variables)
assets/js/app.js        Test engine: shuffle, timer, scoring, results
data/tests.js           Registry of tests (id, title, duration, status)
data/linux.js           Linux Admin question bank
scripts/validate.js     Checks every question bank (run: node scripts/validate.js)
.nojekyll               Stops GitHub Pages running Jekyll
```

Question banks are `.js` files (not `.json`) so the site works from `file://`, where
`fetch()` of local files is blocked.

### Adding a new test

1. Create `data/<id>.js` that calls `registerBank("<id>", [ ...questions ])`.
2. Add an entry to `data/tests.js` with `status: "live"`.
3. Add `<script src="data/<id>.js"></script>` to `test.html`.
4. Run `node scripts/validate.js`.

### Question format

```js
{
  id: "linux-perm-01",          // unique, stable (used in results)
  category: "Permissions",
  difficulty: 1,                // 1 easy, 2 medium, 3 hard
  type: "single",               // "single" | "multi" | "text"
  question: "…",
  code: "optional code block shown under the question",
  options: ["…", "…"],          // single/multi only
  answer: 0,                    // single: index; multi: [indexes]; text: [accepted strings]
  explanation: "Shown in the review after the test."
}
```

`text` answers are compared after trimming, collapsing whitespace and lower-casing.
List every reasonable form in `answer`.

## Known limitation

Answers ship to the browser, so a candidate could read them with dev tools. This is fine
for a screen-shared interview. A paid version would need server-side questions and grading
(for example a small API), with results sent to the employer.

## Conventions

- Keep the site dependency-free and accessible: keyboard navigable, labelled inputs,
  good contrast in light and dark mode.
- Questions must be technically accurate. Prefer modern tools (`ip`, `ss`, `systemctl`,
  `journalctl`) and mention distro differences where relevant.
- Run `node scripts/validate.js` before committing question changes.
