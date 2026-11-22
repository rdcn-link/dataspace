"""Common-footprint statistics plus an independent algorithm in one bounded stage."""
import io,json,csv,sys,tempfile,zipfile,math,statistics
from pathlib import Path
import numpy as np,rasterio
from npp_dynamic import params,read_file,analysis,reference,bundle

def main(count):
 import xstream_operator as sdk
 if len(sys.argv)>1 and sys.argv[1] in ('infer','infer-worker'):
  sdk.run_inference(lambda inputs,parameters:sdk.result({'result':sdk.descriptor(['bytes'],['zip'],certainty='known')}));return
 real=sdk.OperatorContext
 with real() as ctx,tempfile.TemporaryDirectory(prefix='npp-final-') as temp:
  root=Path(temp);p=params(ctx,count);years=p['years'];path=root/'input.tif'
  with reference(ctx) as z:
   if json.loads(z.read('parameters.json'))!=p:raise ValueError('Reference binding mismatch')
   native=json.loads(z.read('native.json'));mask=z.read('mask.bin')
  if len(native)!=count:raise ValueError('Incomplete native reference')
  rows=[];common=[];checks=[];total=0
  for i,year in enumerate(years):
   digest,size=read_file(ctx,'y'+str(i).zfill(2),path);total+=size;r,_=analysis(path,year,mask,p,sdk,real);a=native[i]
   if digest!=a['inputHash'] or r['inputHash']!=a['inputHash'] or r['year']!=a['year'] or r['grid']!=a['grid']:raise ValueError('Input changed between native and final rereads')
   common.append(r);row=dict(year=year,nativeMean=a['areaWeightedMean'],commonMean=r['areaWeightedMean'],nativePixels=a['validPixels'],commonPixels=r['validPixels'],nativeAreaKm2=a['validAreaKm2'],commonAreaKm2=r['validAreaKm2'],coverageFraction=a['coverageFraction']);rows.append(row)
   # Reopen the selected source bytes and use a separate full-array/cosine algorithm.
   with rasterio.open(path) as d:
    values=d.read(1);valid=(d.read_masks(1)>0)&np.isfinite(values)&(values>=0);fixed=np.unpackbits(np.frombuffer(mask,dtype=np.uint8))[:values.size].reshape(values.shape).astype(bool)
    if np.any(fixed&~valid):raise ValueError('Invalid common footprint')
    weights=np.cos(np.deg2rad(d.transform.f+(np.arange(d.height)+.5)*d.transform.e))
    def mean(m):return float(np.dot(np.where(m,values,0).sum(axis=1,dtype=np.float64),weights)/np.dot(m.sum(axis=1),weights))
    n,c=mean(valid),mean(fixed)
    if int(valid.sum())!=row['nativePixels'] or int(fixed.sum())!=row['commonPixels'] or not math.isclose(n,row['nativeMean'],rel_tol=1e-10,abs_tol=1e-9) or not math.isclose(c,row['commonMean'],rel_tol=1e-10,abs_tol=1e-9):raise ValueError('Independent statistics mismatch')
    checks.append(dict(year=year,nativeMean=n,commonMean=c,pixelCountsMatch=True,inputHash=digest))
   path.unlink()
  x=np.array(years);y=np.array([r['commonMean'] for r in rows]);slope,intercept=np.polyfit(x,y,1);pred=slope*x+intercept;variance=float(((y-y.mean())**2).sum());r2=float(1-((y-pred)**2).sum()/variance) if variance else None
  mx=statistics.mean(years);ys=[r['commonMean'] for r in checks];my=statistics.mean(ys);independent=sum((a-mx)*(b-my) for a,b in zip(years,ys))/sum((a-mx)**2 for a in years)
  if not math.isclose(independent,slope,rel_tol=1e-9,abs_tol=1e-9):raise ValueError('Independent trend mismatch')
  report=dict(serviceId='svc-015',datasetId=p['datasetId'],synthetic=p['synthetic'],state='succeeded',unit='gC/m2/year',unitEvidence=p['unitEvidence'],bindingHash=p['bindingHash'],region=native[0]['region']+'; intersection of selected years',areaMethod=native[0]['areaMethod'],years=[years[0],years[-1]],commonPixels=rows[0]['commonPixels'],commonAreaKm2=rows[0]['commonAreaKm2'],firstMean=float(y[0]),lastMean=float(y[-1]),endpointChange=float(y[-1]-y[0]),endpointChangePercent=float((y[-1]/y[0]-1)*100) if y[0] else None,olsSlopePerYear=float(slope),olsR2=r2,minimumYear=int(x[y.argmin()]),maximumYear=int(x[y.argmax()]),records=rows,limitations=['Spherical-area approximation','Native valid footprint; no external administrative polygon','Descriptive trend; no causal or significance claim'])
  verification=dict(state='passed',synthetic=p['synthetic'],scope='Selected sources reread between native/final stages; final bytes reopened with independent cosine-latitude algorithm on owning DACP member',totalInputBytes=total,inputHashesMatch=True,sourceFileCount=count,analyzedYearCount=count,independentSlope=independent,checks=checks)
  for name,data in [('report.json',report),('verification.json',verification),('all-node-results.json',dict(native=native,common=common))]:(root/name).write_text(json.dumps(data,allow_nan=False))
  (root/'common-mask.bin').write_bytes(mask)
  with (root/'annual.csv').open('w',newline='') as f:
   w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
  import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
  fig,ax=plt.subplots(figsize=(11,5),constrained_layout=True);ax.plot(x,[r['nativeMean'] for r in rows],label='Annual native support',alpha=.5);ax.plot(x,y,'o-',label='Common valid support');ax.plot(x,pred,'--',label='Descriptive OLS trend');ax.set(xlabel='Year',ylabel='NPP (gC/m2/year)',title=('SYNTHETIC TEST' if p['synthetic'] else 'NPP annual analysis')+' / selected dataset');ax.grid(alpha=.25);ax.legend();fig.savefig(root/'annual.png',dpi=160)
  bundle(ctx,root,['report.json','verification.json','all-node-results.json','common-mask.bin','annual.csv','annual.png'])
