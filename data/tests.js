/*
 * Test registry. Order here is the order shown on the landing page.
 * status: "live" (can be taken) or "soon" (shown as coming soon).
 * Each live test needs a bank in data/<id>.js and a <script> tag in test.html.
 */
window.TESTS = [
  {
    id: "linux",
    title: "Linux Administration",
    description: "Permissions, processes, systemd, networking, storage, users and groups, logs and text processing.",
    durationMinutes: 30,
    status: "live"
  },
  {
    id: "ansible",
    title: "Ansible",
    description: "Inventories, playbooks, roles, variables, handlers and idempotency.",
    durationMinutes: 30,
    status: "soon"
  },
  {
    id: "python",
    title: "Python",
    description: "Data types, strings, control flow, functions, collections, classes, exceptions and tooling (Python 3.10+).",
    durationMinutes: 30,
    status: "live"
  },
  {
    id: "powershell",
    title: "PowerShell",
    description: "Cmdlets, the pipeline, objects, remoting and scripting.",
    durationMinutes: 30,
    status: "soon"
  },
  {
    id: "bash",
    title: "Bash / Shell Scripting",
    description: "Quoting, expansion, conditionals, loops, exit codes and pipelines.",
    durationMinutes: 30,
    status: "soon"
  }
];

window.BANKS = window.BANKS || {};

/* Called by each data/<id>.js question bank. */
function registerBank(id, questions) {
  window.BANKS[id] = questions;
}
