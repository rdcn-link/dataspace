"""Owning-node scientific methods. Parameters describe data; no source paths are embedded."""
import io,json,csv,math,hashlib,tempfile,zipfile,tarfile,re,statistics
from pathlib import Path,PurePosixPath
from collections import Counter,defaultdict
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

class ChunkReader(io.RawIOBase):
 """Bounded, non-seeking input: TAR/GZIP never needs a full scratch copy."""
 def __init__(self,blocks,digest):super().__init__();self.blocks=iter(blocks);self.pending=memoryview(b'');self.total=0;self.digest=digest;self.done=False
 def readable(self):return True
 def readinto(self,target):
  written=0
  while written<len(target):
   if not self.pending:
    if self.done:break
    try:block=next(self.blocks)
    except StopIteration:self.done=True;break
    self.total+=len(block);ensure(self.total<=2000000000,'Source exceeds 2GB');self.digest.update(block);self.pending=memoryview(block)
    if not self.pending:continue
   count=min(len(target)-written,len(self.pending));target[written:written+count]=self.pending[:count];self.pending=self.pending[count:];written+=count
  return written

def ensure(v,message):
 if not v:raise ValueError(message)

def number(v):
 if v is None or str(v).strip() in ('','NA','N/A','NaN','nan','--'):return None
 try:x=float(v)
 except (TypeError,ValueError):raise ValueError('Non-numeric value: '+str(v)[:80])
 ensure(math.isfinite(x),'Non-finite input value');return x

def stats(values):
 a=[number(v) for v in values];x=[v for v in a if v is not None];ensure(x,'No valid numeric observations')
 mean=math.fsum(x)/len(x);ensure(math.isclose(mean,float(np.mean(x)),rel_tol=1e-12,abs_tol=1e-10),'Independent mean check failed')
 return dict(n=len(x),missing=len(a)-len(x),mean=mean,std=statistics.stdev(x) if len(x)>1 else None,minimum=min(x),maximum=max(x))

def text(raw):
 for enc in ('utf-8-sig','gb18030','latin1'):
  try:return raw.decode(enc)
  except UnicodeDecodeError:pass

def table(raw,filename,sheet=None):
 if filename.lower().endswith('.xlsx'):
  import openpyxl
  w=openpyxl.load_workbook(io.BytesIO(raw),read_only=True,data_only=True);ws=w[sheet] if sheet else w.worksheets[0];values=list(ws.values);w.close()
 elif filename.lower().endswith('.xls'):
  import xlrd
  w=xlrd.open_workbook(file_contents=raw);ws=w.sheet_by_name(sheet) if sheet else w.sheet_by_index(0);values=[ws.row_values(i) for i in range(ws.nrows)]
 else:values=list(csv.reader(io.StringIO(text(raw))))
 ensure(1<len(values)<=100001,'Table must contain 1..100000 data rows');head=[str(x).strip() if x is not None else '' for x in values[0]]
 ensure(len(set(h for h in head if h))==len([h for h in head if h]),'Duplicate column names')
 rows=[{h:(r[i] if i<len(r) else None) for i,h in enumerate(head) if h} for r in values[1:] if any(v not in ('',None) for v in r)]
 return rows,[h for h in head if h]

def grouped(rows,group,metrics,selected):
 ensure(rows and all(k in rows[0] for k in [group]+metrics),'Required mapped columns missing')
 if selected:rows=[r for r in rows if str(r[group])==selected]
 ensure(rows,'Selected group has no observations');groups=defaultdict(list)
 for r in rows:ensure(r[group] not in ('',None),'Missing grouping value');groups[str(r[group])].append(r)
 return [dict(group=g,metric=m,**stats(r[m] for r in rs)) for g,rs in sorted(groups.items()) for m in metrics],rows

