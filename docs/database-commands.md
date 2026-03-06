  ┌──────────────────────────────────────────┬────────────────────────────────────────┐
  │                   Task                   │                Command                 │
  ├──────────────────────────────────────────┼────────────────────────────────────────┤
  │ Schema changed, create + apply migration │ npx zenstack migrate dev --name <name> │
  ├──────────────────────────────────────────┼────────────────────────────────────────┤
  │ Apply migrations in production           │ npx zenstack migrate deploy            │
  ├──────────────────────────────────────────┼────────────────────────────────────────┤
  │ Quick sync without migration history     │ npx zenstack db push                   │
  ├──────────────────────────────────────────┼────────────────────────────────────────┤
  │ Regenerate the TypeScript client         │ npx zenstack generate                  │
  └──────────────────────────────────────────┴────────────────────────────────────────┘

  ★ Insight ─────────────────────────────────────
  zenstack/~schema.prisma (note the tilde) is a generated artifact — it's ZenStack's compiled output, not a file you own
   or edit. Prisma commands run against that file when invoked through zen, but if you invoke prisma directly from the
  root it finds nothing, because there's no prisma/schema.prisma. Think of ZenStack as a build tool that owns Prisma as
  an internal implementation detail.
  ─────────────────────────────────────────────────