# Nina Product Intelligence — simple Google Sheets setup

This version uses **Google Sheets + Apps Script only**. It does not use Cloudflare, D1, a paid dashboard service, or a separate database. The Lovable-inspired dashboard is served by Google Apps Script as a private web app.

## Included
- `nina-analytics/collector/Code.gs`: public, write-only collector.
- `nina-analytics/dashboard/Code.gs`, `Dashboard.html`, `Styles.html`, `Client.html`: private dashboard with Overview, Question Inbox, Trends, CSV export, and question editing.
- Exact repeated phrasings are grouped; every occurrence is retained in the Events tab.\n- Jira-style workflow: select related inbox tickets, create one enhancement, and automatically close/archive the linked tickets under it.\n- Active Enhancements and Archived views keep completed work out of the active inbox while preserving linked history and CSV exports.\n- Archived enhancement tickets retain their child question history, which is accessible from the enhancement detail panel rather than cluttering the archive list.

## 1. Create the spreadsheet
1. Create a Google Sheet named **Nina Analytics**.
2. Copy the spreadsheet ID from its URL (between `/d/` and `/edit`).
3. Keep the spreadsheet private. Do not share it publicly.
4. Create tabs named `Questions` and `Events` (the scripts also create them if missing).

## 2. Create the public collector
1. Visit [script.google.com](https://script.google.com/) and create a project named `Nina Question Collector`.
2. Replace `Code.gs` with `nina-analytics/collector/Code.gs` from this repository.
3. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your spreadsheet ID.
4. Save and run a test after deployment to authorize spreadsheet access.
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone**. This endpoint must accept anonymous portfolio submissions. It has no read or edit methods.
7. Deploy and copy the Web app URL ending in `/exec`. Treat it as public.

## 3. Create the private dashboard
1. Create a second Apps Script project named `Nina Product Intelligence Dashboard`.
2. Add four files: `Code.gs`, `Dashboard.html`, `Styles.html`, and `Client.html`. Copy the matching files from `nina-analytics/dashboard/`.
3. In `Code.gs`, replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with the same spreadsheet ID.
4. Save, then select **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Only myself**. Do not make this dashboard public.
6. Deploy and authorize. Bookmark the Web app URL ending in `/exec`. That is your private analytics dashboard.

Google's documentation explains web app access and execution settings: https://developers.google.com/apps-script/guides/web

## 4. Connect Nina
In the portfolio repository's `nina.js`, replace `PASTE_COLLECTOR_WEB_APP_URL_HERE` with the public collector URL from step 2. The call runs only when Nina uses its fallback answer. It sends only unanswered question text, using a fire-and-forget request; Nina does not need to read a response.

Add a brief notice to your portfolio that unanswered questions may be collected to improve the assistant.

## Ticket workflow\n- Individual unanswered questions start as active question tickets. You can edit category, priority, status, and notes, or archive a ticket manually.\n- Select one or more related questions in the inbox and choose **Create enhancement**. Give the enhancement a title, description/acceptance criteria, category, and priority.\n- Creating it automatically closes and archives the selected question tickets, links them to the enhancement, and removes them from the active inbox. Open the enhancement to see its linked questions.\n- When the improvement is complete, choose **Mark done & archive**. The enhancement moves to Archive; its linked question history remains attached. Archived tickets stay included in all-time analytics.\n\n## Data and limitations
- The collector is public and write-only. Do not add dashboard read/update methods to that project.
- The dashboard is a separate deployment restricted to your Google account.
- Only question text and timestamps are stored. The scripts do not request or store names, emails, IP addresses, or session identifiers.
- Exact phrasings are grouped after basic normalization. Semantically similar but differently worded questions are not automatically merged.
- Apps Script and Sheets have quotas and usage limits. This is intentionally a lightweight personal analytics tool, not a high-volume production system.
- Metrics remain empty until visitors ask Nina questions that reach its fallback.
