"""Bounded generic annual-NPP operators. Dataset semantics come from an adapter."""
import io,json,csv,math,statistics,hashlib,tempfile,zipfile,sys
from pathlib import Path
import numpy as np,rasterio
from rasterio.windows import Window
R=6371008.8

def dump(root,name,value):(root/name).write_text(json.dumps(value,ensure_ascii=False,allow_nan=False))
def read(ctx,name,path):
 h=hashlib.sha256();n=0
 with path.open('wb') as f:
  for b in ctx.input(name).bytes():
   n+=len(b)
   if n>134217728:raise ValueError('Input exceeds 128MiB contract')
   h.update(b);f.write(b)
 return h.hexdigest(),n

def header(d,adapter,region):
 if d.driver!='GTiff' or d.count!=1 or d.width*d.height>50000000:raise ValueError('Requires a single-band GeoTIFF, <=50 million pixels')
 if str(d.crs)!='EPSG:4326' or d.transform.b or d.transform.d or d.transform.a<=0 or d.transform.e>=0:raise ValueError('Requires north-up EPSG:4326; no implicit reprojection')
 if d.scales!=(1.0,) or d.offsets!=(0.0,):raise ValueError('Scaled/offset TIFF is unsupported; explicit normalization is required')
 if not (-180<=d.bounds.left<d.bounds.right<=180 and -90<=d.bounds.bottom<d.bounds.top<=90):raise ValueError('Geographic bounds unsupported')
 if adapter['timeScale']!='annual' or adapter['variable']!='NPP' or adapter['unit']!='gC/m2/year' or adapter['band']!=1 or adapter['unitConversion']!='identity' or adapter['nodataRule']!='gdal-mask+finite+nonnegative':raise ValueError('Unsupported adapter mapping/unit/time scale')
 col,row,w,h=0,0,d.width,d.height
 if region['mode']=='bbox':
  west,south,east,north=region['bbox'];b=d.bounds
  if west<b.left or east>b.right or south<b.bottom or north>b.top:raise ValueError('Region exceeds dataset bounds; silent clipping is disabled')
  xs=d.transform.c+(np.arange(d.width)+.5)*d.transform.a;ys=d.transform.f+(np.arange(d.height)+.5)*d.transform.e
  xx=np.flatnonzero((xs>=west)&(xs<east));yy=np.flatnonzero((ys>south)&(ys<=north))
  if not len(xx) or not len(yy):raise ValueError('Region contains no pixel centers')
  col,row,w,h=int(xx[0]),int(yy[0]),len(xx),len(yy)
 win=Window(col,row,w,h);t=d.window_transform(win);bounds=rasterio.windows.bounds(win,d.transform)
 return dict(format='GeoTIFF',variable=adapter['variable'],variableEvidence='adapter declaration; not inferred from pixel values',timeScale='annual',crs=str(d.crs),dtype=d.dtypes[0],bandCount=d.count,band=1,unit=adapter['unit'],unitEvidence=adapter['unitEvidence'],scale=d.scales[0],offset=d.offsets[0],nodata=d.nodata if d.nodata is None or math.isfinite(d.nodata) else 'NaN',nodataRule=adapter['nodataRule'],sourceGrid=dict(width=d.width,height=d.height,transform=list(d.transform),crs=str(d.crs)),bounds=list(d.bounds),roiGrid=dict(width=w,height=h,transform=list(t),crs=str(d.crs)),roiBounds=list(bounds),window=[col,row,w,h])

def stats(d,meta,common=None):
 col,row,w,h=meta['window'];t=d.window_transform(Window(col,row,w,h));mask=np.zeros((h,w),dtype=bool);weighted=area=rectangle=0.;count=zeros=negative=0
 fixed=np.unpackbits(np.frombuffer(common,dtype=np.uint8))[:h*w].reshape(h,w).astype(bool) if common is not None else None
 for top in range(0,h,128):
  n=min(128,h-top);win=Window(col,row+top,w,n);a=d.read(1,window=win).astype(np.float64);valid=(d.read_masks(1,window=win)>0)&np.isfinite(a);negative+=int((valid&(a<0)).sum());valid&=a>=0
  if fixed is not None:
   if np.any(fixed[top:top+n]&~valid):raise ValueError('Common mask includes missing/invalid values')
   valid=fixed[top:top+n]
  mask[top:top+n]=valid;edges=t.f+np.arange(top,top+n+1)*t.e;weight=(R*R*abs(math.radians(t.a))*np.abs(np.sin(np.deg2rad(edges[:-1]))-np.sin(np.deg2rad(edges[1:]))))[:,None]
  rectangle+=float(weight.sum()*w);area+=float((valid*weight).sum());weighted+=float((np.where(valid,a,0)*weight).sum());count+=int(valid.sum());zeros+=int((valid&(a==0)).sum())
 if not count or area<=0:raise ValueError('No valid NPP pixels in selected region/common footprint')
 return dict(mean=weighted/area,pixels=count,areaKm2=area/1e6,coverageFraction=area/rectangle,validZeroPixels=zeros,excludedNegativePixels=negative),np.packbits(mask).tobytes()

