"""Versioned scientific methods; data and mappings arrive through task parameters."""
import io,json,csv,zipfile,tempfile,hashlib,re,math,statistics
from collections import Counter,defaultdict
from pathlib import PurePosixPath
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from legacy_science import ensure,stats,table,safe_members

MODES=['profile2','filter2','quality2','pivot2','fatigue2','lpj2','ctd-qc2','ctd-profile2','ctd-ts2','ctd-thermocline2','barcode2','rsei2','duplicates2','blur2']

def workbook(raw,p,extras):
 rows,headers=table(raw,p['filename'],p.get('sheet'));ensure(rows,'Empty worksheet');ensure(len(set(headers))==len(headers),'Duplicate headers');mode=p['mode'];group=p.get('groupColumn','Material ID');life=p.get('lifeColumn','Fatiguelife');stress=p.get('stressColumn','StressA');ensure(all(k in headers for k in [group,life,stress]),'Required mappings missing from worksheet')
 selected=[r for r in rows if (not p.get('groupId') or float(r[group])==p['groupId']) and r[life] is not None and float(r[life])>=p.get('minLife',1)];ensure(selected,'No rows match the selected group and minimum life');records=[];fig,axes=plt.subplots(1,2,figsize=(12,5));numeric=[h for h in headers if any(isinstance(r[h],(float,int)) for r in rows)];groups=defaultdict(list)
 for r in selected:groups[str(r[group])].append(r)
 notes=['Input is the observed NIMS workbook; fitted-curve workbook is a separate source, not independent observations.','Units are source-declared; StressA is retained as source stress amplitude. No unreported runout/censoring indicator is invented.']
 if mode=='fatigue2':
  for k,rr in sorted(groups.items(),key=lambda x:float(x[0])):
   valid=[r for r in rr if r[stress] is not None and float(r[stress])>0 and float(r[life])>0];ensure(len(valid)>=3,'At least three positive stress/life samples are required per selected group');x=np.log10([float(r[life]) for r in valid]);y=np.log10([float(r[stress]) for r in valid]);ensure(np.ptp(x)>0,'Constant life cannot be fitted');b,a=np.polyfit(x,y,1);xm=math.fsum(x)/len(x);ym=math.fsum(y)/len(y);ind=math.fsum((float(xx)-xm)*(float(yy)-ym) for xx,yy in zip(x,y))/math.fsum((float(xx)-xm)**2 for xx in x);ensure(math.isclose(float(b),ind,rel_tol=1e-9,abs_tol=1e-10),'Independent slope mismatch');pred=a+b*x;sst=float(np.sum((y-np.mean(y))**2));r2=1-float(np.sum((y-pred)**2))/sst if sst>0 else None;records.append(dict(group=k,samples=len(valid),log10_intercept=float(a),basquin_b=float(b),r_squared=r2,rmse_log10=float(np.sqrt(np.mean((y-pred)**2))),excluded=len(rr)-len(valid)))
   if len(records)<=8:axes[0].scatter(10**x,10**y,s=8,alpha=.55);xx=np.linspace(x.min(),x.max(),60);axes[0].plot(10**xx,10**(a+b*xx),label='Group '+k)
  axes[0].set(xscale='log',yscale='log',xlabel='Cycles to failure',ylabel='Stress amplitude (source units)',title='First eight selected groups');axes[0].legend(fontsize=7);axes[1].hist([r['basquin_b'] for r in records],bins=20);axes[1].set(xlabel='Basquin exponent b',ylabel='Groups');notes.append('OLS log10(stress)=a+b*log10(cycles); no fatigue-limit, survival-probability or design-life claim.')
 elif mode=='pivot2':
  for k,rr in sorted(groups.items(),key=lambda x:float(x[0])):
   a=stats([r[life] for r in rr]);b=stats([r[stress] for r in rr]);records.append(dict(group=k,samples=len(rr),life_mean=a['mean'],life_min=a['minimum'],life_max=a['maximum'],stress_mean=b['mean']))
  axes[0].bar(range(len(records)),[r['samples'] for r in records]);axes[1].scatter([r['stress_mean'] for r in records],[r['life_mean'] for r in records]);axes[1].set_yscale('log');axes[0].set(xlabel='Group index',ylabel='Observations');axes[1].set(xlabel='Mean stress amplitude',ylabel='Mean cycles')
 elif mode=='quality2':
  for h in headers:
   vals=[r[h] for r in selected];missing=sum(v is None or str(v).strip()=='' for v in vals);bad=sum(v is not None and isinstance(v,(float,int)) and not math.isfinite(float(v)) for v in vals);records.append(dict(column=h,observations=len(vals),missing=missing,nonfinite=bad,unique=len(set(str(v) for v in vals if v is not None))))
  axes[0].bar(range(len(records)),[r['missing'] for r in records]);axes[0].set(xlabel='Column index (see CSV)',ylabel='Missing cells');axes[1].hist([float(r[life]) for r in selected],bins=30);axes[1].set(xlabel='Cycles to failure',ylabel='Rows')
 else:
  for h in numeric:
   a=stats([r[h] for r in selected]);records.append(dict(column=h,**a))
  axes[0].hist([float(r[life]) for r in selected],bins=35);axes[0].set(xlabel='Cycles to failure',ylabel='Rows');axes[1].scatter([r[stress] for r in selected],[r[life] for r in selected],s=8,alpha=.35);axes[1].set(xlabel='Stress amplitude (source units)',ylabel='Cycles to failure',yscale='log')
 if mode=='filter2':extras['derived.zip']=zip_csv('selected-rows.csv',selected)
 duplicates=len(selected)-len({tuple(str(r[h]) for h in headers) for r in selected});return dict(records=records,summary=dict(sourceRows=len(rows),selectedRows=len(selected),columns=len(headers),groups=len(groups),exactDuplicateRows=duplicates),notes=notes,quality=dict(missingPreserved=True,zeroPreserved=True)),fig

