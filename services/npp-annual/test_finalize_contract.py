import io,json,zipfile
import numpy as np,rasterio
from rasterio.io import MemoryFile
from rasterio.transform import from_origin
import xstream_operator as sdk
from npp_dynamic import main
from npp_bound_finalize import main as finalize

def tif(a,scale=.1):
 with MemoryFile() as m:
  with m.open(driver='GTiff',width=a.shape[1],height=a.shape[0],count=1,dtype='float32',crs='EPSG:4326',transform=from_origin(90,35,scale,scale)) as d:d.write(a.astype('float32'),1)
  return m.read()
params=dict(years=[2019,2020],datasetId='synthetic-contract',synthetic=True,unitEvidence='Synthetic declared test scale',bindingHash='a'*64)
inputs={}
def stage(phase):
 output=io.BytesIO()
 class Input:
  def __init__(self,name):self.name=name
  def bytes(self):yield inputs[self.name]
 class Context:
  def __init__(self):self.params=params
  def __enter__(self):return self
  def __exit__(self,*args):pass
  def input(self,name):return Input(name)
  def bytes_output(self,*args):return output
 sdk.OperatorContext=Context
 if phase=='finalize':finalize(2)
 else:main(phase,2)
 return output.getvalue()
a=np.array([[10,20,np.nan],[30,40,50]],dtype='float32')
inputs.update(y00=tif(a),y01=tif(a+10))
for p in ('native','finalize'):inputs['reference']=stage(p)
with zipfile.ZipFile(io.BytesIO(inputs['reference'])) as z:
 r=json.loads(z.read('report.json'));v=json.loads(z.read('verification.json'));assert r['state']=='succeeded' and r['synthetic'] and len(r['records'])==2 and v['state']=='passed';assert abs(r['endpointChange']-10)<1e-10 and abs(r['olsSlopePerYear']-10)<1e-10
inputs['reference']=stage('native');inputs['y01']=tif(a+11)
try:stage('finalize');raise AssertionError('changed input accepted')
except ValueError as e:assert 'Input changed' in str(e)
inputs.update(y00=tif(a),y01=tif(a+10,.2))
try:stage('native');raise AssertionError('grid mismatch accepted')
except ValueError as e:assert 'grids differ' in str(e)
inputs.update(y00=tif(np.zeros((2,3),dtype='float32')),y01=tif(np.zeros((2,3),dtype='float32')))
for p in ('native','finalize'):inputs['reference']=stage(p)
with zipfile.ZipFile(io.BytesIO(inputs['reference'])) as z:
 r=json.loads(z.read('report.json'));assert r['endpointChangePercent'] is None and r['olsR2'] is None
print(json.dumps(dict(scope='synthetic contract only',state='passed',knownSlope=10,sourceChangesRejected=True,gridMismatchRejected=True,zeroBaseHandled=True)))
