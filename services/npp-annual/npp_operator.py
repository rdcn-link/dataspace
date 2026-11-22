import io,json,hashlib,tempfile,zipfile,sys,math
from pathlib import Path
import numpy as np
import rasterio
from rasterio.windows import Window

def main(common=False):
 from xstream_operator import OperatorContext,descriptor,result,run_inference
 if len(sys.argv)>1 and sys.argv[1] in ('infer','infer-worker'):
  run_inference(lambda inputs,params:result({'result':descriptor(['bytes'],['zip'],certainty='known')}));return
 with OperatorContext() as ctx,tempfile.TemporaryDirectory() as tmp:
  path=Path(tmp)/'source.tif';digest=hashlib.sha256()
  with path.open('wb') as f:
   for chunk in ctx.input('source').bytes():digest.update(chunk);f.write(chunk)
  maskraw=b''.join(ctx.input('mask').bytes()) if common else None
  with rasterio.open(path) as d:
   if str(d.crs)!='EPSG:4326' or d.count!=1 or d.transform.b or d.transform.d:raise ValueError('Unsupported raster grid')
   h,w=d.height,d.width;valid=np.zeros((h,w),dtype=bool)
   fixed=np.unpackbits(np.frombuffer(maskraw,dtype=np.uint8))[:h*w].reshape(h,w).astype(bool) if common else None
   weighted=area=total=unweighted=0.;count=0;minimum=float('inf');maximum=-float('inf');zeros=0;negative=0
   R=6371008.8;dx=abs(math.radians(d.transform.a))
   for top in range(0,h,128):
    n=min(128,h-top);win=Window(0,top,w,n);a=d.read(1,window=win).astype('float64');m=(d.read_masks(1,window=win)>0)&np.isfinite(a)
    negative+=int((m&(a<0)).sum());m&=a>=0
    if common:
     if np.any(fixed[top:top+n]&~m):raise ValueError('Common mask is not a subset of native valid support')
     m=fixed[top:top+n]
    valid[top:top+n]=m
    edges=d.transform.f+np.arange(top,top+n+1)*d.transform.e
    weights=(R*R*dx*np.abs(np.sin(np.deg2rad(edges[:-1]))-np.sin(np.deg2rad(edges[1:]))))[:,None]
    total+=float(weights.sum()*w);area+=float((m*weights).sum());weighted+=float((np.where(m,a,0)*weights).sum());unweighted+=float(a[m].sum());count+=int(m.sum());zeros+=int((m&(a==0)).sum())
    if m.any():minimum=min(minimum,float(a[m].min()));maximum=max(maximum,float(a[m].max()))
   if not count:raise ValueError('No valid cells')
   packed=np.packbits(valid).tobytes()
   report=dict(year=ctx.params['year'],synthetic=False,commonSupport=common,unit='gC/m2/year',unitEvidence='Dataset metadata introduction, DOI 10.57760/sciencedb.0154q',grid=dict(width=w,height=h,crs=str(d.crs),transform=list(d.transform)),inputHash=digest.hexdigest(),validMaskHash=hashlib.sha256(packed).hexdigest(),validPixels=count,totalPixels=h*w,validAreaKm2=area/1e6,rectangleAreaKm2=total/1e6,coverageFraction=area/total,areaWeightedMean=weighted/area,pixelMean=unweighted/count,validZeroPixels=zeros,excludedNegativePixels=negative,min=minimum,max=maximum,areaMethod='Spherical latitude-band cell area, R=6371008.8 m; not nominal 500m pixel area',region='Native finite nonnegative raster footprint; no external administrative boundary')
  buf=io.BytesIO()
  with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as z:
   z.writestr('summary.json',json.dumps(report));
   if not common:z.writestr('valid-mask.bin',packed)
  ctx.bytes_output('result','zip').write(buf.getvalue())
