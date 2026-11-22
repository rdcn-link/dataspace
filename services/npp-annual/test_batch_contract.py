import io,json,zipfile
import numpy as np,rasterio
from rasterio.io import MemoryFile
from rasterio.transform import from_origin
import xstream_operator as sdk
from npp_batch import main
inputs={}
for i,year in enumerate(range(2001,2025)):
 a=np.array([[i+1,i+2,np.nan],[i+4,i+5,i+6]],dtype='float32')
 if i%2==0:a[0,0]=np.nan
 with MemoryFile() as m:
  with m.open(driver='GTiff',width=3,height=2,count=1,dtype='float32',crs='EPSG:4326',transform=from_origin(90,35,.1,.1)) as d:d.write(a,1)
  inputs['y'+str(year)]=m.read()
for start,end in [(2001,2024),(2018,2024)]:
 for phase in ('native','common'):
  output=io.BytesIO()
  class Input:
   def __init__(self,name):self.name=name
   def bytes(self):yield inputs[self.name]
  class Context:
   params=dict(yearStart=start,yearEnd=end)
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def input(self,name):return Input(name)
   def bytes_output(self,*args):return output
  sdk.OperatorContext=Context;main(phase)
  if phase=='native':inputs['reference']=output.getvalue()
  else:
   with zipfile.ZipFile(io.BytesIO(output.getvalue())) as z:r=json.loads(z.read('report.json'))
   assert r['commonPixels']==4 and len(r['records'])==end-start+1 and r['years']==[start,end]
   assert abs(r['olsSlopePerYear']-1)<1e-10 and abs(r['endpointChange']-(end-start))<1e-10
print(json.dumps(dict(scope='synthetic batch contract',state='passed',ranges=[[2001,2024],[2018,2024]])))