def tabular(raw,p):
 rows,cols=table(raw,p['filename'],p.get('sheet'));mode=p['mode'];notes=[];selected=p.get('groupValue','')
 fig,ax=plt.subplots(figsize=(10,5));quality={};summary={};preview=[]
 if mode in ('seed','table'):
  conversions=[];unparsedSD=[]
  for index,r in enumerate(rows):
   for column in [p.get('valueColumn','平均数（g）'),'标准差']:
    value=r.get(column)
    if isinstance(value,str) and re.fullmatch(r'\d+,\d+',value.strip()):
     ensure(p.get('decimalComma') is True,'Decimal comma requires an explicitly confirmed adapter rule');r[column]=value.replace(',','.');conversions.append({'row':index+2,'column':column,'original':value,'mapped':r[column],'rule':'declared decimal comma to decimal point'})
    elif isinstance(value,str) and re.fullmatch(r'\d+\.\s+\d+',value.strip()):
     ensure(p.get('decimalSpaces') is True,'Embedded decimal whitespace requires an explicitly confirmed adapter rule');r[column]=re.sub(r'\s+','',value);conversions.append({'row':index+2,'column':column,'original':value,'mapped':r[column],'rule':'declared whitespace removal inside decimal literal'})
    if column=='标准差':
     try:number(r.get(column))
     except ValueError:unparsedSD.append({'row':index+2,'column':column,'original':value,'usage':'retained as source text; not used in between-species statistics'})
  quality['explicitDecimalConversions']=conversions
  quality['unparsedSourceSD']=unparsedSD
  records,chosen=grouped(rows,p.get('groupColumn','生活型'),[p.get('valueColumn','平均数（g）')],selected)
  ensure(all(number(r[p.get('valueColumn','平均数（g）')]) is None or number(r[p.get('valueColumn','平均数（g）')])>0 for r in chosen),'Mass must be positive')
  summary={'rows':len(chosen),'groups':len(records),'meanMassG':stats(r[p.get('valueColumn','平均数（g）')] for r in chosen)['mean']}
  notes=['Input contains published species mean mass (g) and within-species SD, not individual repeated measurements. Group SD describes variation between species means; no pooled replicate inference.','Life-form codes are retained from the source; no undocumented decoding.']
  preview=chosen[:500];ax.bar(range(len(records)),[r['mean'] for r in records]);ax.set_xticks(range(len(records)),[r['group'] for r in records]);ax.set_ylabel('Mean of species means (g)')
 elif mode=='stoichiometry':
  metrics=p.get('metrics',['SOC (mg/g)','STN (mg/g)','STP (mg/g)']);records,chosen=grouped(rows,p.get('groupColumn','Stage'),metrics,selected)
  summary={'rows':len(chosen),'groups':len(set(r['group'] for r in records)),'metrics':len(metrics)};preview=chosen[:100]
  notes=['Descriptive quadrat-level statistics; quadrats within sites are not assumed independent inferential replicates.','Restoration stage codes are preserved; no invented numerical restoration years. Units stay in source column labels.']
  for m in metrics:
   rs=[r for r in records if r['metric']==m];ax.plot([r['group'] for r in rs],[r['mean'] for r in rs],marker='o',label=m)
  ax.legend();ax.set_ylabel('Source units (see metric)')
 elif mode=='patch':
  ensure(all(c in cols for c in ['Patch ID','Bacterial richness','Fungal richness','Patch area (ha)']),'Patch richness schema missing')
  records=rows;summary={'patches':len(rows),'bacterialRichness':stats(r['Bacterial richness'] for r in rows),'fungalRichness':stats(r['Fungal richness'] for r in rows)}
  ax.scatter([number(r['Patch area (ha)']) for r in rows],[number(r['Bacterial richness']) for r in rows],label='Bacterial');ax.scatter([number(r['Patch area (ha)']) for r in rows],[number(r['Fungal richness']) for r in rows],label='Fungal');ax.set_xlabel('Patch area (ha)');ax.set_ylabel('Published richness');ax.legend()
  notes=['Published richness and network metrics only. No OTU/ASV abundance matrix is present, so relative composition and diversity indices are not calculated.']
 elif mode=='photometry':
  ensure('MJD' in cols,'MJD column missing');bands=p.get('bands',['u','g','v','r','i','z']);ensure(bands and all(b in ['u','g','v','r','i','z'] for b in bands),'Invalid photometric band')
  records=[]
  for band in bands:
   ensure(band+'_mag' in cols and band+'_err' in cols,'Missing magnitude/error columns');points=[];missing=0
   for r in rows:
    t=number(r['MJD']);m=number(r[band+'_mag']);err=number(r[band+'_err'])
    if m is None:missing+=1;continue
    ensure(t is not None,'Magnitude without observation time');ensure(err is None or err>=0,'Negative magnitude error')
    if p.get('timeStart') is not None and t<p['timeStart']:continue
    if p.get('timeEnd') is not None and t>p['timeEnd']:continue
    points.append((t,m,err));records.append({'band':band,'MJD':t,'magnitude':m,'magnitudeError':err})
   quality[band]={'missingMagnitude':missing,'selected':len(points)}
   if points:ax.errorbar([x[0] for x in points],[x[1] for x in points],yerr=[x[2] or 0 for x in points],fmt='.',label=band)
  ensure(records,'No observations in selected time/bands');summary={'inputRows':len(rows),'observations':len(records),'bands':len(set(r['band'] for r in records)),'MJDmin':min(r['MJD'] for r in records),'MJDmax':max(r['MJD'] for r in records)}
  ax.invert_yaxis();ax.set_xlabel('MJD');ax.set_ylabel('Published magnitude');ax.legend();notes=['Missing magnitudes are excluded, never zero-filled. Missing errors are reported as null; zero-length display bars do not assert zero uncertainty. No flux calibration or cross-band simultaneous matching is inferred.']
 else:raise ValueError('Unsupported tabular method')
 return dict(records=records,summary=summary,notes=notes,quality=quality,preview=preview),fig

