async function verifyAccess(request,env){
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if(!token||!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD)return false;
  try{
    const parts=token.split(".");if(parts.length!==3)return false;
    const decode=s=>JSON.parse(atob(s.replace(/-/g,"+").replace(/_/g,"/")));
    const header=decode(parts[0]),payload=decode(parts[1]);
    const domain=env.ACCESS_TEAM_DOMAIN.replace(/^https?:\\/\\//,"").replace(/\\/$/,"");
    const issuer="https://"+domain;
    if(header.alg!=="RS256"||!header.kid||payload.iss!==issuer||!Array.isArray(payload.aud)||!payload.aud.includes(env.ACCESS_AUD)||!payload.exp||payload.exp<=Date.now()/1000)return false;
    const response=await fetch(issuer+"/cdn-cgi/access/certs");if(!response.ok)return false;
    const certs=await response.json(),jwk=(certs.keys||[]).find(k=>k.kid===header.kid);if(!jwk)return false;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    const sig=Uint8Array.from(atob(parts[2].replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,sig,new TextEncoder().encode(parts[0]+"."+parts[1]));
  }catch{return false;}
}
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
export async function onRequest({request,env,params}){
  if(!(await verifyAccess(request,env)))return respond({error:"Unauthorized. Sign in with your approved Cloudflare Access account."},401);
  if(!env.DB)return respond({error:"D1 database binding is missing."},503);
  const parts=Array.isArray(params.path)?params.path:[],route=parts.join("/"),url=new URL(request.url);
  try{
    if(request.method==="GET"&&route==="summary"){
      const row=await env.DB.prepare("SELECT COUNT(*) total_groups,COALESCE(SUM(occurrences),0) total_events,SUM(CASE WHEN status NOT IN ('Resolved','Won''t fix') THEN 1 ELSE 0 END) open_groups,SUM(CASE WHEN status='Resolved' THEN 1 ELSE 0 END) resolved_groups,SUM(CASE WHEN occurrences>1 THEN 1 ELSE 0 END) recurring_groups,SUM(CASE WHEN julianday(first_seen)>=julianday('now','-7 days') THEN 1 ELSE 0 END) new_week FROM question_clusters").first();
      const groups=Number(row.total_groups||0),resolved=Number(row.resolved_groups||0),recurring=Number(row.recurring_groups||0);
      return respond({totalGroups:groups,totalEvents:Number(row.total_events||0),open:Number(row.open_groups||0),unanswered:Number(row.total_events||0),resolved,recurring,newThisWeek:Number(row.new_week||0),repeatRate:groups?Math.round(recurring/groups*100):0,resolutionRate:groups?Math.round(resolved/groups*100):0});
    }
    if(request.method==="GET"&&route==="questions"){
      const status=url.searchParams.get("status");
      const result=status?await env.DB.prepare("SELECT * FROM question_clusters WHERE status=? ORDER BY last_seen DESC LIMIT 500").bind(status).all():await env.DB.prepare("SELECT * FROM question_clusters ORDER BY last_seen DESC LIMIT 500").all();
      return respond({questions:result.results||[]});
    }
    if(parts[0]==="questions"&&parts[1]){
      const id=parts[1];
      if(request.method==="GET"&&parts[2]==="events"){
        const result=await env.DB.prepare("SELECT question,created_at FROM question_events WHERE cluster_id=? ORDER BY created_at DESC LIMIT 30").bind(id).all();
        return respond({events:result.results||[]});
      }
      if(request.method==="PATCH"&&parts.length===2){
        const body=await request.json(),statuses=["New","Investigating","In progress","Resolved","Won't fix"],priorities=["Low","Medium","High"];
        const status=statuses.includes(body.status)?body.status:"New",priority=priorities.includes(body.priority)?body.priority:"Medium";
        const category=String(body.category||"Uncategorized").slice(0,100),notes=String(body.notes||"").slice(0,5000);
        const result=await env.DB.prepare("UPDATE question_clusters SET category=?,priority=?,status=?,notes=? WHERE id=?").bind(category,priority,status,notes,id).run();
        if(!result.meta.changes)return respond({error:"Question not found"},404);
        return respond({ok:true});
      }
    }
    return respond({error:"Not found"},404);
  }catch{return respond({error:"Unable to process this request."},500);}
}