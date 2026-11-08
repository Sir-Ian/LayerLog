# Git workflow

## Repository shape

Use `main` as the stable integration branch. Start each coherent task from current main on a short-lived named branch, for example `feat/print-attempts`, `fix/attempt-validation`, `docs/demo-guide`, or `chore/forge-scaffold`. Avoid a long-lived develop branch unless the project actually needs one.

Preserve meaningful small commits. Integrate completed branches with a deliberate `--no-ff` merge so the graph shows which changes belonged together. Do not manufacture empty branches or commits for appearance. Keep completed branches until Ian chooses cleanup; annotated milestone tags give durable checkpoints without keeping every branch forever.

## Before starting

```sh
git status --short --branch
git log --graph --decorate --oneline --all -15
git switch main
git switch -c feat/short-description
```

Only switch if the working tree is clean and no other worker owns that checkout. If there are existing edits, identify their owner and preserve them. Do not stash, reset, clean, discard, or silently commit someone else's work.

## Small commits

Each commit should capture one understandable change, preferably with its tests. Commit at a meaningful, reviewed checkpoint rather than every command or an arbitrary time interval. Use imperative subjects such as `feat: add print attempt validation` or `test: cover missing evidence prompts`.

```sh
git diff --check
git diff
# Run the checks applicable to this change.
git add <explicit-paths>
git diff --cached --check
git diff --cached
git commit -m "feat: describe one coherent change"
```

Stage explicit files or hunks. Review for tokens, personal records, generated output, and unrelated files before every commit. Avoid blanket staging in a dirty shared project.

## Integration and checkpoints

When the task meets its acceptance criteria, run its full relevant checks and inspect the diff against main. In a single-owner, clean checkout:

```sh
git switch main
git merge --no-ff feat/short-description -m "merge: describe the completed milestone"
git status --short --branch
git log --graph --decorate --oneline --all -15
```

Use annotated tags for actual milestones, such as `planning-v0.1` for this documentation foundation. Do not label planning as an application release. Never rewrite shared history, force-push, or amend another worker's commits. Prefer a new corrective commit or a reviewed revert over destructive history edits.

## Parallel agents

Give each agent a separate branch and worktree. Coordinate shared files before starting. Integrate completed branches one at a time and rerun affected checks after merges. An agent must not switch branches in a checkout another agent is using.

## Remote backup and review

The approved remote is `origin`, pointing to the private GitHub repository `Sir-Ian/LayerLog`. Keep visibility private. For authorized work, push verified commits and verify the remote commit IDs; do not assume a local commit has been backed up. Use draft pull requests for review unless Ian requests otherwise. Local merge discipline is a convention, not enforced branch protection; configure remote protections only after a host is chosen and authorized.

## Identity

Keep Ian's existing Git identity configuration. Do not fabricate an author or change global settings. If a future environment has no identity, ask for the intended identity rather than guessing.
