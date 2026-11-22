/* Pure selection functions, reusable for station and environmental time-series views. */
const OceanMath = (() => {
  const valid = v => typeof v === 'number' && Number.isFinite(v);
  const nearest = (values, value) => values.reduce((best, v, i) => Math.abs(v-value)<Math.abs(values[best]-value)?i:best, 0);
  const at = (d, name, t, z, y, x) => d.variables[name].values[((t*d.z.length+z)*d.y.length+y)*d.x.length+x];
  const profile = (d, name, t, y, x) => d.z.map((z,i)=>[at(d,name,t,i,y,x),z]);
  const mean = (d,name,t,z,box) => {
    let sum=0, weight=0, count=0;
    d.y.forEach((y,iy)=>d.x.forEach((x,ix)=>{
      if (x<box[0]||x>box[2]||y<box[1]||y>box[3]) return;
      const value=at(d,name,t,z,iy,ix), w=Math.cos(y*Math.PI/180);
      if(valid(value)){sum+=value*w;weight+=w;count++;}
    }));
    return {value:weight>0?sum/weight:null,count};
  };
  const series = (d,name,z,box) => d.times.map((_,t)=>mean(d,name,t,z,box).value);
  const track = (d,line,n=100) => {
    const dx=((line[1][0]-line[0][0]+540)%360)-180;
    let distance=0, previous=null;
    return Array.from({length:n},(_,i)=>{
      const lon=line[0][0]+dx*i/(n-1),lat=line[0][1]+(line[1][1]-line[0][1])*i/(n-1), rad=Math.PI/180;
      if(previous){const h=Math.sin((lat-previous[1])*rad/2)**2+Math.cos(lat*rad)*Math.cos(previous[1]*rad)*Math.sin((lon-previous[0])*rad/2)**2;distance+=6371.0088*2*Math.asin(Math.sqrt(Math.min(1,h)));}
      previous=[lon,lat]; const center=(d.x[0]+d.x.at(-1))/2, mapped=center+((lon-center+540)%360)-180;
      return {lon,lat,distance,ix:nearest(d.x,mapped),iy:nearest(d.y,lat),inside:mapped>=d.x[0]&&mapped<=d.x.at(-1)&&lat>=d.y[0]&&lat<=d.y.at(-1)};
    });
  };
  const section = (d,name,t,line) => {const points=track(d,line);return {points,values:d.z.map((_,z)=>points.map(p=>p.inside?at(d,name,t,z,p.iy,p.ix):null))};};
  const ts = (d,temp,salt,t,box) => {
    const pairs=[];
    d.z.forEach((depth,z)=>d.y.forEach((y,iy)=>d.x.forEach((x,ix)=>{
      if(x<box[0]||x>box[2]||y<box[1]||y>box[3])return;
      const a=at(d,temp,t,z,iy,ix),b=at(d,salt,t,z,iy,ix);
      if(valid(a)&&valid(b))pairs.push([b,a,depth]);
    })));
    return pairs;
  };
  return {valid,nearest,at,profile,mean,series,track,section,ts};
})();
if(typeof module!=='undefined')module.exports=OceanMath;
