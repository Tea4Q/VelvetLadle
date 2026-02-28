## Plan: Premium Features Rollout (DRAFT)

Based on your scope choices (MVP + pantry + OCR, all platforms, export-only sync, public-feed coupon prototype), this is feasible, but best delivered in staged releases to control risk. The current app already has reusable foundations for extraction, image handling, and dual storage in [services/recipeExtractor.ts](services/recipeExtractor.ts), [services/ImageStorageService.ts](services/ImageStorageService.ts), [services/recipeDatabase.ts](services/recipeDatabase.ts), and [lib/supabase.ts](lib/supabase.ts). The main gaps are new data models (recipe links, meal plans, pantry/shopping), OCR/document ingestion pipeline, and external feed normalization. Estimated timeline: 16–28 weeks solo, or 12–20 weeks with a 2–3 person team. Highest-risk area is coupons/sales data quality and ToS compliance; keep that as opt-in prototype after core premium value ships.

**Feasibility & Difficulty**

- OCR scan from image/printed document + dish image capture: Feasible, Difficulty **High**
- Recipe-to-recipe linking (component/sub-recipe): Feasible, Difficulty **Medium**
- Meal planning + shopping list + pantry + Spoonacular assist: Feasible, Difficulty **Medium-High**
- Email/external planning export (share + ICS): Feasible, Difficulty **Low-Medium**
- Grocery sales/coupon public-feed prototype: Partially feasible, Difficulty **High** (data/compliance driven)

**Steps**

1. Define premium domain model and release slices in docs: update [docs/FEATURES.md](docs/FEATURES.md) and [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md) with scope boundaries (what is in Phase 1/2/3).
2. Add schema for linked recipes, meal plans, meal plan entries, shopping items, pantry items, and feed offers in [database_schema.sql](database_schema.sql) plus migration files (same pattern as existing SQL migrations in repo root).
3. Extend app types and storage abstraction in [lib/supabase.ts](lib/supabase.ts) and [services/recipeDatabase.ts](services/recipeDatabase.ts) so every new entity supports Supabase + demo fallback.
4. Implement recipe-linking service and UI hooks in [components/RecipeForm.tsx](components/RecipeForm.tsx), [components/RecipeViewer.tsx](components/RecipeViewer.tsx), and listing surfaces like [components/RecipeList.tsx](components/RecipeList.tsx).
5. Add planner/pantry/shopping services and screens via Expo Router under [app/(tabs)](<app/(tabs)>); update tabs in [app/(tabs)/\_layout.tsx](<app/(tabs)/_layout.tsx>) only for the exact MVP navigation needed.
6. Build OCR/document ingestion pipeline: replace OCR stub points in [app/(tabs)/add.tsx](<app/(tabs)/add.tsx#L103-L104>) and [app/(tabs)/add.tsx](<app/(tabs)/add.tsx#L213-L215>) with a real scan flow; route parsed content into existing form model in [components/RecipeForm.tsx](components/RecipeForm.tsx).
7. Reuse image infrastructure to store both recipe image and optional “dish photo” attachment through [services/ImageStorageService.ts](services/ImageStorageService.ts) and [components/SmartImage.tsx](components/SmartImage.tsx).
8. Add Spoonacular-assisted planning helpers in a new service adjacent to [services/nutritionService.ts](services/nutritionService.ts) and [services/webScrapingAPIService.ts](services/webScrapingAPIService.ts), with strict quota/error fallback behavior.
9. Add export-only integration (email/share + ICS files) using existing share patterns from [components/FavoritesList.tsx](components/FavoritesList.tsx) and [components/RecipeViewer.tsx](components/RecipeViewer.tsx); avoid OAuth in this phase.
10. Implement grocery deals prototype as a separate service with public-feed ingestion, normalization, and feature flag; keep isolated from core planning so failures never block core flows.
11. Add premium gating + entitlement checks in premium entry points (based on current auth/navigation structure in [app/\_layout.tsx](app/_layout.tsx) and [contexts/AuthContext.tsx](contexts/AuthContext.tsx)).
12. Run staged QA across storage modes, platforms, and extraction paths using [docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md); then harden RLS/privacy policies before release.

**Timeline**

- Phase 0 (1–2 w): Product/DB design, premium boundaries, migration plan
- Phase 1 (3–5 w): Recipe linking + base planner + shopping list
- Phase 2 (4–7 w): Pantry + Spoonacular planning assist
- Phase 3 (4–8 w): OCR/image/document scan + dish image capture
- Phase 4 (1–2 w): Export integrations (email/share + ICS)
- Phase 5 (3–6 w): Public-feed deals/coupons prototype (behind feature flag)
- Hardening/QA (2–4 w, overlapping): performance, edge cases, cross-platform polish

**Verification**

- Data parity: validate every CRUD path in both Supabase and demo mode from [services/recipeDatabase.ts](services/recipeDatabase.ts)
- UX flow checks: add recipe by URL, by OCR scan, manual entry, then link recipes and add to meal plan
- Planner outputs: generate shopping list from selected meal plan days and reconcile with pantry inventory
- Export checks: verify email/share and ICS import into common calendar clients
- Resilience: simulate API quota/timeouts for Spoonacular and feed outages; confirm graceful fallbacks

**Decisions**

- Chose staged rollout over “all-at-once” to reduce rework and de-risk integrations.
- Chose export-only external planning integration first (no OAuth), matching your selected sync depth.
- Chose public-feed coupon prototype with isolation/feature flag to manage compliance and reliability risk.