def clouds(raw,p):
 lines=text(raw).splitlines();data=[l for l in lines if re.match(r'^\d+\t',l)];ensure(data,'Expected published tab-delimited physical parameter table')
 rows=[]
 for l in data:
  v=[x.strip() for x in l.split('\t')];ensure(len(v)>=12,'Invalid molecular-cloud row');rows.append({'id':v[0],'name':v[1],'sigmaV':number(v[5]),'radiusPc':number(v[6]),'massMsun':number(v[9])})
 xfield,yfield={'radius-velocity':('radiusPc','sigmaV'),'radius-mass':('radiusPc','massMsun')}[p.get('relation','radius-velocity')]
 valid=[r for r in rows if r[xfield] is not None and r[yfield] is not None and r[xfield]>0 and r[yfield]>0 and r['radiusPc']>=p.get('minimumRadiusPc',0)]
 ensure(len(valid)>=3,'At least 3 positive values are needed');x=np.log10([r[xfield] for r in valid]);y=np.log10([r[yfield] for r in valid]);slope,intercept=np.polyfit(x,y,1)
 mx=math.fsum(x)/len(x);my=math.fsum(y)/len(y);independent=math.fsum((float(a)-mx)*(float(b)-my) for a,b in zip(x,y))/math.fsum((float(a)-mx)**2 for a in x);ensure(math.isclose(float(slope),independent,rel_tol=1e-10,abs_tol=1e-10),'Independent slope mismatch')
 fig,ax=plt.subplots(figsize=(9,5));ax.scatter(x,y,s=5,alpha=.4);grid=np.linspace(min(x),max(x),100);ax.plot(grid,slope*grid+intercept,color='red');ax.set_xlabel('log10 '+xfield);ax.set_ylabel('log10 '+yfield)
 return dict(records=valid,summary={'inputRows':len(rows),'selectedRows':len(valid),'slope':float(slope),'intercept':float(intercept),'rSquared':float(np.corrcoef(x,y)[0,1]**2)},notes=['Unweighted ordinary least squares in log10 space. Published columns and units are retained. Selection effects and correlated distance uncertainties are not corrected; this is not a causal result.'],quality={'excluded':len(rows)-len(valid)}),fig