def independent(d,meta,mask):
 win=Window(*meta['window']);a=d.read(1,window=win);valid=(d.read_masks(1,window=win)>0)&np.isfinite(a)&(a>=0);fixed=np.unpackbits(np.frombuffer(mask,dtype=np.uint8))[:a.size].reshape(a.shape).astype(bool)
 if np.any(fixed&~valid):raise ValueError('Independent invalid common footprint')
 t=d.window_transform(win);weights=np.cos(np.deg2rad(t.f+(np.arange(a.shape[0])+.5)*t.e))
 def mean(m):return float(np.dot(np.where(m,a,0).sum(axis=1,dtype=np.float64),weights)/np.dot(m.sum(axis=1),weights))
 return dict(nativeMean=mean(valid),commonMean=mean(fixed),nativePixels=int(valid.sum()),commonPixels=int(fixed.sum()))

def bundle(ctx,root,names):
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
  for name in names:z.write(root/name,name)
 ctx.bytes_output('result','zip').write(b.getvalue())

def main(phase,count):
 import xstream_operator as sdk
 if len(sys.argv)>1 and sys.argv[1] in ('infer','infer-worker'):
  sdk.run_inference(lambda inputs,parameters:sdk.result({'result':sdk.descriptor(['bytes'],['zip'],certainty='known')}));return
 with sdk.OperatorContext() as ctx,tempfile.TemporaryDirectory(prefix='npp-generic-') as temp:
  root=Path(temp);p=dict(ctx.params);years=p['years'];adapter=p['adapter'];region=p['region'];path=root/'input.tif'
  if len(years)!=count or years!=list(range(years[0],years[-1]+1)) or not 2<=count<=24:raise ValueError('Requires 2..24 complete consecutive years')
  if phase in ('inspect','prepare'):
   rows=[];combined=None;grid=None
   for i,year in enumerate(years):
    digest,size=read(ctx,'y'+str(i).zfill(2),path)
    if phase=='prepare' and p['expectedHashes'].get(str(year))!=digest:raise ValueError('Input changed after inspection; inspect again')
    with rasterio.open(path) as d:
     h=header(d,adapter,region)
     if grid is None:grid=h['sourceGrid']
     if h['sourceGrid']!=grid:raise ValueError('Year grids differ; resampling is not implemented')
     r=dict(year=year,inputHash=digest,inputBytes=size,metadata=h)
     if phase=='prepare':
      r['statistics'],packed=stats(d,h);bits=np.frombuffer(packed,dtype=np.uint8);combined=bits.copy() if combined is None else np.bitwise_and(combined,bits)
     rows.append(r)
    path.unlink()
   dump(root,'parameters.json',p);dump(root,'inspection.json',dict(state='passed',years=years,files=rows,mapping=h,region=region))
   if phase=='inspect':bundle(ctx,root,['inspection.json']);return
   dump(root,'native.json',rows);(root/'mask.bin').write_bytes(combined.tobytes());bundle(ctx,root,['parameters.json','native.json','mask.bin']);return
  reference=b''.join(ctx.input('reference').bytes())
  if len(reference)>16777216:raise ValueError('Reference exceeds 16MiB')
  with zipfile.ZipFile(io.BytesIO(reference)) as z:
   if json.loads(z.read('parameters.json'))!=p:raise ValueError('Task parameters changed between stages')
   native=json.loads(z.read('native.json'));mask=z.read('mask.bin')
  rows=[];checks=[];total=0;observations=[]
  for i,year in enumerate(years):
   digest,size=read(ctx,'y'+str(i).zfill(2),path);total+=size;a=native[i]
   if digest!=a['inputHash'] or digest!=p['expectedHashes'][str(year)]:raise ValueError('Source content changed between passes')
   with rasterio.open(path) as d:
    h=header(d,adapter,region)
    if h!=a['metadata']:raise ValueError('Source metadata changed')
    r,_=stats(d,h,mask);n=a['statistics'];check=independent(d,h,mask)
    if check['nativePixels']!=n['pixels'] or check['commonPixels']!=r['pixels'] or not math.isclose(check['nativeMean'],n['mean'],rel_tol=1e-10,abs_tol=1e-9) or not math.isclose(check['commonMean'],r['mean'],rel_tol=1e-10,abs_tol=1e-9):raise ValueError('Independent regional statistics mismatch')
    checks.append(dict(year=year,inputHash=digest,**check));observations.append(dict(year=year,native=n,common=r));row=dict(year=year,nativeMean=n['mean'],commonMean=r['mean'],nativePixels=n['pixels'],commonPixels=r['pixels'],nativeAreaKm2=n['areaKm2'],commonAreaKm2=r['areaKm2'],validZeroPixels=n['validZeroPixels'])
    if 'interannual-change' in p['methods']:
     row['changeFromPrevious']=row['commonMean']-rows[-1]['commonMean'] if rows else None;row['percentChangeFromPrevious']=(row['commonMean']/rows[-1]['commonMean']-1)*100 if rows and rows[-1]['commonMean'] else None
    rows.append(row)
    if i==count-1:
     win=Window(*h['window']);step=max(1,math.ceil(max(win.width,win.height)/400));values=d.read(1,window=win)[::step,::step];fixed=np.unpackbits(np.frombuffer(mask,dtype=np.uint8))[:int(win.width*win.height)].reshape(int(win.height),int(win.width)).astype(bool)[::step,::step];view=np.ma.array(values,mask=~fixed)
   path.unlink()
  x=np.array(years);y=np.array([r['commonMean'] for r in rows]);slope=r2=None
  if 'linear-trend' in p['methods']:
   if count<3:raise ValueError('Trend requires at least three years')
   slope,intercept=np.polyfit(x,y,1);prediction=slope*x+intercept;variance=float(((y-y.mean())**2).sum());r2=float(1-((y-prediction)**2).sum()/variance) if variance else None
   mx=statistics.mean(years);ys=[c['commonMean'] for c in checks];my=statistics.mean(ys);verifiedSlope=sum((a-mx)*(b-my) for a,b in zip(years,ys))/sum((a-mx)**2 for a in years)
   if not math.isclose(slope,verifiedSlope,rel_tol=1e-9,abs_tol=1e-9):raise ValueError('Independent trend mismatch')
   slope=float(slope)
  change='interannual-change' in p['methods']
  report=dict(serviceId='svc-015',templateId='npp-spatiotemporal',templateVersion='2.0',state='succeeded',datasetId=adapter['datasetId'],synthetic=adapter['dataKind']=='synthetic',adapterId=adapter['id'],adapterVersion=adapter['version'],methods=p['methods'],region=region,spatial=h,unit=adapter['unit'],unitEvidence=adapter['unitEvidence'],years=[years[0],years[-1]],firstMean=float(y[0]),lastMean=float(y[-1]),commonPixels=rows[0]['commonPixels'],commonAreaKm2=rows[0]['commonAreaKm2'],endpointChange=float(y[-1]-y[0]) if change else None,endpointChangePercent=float((y[-1]/y[0]-1)*100) if change and y[0] else None,olsSlopePerYear=slope,olsR2=r2,minimumYear=int(x[y.argmin()]),maximumYear=int(x[y.argmax()]),records=rows,limitations=['Spherical-area approximation R=6371008.8m','Pixel-center rectangle; no administrative polygon','No implicit unit conversion/reprojection','Descriptive OLS only; no significance/causal claim'])
  verification=dict(state='passed',scope='Independent cosine-latitude recomputation on selected source bytes and region',sourceFileCount=count,analyzedYearCount=count,totalInputBytes=total,inputHashesMatch=True,checks=checks,trendChecked='linear-trend' in p['methods'])
  dump(root,'report.json',report);dump(root,'verification.json',verification);dump(root,'all-node-results.json',observations);(root/'common-mask.bin').write_bytes(mask)
  with (root/'annual.csv').open('w',newline='') as f:
   w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
  import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
  fig,ax=plt.subplots(figsize=(10,4),constrained_layout=True);ax.plot(x,y,'o-',label='Common valid footprint')
  if slope is not None:ax.plot(x,prediction,'--',label='Descriptive OLS')
  ax.set(xlabel='Year',ylabel='NPP (gC/m2/year)',title='SYNTHETIC VALIDATION' if report['synthetic'] else 'Selected annual NPP data');ax.grid(alpha=.25);ax.legend();fig.savefig(root/'annual.png',dpi=150);plt.close(fig)
  fig,ax=plt.subplots(figsize=(9,4),constrained_layout=True);west,south,east,north=h['roiBounds'];im=ax.imshow(view,extent=[west,east,south,north],origin='upper',cmap='YlGn');ax.set(xlabel='Longitude (EPSG:4326)',ylabel='Latitude',title=('SYNTHETIC / ' if report['synthetic'] else '')+str(years[-1])+' NPP / common valid footprint');fig.colorbar(im,ax=ax,label='gC/m2/year');fig.savefig(root/'map.png',dpi=150);plt.close(fig)
  dump(root,'map.json',dict(year=years[-1],bounds=h['roiBounds'],crs='EPSG:4326',sampling='nearest display sampling, not analysis resampling',width=view.shape[1],height=view.shape[0],values=[[None if view.mask[j,k] else float(view.data[j,k]) for k in range(view.shape[1])] for j in range(view.shape[0])]))
  bundle(ctx,root,['report.json','verification.json','all-node-results.json','common-mask.bin','annual.csv','annual.png','map.png','map.json'])