def zip_csv(name,rows):
 b=io.BytesIO()
 with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED) as z:z.writestr(name,csv_bytes(rows))
 return b.getvalue()

def csv_bytes(rows):
 keys=list(dict.fromkeys(k for r in rows for k in r));s=io.StringIO();w=csv.DictWriter(s,fieldnames=keys);w.writeheader();w.writerows(rows);return s.getvalue().encode('utf-8-sig')

def lpj(raw,p,extras):
 import scipy.io
 with zipfile.ZipFile(raw) as z:
  npp=scipy.io.loadmat(io.BytesIO(z.read(p['nppFile'])))[p['nppVariable']];et=scipy.io.loadmat(io.BytesIO(z.read(p['etFile'])))[p['etVariable']]
 ensure(npp.shape==et.shape and npp.ndim==2,'NPP/ET matrix shapes differ');ensure(np.array_equal(npp[:,:2],et[:,:2]),'NPP/ET coordinate rows differ');ensure(npp.shape[1]-2==p['lastYear']-p['firstYear']+1,'Historical year mapping does not match columns');coords=npp[:,:2];mask=np.ones(len(coords),dtype=bool)
 if p['region']=='east':mask=coords[:,0]>=p['longitudeSplit']
 elif p['region']=='west':mask=coords[:,0]<p['longitudeSplit']
 ensure(mask.any(),'Empty region');ensure(p['firstYear']<=p['yearStart']<=p['yearEnd']<=p['lastYear'],'Years outside mapped historical range');records=[]
 for year in range(p['yearStart'],p['yearEnd']+1):
  i=year-p['firstYear']+2;nv=npp[mask,i];ev=et[mask,i];ensure(np.isfinite(nv).all() and np.isfinite(ev).all(),'Unmapped missing values in LPJ source');a=stats(nv);b=stats(ev);records.append(dict(year=year,grid_points=len(nv),npp_mean=a['mean'],et_mean=b['mean'],npp_min=a['minimum'],npp_max=a['maximum'],et_min=b['minimum'],et_max=b['maximum']))
 fig,axes=plt.subplots(1,2,figsize=(12,5));years=[r['year'] for r in records];axes[0].plot(years,[r['npp_mean'] for r in records],label='NPP');axes[0].plot(years,[r['et_mean'] for r in records],label='ET');axes[0].legend();axes[0].set(xlabel='Year',ylabel='Arithmetic grid mean (source units)');annual_n=np.array([r['npp_mean'] for r in records]);annual_e=np.array([r['et_mean'] for r in records]);correlation=float(np.corrcoef(annual_n,annual_e)[0,1]) if len(records)>2 and annual_n.std()>0 and annual_e.std()>0 else None;axes[1].scatter(annual_e,annual_n,c=years,cmap='viridis');axes[1].set(xlabel='ET (source units)',ylabel='NPP (source units)');return dict(records=records,summary=dict(years=len(records),gridPoints=int(mask.sum()),annualCorrelation=correlation),notes=['Columns 1/2 are longitude/latitude; historical columns map to 1981–2020.','Arithmetic grid means; not area-weighted basin totals. MAT files do not declare units, so no unit conversion or physical WUE is asserted.','Future-scenario matrices have 46 value columns rather than the declared 40-year future interval; they are excluded pending authoritative year mapping.'],quality=dict(coordinatesMatched=True,yearCountMatched=True)),fig