def catalyst(raw,p):
 import openpyxl
 w=openpyxl.load_workbook(io.BytesIO(raw),read_only=True,data_only=True);ensure('Fig6' in w.sheetnames and 'Fig7' in w.sheetnames,'Validated Fig6/Fig7 schema required');records=[]
 sheet=p.get('sheet','Fig6');ensure(sheet in ['Fig6','Fig7'],'Only validated conversion/selectivity sheets are supported');values=list(w[sheet].values);ensure('Temperature' in str(values[2][2] if sheet=='Fig6' else values[2][1]),'Unexpected condition header');condition=None;names=values[1];units=values[2]
 for row in values[3:]:
  if all(v in (None,'') for v in row):continue
  if sheet=='Fig6':
   if row[1] is not None:condition=number(row[1])
   temp=number(row[2]);ensure(temp is not None and condition is not None,'Missing explicit temperature/flow condition')
   for col in [3,5,7,9]:
    for k in [0,1]:
     v=number(row[col+k]);ensure(v is not None and 0<=v<=100,'Invalid conversion percentage');records.append({'catalyst':str(names[col]),'temperatureC':temp,'flowMlMin':condition,'metric':'CO conversion (%)' if k==0 else 'CO2 conversion (%)','value':v})
  else:
   if row[1] is not None:condition=number(row[1])
   flow=number(row[2]);ensure(flow is not None and condition is not None,'Missing explicit temperature/flow condition')
   for col in [3,4]:
    v=number(row[col]);ensure(v is not None and 0<=v<=100,'Invalid selectivity percentage');records.append({'catalyst':str(names[col]),'temperatureC':condition,'flowMlMin':flow,'metric':'CO selectivity (%)','value':v})
 w.close();selected=[r for r in records if r['temperatureC']>=p.get('temperatureMin',-273) and r['temperatureC']<=p.get('temperatureMax',10000)];ensure(selected,'No selected catalytic conditions');fig,ax=plt.subplots(figsize=(10,5))
 for label in sorted(set(r['catalyst'] for r in selected)):
  rs=[r for r in selected if r['catalyst']==label and r['metric'] in ['CO conversion (%)','CO selectivity (%)']];ax.scatter([r['temperatureC'] for r in rs],[r['value'] for r in rs],s=14,label=label)
 ax.set_xlabel('Temperature (C)');ax.set_ylabel('Published performance (%)');ax.legend(fontsize=7)
 return dict(records=selected,summary={'records':len(selected),'catalysts':len(set(r['catalyst'] for r in selected)),'temperatureMin':min(r['temperatureC'] for r in selected),'temperatureMax':max(r['temperatureC'] for r in selected),'metricStatistics':{metric:stats(r['value'] for r in selected if r['metric']==metric) for metric in sorted(set(r['metric'] for r in selected))}},notes=['Only source Fig6 (CO/CO2 conversion) and Fig7 (CO selectivity) are mapped. Explicit merged condition cells are propagated within their worksheet blocks.','Different flow/temperature combinations remain distinct; plotted points are not pooled causal comparisons. No process optimization or extrapolation.'],quality={'percentRangeChecked':True,'sourceRows':len(values)-3}),fig

def fire(raw,p):
 import datetime
 with zipfile.ZipFile(raw) as z:
  safe_members(z);remote,_=table(z.read('remote.xls'),'remote.xls','遥感火点');human,_=table(z.read('human.csv'),'human.csv');inputs=[('remote-detection',remote),('human-record',human)];counts=Counter();total=Counter();duplicates=Counter();seen=set();used=0;nonfire=0;start=p.get('yearStart',2001);end=p.get('yearEnd',2022);ensure(isinstance(start,int) and isinstance(end,int) and 2001<=start<=end<=2022,'Years outside validated historical range');frequency=p.get('frequency','year');ensure(frequency in ['year','month'],'Only annual/monthly records supported')
  for source,rows in inputs:
   for r in rows:
    ensure(all(k in r for k in ['YYYY','MM','DD','fire','X','Y']),'Historical date/label fields missing');flag=number(r['fire']);ensure(flag in [0,1],'Invalid fire label')
    if flag==0:nonfire+=1;continue
    year,month,day=[number(r[k]) for k in ['YYYY','MM','DD']];ensure(all(x is not None and x.is_integer() for x in [year,month,day]),'Invalid date');date=datetime.date(int(year),int(month),int(day));ensure(2001<=year<=2022,'Historical record outside source range');lon=number(r['X']);lat=number(r['Y']);ensure(lon is not None and lat is not None and -180<=lon<=180 and -90<=lat<=90,'Invalid coordinates')
    key=(source,date.isoformat(),lon,lat)
    if key in seen:duplicates[source]+=1
    seen.add(key);total[source]+=1
    if not start<=year<=end:continue
    counts[(source,date.strftime('%Y' if frequency=='year' else '%Y-%m'))]+=1;used+=1
  records=[{'source':s,'period':date,'records':n} for (s,date),n in sorted(counts.items())];ensure(sum(r['records'] for r in records)==used and used>0,'Selected record counts mismatch');fig,ax=plt.subplots(figsize=(11,5))
  for source in sorted(total):
   rs=[r for r in records if r['source']==source];ax.plot([r['period'] for r in rs],[r['records'] for r in rs],label=source)
  ax.tick_params(axis='x',rotation=60);ax.set_ylabel('Source records (not unique fire events)');ax.legend()
  return dict(records=records,summary={'selectedFireRecords':used,'sourceTotals':dict(total),'backgroundRowsExcluded':nonfire,'yearStart':start,'yearEnd':end},notes=['Historical fire=1 rows only; sampled non-fire rows and all future prediction datasets are excluded.','Human records and remote detections have different observation meanings and are never added as unique fire-event counts. Duplicate date/location keys are reported but retained; no undocumented deduplication or 80% confidence refiltering.','Only annual/monthly counts are supported; no hour field exists in this adapter.'],quality={'duplicateDateLocationKeys':dict(duplicates),'calendarDatesValidated':True}),fig

