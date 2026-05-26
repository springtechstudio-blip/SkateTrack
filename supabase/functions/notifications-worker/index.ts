import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FCM_URL = "https://fcm.googleapis.com/fcm/send";

function localDate(tz: string): string {
  try { return new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
  catch { return new Date().toISOString().slice(0,10); }
}
function localTime(tz: string): string {
  try { return new Intl.DateTimeFormat("en-GB",{timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date()); }
  catch { const n=new Date(); return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`; }
}
function getSlot(time:string):number{const[h,m]=time.split(":").map(Number);const t=h*60+m;if(t>=14*60&&t<16*60)return 1;if(t>=16*60&&t<18*60)return 2;if(t>=18*60&&t<20*60)return 3;return 0}
function slotLabel(s:number){return s===1?"pomeriggio":s===2?"tardo pomeriggio":s===3?"sera":""}

serve(async()=>{
  try{
    const url=Deno.env.get("SUPABASE_URL")!; const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; const fcmKey=Deno.env.get("FCM_SERVER_KEY")!;
    const hdrs={apikey:key,Authorization:`Bearer ${key}`}; if(!fcmKey) return new Response("FCM_SERVER_KEY not set",{status:500});

    const [settings,tokens]=await Promise.all([
      (await fetch(`${url}/rest/v1/user_settings?select=*`,{headers:hdrs})).json(),
      (await fetch(`${url}/rest/v1/push_tokens?select=*`,{headers:hdrs})).json()
    ]);
    const tokMap=new Map(tokens.map((t:any)=>[t.user_id,t.token]));
    let enqueued=0;

    for(const s of settings){
      const dt=tokMap.get(s.user_id); if(!dt||!s.notifications_enabled) continue;
      const tz=s.timezone||"UTC"; const today=localDate(tz); const time=localTime(tz); const slot=getSlot(time);

      if(s.habit_notifications&&slot>0){
        let c=s.habit_notifications_count||0; if(s.last_habit_notification_date!==today)c=0;
        if(c<slot){
          const[habs,comps]=await Promise.all([
            (await fetch(`${url}/rest/v1/habits?select=id,name&user_id=eq.${s.user_id}&archived=eq.false&deleted_at=is.null`,{headers:hdrs})).json(),
            (await fetch(`${url}/rest/v1/habit_completions?select=habit_id&user_id=eq.${s.user_id}&date=eq.${today}`,{headers:hdrs})).json()
          ]);
          if(habs?.length){
            const done=new Set((comps||[]).map((d:any)=>d.habit_id)); const undone=habs.filter((h:any)=>!done.has(h.id));
            if(undone.length>0){
              const lb=slotLabel(slot); const body=undone.length===1?`Buon${lb==="sera"?"a":" "}${lb}! 1 abitudine da fare: ${undone[0].name}`:`Buon${lb==="sera"?"a":" "}${lb}! ${undone.length} abitudini da fare: ${undone.map((h:any)=>h.name).join(", ")}`;
              const q=await fetch(`${url}/rest/v1/notification_queue`,{method:"POST",headers:{...hdrs,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({user_id:s.user_id,token:dt,title:"Promemoria abitudini",body:body.length>200?body.slice(0,197)+"...":body,language:s.language||"it"})});
              if(q.ok){await fetch(`${url}/rest/v1/user_settings?user_id=eq.${s.user_id}`,{method:"PATCH",headers:{...hdrs,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({last_habit_notification_date:today,habit_notifications_count:c+1})});enqueued++}
            }
          }
        }
      }

      if(s.evening_summary&&s.last_evening_summary_date!==today&&time>=s.evening_time){
        const qs=[fetch(`${url}/rest/v1/skating_sessions?select=id&user_id=eq.${s.user_id}&date=eq.${today}`,{headers:hdrs}),fetch(`${url}/rest/v1/habit_completions?select=id,habit_id&user_id=eq.${s.user_id}&date=eq.${today}`,{headers:hdrs}),fetch(`${url}/rest/v1/competitions?select=id&user_id=eq.${s.user_id}&date=eq.${today}`,{headers:hdrs})];
        if(s.coach_mode)qs.push(fetch(`${url}/rest/v1/training_attendance?select=id&user_id=eq.${s.user_id}&date=eq.${today}`,{headers:hdrs}));
        const[sR,hR,cR,aR]=await Promise.all(qs.map(q=>q.then(r=>r.json()))); const parts:string[]=[]; const nh=(hR||[]).length;const ns=(sR||[]).length;const nc=(cR||[]).length;const na=(aR||[]).length;
        if(nh>0)parts.push(`${nh} abitudini`);if(ns>0)parts.push(`${ns} sessioni`);if(na>0)parts.push(`${na} presenze`);if(nc>0)parts.push(`${nc} gare`);
        let body=parts.length>0?`Oggi: ${parts.join(", ")}.`:"Nessuna attività oggi.";
        const[h2,c2]=await Promise.all([(await fetch(`${url}/rest/v1/habits?select=id,name&user_id=eq.${s.user_id}&archived=eq.false&deleted_at=is.null`,{headers:hdrs})).json(),(await fetch(`${url}/rest/v1/habit_completions?select=habit_id&user_id=eq.${s.user_id}&date=eq.${today}`,{headers:hdrs})).json()]);
        if(h2?.length){const u=h2.filter((h:any)=>!new Set((c2||[]).map((d:any)=>d.habit_id)).has(h.id));if(u.length>0)body+=` Manca${u.length>1?"no":" "} ${u.length} abitudin${u.length>1?"i":"e"}.`}
        const q=await fetch(`${url}/rest/v1/notification_queue`,{method:"POST",headers:{...hdrs,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({user_id:s.user_id,token:dt,title:"Riepilogo giornata",body:body.length>200?body.slice(0,197)+"...":body,language:s.language||"it"})});
        if(q.ok){await fetch(`${url}/rest/v1/user_settings?user_id=eq.${s.user_id}`,{method:"PATCH",headers:{...hdrs,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({last_evening_summary_date:today,last_habit_notification_date:today,habit_notifications_count:3})});enqueued++}
      }
    }

    const cutoff=new Date(Date.now()-24*60*60*1000).toISOString();
    const qRes=await fetch(`${url}/rest/v1/notification_queue?sent_at=is.null&created_at=gte.${cutoff}&order=created_at.asc&limit=50`,{headers:hdrs});
    if(!qRes.ok) return new Response("Enqueued: "+enqueued+", flush failed",{status:500});
    const rows:any[]=await qRes.json(); let sent=0;
    for(const row of rows){
      try{
        const r=await fetch(FCM_URL,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`key=${fcmKey}`},body:JSON.stringify({to:row.token,priority:"high",notification:{title:row.title,body:row.body,sound:"default",priority:"high"},data:{click_action:"OPEN_APP"}})});
        if(r.ok||r.status===400||r.status===404){await fetch(`${url}/rest/v1/notification_queue?id=eq.${row.id}`,{method:"PATCH",headers:{...hdrs,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({sent_at:new Date().toISOString()})});if(r.ok)sent++}
      }catch(_){}
    }

    return new Response("Enqueued: "+enqueued+", Sent: "+sent);
  }catch(e){return new Response("Error: "+(e instanceof Error?e.message:String(e)),{status:500})}
});
