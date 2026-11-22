"""Known-value second source plus meaningful aggregation rejection contracts."""
import io,json,zipfile,sys,tempfile
from pathlib import Path
import numpy as np,rasterio
from rasterio.transform import from_origin
sys.path.insert(0,'/mnt/data/conet/precipitation')
from precip_operator import analyze
root=Path('/mnt/data/conet/precipitation/fixture');root.mkdir(parents=True,exist_ok=True);b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:
 for year in (2020,2021):
  for month in range(1,13):
   for day in (1,11,21):
    a=np.array([[0,1,2],[3,4,-99]],dtype='float32')+(year-2020);a[1,2]=-99
    with rasterio.MemoryFile() as mem:
     with mem.open(driver='GTiff',width=3,height=2,count=1,dtype='float32',crs='EPSG:4326',transform=from_origin(110,35,1,1),nodata=-99) as ds:
      ds.write(a,1);ds.update_tags(units='mm',variable='prec',time=f'{year}-{month:02}-{day:02}',long_name='dekadal precipitation')
     z.writestr(f'TIFF/{year}_{month:02}_{day:02}_Pcp.tif',mem.read())
raw=b.getvalue();(root/'synthetic-dekads.zip').write_bytes(raw)
p=dict(yearStart=2020,yearEnd=2021,frequency='monthly',region=dict(mode='full'),variable='prec',unit='mm',synthetic=True)
import matplotlib;matplotlib.use('Agg')
from matplotlib.axes import Axes
original_image=Axes.imshow;original_plot=Axes.plot;seen_extents=[];seen_markers=[]
def track_image(self,*args,**kwargs):
 seen_extents.append(kwargs.get('extent'));return original_image(self,*args,**kwargs)
def track_plot(self,*args,**kwargs):
 seen_markers.append(kwargs.get('marker'));return original_plot(self,*args,**kwargs)
Axes.imshow=track_image;Axes.plot=track_plot
with tempfile.TemporaryDirectory() as temp:
 out=Path(temp);r=analyze(raw,p,out);weights=np.array([np.cos(np.deg2rad(34.5))]*3+[np.cos(np.deg2rad(33.5))]*2);expected=float(np.average([0,3,6,9,12],weights=weights));assert abs(r['records'][0]['areaWeightedMeanMm']-expected)<1e-10;assert abs(r['records'][12]['areaWeightedMeanMm']-expected-3)<1e-10;assert r['records'][0]['validZeroPixels']==1 and r['records'][0]['completePixels']==5
 p2={**p,'region':dict(mode='bbox',bbox=[110,34,113,35]),'frequency':'annual','yearEnd':2020};r2=analyze(raw,p2,out);assert abs(r2['records'][0]['areaWeightedMeanMm']-36)<1e-10
 assert seen_extents[:2]==[[110.0,113.0,33.0,35.0]]*2;assert seen_markers[:2]==['o','o']
 rejected=[]
 for label,params,data in [('missing-year',{**p,'yearEnd':2022},raw),('bad-unit',{**p,'unit':'m'},raw),('bad-method',{**p,'frequency':'mean'},raw),('outside-roi',{**p,'region':dict(mode='bbox',bbox=[109,34,112,35])},raw),('empty-roi',{**p,'region':dict(mode='bbox',bbox=[110.01,34.01,110.02,34.02])},raw)]:
  try:analyze(data,params,out)
  except ValueError as e:rejected.append(dict(case=label,reason=str(e)))
  else:raise AssertionError(label+' accepted')
 print(json.dumps(dict(state='passed',expectedFirstMonthly=expected,knownNorthAnnual=36,zeroPreserved=True,nodataExcluded=True,mapGeographicExtentVerified=True,singlePointMarkerVerified=True,rejected=rejected)))
