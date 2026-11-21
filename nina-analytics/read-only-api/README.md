# Nina read-only ticket API

This is a separate Apps Script web app for sharing one Nina ticket with an assistant. It does not change the private dashboard deployment and has no write or list operation.

## Setup

1. Create a **new** Google Apps Script project (do not add this to the existing private dashboard project).
2. Replace the starter code in `Code.gs` with `NinaReadOnlyApi.gs`.
3. Confirm the spreadsheet ID and tab names match your Nina dashboard.
4. Run `generateNinaReadToken` once from the editor and approve the requested spreadsheet access. Copy the long token from the Execution log and keep it private. If you run the function again, the old token is replaced.
5. Deploy > New deployment > Web app:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the deployed web app URL. Do not change the access setting on the existing dashboard project.

## Create a share link

Use this shape, replacing the values:

```
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?id=TICKET_UUID&token=YOUR_LONG_TOKEN
```

Paste that complete link into ChatGPT. It returns only the requested ticket, its linked questions (if it is an enhancement), its parent summary (if linked), and up to 30 recent question events. It never returns the full sheet.

## Security notes

- Anyone with a complete share link can read that ticket and the linked question details. Treat the tokenized URL like a password.
- The dashboard itself remains private because this API is a separate Apps Script project.
- To revoke all previously shared links, run `generateNinaReadToken` again and update any links you still need.
- Do not put sensitive personal information in ticket notes; the API intentionally returns the notes for the requested ticket.
