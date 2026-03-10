import { useState, useReducer, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   PRESTIGE KITCHENS — FULL PROCESS CRM v2
   9-Stage Pipeline: Contact → Measurement → Design → Approvals →
   Budget → Contract → Factory → Installation → After-Sales
═══════════════════════════════════════════════════════════════ */

// ── PIPELINE STAGES ───────────────────────────────────────────────────────
const STAGES = [
  {
    id: "contact",       label: "First Contact",     icon: "📞", short: "Contact",
    color: "#5ca8e0",    desc: "Initial enquiry received, source identified",
    tasks: ["Identify source", "Qualify budget", "Log customer info", "Assign designer"]
  },
  {
    id: "measurement",  label: "Measurement Visit",  icon: "📐", short: "Measure",
    color: "#7ec8e3",   desc: "Site visit booked, dimensions recorded",
    tasks: ["Book site visit", "Record room dimensions", "Note plumbing/electric positions", "Take photos"]
  },
  {
    id: "design",       label: "Design Creation",    icon: "✏️", short: "Design",
    color: "#c9a84c",   desc: "Designer creating 2D/3D kitchen layout",
    tasks: ["Create 2D floor plan", "Render 3D design", "Select materials & finishes", "Prepare design pack"]
  },
  {
    id: "cust_approval", label: "Customer Approval", icon: "👤", short: "Cust. OK",
    color: "#e08c3c",   desc: "Design presented to customer for sign-off",
    tasks: ["Present design to customer", "Note revision requests", "Get written approval", "Update design if needed"]
  },
  {
    id: "mgmt_approval", label: "Management Approval", icon: "🏛️", short: "Mgmt OK",
    color: "#d4a843",   desc: "Management reviews design & costing",
    tasks: ["Submit design to management", "Review costings", "Get management sign-off", "Finalize spec"]
  },
  {
    id: "budget",       label: "Budget & Quotation", icon: "💰", short: "Budget",
    color: "#9c6ce0",   desc: "Final quote prepared and presented",
    tasks: ["Prepare itemized quote", "Apply discounts if any", "Send formal quotation", "Follow up on quote"]
  },
  {
    id: "contract",     label: "Sign Contract",      icon: "📝", short: "Contract",
    color: "#4caf7d",   desc: "Customer signs contract, deposit received",
    tasks: ["Prepare contract", "Collect deposit (50%)", "Get signature", "Log contract number"]
  },
  {
    id: "factory",      label: "Factory / Production", icon: "🏭", short: "Factory",
    color: "#e05c9a",   desc: "Order sent to factory, production tracked",
    tasks: ["Send production order", "Confirm factory receipt", "Track production status", "QC check before delivery"]
  },
  {
    id: "installation", label: "Delivery & Installation", icon: "🔧", short: "Install",
    color: "#4caf7d",   desc: "Kitchen delivered and installed on-site",
    tasks: ["Schedule delivery", "Confirm installation team", "Complete installation", "Customer sign-off on completion"]
  },
  {
    id: "aftersales",   label: "After-Sales",         icon: "⭐", short: "After-Sales",
    color: "#c9a84c",   desc: "Warranty, snagging, and customer satisfaction",
    tasks: ["Send satisfaction survey", "Log any snagging issues", "Issue warranty certificate", "Request referral/review"]
  },
];

const STAGE_IDS = STAGES.map(s => s.id);

const SOURCES = ["Walk-In","Referral","Website","Instagram","Facebook","Phone","Exhibition","Google Ads","Partner"];
const KITCHEN_STYLES = ["Modern","Classic","Contemporary","Rustic","Industrial","Minimalist","Traditional","Bespoke"];
const DESIGNERS = ["Sara Al-Khatib","Omar Nasser","Leila Haddad","Karim Mansour"];
const PRIORITIES = ["High","Medium","Low"];

// approval states within a job
const mkApprovals = () => ({
  customer_design: null,   // null | "approved" | "revision"
  management_design: null,
  customer_budget: null,
  management_budget: null,
  contract_signed: false,
  deposit_received: false,
});

// ── SEED DATA ─────────────────────────────────────────────────────────────
const NOW = new Date();
const daysFrom = d => new Date(NOW.getTime() + d*86400000).toISOString().slice(0,10);

const SEED = [
  {
    id:1, name:"Ahmad Al-Rashid", phone:"+962 79 123 4567", email:"ahmad@email.com",
    address:"Abdoun, Amman", source:"Referral", style:"Modern", priority:"High",
    budget:18500, finalQuote:17800, deposit:8900, stageId:"installation",
    designer:"Sara Al-Khatib", notes:"Prefers white lacquer. Island with seating.",
    measureDate:"2026-02-10", measureNotes:"4.2m x 3.8m. Gas on north wall.",
    designFile:"KIT-2026-041-3D.pdf", quoteNo:"Q-2026-041", contractNo:"C-2026-019",
    factoryOrderNo:"FAC-2026-088", factoryStatus:"In Production",
    installDate:daysFrom(5), warrantyMonths:24,
    approvals:{ customer_design:"approved", management_design:"approved", customer_budget:"approved", management_budget:"approved", contract_signed:true, deposit_received:true },
    completedTasks:{ contact:4, measurement:4, design:4, cust_approval:4, mgmt_approval:4, budget:4, contract:4, factory:3, installation:1, aftersales:0 },
    createdAt:"2026-01-15", lastActivity:"2026-03-08",
    activityLog:[
      {id:1,date:"2026-03-08",type:"update",text:"Installation scheduled for "+daysFrom(5)},
      {id:2,date:"2026-03-01",text:"Factory order confirmed FAC-2026-088"},
      {id:3,date:"2026-02-20",text:"Contract signed, deposit JD 8,900 received"},
    ]
  },
  {
    id:2, name:"Mona Khalil", phone:"+962 77 234 5678", email:"mona.k@mail.com",
    address:"Swefieh, Amman", source:"Instagram", style:"Classic", priority:"High",
    budget:12000, finalQuote:11500, deposit:null, stageId:"budget",
    designer:"Omar Nasser", notes:"Wants marble countertops. Very detail-oriented.",
    measureDate:"2026-02-25", measureNotes:"3.6m x 2.9m. U-shape layout.",
    designFile:"KIT-2026-047-3D.pdf", quoteNo:"Q-2026-047", contractNo:null,
    factoryOrderNo:null, factoryStatus:null, installDate:null, warrantyMonths:null,
    approvals:{ customer_design:"approved", management_design:"approved", customer_budget:null, management_budget:"approved", contract_signed:false, deposit_received:false },
    completedTasks:{ contact:4, measurement:4, design:4, cust_approval:4, mgmt_approval:4, budget:2, contract:0, factory:0, installation:0, aftersales:0 },
    createdAt:"2026-02-01", lastActivity:"2026-03-07",
    activityLog:[
      {id:1,date:"2026-03-07",text:"Quote Q-2026-047 sent to customer"},
      {id:2,date:"2026-02-28",text:"Management approved design & budget"},
    ]
  },
  {
    id:3, name:"Tariq Hussain", phone:"+962 78 345 6789", email:"tariq.h@email.jo",
    address:"Gardens, Amman", source:"Walk-In", style:"Contemporary", priority:"Medium",
    budget:9500, finalQuote:null, deposit:null, stageId:"design",
    designer:"Leila Haddad", notes:"Open-plan preference. Visited showroom twice.",
    measureDate:"2026-03-02", measureNotes:"5.1m x 4.0m open plan. Electric hob.",
    designFile:null, quoteNo:null, contractNo:null,
    factoryOrderNo:null, factoryStatus:null, installDate:null, warrantyMonths:null,
    approvals:mkApprovals(),
    completedTasks:{ contact:4, measurement:4, design:1, cust_approval:0, mgmt_approval:0, budget:0, contract:0, factory:0, installation:0, aftersales:0 },
    createdAt:"2026-02-20", lastActivity:"2026-03-05",
    activityLog:[
      {id:1,date:"2026-03-05",text:"Measurement visit completed"},
      {id:2,date:"2026-03-02",text:"Design creation started by Leila Haddad"},
    ]
  },
  {
    id:4, name:"Rana Aziz", phone:"+962 79 456 7890", email:"rana@home.com",
    address:"Dabouq, Amman", source:"Website", style:"Minimalist", priority:"Medium",
    budget:22000, finalQuote:null, deposit:null, stageId:"measurement",
    designer:"Karim Mansour", notes:"High-end project. No rush but serious buyer.",
    measureDate:daysFrom(3), measureNotes:null, designFile:null, quoteNo:null, contractNo:null,
    factoryOrderNo:null, factoryStatus:null, installDate:null, warrantyMonths:null,
    approvals:mkApprovals(),
    completedTasks:{ contact:4, measurement:0, design:0, cust_approval:0, mgmt_approval:0, budget:0, contract:0, factory:0, installation:0, aftersales:0 },
    createdAt:"2026-03-08", lastActivity:"2026-03-08",
    activityLog:[{id:1,date:"2026-03-08",text:"Lead created from website enquiry"}]
  },
  {
    id:5, name:"Sami Qasim", phone:"+962 77 567 8901", email:"sami.q@email.com",
    address:"Khalda, Amman", source:"Referral", style:"Modern", priority:"High",
    budget:31000, finalQuote:30500, deposit:15250, stageId:"aftersales",
    designer:"Sara Al-Khatib", notes:"Installation complete. Very satisfied.",
    measureDate:"2025-12-01", measureNotes:"6.0m x 4.5m large kitchen. Gas + electric.",
    designFile:"KIT-2026-018-3D.pdf", quoteNo:"Q-2026-018", contractNo:"C-2026-005",
    factoryOrderNo:"FAC-2026-022", factoryStatus:"Delivered",
    installDate:"2026-02-15", warrantyMonths:24,
    approvals:{ customer_design:"approved", management_design:"approved", customer_budget:"approved", management_budget:"approved", contract_signed:true, deposit_received:true },
    completedTasks:{ contact:4, measurement:4, design:4, cust_approval:4, mgmt_approval:4, budget:4, contract:4, factory:4, installation:4, aftersales:2 },
    createdAt:"2025-11-20", lastActivity:"2026-03-01",
    activityLog:[
      {id:1,date:"2026-03-01",text:"Satisfaction survey sent"},
      {id:2,date:"2026-02-15",text:"Installation completed & signed off"},
    ]
  },
  {
    id:6, name:"Faris Al-Omari", phone:"+962 79 789 0123", email:"faris@omari.jo",
    address:"Jubeiha, Amman", source:"Phone", style:"Rustic", priority:"Medium",
    budget:15000, finalQuote:null, deposit:null, stageId:"cust_approval",
    designer:"Leila Haddad", notes:"Farmhouse style. Wants solid wood.",
    measureDate:"2026-02-28", measureNotes:"4.8m x 3.2m. Existing island to keep.",
    designFile:"KIT-2026-052-DRAFT.pdf", quoteNo:null, contractNo:null,
    factoryOrderNo:null, factoryStatus:null, installDate:null, warrantyMonths:null,
    approvals:{ customer_design:null, management_design:"approved", customer_budget:null, management_budget:null, contract_signed:false, deposit_received:false },
    completedTasks:{ contact:4, measurement:4, design:4, cust_approval:1, mgmt_approval:0, budget:0, contract:0, factory:0, installation:0, aftersales:0 },
    createdAt:"2026-02-10", lastActivity:"2026-03-06",
    activityLog:[
      {id:1,date:"2026-03-06",text:"Design presented to customer"},
      {id:2,date:"2026-03-02",text:"3D design completed"},
    ]
  },
];

// ── STYLES ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d0c0a;--surface:#171510;--surface2:#1e1c17;--surface3:#252218;
  --border:#2a261e;--border2:#332f24;
  --gold:#c9a84c;--gold2:#a88535;--gold-glow:rgba(201,168,76,.13);--gold-dim:#6b5520;
  --cream:#ede8dc;--cream2:#b0a898;--cream3:#726b5e;
  --green:#4db87a;--red:#e05555;--blue:#5aaee0;--orange:#e0903a;--purple:#9b6ce0;--pink:#e05ca0;
  --font-d:'Cormorant Garamond',serif;--font-b:'Outfit',sans-serif;
  --r:10px;--tr:0.18s ease;
}
body{background:var(--bg);color:var(--cream);font-family:var(--font-b);font-size:13px;line-height:1.5}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
.app{display:flex;height:100vh;overflow:hidden}

