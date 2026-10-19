// No contact details, payment data, full URLs or private link tokens belong here.
export const VISIT_KEY = 'academy.workshop.visit.v1';
export const VISIT_TTL = 30 * 60_000;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PAGES = ['/', '/ar.html', '/workshop/checkout', '/workshop/sign-in', '/workshop/account', '/workshop/order'];
const own = ['theclips.academy','www.theclips.academy','os.theclips.academy','localhost','127.0.0.1'];
export function tag(value) {
  return typeof value==='string' && value.length<=80 && /^[a-z0-9][a-z0-9 _./-]*$/i.test(value) && !/\d{11}/.test(value) ? value.trim().toLowerCase() : '';
}
export function hostname(value) {
  try {const host=new URL(value.includes('://')?value:`https://${value}`).hostname.toLowerCase();return host.length<=150 && /^[a-z0-9.-]+$/.test(host) && !own.includes(host)?host:'';} catch {return '';}
}
export function sourceForHost(host) {
  const is = domain => host===domain || host.endsWith(`.${domain}`);
  for(const [domain,source] of [['instagram.com','instagram'],['instagr.am','instagram'],['facebook.com','facebook'],['fb.com','facebook'],['tiktok.com','tiktok'],['youtube.com','youtube'],['youtu.be','youtube'],['linkedin.com','linkedin'],['twitter.com','x'],['x.com','x'],['t.co','x'],['bing.com','bing'],['duckduckgo.com','duckduckgo']])if(is(domain))return source;
  if(/(^|\.)google\.[a-z.]+$/.test(host))return 'google';
  return host?'referral':'direct';
}
export function normalizeTouch(raw) {
  if(!raw || typeof raw!=='object' || Array.isArray(raw))return null;
  if(Object.keys(raw).some(k=>!['source','medium','campaign','content','term','landing_path','referrer_host'].includes(k)))return null;
  const host=hostname(typeof raw.referrer_host==='string'?raw.referrer_host:'');
  const source=tag(raw.source)||sourceForHost(host);
  return {source,medium:tag(raw.medium)||(host?['google','bing','duckduckgo'].includes(source)?'organic':'referral':'none'),campaign:tag(raw.campaign),content:tag(raw.content),term:tag(raw.term),landing_path:PAGES.includes(raw.landing_path)?raw.landing_path:'/',referrer_host:host};
}
export function touchFromUrl(href, referrer='') {
  const url=new URL(href);
  return normalizeTouch({source:url.searchParams.get('utm_source'),medium:url.searchParams.get('utm_medium'),campaign:url.searchParams.get('utm_campaign'),content:url.searchParams.get('utm_content'),term:url.searchParams.get('utm_term'),landing_path:url.searchParams.get('ac_landing')||url.pathname,referrer_host:url.searchParams.get('ac_ref')||referrer});
}
export function visitContext({href,referrer,stored,now,id,doNotTrack}) {
  if(doNotTrack==='1')return null;
  let cached=null;try{cached=JSON.parse(stored||'null');}catch{/* Ignore damaged browser storage. */}
  const url=new URL(href);const incoming=url.searchParams.get('ac_session');const sentAt=Number(url.searchParams.get('ac_at'));const freshIncoming=sentAt>0 && sentAt<=now && now-sentAt<VISIT_TTL;
  const validCached=cached && UUID.test(cached.id) && Number.isFinite(cached.expires_at) && cached.expires_at>now && cached.expires_at<=now+VISIT_TTL;
  const touch=touchFromUrl(href,referrer);
  const usable=validCached?normalizeTouch(cached.touch):null;
  return {id:UUID.test(incoming||'') && freshIncoming?incoming:validCached?cached.id:id,expires_at:now+VISIT_TTL,touch:touch.source==='direct' && usable?usable:touch};
}
export function trackedUrl(href,context) {
  const url=new URL(href);
  if(!context || !['https://theclips.academy','https://os.theclips.academy'].includes(url.origin))return url.href;
  url.searchParams.set('ac_session',context.id);url.searchParams.set('ac_at',String(context.expires_at-VISIT_TTL));url.searchParams.set('ac_landing',context.touch.landing_path);
  if(context.touch.referrer_host)url.searchParams.set('ac_ref',context.touch.referrer_host);
  for(const key of ['source','medium','campaign','content','term'])if(context.touch[key])url.searchParams.set(`utm_${key}`,context.touch[key]);
  return url.href;
}
