<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- UI reads/writes data only through `useAppData()` / `useActions()` in `src/data/store.tsx`; swap the provider internals for Lovable Cloud queries later without touching pages.
- Pure state transitions live in `src/data/reducer.ts` (one action per future DB mutation) so rules stay unit-testable.
- Types in `src/lib/types.ts` mirror the planned tables (profiles, services, projects, project_messages, scope_versions, scope_items); analysis/change results are jsonb on projects/project_messages.
- AI analysis and scope comparison go only through `src/services/ai.ts`; they return `not_connected` until a server function exists — never fabricate AI output in the UI.
- Automation hooks (n8n-ready) are emitted from store actions via `src/services/automation.ts`; webhook URLs must stay server-side.
- Message templates in `src/lib/scope.ts` are deterministic and built only from the user's own entries.
- App is RTL: `dir="rtl"` on html plus Radix `DirectionProvider`; use logical utilities (ms/me/ps/pe/start/end) instead of left/right.
