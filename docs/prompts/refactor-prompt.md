Refactor this feature to match the project standards.

Goals:

- Keep iOS and Android behavior consistent.
- Reuse shared UI components.
- Move direct Supabase calls into services.
- Standardize loading, empty, success, and error states.
- Add analytics hooks where needed.
- Guard edge cases including null data, expired session, duplicate taps, network failure, and permission issues.
- Preserve current behavior unless a bug is being fixed.

Expected output:

1. Short plan
2. Files to change
3. Refactor implementation
4. Risks or follow-up items
5. Manual verification steps