def safe_members(z):
 items=[i for i in z.infolist() if not i.is_dir()];ensure(len(items)<=20000 and sum(i.file_size for i in items)<=12000000000,'Archive exceeds analysis limits')
 for i in items:
  n=PurePosixPath(i.filename);ensure(not n.is_absolute() and '..' not in n.parts and i.file_size<=2000000000,'Unsafe or oversized archive member')
 return items

def formats(raw,p):
 with zipfile.ZipFile(raw) as z:
  files=safe_members(z);records=[]
  for i in files:
   name=i.filename;leaf=PurePosixPath(name).name;kind='unparsed attachment';support=False
   if leaf in ['fid','ser']:kind='Bruker raw NMR time-domain signal'
   elif leaf in ['acqus','acqu2s','procs','proc2s']:kind='Bruker JCAMP parameter text';support=True
   elif leaf in ['1r','1i','2rr']:kind='Bruker processed numeric signal (requires parameter mapping)'
   elif name.lower().endswith('.png'):kind='PNG preview';support=True
   elif name.lower().endswith(('.txt','.xml')):kind='Text/XML';support=True
   elif name.lower().endswith(('.mnova','.nmr')):kind='Instrument/project container'
   records.append({'file':name,'bytes':i.file_size,'kind':kind,'inspectionSupported':support})
  counts=Counter(r['kind'] for r in records);fig,ax=plt.subplots(figsize=(10,5));ax.barh(list(counts),list(counts.values()));ax.set_xlabel('Files')
  return dict(records=records,summary={'files':len(records),'bytes':sum(i.file_size for i in files),'recognized':sum(r['kind']!='unparsed attachment' for r in records)},notes=['Format identification is the application output, not NMR reconstruction or compound identification. Unsupported native files remain explicitly unparsed. ZIP central-directory size/count checked; content magic is checked for preview and parameter samples only.'],quality={'pngMagicChecked':all(z.read(i)[:8]==b'\x89PNG\r\n\x1a\n' for i in files if i.filename.lower().endswith('.png'))}),fig