def ctd(raw,p,extras):
 records=[];profiles=[];qc_rows=[];notes=['Primary ITS-90 temperature, practical salinity and source depth in metres. No TEOS-10 conversion or named water-mass classification.','QC excludes declared bad_flag, nonfinite, nonzero source flag, nonpositive pump status, and configured physical bounds; missing never becomes zero.','Profile and gradient use descending-cast samples through maximum depth, averaged into depth bins.']
 with zipfile.ZipFile(raw) as z:
  names=[i for i in safe_members(z) if i.filename.replace('．','.').endswith('.cnv')]
  if p['station']:names=[i for i in names if PurePosixPath(i.filename).name.replace('．','.').split('.')[0]==p['station']]
  ensure(names,'Selected station not present')
  for info in names:
   txt=z.read(info).decode('utf-8',errors='replace');header,body=txt.split('*END*',1);columns={m.group(2).strip():int(m.group(1)) for m in re.finditer(r'^# name (\d+) = ([^:]+):',header,re.M)};required=['depSM','prDM','t090C','sal00','flag','pumps'];ensure(all(k in columns for k in required),'CNV column mapping missing');a=np.loadtxt(io.StringIO(body));ensure(a.ndim==2 and a.shape[1]==len(columns),'CNV column count differs');bad=float(re.search(r'# bad_flag = (\S+)',header)[1]);d=a[:,columns['depSM']];t=a[:,columns['t090C']];s=a[:,columns['sal00']];depth_valid=np.isfinite(d)&(d!=bad);ensure(depth_valid.any(),'No valid depths');deep=int(np.argmax(np.where(depth_valid,d,-np.inf)));valid=np.isfinite(d)&np.isfinite(t)&np.isfinite(s)&(d!=bad)&(t!=bad)&(s!=bad)&(d>=0)&(d<=p['maxDepth'])&(t>=p['temperatureMin'])&(t<=p['temperatureMax'])&(s>=p['salinityMin'])&(s<=p['salinityMax'])&(a[:,columns['flag']]==0)&(a[:,columns['pumps']]>0);down=valid&(np.arange(len(a))<=deep);ensure(down.sum()>=3,'No valid downcast profile');station=PurePosixPath(info.filename).name.replace('．','.').split('.')[0];buckets=np.floor(d[down]/p['binSize']).astype(int);prof=[]
   for bucket in np.unique(buckets):
    sel=down.copy();sel[down]=buckets==bucket;prof.append(dict(station=station,depth_m=float(np.mean(d[sel])),temperature_C=float(np.mean(t[sel])),salinity_PSU=float(np.mean(s[sel])),samples=int(sel.sum())))
   ensure(len(prof)>=3,'Too few depth bins');profiles+=prof;dd=np.array([r['depth_m'] for r in prof]);tt=np.array([r['temperature_C'] for r in prof]);grad=np.gradient(tt,dd);region=(dd>=p['gradientDepthMin'])&(dd<=p['gradientDepthMax']);idx=np.where(region)[0];therm=int(idx[np.argmax(np.abs(grad[idx]))]) if len(idx) else None;records.append(dict(station=station,totalRows=len(a),validRows=int(valid.sum()),rejectedRows=int((~valid).sum()),downcastRows=int(down.sum()),depthBins=len(prof),depth_max_m=float(dd.max()),temperature_mean_C=stats(t[valid])['mean'],salinity_mean_PSU=stats(s[valid])['mean'],thermocline_depth_m=float(dd[therm]) if therm is not None else None,max_abs_temperature_gradient_C_per_m=float(abs(grad[therm])) if therm is not None else None));qc_rows.append(dict(station=station,valid=int(valid.sum()),rejected=int((~valid).sum())))
 fig,axes=plt.subplots(1,2,figsize=(12,6));mode=p['mode']
 for r in records:
  prof=[x for x in profiles if x['station']==r['station']];d=[x['depth_m'] for x in prof];t=[x['temperature_C'] for x in prof];s=[x['salinity_PSU'] for x in prof]
  if mode=='ctd-ts2':axes[0].scatter(s,t,s=5,alpha=.55,label=r['station']);axes[1].plot(t,d,linewidth=.8)
  else:axes[0].plot(t,d,linewidth=.8,label=r['station']);axes[1].plot(s,d,linewidth=.8)
 if mode=='ctd-ts2':axes[0].set(xlabel='Practical salinity (PSU)',ylabel='Temperature (deg C)');axes[1].set(xlabel='Temperature (deg C)',ylabel='Depth (m)');axes[1].invert_yaxis()
 else:
  for ax in axes:ax.invert_yaxis();ax.set_ylabel('Depth (m)')
  axes[0].set_xlabel('Temperature (deg C)');axes[1].set_xlabel('Practical salinity (PSU)')
 if len(records)<=12:axes[0].legend(fontsize=7)
 extras['derived.zip']=zip_csv('binned-profiles.csv',profiles);return dict(records=records,summary=dict(stations=len(records),sourceRows=sum(r['totalRows'] for r in records),validRows=sum(r['validRows'] for r in records),depthBins=len(profiles)),notes=notes+(['Thermocline is the maximum absolute dT/dz within the configured interval, not a mixed-layer-depth diagnosis.'] if mode=='ctd-thermocline2' else []),quality=dict(cnvColumnsVerified=True,badFlagHandledExactly=True)),fig

