const ALLOWED_ORIGINS = ["https://noelledang.github.io"];
const json = (body, status = 200, origin = "") => new Response(JSON.stringify(body), {status,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type","vary":"Origin"}});
export async function onRequestOptions({request}) {
  const origin=request.headers.get("Origin")||"";
  if(!ALLOWED_ORIGINS.includes(origin)) return new Response(null,{status:403});
  return new Response(null,{headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"86400","vary":"Origin"}});
}
export async function onRequestPost({request,env}) {
  const origin=request.headers.get("Origin")||"";
  if(!ALLOWED_ORIGINS.includes(origin)) return json({error:"Origin not allowed"},403,origin);
  if(!env.DB) return json({error:"Database is not configured"},503,origin);
  let body; try{body=await request.json();}catch{return json({error:"Invalid JSON"},400,origin);}
  const question=String(body.question||"").trim().replace(/\s+/g," ");
  if(!question||question.length>1000) return json({error:"Question must be between 1 and 1000 characters"},400,origin);
  const normalized=question.toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  if(!normalized) return json({ok:true},202,origin);
  const now=new Date().toISOString();
  try{
    await env.DB.prepare("INSERT INTO question_clusters (id,question,normalized_question,category,priority,status,occurrences,first_seen,last_seen,notes) VALUES (?,?,?,'Uncategorized','Medium','New',1,?,?, '') ON CONFLICT(normalized_question) DO UPDATE SET occurrences=occurrences+1,last_seen=excluded.last_seen")
      .bind(crypto.randomUUID(),question,normalized,now,now).run();
    const cluster=await env.DB.prepare("SELECT id FROM question_clusters WHERE normalized_question=?").bind(normalized).first();
    await env.DB.prepare("INSERT INTO question_events (id,cluster_id,question,created_at) VALUES (?,?,?,?)").bind(crypto.randomUUID(),cluster.id,question,now).run();
    return json({ok:true},202,origin);
  }catch{return json({error:"Unable to save question"},500,origin);}
}