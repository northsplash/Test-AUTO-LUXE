import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Client-Info, Apikey',
  'Content-Type':'application/json'
};

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const clean=(v:unknown,max=500)=>String(v??'').trim().slice(0,max);

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  try{
    const url=Deno.env.get('SUPABASE_URL')||''; let key='';
    const raw=Deno.env.get('SUPABASE_SECRET_KEYS');
    if(raw){try{const parsed=JSON.parse(raw);key=parsed?.default||parsed?.service_role||parsed?.serviceRole||''}catch{}}
    if(!key) key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
    if(!url||!key) throw new Error('Supabase server credentials are missing.');
    const body=await req.json();
    const name=clean(body.customer_name,120),email=clean(body.customer_email,254).toLowerCase(),phone=clean(body.customer_phone,40);
    const service=clean(body.service_name,160),vehicle=clean(body.vehicle_info,240);
    if(!name||!email||!service) return json({error:'Name, email and service are required.'},400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'Please enter a valid email address.'},400);
    const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const payload={
      user_id:null,customer_name:name,customer_email:email,customer_phone:phone||null,
      service_name:service,package_name:clean(body.package_name,160)||null,
      add_ons:Array.isArray(body.add_ons)?body.add_ons.map((x:unknown)=>clean(x,100)).slice(0,20):[],
      vehicle_info:vehicle||null,price:Math.max(0,Math.min(Number(body.price)||0,100000)),
      notes:clean(body.notes,1500)||null,status:'pending',source_channel:'northsplash.com'
    };
    const {data,error}=await admin.from('appointments').insert(payload).select('id,created_at').single();
    if(error) throw error;
    await admin.from('audit_logs').insert({action:'public.booking_received',entity_type:'appointment',entity_id:data.id,details:{customer_email:email,service_name:service,source:'northsplash.com'}}).then(()=>{});
    return json({success:true,appointment_id:data.id});
  }catch(e){console.error('[public-booking]',e);return json({error:e instanceof Error?e.message:String(e)},400)}
});
