import { useState, useEffect, useRef } from "react";
const AP="FAFT2026!admin",SP="7743",MP="truck2026";
const G=`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#FAFAF8;--card:#FFFFFF;--ink:#1A1613;--sub:#6B6560;--mute:#9C9690;--line:#E8E4DF;--tint:#F4F1ED;--accent:#D4482C;--accentL:#FFF0ED;--sans:'Inter',system-ui,sans-serif;--serif:'Fraunces',Georgia,serif;--mono:'JetBrains Mono',monospace}
html{scroll-behavior:smooth}
body{font-family:var(--sans);color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased;overflow-x:hidden}
::selection{background:var(--accentL);color:var(--accent)}
button{cursor:pointer;border:none;background:none;font-family:inherit;color:inherit}
input,textarea,select{font-family:var(--sans);outline:none}
input:focus,textarea:focus{border-color:var(--accent)!important}
a{text-decoration:none;color:inherit}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-33.33%)}}
.ani{animation:fadeUp .5s ease both}
.d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}

button:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;

function useRouter(){
  const[r,setR]=useState(window.location.hash.slice(1)||"/");
  useEffect(()=>{
    const h=()=>{setR(window.location.hash.slice(1)||"/");window.scrollTo(0,0)};
    window.addEventListener("hashchange",h);
    return()=>window.removeEventListener("hashchange",h);
  },[]);
  useEffect(()=>{
    const titles={"/":" | Richmond's Food Truck Booking Network","/submit":" | Submit an Event","/join":" | Join as a Vendor","/access":" | Verified Vendor Access","/member":" | Vendor Portal","/admin":" | Admin"};
    document.title="Find A Food Truck RVA"+(titles[r]||"");
  },[r]);
  return{route:r,go:p=>{window.location.hash=p}}
}

const W=({children,style={},...p})=><div style={{maxWidth:1080,margin:"0 auto",padding:"0 20px",...style}} {...p}>{children}</div>;

function Btn({children,onClick,variant="primary",full,size="md"}){
  const s={display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontWeight:500,fontFamily:"var(--sans)",transition:"all .15s",letterSpacing:"-.01em",width:full?"100%":undefined};
  const sz={sm:{fontSize:13,padding:"9px 18px"},md:{fontSize:14,padding:"11px 22px"},lg:{fontSize:15,padding:"13px 28px"}}[size];
  const v={
    primary:{...s,...sz,background:"var(--ink)",color:"#fff"},
    accent:{...s,...sz,background:"var(--accent)",color:"#fff"},
    outline:{...s,...sz,background:"var(--card)",color:"var(--ink)",border:"1px solid var(--mute)"},
    ghost:{...s,...sz,color:"var(--sub)",border:"1px solid var(--line)"},
  }[variant];
  return<button onClick={onClick} style={v}>{children}</button>
}

function Input({label,value,onChange,placeholder,type="text",textarea,rows=3}){
  const s={width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid var(--line)",fontSize:14,color:"var(--ink)",background:"var(--card)",marginBottom:14};
  return<div>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:500,color:"var(--sub)",marginBottom:5,letterSpacing:".02em"}}>{label}</label>}
    {textarea?<textarea value={value} onChange={onChange} placeholder={placeholder} style={{...s,resize:"vertical",fontFamily:"var(--sans)"}} rows={rows}/>
    :<input value={value} onChange={onChange} placeholder={placeholder} type={type} style={{...s,fontFamily:"var(--sans)"}}/>}
  </div>
}

function Chip({children,active,onClick}){
  return<button onClick={onClick} style={{padding:"7px 13px",borderRadius:8,fontSize:12,fontWeight:500,border:"1px solid",borderColor:active?"var(--accent)":"var(--line)",background:active?"var(--accent)":"var(--card)",color:active?"#fff":"var(--sub)",transition:"all .15s"}}>{children}</button>
}

function Nav({go,route}){
  const[open,setOpen]=useState(false);
  return<>
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(250,250,248,.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--line)"}}>
      <W style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:54,padding:"0 20px"}}>
        <div onClick={()=>{go("/");setOpen(false)}} style={{cursor:"pointer",display:"flex",alignItems:"baseline",gap:5}}>
          <span style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:400,fontStyle:"italic"}}>find a</span>
          <span style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:500,color:"var(--accent)"}}>food truck</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:28}} className="dsk">
          {[["Submit Event","/submit"],["Join as Vendor","/join"],["Verified Access","/access"]].map(([l,p])=>
            <span key={p} onClick={()=>go(p)} style={{fontSize:13,fontWeight:500,color:route===p?"var(--ink)":"var(--mute)",cursor:"pointer",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--ink)"} onMouseLeave={e=>{if(route!==p)e.currentTarget.style.color="var(--mute)"}}>{l}</span>
          )}
        </div>
        <div style={{display:"flex",gap:8}} className="dsk">
          <Btn variant="ghost" size="sm" onClick={()=>go("/member")}>Vendor Login</Btn>
          <Btn variant="accent" size="sm" onClick={()=>go("/submit")}>Submit Event</Btn>
        </div>
        <button className="mobtn" onClick={()=>setOpen(!open)} style={{fontSize:20,padding:4}}>
          {open?"✕":"☰"}
        </button>
      </W>
    </nav>
    {open&&<div style={{position:"fixed",inset:0,top:54,background:"var(--bg)",zIndex:99,padding:"16px 20px"}}>
      {[["Submit an Event","/submit"],["Join as Vendor","/join"],["Verified Access","/access"],["Vendor Login","/member"]].map(([l,p])=>
        <button key={p} onClick={()=>{go(p);setOpen(false)}} style={{display:"block",width:"100%",padding:"16px 0",fontSize:16,fontWeight:500,color:route===p?"var(--accent)":"var(--ink)",textAlign:"left",borderBottom:"1px solid var(--line)",transition:"color .15s"}}>{l}</button>
      )}
    </div>}
    <style>{`
      .mobtn{display:none}
      @media(max-width:768px){.dsk{display:none!important}.mobtn{display:block!important}}
    `}</style>
  </>
}

function HomePage({go}){
  return<div style={{paddingTop:54}}>
    {/* Hero */}
    <section style={{padding:"clamp(60px,14vw,120px) 20px clamp(48px,10vw,70px)",textAlign:"center"}}>
      <W style={{maxWidth:640,padding:0}}>
        <p className="ani" style={{fontSize:12,fontWeight:500,color:"var(--accent)",letterSpacing:".08em",marginBottom:16}}>RICHMOND, VIRGINIA</p>
        <h1 className="ani d1" style={{fontSize:"clamp(28px,6vw,50px)",fontWeight:300,fontFamily:"var(--serif)",lineHeight:1.2,letterSpacing:"-.02em",margin:"0 0 20px"}}>The food truck booking network for <em style={{fontWeight:400,color:"var(--accent)"}}>Richmond</em>.</h1>
        <p className="ani d2" style={{fontSize:"clamp(14px,2.5vw,16px)",color:"var(--sub)",lineHeight:1.7,maxWidth:420,margin:"0 auto 32px",fontWeight:300}}>Submit event requests. Get matched with verified vendors. Book directly — no middlemen, no spam.</p>
        <div className="ani d3" style={{display:"flex",flexDirection:"column",gap:10,maxWidth:340,margin:"0 auto"}}>
          <Btn variant="accent" size="lg" full onClick={()=>go("/submit")}>Submit an Event</Btn>
          <Btn variant="outline" size="lg" full onClick={()=>go("/join")}>Join as a Vendor</Btn>
        </div>
        <p className="ani d3" style={{fontSize:12,color:"var(--mute)",marginTop:18,fontStyle:"italic",fontFamily:"var(--serif)"}}>Serving corporate events, weddings, festivals, and everything in between.</p>
      </W>
    </section>

    {/* Ticker */}
    <div style={{borderTop:"1px solid var(--line)",borderBottom:"1px solid var(--line)",padding:"10px 0",overflow:"hidden"}}>
      <div style={{display:"flex",animation:"scroll 35s linear infinite",whiteSpace:"nowrap"}}>
        {[0,1,2].map(j=><div key={j} style={{display:"flex"}}>
          {["BBQ & Smoked Meats","Mexican / Latin","Southern / Soul Food","Asian Fusion","Breakfast & Brunch","Beverages & Dessert","Catering","Weddings","Corporate Events","Festivals"].map((t,i)=>
            <span key={i} style={{padding:"0 24px",fontSize:11,color:"var(--mute)",fontFamily:"var(--mono)"}}>{t}</span>
          )}
        </div>)}
      </div>
    </div>

    {/* How It Works */}
    <section style={{padding:"clamp(56px,10vw,96px) 20px"}}>
      <W style={{padding:0}}>
        <p className="ani" style={{fontSize:12,fontWeight:500,color:"var(--mute)",letterSpacing:".08em",marginBottom:10}}>HOW IT WORKS</p>
        <h2 className="ani d1" style={{fontSize:"clamp(24px,4vw,32px)",fontWeight:300,fontFamily:"var(--serif)",marginBottom:"clamp(32px,5vw,52px)"}}>Simple for hosts.<br/>Valuable for vendors.</h2>
        <div className="ani d2" style={{display:"flex",flexDirection:"column",gap:1,background:"var(--line)",borderRadius:12,overflow:"hidden"}}>
          {[["For Event Hosts","Tell us your date, location, headcount, and requirements. We match you with verified vendors.","Submit an Event →","/submit"],
            ["For Vendors","Get listed for free. Receive qualified booking opportunities from hosts across Richmond.","Join the Network →","/join"],
            ["Direct Booking","No platform fees. No middlemen. Hosts and vendors connect directly.","Learn More →","/access"]
          ].map(([t,d,c,l])=><div key={t} style={{background:"var(--card)",padding:"clamp(24px,3.5vw,36px)"}}>
            <h3 style={{fontSize:14,fontWeight:600,marginBottom:8}}>{t}</h3>
            <p style={{fontSize:13,color:"var(--sub)",lineHeight:1.7,marginBottom:14,fontWeight:300}}>{d}</p>
            <span onClick={()=>go(l)} style={{fontSize:13,fontWeight:500,color:"var(--accent)",cursor:"pointer",transition:"opacity .15s"}}>{c}</span>
          </div>)}
        </div>
      </W>
    </section>

    {/* Status */}
    <section style={{padding:"clamp(48px,8vw,68px) 20px",borderTop:"1px solid var(--line)",background:"var(--tint)"}}>
      <W style={{padding:0}}>
        <p style={{fontSize:12,fontWeight:500,color:"var(--mute)",letterSpacing:".08em",marginBottom:10}}>CURRENT STATUS</p>
        <h2 style={{fontSize:"clamp(22px,3.5vw,26px)",fontWeight:300,fontFamily:"var(--serif)",marginBottom:24}}>Now accepting</h2>
        <div style={{display:"flex",gap:"clamp(16px,3vw,36px) clamp(24px,5vw,44px)",flexWrap:"wrap"}}>
          {[["Event submissions","Active"],["Vendor applications","Active"],["Verified Vendor waitlist","Open"]].map(([l,s])=>
            <div key={l} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:6,height:6,borderRadius:99,background:s==="Active"?"#2D8C3C":"var(--accent)",flexShrink:0}}/>
              <div><span style={{fontSize:11,fontWeight:500,color:s==="Active"?"#2D8C3C":"var(--accent)",fontFamily:"var(--mono)"}}>{s}</span><span style={{fontSize:12,color:"var(--sub)",marginLeft:6}}>{l}</span></div>
            </div>
          )}
        </div>
      </W>
    </section>

    {/* Verified */}
    <section style={{padding:"clamp(60px,10vw,100px) 20px",background:"var(--ink)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-20%",right:"-10%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(212,72,44,.07),transparent 60%)",filter:"blur(40px)"}}/>
      <W style={{maxWidth:560,textAlign:"center",position:"relative",padding:0}}>
        <p className="ani" style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,.3)",letterSpacing:".08em",marginBottom:12}}>VERIFIED VENDOR ACCESS</p>
        <h2 className="ani d1" style={{fontSize:"clamp(22px,4vw,28px)",fontWeight:300,fontFamily:"var(--serif)",color:"#fff",margin:"0 0 14px"}}>Priority placement. Direct lead access. Category protection.</h2>
        <p className="ani d2" style={{fontSize:14,color:"rgba(255,255,255,.5)",lineHeight:1.7,marginBottom:12,fontWeight:300}}>First access to booking requests, protected category placement, and featured visibility across the network.</p>
        <p className="ani d2" style={{fontSize:13,color:"rgba(255,255,255,.35)",lineHeight:1.7,marginBottom:28,fontStyle:"italic",fontFamily:"var(--serif)"}}>Limited to 1–2 vendors per cuisine. When your slot is full, your competition is capped.</p>
        <div className="ani d3" style={{marginTop:4}}><Btn variant="accent" size="lg" onClick={()=>go("/access")}>Join the Waitlist</Btn></div>
      </W>
    </section>

    {/* CTA */}
    <section style={{padding:"clamp(56px,10vw,88px) 20px",textAlign:"center",borderTop:"1px solid var(--line)"}}>
      <W style={{maxWidth:460,padding:0}}>
        <h2 className="ani" style={{fontSize:"clamp(22px,4vw,26px)",fontWeight:300,fontFamily:"var(--serif)",margin:"0 0 12px"}}>Richmond's food truck scene deserves better infrastructure.</h2>
        <p className="ani d1" style={{fontSize:14,color:"var(--sub)",lineHeight:1.7,fontWeight:300,marginBottom:24}}>We're building it. Get in early — whether you're hosting an event or running a truck.</p>
        <div className="ani d2" style={{display:"flex",flexDirection:"column",gap:10,maxWidth:320,margin:"0 auto"}}>
          <Btn variant="accent" full onClick={()=>go("/submit")}>Submit an Event</Btn>
          <Btn variant="outline" full onClick={()=>go("/join")}>Join as a Vendor</Btn>
        </div>
      </W>
    </section>

    {/* Numbers */}
    <section style={{padding:"clamp(48px,8vw,64px) 20px",borderTop:"1px solid var(--line)"}}>
      <W style={{display:"flex",justifyContent:"center",gap:"clamp(28px,6vw,64px)",padding:0,flexWrap:"wrap"}}>
        {[["4,100+","Network members"],["$800–2,500","Avg. booking"],["10","Verified vendor slots"]].map(([v,l])=>
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontSize:"clamp(22px,4vw,30px)",fontWeight:300,fontFamily:"var(--serif)",letterSpacing:"-.02em"}}>{v}</div>
            <div style={{fontSize:10,color:"var(--mute)",marginTop:4,fontFamily:"var(--mono)"}}>{l}</div>
          </div>
        )}
      </W>
    </section>
  </div>
}

function FormPage({go,title,subtitle,children}){
  return<div style={{paddingTop:54}}>
    <section style={{padding:"clamp(32px,5vw,56px) 20px clamp(48px,8vw,80px)"}}>
      <W style={{maxWidth:540,padding:0}}>
        <div className="ani" style={{marginBottom:24}}>
          <span onClick={()=>go("/")} style={{fontSize:13,color:"var(--mute)",cursor:"pointer",display:"inline-block",marginBottom:10}}>{"←"} Back</span>
          <h1 style={{fontSize:"clamp(22px,4vw,28px)",fontWeight:300,fontFamily:"var(--serif)",margin:"0 0 4px"}}>{title}</h1>
          {subtitle&&<p style={{fontSize:13,color:"var(--sub)"}}>{subtitle}</p>}
        </div>
        {children}
      </W>
    </section>
  </div>
}

function SubmitEvent({go}){
  const[step,setStep]=useState(1);
  const[f,sF]=useState({type:"",date:"",time:"",location:"",attendance:"",cuisine:"",budget:"",name:"",email:"",phone:"",org:"",notes:""});
  const u=(k,v)=>sF({...f,[k]:v});
  const types=["Corporate","Wedding","Private Party","Festival","Community","School / Nonprofit","Other"];
  
  if(step===4)return<div style={{paddingTop:54,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
    <div className="ani" style={{textAlign:"center",maxWidth:380}}>
      <div style={{width:44,height:44,borderRadius:99,background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto 20px",animation:"fadeUp .4s ease"}}>{"✓"}</div>
      <h2 style={{fontSize:24,fontWeight:300,fontFamily:"var(--serif)",margin:"0 0 10px"}}>Request submitted.</h2>
      <p style={{fontSize:14,color:"var(--sub)",lineHeight:1.7,fontWeight:300}}>Verified vendors will be notified. Expect responses within 24 hours.</p>
      <div style={{marginTop:28}}><Btn variant="outline" onClick={()=>go("/")}>Back to home</Btn></div>
    </div>
  </div>;

  return<FormPage go={go} title="Submit an Event" subtitle={`Step ${step} of 3`}>
    <div style={{display:"flex",gap:3,marginBottom:24}}>{[1,2,3].map(s=><div key={s} style={{flex:1,height:2,borderRadius:2,background:s<=step?"var(--accent)":"var(--line)",transition:"background .3s"}}/>)}</div>
    <div className="ani d1" style={{background:"var(--card)",borderRadius:10,border:"1px solid var(--line)",padding:"clamp(20px,3.5vw,32px)"}}>
      {step===1&&<><h3 style={{fontSize:15,fontWeight:600,marginBottom:18}}>Event Details</h3>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:500,color:"var(--sub)",marginBottom:6}}>Event Type</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{types.map(t=><Chip key={t} active={f.type===t} onClick={()=>u("type",t)}>{t}</Chip>)}</div></div>
        <Input label="Date" value={f.date} onChange={e=>u("date",e.target.value)} type="date"/>
        <Input label="Time" value={f.time} onChange={e=>u("time",e.target.value)} placeholder="e.g. 4–8 PM"/>
        <Input label="Location" value={f.location} onChange={e=>u("location",e.target.value)} placeholder="Venue or address"/>
        <Input label="Guests" value={f.attendance} onChange={e=>u("attendance",e.target.value)} placeholder="Expected attendance" type="number"/>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}><Btn variant="accent" onClick={()=>setStep(2)}>Continue</Btn></div>
      </>}
      {step===2&&<><h3 style={{fontSize:15,fontWeight:600,marginBottom:18}}>Requirements</h3>
        <Input label="Cuisine Preferences" value={f.cuisine} onChange={e=>u("cuisine",e.target.value)} placeholder="e.g. BBQ, Mexican, Any"/>
        <Input label="Budget Range" value={f.budget} onChange={e=>u("budget",e.target.value)} placeholder="e.g. $500–$1,000"/>
        <Input label="Additional Details" value={f.notes} onChange={e=>u("notes",e.target.value)} placeholder="Dietary needs, setup, # of trucks..." textarea rows={4}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><Btn variant="ghost" onClick={()=>setStep(1)}>Back</Btn><Btn variant="accent" onClick={()=>setStep(3)}>Continue</Btn></div>
      </>}
      {step===3&&<><h3 style={{fontSize:15,fontWeight:600,marginBottom:18}}>Contact</h3>
        <Input label="Name" value={f.name} onChange={e=>u("name",e.target.value)} placeholder="Full name"/>
        <Input label="Organization" value={f.org} onChange={e=>u("org",e.target.value)} placeholder="Optional"/>
        <Input label="Email" value={f.email} onChange={e=>u("email",e.target.value)} placeholder="you@email.com" type="email"/>
        <Input label="Phone" value={f.phone} onChange={e=>u("phone",e.target.value)} placeholder="(804) 555-0000"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><Btn variant="ghost" onClick={()=>setStep(2)}>Back</Btn><Btn variant="accent" onClick={()=>setStep(4)}>Submit Request</Btn></div>
      </>}
    </div>
  </FormPage>
}

function JoinVendor({go}){
  const[step,setStep]=useState(1);
  const[f,sF]=useState({truck:"",cuisine:"",owner:"",phone:"",email:"",schedule:"",description:"",waitlist:false});
  const u=(k,v)=>sF({...f,[k]:v});
  const cuisines=["BBQ & Smoked","Mexican / Latin","Southern / Soul","Asian Fusion","Breakfast / Brunch","Beverages / Dessert","Other"];
  
  if(step===4)return<div style={{paddingTop:54,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
    <div className="ani" style={{textAlign:"center",maxWidth:380}}>
      <div style={{width:44,height:44,borderRadius:99,background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto 20px",animation:"fadeUp .4s ease"}}>{"✓"}</div>
      <h2 style={{fontSize:24,fontWeight:300,fontFamily:"var(--serif)",margin:"0 0 10px"}}>You're in the network.</h2>
      <p style={{fontSize:14,color:"var(--sub)",lineHeight:1.7,fontWeight:300}}>Log in to complete your profile and add your menu.</p>
      {f.waitlist&&<p style={{fontSize:12,fontWeight:500,background:"var(--accentL)",color:"var(--accent)",padding:"8px 14px",borderRadius:8,display:"inline-block",marginTop:10}}>Verified Vendor waitlist — applied</p>}
      <div style={{marginTop:28,display:"flex",gap:8,justifyContent:"center"}}><Btn variant="accent" onClick={()=>go("/member")}>Set Up Profile</Btn><Btn variant="outline" onClick={()=>go("/")}>Home</Btn></div>
    </div>
  </div>;

  return<FormPage go={go} title="Join as a Vendor" subtitle={`Step ${step} of 3 — Free to join`}>
    <div style={{display:"flex",gap:3,marginBottom:24}}>{[1,2,3].map(s=><div key={s} style={{flex:1,height:2,borderRadius:2,background:s<=step?"var(--accent)":"var(--line)",transition:"background .3s"}}/>)}</div>
    <div className="ani d1" style={{background:"var(--card)",borderRadius:10,border:"1px solid var(--line)",padding:"clamp(20px,3.5vw,32px)"}}>
      {step===1&&<><h3 style={{fontSize:15,fontWeight:600,marginBottom:18}}>Business Info</h3>
        <Input label="Truck Name" value={f.truck} onChange={e=>u("truck",e.target.value)} placeholder="Your food truck name"/>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:500,color:"var(--sub)",marginBottom:6}}>Cuisine</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cuisines.map(c=><Chip key={c} active={f.cuisine===c} onClick={()=>u("cuisine",c)}>{c}</Chip>)}</div></div>
        <Input label="Schedule" value={f.schedule} onChange={e=>u("schedule",e.target.value)} placeholder="e.g. Tue–Sat 11am–8pm"/>
        <Input label="Description" value={f.description} onChange={e=>u("description",e.target.value)} placeholder="What you serve..." textarea rows={3}/>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}><Btn variant="accent" onClick={()=>setStep(2)}>Continue</Btn></div>
      </>}
      {step===2&&<><h3 style={{fontSize:15,fontWeight:600,marginBottom:18}}>Contact</h3>
        <Input label="Owner Name" value={f.owner} onChange={e=>u("owner",e.target.value)} placeholder="Full name"/>
        <Input label="Email" value={f.email} onChange={e=>u("email",e.target.value)} placeholder="you@email.com" type="email"/>
        <Input label="Phone" value={f.phone} onChange={e=>u("phone",e.target.value)} placeholder="(804) 555-0000"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><Btn variant="ghost" onClick={()=>setStep(1)}>Back</Btn><Btn variant="accent" onClick={()=>setStep(3)}>Continue</Btn></div>
      </>}
      {step===3&&<><h3 style={{fontSize:15,fontWeight:600,marginBottom:18}}>Verified Access</h3>
        <div style={{background:"var(--tint)",borderRadius:8,padding:16,marginBottom:18,border:"1px solid var(--line)"}}>
          <h4 style={{fontSize:13,fontWeight:600,marginBottom:4}}>Verified Vendor tier — launching soon</h4>
          <p style={{fontSize:12,color:"var(--sub)",lineHeight:1.6,fontWeight:300,marginBottom:10}}>Priority placement, direct leads, category protection.</p>
          <label style={{display:"flex",alignItems:"flex-start",gap:8,cursor:"pointer"}}><input type="checkbox" checked={f.waitlist} onChange={e=>u("waitlist",e.target.checked)} style={{marginTop:2,accentColor:"var(--accent)"}}/><span style={{fontSize:13,lineHeight:1.5}}>Add me to the waitlist.</span></label>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}><Btn variant="ghost" onClick={()=>setStep(2)}>Back</Btn><Btn variant="accent" onClick={()=>setStep(4)}>Join Network</Btn></div>
      </>}
    </div>
  </FormPage>
}

function AccessPage({go}){
  const[done,setDone]=useState(false);
  const[f,sF]=useState({name:"",truck:"",cuisine:"",email:"",why:""});
  const u=(k,v)=>sF({...f,[k]:v});
  const cs=["BBQ & Smoked","Mexican / Latin","Southern / Soul","Asian Fusion","Breakfast / Brunch","Beverages / Dessert"];
  return<FormPage go={go} title="Verified Vendor Access" subtitle="Priority access to booking requests and protected category placement.">
    <div className="ani d1" style={{display:"flex",flexDirection:"column",gap:1,background:"var(--line)",borderRadius:10,overflow:"hidden",marginBottom:32}}>
      {[["Priority Placement","Appear first to event hosts."],["Direct Lead Routing","Requests matched to your cuisine."],["Category Protection","Limited slots. Competition capped."],["Featured Visibility","Prominent in directory and matching."]].map(([t,d])=>
        <div key={t} style={{background:"var(--card)",padding:"clamp(18px,3vw,28px)"}}>
          <h3 style={{fontSize:13,fontWeight:600,marginBottom:3}}>{t}</h3>
          <p style={{fontSize:12,color:"var(--sub)",lineHeight:1.6,fontWeight:300}}>{d}</p>
        </div>
      )}
    </div>
    {!done?<div className="ani d2" style={{background:"var(--card)",borderRadius:10,border:"1px solid var(--line)",padding:"clamp(16px,3vw,28px)"}}>
      <h3 style={{fontSize:17,fontWeight:300,fontFamily:"var(--serif)",marginBottom:4}}>Join the waitlist</h3>
      <p style={{fontSize:12,color:"var(--sub)",lineHeight:1.6,marginBottom:20}}>Limited per cuisine category.</p>
      <Input label="Your Name" value={f.name} onChange={e=>u("name",e.target.value)} placeholder="Full name"/>
      <Input label="Truck Name" value={f.truck} onChange={e=>u("truck",e.target.value)} placeholder="Your food truck"/>
      <Input label="Email" value={f.email} onChange={e=>u("email",e.target.value)} placeholder="you@email.com" type="email"/>
      <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:500,color:"var(--sub)",marginBottom:6}}>Cuisine</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cs.map(c=><Chip key={c} active={f.cuisine===c} onClick={()=>u("cuisine",c)}>{c}</Chip>)}</div></div>
      <Input label="Why interested?" value={f.why} onChange={e=>u("why",e.target.value)} placeholder="About your truck..." textarea rows={3}/>
      <Btn variant="accent" full onClick={()=>{if(f.name&&f.truck&&f.email&&f.cuisine)setDone(true);else{alert("Please fill in all required fields.")}}}>Submit Application</Btn>
    </div>
    :<div className="ani" style={{textAlign:"center",padding:"40px 0"}}>
      <div style={{width:44,height:44,borderRadius:99,background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,margin:"0 auto 20px",animation:"fadeUp .4s ease"}}>{"✓"}</div>
      <h3 style={{fontSize:22,fontWeight:300,fontFamily:"var(--serif)",margin:"0 0 10px"}}>Application received.</h3>
      <p style={{fontSize:14,color:"var(--sub)",lineHeight:1.7,fontWeight:300}}>We'll reach out when verified tier launches.</p>
      <div style={{marginTop:16,fontSize:12,color:"var(--mute)",fontFamily:"var(--mono)"}}>{f.truck} · {f.cuisine}</div>
    </div>}
  </FormPage>
}

function MemberLogin({onLogin}){
  const[pw,setPw]=useState("");const[err,setErr]=useState(false);
  return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div className="ani" style={{width:"100%",maxWidth:340,padding:24,borderRadius:10,background:"var(--card)",border:"1px solid var(--line)",textAlign:"center"}}>
      <h2 style={{fontSize:20,fontWeight:300,fontFamily:"var(--serif)",margin:"0 0 4px"}}>Vendor Portal</h2>
      <p style={{fontSize:12,color:"var(--sub)",marginBottom:20}}>Manage your profile and menu.</p>
      {err&&<p style={{color:"#DC2626",fontSize:12,marginBottom:10}}>Invalid password.</p>}
      <input value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(onLogin(pw)||void(setErr(true),setPw("")))} type="password" placeholder="Enter password" style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid var(--line)",fontSize:14,marginBottom:10,textAlign:"center"}}/>
      <Btn variant="accent" full onClick={()=>onLogin(pw)||void(setErr(true),setPw(""))}>Sign In</Btn>
    </div>
  </div>
}

function MemberDash({go}){
  const[tab,setTab]=useState("profile");
  const[profile,setProfile]=useState({name:"",cuisine:"",owner:"",phone:"",schedule:"",price:"",desc:""});
  const[menu,setMenu]=useState([]);const[ni,sNi]=useState({name:"",price:"",desc:""});
  const[scanning,setScanning]=useState(false);const[scanErr,setScanErr]=useState(null);
  const fr=useRef(null);const up=(k,v)=>setProfile({...profile,[k]:v});
  const scan=async(file)=>{if(!file)return;setScanErr(null);setScanning(true);const r=new FileReader();r.onload=async(ev)=>{const b=ev.target.result.split(",")[1];try{const resp=await fetch("/api/scan-menu",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({base64:b,mediaType:file.type||"image/jpeg"})});const data=await resp.json();if(data.items?.length>0)setMenu(p=>[...p,...data.items]);else setScanErr("Couldn't parse items.")}catch(e){setScanErr("Failed.")}setScanning(false)};r.readAsDataURL(file)};
  return<div style={{paddingTop:54}}>
    <section style={{padding:"24px 20px 40px"}}><W style={{padding:0,maxWidth:920}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div><h1 style={{fontSize:20,fontWeight:400,fontFamily:"var(--serif)"}}>Vendor Dashboard</h1><p style={{fontSize:12,color:"var(--sub)",marginTop:2}}>Profile, menu, and visibility.</p></div>
        <Btn variant="ghost" size="sm" onClick={()=>go("/")}>{"←"} Site</Btn>
      </div>
      <div style={{display:"flex",gap:2,marginBottom:24,borderBottom:"1px solid var(--line)"}}>{["profile","menu"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 14px",fontSize:13,fontWeight:500,color:tab===t?"var(--ink)":"var(--mute)",borderBottom:tab===t?"2px solid var(--accent)":"2px solid transparent",textTransform:"capitalize"}}>{t}</button>)}</div>
      {tab==="profile"&&<div style={{background:"var(--card)",borderRadius:10,border:"1px solid var(--line)",padding:"clamp(16px,3vw,28px)",maxWidth:520}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:18}}>Truck Profile</h3>
        <Input label="Truck Name" value={profile.name} onChange={e=>up("name",e.target.value)} placeholder="Your truck name"/>
        <Input label="Cuisine" value={profile.cuisine} onChange={e=>up("cuisine",e.target.value)} placeholder="e.g. BBQ"/>
        <Input label="Owner" value={profile.owner} onChange={e=>up("owner",e.target.value)} placeholder="Your name"/>
        <Input label="Phone" value={profile.phone} onChange={e=>up("phone",e.target.value)} placeholder="(804) 555-0000"/>
        <Input label="Schedule" value={profile.schedule} onChange={e=>up("schedule",e.target.value)} placeholder="e.g. Tue–Sat"/>
        <Input label="Description" value={profile.desc} onChange={e=>up("desc",e.target.value)} placeholder="About your truck..." textarea rows={3}/>
        <Btn variant="accent" full>Save Profile</Btn>
      </div>}
      {tab==="menu"&&<div style={{maxWidth:580}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:16}}>Menu ({menu.length})</h3>
        <div style={{background:"var(--card)",borderRadius:10,border:"1px dashed var(--line)",padding:20,textAlign:"center",marginBottom:16,cursor:"pointer"}} onClick={()=>fr.current?.click()}>
          <input ref={fr} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])scan(e.target.files[0])}}/>
          {scanning?<p style={{fontSize:13,color:"var(--sub)"}}>Scanning...</p>:<><p style={{fontSize:13,fontWeight:500,color:"var(--accent)"}}>Scan menu from photo</p><p style={{fontSize:11,color:"var(--mute)"}}>Upload a photo. AI reads it.</p></>}
        </div>
        {scanErr&&<p style={{color:"#DC2626",fontSize:12,marginBottom:12}}>{scanErr}</p>}
        {menu.map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--line)"}}><div><div style={{fontSize:13,fontWeight:500}}>{m.name}</div>{m.desc&&<div style={{fontSize:11,color:"var(--mute)"}}>{m.desc}</div>}</div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:600,fontFamily:"var(--mono)"}}>${m.price}</span><button onClick={()=>setMenu(menu.filter((_,j)=>j!==i))} style={{fontSize:11,color:"var(--mute)",padding:"3px 6px",borderRadius:4,border:"1px solid var(--line)"}}>x</button></div></div>)}
        <div style={{background:"var(--tint)",borderRadius:8,padding:14,marginTop:16}}>
          <p style={{fontSize:11,fontWeight:500,color:"var(--sub)",marginBottom:8}}>ADD MANUALLY</p>
          <div style={{display:"flex",gap:6,marginBottom:6}}><input value={ni.name} onChange={e=>sNi({...ni,name:e.target.value})} placeholder="Item" style={{flex:1,padding:"9px 10px",borderRadius:6,border:"1px solid var(--line)",fontSize:13}}/><input value={ni.price} onChange={e=>sNi({...ni,price:e.target.value})} placeholder="$" style={{width:60,padding:"9px 10px",borderRadius:6,border:"1px solid var(--line)",fontSize:13}}/></div>
          <Btn variant="accent" full size="sm" onClick={()=>{if(ni.name&&ni.price){setMenu([...menu,{name:ni.name,price:Number(ni.price),desc:ni.desc}]);sNi({name:"",price:"",desc:""})}}}>Add</Btn>
        </div>
      </div>}
    </W></section>
  </div>
}

function AdminLogin({onLogin}){const[pw,setPw]=useState("");const[e,sE]=useState(false);return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0A0A0A",padding:20}}><div className="ani" style={{width:"100%",maxWidth:320,padding:28,borderRadius:10,background:"#141414",border:"1px solid #222",textAlign:"center"}}><h2 style={{fontSize:18,fontWeight:500,color:"#fff",marginBottom:20}}>Admin Access</h2>{e&&<p style={{color:"#EF4444",fontSize:12,marginBottom:10}}>Invalid.</p>}<input value={pw} onChange={ev=>setPw(ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&(onLogin(pw)||void(sE(true),setPw("")))} type="password" placeholder="Password" style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #333",fontSize:14,background:"#0A0A0A",color:"#fff",marginBottom:10,textAlign:"center"}}/><button onClick={()=>onLogin(pw)||void(sE(true),setPw(""))} style={{width:"100%",padding:11,borderRadius:8,background:"#fff",color:"#000",fontSize:14,fontWeight:500}}>Enter</button></div></div>}

function PinGate({onUnlock,onCancel}){const[pin,setPin]=useState("");const[e,sE]=useState(false);return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0A0A0A",padding:20}}><div style={{width:"100%",maxWidth:280,textAlign:"center"}}><h2 style={{fontSize:16,fontWeight:500,color:"#fff",marginBottom:20}}>Security PIN</h2>{e&&<p style={{color:"#EF4444",fontSize:12,marginBottom:10}}>Invalid PIN.</p>}<input value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(pin===SP?onUnlock():(sE(true),setPin("")))} type="password" maxLength={4} placeholder="••••" style={{width:"100%",padding:12,borderRadius:8,border:"1px solid #333",fontSize:22,letterSpacing:10,background:"#0A0A0A",color:"#fff",textAlign:"center",marginBottom:14}}/><div style={{display:"flex",gap:8}}><button onClick={onCancel} style={{flex:1,padding:10,borderRadius:8,border:"1px solid #333",color:"#666",fontSize:13}}>Cancel</button><button onClick={()=>pin===SP?onUnlock():(sE(true),setPin(""))} style={{flex:1,padding:10,borderRadius:8,background:"#fff",color:"#000",fontSize:13,fontWeight:500}}>Unlock</button></div></div></div>}

function AdminDash({go}){return<div style={{minHeight:"100vh",background:"#0A0A0A",padding:"40px 20px",color:"#fff"}}><W style={{maxWidth:920,padding:0}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}><h1 style={{fontSize:18,fontWeight:500}}>FAFTRVA Admin</h1><button onClick={()=>go("/")} style={{color:"#666",fontSize:12,border:"1px solid #333",padding:"7px 14px",borderRadius:8}}>{"←"} Site</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:32}}>{[["Event Submissions","0","Pending"],["Vendor Applications","0","Pending"],["Waitlist","0","Applications"]].map(([t,v,l])=><div key={t} style={{background:"#141414",borderRadius:8,padding:16,border:"1px solid #222"}}><div style={{fontSize:10,color:"#666",marginBottom:6,fontFamily:"var(--mono)"}}>{t}</div><div style={{fontSize:24,fontWeight:300}}>{v}</div><div style={{fontSize:10,color:"#444",marginTop:2}}>{l}</div></div>)}</div><p style={{color:"#444",fontSize:12}}>Populates as submissions arrive.</p></W></div>}

function Footer({go}){
  return<footer style={{borderTop:"1px solid var(--line)",padding:"32px 20px 24px"}}>
    <W style={{padding:0}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:"clamp(20px,4vw,40px)",marginBottom:24}}>
        <div style={{minWidth:200,flex:"2 1 200px"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:5}}><span style={{fontFamily:"var(--serif)",fontSize:15,fontStyle:"italic"}}>find a</span><span style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:500,color:"var(--accent)"}}>food truck</span></div>
          <p style={{fontSize:11,color:"var(--sub)",marginTop:6,lineHeight:1.6,fontWeight:300}}>Richmond's booking network for food trucks and events.</p>
          <p style={{fontSize:10,color:"var(--mute)",marginTop:4}}>findafoodtruckrva.com</p>
          <p style={{fontSize:10,color:"var(--sub)",marginTop:8,fontFamily:"var(--mono)"}}>Laurence Ash LLC</p>
        </div>
        {[["Network",[["Submit Event","/submit"],["Join as Vendor","/join"],["Verified Access","/access"]]],["Account",[["Vendor Login","/member"],["Admin","/admin"]]]].map(([t,items])=>
          <div key={t} style={{minWidth:120}}>
            <h4 style={{fontSize:10,fontWeight:500,color:"var(--mute)",letterSpacing:".06em",marginBottom:10}}>{t.toUpperCase()}</h4>
            {items.map(([l,to])=><div key={l} onClick={()=>go(to)} style={{color:"var(--sub)",fontSize:12,cursor:"pointer",padding:"3px 0",fontWeight:300,transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--ink)"} onMouseLeave={e=>e.currentTarget.style.color="var(--sub)"}>{l}</div>)}
          </div>
        )}
      </div>
      <div style={{paddingTop:12,borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}>
        <span style={{color:"var(--mute)",fontSize:10,fontFamily:"var(--mono)"}}>© 2026 FAFTRVA</span>
        <span style={{color:"var(--mute)",fontSize:10}}>Richmond, VA</span>
      </div>
    </W>
  </footer>
}

export default function App(){
  const{route,go}=useRouter();
  const[m,sM]=useState(false);const[a,sA]=useState(false);const[p,sP]=useState(false);
  if(route==="/member"){if(!m)return<><style>{G}</style><MemberLogin onLogin={pw=>{if(pw===MP){sM(true);return true}return false}}/></>;return<><style>{G}</style><MemberDash go={go}/></>}
  if(route==="/admin"){if(!a)return<><style>{G}</style><AdminLogin onLogin={pw=>{if(pw===AP){sA(true);return true}return false}}/></>;if(!p)return<><style>{G}</style><PinGate onUnlock={()=>sP(true)} onCancel={()=>{sA(false);go("/")}}/></>;return<><style>{G}</style><AdminDash go={go}/></>}
  return<div style={{background:"var(--bg)",minHeight:"100vh"}}><style>{G}</style><Nav go={go} route={route}/>
    {route==="/"&&<><HomePage go={go}/><Footer go={go}/></>}
    {route==="/submit"&&<><SubmitEvent go={go}/><Footer go={go}/></>}
    {route==="/join"&&<><JoinVendor go={go}/><Footer go={go}/></>}
    {route==="/access"&&<><AccessPage go={go}/><Footer go={go}/></>}
  </div>
}
