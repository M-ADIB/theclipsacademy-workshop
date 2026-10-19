export function pricingCopy(language = 'en') {
  const arabic = language === 'ar';
  const money = amount => arabic ? `${amount / 100} دولار` : `$${amount / 100}`;
  return arabic ? {
    check: 'تحقّق',
    availability: 'تحقّق من التوفر في صفحة الحجز',
    soon: 'قريباً',
    opens: 'يُفتح الحجز قريباً',
    registration: 'سيُفتح التسجيل قريباً.',
    registrationCountdown: 'يُفتح التسجيل خلال',
    registrationEnded: 'يجري فتح التسجيل. يُرجى التحقق من صفحة الحجز.',
    stages: { early: 'سعر الحجز المبكر', standard: 'سعر الحجز العادي', final: 'سعر الحجز الأخير' },
    prices: (stages, amount) => `أسعار التذاكر: ${stages.map(s => money(s.amount)).join('، ')}. السعر الحالي ${money(amount)}.`,
    ticketOnly: 'السعر للتذكرة فقط. يمكنك إضافة الخيارات الأخرى عند الحجز.',
    campaignCountdown: 'ينتهي التسجيل خلال',
    increaseCountdown: amount => `يرتفع سعر التذكرة الحالي (${money(amount)}) بعد`,
    campaignEnded: 'انتهت فترة التسجيل.',
    updating: 'جارٍ تحديث السعر. يُرجى التحقق من صفحة الحجز.',
    unavailable: 'الحجز عبر الإنترنت غير متاح حالياً.',
    loadFailed: 'تعذّر تحميل الأسعار. تحقّق من صفحة الحجز أو حاول مجدداً بعد قليل.',
    description: amount => `ورشة مباشرة للمونتاج بالذكاء الاصطناعي بالعربية والإنجليزية عبر زوم، ١ نوفمبر الساعة ٧ مساءً بتوقيت دبي. التذكرة الحالية ${money(amount)}. التسجيلات وحزمة المهارات إضافات اختيارية.`,
    units: { days: 'أيام', hours: 'ساعات', minutes: 'دقائق', seconds: 'ثوانٍ' }
  } : {
    check: 'CHECK',
    availability: 'See checkout for availability',
    soon: 'SOON',
    opens: 'Booking opens soon',
    registration: 'Registration opens soon.',
    registrationCountdown: 'Registration opens in',
    registrationEnded: 'Registration is opening. Please check checkout.',
    stages: { early: 'Early booking price', standard: 'Standard price', final: 'Final booking price' },
    prices: (stages, amount) => `Ticket prices: ${stages.map(s => money(s.amount)).join(', ')}. Current ticket ${money(amount)}.`,
    ticketOnly: 'Ticket only. Optional extras are added at checkout.',
    campaignCountdown: 'Campaign ends in',
    increaseCountdown: amount => `${money(amount)} price increases in`,
    campaignEnded: 'The campaign has ended.',
    updating: 'Pricing is being updated. Please check checkout.',
    unavailable: 'Online booking is currently unavailable.',
    loadFailed: 'Prices could not be loaded. Please check checkout or try again shortly.',
    description: amount => `Live AI editing workshop in English and Arabic on Zoom, November 1 at 7pm Dubai time. Current ticket ${money(amount)}. Recordings and skills are optional extras.`,
    units: { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }
  };
}
