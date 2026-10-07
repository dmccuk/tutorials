/*
 * Linux Administration question bank.
 * Format is documented in CLAUDE.md. Use `backticks` for inline code in
 * question, options and explanation text. Run `node scripts/validate.js` after edits.
 */
(function () {
  // Accept each command with and without a leading "sudo".
  function withSudo(list) {
    return list.concat(list.map(function (a) { return "sudo " + a; }));
  }

  // Every reasonable way to write "journalctl, unit <u>, follow".
  function journalFollow(units) {
    var forms = [
      "journalctl -u {u} -f", "journalctl -f -u {u}", "journalctl -fu {u}",
      "journalctl -u {u} --follow", "journalctl --follow -u {u}",
      "journalctl --unit {u} --follow", "journalctl --unit={u} --follow",
      "journalctl --follow --unit {u}", "journalctl --follow --unit={u}",
      "journalctl -f --unit={u}", "journalctl --unit={u} -f"
    ];
    var out = [];
    units.forEach(function (u) {
      forms.forEach(function (f) { out.push(f.replace("{u}", u)); });
    });
    return out;
  }

  registerBank("linux", [
    /* ---------- Permissions ---------- */
    {
      id: "linux-perm-01",
      category: "Permissions",
      difficulty: 1,
      type: "single",
      question: "A file shows `-rwxr-x---` in `ls -l`. What is its permission mode in octal?",
      options: ["`750`", "`754`", "`640`", "`705`"],
      answer: 0,
      explanation: "Owner `rwx` = 4+2+1 = 7, group `r-x` = 4+1 = 5, others `---` = 0, giving `750`."
    },
    {
      id: "linux-perm-02",
      category: "Permissions",
      difficulty: 2,
      type: "single",
      question: "What is the effect of setting the setgid bit on a directory, for example `chmod g+s /srv/shared`?",
      options: [
        "New files and subdirectories created inside it inherit the directory's group",
        "Files inside it can only be deleted or renamed by their owner",
        "Only members of the directory's group can list its contents",
        "Every new file created inside it is made group-writable"
      ],
      answer: 0,
      explanation: "On a directory, setgid makes new entries inherit the directory's group (and new subdirectories inherit the setgid bit too), which is handy for shared team folders. It does not change the permission bits of new files; that's still the umask. Restricting deletion to the file's owner is the sticky bit (`chmod +t`), as used on `/tmp`."
    },
    {
      id: "linux-perm-03",
      category: "Permissions",
      difficulty: 2,
      type: "single",
      question: "With a umask of `027`, what permissions does a new regular file created with `touch` get?",
      options: ["`-rw-r-----` (640)", "`-rwxr-x---` (750)", "`-rw-r--r--` (644)", "`-rw-rw----` (660)"],
      answer: 0,
      explanation: "Regular files start from `666` (no execute bits) and the umask bits are removed: `666` with `027` masked off is `640`. Directories start from `777`, so a new directory would get `750`."
    },
    {
      id: "linux-perm-04",
      category: "Permissions",
      difficulty: 1,
      type: "text",
      question: "Type the command that recursively changes the owner to `alice` and the group to `devs` for `/srv/app` and everything under it.",
      answer: withSudo([
        "chown -R alice:devs /srv/app",
        "chown -R alice:devs /srv/app/",
        "chown --recursive alice:devs /srv/app",
        "chown --recursive alice:devs /srv/app/"
      ]),
      explanation: "`chown -R user:group path` changes owner and group recursively. The older `user.group` separator is deprecated; use a colon."
    },

    /* ---------- Processes ---------- */
    {
      id: "linux-proc-01",
      category: "Processes",
      difficulty: 1,
      type: "single",
      question: "Which signal does `kill <PID>` send when no signal is specified?",
      options: ["`SIGTERM` (15)", "`SIGKILL` (9)", "`SIGHUP` (1)", "`SIGINT` (2)"],
      answer: 0,
      explanation: "`kill` sends `SIGTERM` by default, which asks the process to exit and lets it clean up. `SIGKILL` cannot be caught or ignored and should be a last resort."
    },
    {
      id: "linux-proc-02",
      category: "Processes",
      difficulty: 1,
      type: "text",
      question: "Type a command that sends `SIGKILL` to the process with PID `4321`.",
      answer: withSudo([
        "kill -9 4321",
        "kill -KILL 4321",
        "kill -SIGKILL 4321",
        "kill -s KILL 4321",
        "kill -s SIGKILL 4321",
        "kill -s 9 4321"
      ]),
      explanation: "`kill -9 4321` (or `kill -KILL 4321`, or `kill -s KILL 4321`). The kernel ends the process immediately and it gets no chance to clean up, so try `SIGTERM` first."
    },
    {
      id: "linux-proc-03",
      category: "Processes",
      difficulty: 2,
      type: "single",
      question: "`ps` shows a process in state `Z` and marked `<defunct>`. What does this mean?",
      options: [
        "It has exited, but its parent has not yet collected its exit status with `wait()`",
        "It is sleeping in an uninterruptible wait, usually on disk or network I/O",
        "It has been stopped by `SIGSTOP` or Ctrl+Z",
        "It is using excessive CPU and should be killed with `SIGKILL`"
      ],
      answer: 0,
      explanation: "A zombie has already exited and holds nothing but its process-table entry until its parent reaps it. Killing the zombie does nothing; fix or restart the parent. If the parent dies, PID 1 (systemd) adopts and reaps it. State `D` is uninterruptible sleep and `T` is stopped."
    },
    {
      id: "linux-proc-04",
      category: "Processes",
      difficulty: 2,
      type: "multi",
      question: "Which statements about nice values on Linux are true?",
      options: [
        "Nice values range from -20 to 19",
        "A higher nice value means a lower scheduling priority",
        "Any unprivileged user can set their own process's nice value below 0",
        "`renice` changes the nice value of a process that is already running"
      ],
      answer: [0, 1, 3],
      explanation: "Nice runs from -20 (highest priority) to 19 (lowest). Unprivileged users can only make their processes nicer (raise the value); lowering it needs root or `CAP_SYS_NICE` (or an `RLIMIT_NICE` allowance). Use `nice -n 10 cmd` to start a process and `renice -n 10 -p PID` for a running one."
    },

    /* ---------- systemd ---------- */
    {
      id: "linux-sysd-01",
      category: "systemd",
      difficulty: 1,
      type: "text",
      question: "Type a single `systemctl` command that enables the `nginx` service at boot and also starts it now.",
      answer: withSudo([
        "systemctl enable --now nginx",
        "systemctl enable --now nginx.service",
        "systemctl --now enable nginx",
        "systemctl --now enable nginx.service",
        "systemctl enable nginx --now",
        "systemctl enable nginx.service --now"
      ]),
      explanation: "`systemctl enable --now nginx` creates the boot-time symlinks and starts the unit in one step. Without `--now`, `enable` only affects future boots."
    },
    {
      id: "linux-sysd-02",
      category: "systemd",
      difficulty: 2,
      type: "single",
      question: "You edited `/etc/systemd/system/myapp.service` by hand. What must you run before `systemctl restart myapp` will use the new unit definition?",
      options: [
        "`systemctl daemon-reload`",
        "`systemctl reset-failed`",
        "`journalctl --rotate`",
        "Nothing: systemd watches unit files and reloads them automatically"
      ],
      answer: 0,
      explanation: "systemd caches unit definitions. After creating or changing a unit file, run `systemctl daemon-reload` so the manager re-reads them; `systemctl status` warns when a unit file has changed on disk. `systemctl edit myapp` creates a drop-in override and reloads for you."
    },
    {
      id: "linux-sysd-03",
      category: "systemd",
      difficulty: 2,
      type: "single",
      question: "What does `systemctl mask bluetooth.service` do?",
      options: [
        "Links the unit to `/dev/null` so it cannot be started at all, manually or as a dependency, until it is unmasked",
        "Disables it at boot, but still lets `systemctl start` run it manually",
        "Hides it from `systemctl list-units` output",
        "Stops it and deletes its unit file"
      ],
      answer: 0,
      explanation: "`mask` creates a symlink from `/etc/systemd/system/<unit>` to `/dev/null`, which makes the unit impossible to start. `disable` only removes the boot-time symlinks, so the unit can still be started manually or pulled in by another unit. Reverse it with `systemctl unmask`."
    },

    /* ---------- Networking ---------- */
    {
      id: "linux-net-01",
      category: "Networking",
      difficulty: 1,
      type: "text",
      question: "Using the `ip` tool, type the command that shows the routing table.",
      answer: [
        "ip route",
        "ip route show",
        "ip route list",
        "ip route ls",
        "ip r",
        "ip ro",
        "ip r s",
        "ip r show",
        "ip r list",
        "ip -4 route",
        "ip -4 route show",
        "ip -4 r"
      ],
      explanation: "`ip route` (short form `ip r`) shows the main routing table, including the default gateway. It replaces the legacy `route -n` and `netstat -r` from net-tools. Use `ip -6 route` for IPv6."
    },
    {
      id: "linux-net-02",
      category: "Networking",
      difficulty: 2,
      type: "multi",
      question: "Which commands list TCP sockets that are listening for connections?",
      options: [
        "`ss -tln`",
        "`netstat -tln`",
        "`lsof -iTCP -sTCP:LISTEN`",
        "`ip link show`",
        "`ip route get 8.8.8.8`"
      ],
      answer: [0, 1, 2],
      explanation: "`ss -tln` is the modern tool; add `-p` to see the owning process (root is needed to see other users' processes). `netstat -tln` shows the same, but comes from the legacy net-tools package that minimal installs often lack. `lsof` can filter by TCP state. `ip link` shows interfaces, and `ip route get` shows which route a packet would take."
    },
    {
      id: "linux-net-03",
      category: "Networking",
      difficulty: 2,
      type: "single",
      question: "Which file controls whether hostnames are looked up in `/etc/hosts` before DNS?",
      options: ["`/etc/nsswitch.conf`", "`/etc/resolv.conf`", "`/etc/hostname`", "`/etc/services`"],
      answer: 0,
      explanation: "The `hosts:` line in `/etc/nsswitch.conf` (for example `hosts: files dns`) sets the lookup order for programs using glibc. `/etc/resolv.conf` lists DNS servers and search domains; with systemd-resolved it usually points at the `127.0.0.53` stub. `dig` and `nslookup` query DNS directly and ignore nsswitch, so use `getent hosts <name>` to see what applications see."
    },

    /* ---------- Storage ---------- */
    {
      id: "linux-stor-01",
      category: "Storage",
      difficulty: 1,
      type: "text",
      question: "Type the command that shows used and available space on all mounted filesystems in human-readable units (such as `G` and `M`).",
      answer: ["df -h", "df --human-readable", "df --si"],
      explanation: "`df -h` uses powers of 1024; `df -H` (`--si`) uses powers of 1000. Add `-T` to show filesystem types, or use `df -i` to check inode usage, which can run out even when there's free space."
    },
    {
      id: "linux-stor-02",
      category: "Storage",
      difficulty: 3,
      type: "multi",
      question: "`df -h` reports `/var` as 95% full, but `du -sh /var` adds up to far less than `df`'s Used figure. Which of these could explain the difference?",
      options: [
        "A process still has a large deleted file open, such as a rotated log",
        "Files were written into a directory before another filesystem was mounted on top of it, hiding them",
        "`du` was run as a normal user and could not read some directories",
        "The filesystem has run out of inodes"
      ],
      answer: [0, 1, 2],
      explanation: "A deleted file's space is only freed when the last process closes it: find these with `lsof +L1` and restart or signal the process. Files hidden under a mount point are invisible to `du` but still use space; bind-mount the parent filesystem elsewhere to inspect them. `du` without root skips directories it can't read (it prints 'Permission denied'). Inode exhaustion causes 'No space left on device' while `df -h` still shows free space (check with `df -i`), but it doesn't make `du` and `df` disagree."
    },
    {
      id: "linux-stor-03",
      category: "Storage",
      difficulty: 3,
      type: "single",
      question: "`/dev/vg0/data` is an LVM logical volume holding an ext4 or XFS filesystem, and the volume group has free space. Which single command grows the volume by 10 GiB and also grows the filesystem?",
      options: [
        "`lvextend -r -L +10G /dev/vg0/data`",
        "`lvextend -L 10G /dev/vg0/data`",
        "`vgextend -L +10G vg0`",
        "`resize2fs /dev/vg0/data +10G`"
      ],
      answer: 0,
      explanation: "`-L +10G` adds 10 GiB (without the `+` it sets the total size to 10 GiB), and `-r` (`--resizefs`) runs the right filesystem resize tool afterwards. Done separately, you'd run `lvextend` then `resize2fs` for ext4 or `xfs_growfs <mountpoint>` for XFS. `vgextend` adds physical volumes to a volume group. XFS can grow but cannot shrink."
    },

    /* ---------- Users & Groups ---------- */
    {
      id: "linux-user-01",
      category: "Users & Groups",
      difficulty: 1,
      type: "text",
      question: "Type the command that adds the existing user `bob` to the supplementary group `docker` without removing `bob` from any other groups.",
      answer: withSudo([
        "usermod -aG docker bob",
        "usermod -a -G docker bob",
        "usermod -G docker -a bob",
        "usermod --append --groups docker bob",
        "gpasswd -a bob docker",
        "gpasswd --add bob docker",
        "adduser bob docker"
      ]),
      explanation: "`usermod -aG docker bob` appends the group. Forgetting `-a` replaces all of bob's supplementary groups with just `docker`, a common and painful mistake. `gpasswd -a bob docker` also works, as does `adduser bob docker` on Debian and Ubuntu. The change applies from bob's next login."
    },
    {
      id: "linux-user-02",
      category: "Users & Groups",
      difficulty: 1,
      type: "single",
      question: "On a modern Linux system, where are local users' password hashes stored?",
      options: ["`/etc/shadow`", "`/etc/passwd`", "`/etc/group`", "`/etc/login.defs`"],
      answer: 0,
      explanation: "`/etc/shadow` holds the hashes and password-ageing data and is readable only by root (and on some distros the `shadow` group). `/etc/passwd` is world-readable and just has an `x` in the password field. `/etc/login.defs` sets defaults such as the hashing method and UID ranges."
    },
    {
      id: "linux-user-03",
      category: "Users & Groups",
      difficulty: 2,
      type: "single",
      question: "You add `alice` to the `devs` group while alice is logged in. Running `id` in alice's existing shell doesn't list `devs`. Why?",
      options: [
        "Group membership is fixed when a session starts; alice must log in again, or run `newgrp devs` in that shell",
        "Group changes only take effect after the server is rebooted",
        "Group changes only take effect after `pwck` has been run",
        "Supplementary groups only apply to processes started by root"
      ],
      answer: 0,
      explanation: "A process's groups are set when the login session starts and are inherited by its children. Logging out and back in (or opening a new SSH session) picks up the change, and `newgrp devs` starts a subshell with that group. A reboot works too, but isn't necessary."
    },

    /* ---------- Logs ---------- */
    {
      id: "linux-log-01",
      category: "Logs",
      difficulty: 1,
      type: "text",
      question: "Type the `journalctl` command that follows (live-tails) the logs of the `nginx.service` unit.",
      answer: withSudo(journalFollow(["nginx", "nginx.service"])),
      explanation: "`journalctl -u nginx -f` filters by unit and follows new entries, like `tail -f`. Combine it with `-b` for the current boot, `--since \"10 min ago\"`, or `-p err` to show only errors and worse."
    },
    {
      id: "linux-log-02",
      category: "Logs",
      difficulty: 1,
      type: "single",
      question: "Which `journalctl` option limits output to messages from the current boot?",
      options: ["`-b`", "`-k`", "`-e`", "`-r`"],
      answer: 0,
      explanation: "`-b` shows the current boot and `-b -1` the previous one (this needs a persistent journal); `--list-boots` lists them all. `-k` shows only kernel messages, `-e` jumps to the end of the output, and `-r` shows the newest entries first."
    },
    {
      id: "linux-log-03",
      category: "Logs",
      difficulty: 3,
      type: "single",
      question: "After every reboot, `journalctl --list-boots` only shows the current boot. `journald.conf` has the default `Storage=auto`. What is the most likely cause?",
      options: [
        "`/var/log/journal` doesn't exist, so the journal is only kept in `/run/log/journal`, which is in memory",
        "rsyslog deletes the journal files at shutdown",
        "logrotate truncates the journal files every night",
        "journald only keeps history when started with a `--persistent` flag"
      ],
      answer: 0,
      explanation: "With `Storage=auto`, journald writes to `/var/log/journal` only if that directory exists; otherwise it uses volatile storage under `/run`, which is lost at reboot. Fix it with `mkdir -p /var/log/journal` and `systemctl restart systemd-journald`, or set `Storage=persistent`. Distros differ: some create the directory out of the box, others keep the journal volatile and rely on rsyslog to write files such as `/var/log/messages` (RHEL family) or `/var/log/syslog` (Debian family)."
    },

    /* ---------- Text Processing ---------- */
    {
      id: "linux-text-01",
      category: "Text Processing",
      difficulty: 1,
      type: "text",
      question: "Type a command that prints the number of lines in `/etc/passwd`.",
      answer: [
        "wc -l /etc/passwd",
        "wc -l < /etc/passwd",
        "wc -l </etc/passwd",
        "wc --lines /etc/passwd",
        "cat /etc/passwd | wc -l",
        "grep -c '' /etc/passwd",
        "grep -c ^ /etc/passwd",
        "awk 'END {print NR}' /etc/passwd",
        "awk 'END{print NR}' /etc/passwd"
      ],
      explanation: "`wc -l /etc/passwd` counts lines and prints the file name after the number; `wc -l < /etc/passwd` prints just the number. Note that `getent passwd` would also include users from LDAP or SSSD, which aren't in the file."
    },
    {
      id: "linux-text-02",
      category: "Text Processing",
      difficulty: 2,
      type: "single",
      question: "What does this command print?",
      code: "awk -F: '$3 >= 1000 { print $1 }' /etc/passwd",
      options: [
        "The username of every account with a UID of 1000 or higher",
        "The username of every account whose primary GID is 1000 or higher",
        "The third field of every line that contains `1000`",
        "The first field of the first 1000 lines"
      ],
      answer: 0,
      explanation: "`-F:` splits each line on colons. Field 1 is the username, field 3 the UID and field 4 the primary GID. On most distros regular users start at UID 1000 (`UID_MIN` in `/etc/login.defs`), so this lists human accounts, plus `nobody` (UID 65534) where it exists."
    },
    {
      id: "linux-text-03",
      category: "Text Processing",
      difficulty: 2,
      type: "multi",
      question: "Which commands print the lines of `app.log` that contain `error` in any letter case (`error`, `ERROR`, `Error`)?",
      options: [
        "`grep -i error app.log`",
        "`awk 'tolower($0) ~ /error/' app.log`",
        "`sed -n '/error/Ip' app.log` (GNU sed)",
        "`grep -v error app.log`",
        "`grep -I error app.log`"
      ],
      answer: [0, 1, 2],
      explanation: "`grep -i` ignores case. The awk version lower-cases each line before matching, and GNU sed's `I` modifier makes the match case-insensitive (`-n` with `p` prints only matching lines; BSD and macOS sed lack `I`). `grep -v` inverts the match, and capital `-I` makes grep skip binary files; it does not ignore case."
    }
  ]);
})();
