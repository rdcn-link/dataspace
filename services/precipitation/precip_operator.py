"""Generic dekadal precipitation ZIP/GeoTIFF analysis, immutable operator 1.1."""
import io,json,csv,math,re,calendar,hashlib,tempfile,zipfile
from pathlib import Path
import numpy as np,rasterio

def analyze(raw,p,out):
 if len(raw)>134217728:raise ValueError('Archive exceeds 128MiB')
 if set(p)!={'yearStart','yearEnd','frequency','region','variable','unit','synthetic'}:raise ValueError('Unexpected/missing parameters')
 if type(p['synthetic'])!=bool:raise ValueError('Invalid source classification')
 y0,y1=p['yearStart'],p['yearEnd'];freq=p['frequency'];region=p['region']
 if type(y0)!=int or type(y1)!=int or not 1900<=y0<=y1<=2100 or y1-y0>29:raise ValueError('Invalid years; maximum 30')
 if freq not in ('monthly','seasonal','annual'):raise ValueError('Unsupported aggregation method')
 if p['unit']!='mm' or p['variable']!='prec':raise ValueError('Requires explicitly mapped prec / mm / dekadal accumulated depth')
 if not isinstance(region,dict) or region.get('mode') not in ('full','bbox') or set(region)-{'mode','bbox'}:raise ValueError('Invalid region')
 if region['mode']=='bbox':
  b=region.get('bbox',[])
  if len(b)!=4 or any(type(v) not in (int,float) or not math.isfinite(v) for v in b) or not (-180<=b[0]<b[2]<=180 and -90<=b[1]<b[3]<=90):raise ValueError('Invalid bounding box')
 rows=[];groups={};hashes={};metadata=None;selected=[];grid=None;roi=None;weights=None;lastmap=None
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  if len(z.infolist())>5000 or sum(i.file_size for i in z.infolist())>536870912:raise ValueError('Archive expanded size/count exceeds contract')
  dates={}
  for name in z.namelist():
   if not name.lower().endswith(('.tif','.tiff')):continue
   m=re.fullmatch(r'(?:[^/]+/)*(\d{4})_(\d{2})_(01|11|21)_Pcp\.tif',name)
   if not m:raise ValueError('TIFF filename does not follow YYYY_MM_DD_Pcp.tif')
   date=tuple(map(int,m.groups()))
   if not 1<=date[1]<=12:raise ValueError('Invalid month')
   if date in dates:raise ValueError('Duplicate dekad')
   dates[date]=name
  expected=[(y,m,d) for y in range(y0,y1+1) for m in range(1,13) for d in (1,11,21)]
  if any(t not in dates for t in expected):raise ValueError('Selected years missing dekads; no zero fill')
  for y,m,d in expected:
   name=dates[(y,m,d)];content=z.read(name);hashes[name]=hashlib.sha256(content).hexdigest()
   if len(content)>16777216:raise ValueError('TIFF exceeds 16MiB')
   with rasterio.MemoryFile(content) as mem:
    with mem.open() as ds:
     if ds.driver!='GTiff' or ds.count!=1 or ds.width*ds.height>1000000 or str(ds.crs)!='EPSG:4326' or ds.transform.b or ds.transform.d or ds.transform.a<=0 or ds.transform.e>=0:raise ValueError('Requires <=1m pixel single-band north-up EPSG:4326 TIFF')
     if ds.scales!=(1.,) or ds.offsets!=(0.,):raise ValueError('Scale/offset conversion unsupported')
     tags=ds.tags();date=f'{y:04}-{m:02}-{d:02}'
     if tags.get('units')!=p['unit'] or tags.get('variable')!=p['variable'] or tags.get('time')!=date or tags.get('long_name')!='dekadal precipitation':raise ValueError('Unit/variable/time/accumulation mapping inconsistent with file tags')
     g=(ds.width,ds.height,str(ds.crs),tuple(ds.transform),ds.nodata)
     if grid is None:
      
      if ds.width*ds.height*len(expected)>30000000:raise ValueError('Selected pixel-time workload exceeds 30 million')
      grid=g;xs=ds.transform.c+(np.arange(ds.width)+.5)*ds.transform.a;ys=ds.transform.f+(np.arange(ds.height)+.5)*ds.transform.e
      roi=np.ones((ds.height,ds.width),bool)
      if region['mode']=='bbox':
       b=region['bbox'];bounds=ds.bounds
       if b[0]<bounds.left or b[1]<bounds.bottom or b[2]>bounds.right or b[3]>bounds.top:raise ValueError('Region outside dataset; no silent clipping')
       roi=(ys[:,None]>=b[1])&(ys[:,None]<=b[3])&(xs[None,:]>=b[0])&(xs[None,:]<=b[2])
      if not roi.any():raise ValueError('Region has no pixel centers')
      weights=np.broadcast_to(np.cos(np.deg2rad(ys))[:,None],roi.shape)
      metadata=dict(format='GeoTIFF ZIP',crs=str(ds.crs),bounds=list(ds.bounds),width=ds.width,height=ds.height,nodata=ds.nodata,scale=1,offset=0,unit='mm',variable='prec',timeScale='dekadal accumulated depth',region=region)
     elif g!=grid:raise ValueError('Spatial grids/NoData differ; no resampling')
     a=ds.read(1,masked=True);valid=~np.ma.getmaskarray(a)&np.isfinite(a.data)&(a.data>=0)&roi;v=a.data.astype('float64')
     if not valid.any():raise ValueError('No valid pixels in selected dekad')
     key=f'{y:04}-{m:02}' if freq=='monthly' else f'{y:04}-Q{(m-1)//3+1}' if freq=='seasonal' else str(y)
     # Calendar quarters Jan-Mar etc.; no cross-year meteorological winter.
     if key not in groups:groups[key]=dict(total=np.zeros(v.shape),valid=roi.copy(),parts=[],zero=0)
     t=groups[key];t['total']+=np.where(valid,v,0);t['valid']&=valid;t['parts'].append((name,valid.copy()));selected.append(name)
  checks=[]
  for key,t in groups.items():
   mask=t['valid'];a=t['total'];n=int(mask.sum())
   if not n:raise ValueError('No complete valid pixels for aggregation period')
   mean=float(np.average(a[mask],weights=weights[mask]));minimum=float(a[mask].min());maximum=float(a[mask].max())
   # Independent pass: reread original bytes, independently accumulate selected complete pixels.
   independent=np.zeros(n,dtype='float64')
   for name,_ in t['parts']:
    with rasterio.MemoryFile(z.read(name)) as mem:
     with mem.open() as ds:independent+=ds.read(1).astype('float64')[mask]
   w=weights[mask];reference=math.fsum(float(v)*float(weight) for v,weight in zip(independent,w))/math.fsum(map(float,w))
   if not np.allclose(independent,a[mask],rtol=1e-12,atol=1e-10) or not math.isclose(mean,reference,rel_tol=1e-12,abs_tol=1e-10):raise ValueError('Independent aggregation mismatch')
   rows.append(dict(period=key,dekads=len(t['parts']),completePixels=n,excludedPixels=int(roi.sum())-n,areaWeightedMeanMm=mean,minimumMm=minimum,maximumMm=maximum,validZeroPixels=int((a[mask]==0).sum())))
   checks.append(dict(period=key,independentMeanMm=reference,maxPixelError=float(np.max(np.abs(independent-a[mask])))));lastmap=np.ma.array(a,mask=~mask)
 report=dict(state='succeeded',serviceId='svc-021',templateId='dekadal-precipitation',templateVersion='1.1',operator='conet_precip_dekadal@1.1',synthetic=p['synthetic'],inputHash=hashlib.sha256(raw).hexdigest(),inputFileHashes=hashes,parameters=p,mapping=metadata,records=rows,sourceFileCount=len(selected),aggregation='Sum accumulated dekadal depths per pixel; cosine-latitude weighted mean of complete pixels',seasonDefinition='calendar quarters Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec',limitations=['Single ZIP with compatible tagged TIFFs only; embedded NetCDF is not analyzed','No implicit unit conversion, scaling, reprojection or polygon ROI','Missing/negative/nonfinite pixels excluded, never zero-filled; period footprint intersection','Cosine latitude area weights on regular EPSG:4326 grid','No trend, significance or cross-source fusion'])
 out.mkdir(parents=True,exist_ok=True)
 (out/'report.json').write_text(json.dumps(report,allow_nan=False));(out/'verification.json').write_text(json.dumps(dict(state='passed',checks=checks,sourceFileCount=len(selected),independentReread=True),allow_nan=False))
 with (out/'periods.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
 fig,ax=plt.subplots(figsize=(11,4),constrained_layout=True);ax.plot(range(len(rows)),[r['areaWeightedMeanMm'] for r in rows],marker='o',markersize=3);step=max(1,len(rows)//12);ax.set_xticks(list(range(0,len(rows),step)),[r['period'] for r in rows[::step]],rotation=35);ax.set(ylabel='Precipitation (mm)',title=('SYNTHETIC / ' if p['synthetic'] else '')+f'{freq} accumulated precipitation / selected region');ax.grid(alpha=.25);fig.savefig(out/'periods.png',dpi=130);plt.close(fig)
 fig,ax=plt.subplots(figsize=(8,4),constrained_layout=True);im=ax.imshow(lastmap,extent=[metadata['bounds'][0],metadata['bounds'][2],metadata['bounds'][1],metadata['bounds'][3]],origin='upper',cmap='Blues');ax.set(title=('SYNTHETIC / ' if p['synthetic'] else '')+rows[-1]['period']+' accumulated precipitation',xlabel='Longitude',ylabel='Latitude');fig.colorbar(im,ax=ax,label='mm');fig.savefig(out/'map.png',dpi=130);plt.close(fig)
 return report

def main():
 import xstream_operator as sdk
 with sdk.OperatorContext() as ctx,tempfile.TemporaryDirectory(prefix='precip-') as temp:
  data=bytearray()
  for chunk in ctx.input('source').bytes():
   data.extend(chunk)
   if len(data)>134217728:raise ValueError('Archive exceeds 128MiB')
  root=Path(temp);analyze(bytes(data),dict(ctx.params),root);b=io.BytesIO()
  with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
   for name in ['report.json','verification.json','periods.csv','periods.png','map.png']:z.write(root/name,name)
  ctx.bytes_output('result','zip').write(b.getvalue())
if __name__=='__main__':main()