/* ── Sidebar ── */
.sb{width:230px;min-width:230px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto}
.sb-logo{padding:22px 18px 18px;border-bottom:1px solid var(--border)}
.sb-logo-main{font-family:var(--font-d);font-size:20px;color:var(--gold);letter-spacing:.04em;display:flex;align-items:center;gap:8px}
.sb-logo-sub{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:var(--cream3);margin-top:3px;font-family:var(--font-b)}
.sb-section{padding:14px 10px 0}
.sb-sec-label{font-size:9px;text-transform:uppercase;letter-spacing:.16em;color:var(--gold-dim);padding:0 8px;margin-bottom:6px}
.sb-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;cursor:pointer;color:var(--cream2);font-size:12.5px;font-weight:400;transition:var(--tr);position:relative;user-select:none}
.sb-item:hover{background:var(--surface2);color:var(--cream)}
.sb-item.on{background:var(--gold-glow);color:var(--gold)}
.sb-item .ico{width:18px;text-align:center;font-size:14px}
.sb-badge{margin-left:auto;background:var(--gold);color:#000;font-size:10px;font-weight:700;border-radius:20px;padding:1px 7px}
.sb-badge.red{background:var(--red);color:#fff}
.sb-bottom{margin-top:auto;padding:12px 10px;border-top:1px solid var(--border)}

/* ── Main ── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{background:var(--surface);border-bottom:1px solid var(--border);height:54px;padding:0 22px;display:flex;align-items:center;gap:12px;flex-shrink:0}
.topbar-title{font-family:var(--font-d);font-size:21px;color:var(--cream);flex:1}
.topbar-title small{font-family:var(--font-b);font-size:11px;color:var(--cream3);margin-left:8px;font-weight:300}
.content{flex:1;overflow-y:auto;padding:20px}

/* ── Buttons ── */
.btn{padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-family:var(--font-b);font-size:12.5px;font-weight:500;transition:var(--tr);display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.btn-gold{background:var(--gold);color:#000}
.btn-gold:hover{background:#d4b460}
.btn-ghost{background:var(--surface2);color:var(--cream2);border:1px solid var(--border)}
.btn-ghost:hover{color:var(--cream);border-color:var(--border2)}
.btn-green{background:rgba(77,184,122,.15);color:var(--green);border:1px solid rgba(77,184,122,.3)}
.btn-green:hover{background:rgba(77,184,122,.25)}
.btn-red{background:rgba(224,85,85,.13);color:var(--red);border:1px solid rgba(224,85,85,.25)}
.btn-red:hover{background:rgba(224,85,85,.22)}
.btn-blue{background:rgba(90,174,224,.13);color:var(--blue);border:1px solid rgba(90,174,224,.25)}
.btn-sm{padding:4px 10px;font-size:11.5px}
.btn-xs{padding:2px 8px;font-size:11px}

/* ── Cards ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:18px}
.card-title{font-family:var(--font-d);font-size:16px;color:var(--cream);margin-bottom:14px}

/* ── Stats ── */
.stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;position:relative;overflow:hidden}
.stat::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--c,var(--gold))}
.stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--cream3)}
.stat-val{font-family:var(--font-d);font-size:26px;color:var(--cream);margin:3px 0 1px}
.stat-sub{font-size:10.5px;color:var(--cream3)}
.stat-ico{position:absolute;right:12px;top:12px;font-size:20px;opacity:.18}

/* ── Table ── */
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{padding:9px 11px;text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--gold-dim);font-weight:500;border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:10px 11px;border-bottom:1px solid rgba(42,38,30,.5);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr.clickable:hover td{background:rgba(201,168,76,.03);cursor:pointer}
.td-name{font-weight:500;color:var(--cream);font-size:13px}
.td-sub{font-size:10.5px;color:var(--cream3);margin-top:1px}

/* ── Badges ── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500;white-space:nowrap}
.b-blue{background:rgba(90,174,224,.14);color:var(--blue)}
.b-gold{background:rgba(201,168,76,.14);color:var(--gold)}
.b-orange{background:rgba(224,144,58,.14);color:var(--orange)}
.b-green{background:rgba(77,184,122,.14);color:var(--green)}
.b-red{background:rgba(224,85,85,.14);color:var(--red)}
.b-purple{background:rgba(155,108,224,.14);color:var(--purple)}
.b-pink{background:rgba(224,92,160,.14);color:var(--pink)}
.b-grey{background:rgba(112,104,94,.14);color:var(--cream3)}

/* ── Stage progress bar ── */
.stage-track{display:flex;gap:0;margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid var(--border)}
.stage-step{flex:1;padding:8px 4px;text-align:center;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;cursor:pointer;transition:var(--tr);border-right:1px solid var(--border);position:relative}
.stage-step:last-child{border-right:none}
.stage-step.done{opacity:.9}
.stage-step.active{font-weight:700}
.stage-step:hover{filter:brightness(1.2)}
.stage-step-icon{font-size:14px;display:block;margin-bottom:2px}
.stage-step-short{font-size:8px;line-height:1.2;display:block}

/* ── Process detail ── */
.process-panel{display:grid;grid-template-columns:1fr 320px;gap:16px}
.stage-detail{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.stage-detail-header{padding:16px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px}
.stage-detail-body{padding:18px}
.checklist{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.check-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;transition:var(--tr)}
.check-item:hover{border-color:var(--border2)}
.check-item.checked{border-color:rgba(77,184,122,.3);background:rgba(77,184,122,.06)}
.check-box{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:var(--tr);font-size:10px}
.check-item.checked .check-box{background:var(--green);border-color:var(--green);color:#fff}
.check-label{font-size:12.5px;color:var(--cream2);flex:1}
.check-item.checked .check-label{color:var(--cream3);text-decoration:line-through}

/* ── Approval block ── */
.approval-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
.appr-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px}
.appr-card.approved{border-color:rgba(77,184,122,.35);background:rgba(77,184,122,.07)}
.appr-card.revision{border-color:rgba(224,85,85,.35);background:rgba(224,85,85,.07)}
.appr-label{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:var(--cream3);margin-bottom:5px}
.appr-status{font-size:12.5px;font-weight:600}
.appr-btns{display:flex;gap:5px;margin-top:6px}

/* ── Customer sidebar panel ── */
.cust-panel{display:flex;flex-direction:column;gap:12px}
.info-block{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px}
.info-block-title{font-size:9.5px;text-transform:uppercase;letter-spacing:.12em;color:var(--gold-dim);margin-bottom:10px}
.info-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(42,38,30,.4);font-size:12.5px}
.info-row:last-child{border-bottom:none}
.info-key{color:var(--cream3)}
.info-val{color:var(--cream);font-weight:500;text-align:right;max-width:160px;word-break:break-word}
.gold-val{color:var(--gold);font-weight:600}

/* ── Activity log ── */
.act-log{display:flex;flex-direction:column;gap:0}
.act-item{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid rgba(42,38,30,.4)}
.act-item:last-child{border-bottom:none}
.act-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:5px}
.act-text{font-size:12px;color:var(--cream2);flex:1;line-height:1.5}
.act-date{font-size:10.5px;color:var(--cream3);margin-top:2px}

