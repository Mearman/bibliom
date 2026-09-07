<!--
Sync Impact Report:
Version: 2.16.0 → 2.17.0 (MINOR: Added CI trigger prohibition principle)
Modified Sections:
  - Added Principle XXI - CI Trigger Discipline
  - Updated Constitution version and date
  - Updated principle count in Quality Gates section
Added Sections:
  - Principle XXI: CI Trigger Discipline
Removed Sections: None
Templates Requiring Updates:
  - .specify/templates/plan-template.md: ✅ Updated (Constitution Check includes new principle)
  - .specify/templates/spec-template.md: ✅ Updated (Constitution compliance verification)
  - .specify/templates/tasks-template.md: ✅ Updated (Task categorization reflects new CI discipline)
Follow-up TODOs: None
Previous Amendments:
  - v2.16.0: Added type coercion prohibition to Type Safety principle
  - v2.15.1: Strengthened spec commit requirements - MUST commit after each SpecKit command
  - v2.15.0: Added Principle XX - Canonical Hash Computed Colours
  - v2.14.0: Added Principle XIX - Documentation Token Efficiency
  - v2.13.1: Add git commit -a to prohibited commands
  - v2.13.0: Added Principle XVIII - Agent Embed Link Format
  - v2.12.1: Added Project-Specific Gotchas section (DRY refactor from README)
  - v2.12.0: Added Principle XVII - No Magic Numbers/Values
  - v2.11.1: README conciseness improvements and template alignment validation
  - v2.11.0: Added Principle XVI - Presentation/Functionality Decoupling
  - v2.10.0: Added Principle XV - DRY Code & Configuration
  - v2.9.0: Strengthened Principle IX "Pre-existing is not an excuse"
  - v2.8.0: Added Principle XIV - Working Files Hygiene
  - v2.7.0: Added Principle XIII - Build Output Isolation
  - v2.6.0: Added Principle XII - Spec Index Maintenance
  - v2.5.0: Added Principle XI - Complete Implementation
  - v2.4.4: Fixed Principle X to require SlashCommand tool usage
  - v2.4.3: Added slash command invocation guidance
  - v2.4.2: Strengthened prohibition against relative imports between packages
  - v2.4.1: Strengthened backward compatibility prohibition in Principle VII
  - v2.4.0: Added no re-export requirement to Principle III
-->

# BibGraph Constitution (v2.18.0)

## Version History

- **v2.18.0** (2026-09-07): Amended Principle III - workspace orchestration moved from Nx to Turborepo; removed the Nx daemon gotcha

- **v2.17.0** (2025-12-05): Added Principle XXI - CI Trigger Discipline (never create commits solely for CI triggers)
- **v2.16.0** (2025-12-02): Added type coercion prohibition to Type Safety (Principle I) - no `as Type` or `<Type>value` except in test files
- **v2.15.1** (2025-12-02): Strengthened spec commit requirements - MUST commit after each SpecKit command
- **v2.15.0** (2025-12-02): Added Principle XX - Canonical Hash Computed Colours
- **v2.14.0** (2025-12-02): Added Principle XIX - Documentation Token Efficiency
- **v2.13.1** (2025-12-02): Add `git commit -a` to prohibited commands (alongside `git add .` and `git add -A`)
- **v2.13.0** (2025-12-02): Added Principle XVIII - Agent Embed Link Format
- **v2.12.1** (2025-12-02): Added Project-Specific Gotchas section (DRY refactor from README)
- **v2.12.0** (2025-12-02): Added Principle XVII - No Magic Numbers/Values
- **v2.11.1** (2025-11-30): README conciseness improvements and template alignment validation
- **v2.11.0** (2025-11-29): Added Principle XVI - Presentation/Functionality Decoupling
- **v2.10.0**: Added Principle XV - DRY Code & Configuration
- **v2.9.0**: Strengthened Principle IX "Pre-existing is not an excuse"
- **v2.8.0**: Added Principle XIV - Working Files Hygiene
- **v2.7.0**: Added Principle XIII - Build Output Isolation
- **v2.6.0**: Added Principle XII - Spec Index Maintenance
- **v2.5.0**: Added Principle XI - Complete Implementation
- **v2.4.4**: Fixed Principle X to require SlashCommand tool usage
- **v2.4.3**: Added slash command invocation guidance
- **v2.4.2**: Strengthened prohibition against relative imports between packages
- **v2.4.1**: Strengthened backward compatibility prohibition in Principle VII
- **v2.4.0**: Added no re-export requirement to Principle III

