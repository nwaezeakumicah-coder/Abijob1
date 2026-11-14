"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";

type Passkey = { id: string; friendly_name?: string | null; created_at: string };

export default function AdminPasskeySettings() {
  const [passkeys,setPasskeys]=useState<Passkey[]>([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState("");
  const [failed,setFailed]=useState(false);

  const supabase=useMemo(()=>createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {auth:{experimental:{passkey:true}}}
  ),[]);

  const refresh=useCallback(async()=>{
    setLoading(true);
    const {data,error}=await supabase.auth.passkey.list();
    if(error){setFailed(true);setMessage(error.message);}
    else{setPasskeys((data??[]) as Passkey[]);setFailed(false);setMessage("");}
    setLoading(false);
  },[supabase]);

  useEffect(()=>{void refresh();},[refresh]);

  async function add(){
    setWorking(true);setMessage("");setFailed(false);
    const {error}=await supabase.auth.registerPasskey();
    if(error){setFailed(true);setMessage(error.message);}
    else{setMessage("Passkey registered successfully.");await refresh();}
    setWorking(false);
  }

  async function remove(passkey:Passkey){
    if(!window.confirm("Remove this administrator passkey?"))return;
    setWorking(true);setMessage("");setFailed(false);
    const {error}=await supabase.auth.passkey.delete({passkeyId:passkey.id});
    if(error){setFailed(true);setMessage(error.message);}
    else{setMessage("Passkey removed.");await refresh();}
    setWorking(false);
  }

  return <section className="admin-settings-section">
    <div className="admin-settings-section-heading"><div><h2>Passkey and biometric sign-in</h2><p>Secure administrator access with fingerprint, Face ID, device PIN or a security key.</p></div></div>
    <div className="admin-passkey-note"><ShieldCheck size={17}/> Abi Job never receives or stores your fingerprint or face data. Verification happens on your device.</div>
    {loading?<p>Checking registered passkeys…</p>:passkeys.length?<div className="admin-passkey-list">{passkeys.map(p=><div className="admin-passkey-row" key={p.id}><span><KeyRound size={17}/><strong>{p.friendly_name||"Registered device"}</strong></span><button type="button" onClick={()=>void remove(p)} disabled={working} aria-label="Remove passkey"><Trash2 size={16}/></button></div>)}</div>:<p>No passkeys registered yet.</p>}
    {message&&<p role={failed?"alert":"status"} className={failed?"admin-passkey-error":"admin-passkey-success"}>{message}</p>}
    <button type="button" className="admin-passkey-add" onClick={()=>void add()} disabled={working||loading}><Plus size={16}/>{working?"Please wait…":"Add a passkey"}</button>
  </section>;
}