/* ── Modal ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(4px);animation:fi .15s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.modal{background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:26px;width:560px;max-width:96vw;max-height:90vh;overflow-y:auto;animation:su .2s ease}
@keyframes su{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
.modal-title{font-family:var(--font-d);font-size:20px;color:var(--gold);margin-bottom:18px}
.modal-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fg-full{grid-column:1/-1}
.field{display:flex;flex-direction:column;gap:4px}
.field label{font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:var(--cream3)}
.field input,.field select,.field textarea{background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:8px 11px;color:var(--cream);font-family:var(--font-b);font-size:12.5px;outline:none;transition:var(--tr);width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--gold2);box-shadow:0 0 0 3px var(--gold-glow)}
.field textarea{resize:vertical;min-height:72px}
select option{background:var(--surface2)}

/* ── Search ── */
.search-input{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 12px;color:var(--cream);font-family:var(--font-b);font-size:12.5px;outline:none;width:200px;transition:var(--tr)}
.search-input:focus{border-color:var(--gold2);width:240px}
.filter-sel{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 10px;color:var(--cream);font-family:var(--font-b);font-size:12.5px;outline:none}

/* ── Pipeline kanban ── */
.kanban{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;overflow-x:auto;padding-bottom:4px}
.kanban-col{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);min-width:160px}
.kanban-head{padding:10px 11px;border-bottom:1px solid var(--border)}
.kanban-head-title{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.kanban-head-meta{font-size:10px;color:var(--cream3);margin-top:2px}
.kanban-cnt{font-size:10px;background:var(--surface2);border-radius:20px;padding:1px 7px;color:var(--cream3);display:inline-block}
.kanban-cards{padding:8px;display:flex;flex-direction:column;gap:7px;min-height:80px}
.k-card{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:9px;cursor:pointer;transition:var(--tr)}
.k-card:hover{border-color:var(--border2);transform:translateY(-1px)}
.k-name{font-size:12.5px;font-weight:500;color:var(--cream)}
.k-val{font-size:12px;color:var(--gold);margin-top:3px}
.k-meta{font-size:10.5px;color:var(--cream3);margin-top:3px}

/* ── Progress pill ── */
.prog-pill{height:4px;border-radius:4px;background:var(--border);overflow:hidden;margin-top:5px}
.prog-fill{height:100%;border-radius:4px;transition:width .4s ease}

/* ── Toast ── */
.toast{position:fixed;bottom:22px;right:22px;z-index:999;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--gold);border-radius:8px;padding:11px 16px;font-size:12.5px;color:var(--cream);box-shadow:0 6px 24px rgba(0,0,0,.5);animation:tr-in .25s ease}
@keyframes tr-in{from{transform:translateX(50px);opacity:0}to{transform:none;opacity:1}}

/* ── Avatar ── */
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0}

/* ── Tabs ── */
.tabs{display:flex;gap:2px;background:var(--surface2);border-radius:8px;padding:3px;margin-bottom:16px;width:fit-content}
.tab{padding:5px 13px;border-radius:6px;font-size:12.5px;cursor:pointer;color:var(--cream3);transition:var(--tr)}
.tab.on{background:var(--surface);color:var(--cream)}