def barcode(raw,p,extras):
 records=[];headers=[];allowed=set('ACGTRYSWKMBDHVN-?');counts=Counter()
 with zipfile.ZipFile(raw) as z:
  for info in safe_members(z):
   if not info.filename.endswith('.fasta'):continue
   gene=PurePosixPath(info.filename).stem
   if p['gene']!='all' and gene!=p['gene']:continue
   seqs=[];name=None;parts=[]
   for line in z.read(info).decode('utf-8-sig').splitlines():
    if line.startswith('>'):
     if name is not None:seqs.append((name,''.join(parts).upper()))
     name=line[1:].strip();parts=[]
    elif line.strip():ensure(name is not None,'Sequence before FASTA header');parts.append(line.strip())
   if name is not None:seqs.append((name,''.join(parts).upper()))
   ensure(seqs,'Empty FASTA');ensure(len({x[0] for x in seqs})==len(seqs),'Duplicate FASTA identifiers')
   for name,seq in seqs:
    ensure(seq and set(seq)<=allowed,'Invalid nucleotide alphabet in '+gene+'/'+name+': '+''.join(sorted(set(seq)-allowed)));c=Counter(seq);acgt=sum(c[k] for k in 'ACGT');gc=(c['G']+c['C'])/acgt if acgt else None;records.append(dict(gene=gene,sequence_id=name,length=len(seq),ACGT=acgt,ambiguity=len(seq)-acgt,gc_fraction=gc));counts[gene]+=1
 ensure(records,'No selected sequences');fig,axes=plt.subplots(1,2,figsize=(12,5));axes[0].hist([r['length'] for r in records],bins=40);axes[0].set(xlabel='Sequence length (characters)',ylabel='Sequences');axes[1].hist([100*r['gc_fraction'] for r in records if r['gc_fraction'] is not None],bins=30);axes[1].set(xlabel='GC among A/C/G/T (%)',ylabel='Sequences');return dict(records=records,summary=dict(sequences=len(records),genes=dict(counts),characters=sum(r['length'] for r in records),ambiguousCharacters=sum(r['ambiguity'] for r in records)),notes=['Only the selected V2 source sequences are included; duplicated V1 downloads are not counted twice.','GC excludes ambiguous/gap characters from its denominator. No species identification or phylogeny is inferred.'],quality=dict(validIUPAC=True,identifiersUniqueWithinGene=True)),fig

