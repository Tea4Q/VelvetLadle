# AGENTS.md

## Project purpose

This is an Expo React Native app using Supabase, RevenueCat, GitHub, and shared UI standards.

## Core rules

- Preserve cross-platform compatibility for iOS and Android.
- Do not introduce app logic directly inside screen files when it belongs in shared services, hooks, or feature modules.
- Prefer reusable components over one-off screen-specific UI.
- Keep auth, profile, settings, subscriptions, analytics, and API behavior consistent with existing app patterns.
- Do not hardcode secrets, URLs, API keys, or product identifiers.
- Use environment variables for configuration.
- Use shared button, input, modal, loading, and error-state components.
- All form validation must be centralized and reusable.
- All Supabase queries must be wrapped in feature service functions.
- All RevenueCat logic must go through the subscription service layer.
- All analytics events must use the standard event naming scheme.
- Any schema or function changes must be documented in `/docs/decisions/` and `/supabase/migrations/`.

## UI and UX rules

- Buttons with the same purpose should behave and look the same across the app.
- Sign-in, add-item, settings, and profile screens should share the same interaction patterns.
- Always support loading, success, empty, and error states.
- Prevent duplicate submission on all forms and purchase actions.
- Use clear user-facing error messages.
- Keep accessibility in mind for labels, touch targets, and keyboard behavior.

## Auth rules

- Always verify the current session before protected actions.
- Handle expired sessions gracefully.
- Redirect unauthenticated users to sign-in.
- Keep guest mode rules explicit if guest mode exists.
- Never assume user metadata exists; guard null and missing fields.

## Supabase rules

- Use typed service wrappers where possible.
- Avoid duplicated queries across screens.
- Validate payloads before sending to Supabase.
- Handle RLS and permission failures with explicit error handling.
- Prefer idempotent operations when possible.

## RevenueCat rules

- RevenueCat initialization must happen through a single shared module.
- Entitlement checks must be centralized.
- Premium gating logic must be reusable and testable.
- Restore purchase flow must be supported.
- Do not assume products are available; handle store fetch failures.

## Analytics rules

- Track screen views, sign-in success/failure, subscription actions, important CRUD actions, and major errors.
- Use snake_case or dot.notation consistently across all events.
- Never send sensitive data in analytics payloads.

## Implementation workflow

Before making significant changes:

1. Read the relevant feature files and related shared services.
2. Write a short plan.
3. Reuse existing patterns before creating new ones.
4. Implement the smallest safe change.
5. Run lint, type checks, and tests if available.
6. Summarize changed files, risks, and follow-up tasks.

## Output expectations for AI coding agents

When asked to implement a feature or refactor:

- Start with a brief plan.
- Identify reused components/services.
- Note edge cases.
- Then implement.
- End with a concise summary and any manual verification steps.
