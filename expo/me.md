# me.md -- SoloPro / FineDine

## Vision Statement
In 12 months, SoloPro / FineDine will be a polished, trustworthy mobile marketplace where diners discover restaurants, book tables, claim deals, and restaurant owners manage orders, bookings, inventory, and promotions from one operating dashboard.

## Product Description
The product is a native mobile restaurant marketplace and management app. Customers use it to discover dining options, browse deals, place orders, and book restaurant services. Restaurant owners use it to manage restaurant operations, promotions, orders, bookings, inventory, staffing, and analytics.

## Target Users
Primary: Diners who want a fast, premium way to find restaurants, book tables, and access offers without friction.
Secondary: Restaurant owners who need a simple mobile-first operating dashboard for daily business tasks.

## Customer Journey
1. User discovers the app through local restaurant promotions, social media, or word of mouth.
2. User signs up as a customer or restaurant owner.
3. First value moment: customers see restaurants and deals immediately; owners see a dashboard with actionable metrics and management tools.
4. User pays through future monetization layers such as premium listings, subscriptions for restaurants, booking fees, or promotional campaign tools.

## Vendor / Client Flow
Restaurant owner signs up, creates or accesses a restaurant profile, manages menu/items/deals/bookings/orders, tracks inventory and analytics, and responds to customer demand. Customers browse restaurants, claim deals, place orders, reserve tables or services, and manage profile/favorites.

## UI/UX Feel
The product should feel fast, premium, warm, confident, operationally useful, and mobile-native.
It should NOT feel generic, web-like, fragile, noisy, or dependent on failing backend calls during demo mode.

## Non-Negotiables
- If real data fails once in a session, the app should gracefully fall back to mock/local data without retry loops.
- Customer-facing flows must remain navigable in demo/mock mode.
- Do not expose secrets or sensitive tokens in UI, logs, comments, or committed docs.
- Keep development/demo behavior separate from production behavior.
- Avoid destructive production actions without explicit human approval.

## Claude's Permissions
Claude can decide alone: implementation details, UI refinements, mock-data fallback behavior, code organization, non-destructive bug fixes, documentation updates, and validation steps.
Claude must ask me: production deployment, pricing changes, user-data migrations/deletions, compliance decisions, live payment setup, or rebranding.
Off limits entirely: committing secrets, deploying to production without approval, deleting production user data, and intentionally weakening security.

## Key Business Decisions
Initial focus is a restaurant marketplace plus owner OS. Monetization is not finalized and should remain flexible for restaurant subscriptions, paid promotions, and booking/order fees. Geographic focus is local-market first until traction is proven.

## Success Metrics
- Customers can complete browse, deal, order, booking, and profile flows in demo mode.
- Restaurant owners can complete dashboard, order, booking, deal, inventory, staff/schedule, and analytics flows in demo mode.
- App preview loads consistently without repeated failed real-data fetches.
- Validation passes after meaningful changes.

## Brand & Tone
Warm, direct, premium, and helpful. The app should speak clearly and avoid technical jargon.

## Competitive Context
The product overlaps with restaurant discovery, delivery, reservations, and restaurant management tools, but the intended advantage is one mobile-first experience for both diners and restaurant operators.

## Timeline Expectations
Current priority: stabilize demo/mock-mode reliability and documentation discipline. Next: sync architecture, improve UI polish, then harden backend/auth/security before any production launch.
