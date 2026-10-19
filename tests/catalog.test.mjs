import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCatalog} from '../features/pricing/catalog.mjs';
const catalog=(server_time,stage,ticket_amount)=>({status:'open',server_time,stage,ticket_amount,currency:'usd',setup_ready:true,checkout_available:true});

test('last 31 minutes show an accurate pause without changing ticket amounts or deadlines',()=>{
 for(const [time,stage,amount] of [['2026-10-22T19:30:00Z','early',4700],['2026-10-26T19:30:00Z','standard',6700],['2026-10-30T19:30:00Z','final',9700]]) {
  const result=validateCatalog({...catalog(time,stage,amount),checkout_available:false,checkout_pause_reason:'boundary_near'});
  assert.equal(result.status,'paused');assert.equal(result.stage.amount,amount);assert.equal(Boolean(result.resumes),stage!=='final');
 }
});
