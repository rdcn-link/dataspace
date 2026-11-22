import copy, math, statistics, unittest
from seed_weight import normalize, merge, MAPPING, VERSION

class SeedTests(unittest.TestCase):
    def test_units_and_quality(self):
        raw=b'sample_id,species,life_form,weight,unit\na,s,grass,2,g\nb,s,grass,2000,mg\nc,s,grass,,g\n'
        with self.assertRaises(ValueError):normalize(raw,{})
        rows,q=normalize(raw,dict(analysisScope=dict(invalidPolicy='exclude')))
        self.assertEqual([r['weight_g'] for r in rows],[2,2]);self.assertEqual(q['excludedRows'],1)
        with self.assertRaises(ValueError):normalize(raw,dict(sampleLimit=1))
        with self.assertRaises(ValueError):normalize(raw.replace(b'2000,mg',b'2000,kg'),{})
        with self.assertRaises(ValueError):normalize(raw.replace(b'\nb,s',b'\na,s'),{})

    def summaries(self):
        result=[]
        for node,values in [('a',[1,3]),('b',[10,11,12,13,14])]:
            mean=statistics.mean(values)
            result.append(dict(node=node,serviceId='svc-048',version=VERSION,unit='g/1000 seeds',parameterHash='same',sampleHashes=[f'{node}{i}' for i in range(len(values))],validRows=len(values),inputRows=len(values),excludedRows=0,filteredRows=0,groupBy='species',groups=[dict(group='s',count=len(values),mean=mean,m2=sum((x-mean)**2 for x in values),min=min(values),max=max(values))]))
        return result

    def test_unequal_partitions_match_central_statistics(self):
        report=merge(self.summaries(),['a','b']);g=report['groups'][0];values=[1,3,10,11,12,13,14]
        self.assertAlmostEqual(g['mean'],statistics.mean(values));self.assertAlmostEqual(g['sampleSD'],statistics.stdev(values));self.assertEqual(g['count'],7)
        self.assertNotEqual(g['mean'],7) # naive average of node means

    def test_merge_blocks_partial_duplicate_or_inconsistent_results(self):
        for change in ('missing','unit','parameters','duplicate','count'):
            s=self.summaries()
            if change=='missing':s.pop()
            if change=='unit':s[1]['unit']='mg'
            if change=='parameters':s[1]['parameterHash']='different'
            if change=='duplicate':s[1]['sampleHashes'][0]=s[0]['sampleHashes'][0]
            if change=='count':s[1]['groups'][0]['count']=1
            with self.subTest(change=change),self.assertRaises(ValueError):merge(s,['a','b'])

if __name__=='__main__':unittest.main(verbosity=2)
