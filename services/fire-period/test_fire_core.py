import copy, hashlib, json, unittest
from fire_core import normalize,merge,DEFAULT_SCOPE,bins
HEADER='detection_id,timestamp,longitude,latitude,confidence,source_type\n'
class FireTests(unittest.TestCase):
 def test_timezone_boundaries_filters_and_invalid(self):
  raw=(HEADER+'a,2024-04-30T16:00:00Z,124,52,80,human\nb,2024-05-04T00:00:00+08:00,124,52,95,human\nc,2024-05-01T12:00:00+08:00,124,52,79,human\nd,2024-05-01T12:00:00,124,52,95,human\n').encode()
  with self.assertRaises(ValueError):normalize(raw,{})
  rows,q,h=normalize(raw,{'analysisScope':{'invalidPolicy':'exclude'}})
  self.assertEqual(rows,[{'detection_id':'a','period':'2024-05-01','source':'human'}]);self.assertEqual((q['inputRows'],q['filteredRows'],q['excludedRows']),(4,2,1))
  with self.assertRaises(ValueError):normalize(raw,{'sampleLimit':1})
 def summary(self,node,raw):
  rows,q,hashes=normalize((HEADER+raw).encode(),{'analysisScope':{'groupBySource':False}})
  counts={}
  for row in rows:counts[row['period']]=counts.get(row['period'],0)+1
  return dict(serviceId='svc-023',version='1.1',unit='detection records',node=node,parameterHash='same',detectionHashes=hashes,groups=[dict(period=p,source='all',count=c) for p,c in counts.items()],**q)
 def test_exact_merge_zero_bins_and_duplicate_rejection(self):
  a=self.summary('a','a,2024-05-01T12:00:00+08:00,124,52,95,human\n');b=self.summary('b','b,2024-05-03T12:00:00+08:00,124,52,95,human\nc,2024-05-03T13:00:00+08:00,124,52,95,human\n')
  r=merge([a,b],['a','b']);self.assertEqual([g['count'] for g in r['groups']],[1,0,2]);self.assertEqual(r['validRows'],3)
  for change in ('duplicate','missing','parameters','count'):
   copies=copy.deepcopy([a,b])
   if change=='duplicate':copies[1]['detectionHashes'][0]=copies[0]['detectionHashes'][0]
   if change=='missing':copies.pop()
   if change=='parameters':copies[1]['parameterHash']='different'
   if change=='count':copies[1]['groups'][0]['count']=999
   with self.subTest(change=change),self.assertRaises(ValueError):merge(copies,['a','b'])
 def test_hour_month_empty_and_invalid_scopes(self):
  self.assertEqual(len(bins(DEFAULT_SCOPE)),3)
  scope=dict(DEFAULT_SCOPE,period='hour');self.assertEqual(len(bins(scope)),72)
  self.assertEqual(bins(dict(DEFAULT_SCOPE,period='month',start='2023-12-31T12:00:00+08:00',end='2024-02-01T00:00:00+08:00')),['2023-12','2024-01'])
  rows,q,h=normalize((HEADER+'a,2024-05-05T00:00:00Z,124,52,99,human\n').encode(),{});self.assertEqual(rows,[])
  for scope in ({'timezone':'UTC'},{'minConfidence':101},{'bbox':[127,50,121,54]},{'start':'2024-05-01'},{'end':'2024-04-01T00:00:00Z'}):
   with self.assertRaises(ValueError):normalize(HEADER.encode(),{'analysisScope':scope})
 def test_duplicate_filtered_ids_and_invalid_numeric_values(self):
  raw=HEADER+'same,2024-05-05T00:00:00Z,124,52,99,human\nsame,2024-05-01T00:00:00Z,124,52,99,human\n'
  with self.assertRaises(ValueError):normalize(raw.encode(),{'analysisScope':{'invalidPolicy':'exclude'}})
  for lon,lat,confidence in [('181','52','95'),('124','91','95'),('124','52','NaN'),('124','52','high')]:
   rows,q,_=normalize((HEADER+f'a,2024-05-01T00:00:00Z,{lon},{lat},{confidence},human\n').encode(),{'analysisScope':{'invalidPolicy':'exclude'}})
   self.assertEqual(rows,[]);self.assertEqual(q['excludedRows'],1)
 def test_winter_year_and_record_source_separation(self):
  raw=(HEADER+'a,2023-12-31T23:00:00+08:00,124,52,100,human\nb,2024-01-01T00:00:00+08:00,124,52,100,modis\nc,2024-03-01T00:00:00+08:00,124,52,100,human\n').encode()
  params={'analysisScope':{'start':'2023-12-01T00:00:00+08:00','end':'2024-04-01T00:00:00+08:00','period':'season'}}
  rows,q,_=normalize(raw,params)
  self.assertEqual([(r['period'],r['source']) for r in rows],[('2024-winter','human'),('2024-winter','modis'),('2024-spring','human')])
  self.assertEqual(bins(q['scope']),['2024-winter','2024-spring'])
  params['analysisScope']['period']='year';rows,_,_=normalize(raw,params);self.assertEqual([r['period'] for r in rows],['2023','2024','2024'])
  with self.assertRaises(ValueError):normalize(raw.replace(b',modis',b',unknown'),params)
if __name__=='__main__':unittest.main()
