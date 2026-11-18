<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Development Standards

### Frontend

- Build UI with the preinstalled shadcn components (`components/ui`). Check
  for an existing component before writing custom markup or styling.
- Add missing shadcn components via the shadcn CLI rather than hand-rolling
  equivalents.
- All user-facing UI text (labels, buttons, placeholders, errors, metadata,
  empty states) must be written in Vietnamese, regardless of the language the
  user uses when talking to the agent (English or Vietnamese).

### All code

- Code must be well tested. New features and bug fixes ship with tests
  covering expected behavior, edge cases, and failure paths.
- Run the test suite before considering work done; do not leave failing or
  skipped tests behind.

## Agent skills

### Issue tracker

Issues and specs are local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