## Shared Rationale

This PhD research project requires maintainable, reliable code for academic reproducibility and demonstrations. Key constraints include: CI/CD deployment requirements, research productivity needs, and academic demonstration reliability. All principles serve these research context requirements while maintaining production-quality standards.

## Core Principles

### I. Type Safety (NON-NEGOTIABLE)

**NEVER use `any` types**. Use `unknown` with type guards instead. **NEVER use type coercions** (`as Type`, `<Type>value`) in production code—use type narrowing through runtime checks instead. All code must pass strict TypeScript validation without errors or suppressions.

**Type coercion exception**: Type coercions (`as`, `<Type>`) are ONLY permitted in test files (`*.test.ts`, `*.test.tsx`) where they simplify test setup and mock creation.

**Prohibited patterns**:
```typescript
// ❌ WRONG: Type coercion in production code
const user = response.data as User;
const element = <HTMLInputElement>document.getElementById("input");
const config = {} as Config;

// ✅ CORRECT: Type narrowing with runtime checks
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value;
}
const data: unknown = response.data;
if (isUser(data)) {
  const user = data; // TypeScript knows this is User
}
```

**Permitted in tests only**:
```typescript
// ✅ CORRECT: Type coercion in test file (e.g., foo.unit.test.ts)
const mockUser = { id: "123" } as User;
const mockStorage = {} as jest.Mocked<StorageProvider>;
```

**Rationale**: Type coercions bypass TypeScript's type checking, hiding potential runtime errors. They create a false sense of type safety while allowing incorrect types to flow through the codebase. In production code, runtime type guards ensure actual type correctness. Tests are excepted because mock objects often intentionally provide partial implementations.

### II. Test-First Development (NON-NEGOTIABLE)

**Tests must be written and verified to FAIL before implementation begins**. Follow Red-Green-Refactor cycle strictly.

**Test naming requirements**:
- Pattern: `foo.[type].test.ts[x]` where type ∈ {`unit`, `integration`, `component`, `e2e`}
- NEVER use generic names like `foo.test.ts` or `foo.spec.ts`

**E2E test requirements**:
- MUST have isolated storage state
- MUST complete within 2 seconds

**Rationale**: Expensive test failures require failing tests first to detect actual functionality gaps.

### III. Monorepo Architecture

**pnpm workspace with Turborepo orchestration is mandatory**. All packages MUST use shared configuration and build orchestration: every package defines underscore-prefixed leaf scripts (`_build`, `_typecheck`, `_lint`, `_test` and variants) and the root scripts wrap them with `turbo run`; `turbo.json` is the single task-graph definition.

**Structure**: `apps/` (deployable), `packages/` (shared libraries), `config/` (shared)

**Import requirements**:
- MUST use package aliases for cross-package imports (e.g., `@bibgraph/client`)
- NEVER use relative imports between packages
- Relative imports ONLY allowed within same package

**Package aliases**: `@bibgraph/{client,utils,types,ui,graph,simulation}` → `packages/*/src/index.ts`, `@/*` → `apps/web/src/*`

**No re-export requirement**: Internal packages MUST NOT re-export from other internal packages. Consumers MUST import directly from canonical source.

**Rationale**: Enables refactoring safety, build optimization, and clear package boundaries.

### IV. Storage Abstraction

**Storage implementations MUST be injectable and swappable**. All persistence operations MUST go through defined storage provider interface.

**Requirements**: Interface defines CRUD operations, IndexedDB provider for production, in-memory provider for E2E tests, mock provider for unit tests.

**Rationale**: Enables fast, isolated test execution while maintaining production data persistence.

### V. Performance & Memory

**Memory constraints are real**. Force simulation calculations MUST run in Web Workers.

**Requirements**: Bundle warnings at 800kB, failures at 1MB; storage operations ≤2s; unit tests ≤100ms; graph simulations handle 1000+ nodes; deterministic layouts use fixed seeds.

**Rationale**: Ensures responsive interactions during research experiments and maintains optimal performance.

### VI. Atomic Conventional Commits (NON-NEGOTIABLE)

**ALWAYS create incremental atomic conventional commits before moving to next task**. Each commit MUST represent single, complete unit of work.

