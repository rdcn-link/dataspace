import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
export function seal(value,key){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([iv,c.update(JSON.stringify(value)),c.final(),c.getAuthTag()]).toString('base64url')}
export function unseal(raw,key,purpose,now=Date.now()){try{if(typeof raw!=='string'||raw.length>8000)return null;const b=Buffer.from(raw,'base64url');if(b.length<29)return null;const c=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));c.setAuthTag(b.subarray(-16));const value=JSON.parse(Buffer.concat([c.update(b.subarray(12,-16)),c.final()]).toString());return value.purpose===purpose&&Number.isSafeInteger(value.expires)&&value.expires>now?value:null}catch{return null}}
export function cookie(req,name){try{return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||''}catch{return ''}}
export function mayManage(registry,app,user,admins=[]){return !!user&&(registry.apps[app]?.owner===user.uid||(registry.apps[app]?.owner==='platform'&&admins.includes(user.uid)&&['administrator','super-administrator'].includes(user.role)))}
export function mayRun(registry,app,user,admins=[]){return !!user&&(registry.apps[app]?.runPolicy==='authenticated'||mayManage(registry,app,user,admins))}
export function mayDownloadRun(registry,app,run,user,admins=[]){return !!user&&(mayManage(registry,app,user,admins)||registry.apps[app]?.cases?.[run]?.createdBy===user.uid)}
export function mayViewRun(registry,app,run,user,admins=[]){return mayDownloadRun(registry,app,run,user,admins)||registry.apps[app]?.cases?.[run]?.published===true}
export function publicUser(user){return user?{uid:user.uid,name:user.name||'微信用户',username:user.username||'',role:user.role||'user',roleLabel:user.roleLabel||'普通用户'}:null}

// Status 0 is allowed only for the user's explicitly approved existing UID roster.
export function accountMaySignIn(profile,temporaryUids=[]){return !!profile&&profile.enabled!==false&&Number.isInteger(profile.status)&&(profile.status===9||(profile.status===0&&typeof profile.uid==='string'&&temporaryUids.includes(profile.uid)))}
export function verifiedAccountRole(profile,accountRoles={}){const role=profile?.role;if(!profile?.uid||accountRoles[profile.uid]!==role)return {role:'user',roleLabel:'普通用户'};if(role==='超级管理员')return {role:'super-administrator',roleLabel:'超级管理员'};if(role==='管理员')return {role:'administrator',roleLabel:'管理员'};return {role:'user',roleLabel:'普通用户'}}
