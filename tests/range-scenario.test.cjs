const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const load=require('../scripts/load-typescript.cjs');
const {parseScenario,scenarioSeats,POSITIONS}=load(path.resolve('src/utils/rangeScenario.ts'));
const {parseReferenceRange}=load(path.resolve('src/utils/referenceRanges.ts'));
const {paintReferenceRange,editorHistory}=load(path.resolve('src/dev/referenceEditorModel.ts'));
const plain=x=>JSON.parse(JSON.stringify(x));
const scenario={tableSize:6,hero:'BB',opener:'SB',stackBb:100,stakes:'NL50',openSizeBb:2.5};
test('状況情報は読み書き・塗り・Undoで保持し、未登録の従来レンジも利用できる',()=>{
 const original={id:'test',name:'Test',groups:{raise:['AA']}};
 assert.deepEqual(plain(parseReferenceRange(original)),original);
 const range={...original,scenario};
 const parsed=parseReferenceRange(JSON.parse(JSON.stringify(range)));
 assert.deepEqual(plain(parsed),range);
 const painted=paintReferenceRange(parsed,['KK'],'raise','add');
 assert.deepEqual(plain(painted.scenario),scenario);
 const changed=editorHistory({past:[],present:parsed,future:[]},{type:'change',document:painted});
 assert.deepEqual(plain(editorHistory(changed,{type:'undo'}).present),range);
});
test('不正な人数・位置関係・サイズを拒否する',()=>{
 for(const patch of [{tableSize:9},{hero:'BU'},{opener:'BB'},{hero:'UTG'},{openSizeBb:0},{openSizeBb:101},{stackBb:NaN},{stakes:''},{typo:1}]) assert.throws(()=>parseScenario({...scenario,...patch}));
 assert.throws(()=>parseScenario({tableSize:6,hero:'BB'}));
 assert.doesNotThrow(()=>parseScenario({tableSize:6,hero:'UTG'}));
});
test('自分を手前に固定し、Foldと未アクションを区別する',()=>{
 for(let h=0;h<POSITIONS.length;h++) {
   const s={tableSize:6,hero:POSITIONS[h],...(h?{opener:POSITIONS[h-1]}:{})};
   const seats=scenarioSeats(s);
   assert.equal(seats.find(x=>x.state==='hero').slot,0);
   assert.equal(new Set(seats.map(x=>x.slot)).size,6);
   for(let i=0;i<6;i++) assert.equal(seats[i].state,i===h?'hero':i===h-1?'opener':i<h?'folded':'waiting');
 }
 const seats=scenarioSeats({tableSize:6,hero:'BTN',opener:'CO'});
 assert.equal(seats.find(x=>x.position==='SB').state,'waiting');
 assert.equal(seats.find(x=>x.position==='BB').state,'waiting');
});
test('20レンジの状況は名前と一致し、Openサイズは推測していない',()=>{
 const dir=path.resolve('src/data/reference-ranges');
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))) {
   const r=parseReferenceRange(JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')));
   assert.equal(r.name,r.scenario.hero+(r.scenario.opener?' vs '+r.scenario.opener:' Open'));
   assert.equal(r.scenario.stackBb,100); assert.equal(r.scenario.stakes,'NL50');
   assert.equal(r.scenario.openSizeBb,undefined);
 }
});
