import{c as n,s as a}from"./supabase-D9bt9VG0.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=n("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=n("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=n("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);function d(e){return e?e.title==="Owner / Field Operator"||e.department==="Ownership"||String(e.notes||"").includes("Owner field profile")?!0:(e.work_modes||[]).includes("owner")&&e.role==="detailer"&&Number(e.employment_level||0)>=5:!1}function w(e){return e.filter(t=>t.status==="active"&&!d(t))}async function y(e,t,r){const i=await a.rpc("ensure_owner_field_employee");if(!i.error&&i.data)return i.data;const s=await a.from("employees").select("*").eq("user_id",e).maybeSingle();if(s.data)return s.data;if(r){const l=await a.from("employees").select("*").ilike("email",r).maybeSingle();if(l.data){const o=await a.from("employees").update({user_id:e}).eq("id",l.data.id).select().single();if(o.data)return o.data}}return(await a.from("employees").insert({user_id:e,name:t||"North Splash Owner",email:r||null,role:"detailer",title:"Owner / Field Operator",department:"Ownership",status:"active",employment_level:5,pay_type:"custom",hourly_rate:0,weekly_base:0,commission_rate:0,jobs_completed:0,total_earnings:0,notes:"Owner field profile. Used for D2D and detailing assignments.",work_modes:["owner","d2d","detailer","manager"]}).select().single()).data}export{c as M,m as T,f as U,y as e,w as h,d as i};
