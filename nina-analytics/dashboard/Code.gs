// Nina Analytics — PRIVATE DASHBOARD
// Deploy as Web App: Execute as ME; Who has access: ONLY MYSELF.
const SPREADSHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const QUESTIONS_TAB = "Questions";
const EVENTS_TAB = "Events";
function doGet() {
  return HtmlService.createTemplateFromFile("Dashboard").evaluate()
    .setTitle("Nina · Product Intelligence")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}
function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }
function getDashboardData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(QUESTIONS_TAB);
  const values = sheet && sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues() : [];
  const questions = values.map(r => ({id:String(r[0]),question:String(r[1]),category:String(r[3]||"Uncategorized"),priority:String(r[4]||"Medium"),status:String(r[5]||"New"),occurrences:Number(r[6]||0),first_seen:toIso_(r[7]),last_seen:toIso_(r[8]),notes:String(r[9]||"")})).sort((a,b)=>new Date(b.last_seen)-new Date(a.last_seen));
  const totalGroups=questions.length, totalEvents=questions.reduce((n,q)=>n+q.occurrences,0);
  const recurring=questions.filter(q=>q.occurrences>1).length, resolved=questions.filter(q=>q.status==="Resolved").length;
  const open=questions.filter(q=>!["Resolved","Won't fix"].includes(q.status)).length;
  const week=Date.now()-7*86400000;
  const newThisWeek=questions.filter(q=>new Date(q.first_seen).getTime()>=week).length;
  return {questions,summary:{totalGroups,totalEvents,open,unanswered:totalEvents,resolved,recurring,newThisWeek,repeatRate:totalGroups?Math.round(recurring/totalGroups*100):0,resolutionRate:totalGroups?Math.round(resolved/totalGroups*100):0}};
}
function getQuestionEvents(id) {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID), sheet=ss.getSheetByName(EVENTS_TAB);
  if (!sheet || sheet.getLastRow()<2) return [];
  const rows=sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues();
  return rows.filter(r=>String(r[1])===String(id)).slice(-30).reverse().map(r=>({question:String(r[2]),created_at:toIso_(r[3])}));
}
function updateQuestion(payload) {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID), sheet=ss.getSheetByName(QUESTIONS_TAB);
  if (!sheet || sheet.getLastRow()<2) throw new Error("Question not found");
  const rows=sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues();
  const index=rows.findIndex(r=>String(r[0])===String(payload.id));
  if(index<0) throw new Error("Question not found");
  const statuses=["New","Investigating","In progress","Resolved","Won't fix"], priorities=["Low","Medium","High"];
  const row=index+2;
  sheet.getRange(row,4).setValue(String(payload.category||"Uncategorized").slice(0,100));
  sheet.getRange(row,5).setValue(priorities.includes(payload.priority)?payload.priority:"Medium");
  sheet.getRange(row,6).setValue(statuses.includes(payload.status)?payload.status:"New");
  sheet.getRange(row,10).setValue(String(payload.notes||"").slice(0,5000));
  return {ok:true};
}
function toIso_(value) { const d=value instanceof Date?value:new Date(value); return isNaN(d.getTime())?"":d.toISOString(); }