def rsei(raw,p,extras):
 import rasterio
 from rasterio.io import MemoryFile
 records=[];first=None;last=None;meta=None;previews=[]
 with zipfile.ZipFile(raw) as z:
  members={}
  for i in safe_members(z):
   match=re.search(r'(?:^|/)(20\d{2})/RSEI_final[^/]*\.tif$',i.filename)
   if match:
    year=int(match[1]);ensure(year not in members,'Multiple final rasters for one year');members[year]=i
  expected=list(range(p['yearStart'],p['yearEnd']+1));ensure(all(y in members for y in expected),'Missing selected RSEI years')
  for year in expected:
   with MemoryFile(z.read(members[year])) as mf:
    with mf.open() as ds:
     current=(ds.width,ds.height,str(ds.crs),tuple(ds.transform));ensure(ds.count==1 and ds.crs is not None,'Expected a georeferenced single band');ensure(ds.scales[0]==1 and ds.offsets[0]==0,'Unmapped scale/offset');ensure(meta is None or meta==current,'Year grids or CRS differ');meta=current;a=ds.read(1,masked=True).astype('float64');a=np.ma.masked_invalid(a);x=a.compressed();ensure(len(x)>0,'Empty RSEI raster');ensure(float(x.min())>=-1e-6 and float(x.max())<=1.000001,'RSEI values outside 0–1');mean=float(x.mean());ind=math.fsum(float(v) for v in x)/len(x);ensure(math.isclose(mean,ind,rel_tol=1e-10,abs_tol=1e-10),'Independent raster mean differs');records.append(dict(year=year,valid_pixels=len(x),missing_pixels=a.size-len(x),rsei_mean=mean,rsei_std=float(x.std()),rsei_min=float(x.min()),rsei_max=float(x.max())));previews.append((year,a[::max(1,ds.height//350),::max(1,ds.width//350)].copy()))
     if first is None:first=a
     last=a
 fig,axes=plt.subplots(1,3,figsize=(15,5));im=axes[0].imshow(previews[0][1],vmin=0,vmax=1,cmap='YlGn');axes[0].set_title(str(expected[0])+' RSEI');axes[1].imshow(previews[-1][1],vmin=0,vmax=1,cmap='YlGn');axes[1].set_title(str(expected[-1])+' RSEI');axes[2].plot(expected,[r['rsei_mean'] for r in records],marker='o');axes[2].set(xlabel='Year',ylabel='Mean RSEI (dimensionless)');fig.colorbar(im,ax=axes[:2],shrink=.7);delta=last-first;valid=delta.compressed();summary=dict(years=len(records),firstMean=records[0]['rsei_mean'],lastMean=records[-1]['rsei_mean'],commonPixels=len(valid),meanPixelChange=float(valid.mean()) if len(valid) else None);return dict(records=records,summary=summary,notes=['Uses published RSEI_final source rasters, not a recomputed PCA or a newly inferred ecological index.','Each annual mean uses its own valid mask; pixel change uses only overlapping valid pixels. No missing value is zero-filled.','Map previews are regularly subsampled for display; CSV statistics use all valid pixels.'],quality=dict(yearsComplete=True,spatialGridMatched=True,independentMeans=True),spatial=dict(width=meta[0],height=meta[1],crs=meta[2],transform=meta[3])),fig

def image_analysis(raw,p,extras):
 from PIL import Image,ImageOps
 records=[];seen={};groups=Counter();thumbs=[];total=0
 with zipfile.ZipFile(raw) as z:
  members=[i for i in safe_members(z) if i.filename.lower().endswith(('.png','.jpg','.jpeg'))];ensure(members,'No image members')
  for i in members:
   data=z.read(i);h=hashlib.sha256(data).hexdigest()
   with Image.open(io.BytesIO(data)) as im:
    im=ImageOps.exif_transpose(im).convert('RGB');rgb=np.asarray(im);pixelhash=hashlib.sha256(str(im.size).encode()+rgb.tobytes()).hexdigest();gray=np.asarray(im.convert('L'),dtype=np.float64);ensure(gray.size<=50000000,'Image too large');lap=gray[:-2,1:-1]+gray[2:,1:-1]+gray[1:-1,:-2]+gray[1:-1,2:]-4*gray[1:-1,1:-1];score=float(lap.var());mean=float(gray.mean());dup=seen.get(pixelhash);seen.setdefault(pixelhash,i.filename);quality='lower-sharpness' if score<p['blurThreshold'] else 'higher-sharpness';groups[quality]+=1;records.append(dict(image=i.filename,width=im.width,height=im.height,file_sha256=h,pixel_sha256=pixelhash,duplicate_of=dup or '',laplacian_variance=score,mean_gray=mean,sharpness_group=quality))
    if len(thumbs)<12:im.thumbnail((240,180));thumbs.append((i.filename,im.copy()))
   total+=1
 fig,axes=plt.subplots(1,2,figsize=(12,5));axes[0].hist([r['laplacian_variance'] for r in records],bins=40);axes[0].axvline(p['blurThreshold'],color='red',linestyle='--');axes[0].set(xlabel='Interior grayscale Laplacian variance',ylabel='Images');axes[1].bar(['unique','duplicates'],[len(seen),total-len(seen)]) if p['mode']=='duplicates2' else axes[1].bar(list(groups),list(groups.values()));axes[1].set_ylabel('Images');contact,axs=plt.subplots(3,4,figsize=(12,8))
 for ax in axs.flat:ax.axis('off')
 for ax,(name,im) in zip(axs.flat,thumbs):ax.imshow(im);ax.set_title(PurePosixPath(name).name,fontsize=8)
 b=io.BytesIO();contact.tight_layout();contact.savefig(b,format='png',dpi=110);plt.close(contact);extras['contact.png']=b.getvalue();ensure(sum(groups.values())==total,'Image group totals differ');return dict(records=records,summary=dict(images=total,uniqueDecodedRGBImages=len(seen),exactPixelDuplicates=total-len(seen),sharpnessGroups=dict(groups),blurThreshold=p['blurThreshold']),notes=['Exact duplicate detection uses decoded RGB pixel content and dimensions; it does not assert perceptual near-duplicate detection.','Laplacian variance is a reproducible sharpness indicator; the selected threshold is a grouping parameter, not a ground-truth blur label.','Contact sheet shows the first 12 source images without altering scientific analysis results.'],quality=dict(allImagesDecoded=True,groupCountMatched=True)),fig

def process(ctx):
 p=ctx.params;mode=p['mode'];ensure(mode in MODES,'Unsupported method');h=hashlib.sha256();size=0;extras={}
 with tempfile.TemporaryFile() as f:
  for block in ctx.input('source').bytes():size+=len(block);ensure(size<=4000000000,'Source exceeds 4GB');h.update(block);f.write(block)
  f.seek(0)
  if mode in ['profile2','filter2','quality2','pivot2','fatigue2']:report,fig=workbook(f.read(),p,extras)
  elif mode=='lpj2':report,fig=lpj(f,p,extras)
  elif mode.startswith('ctd-'):report,fig=ctd(f,p,extras)
  elif mode=='barcode2':report,fig=barcode(f,p,extras)
  elif mode=='rsei2':report,fig=rsei(f,p,extras)
  else:report,fig=image_analysis(f,p,extras)
 ensure(report['records'],'No result rows');report.update(schema='conet.scientific-report/v1',state='succeeded',method=mode,parameters=p,inputFileHashes={p['filename']:h.hexdigest()},inputBytes=size,operator='conet_batch_analysis@1.0',synthetic=False);b=io.BytesIO();fig.savefig(b,format='png',dpi=120,bbox_inches='tight');plt.close(fig);extras['chart.png']=b.getvalue();extras['report.json']=json.dumps(report,ensure_ascii=False,allow_nan=False).encode();extras['table.csv']=csv_bytes(report['records']);extras['verification.json']=json.dumps(dict(state='passed',checks=['input SHA256 captured','declared mapping and missing rules','method invariants','finite output'],summary=report['summary'])).encode();output=io.BytesIO()
 with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
  for name,data in extras.items():z.writestr(name,data)
 ensure(len(output.getvalue())<100000000,'Output exceeds 100MB');ctx.bytes_output('result','zip').write(output.getvalue())

def infer_outputs(inputs,params):
 from xstream_operator import descriptor,result
 return result({'result':descriptor(['bytes'],['zip'],None,certainty='known')})

def preview_outputs(inputs,params,limits):
 from xstream_operator import preview_process
 return preview_process(process,inputs,params,limits)

if __name__=='__main__':
 from xstream_operator import run_operator
 run_operator(process,infer_outputs,preview_outputs=preview_outputs)
