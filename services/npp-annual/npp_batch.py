import sys,io,json,tempfile,zipfile,csv
from pathlib import Path
import numpy as np
from npp_operator import main as analyze

def main(phase='native'):
 import xstream_operator as sdk
 if len(sys.argv)>1 and sys.argv[1] in ('infer','infer-worker'):
  sdk.run_inference(lambda inputs,params:sdk.result({'result':sdk.descriptor(['bytes'],['zip'],certainty='known')}));return
 RealContext=sdk.OperatorContext
 with RealContext() as ctx,tempfile.TemporaryDirectory(prefix='npp-batch-') as tmp:
  root=Path(tmp);paths={};inputs={}
  start=int(ctx.params.get('yearStart',2001));end=int(ctx.params.get('yearEnd',2024))
  if not 2001<=start<end<=2024:raise ValueError('Select at least two years within 2001..2024')
  selected=set(range(start,end+1))
  def receive(year,phase):
   path=root/f'{year}.tif'
   with path.open('wb') as f:
    for chunk in ctx.input('y'+str(year)).bytes():f.write(chunk)
   paths[year]=path
  native=[];shared=[];common=None;grid=None
  def run_one(year,mask=None):
   buffer=io.BytesIO()
   class Input:
    def __init__(self,name):self.name=name
    def bytes(self):
     if self.name=='mask':yield mask
     else:
      with paths[year].open('rb') as f:
       for chunk in iter(lambda:f.read(65536),b''):yield chunk
   class Context:
    params=dict(year=year)
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def input(self,name):return Input(name)
    def bytes_output(self,*args):return buffer
   sdk.OperatorContext=Context
   try:analyze(mask is not None)
   finally:sdk.OperatorContext=RealContext
   with zipfile.ZipFile(io.BytesIO(buffer.getvalue())) as z:
    report=json.loads(z.read('summary.json'));packed=z.read('valid-mask.bin') if mask is None else None
   return report,packed
  if phase=='native':
   for year in range(2001,2025):
    receive(year,'native');r,b=run_one(year);paths[year].unlink()
    if grid is None:grid=r['grid']
    if grid!=r['grid']:raise ValueError('Grid mismatch')
    native.append(r)
    if year in selected:
     bits=np.frombuffer(b,dtype=np.uint8).copy();common=bits if common is None else np.bitwise_and(common,bits)
   b=io.BytesIO()
   with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
    z.writestr('parameters.json',json.dumps(dict(yearStart=start,yearEnd=end)));z.writestr('native-results.json',json.dumps(native));z.writestr('common-mask.bin',common.tobytes())
   ctx.bytes_output('result','zip').write(b.getvalue());return
  with zipfile.ZipFile(io.BytesIO(b''.join(ctx.input('reference').bytes()))) as reference:
   if json.loads(reference.read('parameters.json'))!=dict(yearStart=start,yearEnd=end):raise ValueError('Reference parameters mismatch')
   native=json.loads(reference.read('native-results.json'));common=np.frombuffer(reference.read('common-mask.bin'),dtype=np.uint8).copy()
  if len(native)!=24:raise ValueError('Incomplete native reference')
  for year in range(2001,2025):
   receive(year,'common')
   if year in selected:
    r,_=run_one(year,common.tobytes());shared.append(r)
   paths[year].unlink()
  rows=[]
  for a,b in zip([n for n in native if n['year'] in selected],shared):
   if a['inputHash']!=b['inputHash']:raise ValueError('Input changed')
   rows.append(dict(year=a['year'],nativeMean=a['areaWeightedMean'],commonMean=b['areaWeightedMean'],nativePixels=a['validPixels'],commonPixels=b['validPixels'],nativeAreaKm2=a['validAreaKm2'],commonAreaKm2=b['validAreaKm2'],coverageFraction=a['coverageFraction']))
  x=np.array([r['year'] for r in rows]);y=np.array([r['commonMean'] for r in rows]);slope,intercept=np.polyfit(x,y,1);pred=slope*x+intercept
  summary=dict(serviceId='svc-015',datasetId='84df859aaead4ef7acaaa8d6109d9e4a',synthetic=False,state='succeeded',unit='gC/m2/year',unitEvidence='Source catalog DOI 10.57760/sciencedb.0154q introduction; raster lacks unit tag',region=native[0]['region']+'; common support is the intersection of all 24 years',areaMethod=native[0]['areaMethod'],years=[start,end],unionJobs=2,node='a',independentPhysicalHosts=False,commonPixels=rows[0]['commonPixels'],commonAreaKm2=rows[0]['commonAreaKm2'],firstMean=float(y[0]),lastMean=float(y[-1]),endpointChange=float(y[-1]-y[0]),endpointChangePercent=float((y[-1]/y[0]-1)*100),olsSlopePerYear=float(slope),olsR2=float(1-((y-pred)**2).sum()/((y-y.mean())**2).sum()),minimumYear=int(x[y.argmin()]),maximumYear=int(x[y.argmax()]),records=rows,limitations=['Spherical pixel areas; not equal-area reprojection or ellipsoid integration','Descriptive trend, no causal attribution or significance claim','Single owning node; not cross-institution validation','Finite nonnegative native mask; zeros retained'])
  (root/'report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));(root/'all-node-results.json').write_text(json.dumps(dict(native=native,common=shared),indent=2));(root/'common-mask.bin').write_bytes(common.tobytes())
  with (root/'annual.csv').open('w',newline='') as f:
   w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
  import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
  fig,ax=plt.subplots(figsize=(11,5),constrained_layout=True);ax.plot(x,[r['nativeMean'] for r in rows],label='Annual native support',alpha=.5);ax.plot(x,y,'o-',label='Common valid support');ax.plot(x,pred,'--',label='Descriptive OLS trend');ax.set(xlabel='Year',ylabel='NPP (gC/m2/year)',title='Real CASA NPP / native dataset vegetation footprint');ax.legend();ax.grid(alpha=.25);fig.savefig(root/'annual.png',dpi=160)
  b=io.BytesIO()
  with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
   for name in ('report.json','all-node-results.json','common-mask.bin','annual.csv','annual.png'):z.write(root/name,name)
  ctx.bytes_output('result','zip').write(b.getvalue())
if __name__=='__main__':main()
