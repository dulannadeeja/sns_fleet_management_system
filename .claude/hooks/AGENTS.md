# .claude/hooks/: project hooks (wired in `.claude/settings.json`)

| Hook | Event | Does |
| --- | --- | --- |
| `session-start.mjs` | SessionStart | Records the session model; shows branch, last commit and the audit result |
| `model-advisor.mjs` | UserPromptSubmit | For planning, money, security, decisions, data model or hard debugging on a lower model: asks the agent to suggest `/model opus` |
| `guard.mjs` | PreToolUse | Blocks edits to frozen and generated files, pushes to `main`, force-push, `--no-verify`, deleting top-level folders |
| `post-edit.mjs` | PostToolUse | Syncs the design-system copy and the skills index, creates `CLAUDE.md` imports, checks links of an edited markdown file, reminds the rank-order follow-ups |
| `stop-audit.mjs` | Stop | Runs the sync audit when files changed; hard failures keep the agent working |

## Rules
- Node only, no dependencies, fast (under a few seconds except the Stop audit). Paths through `hook-lib.mjs`.
- Exit 2 blocks (PreToolUse) or keeps working (Stop), with the reason on stderr. Context for the agent goes out as `hookSpecificOutput.additionalContext`.
- Test a change by piping sample JSON: `echo '{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}' | node .claude/hooks/guard.mjs; echo $?`.
