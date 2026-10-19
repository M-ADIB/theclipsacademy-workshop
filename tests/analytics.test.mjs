import test from 'node:test';
import assert from 'node:assert/strict';
import {visitContext,trackedUrl,normalizeTouch,VISIT_TTL} from '../features/analytics/context.mjs';
const id='f553a403-fbf6-470c-846e-a6fbc4f11a72';
test('Instagram campaign and visit identity reach checkout without private query values',()=>{
 const c=visitContext({href:'https://theclips.academy/?utm_source=instagram&utm_medium=social&utm_campaign=october&email=test@example.com&token=secret',referrer:'',stored:null,now:1000,id,doNotTrack:null});
 const link=trackedUrl('https://os.theclips.academy/workshop/checkout',c);
 assert.ok(link.includes('utm_source=instagram'));assert.ok(!link.includes('secret'));assert.ok(!link.includes('test%40'));
 const next=visitContext({href:link,referrer:'https://theclips.academy/',stored:null,now:1001,id:'6b8df331-9af9-47fc-9d26-b4ea2304ccca',doNotTrack:null});assert.equal(next.id,id);assert.equal(next.touch.source,'instagram');
 const later=visitContext({href:link,referrer:'',stored:null,now:1001+VISIT_TTL,id:'6b8df331-9af9-47fc-9d26-b4ea2304ccca',doNotTrack:null});assert.notEqual(later.id,id);
});
test('Do Not Track disables visit tracking and private fields are not accepted as attribution',()=>{
 assert.equal(visitContext({href:'https://theclips.academy/',referrer:'',stored:null,now:1000,id,doNotTrack:'1'}),null);
 assert.equal(normalizeTouch({source:'instagram',email:'private@example.com'}),null);
 assert.equal(normalizeTouch({source:'private@example.com'}).source,'direct');
});