**Requirements**:
- Format: `<type>(<scope>): <description>` (e.g., `feat(msw): add logging`)
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- MUST pass all quality gates
- MUST commit after each atomic task
- NEVER use `git add .`, `git add -A`, or `git commit -a` - use explicit file paths

**Spec file requirements**:
- Commit `./specs/` changes after each phase completion using `docs(spec-###):` prefix
- **MUST commit spec updates immediately after each SpecKit command** (`/speckit.specify`, `/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`, etc.)

**Rationale**: Enables bisect debugging, selective reversion, and clear research documentation.

### VII. Development-Stage Pragmatism (NON-NEGOTIABLE)

**NEVER include backward compatibility or legacy support**. Breaking changes are ENCOURAGED when they improve design.

**Requirements**:
- Breaking changes to APIs, data models, interfaces are acceptable
- Database schema changes can be destructive
- No migration paths, deprecation warnings, or version constraints required
- Re-exports for backward compatibility are PROHIBITED

**IMPORTANT**: Applies ONLY during development. Pre-public release will require stability guarantees.

**Rationale**: Eliminates overhead that slows research experimentation and hypothesis testing.

### VIII. Test-First Bug Fixes (NON-NEGOTIABLE)

**When bug is identified, test(s) MUST be written to confirm and diagnose it BEFORE fixing**.

**Workflow**: Reproduce → Verify Failure → Diagnose → Fix → Verify Success → Regression Prevention

**Requirements**: Test MUST fail before fix, pass after fix, use naming `bug-[id]-[description].[type].test.ts[x]`, be committed separately from fix.

**Rationale**: Prevents regression risks and ensures root cause understanding.

### IX. Repository Integrity (NON-NEGOTIABLE)

**NEVER leave repository in bad state**. When you touch repository, you own its state. ALL issues MUST be resolved before work is complete.

**"Pre-existing" is NOT an excuse**: Fix ALL issues regardless of origin. The phrase "pre-existing issue" is BANNED.

**Requirements**: ALL packages MUST pass `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm audit` with zero failures/vulnerabilities.

**Accountability**: Run `pnpm validate` at start AND end of session. Session complete ONLY when repo is in better state than found.

**Rationale**: Broken repo blocks ALL future work and creates compounding technical debt.

### X. Continuous Execution

**Implementation work MUST NOT stop or pause between phases, tasks, or due to context limits**.

**Requirements**:
- Complete all planned phases in single execution flow
- Commit atomically after each task
- Commit spec changes after each phase
- Maintain progress tracking throughout
- Only stop when ALL phases complete or blocking error occurs

**Automatic workflow**: After `/speckit.plan`, if no blockers, MUST use SlashCommand tool to invoke `/speckit.tasks` then `/speckit.implement`.

**Stopping conditions**: ALL tasks complete, blocking error, user request, or repository integrity failure.

**Rationale**: Maintains flow state and eliminates coordination overhead for research productivity.

### XI. Complete Implementation (NON-NEGOTIABLE)

**NEVER fall back to "simple" implementation when full version encounters difficulties**.

