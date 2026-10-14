# Project agent instructions

This is a static portfolio: `index.html`, project pages in `projects/`, and assets in `assets/`. There is no application build step or package manager setup.

## Workflow

- Complete requested edits and appropriate checks. Use the smallest change that solves the task.
- Preserve existing user changes. Avoid editing vendored files in `assets/vendor/` unless requested.
- For visual edits, preview with `python3 -m http.server 8000` and check the affected page at desktop and mobile sizes when a browser is available. Report checks that could not be run.
- Ask before publishing, deploying, or destructive operations unless already authorized.

## Project skills

- Read `.agents/skills/ponytail/SKILL.md` for coding work; default to the full level.
- Read `.agents/skills/caveman/SKILL.md` for concise chat responses. Preserve technical details and use normal prose in persisted files.
- Read `.agents/skills/graphify/SKILL.md` when asked to graph the project or investigate architecture and file relationships. Use an existing `graphify-out/graph.json` when useful; do not rebuild the graph for every small edit.
- Graphify is installed in `.venv`. Activate it with `source .venv/bin/activate`, or use `.venv/bin/graphify` and `.venv/bin/python` directly. Do not install it into system Python.

## Codex setup

Project defaults are in `.codex/config.toml`: workspace writes, approvals on request, and multi-agent support. Host or organization policies still take precedence. Trust the project in Codex to load its configuration.

Project skills become available on the next turn; restart Codex if they do not appear. Invoke `$ponytail`, `$caveman`, or `$graphify .`.

To recreate Graphify on another checkout:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-agent.txt
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
