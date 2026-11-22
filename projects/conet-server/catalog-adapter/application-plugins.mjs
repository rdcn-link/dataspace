import fs from 'node:fs/promises';
const directory=new URL('./application-plugins/',import.meta.url);
const plugins=new Map();
for(const file of (await fs.readdir(directory)).filter(f=>f.endsWith('.mjs')).sort()){
 const plugin=await import(new URL(file,directory));
 if(!/^svc-\d{3}$/.test(plugin.serviceId)||plugins.has(plugin.serviceId)||(typeof plugin.start!=='function'&&typeof plugin.validation!=='function'))throw Error('Invalid application plugin: '+file);
 plugins.set(plugin.serviceId,plugin);
}
export const applicationPlugin=id=>plugins.get(id);
export async function applicationArtifact(run,name){const plugin=plugins.get(run?.service?.id);return plugin?.artifact?plugin.artifact(run,name):null;}

export const applicationPlugins=()=>[...plugins.values()];
