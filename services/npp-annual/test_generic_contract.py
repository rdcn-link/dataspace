import io,json,zipfile,hashlib,sys
from pathlib import Path
import numpy as np,rasterio
from rasterio.io import MemoryFile
from rasterio.transform import from_origin
import xstream_operator as sdk
from npp_generic_operator import main
adapter=dict(id='fixture',version='1',datasetId='synthetic-independent',dataKind='synthetic',variable='NPP',band=1,timeScale='annual',unit='gC/m2/year',unitEvidence='Synthetic declared values',unitConversion='identity',nodataRule='gdal-mask+finite+nonnegative')
def tif(a,scale=1):
 with MemoryFile() as m:
  with m.open(driver='GTiff',width=3,height=2,count=1,dtype='float32',crs='EPSG:4326',transform=from_origin(90,35,1,1),nodata=-9999) as d:d.write(a.astype('float32'),1);d.scales=(scale,)
  return m.read()
base=np.array([[0,10,20],[30,40,-9999]],dtype='float32');growth=np.array([[1,2,3],[4,5,0]],dtype='float32');raw={y:tif(np.where(base==-9999,-9999,base+(y-2020)*growth)) for y in range(2020,2023)}
def run(years,region,methods,alter=False):
 p=dict(years=years,adapter=adapter,region=region,methods=methods,expectedHashes={str(y):hashlib.sha256(raw[y]).hexdigest() for y in years});inputs={'y'+str(i).zfill(2):raw[y] for i,y in enumerate(years)}
 def stage(phase):
  output=io.BytesIO();consumed=[]
  class Input:
   def __init__(self,name):self.name=name
   def bytes(self):
    assert not consumed or consumed[-1]<self.name,'Must consume lexical ports';consumed.append(self.name);yield inputs[self.name]
  class Context:
   params=p
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def input(self,name):return Input(name)
   def bytes_output(self,*args):return output
  sdk.OperatorContext=Context;main(phase,len(years));return output.getvalue()
 inspection=stage('inspect')
 if alter:inputs['y00']=tif(base+1)
 inputs['reference']=stage('prepare');result=stage('finalize')
 with zipfile.ZipFile(io.BytesIO(result)) as z:return json.loads(z.read('report.json')),json.loads(z.read('verification.json')),json.loads(z.read('map.json'))
methods=['annual-statistics','interannual-change','linear-trend'];full,v,m=run([2020,2021,2022],dict(mode='full'),methods)
w0,w1=np.cos(np.deg2rad([34.5,33.5]));expected=(6*w0+9*w1)/(3*w0+2*w1);assert abs(full['olsSlopePerYear']-expected)<1e-10;assert full['commonPixels']==5 and full['records'][0]['validZeroPixels']==1 and v['state']=='passed';assert m['values'][1][2] is None
north,_,_=run([2020,2021,2022],dict(mode='bbox',bbox=[90,34,93,35]),methods);assert abs(north['firstMean']-10)<1e-10 and abs(north['lastMean']-14)<1e-10 and abs(north['olsSlopePerYear']-2)<1e-10 and north['commonPixels']==3
recent,_,_=run([2021,2022],dict(mode='bbox',bbox=[90,34,93,35]),['annual-statistics','interannual-change']);assert abs(recent['firstMean']-12)<1e-10 and abs(recent['lastMean']-14)<1e-10 and recent['olsSlopePerYear'] is None
annual,_,_=run([2020,2021],dict(mode='full'),['annual-statistics']);assert annual['endpointChange'] is None and annual['olsSlopePerYear'] is None and 'changeFromPrevious' not in annual['records'][0]
for region in [dict(mode='bbox',bbox=[89,33,91,35]),dict(mode='bbox',bbox=[90.01,34.01,90.02,34.02])]:
 try:run([2020,2021],region,['annual-statistics']);raise AssertionError('Invalid ROI accepted')
 except ValueError:pass
try:run([2020,2021],dict(mode='full'),['annual-statistics'],True);raise AssertionError('Changed source accepted')
except ValueError as e:assert 'changed after inspection' in str(e)
old=raw[2020];raw[2020]=tif(base,.1)
try:run([2020,2021],dict(mode='full'),['annual-statistics']);raise AssertionError('Scaled input accepted')
except ValueError as e:assert 'Scaled/offset' in str(e)
raw[2020]=old
print(json.dumps(dict(state='passed',scope='Independent synthetic numerical contract',fullSlope=expected,northSlope=2,regionChangesPixelsAndValues=True,yearsRecomputed=True,methodsChangeOutputs=True,missingNotZero=True,validZeroPreserved=True,changedSourceRejected=True,invalidRegionsRejected=True,implicitScaleRejected=True)))