def nmr(raw,p):
 from scipy.signal import savgol_filter,find_peaks
 with zipfile.ZipFile(raw) as z:
  items=safe_members(z);available=sorted(i.filename for i in items if i.filename.endswith('/1r'));ensure(available,'No supported processed one-dimensional 1r spectrum; native MNOVA/FID is not accepted')
  member=p.get('member') or available[0];ensure(member in available,'Selected processed spectrum does not exist');prefix=member.rsplit('/',1)[0];procs=text(z.read(prefix+'/procs'))
  def val(k):
   m=re.search(r'^##\$'+re.escape(k)+r'=\s*([^\r\n]+)',procs,re.M);ensure(m is not None,'Missing Bruker '+k);return float(m.group(1).strip())
  si=int(val('SI'));sf=val('SF');sw=val('SW_p');offset=val('OFFSET');order=int(val('BYTORDP'));dtype=int(val('DTYPP'));nc=val('NC_proc');ensure(order in [0,1] and dtype in [0,2] and si>0 and sf>0 and sw>0,'Invalid Bruker mapping')
  rawsignal=z.read(member);dt=np.dtype(('<' if order==0 else '>')+('i4' if dtype==0 else 'f8'));ensure(len(rawsignal)==si*dt.itemsize,'Signal size differs from SI; no implicit reshape');y=np.frombuffer(rawsignal,dtype=dt).astype(float)*(2.0**nc);ensure(np.isfinite(y).all(),'Non-finite spectrum');x=offset-np.arange(si)*sw/sf/si
  window=int(p.get('smoothWindow',11));ensure(window>=5 and window%2==1 and window<si,'Smoothing window must be odd and smaller than SI');end=max(5,si//50);baseline=np.linspace(float(np.median(y[:end])),float(np.median(y[-end:])),si);corrected=savgol_filter(y-baseline,window,2);prominence=float(p.get('prominenceFraction',.03));ensure(0<prominence<1,'Invalid relative prominence');peaks,_=find_peaks(corrected,prominence=prominence*float(np.ptp(corrected)));ensure(len(peaks)<10000,'Excessive peaks')
  records=[{'point':int(i),'ppm':float(x[i]),'originalIntensity':float(y[i]),'correctedIntensity':float(corrected[i])} for i in peaks];fig,ax=plt.subplots(figsize=(11,5));stride=max(1,si//20000);ax.plot(x[::stride],corrected[::stride],lw=.7);ax.scatter(x[peaks],corrected[peaks],s=10);ax.invert_xaxis();ax.set_xlabel('Chemical shift (ppm)');ax.set_ylabel('Processed intensity (source arbitrary scale)')
  return dict(records=records,summary={'points':si,'peaks':len(peaks),'firstPpm':float(x[0]),'lastPpm':float(x[-1]),'member':member},notes=['Uses processed 1D Bruker 1r plus procs; no native MNOVA parsing and no FID Fourier reconstruction.','Endpoint median linear baseline; Savitzky-Golay order 2; relative-prominence positive peak detection. Not quantitative integration, structure identification or multiplet assignment.'],quality={'byteCountChecked':True,'sourceScaleFactor':2.0**nc,'parameters':{'SI':si,'SF':sf,'SW_p':sw,'OFFSET':offset,'BYTORDP':order,'DTYPP':dtype,'NC_proc':nc}}),fig

def images(raw,p,extras):
 from PIL import Image,ImageOps,ImageDraw
 with zipfile.ZipFile(raw) as z:
  files=safe_members(z);items=sorted([i for i in files if i.filename.lower().endswith(('.png','.jpg','.jpeg','.tif','.tiff'))],key=lambda i:i.filename)
  ensure(items,'No supported images');limit=int(p.get('maxImages',len(items)));ensure(1<=limit<=2000,'maxImages must be 1..2000');items=items[:limit];records=[];thumbs=[];size=int(p.get('maxSize',256));ensure(64<=size<=1024,'maxSize must be 64..1024');derive=p['mode']=='derive';bundle=io.BytesIO()
  with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as output:
   for index,i in enumerate(items):
    data=z.read(i);im=Image.open(io.BytesIO(data));im.load();ensure(im.width*im.height<=100000000,'Image pixel limit exceeded');mask='/annotations/' in i.filename.lower() or '/mask' in i.filename.lower();originalSize=im.size
    im=ImageOps.exif_transpose(im);im.thumbnail((size,size),Image.Resampling.NEAREST if mask else Image.Resampling.LANCZOS)
    clean=Image.new(im.mode,im.size);clean.putdata(list(im.getdata()));name=str(index+1).zfill(4)+'.png';b=io.BytesIO();clean.save(b,format='PNG');derived=b.getvalue();reopened=Image.open(io.BytesIO(derived));ensure(not reopened.info and not reopened.getexif(),'Derived metadata remains');ensure(max(reopened.size)<=size,'Resize bound failed')
    if derive:output.writestr(name,derived)
    records.append({'file':i.filename,'width':originalSize[0],'height':originalSize[1],'mode':im.mode,'isMask':mask,'sourceSha256':hashlib.sha256(data).hexdigest(),'derivedWidth':im.width,'derivedHeight':im.height,'derivedSha256':hashlib.sha256(derived).hexdigest() if derive else None})
    if len(thumbs)<24:thumbs.append((i.filename,im.convert('RGB').copy()))
  contact=Image.new('RGB',(6*180,math.ceil(len(thumbs)/6)*160),'white');draw=ImageDraw.Draw(contact)
  for j,(name,im) in enumerate(thumbs):im.thumbnail((175,130));xx=(j%6)*180;yy=(j//6)*160;contact.paste(im,(xx,yy));draw.text((xx,yy+132),str(j+1)+': '+PurePosixPath(name).name[:20],fill='black')
  b=io.BytesIO();contact.save(b,format='PNG');extras['contact.png']=b.getvalue()
  if derive:extras['derived.zip']=bundle.getvalue()
  stems={PurePosixPath(r['file']).stem for r in records if not r['isMask']};masks={PurePosixPath(r['file']).stem for r in records if r['isMask']};fig,ax=plt.subplots(figsize=(9,5));ax.hist([r['width'] for r in records],bins=20);ax.set_xlabel('Original image width (px)');ax.set_ylabel('Files')
  return dict(records=records,summary={'archiveImageFiles':len([i for i in files if i.filename.lower().endswith(('.png','.jpg','.jpeg','.tif','.tiff'))]),'processedImages':len(records),'images':sum(not r['isMask'] for r in records),'masks':sum(r['isMask'] for r in records),'pairedNames':len(stems&masks),'unpairedNames':len(stems^masks)},notes=['All selected images are decoded; contact sheet shows at most 24. Selection is lexicographic and maxImages is an explicit analysis parameter.','Masks use nearest-neighbor resizing; images use Lanczos. Derived PNG files are created from clean pixels without source metadata. No segmentation model or accuracy metric is inferred.'],quality={'allDecoded':True,'derivedMetadataRemoved':derive}),fig

def genome(raw,p):
 records=[];species={};totalHeaders=0;totalBases=0;features=Counter();limit=int(p.get('maxSpecies',100));ensure(1<=limit<=100,'maxSpecies must be 1..100');selected=set();archives=Counter()
 with tarfile.open(fileobj=raw,mode='r|gz') as t:
  for member in t:
   ensure(not PurePosixPath(member.name).is_absolute() and '..' not in PurePosixPath(member.name).parts,'Unsafe TAR path')
   if not member.isfile():continue
   suffix=Path(member.name).suffix.lower();ensure(suffix in ['.gff3','.gff','.fa','.fasta','.fna','.faa','.cds','.pep','.pr'],'Unexpected genome file format: '+suffix);name=Path(member.name).name.split('.')[0]
   if name not in selected and len(selected)>=limit:continue
   selected.add(name);folder=PurePosixPath(member.name).parent.as_posix();mapping={p['gffDirectory']:'gff',p['cdsDirectory']:'cds',p['proteinDirectory']:'protein'};ensure(folder in mapping,'Sequence directory has no declared molecule mapping');kind=mapping[folder];archives[kind]+=1;handle=t.extractfile(member);entry={'species':name,'file':member.name,'kind':kind,'records':0,'bases':0,'minimumLength':None,'maximumLength':None};lengths=[];current=None;letters=Counter()
   for line in handle:
    s=line.decode('ascii').strip()
    if kind=='gff':
     if not s or s.startswith('#'):continue
     v=s.split('\t');ensure(len(v)==9,'Invalid GFF3 field count');ensure(int(v[3])>0 and int(v[4])>=int(v[3]),'Invalid GFF interval');features[v[2]]+=1;entry['records']+=1
    elif s.startswith('>'):
     if current is not None:lengths.append(current)
     current=0;totalHeaders+=1
    elif s:
     ensure(current is not None,'Sequence before FASTA header');ensure(re.fullmatch(r'[A-Za-z*.-]+',s) is not None,'Invalid FASTA sequence');current+=len(s);totalBases+=len(s);letters.update(s.upper())
   if current is not None:lengths.append(current)
   if kind!='gff':
    ensure(lengths,'Empty FASTA');entry.update(records=len(lengths),bases=sum(lengths),minimumLength=min(lengths),maximumLength=max(lengths),meanLength=math.fsum(lengths)/len(lengths))
   records.append(entry)
 ensure(records,'No selected genome files');ensure(sum(r['records'] for r in records if r['kind']!='gff')==totalHeaders and sum(r['bases'] for r in records)==totalBases,'Independent streamed FASTA counts mismatch')
 sets={k:{r['species'] for r in records if r['kind']==k} for k in ['gff','cds','protein']};ensure(sets['gff']==sets['cds']==sets['protein'],'Species file sets do not match')
 fig,ax=plt.subplots(figsize=(11,5));cds=[r for r in records if r['kind']=='cds'];ax.bar(range(len(cds)),[r['records'] for r in cds]);ax.set_xlabel('Species index (see CSV)');ax.set_ylabel('CDS sequences')
 return dict(records=records,summary={'speciesFileGroups':len(selected),'files':len(records),'FASTAsequences':totalHeaders,'sequenceCharacters':totalBases,'GFFfeatures':dict(features)},notes=['GFF features counted by declared type; FASTA lengths include every sequence character and report source ambiguity without inventing gene identities.','Species names are file identifiers; this does not infer taxonomy or orthology. Source archive contents, not the dataset title count, define the selected scope.'],quality={'speciesTripletsMatched':True,'independentFASTAcounts':True}),fig

def process(ctx):
 p=ctx.params;mode=p['mode'];ensure(mode in ['table','seed','stoichiometry','patch','photometry','clouds','formats','nmr','images','derive','genome','fire','catalyst'],'Unsupported method')
 h=hashlib.sha256();size=0;extras={}
 if mode=='genome':
  source=ChunkReader(ctx.input('source').bytes(),h)
  with io.BufferedReader(source,buffer_size=65536) as stream:
   report,fig=genome(stream,p)
   while stream.read(1048576):pass
   size=source.total
 else:
  with tempfile.TemporaryFile() as f:
   for block in ctx.input('source').bytes():size+=len(block);ensure(size<=2000000000,'Source exceeds 2GB');h.update(block);f.write(block)
   f.seek(0)
   if mode in ['table','seed','stoichiometry','patch','photometry']:report,fig=tabular(f.read(),p)
   elif mode=='clouds':report,fig=clouds(f.read(),p)
   elif mode=='catalyst':report,fig=catalyst(f.read(),p)
   elif mode=='fire':report,fig=fire(f,p)
   elif mode=='formats':report,fig=formats(f,p)
   elif mode=='nmr':report,fig=nmr(f,p)
   else:report,fig=images(f,p,extras)
 report.update(schema='conet.scientific-report/v1',state='succeeded',method=mode,parameters=p,inputFileHashes={p['filename']:h.hexdigest()},inputBytes=size,operator='conet_downloaded_analysis@1.1',synthetic=False,executionEvidence={'kind':'user-authorized-engineering-validation','formalApproval':False})
 ensure(report['records'],'Analysis produced no records');b=io.BytesIO();fig.tight_layout();fig.savefig(b,format='png',dpi=120);plt.close(fig);extras['chart.png']=b.getvalue();extras['report.json']=json.dumps(report,ensure_ascii=False,allow_nan=False).encode()
 check={'state':'passed','checks':['input SHA256 captured','bounded native decoding','method-specific numerical or structure invariants','finite JSON output'],'method':mode,'summary':report['summary']};extras['verification.json']=json.dumps(check).encode();keys=list(dict.fromkeys(k for r in report['records'] for k in r));s=io.StringIO();writer=csv.DictWriter(s,fieldnames=keys);writer.writeheader();writer.writerows(report['records']);extras['table.csv']=s.getvalue().encode('utf-8-sig')
 output=io.BytesIO()
 with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
  for name,data in extras.items():z.writestr(name,data)
 ensure(len(output.getvalue())<=100000000,'Result exceeds 100MB');ctx.bytes_output('result','zip').write(output.getvalue())

def infer_outputs(inputs,params):
 from xstream_operator import descriptor,result
 return result({'result':descriptor(['bytes'],['zip'],None,certainty='known')})

def preview_outputs(inputs,params,limits):
 from xstream_operator import preview_process
 return preview_process(process,inputs,params,limits)

if __name__=='__main__':
 from xstream_operator import run_operator
 run_operator(process,infer_outputs,preview_outputs=preview_outputs)
