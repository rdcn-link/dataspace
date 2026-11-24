import test from 'node:test';import assert from 'node:assert/strict';
import {publicDataset,publicNews,pageQuery,regexLiteral,safeURL} from './contracts.mjs';
test('public metadata does not leak file paths, identities or authorization',()=>{
 const value=publicDataset({_id:'abc',titleZh:'Test',path:'/mnt/private/file',uid:'private-user',auditor:'admin',accessToken:'secret',dacpUrl:'dacp://unverified'},{});
 assert.deepEqual(Object.keys(value).sort(),['capabilities','downloadCount','favoriteCount','id','seekCount','titleZh','viewCount']);assert.equal(value.capabilities.computeConnected,false);
});
test('query text remains literal and pagination is bounded',()=>{
 assert.equal(regexLiteral('a.*[b]'),'a\\.\\*\\[b\\]');
 assert.equal(pageQuery(new URLSearchParams('page=2&pageSize=24')).page,2);
 for(const text of ['page=0','pageSize=100000','sort=password','page=-1','page=1.5'])assert.throws(()=>pageQuery(new URLSearchParams(text)));
});
test('news links reject script protocols and embedded credentials',()=>{
 assert.equal(safeURL('javascript:alert(1)'),null);assert.equal(safeURL('https://user:secret@example.org/'),null);
 assert.equal(publicNews({_id:'1',isSend:'1',url:'https://example.org/',description:'news'}).isSend,undefined);
});
