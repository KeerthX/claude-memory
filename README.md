# memclaude

**Persistent memory for Claude Code.** Automatically saves every session and loads your project context when you come back.

Claude Code forgets everything when you close it. memclaude fixes that — silently, automatically, with no changes to how you work.

---

## Install

```bash
npm install -g memclaude
```

Then run the setup command once (requires Administrator on Windows):

```bash
claude-mem install
```

That's it. From now on, typing `claude` in any project folder automatically loads and saves memory.

---

## How it works

When you type `claude`:

1. memclaude checks if this project has a memory file
2. If it does, it injects your saved context into `CLAUDE.md` before Claude starts — so Claude already knows your stack, decisions, and what you were working on
3. Your session runs normally
4. When you close Claude, memclaude reads what happened and saves it to your memory file
5. Next session, Claude picks up right where you left off

Memory is stored in `~/.claude-memory/projects/` — completely outside your repo, never committed to git.

---

## First time in a project

```
$ claude
claude-memory: memory enabled for "my-app"
```

A memory file is created for this project. After your first session, context is captured automatically.

---

## Returning to a project

```
$ claude
claude-memory: context loaded for "my-app"
```

Claude starts the session already knowing:
- Your stack and tools
- What you were working on last time
- Files you changed
- Decisions you made

---

## Managing memory

```bash
cmem list              # see all projects with memory
cmem show              # view full memory for current project
cmem show --context    # view only the context Claude sees
cmem show --log        # view only the session history
cmem clear             # clear context (keep session log)
cmem clear --log       # clear session log (keep context)
cmem clear --all       # wipe everything for this project
cmem delete            # delete memory for current project
cmem delete --all      # delete ALL memories
cmem open              # open memory file in your editor
cmem config            # change settings
cmem config --show     # view current settings
```

---

## Memory file format

Each project gets one `memory.md` file with two sections:

```markdown
# claude-memory: my-app
Path: /Users/you/projects/my-app
Last session: 2026-03-17

---
## Context
Last task: building the auth flow
Files changed: auth.js, middleware.js
Last summary: OAuth callback fixed, starting email verification

---
## Session log

### 2026-03-17 14:32  (~12 min)

**You:** fix the redirect loop in the OAuth callback
**Claude:** The issue is in your callback handler...

**You:** now start on email verification
**Claude:** For email verification you'll want to...
```

The context section is what Claude reads at the start of each session. The session log is your full history.

---

## Uninstall

```bash
claude-mem uninstall
npm uninstall -g memclaude
```

`claude-mem uninstall` restores the original `claude` command. Your memories stay at `~/.claude-memory/projects` until you delete them with `cmem delete --all`.

---

## Requirements

- Node.js 18 or higher
- [Claude Code](https://www.npmjs.com/package/@anthropic-ai/claude-code) installed globally
- Windows: run `claude-mem install` as Administrator

---

## License

MIT