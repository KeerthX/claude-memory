# claude-memory

Persistent memory for Claude Code. Automatically saves every session and
restores context when you return to a project.

## Install
```bash
npm install -g claude-memory
```

Requires [Claude Code](https://www.npmjs.com/package/@anthropic-ai/claude-code) to be installed first.

## Usage

Just use `claude` as normal. Memory works automatically.
```bash
cd my-project
claude
# claude-memory: context loaded for "my-project"
# ... your session runs ...
# claude-memory: 4 messages saved
```

First time in a project, a memory file is created. Every session after
that, context is loaded before Claude starts and saved after it ends.

## Commands
```bash
cmem list              # all projects with memory
cmem show              # full memory for current project
cmem show --context    # context section only
cmem show --log        # session log only
cmem clear             # clear context (keep log)
cmem clear --log       # clear log (keep context)
cmem clear --all       # clear everything
cmem delete            # delete memory for this project
cmem delete --all      # delete all memories
cmem config            # change settings
cmem open              # open memory file in editor
```

## How it works

- Memory is stored in `~/.claude-memory/projects/` — never in your repo
- Each project gets one `memory.md` file with a context section and session log
- Context is injected via `CLAUDE.md` before each session and cleaned up after
- Session content is read from Claude Code's own session files

## Uninstall
```bash
npm uninstall -g claude-memory
```

Your memories stay at `~/.claude-memory/projects` until you delete them.