/* ── Misc ── */
.empty{text-align:center;padding:36px 20px;color:var(--cream3);font-size:12.5px}
.empty .ei{font-size:28px;margin-bottom:8px}
.sep{height:1px;background:var(--border);margin:14px 0}
.two-col{display:grid;grid-template-columns:1fr 320px;gap:16px}
`;

// helpers
const AV_COLORS = ["#3d5c38","#3b506b","#5c3b3b","#5c4e3b","#3b5a5c","#523b5c"];
const initials = n => n.split(" ").slice(0,2).map(x=>x[0]).join("").toUpperCase();
const fmt = n => n ? `JD ${Number(n).toLocaleString()}` : "—";
const fmtD = d => { if(!d) return "—"; return new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); };
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const stageIdx = id => STAGE_IDS.indexOf(id);
const stageObj = id => STAGES.find(s=>s.id===id);
const completionPct = ct => { const vals = Object.values(ct); const total = vals.reduce((a,b)=>a+b,0); const max = STAGES.length*4; return Math.round((total/max)*100); };

const stageBadgeClass = id => {
  const map = { contact:"b-blue", measurement:"b-blue", design:"b-gold", cust_approval:"b-orange", mgmt_approval:"b-orange", budget:"b-purple", contract:"b-green", factory:"b-pink", installation:"b-green", aftersales:"b-gold" };
  return map[id]||"b-grey";
};

// ── REDUCER ───────────────────────────────────────────────────────────────
function reducer(state, a) {
  switch(a.type) {
    case "VIEW": return {...state, view:a.v, sel:null};
    case "SEL": return {...state, sel:a.id, view:"job"};
    case "MODAL": return {...state, modal:a.modal, editData:a.data||null};
    case "CLOSE_M": return {...state, modal:null, editData:null};
    case "SEARCH": return {...state, search:a.v};
    case "FILTER": return {...state, filter:a.v};
    case "TOAST": return {...state, toast:a.msg};
    case "CLEAR_TOAST": return {...state, toast:null};
    case "ADD_JOB": {
      const job = {...a.job, id:uid(), createdAt:new Date().toISOString().slice(0,10), lastActivity:new Date().toISOString().slice(0,10),
        stageId:"contact", approvals:mkApprovals(), activityLog:[{id:uid(),date:new Date().toISOString().slice(0,10),text:"Job created — "+a.job.source}],
        completedTasks:{contact:0,measurement:0,design:0,cust_approval:0,mgmt_approval:0,budget:0,contract:0,factory:0,installation:0,aftersales:0},
        finalQuote:null,deposit:null,quoteNo:null,contractNo:null,factoryOrderNo:null,factoryStatus:null,installDate:null,warrantyMonths:null,designFile:null};
      return {...state, jobs:[job,...state.jobs], modal:null, toast:"New job added ✦ "+job.name};
    }
    case "UPDATE_JOB": {
      const jobs = state.jobs.map(j=>j.id===a.job.id?{...j,...a.job}:j);
      return {...state, jobs, modal:null, toast:"Job updated"};
    }
    case "DEL_JOB": return {...state, jobs:state.jobs.filter(j=>j.id!==a.id), sel:null, view:"jobs", toast:"Job deleted"};
    case "ADVANCE_STAGE": {
      const job = state.jobs.find(j=>j.id===a.id);
      const idx = stageIdx(job.stageId);
      if(idx >= STAGE_IDS.length-1) return state;
      const nextStage = STAGE_IDS[idx+1];
      const log = {id:uid(),date:new Date().toISOString().slice(0,10),text:`Advanced to stage: ${stageObj(nextStage).label}`};
      const jobs = state.jobs.map(j=>j.id===a.id?{...j,stageId:nextStage,lastActivity:log.date,activityLog:[log,...(j.activityLog||[])]}:j);
      return {...state,jobs,toast:`→ ${stageObj(nextStage).label}`};
    }
    case "SET_STAGE": {
      const job = state.jobs.find(j=>j.id===a.id);
      if(job.stageId===a.stage) return state;
      const log = {id:uid(),date:new Date().toISOString().slice(0,10),text:`Stage changed to: ${stageObj(a.stage).label}`};
      const jobs = state.jobs.map(j=>j.id===a.id?{...j,stageId:a.stage,lastActivity:log.date,activityLog:[log,...(j.activityLog||[])]}:j);
      return {...state,jobs,toast:`Stage → ${stageObj(a.stage).label}`};
    }
    case "TOGGLE_TASK": {
      const job = state.jobs.find(j=>j.id===a.id);
      const stage = a.stage;
      const maxTasks = stageObj(stage).tasks.length;
      const cur = job.completedTasks[stage]||0;
      const next = a.taskIdx < cur ? cur-1 : Math.min(cur+1, maxTasks);
      const jobs = state.jobs.map(j=>j.id===a.id?{...j,completedTasks:{...j.completedTasks,[stage]:next}}:j);
      return {...state,jobs};
    }
    case "SET_APPROVAL": {
      const jobs = state.jobs.map(j=>j.id===a.id?{...j,approvals:{...j.approvals,[a.key]:a.val},lastActivity:new Date().toISOString().slice(0,10)}:j);
      const logText = a.key.replace("_"," ")+" → "+a.val;
      const log = {id:uid(),date:new Date().toISOString().slice(0,10),text:logText};
      const jobs2 = jobs.map(j=>j.id===a.id?{...j,activityLog:[log,...(j.activityLog||[])]}:j);
      return {...state,jobs:jobs2,toast:"Approval updated"};
    }
    case "ADD_LOG": {
      const log = {id:uid(),date:new Date().toISOString().slice(0,10),text:a.text};
      const jobs = state.jobs.map(j=>j.id===a.id?{...j,activityLog:[log,...(j.activityLog||[])],lastActivity:log.date}:j);
      return {...state,jobs,modal:null,toast:"Note added"};
    }
    case "UPDATE_FIELD": {
      const jobs = state.jobs.map(j=>j.id===a.id?{...j,[a.field]:a.val}:j);
      return {...state,jobs,toast:"Saved"};
    }
    default: return state;
  }
}

// ── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, { jobs:SEED, view:"dashboard", sel:null, modal:null, editData:null, search:"", filter:"all", toast:null });
  const { jobs, view, sel, modal, editData, search, filter, toast } = state;
  const d = useCallback((a)=>dispatch(a),[]);

  useEffect(()=>{ if(toast){const t=setTimeout(()=>d({type:"CLEAR_TOAST"}),3000);return()=>clearTimeout(t);}},[toast]);

  const selJob = jobs.find(j=>j.id===sel);
  const filtered = jobs.filter(j=>{
    const q=search.toLowerCase();
    const mq=!q||j.name.toLowerCase().includes(q)||j.phone.includes(q)||(j.email||"").toLowerCase().includes(q);
    const mf=filter==="all"||j.stageId===filter;
    return mq&&mf;
  });

  const totalRev = jobs.filter(j=>["contract","factory","installation","aftersales"].includes(j.stageId)).reduce((s,j)=>s+(j.finalQuote||j.budget||0),0);
  const activeJobs = jobs.filter(j=>!["aftersales"].includes(j.stageId)).length;
  const pendingAppr = jobs.filter(j=>j.approvals&&(j.approvals.customer_design===null&&["cust_approval","mgmt_approval","budget","contract"].includes(j.stageId))).length;
  const factoryActive = jobs.filter(j=>j.stageId==="factory").length;

  const NAV = [
    {v:"dashboard",ico:"◈",lbl:"Dashboard"},
    {v:"jobs",ico:"⊕",lbl:"All Jobs",badge:jobs.filter(j=>j.stageId==="contact").length},
    {v:"pipeline",ico:"⋮⋮⋮",lbl:"Pipeline"},
    {v:"approvals",ico:"✦",lbl:"Approvals",badge:pendingAppr||null,badgeRed:true},
    {v:"factory",ico:"🏭",lbl:"Factory",badge:factoryActive||null},
    {v:"tasks",ico:"✓",lbl:"Tasks"},
    {v:"reports",ico:"▦",lbl:"Reports"},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Sidebar */}
        <nav className="sb">
          <div className="sb-logo">
            <div className="sb-logo-main">✦ Prestige Kitchens</div>
            <div className="sb-logo-sub">Showroom CRM Pro</div>
          </div>
          <div className="sb-section">
            <div className="sb-sec-label">Menu</div>
            {NAV.map(n=>(
              <div key={n.v} className={`sb-item ${view===n.v||((view==="job")&&n.v==="jobs")?"on":""}`} onClick={()=>d({type:"VIEW",v:n.v})}>
                <span className="ico">{n.ico}</span>{n.lbl}
                {n.badge?<span className={`sb-badge${n.badgeRed?" red":""}`}>{n.badge}</span>:null}
              </div>
            ))}
          </div>
          <div className="sb-section">
            <div className="sb-sec-label">Catalogue</div>
            <div className={`sb-item ${view==="products"?"on":""}`} onClick={()=>d({type:"VIEW",v:"products"})}>
              <span className="ico">◻</span>Products
            </div>
          </div>
          <div className="sb-bottom">
            <div className="sb-item"><span className="ico">⚙</span>Settings</div>
          </div>
        </nav>

        {/* Main area */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">
              { {dashboard:"Dashboard",jobs:"All Jobs",job:selJob?.name||"Job Detail",pipeline:"Sales Pipeline",approvals:"Pending Approvals",factory:"Factory & Production",tasks:"Tasks",reports:"Reports",products:"Products"}[view] }
              <small>{ {dashboard:"Overview & KPIs",jobs:"Kitchen projects",job:"Full project detail",pipeline:"Visual stage view",approvals:"Awaiting sign-off",factory:"Production tracker",tasks:"Follow-ups",reports:"Analytics",products:"Catalogue"}[view] }</small>
            </div>
            {view==="jobs"&&<>
              <input className="search-input" placeholder="🔍 Search…" value={search} onChange={e=>d({type:"SEARCH",v:e.target.value})} />
              <select className="filter-sel" value={filter} onChange={e=>d({type:"FILTER",v:e.target.value})}>
                <option value="all">All Stages</option>
                {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </>}
            {(view==="jobs"||view==="dashboard")&&<button className="btn btn-gold" onClick={()=>d({type:"MODAL",modal:"add"})}>＋ New Job</button>}
            {view==="job"&&selJob&&<>
              <button className="btn btn-ghost btn-sm" onClick={()=>d({type:"MODAL",modal:"edit",data:selJob})}>Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>d({type:"MODAL",modal:"note",data:{id:selJob.id}})}>＋ Note</button>
              {stageIdx(selJob.stageId)<STAGE_IDS.length-1&&<button className="btn btn-gold btn-sm" onClick={()=>d({type:"ADVANCE_STAGE",id:selJob.id})}>Advance Stage →</button>}
            </>}
          </div>

          <div className="content">
            {view==="dashboard"&&<Dashboard jobs={jobs} totalRev={totalRev} activeJobs={activeJobs} pendingAppr={pendingAppr} factoryActive={factoryActive} dispatch={d} />}
            {view==="jobs"&&<JobsTable jobs={filtered} dispatch={d} />}
            {view==="job"&&selJob&&<JobDetail job={selJob} dispatch={d} />}
            {view==="pipeline"&&<Pipeline jobs={jobs} dispatch={d} />}
            {view==="approvals"&&<Approvals jobs={jobs} dispatch={d} />}
            {view==="factory"&&<Factory jobs={jobs} dispatch={d} />}
            {view==="tasks"&&<Tasks jobs={jobs} dispatch={d} />}
            {view==="reports"&&<Reports jobs={jobs} totalRev={totalRev} />}
            {view==="products"&&<Products />}
          </div>
        </div>

        {/* Modals */}
        {modal==="add"&&<JobModal onClose={()=>d({type:"CLOSE_M"})} onSave={job=>d({type:"ADD_JOB",job})} />}
        {modal==="edit"&&editData&&<JobModal job={editData} onClose={()=>d({type:"CLOSE_M"})} onSave={job=>d({type:"UPDATE_JOB",job})} />}
        {modal==="note"&&editData&&<NoteModal id={editData.id} onClose={()=>d({type:"CLOSE_M"})} onSave={(id,text)=>d({type:"ADD_LOG",id,text})} />}

        {toast&&<div className="toast">✦ {toast}</div>}
      </div>
    </>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard({jobs,totalRev,activeJobs,pendingAppr,factoryActive,dispatch}) {
  const d = dispatch;
  const byStage = STAGES.map(s=>({...s,count:jobs.filter(j=>j.stageId===s.id).length,val:jobs.filter(j=>j.stageId===s.id).reduce((x,j)=>x+(j.budget||0),0)}));
  const recentJobs = [...jobs].sort((a,b)=>new Date(b.lastActivity)-new Date(a.lastActivity)).slice(0,6);

  return (<>
    <div className="stats-row">
      {[
        {lbl:"Active Jobs",val:activeJobs,sub:"In pipeline",ico:"📋",c:"var(--blue)"},
        {lbl:"Revenue (Contracted)",val:fmt(totalRev),sub:"Signed contracts",ico:"💰",c:"var(--gold)"},
        {lbl:"Pending Approvals",val:pendingAppr,sub:"Need sign-off",ico:"⏳",c:"var(--red)"},
        {lbl:"In Factory",val:factoryActive,sub:"Being produced",ico:"🏭",c:"var(--pink)"},
        {lbl:"Completed",val:jobs.filter(j=>j.stageId==="aftersales").length,sub:"After-sales stage",ico:"⭐",c:"var(--green)"},
      ].map(s=>(
        <div key={s.lbl} className="stat" style={{"--c":s.c}}>
          <div className="stat-ico">{s.ico}</div>
          <div className="stat-lbl">{s.lbl}</div>
          <div className="stat-val">{s.val}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>

    <div className="two-col">
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Stage flow */}
        <div className="card">
          <div className="card-title">Jobs by Stage</div>
          <div style={{overflowX:"auto"}}>
            <div style={{display:"flex",gap:8,minWidth:700,paddingBottom:4}}>
              {byStage.map(s=>(
                <div key={s.id} style={{flex:1,background:"var(--surface2)",border:"1px solid var(--border)",borderTop:`3px solid ${s.color}`,borderRadius:8,padding:"10px 8px",textAlign:"center",cursor:"pointer",minWidth:0}} onClick={()=>dispatch({type:"VIEW",v:"pipeline"})}>
                  <div style={{fontSize:16}}>{s.icon}</div>
                  <div style={{fontSize:10,fontWeight:600,color:s.color,textTransform:"uppercase",letterSpacing:".06em",margin:"3px 0"}}>{s.short}</div>
                  <div style={{fontSize:20,fontFamily:"var(--font-d)",color:"var(--cream)"}}>{s.count}</div>
                  <div style={{fontSize:10,color:"var(--cream3)",marginTop:2}}>{s.count>0?fmt(s.val):"—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent jobs table */}
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div className="card-title" style={{margin:0}}>Recent Activity</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"VIEW",v:"jobs"})}>View All</button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Stage</th><th>Progress</th><th>Budget</th><th>Last Activity</th></tr></thead>
              <tbody>
                {recentJobs.map(j=>{
                  const pct=completionPct(j.completedTasks);
                  const sg=stageObj(j.stageId);
                  return (<tr key={j.id} className="clickable" onClick={()=>dispatch({type:"SEL",id:j.id})}>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div className="av" style={{width:30,height:30,background:AV_COLORS[j.id%6<6?j.id%6:0],fontSize:10}}>{initials(j.name)}</div>
                      <div><div className="td-name">{j.name}</div><div className="td-sub">{j.source}</div></div>
                    </div></td>
                    <td><span className={`badge ${stageBadgeClass(j.stageId)}`}>{sg?.icon} {sg?.label}</span></td>
                    <td style={{minWidth:100}}>
                      <div style={{fontSize:10,color:"var(--cream3)",marginBottom:3}}>{pct}%</div>
                      <div className="prog-pill"><div className="prog-fill" style={{width:pct+"%",background:"var(--gold)"}} /></div>
                    </td>
                    <td style={{color:"var(--gold)",fontWeight:500}}>{fmt(j.budget)}</td>
                    <td style={{fontSize:11,color:"var(--cream3)"}}>{fmtD(j.lastActivity)}</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Approval alerts */}
        {jobs.filter(j=>j.approvals?.customer_design===null&&["cust_approval"].includes(j.stageId)).length>0&&(
          <div className="card" style={{borderColor:"rgba(224,144,58,.35)"}}>
            <div className="card-title" style={{color:"var(--orange)"}}>⏳ Awaiting Customer Approval</div>
            {jobs.filter(j=>j.approvals?.customer_design===null&&j.stageId==="cust_approval").map(j=>(
              <div key={j.id} style={{padding:"8px 0",borderBottom:"1px solid rgba(42,38,30,.4)",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>dispatch({type:"SEL",id:j.id})}>
                <div className="av" style={{width:26,height:26,background:AV_COLORS[j.id%6<6?j.id%6:0],fontSize:9}}>{initials(j.name)}</div>
                <div style={{flex:1}}><div style={{fontSize:12.5,color:"var(--cream)"}}>{j.name}</div><div style={{fontSize:10.5,color:"var(--cream3)"}}>Design approval needed</div></div>
                <span className="badge b-orange" style={{fontSize:10}}>Pending</span>
              </div>
            ))}
          </div>
        )}

        {/* Factory active */}
        {jobs.filter(j=>j.stageId==="factory").length>0&&(
          <div className="card" style={{borderColor:"rgba(224,92,160,.25)"}}>
            <div className="card-title" style={{color:"var(--pink)"}}>🏭 In Production</div>
            {jobs.filter(j=>j.stageId==="factory").map(j=>(
              <div key={j.id} style={{padding:"8px 0",borderBottom:"1px solid rgba(42,38,30,.4)",cursor:"pointer"}} onClick={()=>dispatch({type:"SEL",id:j.id})}>
                <div style={{fontSize:12.5,fontWeight:500,color:"var(--cream)"}}>{j.name}</div>
                <div style={{fontSize:11,color:"var(--pink)",marginTop:2}}>{j.factoryStatus||"Awaiting confirmation"}</div>
                {j.factoryOrderNo&&<div style={{fontSize:10.5,color:"var(--cream3)"}}>{j.factoryOrderNo}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Quick stats */}
        <div className="card">
          <div className="card-title">Pipeline Health</div>
          {STAGES.slice(0,5).map(s=>{
            const cnt=jobs.filter(j=>j.stageId===s.id).length;
            const max=Math.max(...STAGES.map(st=>jobs.filter(j=>j.stageId===st.id).length),1);
            return (<div key={s.id} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:3}}>
                <span style={{color:"var(--cream3)"}}>{s.icon} {s.label}</span>
                <span style={{color:"var(--cream)"}}>{cnt}</span>
              </div>
              <div className="prog-pill" style={{height:5}}>
                <div className="prog-fill" style={{width:`${(cnt/max)*100}%`,background:s.color}} />
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>
  </>);
}

// ── JOBS TABLE ────────────────────────────────────────────────────────────
function JobsTable({jobs,dispatch}) {
  return (
    <div className="card" style={{padding:0,overflow:"hidden"}}>
      <div className="tbl-wrap">
        <table>
          <thead><tr>
            <th>Customer</th><th>Stage</th><th>Designer</th><th>Style</th>
            <th>Budget</th><th>Progress</th><th>Last Activity</th><th>Action</th>
          </tr></thead>
          <tbody>
            {jobs.length===0&&<tr><td colSpan={8}><div className="empty"><div className="ei">🔍</div>No jobs found</div></td></tr>}
            {jobs.map(j=>{
              const sg=stageObj(j.stageId);
              const pct=completionPct(j.completedTasks);
              return (<tr key={j.id} className="clickable" onClick={()=>dispatch({type:"SEL",id:j.id})}>
                <td><div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div className="av" style={{width:30,height:30,background:AV_COLORS[j.id%6<6?j.id%6:0],fontSize:10}}>{initials(j.name)}</div>
                  <div><div className="td-name">{j.name}</div><div className="td-sub">{j.phone}</div></div>
                </div></td>
                <td><span className={`badge ${stageBadgeClass(j.stageId)}`}>{sg?.icon} {sg?.label}</span></td>
                <td style={{fontSize:12,color:"var(--cream2)"}}>{j.designer}</td>
                <td style={{fontSize:12}}>{j.style}</td>
                <td style={{color:"var(--gold)",fontWeight:500}}>{fmt(j.budget)}</td>
                <td style={{minWidth:90}}>
                  <div style={{fontSize:10,color:"var(--cream3)",marginBottom:3}}>{pct}%</div>
                  <div className="prog-pill"><div className="prog-fill" style={{width:pct+"%",background:"var(--gold)"}} /></div>
                </td>
                <td style={{fontSize:11,color:"var(--cream3)"}}>{fmtD(j.lastActivity)}</td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{display:"flex",gap:4"}}>
                    <select className="btn btn-ghost btn-xs" style={{padding:"3px 6px"}} value={j.stageId}
                      onChange={e=>dispatch({type:"SET_STAGE",id:j.id,stage:e.target.value})}>
                      {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── JOB DETAIL ────────────────────────────────────────────────────────────
function JobDetail({job,dispatch}) {
  const d = dispatch;
  const sg = stageObj(job.stageId);
  const sidx = stageIdx(job.stageId);
  const [activeStage, setActiveStage] = useState(job.stageId);

  // keep active stage in sync when job changes
  useEffect(()=>setActiveStage(job.stageId),[job.stageId]);

  const asg = stageObj(activeStage);

  return (
    <div>
      {/* Stage track */}
      <div className="stage-track" style={{marginBottom:16}}>
        {STAGES.map((s,i)=>{
          const done = i < sidx;
          const active = s.id===job.stageId;
          const viewing = s.id===activeStage;
          return (
            <div key={s.id} className={`stage-step${done?" done":""}${active?" active":""}`}
              style={{background: done?"rgba(77,184,122,.12)": active?`${s.color}22`:"var(--surface2)",
                color: done?"var(--green)": active?s.color:"var(--cream3)",
                borderTopColor: viewing?"var(--gold)":done?"var(--green)":active?s.color:"var(--border)",
                borderTop: viewing?"2px solid var(--gold)":"none"
              }}
              onClick={()=>setActiveStage(s.id)}>
              <span className="stage-step-icon">{done?"✓":s.icon}</span>
              <span className="stage-step-short">{s.short}</span>
            </div>
          );
        })}
      </div>

      <div className="process-panel">
        {/* Left: stage detail */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Stage content */}
          <div className="stage-detail">
            <div className="stage-detail-header" style={{borderLeft:`3px solid ${asg?.color}`}}>
              <span style={{fontSize:22}}>{asg?.icon}</span>
              <div>
                <div style={{fontFamily:"var(--font-d)",fontSize:17,color:"var(--cream)"}}>{asg?.label}</div>
                <div style={{fontSize:11.5,color:"var(--cream3)",marginTop:2}}>{asg?.desc}</div>
              </div>
              {activeStage===job.stageId&&<span className="badge b-gold" style={{marginLeft:"auto"}}>Current</span>}
            </div>
            <div className="stage-detail-body">
              {/* Checklist */}
              <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:8}}>Tasks</div>
              <div className="checklist">
                {asg?.tasks.map((task,i)=>{
                  const done = i < (job.completedTasks[activeStage]||0);
                  return (
                    <div key={i} className={`check-item${done?" checked":""}`}
                      onClick={()=>d({type:"TOGGLE_TASK",id:job.id,stage:activeStage,taskIdx:i})}>
                      <div className="check-box">{done?"✓":""}</div>
                      <span className="check-label">{task}</span>
                    </div>
                  );
                })}
              </div>

              {/* Stage-specific fields */}
              {activeStage==="measurement"&&<MeasurementFields job={job} dispatch={d} />}
              {activeStage==="design"&&<DesignFields job={job} dispatch={d} />}
              {(activeStage==="cust_approval"||activeStage==="mgmt_approval")&&<ApprovalFields job={job} dispatch={d} stage={activeStage} />}
              {activeStage==="budget"&&<BudgetFields job={job} dispatch={d} />}
              {activeStage==="contract"&&<ContractFields job={job} dispatch={d} />}
              {activeStage==="factory"&&<FactoryFields job={job} dispatch={d} />}
              {activeStage==="installation"&&<InstallFields job={job} dispatch={d} />}
              {activeStage==="aftersales"&&<AfterSalesFields job={job} dispatch={d} />}

              {/* Advance stage button */}
              {activeStage===job.stageId&&stageIdx(job.stageId)<STAGE_IDS.length-1&&(
                <button className="btn btn-gold" style={{marginTop:14,width:"100%"}} onClick={()=>d({type:"ADVANCE_STAGE",id:job.id})}>
                  Advance to {stageObj(STAGE_IDS[sidx+1])?.label} →
                </button>
              )}
            </div>
          </div>

          {/* Activity log */}
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div className="card-title" style={{margin:0}}>Activity Log</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>d({type:"MODAL",modal:"note",data:{id:job.id}})}>＋ Note</button>
            </div>
            <div className="act-log">
              {(job.activityLog||[]).map(a=>(
                <div key={a.id} className="act-item">
                  <div className="act-dot" />
                  <div><div className="act-text">{a.text}</div><div className="act-date">{fmtD(a.date)}</div></div>
                </div>
              ))}
              {(!job.activityLog||job.activityLog.length===0)&&<div className="empty"><div className="ei">📋</div>No activity yet</div>}
            </div>
          </div>
        </div>

        {/* Right: customer info panel */}
        <div className="cust-panel">
          <div className="info-block">
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div className="av" style={{width:44,height:44,background:AV_COLORS[job.id%6<6?job.id%6:0],fontSize:15}}>{initials(job.name)}</div>
              <div>
                <div style={{fontFamily:"var(--font-d)",fontSize:17,color:"var(--cream)"}}>{job.name}</div>
                <span className={`badge ${stageBadgeClass(job.stageId)}`}>{sg?.icon} {sg?.label}</span>
              </div>
            </div>
            <div className="info-block-title">Contact</div>
            <div className="info-row"><span className="info-key">Phone</span><span className="info-val">{job.phone}</span></div>
            <div className="info-row"><span className="info-key">Email</span><span className="info-val" style={{fontSize:11.5}}>{job.email||"—"}</span></div>
            <div className="info-row"><span className="info-key">Address</span><span className="info-val">{job.address||"—"}</span></div>
          </div>

          <div className="info-block">
            <div className="info-block-title">Project</div>
            <div className="info-row"><span className="info-key">Style</span><span className="info-val">{job.style}</span></div>
            <div className="info-row"><span className="info-key">Source</span><span className="info-val">{job.source}</span></div>
            <div className="info-row"><span className="info-key">Designer</span><span className="info-val">{job.designer}</span></div>
            <div className="info-row"><span className="info-key">Priority</span><span className="info-val">{job.priority}</span></div>
            <div className="info-row"><span className="info-key">Budget</span><span className="info-val gold-val">{fmt(job.budget)}</span></div>
            {job.finalQuote&&<div className="info-row"><span className="info-key">Final Quote</span><span className="info-val gold-val">{fmt(job.finalQuote)}</span></div>}
            {job.deposit&&<div className="info-row"><span className="info-key">Deposit Paid</span><span className="info-val" style={{color:"var(--green)"}}>{fmt(job.deposit)}</span></div>}
            <div className="info-row"><span className="info-key">Created</span><span className="info-val">{fmtD(job.createdAt)}</span></div>
          </div>

          {(job.quoteNo||job.contractNo||job.factoryOrderNo)&&(
            <div className="info-block">
              <div className="info-block-title">References</div>
              {job.quoteNo&&<div className="info-row"><span className="info-key">Quote</span><span className="info-val" style={{color:"var(--gold)"}}>{job.quoteNo}</span></div>}
              {job.contractNo&&<div className="info-row"><span className="info-key">Contract</span><span className="info-val" style={{color:"var(--green)"}}>{job.contractNo}</span></div>}
              {job.factoryOrderNo&&<div className="info-row"><span className="info-key">Factory Order</span><span className="info-val" style={{color:"var(--pink)"}}>{job.factoryOrderNo}</span></div>}
            </div>
          )}

          {job.notes&&(
            <div className="info-block">
              <div className="info-block-title">Notes</div>
              <div style={{fontSize:12.5,color:"var(--cream3)",lineHeight:1.6}}>{job.notes}</div>
            </div>
          )}

          {/* Approval summary */}
          <div className="info-block">
            <div className="info-block-title">Approvals</div>
            {[
              {key:"customer_design",label:"Customer — Design"},
              {key:"management_design",label:"Management — Design"},
              {key:"customer_budget",label:"Customer — Budget"},
              {key:"management_budget",label:"Management — Budget"},
            ].map(a=>{
              const val = job.approvals?.[a.key];
              return (
                <div key={a.key} className="info-row">
                  <span className="info-key" style={{fontSize:11.5}}>{a.label}</span>
                  <span className={`badge ${val==="approved"?"b-green":val==="revision"?"b-red":"b-grey"}`} style={{fontSize:10}}>
                    {val==="approved"?"✓ Approved":val==="revision"?"⟳ Revision":"Pending"}
                  </span>
                </div>
              );
            })}
            <div className="info-row">
              <span className="info-key" style={{fontSize:11.5}}>Contract Signed</span>
              <span className={`badge ${job.approvals?.contract_signed?"b-green":"b-grey"}`} style={{fontSize:10}}>{job.approvals?.contract_signed?"✓ Signed":"Unsigned"}</span>
            </div>
            <div className="info-row">
              <span className="info-key" style={{fontSize:11.5}}>Deposit Received</span>
              <span className={`badge ${job.approvals?.deposit_received?"b-green":"b-grey"}`} style={{fontSize:10}}>{job.approvals?.deposit_received?"✓ Received":"Pending"}</span>
            </div>
          </div>

          <button className="btn btn-red btn-sm" style={{width:"100%"}} onClick={()=>{ if(window.confirm("Delete this job?")) dispatch({type:"DEL_JOB",id:job.id}); }}>Delete Job</button>
        </div>
      </div>
    </div>
  );
}

// Stage-specific fields
function InlineField({label,value,field,id,dispatch,type="text",placeholder=""}) {
  const [val,setVal] = useState(value||"");
  return (
    <div className="field" style={{marginBottom:10}}>
      <label>{label}</label>
      <div style={{display:"flex",gap:6}}>
        <input type={type} value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder} style={{flex:1}} />
        <button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id,field,val})}>Save</button>
      </div>
    </div>
  );
}

function MeasurementFields({job,dispatch}) {
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>Measurement Details</div>
      <InlineField label="Measurement Date" value={job.measureDate} field="measureDate" id={job.id} dispatch={dispatch} type="date" />
      <InlineField label="Room Dimensions / Notes" value={job.measureNotes} field="measureNotes" id={job.id} dispatch={dispatch} placeholder="e.g. 4.2m x 3.8m, gas on north wall" />
    </div>
  );
}

function DesignFields({job,dispatch}) {
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>Design Files</div>
      <InlineField label="Design File Reference" value={job.designFile} field="designFile" id={job.id} dispatch={dispatch} placeholder="e.g. KIT-2026-041-3D.pdf" />
    </div>
  );
}

function ApprovalFields({job,dispatch,stage}) {
  const isCustomer = stage==="cust_approval";
  const approvalKey = isCustomer?"customer_design":"management_design";
  const val = job.approvals?.[approvalKey];
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>
        {isCustomer?"Customer Design Approval":"Management Design Approval"}
      </div>
      <div className={`appr-card${val==="approved"?" approved":val==="revision"?" revision":""}`} style={{marginBottom:8}}>
        <div className="appr-label">{isCustomer?"Customer":"Management"} Decision</div>
        <div className="appr-status" style={{color:val==="approved"?"var(--green)":val==="revision"?"var(--red)":"var(--cream3)"}}>
          {val==="approved"?"✓ Approved":val==="revision"?"⟳ Revision Requested":"Awaiting Decision"}
        </div>
        <div className="appr-btns">
          <button className="btn btn-green btn-xs" onClick={()=>dispatch({type:"SET_APPROVAL",id:job.id,key:approvalKey,val:"approved"})}>✓ Approve</button>
          <button className="btn btn-red btn-xs" onClick={()=>dispatch({type:"SET_APPROVAL",id:job.id,key:approvalKey,val:"revision"})}>⟳ Request Revision</button>
        </div>
      </div>
    </div>
  );
}

function BudgetFields({job,dispatch}) {
  const [q,setQ]=useState(job.finalQuote||"");
  const [qn,setQn]=useState(job.quoteNo||"");
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>Quotation</div>
      <div className="field" style={{marginBottom:10}}><label>Quote Number</label>
        <div style={{display:"flex",gap:6}}><input value={qn} onChange={e=>setQn(e.target.value)} placeholder="Q-2026-XXX" /><button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"quoteNo",val:qn})}>Save</button></div>
      </div>
      <div className="field" style={{marginBottom:10}}><label>Final Quote Amount (JD)</label>
        <div style={{display:"flex",gap:6}}><input type="number" value={q} onChange={e=>setQ(e.target.value)} placeholder="15000" /><button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"finalQuote",val:Number(q)})}>Save</button></div>
      </div>
      {/* Customer budget approval */}
      <div style={{marginTop:8}}>
        <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:8}}>Customer Budget Approval</div>
        <div className={`appr-card${job.approvals?.customer_budget==="approved"?" approved":job.approvals?.customer_budget==="revision"?" revision":""}`}>
          <div className="appr-label">Customer Decision on Quote</div>
          <div className="appr-status" style={{color:job.approvals?.customer_budget==="approved"?"var(--green)":job.approvals?.customer_budget==="revision"?"var(--red)":"var(--cream3)"}}>
            {job.approvals?.customer_budget==="approved"?"✓ Accepted":job.approvals?.customer_budget==="revision"?"⟳ Negotiating":"Pending"}
          </div>
          <div className="appr-btns">
            <button className="btn btn-green btn-xs" onClick={()=>dispatch({type:"SET_APPROVAL",id:job.id,key:"customer_budget",val:"approved"})}>✓ Accepted</button>
            <button className="btn btn-red btn-xs" onClick={()=>dispatch({type:"SET_APPROVAL",id:job.id,key:"customer_budget",val:"revision"})}>⟳ Negotiating</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractFields({job,dispatch}) {
  const [cn,setCn]=useState(job.contractNo||"");
  const [dep,setDep]=useState(job.deposit||"");
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>Contract & Deposit</div>
      <div className="field" style={{marginBottom:10}}><label>Contract Number</label>
        <div style={{display:"flex",gap:6}}><input value={cn} onChange={e=>setCn(e.target.value)} placeholder="C-2026-XXX" /><button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"contractNo",val:cn})}>Save</button></div>
      </div>
      <div className="field" style={{marginBottom:10}}><label>Deposit Amount (JD)</label>
        <div style={{display:"flex",gap:6}}><input type="number" value={dep} onChange={e=>setDep(e.target.value)} /><button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"deposit",val:Number(dep)})}>Save</button></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button className={`btn btn-sm ${job.approvals?.contract_signed?"btn-green":"btn-ghost"}`}
          onClick={()=>dispatch({type:"SET_APPROVAL",id:job.id,key:"contract_signed",val:!job.approvals?.contract_signed})}>
          {job.approvals?.contract_signed?"✓ Contract Signed":"Mark Contract Signed"}
        </button>
        <button className={`btn btn-sm ${job.approvals?.deposit_received?"btn-green":"btn-ghost"}`}
          onClick={()=>dispatch({type:"SET_APPROVAL",id:job.id,key:"deposit_received",val:!job.approvals?.deposit_received})}>
          {job.approvals?.deposit_received?"✓ Deposit Received":"Mark Deposit Received"}
        </button>
      </div>
    </div>
  );
}

function FactoryFields({job,dispatch}) {
  const [fo,setFo]=useState(job.factoryOrderNo||"");
  const [fs,setFs]=useState(job.factoryStatus||"");
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>Production Details</div>
      <div className="field" style={{marginBottom:10}}><label>Factory Order Number</label>
        <div style={{display:"flex",gap:6}}><input value={fo} onChange={e=>setFo(e.target.value)} placeholder="FAC-2026-XXX" /><button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"factoryOrderNo",val:fo})}>Save</button></div>
      </div>
      <div className="field" style={{marginBottom:10}}><label>Production Status</label>
        <div style={{display:"flex",gap:6}}>
          <select value={fs} onChange={e=>setFs(e.target.value)}>
            {["Order Sent","Confirmed","In Production","QC Check","Ready for Delivery","Delivered"].map(s=><option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"factoryStatus",val:fs})}>Save</button>
        </div>
      </div>
      {job.factoryStatus&&<div className={`badge ${job.factoryStatus==="Delivered"?"b-green":job.factoryStatus==="In Production"?"b-pink":"b-gold"}`} style={{marginTop:4}}>{job.factoryStatus}</div>}
    </div>
  );
}

function InstallFields({job,dispatch}) {
  const [id_,setId]=useState(job.installDate||"");
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>Installation</div>
      <div className="field" style={{marginBottom:10}}><label>Installation Date</label>
        <div style={{display:"flex",gap:6}}><input type="date" value={id_} onChange={e=>setId(e.target.value)} /><button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"installDate",val:id_})}>Save</button></div>
      </div>
      {job.installDate&&<div style={{fontSize:12,color:"var(--cream3)",marginTop:4}}>Scheduled: <span style={{color:"var(--cream)"}}>{fmtD(job.installDate)}</span></div>}
    </div>
  );
}

function AfterSalesFields({job,dispatch}) {
  const [wm,setWm]=useState(job.warrantyMonths||24);
  return (
    <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:".1em",color:"var(--cream3)",marginBottom:10}}>After-Sales</div>
      <div className="field" style={{marginBottom:10}}><label>Warranty (Months)</label>
        <div style={{display:"flex",gap:6}}>
          <select value={wm} onChange={e=>setWm(Number(e.target.value))}>
            {[12,18,24,36,48,60].map(m=><option key={m}>{m}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"UPDATE_FIELD",id:job.id,field:"warrantyMonths",val:wm})}>Save</button>
        </div>
      </div>
      {job.warrantyMonths&&<div style={{fontSize:12,color:"var(--cream3)"}}>Warranty: <span style={{color:"var(--green)"}}>{job.warrantyMonths} months</span></div>}
    </div>
  );
}

// ── PIPELINE ──────────────────────────────────────────────────────────────
function Pipeline({jobs,dispatch}) {
  return (
    <div style={{overflowX:"auto",paddingBottom:8}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(10,minmax(160px,1fr))",gap:10,minWidth:1600}}>
        {STAGES.map(s=>{
          const sJobs = jobs.filter(j=>j.stageId===s.id);
          const val = sJobs.reduce((x,j)=>x+(j.budget||0),0);
          return (
            <div key={s.id} className="kanban-col">
              <div className="kanban-head" style={{borderTop:`2px solid ${s.color}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div className="kanban-head-title" style={{color:s.color}}>{s.icon} {s.short}</div>
                  <span className="kanban-cnt">{sJobs.length}</span>
                </div>
                <div className="kanban-head-meta">{sJobs.length>0?fmt(val):"Empty"}</div>
              </div>
              <div className="kanban-cards">
                {sJobs.map(j=>(
                  <div key={j.id} className="k-card" onClick={()=>dispatch({type:"SEL",id:j.id})}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <div className="av" style={{width:20,height:20,background:AV_COLORS[j.id%6<6?j.id%6:0],fontSize:8}}>{initials(j.name)}</div>
                      <div className="k-name">{j.name}</div>
                    </div>
                    <div className="k-val">{fmt(j.budget)}</div>
                    <div className="k-meta">{j.style} · {j.designer?.split(" ")[0]}</div>
                    <div className="prog-pill" style={{marginTop:6}}>
                      <div className="prog-fill" style={{width:completionPct(j.completedTasks)+"%",background:s.color}} />
                    </div>
                  </div>
                ))}
                {sJobs.length===0&&<div style={{fontSize:11,color:"var(--cream3)",textAlign:"center",padding:"10px 0"}}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── APPROVALS ─────────────────────────────────────────────────────────────
function Approvals({jobs,dispatch}) {
  const pending = jobs.filter(j=>{
    const a=j.approvals;
    return a&&(a.customer_design===null||a.management_design===null||a.customer_budget===null||a.management_budget===null||!a.contract_signed);
  });
  if(!pending.length) return <div className="empty" style={{marginTop:40}}><div className="ei">✅</div>All approvals are up to date</div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {pending.map(j=>(
        <div key={j.id} className="card">
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div className="av" style={{width:36,height:36,background:AV_COLORS[j.id%6<6?j.id%6:0],fontSize:12}}>{initials(j.name)}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--font-d)",fontSize:16,color:"var(--cream)"}}>{j.name}</div>
              <span className={`badge ${stageBadgeClass(j.stageId)}`}>{stageObj(j.stageId)?.icon} {stageObj(j.stageId)?.label}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>dispatch({type:"SEL",id:j.id})}>Open Job →</button>
          </div>
          <div className="approval-grid">
            {[
              {key:"customer_design",label:"Customer — Design"},
              {key:"management_design",label:"Management — Design"},
              {key:"customer_budget",label:"Customer — Budget"},
              {key:"management_budget",label:"Management — Budget"},
            ].map(a=>{
              const val=j.approvals?.[a.key];
              return (
                <div key={a.key} className={`appr-card${val==="approved"?" approved":val==="revision"?" revision":""}`}>
                  <div className="appr-label">{a.label}</div>
                  <div className="appr-status" style={{color:val==="approved"?"var(--green)":val==="revision"?"var(--red)":"var(--cream3)",fontSize:12}}>
                    {val==="approved"?"✓ Approved":val==="revision"?"⟳ Revision":"Pending"}
                  </div>
                  <div className="appr-btns">
                    <button className="btn btn-green btn-xs" onClick={()=>dispatch({type:"SET_APPROVAL",id:j.id,key:a.key,val:"approved"})}>✓</button>
                    <button className="btn btn-red btn-xs" onClick={()=>dispatch({type:"SET_APPROVAL",id:j.id,key:a.key,val:"revision"})}>⟳</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FACTORY ───────────────────────────────────────────────────────────────
function Factory({jobs,dispatch}) {
  const fJobs = jobs.filter(j=>j.stageId==="factory"||j.stageId==="installation"||(j.factoryOrderNo&&j.stageId!=="contact"&&j.stageId!=="measurement"&&j.stageId!=="design"));
  const STATUS_COLORS = {"Order Sent":"var(--blue)","Confirmed":"var(--gold)","In Production":"var(--pink)","QC Check":"var(--orange)","Ready for Delivery":"var(--purple)","Delivered":"var(--green)"};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)"}}>
          <div className="card-title" style={{margin:0}}>Production Tracker</div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Factory Order</th><th>Status</th><th>Quote</th><th>Install Date</th><th>Designer</th></tr></thead>
            <tbody>
              {fJobs.length===0&&<tr><td colSpan={6}><div className="empty"><div className="ei">🏭</div>No factory orders yet</div></td></tr>}
              {fJobs.map(j=>(
                <tr key={j.id} className="clickable" onClick={()=>dispatch({type:"SEL",id:j.id})}>
                  <td><div className="td-name">{j.name}</div><div className="td-sub">{j.style}</div></td>
                  <td style={{color:"var(--pink)",fontWeight:500}}>{j.factoryOrderNo||"—"}</td>
                  <td>{j.factoryStatus?<span className="badge" style={{background:`${STATUS_COLORS[j.factoryStatus]||"var(--cream3)"}22`,color:STATUS_COLORS[j.factoryStatus]||"var(--cream3)"}}>{j.factoryStatus}</span>:<span className="badge b-grey">Not sent</span>}</td>
                  <td style={{color:"var(--gold)"}}>{fmt(j.finalQuote||j.budget)}</td>
                  <td style={{fontSize:12,color:"var(--cream3)"}}>{fmtD(j.installDate)}</td>
                  <td style={{fontSize:12,color:"var(--cream2)"}}>{j.designer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── TASKS ─────────────────────────────────────────────────────────────────
function Tasks({jobs,dispatch}) {
  const today = new Date().toISOString().slice(0,10);
  const actionable = jobs.filter(j=>!["aftersales"].includes(j.stageId));
  // Group by stage
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {STAGES.filter(s=>s.id!=="aftersales").map(s=>{
        const sJobs = actionable.filter(j=>j.stageId===s.id);
        if(!sJobs.length) return null;
        return (
          <div key={s.id} className="card">
            <div className="card-title" style={{color:s.color,marginBottom:12}}>{s.icon} {s.label} <span style={{fontSize:12,color:"var(--cream3)",fontFamily:"var(--font-b)",fontWeight:400}}>({sJobs.length} job{sJobs.length>1?"s":""})</span></div>
            {sJobs.map(j=>(
              <div key={j.id} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",marginBottom:8,cursor:"pointer"}} onClick={()=>dispatch({type:"SEL",id:j.id})}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div className="av" style={{width:26,height:26,background:AV_COLORS[j.id%6<6?j.id%6:0],fontSize:9}}>{initials(j.name)}</div>
                  <div style={{flex:1}}><span style={{fontWeight:500,color:"var(--cream)"}}>{j.name}</span><span style={{fontSize:11,color:"var(--cream3)",marginLeft:8}}>{j.designer}</span></div>
                  <span style={{fontSize:12,color:"var(--gold)"}}>{fmt(j.budget)}</span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {s.tasks.map((task,i)=>{
                    const done = i<(j.completedTasks[s.id]||0);
                    return <span key={i} className={`badge ${done?"b-green":"b-grey"}`} style={{fontSize:10}}>{done?"✓ ":""}{task}</span>;
                  })}
                </div>
                <div className="prog-pill" style={{marginTop:8}}>
                  <div className="prog-fill" style={{width:`${((j.completedTasks[s.id]||0)/s.tasks.length)*100}%`,background:s.color}} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────
function Reports({jobs,totalRev}) {
  const contracted = jobs.filter(j=>["contract","factory","installation","aftersales"].includes(j.stageId));
  const bySource = SOURCES.map(s=>({s,c:jobs.filter(j=>j.source===s).length})).filter(x=>x.c>0).sort((a,b)=>b.c-a.c);
  const byDesigner = DESIGNERS.map(d=>({d,leads:jobs.filter(j=>j.designer===d).length,rev:jobs.filter(j=>j.designer===d&&["contract","factory","installation","aftersales"].includes(j.stageId)).reduce((x,j)=>x+(j.finalQuote||j.budget||0),0)}));
  const byStyle = KITCHEN_STYLES.map(s=>({s,c:jobs.filter(j=>j.style===s).length})).filter(x=>x.c>0).sort((a,b)=>b.c-a.c);
  const maxSrc = Math.max(...bySource.map(x=>x.c),1);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div className="card">
        <div className="card-title">Revenue & Overview</div>
        {[
          {l:"Total Contracted Revenue",v:fmt(totalRev),c:"var(--gold)"},
          {l:"Pipeline Value (All Active)",v:fmt(jobs.reduce((s,j)=>s+(j.budget||0),0)),c:"var(--blue)"},
          {l:"Avg Deal Size",v:fmt(Math.round(totalRev/(contracted.length||1))),c:"var(--cream)"},
          {l:"Contracts Signed",v:contracted.length,c:"var(--green)"},
          {l:"Total Jobs",v:jobs.length,c:"var(--cream)"},
          {l:"In Factory",v:jobs.filter(j=>j.stageId==="factory").length,c:"var(--pink)"},
          {l:"Installed & Completed",v:jobs.filter(j=>j.stageId==="aftersales").length,c:"var(--green)"},
        ].map(r=>(
          <div key={r.l} className="info-row"><span className="info-key">{r.l}</span><span style={{color:r.c,fontWeight:600}}>{r.v}</span></div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Lead Sources</div>
        {bySource.map(x=>(
          <div key={x.s} style={{marginBottom:9}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
              <span style={{color:"var(--cream3)"}}>{x.s}</span><span>{x.c}</span>
            </div>
            <div className="prog-pill" style={{height:5}}>
              <div className="prog-fill" style={{width:`${(x.c/maxSrc)*100}%`}} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Designer Performance</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
          <thead><tr>
            {["Designer","Jobs","Revenue"].map(h=><th key={h} style={{padding:"5px 0",fontSize:10,textAlign:h==="Revenue"?"right":"left",color:"var(--gold-dim)",fontWeight:500}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {byDesigner.map(x=>(
              <tr key={x.d}>
                <td style={{padding:"8px 0",borderBottom:"1px solid rgba(42,38,30,.4)",color:"var(--cream)"}}>{x.d}</td>
                <td style={{padding:"8px 0",borderBottom:"1px solid rgba(42,38,30,.4)",color:"var(--cream3)"}}>{x.leads}</td>
                <td style={{padding:"8px 0",borderBottom:"1px solid rgba(42,38,30,.4)",color:"var(--gold)",fontWeight:600,textAlign:"right"}}>{fmt(x.rev)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-title">Popular Styles</div>
        {byStyle.map((x,i)=>(
          <div key={x.s} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(42,38,30,.4)"}}>
            <div style={{width:20,height:20,background:`rgba(201,168,76,${.15+i*.04})`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"var(--gold)",fontWeight:700}}>{i+1}</div>
            <div style={{flex:1,fontSize:12.5,color:"var(--cream)"}}>{x.s}</div>
            <div style={{fontSize:12,color:"var(--cream3)"}}>{x.c} job{x.c>1?"s":""}</div>
            <div className="prog-pill" style={{width:70,height:4}}><div className="prog-fill" style={{width:`${(x.c/jobs.length)*100}%`}} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────
const PRODS = [
  {id:1,name:"Modern Island Unit",style:"Modern",price:4200,sku:"MOD-ISL-001",desc:"Large central island, integrated sink & storage"},
  {id:2,name:"Classic White Lacquer Set",style:"Classic",price:8500,sku:"CLS-WHT-002",desc:"Full set, high-gloss white lacquer"},
  {id:3,name:"Marble Countertop (per m²)",style:"All",price:380,sku:"CTR-MRB-003",desc:"Carrara marble, custom cut"},
  {id:4,name:"Smart Appliance Package",style:"Modern",price:6200,sku:"SMA-APP-004",desc:"Oven, hob, dishwasher, fridge — all smart"},
  {id:5,name:"Rustic Solid Oak Base",style:"Rustic",price:3100,sku:"RST-OAK-005",desc:"Solid oak, aged finish, soft-close"},
  {id:6,name:"Industrial Black Range",style:"Industrial",price:5400,sku:"IND-BLK-006",desc:"Matte black, open shelving"},
  {id:7,name:"Minimalist Handle-less",style:"Minimalist",price:9800,sku:"MIN-HLS-007",desc:"Push-to-open cabinets, fully integrated"},
  {id:8,name:"Wall Cabinet Set",style:"All",price:2200,sku:"WLL-CAB-008",desc:"Upper wall cabinets, multiple finishes"},
  {id:9,name:"Quartz Worktop (per m²)",style:"All",price:280,sku:"CTR-QTZ-009",desc:"Engineered quartz, stain-resistant"},
  {id:10,name:"Traditional Shaker Set",style:"Traditional",price:7600,sku:"TRD-SHK-010",desc:"Classic shaker doors, painted finish"},
  {id:11,name:"Bespoke Pantry Unit",style:"Bespoke",price:3800,sku:"BSP-PNT-011",desc:"Floor-to-ceiling pantry, custom spec"},
  {id:12,name:"Contemporary Gloss Set",style:"Contemporary",price:7200,sku:"CTM-GLS-012",desc:"High-gloss lacquer, handleless design"},
];
function Products() {
  const [f,setF]=useState("All");
  const shown = f==="All"?PRODS:PRODS.filter(p=>p.style===f||p.style==="All");
  const EMOJIS = {Modern:"🏙️",Classic:"🏛️",Contemporary:"◼",Rustic:"🌿",Industrial:"⚙️",Minimalist:"□",Traditional:"🪵",Bespoke:"✦",All:"🍳"};
  return (<>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {["All",...KITCHEN_STYLES].map(s=>(
        <button key={s} className={`btn ${f===s?"btn-gold":"btn-ghost"} btn-sm`} onClick={()=>setF(s)}>{s}</button>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      {shown.map(p=>(
        <div key={p.id} className="card" style={{padding:14}}>
          <div style={{background:"var(--surface2)",borderRadius:8,height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:10}}>{EMOJIS[p.style]||"🍳"}</div>
          <div style={{fontSize:9.5,color:"var(--cream3)",marginBottom:4}}>{p.sku} · {p.style}</div>
          <div style={{fontFamily:"var(--font-d)",fontSize:14,color:"var(--cream)",marginBottom:6}}>{p.name}</div>
          <div style={{fontSize:11.5,color:"var(--cream3)",marginBottom:10,lineHeight:1.5}}>{p.desc}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{color:"var(--gold)",fontWeight:600}}>{fmt(p.price)}</span>
            <button className="btn btn-ghost btn-xs">＋ Add to Quote</button>
          </div>
        </div>
      ))}
    </div>
  </>);
}

// ── MODALS ────────────────────────────────────────────────────────────────
function JobModal({job,onClose,onSave}) {
  const [f,setF]=useState(job||{name:"",phone:"",email:"",address:"",source:"Walk-In",style:"Modern",budget:"",priority:"Medium",designer:DESIGNERS[0],notes:""});
  const s=(k,v)=>setF(x=>({...x,[k]:v}));
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{job?"Edit Job":"New Kitchen Job"}</div>
        <div className="form-grid">
          <div className="field"><label>Full Name *</label><input value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Customer full name" /></div>
          <div className="field"><label>Phone *</label><input value={f.phone} onChange={e=>s("phone",e.target.value)} placeholder="+962 79 …" /></div>
          <div className="field"><label>Email</label><input value={f.email} onChange={e=>s("email",e.target.value)} placeholder="email@example.com" /></div>
          <div className="field"><label>Address</label><input value={f.address} onChange={e=>s("address",e.target.value)} placeholder="Area, City" /></div>
          <div className="field"><label>Source</label><select value={f.source} onChange={e=>s("source",e.target.value)}>{SOURCES.map(x=><option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Kitchen Style</label><select value={f.style} onChange={e=>s("style",e.target.value)}>{KITCHEN_STYLES.map(x=><option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Estimated Budget (JD)</label><input type="number" value={f.budget} onChange={e=>s("budget",Number(e.target.value))} placeholder="15000" /></div>
          <div className="field"><label>Priority</label><select value={f.priority} onChange={e=>s("priority",e.target.value)}>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></div>
          <div className="field fg-full"><label>Assigned Designer</label><select value={f.designer} onChange={e=>s("designer",e.target.value)}>{DESIGNERS.map(x=><option key={x}>{x}</option>)}</select></div>
          <div className="field fg-full"><label>Notes</label><textarea value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Customer preferences, requirements, visit notes…" /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={()=>{if(!f.name||!f.phone){alert("Name and phone required");return;}onSave(f);}}>
            {job?"Save Changes":"Create Job"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteModal({id,onClose,onSave}) {
  const [txt,setTxt]=useState("");
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{width:420}} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Add Activity Note</div>
        <div className="field"><label>Note</label><textarea value={txt} onChange={e=>setTxt(e.target.value)} placeholder="e.g. Called customer, confirmed measurement date…" style={{minHeight:100}} /></div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={()=>{if(!txt.trim())return;onSave(id,txt.trim());}}>Save Note</button>
        </div>
      </div>
    </div>
  );
}