**Requirements**:
- Implement FULL version as specified
- If implementation fails, debug and resolve (don't simplify)
- Simplified fallbacks ONLY acceptable with explicit user approval after explaining impossibility

**When encountering difficulties**: Diagnose → Research → Debug → Persist → Escalate (if genuinely impossible)

**Rationale**: Prevents technical debt and ensures research demonstrations showcase full functionality.

### XII. Spec Index Maintenance (NON-NEGOTIABLE)

**`specs/README.md` MUST be maintained as current, accurate index of all feature specifications**.

**Requirements**:
- MUST list ALL specs in `specs/` directory
- MUST include: spec number/name, current status, completion date (if complete), description/link
- MUST be updated when specs created, status changes, or major completions occur
- MUST be committed alongside spec status changes

**Rationale**: Prevents duplicate work, enables quick discovery, and maintains project navigability across research timeline.

### XIII. Build Output Isolation (NON-NEGOTIABLE)

**TypeScript builds MUST output to `dist/` directories, NEVER alongside source files**.

**Requirements**: ALL `tsconfig.json` files MUST specify `"rootDir": "./src"` and `"outDir": "./dist"`. Compiled outputs MUST NEVER appear in `src/` directories.

**Rationale**: Ensures clean source directories, reliable gitignore patterns, and clear artifact boundaries.

### XIV. Working Files Hygiene (NON-NEGOTIABLE)

**Temporary working files MUST be cleaned up and NEVER committed**.

**Prohibited files**: Debug screenshots, fix chain documents, verification logs, temporary analysis files, working notes outside `specs/`.

**Gitignore enforcement**: All markdown and image files gitignored by default. Intentional docs MUST be force-added with `git add -f`.

**Primary mechanism**: Delete working files immediately after use. Clean working directory = professional development practice.

**Acceptable locations**: `specs/###-feature/`, `docs/`, `.specify/memory/`, `.specify/templates/`, `README.md` files.

**Rationale**: Prevents repository pollution and maintains professional codebase standards.

### XV. DRY Code & Configuration (NON-NEGOTIABLE)

**Duplication is a bug**. All code, configuration, and tooling MUST follow DRY principle.

**Code requirements**: Same logic in 2+ files → extract to shared utility. Type definitions MUST have single canonical location.

**Configuration requirements**: Shared TypeScript/ESLint configuration, no duplicated patterns, single package manager.

**Proactive cruft cleanup**: Remove unused dependencies, dead code, orphaned files immediately when discovered.

**Rationale**: Reduces maintenance burden and bug surface area in time-constrained research environment.

### XVI. Presentation/Functionality Decoupling (NON-NEGOTIABLE)

**Presentation and functionality MUST always be decoupled in web app**. UI components MUST NOT contain business logic.

**Architectural separation**:
- Presentational components: rendering, styling, user interaction
- Container components/hooks: state management, data fetching, business logic
- Services/utilities: complex business rules and calculations

**Prohibited patterns**: Components calling storage providers/APIs directly, complex calculations in components, global state mutations in components.

**Acceptable patterns**: Components receive data/callbacks via props, custom hooks encapsulate logic, service modules contain pure functions.

**Testing implications**: Business logic testable without React, presentational components testable with simple props.

**Rationale**: Ensures testability, reusability, maintainability of both presentation and functionality layers.

### XVII. No Magic Numbers/Values (NON-NEGOTIABLE)

**NEVER use unexplained literal values in code**. All meaningful numbers, strings, and configuration values MUST be named constants.

**Definition**: A "magic value" is any literal (number, string, boolean) whose meaning is not immediately obvious from context.

**Requirements**:
- Extract all non-trivial literals to named constants with descriptive names
- Constants MUST be defined at appropriate scope (file-level, module-level, or shared config)
- Names MUST explain the value's purpose, not just its type (e.g., `MAX_RETRY_ATTEMPTS` not `THREE`)
- Related constants SHOULD be grouped in configuration objects or enums

**Acceptable literals** (do NOT require constants):
- Array indices 0 and 1 when semantically clear
- Mathematical identities: 0, 1, -1 in arithmetic contexts
- Boolean literals `true`/`false`
- Empty string `""` for initialization
- Common string literals like `"id"`, `"name"` in object access where context is clear

**Prohibited patterns**:
```typescript
// ❌ WRONG: Magic numbers
if (retries > 3) { ... }
const delay = 5000;
const pageSize = 25;

// ❌ WRONG: Magic strings
if (status === "pending") { ... }
const endpoint = "/api/v2/users";
```

**Required patterns**:
```typescript
// ✅ CORRECT: Named constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = 5000;
const DEFAULT_PAGE_SIZE = 25;

if (retries > MAX_RETRY_ATTEMPTS) { ... }
const delay = DEFAULT_DELAY_MS;

// ✅ CORRECT: Enum for related values
enum Status {
  Pending = "pending",
  Active = "active",
  Complete = "complete"
}

// ✅ CORRECT: Configuration objects
const API_CONFIG = {
  BASE_URL: "/api/v2",
  ENDPOINTS: {
    USERS: "/users",
    WORKS: "/works"
  }
} as const;
```

**Rationale**: Named constants improve code readability, enable single-point-of-change for values used in multiple places, make code self-documenting, and reduce bugs from typos or inconsistent values.

### XVIII. Agent Embed Link Format (NON-NEGOTIABLE)

**Markdown links intended for AI agent embedding MUST use the `@` prefix format**.

**Definition**: An "agent embed link" is a markdown link in AGENTS.md, CLAUDE.md, or similar agent instruction files that references another document to be included in the agent's context.

**Required format**:
```markdown
> [@path/to/file.md](path/to/file.md)
```

**Requirements**:
- Link text MUST start with `@` followed by the file path
- Link URL MUST be the same path (relative or absolute as appropriate)
- MUST be placed in a blockquote (`>`) for embed semantics
- Path in link text and URL MUST match exactly

**Examples**:
```markdown
// ✅ CORRECT: Agent embed format
> [@.specify/memory/constitution.md](.specify/memory/constitution.md)
> [@README.md](README.md)
> [@docs/architecture.md](docs/architecture.md)

// ❌ WRONG: Missing @ prefix
> [.specify/memory/constitution.md](.specify/memory/constitution.md)

// ❌ WRONG: Mismatched paths
> [@constitution.md](.specify/memory/constitution.md)

// ❌ WRONG: Not in blockquote (won't trigger embed)
[@.specify/memory/constitution.md](.specify/memory/constitution.md)
```

**Rationale**: The `@` prefix format is recognized by Claude Code as a document embed directive. Using consistent formatting ensures agents receive the intended context and enables tooling to detect and validate embed references.

### XIX. Documentation Token Efficiency (NON-NEGOTIABLE)

**Proactively maintain AGENTS.md, README.md, and constitution to be deduplicated and concise**.

**Definition**: AI agents consume these files as context. Redundant or verbose content wastes tokens, increases latency, and risks context window overflow.

**Requirements**:
- AGENTS.md MUST embed other docs via `@` links rather than duplicating content
- README.md is for humans; keep it concise and avoid AI-specific implementation details
- Constitution contains principles and patterns; avoid duplicating content already in README.md
- When updating any of these files, check for and eliminate redundancy across all three
- Prefer hierarchical embedding (AGENTS.md → README.md → constitution) over flat duplication

**File responsibilities**:
- `AGENTS.md`: Entry point for AI agents; embeds README.md and constitution
- `README.md`: Human-readable project overview, commands, structure
- `constitution.md`: Development principles, patterns, gotchas for AI consumption

**Proactive maintenance triggers**:
- After adding new content to any file, verify no duplication exists
- After completing a feature, review if documentation can be condensed
- Periodically audit total line counts and eliminate bloat

**Rationale**: Token efficiency directly impacts AI agent performance, cost, and reliability. Keeping documentation DRY ensures agents receive necessary context without waste.

### XX. Canonical Hash Computed Colours (NON-NEGOTIABLE)

**UI elements referencing graph nodes or edges MUST use canonical hash-computed colours**.

**Definition**: A "canonical hash-computed colour" is a deterministic colour value derived from an entity's stable identifier (e.g., OpenAlex ID) using the project's colour utility functions.

**Requirements**:
- Labels, badges, buttons, chips, and other UI elements that reference a specific graph node or edge MUST use that entity's computed colour
- Colour MUST be derived from entity's canonical ID using shared colour utility (e.g., `getEntityColor()`, `hashStringToColor()`)
- NEVER hardcode colours for entity-specific UI elements
- NEVER use arbitrary colours for elements that represent identifiable entities
- Visual consistency MUST be maintained across all views showing the same entity

**Applicable UI elements**:
- Entity type badges/chips (Authors, Works, Institutions, etc.)
- Graph node labels and selection indicators
- Relationship type indicators
- List item markers for entity references
- Navigation breadcrumbs referencing entities
- Action buttons scoped to specific entities

**Examples**:
```typescript
// ✅ CORRECT: Colour derived from entity ID
const authorColor = getEntityColor(author.id);
<Badge color={authorColor}>{author.display_name}</Badge>

// ✅ CORRECT: Consistent colour for entity type
const typeColor = getEntityTypeColor('authors');
<Chip color={typeColor}>Author</Chip>

// ❌ WRONG: Hardcoded arbitrary colour
<Badge color="blue">{author.display_name}</Badge>

// ❌ WRONG: Random or index-based colour
<Badge color={COLORS[index]}>{author.display_name}</Badge>
```

**Rationale**: Consistent hash-computed colours create visual identity for entities, allowing users to recognize the same entity across different views and contexts. This improves navigation, reduces cognitive load, and maintains professional visual coherence in the graph exploration experience.

### XXI. CI Trigger Discipline (NON-NEGOTIABLE)

**NEVER create commits solely for the purpose of triggering CI pipelines**. Commits MUST represent actual code changes, not infrastructure manipulation.

**Requirements**:
- Commits MUST contain meaningful changes to code, configuration, or documentation
- When CI needs to be re-run due to infrastructure issues or flaky tests, use GitHub CLI (`gh run rerun`) or workflow_dispatch instead
- Empty commits, whitespace changes, or trivial modifications solely to trigger CI are PROHIBITED
- CI infrastructure issues should be resolved through appropriate GitHub Actions features, not code commits

**Acceptable CI retry methods**:
```bash
# ✅ CORRECT: Use GitHub CLI to rerun failed jobs
gh run rerun <run-id>
gh run rerun <run-id> --failed

# ✅ CORRECT: Use workflow_dispatch for manual triggers
gh workflow run "CI/CD Pipeline" -f main
```

**Prohibited patterns**:
```bash
# ❌ WRONG: Empty commits to trigger CI
git commit --allow-empty -m "ci: trigger pipeline"

# ❌ WRONG: Trivial changes to trigger CI
echo " " >> README.md && git add README.md && git commit -m "ci: retry pipeline"

# ❌ WRONG: Whitespace/comment changes solely for CI
git add . && git commit -m "ci: trigger rebuild"
```

**Rationale**: Maintains commit history integrity, preserves git bisect effectiveness, and separates code changes from infrastructure management. Using proper GitHub CLI features preserves the semantic meaning of commits and maintains repository hygiene.

## Consolidated Patterns

### Import Patterns
```typescript
// ✅ CORRECT: Cross-package imports use aliases
import type { EntityType } from "@bibgraph/types"
import { logger } from "@bibgraph/utils"

// ✅ CORRECT: Within same package use relative imports
import { GraphNode } from "../types/core"

// ❌ WRONG: Relative imports between packages
import { GraphNode } from "../../../packages/graph/src/types"
```

### Component Architecture
```typescript
// ✅ CORRECT: Separated concerns
function WorkCard({ work, bookmarked, onBookmark, normalizedScore }: Props) {
  return <Card onClick={onBookmark}>...</Card>;
}

// ❌ WRONG: Mixed concerns
function WorkCard({ work }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const handleBookmark = async () => {
    await storageProvider.addToList('bookmarks', work.id);
    setBookmarked(true);
  };
  return <Card onClick={handleBookmark}>...</Card>;
}
```

### Constants and Configuration
```typescript
// ✅ CORRECT: Named constants for configuration
const CACHE_CONFIG = {
  MAX_AGE_MS: 5 * 60 * 1000, // 5 minutes
  MAX_ENTRIES: 1000,
  STALE_WHILE_REVALIDATE_MS: 30 * 1000
} as const;

// ✅ CORRECT: Enums for related string values
enum EntityType {
  Work = "work",
  Author = "author",
  Institution = "institution"
}

// ❌ WRONG: Inline magic values
const maxAge = 300000;
if (type === "work") { ... }
```

### Package Structure
- `@bibgraph/types`: Canonical source for all type definitions
- `@bibgraph/utils`: Shared utilities and storage providers
- `@bibgraph/ui`: Reusable UI components
- Package aliases defined in `tsconfig.base.json`

## Verification Commands

### Repository Integrity
```bash
# Complete validation pipeline
pnpm validate  # typecheck → test → build → lint

# Individual checks
pnpm typecheck  # TypeScript validation across ALL packages
pnpm test       # Full test suite
pnpm build      # Production build verification
pnpm lint       # ESLint checking across ALL packages
pnpm audit      # Security vulnerability scan
```

### Build Output Verification
```bash
# Should return nothing - any output indicates pollution
find apps/*/src packages/*/src -name "*.js" -o -name "*.d.ts" | grep -v vite-env
```

### Working Files Cleanup
```bash
# Check for temporary working files (should return nothing)
find . -name "debug-*.png" -o -name "*-FIX-*.md" -o -name "COMPLETE-*.md" | grep -v node_modules
```

### DRY Violation Detection
```bash
# Check for similar function definitions
grep -rh "export function" packages/ | sort | uniq -c | sort -rn | head -10
```

### Magic Number Detection
```bash
# Check for potential magic numbers (review output manually)
grep -rn "[^a-zA-Z0-9_][0-9]\{2,\}[^a-zA-Z0-9_]" --include="*.ts" --include="*.tsx" packages/ apps/ | grep -v "\.test\." | head -20
```

## Principle Relationships

### Foundational Principles
- **Type Safety (I)**: Enables all other principles through reliable code
- **Monorepo Architecture (III)**: Provides structural foundation for DRY (XV) and Build Output Isolation (XIII)
- **Repository Integrity (IX)**: Enforced by Continuous Execution (X) and Complete Implementation (XI)

### Enforcement Chains
- **Atomic Commits (VI)** → Repository Integrity (IX) → Continuous Execution (X)
- **Test-First Development (II)** → Test-First Bug Fixes (VIII) → Complete Implementation (XI)
- **Storage Abstraction (IV)** → Test-First Development (II) → Repository Integrity (IX)
- **CI Trigger Discipline (XXI)** → Atomic Commits (VI) → Repository Integrity (IX)

### Workflow Enablers
- **Working Files Hygiene (XIV)** → Atomic Commits (VI) → Repository Integrity (IX)
- **DRY Code (XV)** → Monorepo Architecture (III) → Build Output Isolation (XIII)
- **Presentation/Functionality Decoupling (XVI)** → Test-First Development (II) → DRY Code (XV)
- **No Magic Numbers (XVII)** → DRY Code (XV) → Type Safety (I)
- **Agent Embed Link Format (XVIII)** → DRY Code (XV) → Working Files Hygiene (XIV)
- **Documentation Token Efficiency (XIX)** → DRY Code (XV) → Agent Embed Link Format (XVIII)
- **Canonical Hash Computed Colours (XX)** → No Magic Numbers (XVII) → DRY Code (XV)
- **CI Trigger Discipline (XXI)** → Atomic Commits (VI) → Repository Integrity (IX)

## Development Workflow

### Quality Pipeline (MUST pass before commit)
1. `pnpm typecheck` - TypeScript validation across ALL packages
2. `pnpm test` - Full test suite
3. `pnpm build` - Production build verification
4. `pnpm lint` - ESLint checking across ALL packages

### Repository Integrity Checkpoint
- Run `pnpm validate` at START and END of every session
- If ANY check fails, you are NOT done - keep working
- Session complete ONLY when repo is in better state than found

### Spec File Discipline

**CRITICAL**: MUST commit spec updates immediately after each SpecKit workflow command.

**SpecKit commands requiring immediate commit**:
- `/speckit.specify` → Commit: `docs(spec-###): initialize specification`
- `/speckit.clarify` → Commit: `docs(spec-###): clarify requirements`
- `/speckit.plan` → Commit: `docs(spec-###): complete implementation plan`
- `/speckit.tasks` → Commit: `docs(spec-###): generate task list`
- `/speckit.implement` (per phase) → Commit: `docs(spec-###): complete Phase X`

**Commit workflow after each SpecKit command**:
1. Stage spec directory files: `git add specs/###-feature-name/`
2. Stage specs/README.md if status changed: `git add specs/README.md`
3. Commit with appropriate message: `git commit -m "docs(spec-###): <action>"`
4. Continue to next command or phase

**Rationale**: Immediate commits after each SpecKit command ensure work is preserved, enable rollback to specific workflow stages, and provide clear audit trail of specification evolution.

### Spec Index Maintenance
After completing spec or status change:
1. Update `specs/README.md` with new status/completion date
2. Stage both spec directory and README: `git add specs/###-feature-name/ specs/README.md`
3. Commit: `git commit -m "docs(spec-###): mark spec as complete"`

### Commit Discipline
After each atomic task:
1. Verify quality gates pass
2. Clean up temporary working files
3. Stage ONLY related files using explicit paths
4. Review staged changes: `git status` && `git diff --staged`
5. Create conventional commit
6. Push regularly to avoid losing work

### CI Retry Discipline
When CI fails due to infrastructure issues or flaky tests:
1. Use GitHub CLI to rerun failed jobs: `gh run rerun <run-id>`
2. For manual triggers, use workflow_dispatch: `gh workflow run "CI/CD Pipeline"`
3. NEVER create commits solely to trigger CI
4. Document persistent CI issues in appropriate tracking systems

### Slash Command Invocation
- MUST use SlashCommand tool - NEVER type commands directly
- Correct pattern: `<invoke name="SlashCommand"><parameter name="command">/speckit.plan</parameter></invoke>`
- Applies to ALL custom slash commands

## Quality Gates

### Constitution Compliance
Every PR MUST verify alignment with all 21 core principles (including type coercion prohibition in Principle I and CI trigger discipline in Principle XXI). Feature specs MUST document compliance.

### Test Coverage Requirements
- All new storage operations: unit tests with mock provider + E2E tests with in-memory provider
- All new components: component tests
- All new graph features: deterministic layout tests
- All bug fixes: regression tests written before fix

### Commit Quality Gates
- MUST follow Conventional Commits format
- MUST represent single logical change
- MUST pass quality pipeline before pushing
- NEVER use `git add .`, `git add -A`, or `git commit -a`
- Spec file changes committed after each SpecKit command and phase
- NEVER create commits solely to trigger CI

### Repository Integrity Gates
- MUST leave repository in fully working state
- `pnpm validate` MUST pass completely (zero errors/warnings)
- `pnpm audit` MUST show no high/critical vulnerabilities
- NEVER use `--no-verify` - fix hook failures
- NEVER defer issues - fix everything found

### Complete Implementation Verification
- Feature implementations MUST match specifications completely
- No simplified fallbacks without documented user approval
- Bug fixes MUST address root causes
- Edge cases and error handling MUST be complete

### Specialized Verification Gates
- **Spec Index Maintenance**: specs/README.md MUST list all specs and be updated with status changes
- **Build Output Isolation**: All tsconfig.json files MUST specify outDir/rootDir, no compiled files in src/
- **Working Files Hygiene**: No debug screenshots, fix documents, or temporary analysis files in commits
- **DRY Code & Configuration**: No duplicate logic, shared base configurations, proactive cruft cleanup
- **Presentation/Functionality Decoupling**: No business logic in components, clear container/presentational separation
- **No Magic Numbers/Values**: All meaningful literals extracted to named constants; configuration centralized
- **Agent Embed Link Format**: Agent instruction files use `[@path](path)` format in blockquotes for embeds
- **Documentation Token Efficiency**: AGENTS.md, README.md, constitution are deduplicated and concise; hierarchical embedding preferred
- **Canonical Hash Computed Colours**: UI elements referencing entities use hash-computed colours from shared utilities; no hardcoded entity colours
- **CI Trigger Discipline**: No empty or trivial commits solely for CI triggering; use GitHub CLI or workflow_dispatch for retries

### Breaking Changes
MAJOR.MINOR.PATCH versioning applies. During development, breaking changes acceptable without MAJOR bumps but MUST be documented.

## Project-Specific Gotchas

### OpenAlex API Quirks
- **Comma encoding**: `select` parameter must NOT URL-encode commas
- **Rate limiting**: Honor `Retry-After` headers (exponential backoff)
- **Dev proxy**: `/api/openalex` routes to OpenAlex API in dev mode

### React 19 Hook Violations
MainLayout and related stores refactored for stable method references (avoid creating new functions in render).

### Test Environment Detection
Client uses multiple checks (NODE_ENV, __DEV__, hostname) to determine dev vs prod mode. Always mock carefully in tests.

### Storage Provider Initialization
```typescript
const provider = new DexieStorageProvider(logger);
await provider.initializeSpecialLists(); // ALWAYS call before operations
```

### E2E Testing Patterns
- Page objects: `apps/web/src/test/page-objects/` (BasePageObject → BaseSPAPageObject → BaseEntityPageObject)
- Wait helpers: `waitForAppReady`, `waitForEntityData`, `waitForSearchResults`, `waitForGraphReady`
- Test categories: `@entity`, `@utility`, `@workflow`, `@error`

### CI Infrastructure Issues
- **npm registry failures**: Use `gh run rerun` instead of creating commits
- **Flaky E2E tests**: Use GitHub CLI retry features or workflow_dispatch
- **Infrastructure timeouts**: Retry through appropriate GitHub Actions mechanisms

## Governance

This constitution supersedes all other development practices. Amendments require:
1. Documentation of principle change with rationale
2. Update to affected templates (plan-template.md, spec-template.md, tasks-template.md)
3. Version bump according to semantic versioning rules
4. Validation that existing features still comply

All PRs and code reviews MUST verify compliance. Features violating principles without documented justification MUST be rejected.

For operational guidance specific to BibGraph workflows, see `CLAUDE.md` in project root. This constitution defines non-negotiable principles; CLAUDE.md provides runtime instructions.