// Nina Analytics — PUBLIC, WRITE-ONLY COLLECTOR
// Deploy this project as a Web App: Execute as ME; Who has access: ANYONE.
// Keep the spreadsheet private. This endpoint only appends validated questions.
const SPREADSHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const QUESTIONS_TAB = "Questions";
const EVENTS_TAB = "Events";
const QUESTION_HEADERS = ["id","question","normalized","category","priority","status","occurrences","first_seen","last_seen","notes"];
const EVENT_HEADERS = ["id","question_id","question","created_at"];
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const question = String(body.question || "").trim().replace(/\s+/g, " ").slice(0, 1000);
    const normalized = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
    if (!normalized) return output({ ok: false, error: "Invalid question" });
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const questions = getOrCreateSheet_(ss, QUESTIONS_TAB, QUESTION_HEADERS);
    const events = getOrCreateSheet_(ss, EVENTS_TAB, EVENT_HEADERS);
    const rows = questions.getLastRow() > 1 ? questions.getRange(2, 1, questions.getLastRow()-1, QUESTION_HEADERS.length).getValues() : [];
    const now = new Date();
    let rowNumber = -1, id = "";
    for (let i=0; i<rows.length; i++) { if (rows[i][2] === normalized) { rowNumber=i+2; id=String(rows[i][0]); break; } }
    if (rowNumber < 0) {
      id = Utilities.getUuid();
      questions.appendRow([id, question, normalized, "Uncategorized", "Medium", "New", 1, now, now, ""]);
    } else {
      const current = questions.getRange(rowNumber, 1, 1, QUESTION_HEADERS.length).getValues()[0];
      questions.getRange(rowNumber, 7).setValue(Number(current[6] || 0) + 1);
      questions.getRange(rowNumber, 9).setValue(now);
    }
    events.appendRow([Utilities.getUuid(), id, question, now]);
    return output({ ok: true });
  } catch (err) {
    return output({ ok: false, error: "Unable to record question" });
  }
}
function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) { sheet.appendRow(headers); sheet.setFrozenRows(1); }
  return sheet;
}
function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
