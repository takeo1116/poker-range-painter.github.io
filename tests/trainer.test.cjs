const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const load=require('../scripts/load-typescript.cjs');
const {HANDS,correctActions,drawQuestion,restoreSettings}=load(path.resolve('src/trainer/model.ts'));
const range={id:'test',name:'Test',groups:{call:['AQs','JJ'],raise:['AA','AQs']}};
const plain=v=>JSON.parse(JSON.stringify(v));
test('Trainer: 混合は両方正解、未登録はFold',()=>{
  assert.deepEqual(plain(correctActions(range,'AQs')),['Call','Raise']);
  assert.deepEqual(plain(correctActions(range,'AA')),['Raise']);
  assert.deepEqual(plain(correctActions(range,'JJ')),['Call']);
  assert.deepEqual(plain(correctActions(range,'72o')),['Fold']);
});
test('Trainer: 全169ハンドで出題制限とカードの整合性を保つ',()=>{
  for(const hand of HANDS) for(const random of [0,.3,.999999]) {
    const q=drawQuestion({rangeIds:['test'],hands:[hand]},[range],()=>random);
    assert.equal(q.hand,hand); assert.equal(q.range.id,'test');
    assert.equal(q.combo[0],hand[0]); assert.equal(q.combo[2],hand[1]);
    assert.notEqual(q.combo.slice(0,2),q.combo.slice(2));
    assert.equal(q.combo[1]===q.combo[3],hand.endsWith('s'));
  }
  assert.equal(drawQuestion({rangeIds:[],hands:HANDS},[range]),null);
  assert.equal(drawQuestion({rangeIds:['test'],hands:[]},[range]),null);
});
test('Trainer: 保存設定の破損・削除済みID・空選択を安全に扱う',()=>{
  assert.equal(restoreSettings('bad',[range]).hands.length,169);
  const restored=restoreSettings(JSON.stringify({version:1,rangeIds:['test','gone'],hands:['AA','bad','AA']}),[range]);
  assert.deepEqual(plain(restored),{rangeIds:['test'],hands:['AA']});
  assert.deepEqual(plain(restoreSettings(JSON.stringify({version:1,rangeIds:[],hands:[]}),[range])),{rangeIds:[],hands:[]});
});
