import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Client-Info, Apikey','Content-Type':'application/json'};

Deno.serve(async(req:Request)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')||'',resend=Deno.env.get('RESEND_API_KEY');
 let key='';
 const secretKeysRaw=Deno.env.get('SUPABASE_SECRET_KEYS');
 if(secretKeysRaw){try{const parsed=JSON.parse(secretKeysRaw);key=parsed?.default||parsed?.service_role||parsed?.serviceRole||''}catch(e){console.error('[automation-worker] failed to parse SUPABASE_SECRET_KEYS',e)}}
 if(!key)key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 if(!url||!key)throw new Error('Supabase server credentials are missing.');
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const token=(req.headers.get('Authorization')||'').replace('Bearer ','');const {data:{user}}=await admin.auth.getUser(token);if(!user)throw new Error('Unauthorized');const {data:actor}=await admin.from('profiles').select('role,portal_role,permissions').eq('id',user.id).maybeSingle();if(!(actor?.role==='admin'||actor?.portal_role==='owner'||actor?.permissions?.['notifications.manage']))throw new Error('Automation access required.');
 await queueDueEvents(admin);
 const {data:events,error}=await admin.from('automation_events').select('*').eq('status','pending').lte('process_after',new Date().toISOString()).order('process_after').limit(100);if(error)throw error;let processed=0,failed=0;
 for(const event of events||[]){try{
   await admin.from('automation_events').update({status:'processing',attempts:(event.attempts||0)+1}).eq('id',event.id);
   const {data:rules}=await admin.from('automation_rules').select('*').eq('trigger_event',event.event_key).eq('is_enabled',true);
   for(const rule of rules||[]) await executeRule(admin,resend,rule,event);
   await admin.from('automation_events').update({status:'processed',processed_at:new Date().toISOString(),error_message:null}).eq('id',event.id);processed++;
 }catch(e){failed++;await admin.from('automation_events').update({status:'failed',error_message:e instanceof Error?e.message:String(e)}).eq('id',event.id)}}
 return json({success:true,processed,failed,queued:(events||[]).length});
}catch(e){return json({error:e instanceof Error?e.message:String(e)},400)}});

async function queueDueEvents(admin:any){
 const now=new Date(),in25h=new Date(now.getTime()+25*3600000).toISOString();
 const {data:appointments}=await admin.from('appointments').select('id,user_id,customer_name,customer_email,service_name,scheduled_at').gte('scheduled_at',now.toISOString()).lte('scheduled_at',in25h).not('status','in','("cancelled","completed")');
 for(const a of appointments||[]){
   const {data:existing}=await admin.from('automation_events').select('id').eq('event_key','appointment.reminder_due').eq('entity_id',a.id).maybeSingle();
   if(!existing) await admin.from('automation_events').insert({event_key:'appointment.reminder_due',entity_type:'appointment',entity_id:a.id,payload:a,status:'pending',process_after:now.toISOString()});
 }
 const {data:leads}=await admin.from('leads').select('id,assigned_employee_id,customer_name,address,follow_up_at').lte('follow_up_at',now.toISOString()).not('status','in','("sold","lost","not_interested","do_not_knock")').limit(200);
 for(const lead of leads||[]){const {data:existing}=await admin.from('automation_events').select('id').eq('event_key','lead.follow_up_due').eq('entity_id',lead.id).maybeSingle();if(!existing)await admin.from('automation_events').insert({event_key:'lead.follow_up_due',entity_type:'lead',entity_id:lead.id,payload:{...lead,message:`Follow up with ${lead.customer_name||lead.address||'lead'}`},status:'pending',process_after:now.toISOString()})}
}

async function executeRule(admin:any,resend:string|undefined,rule:any,event:any){
 if(rule.action_type==='notification'){
   await admin.from('business_notifications').insert({target_employee_id:event.payload?.assigned_employee_id||null,target_portal_role:event.payload?.assigned_employee_id?null:'owner',title:rule.name,message:String(event.payload?.message||human(event.event_key)),notification_type:'automation',link:event.payload?.link||null});return;
 }
 if(rule.action_type==='task'){
   await admin.from('business_tasks').insert({title:rule.name,description:String(event.payload?.message||human(event.event_key)),assigned_employee_id:event.payload?.assigned_employee_id||null,priority:event.payload?.priority||'normal',status:'open',due_at:event.payload?.due_at||null});return;
 }
 if(rule.action_type==='email'){
   if(!resend) throw new Error('RESEND_API_KEY is required for email automations.');
   let eventKey=event.payload?.communication_event||event.event_key;
   if(event.event_key==='appointment.reminder_due')eventKey='appointment_reminder';
   const {data:template}=await admin.from('communication_templates').select('*').eq('event_key',eventKey).eq('is_enabled',true).limit(1).maybeSingle();if(!template)return;
   let recipient=event.payload?.recipient_email||event.payload?.customer_email||'';
   if(!recipient&&event.payload?.user_id){const {data:p}=await admin.from('profiles').select('email').eq('id',event.payload.user_id).maybeSingle();recipient=p?.email||''}if(!recipient)return;
   const vars={...event.payload,appointment_date:event.payload?.scheduled_at?new Date(event.payload.scheduled_at).toLocaleDateString('en-US'):'',appointment_time:event.payload?.scheduled_at?new Date(event.payload.scheduled_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):''};
   const subject=render(template.subject||'North Splash Update',vars),text=render(template.body||'',vars);const audience=template.audience||'customer';const from=audience==='employee'?'North Splash Admin <Admin@northsplash.com>':'North Splash Auto Luxe <noreply@northsplash.com>';
   const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[recipient],subject,html:`<div style="font-family:Arial;color:#211811"><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(text).replace(/\n/g,'<br/>')}</p><p style="color:#9d7651">North Splash Auto Luxe</p></div>`,...(audience==='employee'?{reply_to:'Admin@northsplash.com'}:{})})});const data=await r.json();if(!r.ok)throw new Error(data?.message||'Email automation failed');await admin.from('communication_logs').insert({event_key:eventKey,audience,recipient_email:recipient,from_email:from,subject,status:'sent',provider_id:data?.id||null,sent_at:new Date().toISOString(),related_appointment_id:event.entity_type==='appointment'?event.entity_id:null});
 }
}
function human(v:string){return v.replaceAll('.',' ').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
function render(template:string,vars:any){return template.replace(/{{\s*([\w.]+)\s*}}/g,(_m,k)=>{const v=k.split('.').reduce((o:any,p:string)=>o?.[p],vars);return v==null?'':String(v)})}
function escapeHtml(v:string){return v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]||c))}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors})}
