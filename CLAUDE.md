@AGENTS.md

## Claude Code only

- Project hooks in `.claude/settings.json`: a guard blocks edits to frozen or generated files and risky git commands; after an edit, generated copies are synced and links checked; the sync audit runs before a turn ends; a model advisor flags work that needs a higher model.
- Subagents are in `.claude/agents/`; delegate exploration and checks to them, and run reviewers in parallel.
- MCP servers in `.mcp.json`: `context7` (library docs), `playwright` (browser checks of screens and the app), `next-devtools` (once `app/` runs). TypeScript LSP comes from the `typescript-lsp` plugin (`npm install -g typescript-language-server typescript`).
