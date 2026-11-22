"""Dataset-bound NPP operators; bytes stay on the selected owning DACP member."""
import io,json,csv,sys,tempfile,zipfile,hashlib,math,statistics
from pathlib import Path
import numpy as np,rasterio
from npp_operator import main as raster_statistics
MAX_INPUT=128*1024*1024

def params(ctx,count):
 p=dict(ctx.params);years=p['years']
 if len(years)!=count or len(set(years))!=count or years!=sorted(years) or any(not isinstance(y,int) or isinstance(y,bool) or not 1900<=y<=2100 for y in years):raise ValueError('Invalid years/ports')
 if not isinstance(p['synthetic'],bool):raise ValueError('Dataset kind must be explicit')
 return p

def read_file(ctx,port,path):
 digest=hashlib.sha256();size=0
 with path.open('wb') as f:
  for chunk in ctx.input(port).bytes():
   size+=len(chunk)
   if size>MAX_INPUT:raise ValueError('Raster exceeds bounded 128MiB input contract')
   digest.update(chunk);f.write(chunk)
 return digest.hexdigest(),size

def analysis(path,year,common,p,sdk,real):
 with rasterio.open(path) as header:
  if header.width*header.height>50000000:raise ValueError('Raster exceeds 50 million pixel contract')
  if header.scales!=(1.0,) or header.offsets!=(0.0,):raise ValueError('Scaled/offset rasters require an explicit normalization adapter')
  if min(header.bounds.bottom,header.bounds.top)<-90 or max(header.bounds.bottom,header.bounds.top)>90:raise ValueError('Invalid geographic latitude bounds')
 out=io.BytesIO()
 class Input:
  def __init__(self,name):self.name=name
  def bytes(self):
   if self.name=='mask':yield common
   else:
    with path.open('rb') as f:
     for chunk in iter(lambda:f.read(65536),b''):yield chunk
 class Context:
  params={'year':year}
  def __enter__(self):return self
  def __exit__(self,*args):pass
  def input(self,name):return Input(name)
  def bytes_output(self,*args):return out
 sdk.OperatorContext=Context
 try:raster_statistics(common is not None)
 finally:sdk.OperatorContext=real
 with zipfile.ZipFile(io.BytesIO(out.getvalue())) as z:
  r=json.loads(z.read('summary.json'));mask=z.read('valid-mask.bin') if common is None else None
 r['inputBytes']=path.stat().st_size;r['unitEvidence']=p['unitEvidence'];r['synthetic']=p['synthetic']
 return r,mask

def bundle(ctx,folder,names):
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
  for name in names:z.write(folder/name,name)
 ctx.bytes_output('result','zip').write(out.getvalue())

def reference(ctx):
 raw=b''.join(ctx.input('reference').bytes())
 if len(raw)>32*1024*1024:raise ValueError('Reference too large')
 return zipfile.ZipFile(io.BytesIO(raw))

