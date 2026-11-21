/**
 * Nina Read-only Ticket API
 *
 * Deploy this as a SEPARATE Apps Script project from the private dashboard.
 * The web app exposes one ticket by ID only; it has no write methods and no list endpoint.
 */
const NINA_SPREADSHEET_ID = "13OexAsX_0l6_OVr0LpVcwVfMXBg2J2981F2ESut-SXY";
const NINA_QUESTIONS_TAB = "Questions";
const NINA_EVENTS_TAB = "Events";
const NINA_HEADERS = ["id","question","normalized","category","priority","status","occurrences","first_seen","last_seen","notes","type","parent_id","archived","created_at"];

/**
 * Run once manually from the Apps Script editor.
 * Copy the logged token somewhere private. Running again rotates/replaces it.
 */
function generateNinaReadToken() {
  const token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  PropertiesService.getScriptProperties().setProperty("NINA_READ_TOKEN", token);
  console.log("NINA_READ_TOKEN (keep private): " + token);
  return "Token generated. Open Execution log to copy it.";
}

/** Public GET: ?id=TICKET_ID&token=LONG_RANDOM_TOKEN */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const expected = PropertiesService.getScriptProperties().getProperty("NINA_READ_TOKEN");
  if (!expected || !safeEqual_(String(params.token || ""), expected)) {
    return json_({ ok: false, error: "Unauthorized" });
  }
  const id = String(params.id || "").trim();
  if (!/^[a-f0-9-]{36}$/i.test(id)) return json_({ ok: false, error: "A valid ticket ID is required." });

  const ss = SpreadsheetApp.openById(NINA_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(NINA_QUESTIONS_TAB);
  if (!sheet || sheet.getLastRow() < 2) return json_({ ok: false, error: "Ticket not found." });

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, NINA_HEADERS.length).getValues();
  const records = values.map(mapTicket_);
  const ticket = records.find(t => t.id === id);
  if (!ticket) return json_({ ok: false, error: "Ticket not found." });

  const linkedQuestions = ticket.type === "enhancement"
    ? records.filter(t => t.parent_id === id)
    : [];
  const parent = ticket.parent_id ? (records.find(t => t.id === ticket.parent_id) || null) : null;
  const events = ticket.type === "enhancement" ? [] : readEvents_(ss, id);

  return json_({
    ok: true,
    ticket: ticket,
    parent: parent ? { id: parent.id, title: parent.question, status: parent.status, archived: parent.archived } : null,
    linked_questions: linkedQuestions,
    question_events: events,
    read_only: true
  });
}

function mapTicket_(r) {
  return {
    id: String(r[0] || ""),
    question: String(r[1] || ""),
    category: String(r[3] || "Uncategorized"),
    priority: String(r[4] || "Medium"),
    status: String(r[5] || "New"),
    occurrences: Number(r[6] || 0),
    first_seen: dateIso_(r[7]),
    last_seen: dateIso_(r[8]),
    notes: String(r[9] || ""),
    type: String(r[10] || "question"),
    parent_id: String(r[11] || ""),
    archived: r[12] === true || String(r[12]).toLowerCase() === "true",
    created_at: dateIso_(r[13] || r[7])
  };
}

function readEvents_(ss, ticketId) {
  const sheet = ss.getSheetByName(NINA_EVENTS_TAB);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues()
    .filter(r => String(r[1]) === ticketId)
    .slice(-30)
    .reverse()
    .map(r => ({ question: String(r[2] || ""), created_at: dateIso_(r[3]) }));
}

function dateIso_(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
