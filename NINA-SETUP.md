# Nina AI setup (feature branch)

Nina's front end is hosted on GitHub Pages; the optional AI backend is a Vercel Function in `api/chat.js`.
The curated guide continues working when the API is disabled or unavailable.

## Before enabling

1. Import this repository into a **separate Vercel project**. Keep GitHub Pages as the public site.
2. Configure the Vercel project as an **Other** framework with the repository root as the root directory.
3. In Vercel Settings → Environment Variables, add:
   - `OPENAI_API_KEY` = your private OpenAI API key (never add it to GitHub or Nina's browser scripts).
   - `NINA_ENABLED` = `true` **only after** completing billing/abuse controls below.
   - `NINA_MODEL` = `gpt-4.1-mini` (optional default; confirm model availability in your API account).
4. Set a strict budget/usage alert for the API provider. **Configure a persistent Vercel WAF rate limit for `/api/chat` (or an equivalent durable per-client quota).** Browser CORS and simple input limits are **not** cost protections: automated clients can spoof Origin or call the endpoint directly.
5. Deploy and copy your Vercel deployment URL. Update `nina-config.js` to `window.NINA_API_URL = "https://YOUR-PROJECT.vercel.app/api/chat";` (no trailing slash after `chat`).
6. For local preview: use Live Server on `index.html`. In a local preview, the Vercel API can be used after setting the URL above; the API allows standard Live Server localhost origins.
7. Once tested, merge the branch into `main` to publish Nina on GitHub Pages. **Do not merge until you are comfortable with costs and output quality.**

## Important limitations

- The Vercel API key exists only in server environment variables, not in browser code.
- Requests contain the visitor's latest question and up to six prior chat messages. They are sent to your Vercel function and the AI provider; Nina's front end does not deliberately store or log chat history. Provider/platform operational logging and retention policies may still apply.
- `store: false` is set for the AI Responses API request.
- Nina grounds answers in `portfolio-knowledge.json`. Review that file and its public-safe wording before launch. Models can still make mistakes; test for unsupported claims.
- CORS restricts supported browser origins but is **not** an authentication or anti-abuse control.
- On any network/AI failure Nina falls back to her curated answers without pretending to have used AI.
- API access is off by default. This repository contains no secret credentials.
