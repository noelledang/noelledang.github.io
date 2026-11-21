# Nina Product Intelligence Dashboard

A standalone Lovable-inspired dashboard for questions Nina cannot answer. It uses Cloudflare Pages Functions and D1, designed to fit within Cloudflare's free allowances (usage limits apply).

## Included
- `nina-admin/`: Overview, Question Inbox, Trends, CSV export, editable status/priority/category/notes.
- `functions/api/collect.js`: public origin-restricted collection endpoint.
- `functions/api/admin/[[path]].js`: admin API that validates Cloudflare Access JWTs before returning or changing data.
- `schema.sql`: D1 schema. Repeated exact phrasings are grouped; individual visitor phrasings remain in `question_events`.
- `wrangler.toml`: Cloudflare Pages and D1 configuration template.

## Not connected yet
No visitor questions have been collected yet. The dashboard intentionally shows empty states, not invented metrics. Nina's current live chatbot has not been changed.

## Cloudflare setup
1. Create a Cloudflare account and a D1 database named `nina-product-intelligence`.
2. Copy its database ID into `wrangler.toml`.
3. Execute `schema.sql` in the D1 Console.
4. Create a Cloudflare Pages project connected to this repository. Root directory: `/`; build command: none; build output directory: `.`.
5. Add a D1 binding named `DB` to the Pages project, pointing to this database.
6. Add environment variables `ACCESS_TEAM_DOMAIN` (your Cloudflare Zero Trust team domain, without https://) and `ACCESS_AUD` (the audience tag for the Access app protecting `/api/admin/*`).
7. In Zero Trust → Access → Applications, protect `YOUR-PAGES-HOSTNAME/nina-admin/*` and separately protect `YOUR-PAGES-HOSTNAME/api/admin/*`. Allow only your email. Do not protect `/api/collect`; it must remain public for the portfolio chatbot.
8. Visit `https://YOUR-PAGES-HOSTNAME/nina-admin/` and sign in.

The admin API validates the Cloudflare Access JWT, including issuer, audience, expiration and RSA signature. The dashboard and admin endpoints must both be protected by Access. Use the audience value for the application protecting `/api/admin/*`.

## Connect the existing portfolio chatbot
After the Pages project is deployed, add the following constant near the top of `nina.js`:

```js
const NINA_COLLECT_ENDPOINT = "https://YOUR-PAGES-HOSTNAME/api/collect";
```

Then, inside Nina's `else` branch where it displays the fallback answer, add:

```js
if (NINA_COLLECT_ENDPOINT) {
  fetch(NINA_COLLECT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  }).catch(() => {});
}
```

Keep the existing fallback answer unchanged. The collector receives only the visitor's question; it does not store names, email addresses, IP addresses, or session IDs. It accepts requests only from `https://noelledang.github.io`.

## Data behavior and privacy
- Exact phrasings are grouped case-insensitively with punctuation removed.
- Each individual question and timestamp is retained in `question_events`.
- Differently worded but semantically similar questions are not automatically merged in this first version.
- Empty data stays empty; all displayed metrics come from D1.
- Questions remain until deleted from D1. Add a short privacy notice to the portfolio before enabling collection.
- The collector is public by design; consider Cloudflare rate limiting if abuse occurs.
- Cloudflare free plan limits can change. Monitor usage.
