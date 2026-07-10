# cc-mastery

**How deeply have you mastered Claude Code?**

Scan your local `~/.claude` and render an RPG-style mastery card — radar chart across 5 axes, an overall level, and a title you can brag about on X. Zero dependencies. Nothing ever leaves your machine.

![sample card](docs/sample-card.png)

## Quick start

```bash
npx cc-mastery
```

That's it. It scans your Claude Code config and session transcripts locally, writes a self-contained `cc-mastery-report.html`, and opens it in your browser. Hit **"Save card as PNG"** to export a 2400×1350 share image.

## The 5 axes

| Axis | What it measures |
|---|---|
| **Customize** | Skills, slash commands, CLAUDE.md size, rules, permissions, plugins |
| **Agents** | Agent definitions, subagent spawns, sessions that orchestrate subagents, MCP servers |
| **Automation** | Hook scripts, hook event coverage, actual hook executions, skill activations |
| **PDCA** | Memory notes (feedback / reference), plan files, settings backup generations |
| **Volume** | Active days, sessions, output tokens, projects |

Titles are decided by your dominant axis: **The Orchestrator**, **The Tinkerer**, **The Automaton**, **The Kaizen Sage**, **The Grinder** … or **The Ascended** if you're 70+ across the board. Your level also sets a trading-card **rarity** (N → UC → R → SR → SSR), which only controls how flashy the card looks — stars and foil intensity — never the score.

## How scoring works

Everything is computed from local measured values — **no randomness, no external data**. The same environment always produces the same score. The report includes a "How scoring works" panel with these formulas; here they are for reference:

1. **Normalize each metric to 0–100** with a saturation curve:

   ```
   points = 100 · x / (x + h)
   ```

   `x` is the measured value; `h` is that metric's *half-point* (the value worth 50). At `x = 0` → 0, at `x = h` → 50, and it approaches but never reaches 100. So a beginner with 3 skills isn't stuck at 0, and a power user with 80 skills doesn't max out. Each metric's `h` is shown in the dashboard's per-axis breakdown.

2. **Axis score = weighted sum** of its metrics (weights sum to 1.0).

3. **Overall level (1–99)** from the axis mean `S`:

   ```
   Lv = round( 99 · (S / 100) ^ 0.9 )
   ```

   The 0.9 exponent lifts the low end. Lv 99 is effectively unreachable.

4. **Estimated standard score** against an assumed distribution (mean 35, sd 15):

   ```
   dev = 50 + 10 · (S − 35) / 15
   ```

   *Estimated* because v0.1 has no real population to compare against — v0.2 will add opt-in real percentiles (see Roadmap).

5. **Rarity** from level: SSR (Lv 75–99, ★★★★★) · SR (55–74) · R (35–54) · UC (18–34) · N (1–17).

The full metric-by-metric table (`h` values and weights for all 5 axes) lives in [`src/scorer.js`](src/scorer.js) as one declarative table — tune it there and the dashboard breakdown updates automatically.

## What it reads / what it never does

**Reads (locally):**

- `~/.claude/` inventory: skills, agents, commands, hooks, rules, plans, `settings.json`
- `~/.claude/projects/**/*.jsonl` session transcripts (timestamps, token usage, tool names, subagent structure)
- Project-level `.claude/` dirs and `CLAUDE.md` files referenced by your session history

**Never does:**

- ❌ No network requests. Ever. Analysis, scoring, and rendering are 100% local
- ❌ No names on the share card — the card shows aggregate numbers only (no skill names, project names, paths, or model ids)
- ❌ No telemetry

The lower half of the HTML report is a local-only dashboard that *does* show skill/project/model names for your own analysis — it sits behind a "don't screenshot this part" banner.

## Options

```
--lang <ja|en>       Card/report language (default: from $LANG)
--output <path>      HTML output path (default: ./cc-mastery-report.html)
--json               Print scores + raw metrics as JSON (no HTML)
--no-open            Don't open the browser
--project <name>     Restrict session analysis to one project
--claude-dir <path>  Claude config dir (default: $CLAUDE_CONFIG_DIR or ~/.claude)
--no-cache           Ignore the scan cache and rescan everything
```

Repeated runs are fast: per-file scan results are cached by size + mtime (`~/.cache/cc-mastery/`), so only new or changed transcripts are re-read. A multi-GB history scans in seconds after the first run.

## Notes on fairness

- Claude Code prunes session transcripts after ~30 days by default (`cleanupPeriodDays`), so transcript-derived metrics see a rolling window. The Volume axis is tuned for that window.
- Config-derived metrics (skills, agents, hooks, memory) have no such limit — long-term investment shows up there.

## Roadmap

- **v0.2** — opt-in anonymous score submission → a *real* distribution, real percentiles, and a leaderboard. Until then the standard score is clearly labeled as estimated.

## 日本語

日本語 README は [README.ja.md](README.ja.md) へ。`--lang ja` で称号・カード・ダッシュボードが日本語になります（`$LANG` が日本語なら自動）。

## License

MIT
