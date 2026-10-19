import {VISIT_KEY,visitContext,trackedUrl,touchFromUrl} from './context.mjs';
const endpoint='https://wsozuygcqgrhcczacjul.supabase.co/functions/v1/workshop-analytics';
const ar=document.documentElement.lang==='ar';
let context=null;
try{context=visitContext({href:location.href,referrer:document.referrer,stored:sessionStorage.getItem(VISIT_KEY),now:Date.now(),id:crypto.randomUUID(),doNotTrack:navigator.doNotTrack});if(context)sessionStorage.setItem(VISIT_KEY,JSON.stringify(context));}catch{context=visitContext({href:location.href,referrer:document.referrer,stored:null,now:Date.now(),id:crypto.randomUUID(),doNotTrack:navigator.doNotTrack});}
function record(name,details={},id=crypto.randomUUID()) {
 const current=context||(name==='feedback'?{id:crypto.randomUUID(),touch:touchFromUrl('https://theclips.academy/')} :null);
 if(!current)return Promise.resolve(false);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
 return fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,signal:controller.signal,body:JSON.stringify({id,session_id:current.id,name,touch:current.touch,page:location.pathname,device:innerWidth<768?'mobile':innerWidth<1024?'tablet':'desktop',language:ar?'ar':'en',details})}).then(async response=>response.ok && (await response.json()).recorded===true).catch(()=>false).finally(()=>clearTimeout(timer));
}
record('landing_view');
let engaged=false;
function engage(){if(!engaged && !document.hidden){engaged=true;record('landing_engaged');}}
setTimeout(engage,10000);
addEventListener('scroll',()=>{if(scrollY>document.documentElement.scrollHeight*.35)engage();},{passive:true});
// Only public campaign tags and an opaque visit ID cross to the checkout host.
document.querySelectorAll('a[href]').forEach(link=>{
 const url=new URL(link.href,location.href);
 if(url.origin==='https://os.theclips.academy' && url.pathname==='/workshop/checkout') {
  link.href=trackedUrl(url.href,context);
  link.addEventListener('click',()=>{link.href=trackedUrl(link.href,context);record('cta_click',{position:link.closest('header')?'header':link.closest('#top')?'hero':'pricing'});},{capture:true});
 } else if(link.lang && ['en','ar'].includes(link.lang))link.href=trackedUrl(url.href,context);
});
const host=document.querySelector('#tickets .ticket-copy');
if(host){
 const copy=ar?{open:'شاركنا ما يساعدك على اتخاذ القرار',question:'ما الذي يساعدك على اتخاذ القرار؟',choose:'اختر سبباً',comment:'هل تود إخبارنا بشيء آخر؟',send:'إرسال الملاحظات',close:'إغلاق',sending:'جارٍ الإرسال',thanks:'شكراً. تساعدنا ملاحظاتك على تحسين الورشة.',error:'تعذر حفظ ملاحظاتك. حاول مجدداً أو راسلنا.',privacy:'كيف نستخدم بيانات الحجز',notice:'نستخدم مصدر الزيارة وخطوات الحجز لتحسين الورشة. تُحفظ بيانات التواصل عند إرسال نموذج الحجز. لا نسجل بيانات البطاقات أو روابط الدخول الخاصة ضمن التحليلات. يمنع إعداد عدم التتبع تسجيل الزيارات. تُرسل الملاحظات التي تشاركها إلى فريق الأكاديمية.',reasons:[['price','السعر'],['timing','موعد الورشة'],['unclear_offer','أحتاج إلى فهم محتوى الورشة'],['tools','لدي سؤال حول الأدوات'],['not_ready','لست جاهزاً بعد'],['other','سبب آخر']]}:{open:'Tell us what would help you decide',question:'What would help you decide?',choose:'Choose one',comment:'Anything you want us to know?',send:'Send feedback',close:'Close',sending:'Sending…',thanks:'Thanks. Your feedback helps us improve the workshop.',error:'Feedback could not be saved. Try again or email us.',privacy:'How we use booking data',notice:'We use visit source and booking steps to improve this workshop. Contact details are saved when you submit the booking form. We do not record card details or private access links in analytics. Do Not Track prevents visit tracking. Feedback you submit is shared with the Academy team.',reasons:[['price','The price'],['timing','The date or time'],['unclear_offer','I need to understand the workshop'],['tools','I have a question about the tools'],['not_ready','I am not ready yet'],['other','Something else']]};
 const area=document.createElement('div');area.className='workshop-feedback';
 area.innerHTML=`<button type="button" class="feedback-open">${copy.open}</button><form hidden><label for="feedback-reason">${copy.question}</label><select id="feedback-reason" required><option value="">${copy.choose}</option>${copy.reasons.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select><label for="feedback-text">${copy.comment}</label><textarea id="feedback-text" maxlength="500" rows="3"></textarea><p role="alert" hidden></p><div><button type="submit">${copy.send}</button><button type="button" class="feedback-close">${copy.close}</button></div></form><p role="status" hidden></p><details><summary>${copy.privacy}</summary><p>${copy.notice}</p></details>`;
 host.append(area);const open=area.querySelector('.feedback-open');const form=area.querySelector('form');const status=area.querySelector('[role="status"]');const error=area.querySelector('[role="alert"]');const submit=form.querySelector('[type="submit"]');let attempt={id:crypto.randomUUID(),payload:''};
 open.addEventListener('click',()=>{form.hidden=false;open.hidden=true;form.querySelector('select').focus();});
 area.querySelector('.feedback-close').addEventListener('click',()=>{form.hidden=true;open.hidden=false;open.focus();});
 form.addEventListener('submit',async event=>{event.preventDefault();error.hidden=true;submit.disabled=true;submit.textContent=copy.sending;
  const details={reason:form.querySelector('select').value,text:form.querySelector('textarea').value};const payload=JSON.stringify(details);if(attempt.payload!==payload)attempt={id:crypto.randomUUID(),payload};
  const ok=await record('feedback',details,attempt.id);
  submit.disabled=false;submit.textContent=copy.send;
  if(ok){form.hidden=true;status.textContent=copy.thanks;status.hidden=false;}else{error.textContent=copy.error;const support=document.createElement('a');support.href='mailto:mail@theclips.agency';support.textContent=' mail@theclips.agency';error.append(support);error.hidden=false;}
 });
}