def main(phase,count):
 import xstream_operator as sdk
 if len(sys.argv)>1 and sys.argv[1] in ('infer','infer-worker'):
  sdk.run_inference(lambda inputs,parameters:sdk.result({'result':sdk.descriptor(['bytes'],['zip'],certainty='known')}));return
 real=sdk.OperatorContext
 with real() as ctx,tempfile.TemporaryDirectory(prefix='npp-bound-') as temp:
  root=Path(temp);p=params(ctx,count);years=p['years'];path=root/'input.tif'
  if phase=='native':
   reports=[];mask=None;grid=None
   for i,year in enumerate(years):
    read_file(ctx,'y'+str(i).zfill(2),path);r,packed=analysis(path,year,None,p,sdk,real);path.unlink()
    if r['grid']['width']*r['grid']['height']>50000000:raise ValueError('Raster exceeds 50 million pixel contract')
    if grid is None:grid=r['grid']
    if r['grid']!=grid:raise ValueError('Year grids differ; explicit resampling is required')
    reports.append(r);bits=np.frombuffer(packed,dtype=np.uint8).copy();mask=bits if mask is None else np.bitwise_and(mask,bits)
   (root/'parameters.json').write_text(json.dumps(p));(root/'native.json').write_text(json.dumps(reports));(root/'mask.bin').write_bytes(mask.tobytes());bundle(ctx,root,['parameters.json','native.json','mask.bin']);return
  if phase=='common':
   with reference(ctx) as z:
    if json.loads(z.read('parameters.json'))!=p:raise ValueError('Reference binding mismatch')
    native=json.loads(z.read('native.json'));mask=z.read('mask.bin')
   if len(native)!=count:raise ValueError('Incomplete reference')
   common=[];rows=[]
   for i,year in enumerate(years):
    read_file(ctx,'y'+str(i).zfill(2),path);r,_=analysis(path,year,mask,p,sdk,real);path.unlink();a=native[i]
    if r['year']!=a['year'] or r['inputHash']!=a['inputHash'] or r['grid']!=a['grid']:raise ValueError('Input changed between passes')
    common.append(r);rows.append(dict(year=year,nativeMean=a['areaWeightedMean'],commonMean=r['areaWeightedMean'],nativePixels=a['validPixels'],commonPixels=r['validPixels'],nativeAreaKm2=a['validAreaKm2'],commonAreaKm2=r['validAreaKm2'],coverageFraction=a['coverageFraction']))
   x=np.array(years);y=np.array([r['commonMean'] for r in rows]);slope,intercept=np.polyfit(x,y,1);pred=slope*x+intercept;variance=float(((y-y.mean())**2).sum());r2=float(1-((y-pred)**2).sum()/variance) if variance else None
   r=dict(serviceId='svc-015',datasetId=p['datasetId'],synthetic=p['synthetic'],state='computed',unit='gC/m2/year',unitEvidence=p['unitEvidence'],bindingHash=p['bindingHash'],region=native[0]['region']+'; intersection of selected years',areaMethod=native[0]['areaMethod'],years=[years[0],years[-1]],commonPixels=rows[0]['commonPixels'],commonAreaKm2=rows[0]['commonAreaKm2'],firstMean=float(y[0]),lastMean=float(y[-1]),endpointChange=float(y[-1]-y[0]),endpointChangePercent=float((y[-1]/y[0]-1)*100) if y[0] else None,olsSlopePerYear=float(slope),olsR2=r2,minimumYear=int(x[y.argmin()]),maximumYear=int(x[y.argmax()]),records=rows,limitations=['Spherical-area approximation','Native valid footprint; no external administrative polygon','Descriptive trend; no causal or significance claim'])
   (root/'report.json').write_text(json.dumps(r,allow_nan=False));(root/'all-node-results.json').write_text(json.dumps(dict(native=native,common=common)));(root/'common-mask.bin').write_bytes(mask)
   with (root/'annual.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
   import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
   fig,ax=plt.subplots(figsize=(11,5),constrained_layout=True);ax.plot(x,[r['nativeMean'] for r in rows],label='Annual native support',alpha=.5);ax.plot(x,y,'o-',label='Common valid support');ax.plot(x,pred,'--',label='Descriptive OLS trend');ax.set(xlabel='Year',ylabel='NPP (gC/m2/year)',title=('SYNTHETIC TEST' if p['synthetic'] else 'NPP annual analysis')+' / selected dataset');ax.grid(alpha=.25);ax.legend();fig.savefig(root/'annual.png',dpi=160)
   (root/'parameters.json').write_text(json.dumps(p));bundle(ctx,root,['parameters.json','report.json','all-node-results.json','common-mask.bin','annual.csv','annual.png']);return
  with reference(ctx) as z:
   if json.loads(z.read('parameters.json'))!=p:raise ValueError('Verification binding mismatch')
   report=json.loads(z.read('report.json'));details=json.loads(z.read('all-node-results.json'));mask=z.read('common-mask.bin')
   for name in ('annual.csv','annual.png','all-node-results.json','common-mask.bin'):(root/name).write_bytes(z.read(name))
  checks=[];total=0
  for i,year in enumerate(years):
   digest,size=read_file(ctx,'y'+str(i).zfill(2),path);total+=size;expected=details['native'][i];row=report['records'][i]
   if digest!=expected['inputHash'] or year!=expected['year']:raise ValueError('Source changed before independent verification')
   with rasterio.open(path) as d:
    a=d.read(1);valid=(d.read_masks(1)>0)&np.isfinite(a)&(a>=0);fixed=np.unpackbits(np.frombuffer(mask,dtype=np.uint8))[:a.size].reshape(a.shape).astype(bool)
    if np.any(fixed&~valid):raise ValueError('Invalid common footprint')
    weights=np.cos(np.deg2rad(d.transform.f+(np.arange(d.height)+.5)*d.transform.e))
    def mean(m):return float(np.dot(np.where(m,a,0).sum(axis=1,dtype=np.float64),weights)/np.dot(m.sum(axis=1),weights))
    n,c=mean(valid),mean(fixed)
    if int(valid.sum())!=row['nativePixels'] or int(fixed.sum())!=row['commonPixels'] or not math.isclose(n,row['nativeMean'],rel_tol=1e-10,abs_tol=1e-9) or not math.isclose(c,row['commonMean'],rel_tol=1e-10,abs_tol=1e-9):raise ValueError('Independent statistics mismatch')
    checks.append(dict(year=year,nativeMean=n,commonMean=c,pixelCountsMatch=True,inputHash=digest))
   path.unlink()
  mx=statistics.mean(years);ys=[r['commonMean'] for r in checks];my=statistics.mean(ys);slope=sum((x-mx)*(y-my) for x,y in zip(years,ys))/sum((x-mx)**2 for x in years)
  if not math.isclose(slope,report['olsSlopePerYear'],rel_tol=1e-9,abs_tol=1e-9):raise ValueError('Trend verification mismatch')
  verification=dict(state='passed',synthetic=p['synthetic'],scope='Independent selected-file rereads and cosine-latitude statistics on owning DACP member',totalInputBytes=total,inputHashesMatch=True,sourceFileCount=count,analyzedYearCount=count,independentSlope=slope,checks=checks)
  report['state']='succeeded';(root/'report.json').write_text(json.dumps(report,allow_nan=False));(root/'verification.json').write_text(json.dumps(verification,allow_nan=False));bundle(ctx,root,['report.json','verification.json','all-node-results.json','common-mask.bin','annual.csv','annual.png'])
