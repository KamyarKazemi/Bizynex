import type { RouteKey, ServiceRouteKey } from './routes';

type PageCopy = {
  /** The page's one h1. */
  readonly title: string;
  /** The paragraph directly under it. */
  readonly intro: string;
  readonly sections: readonly { readonly heading: string; readonly body: string }[];
};

/**
 * The service pages — empty slots, not content.
 *
 * Every string below is `''` on purpose. This is the shape a service page
 * renders from, committed ahead of the words so the page component, the route
 * table and the build guard can all be finished and tested now; the words
 * arrive separately.
 *
 * Each of these routes is marked `draft: true` in src/content/routes.ts and
 * stays that way until its copy here is written. Nothing draft is built, linked
 * or listed in the sitemap, and scripts/prerender.mjs refuses to build a
 * published route whose slots are still empty — so the only way a page goes
 * live is fully written.
 *
 * **Write these natively in Persian.** Do not translate an English draft into
 * them, and do not let a tool do it either. Read the voice rules below first:
 * they are what keep seven sections sounding like one company.
 *
 * It sits above `fa` rather than inside it only because `fa` reads it, and a
 * const has to exist before it is read. It is reachable as `fa.pages`.
 */
/**
 * The same copy with its `[[…]]` emphasis delimiters removed.
 *
 * `src/components/Marked.tsx` renders those brackets as an accent rule. Every
 * *other* consumer of the same string wants the sentence and not the notation:
 * a `<title>`, a meta description, and every name and description in the
 * structured data. Forgetting one puts a literal `[[` in front of a search
 * engine, which is exactly what happened the first time this shipped.
 */
export const plain = (text: string) => text.replace(/\[\[(.+?)\]\]/g, '$1');

const pages: Record<ServiceRouteKey, PageCopy> = {
  /* Targets the automation queries, where the results today are national ERP
     vendors rather than local agencies. The shape of each page is the same and
     it is deliberate: what it is, where it does not work, and what happens
     first. The middle section is the one competitors do not write. */
  automation: {
    title: 'اتوماسیون کارهای تکراری',
    intro:
      'کاری که هر هفته دستی انجام می‌شود، [[معمولاً لازم نیست دستی انجام شود]]. همان کار را به سیستم می‌سپاریم و وقتی که آزاد می‌شود به تیم شما برمی‌گردد.',
    sections: [
      {
        heading: 'معمولاً از اینجا شروع می‌شود',
        body: 'گزارشی که هر هفته از سه جای مختلف جمع می‌شود و در یک فایل کنار هم می‌نشیند. فاکتوری که بعد از هر سفارش دستی صادر می‌شود. داده‌ای که از یک سیستم بیرون می‌آید و در سیستم بعدی دوباره تایپ می‌شود. هر کدام از اینها چند ساعت در هفته است که کسی بابتش حقوق می‌گیرد.',
      },
      {
        heading: 'کجا جواب نمی‌دهد',
        body: 'اگر کاری ماهی یک بار انجام می‌شود و بیست دقیقه طول می‌کشد، خودکار کردنش هزینه‌ای دارد که برنمی‌گردد. اگر هر بار متفاوت انجام می‌شود و قضاوت آدم لازم دارد، سیستم فقط همان اشتباه را سریع‌تر تکرار می‌کند. هر دو مورد را در جلسهٔ اول می‌گوییم.',
      },
      {
        heading: 'اول اندازه می‌گیریم',
        body: 'پیش از آنکه چیزی ساخته شود، می‌بینیم آن کار الان چند ساعت در ماه می‌برد. همان عدد بعداً معلوم می‌کند کار ارزشش را داشته یا نه — و اگر نداشته باشد، از اول می‌گوییم.',
      },
    ],
  },

  /* Boundary with the automation page: that one removes a manual step from a
     process that already runs; this one builds a system that did not exist.
     A sentence that works on both pages belongs on neither. */
  software: {
    title: 'نرم‌افزار سفارشی',
    intro:
      'جایی که کار شما در هیچ نرم‌افزار آماده‌ای جا نمی‌شود، [[سیستم را دور خودِ کار می‌سازیم]] — نه اینکه کار را دور نرم‌افزار تغییر بدهید.',
    sections: [
      {
        heading: 'قالب آماده کجا کم می‌آورد',
        body: 'نرم‌افزار آماده برای کاری ساخته شده که اکثریت انجام می‌دهند. اگر کسب‌وکار شما هم همان‌طور کار می‌کند، آماده بخرید؛ ارزان‌تر است و ما هم همین را می‌گوییم. اما اگر هر بار مجبورید چند مرحله را بیرون از سیستم و در اکسل انجام بدهید، آن سیستم دیگر سیستم شما نیست.',
      },
      {
        heading: 'چه چیزی می‌سازیم',
        body: 'سامانه‌های داخلی برای ثبت و پیگیری کار، پنل‌های مدیریت سفارش و موجودی، و سیستم‌هایی که چند نرم‌افزار جدا را به هم وصل می‌کنند. همه تحت وب، تا نصب روی تک‌تک دستگاه‌ها لازم نباشد.',
      },
      {
        heading: 'بزرگ‌تر از یک سایت است',
        body: 'یک سامانهٔ سفارشی چند برابر یک سایت معرفی طول می‌کشد و هزینه‌اش هم به همان نسبت است. اگر مسئله‌تان با چیز کوچک‌تری حل می‌شود، همان را پیشنهاد می‌دهیم؛ کار بزرگ‌تری که لازم نیست، به نفع هیچ‌کس نیست.',
      },
    ],
  },

  /* The section that says "you probably do not need this" is the reason this
     page exists. CONTEXT.md section 1 lists "available for work we can't do
     well" under explicitly not, and turning down an app is the cheapest place
     on the site to prove that is true. */
  app: {
    title: 'اپلیکیشن موبایل',
    intro:
      'اپلیکیشن برای کاری است که کاربر مرتب و روی موبایل انجام می‌دهد. برای بقیهٔ کارها، [[سایتی که روی موبایل درست کار کند کافی است]].',
    sections: [
      {
        heading: 'اول این را بپرسید',
        body: 'کاربر قرار است ماهی چند بار بازش کند؟ اگر جواب «یکی دو بار» است، اپلیکیشنی خواهید داشت که در صفحهٔ گوشی جا گرفته، کسی بازش نمی‌کند و هزینهٔ نگهداری دارد. یک سایت خوب روی موبایل همان کار را می‌کند و کسی لازم نیست چیزی نصب کند.',
      },
      {
        heading: 'کجا اپلیکیشن درست است',
        body: 'وقتی کار بیرون از دفتر و اغلب بدون اینترنت پایدار انجام می‌شود — ثبت بازدید، انبارگردانی، فرم‌هایی که در محل پر می‌شوند. یا وقتی به دوربین، موقعیت مکانی و اعلان نیاز دارید. اینها را مرورگر یا نمی‌تواند یا خوب نمی‌تواند.',
      },
      {
        heading: 'نگهداری‌اش تمام نمی‌شود',
        body: 'اپلیکیشن برخلاف سایت هر سال به‌روزرسانی می‌خواهد تا با نسخهٔ تازهٔ اندروید و iOS کار کند. این هزینه در همان پیشنهاد اول می‌آید، نه سال دوم.',
      },
    ],
  },

  /* The long version of the home page's delivery section — home lists the
     artefacts, this says what each one is worth the day something goes wrong.
     It is also the one home for the speed claim: the number quoted is the
     budget scripts/check-weight.mjs enforces, not the current measurement, so
     a few kilobytes of new copy cannot make the sentence false. */
  delivery: {
    title: 'چه چیزی تحویل می‌گیرید',
    intro:
      'فهرستش در صفحهٔ اصلی آمده. اینجا می‌گوییم هر کدام شش ماه بعد، وقتی مشکلی پیش بیاید، [[دقیقاً به چه کارتان می‌آید]].',
    sections: [
      {
        heading: 'کد منبع، به نام خودتان',
        body: 'مخزن کد از روز اول روی حساب شماست و ما به آن دسترسی داریم، نه برعکس. معنای عملی‌اش این است که اگر روزی خواستید کار را به تیم دیگری بسپارید، چیزی از ما نمی‌خواهید. همین یک بند مشخص می‌کند بعداً دستتان باز است یا نه.',
      },
      {
        heading: 'دامنه و سرور، روی حساب شما',
        body: 'دامنه به نام کسب‌وکار شما ثبت می‌شود و صورت‌حساب سرور هم به نام شما می‌آید. اگر همکاری تمام شود، سایت سر جایش می‌ماند. جابه‌جا کردن اینها بعد از تحویل ممکن است اما وقت می‌برد، و برای همین از اول درست انجام می‌شود.',
      },
      {
        heading: 'مستندات، به فارسی',
        body: 'نه فهرستی از فایل‌ها، بلکه توضیح اینکه هر بخش چه کار می‌کند و اگر از کار افتاد از کجا شروع کنید. به فارسی، چون قرار است کسی در تیم شما بخواندش، نه یک برنامه‌نویس دیگر.',
      },
      {
        heading: 'سه ماه رفع اشکال',
        body: 'اگر چیزی که تحویل داده‌ایم درست کار نکند، سه ماه بدون هزینه درستش می‌کنیم. تغییر دادن و افزودن در این سه ماه نمی‌گنجد — آن کار تازه است و قیمت خودش را دارد. تفاوت این دو را همان موقع مکتوب می‌گوییم، نه روی صورت‌حساب.',
      },
      {
        heading: 'سایتی که روی اینترنت بد هم باز می‌شود',
        body: 'صفحهٔ اصلی همین سایت با کمتر از ۶۰ کیلوبایت خوانده می‌شود و متنش پیش از اجرای هر جاوااسکریپتی روی صفحه است. این عدد را هنگام ساخت اندازه می‌گیریم و اگر از حد بگذرد، انتشار متوقف می‌شود. سایت شما با همین معیار ساخته می‌شود.',
      },
    ],
  },

  /* The case study. Empty for a different reason than the four above: they are
     waiting on copy, this is waiting on a real project with a real measurement.
     Do not write it from imagination — see src/content/routes.ts. */
  work: { title: '', intro: '', sections: [] },
};

/**
 * Every Persian string on the site. Single source — components never contain
 * copy, and src/content/jsonLd.ts builds the structured data from this same
 * object so the markup Google reads can never drift from the words a visitor
 * reads.
 *
 * Written natively in Persian, not translated from an English draft.
 *
 * ## The voice, and the one rule that produces it
 *
 * CONTEXT.md section 6 asks for a calm senior engineer talking to a business
 * owner they respect. The first draft of this file drifted in both directions
 * at once — «رودربایستی» three paragraphs from «دو دسته را نمی‌پذیریم» — because
 * "warm but professional" is a judgement call, and a judgement call made forty
 * times drifts. The rule that replaced it is mechanical:
 *
 *   **The sentence may be warm. The noun may not be idiomatic.**
 *
 * Warmth comes from directness, first person plural, and short active verbs.
 * «محدوده مکتوب می‌شود» has no one in it; «محدوده را می‌نویسیم» has us in it.
 * It never comes from colloquial vocabulary. Banned on sight, because each was
 * an actual offender here: «رُک بگوییم»، «رودربایستی»، «بی‌تعارف»، «گرو»،
 * «در باز است»، «توانمندی عملیاتی». Still banned, unchanged: exclamation marks,
 * «راهکار»، «بروز»، «حرفه‌ای‌ترین», and any adjective we could not defend in a
 * meeting.
 *
 * ## The rule that keeps the page readable end to end
 *
 * **Every promise has exactly one home.** The previous draft made the same three
 * promises — we write it down before, we tell you during, we stay after —
 * seventeen times across seven sections. Repetition without escalation does not
 * read as emphasis; it reads as anxiety, which is the one thing a company
 * selling certainty cannot sound like.
 *
 * So: a section may *rely* on a promise made elsewhere. It may not restate it.
 *
 *   you talk to the person who builds it → hero.subtitle
 *   written scope before anything starts → process, step ۰۲
 *   the weekly update, good news or bad → process, step ۰۳
 *   source, domain and accounts in your name → delivery
 *   the warranty window → delivery
 *   no hidden cost → pricing
 *   we turn down work that isn't a fit → faq
 *
 * If you are about to write one of those a second time, you are writing a bug.
 * See CONTENT-PLAN.md for the full ledger and the reasoning.
 *
 * No headcount appears anywhere on this site, by decision. «تیم کوچک» states no
 * number and stays; anything that counts people does not.
 *
 * NEEDS A NATIVE READ-THROUGH BEFORE LAUNCH.
 */
export const fa = {
  nav: { services: 'خدمات', process: 'روش کار', contact: 'تماس' },

  hero: {
    /* The one h1. Names the category first and the promise second — the
     * previous draft spent the largest text on the page on a differentiator
     * before saying what was being sold. اپلیکیشن، اتوماسیون and شیراز are in
     * the subtitle directly below. */
    title: 'وب‌سایت و نرم‌افزاری که می‌شود روی آن حساب کرد',
    /* Category, city, and the one differentiator. Nothing about process,
     * delivery or aftercare — all three have homes further down the page. */
    subtitle:
      'یک تیم کوچک در شیراز. برای کسب‌وکارها وب‌سایت، اپلیکیشن و اتوماسیون می‌سازیم — و [[کسی که با او حرف می‌زنید، همان کسی است که کار را می‌سازد]].',
    cta: 'شروع گفتگو',
    ctaSecondary: 'خدمات ما',
  },

  problem: {
    /* Retitled. The previous title — «چرا پروژه‌های نرم‌افزاری شکست می‌خورند» —
     * was a conference-talk topic, and it planted a frame the rest of the page
     * then had to argue against. This one addresses the reader instead. */
    title: 'شاید یک بار این راه را رفته‌اید',
    lead:
      'خیلی از کسانی که با ما تماس می‌گیرند قبلاً یک بار سایت یا نرم‌افزاری سفارش داده‌اند و خوب تمام نشده: پیمانکاری که کم‌کم دیر جواب داد، صورت‌حسابی که تا آخر معلوم نشد بابت چه بوده، سایتی که بعد از تحویل کسی سراغش را نگرفت. اگر محتاط شده‌اید، حق دارید.',
    /* The page's spine, and the newest sentence in this file.
     *
     * The previous draft answered the problem here, in a second paragraph that
     * restated three promises the reader had not been introduced to yet. That
     * paragraph is gone — its content is now روش کار, where it belongs. What
     * replaces it is a single line telling the reader what the rest of the page
     * is for. Without it the page is seven sections in a row with nothing
     * connecting them, which is exactly how it read. */
    bridge: 'بقیهٔ این صفحه توضیح می‌دهد ما چطور کار می‌کنیم که این اتفاق نیفتد.',
  },

  services: {
    title: 'خدمات',
    /* Deliverable as the heading, outcome inside the sentence.
     *
     * The previous draft had this inverted: the heading was an abstract noun
     * («توانمندی عملیاتی») and the actual service was a small grey line styled
     * as the least important thing in the card. CONTEXT.md section 1's "sell
     * outcomes, not deliverables" is a positioning principle; it was being
     * applied as a heading convention. A scanning reader has to be able to see
     * what is for sale. The outcome still does its work — in the prose, where
     * there is room to make it mean something. */
    items: [
      {
        title: 'طراحی و توسعهٔ وب‌سایت',
        body: 'سایتی که وقتی کسی نام کسب‌وکارتان را جستجو می‌کند، همان اعتباری را نشان بدهد که در جلسهٔ حضوری دارید. سریع روی اینترنت ایران، درست روی موبایل.',
      },
      {
        title: 'اپلیکیشن و سامانهٔ سفارشی',
        body: 'اول می‌نشینیم و می‌بینیم کارتان واقعاً چطور پیش می‌رود، بعد نرم‌افزار را دور همان می‌سازیم — نه اینکه شما را با یک قالب آماده تطبیق بدهیم.',
      },
      {
        title: 'اتوماسیون و یکپارچه‌سازی',
        body: 'کارهای تکراری که هر روز وقت می‌گیرند — گزارش‌گیری، صدور فاکتور، جابه‌جا کردن دستی داده‌ها — را به سیستم می‌سپاریم، تا وقت تیم شما صرف کاری شود که فقط از آدم برمی‌آید.',
      },
      {
        title: 'پشتیبانی و نگهداری',
        body: 'به‌روزرسانی، پشتیبان‌گیری و پایش، ماه به ماه. سیستمی که کسی مراقبش نیست، دو سال بعد همان سیستم نیست.',
      },
    ],
  },

  process: {
    title: 'روش کار',
    /* Each step names an artefact or a cadence — a document, a frequency, a
     * thing that arrives. Not an intention.
     *
     * This is the section that absorbs the deleted second half of `problem` and
     * most of the deleted «چرا بیزینکس», so it carries more weight than it used
     * to and has to earn it by being specific. "We keep you informed" is a
     * promise; "a short report every week, and here is what is in it" is a
     * thing that either happened or did not. */
    steps: [
      {
        n: '۰۱',
        title: 'گفتگو',
        body: 'یک جلسه، رایگان و بدون تعهد. می‌خواهیم بفهمیم کسب‌وکارتان چطور کار می‌کند، کجا گیر کرده، و اصلاً نرم‌افزار جواب این مسئله هست یا نه.',
      },
      {
        n: '۰۲',
        title: 'پیشنهاد مکتوب',
        body: 'یک سند: چه چیزی ساخته می‌شود، چه چیزی نمی‌شود، در چه زمانی و با چه هزینه‌ای. چیزی به «بعداً هماهنگ می‌کنیم» موکول نمی‌شود.',
      },
      {
        n: '۰۳',
        title: 'ساخت',
        body: 'هفته‌ای یک گزارش کوتاه: چه چیزی تمام شد، این هفته چه دستمان است، و اگر جایی عقب افتاده، همان هفته می‌گوییم. لازم نیست پیگیری کنید.',
      },
      {
        n: '۰۴',
        title: 'تحویل',
        body: 'یک جلسهٔ آموزش برای تیم شما، مستندات، و تحویل کامل دسترسی‌ها. فهرست کامل آنچه می‌گیرید در بخش بعد آمده.',
      },
    ],
  },

  /**
   * The section that replaced «چرا بیزینکس».
   *
   * The old section was six promises, four of which were made elsewhere on the
   * page already. This one is a list of objects. The founders are staying
   * anonymous, so "you talk to the person who builds it" cannot be proved by
   * showing people — it can be proved by showing what gets handed over. A list
   * is checkable in a way a paragraph of intent is not.
   */
  delivery: {
    title: 'چه چیزی تحویل می‌گیرید',
    lead: 'در پایان کار، اینها در اختیار شماست.',
    items: [
      'سند محدوده و قرارداد امضاشده',
      'کد منبع، روی مخزنی که به نام خودتان است',
      'دامنه، سرور و همهٔ حساب‌ها به نام شما — هیچ‌چیز نزد ما قفل نمی‌ماند',
      'مستندات فنی و راهنمای استفاده، به فارسی',
      'یک جلسهٔ آموزش برای تیمی که قرار است هر روز با آن کار کند',
      'سه ماه رفع اشکالِ مربوط به تحویل، بدون هزینه',
    ],
    /* Sits apart from the list because it is conditional, and a conditional
     * item in an unconditional list is how a list stops being trustworthy. */
    note: 'و اگر قرارداد نگهداری ماهانه بگیرید: به‌روزرسانی، پشتیبان‌گیری، پایش و رفع اشکال، تا هر وقت که بخواهید.',
  },

  /**
   * The two questions everyone has, answered in the open instead of at FAQ
   * position five.
   *
   * There is no published number and no published range, and this section does
   * not apologise for either — refusing to quote a bracket is presented as the
   * decision it is.
   *
   * That framing matters more than it looks. "We can't say until we know the
   * project" is what every agency says and it reads as evasion. "A general
   * range is either so wide it says nothing or it puts you in a bracket your
   * project isn't in" is a reason, and it happens to be true. Same absence of a
   * number, opposite impression.
   *
   * The bot is where the number actually comes from. `botLead` and `botCta`
   * render only when site.telegram is set — see Pricing.tsx. Do not hard-code
   * the handle here.
   */
  pricing: {
    title: 'هزینه و زمان',
    time:
      'یک وب‌سایت معرفی شرکت معمولاً سه تا شش هفته طول می‌کشد، و اپلیکیشن‌ها و سامانه‌های سفارشی از دو ماه به بالا. زمان دقیق در همان پیشنهاد مکتوب می‌آید و بعد از آن جابه‌جا نمی‌شود.',
    money:
      'برای هزینه بازهٔ عمومی اعلام نمی‌کنیم. یک بازهٔ عمومی یا آن‌قدر پهن است که چیزی نمی‌گوید، یا شما را در دسته‌ای می‌گذارد که پروژه‌تان در آن نیست — و در هر دو حالت عددی که بعداً می‌شنوید با چیزی که در ذهنتان بوده نمی‌خواند.',
    drivers:
      'آنچه عدد را جابه‌جا می‌کند این‌هاست: اندازهٔ کار، تعداد سیستم‌هایی که باید به هم وصل شوند، و اینکه از صفر شروع می‌کنیم یا روی چیزی که از قبل دارید.',
    /* The single home for "no hidden cost". It is not said anywhere else. */
    guarantee:
      'بعد از جلسهٔ اول یک عدد مکتوب می‌گیرید که تا پایان قرارداد تغییر نمی‌کند. [[هزینهٔ پنهان نداریم]]؛ اگر خودتان وسط کار چیزی به محدوده اضافه کردید، تفاوتش را پیش از انجامش با شما در میان می‌گذاریم.',
    /* Says what the bot will ask for. There is no button in this section — the
     * page has one, at the bottom — so this paragraph's whole job is to make
     * that button unsurprising when the reader reaches it. */
    botLead:
      'به جایش چند سؤال کوتاه دربارهٔ کارتان می‌پرسیم و بر اساس همان‌ها یک برآورد می‌دهیم — برای پروژهٔ شما، نه برای یک دستهٔ فرضی.',

    /*
     * ── Structured data only. Never rendered. ───────────────────────────────
     *
     * Two questions that used to be in `faq.items` and were moved out during
     * the content overhaul, because their answers belong in this section and a
     * question whose answer is already on the page is the page repeating
     * itself. That was the right call for a reader. It was the wrong call for
     * a crawler: `FAQPage` markup is what makes a question snippet-eligible,
     * and «هزینهٔ طراحی سایت در شیراز» and «چقدر طول می‌کشد» are the two
     * highest-intent local queries this business can answer. Dropping the
     * markup left the answers on the page with nothing saying what they are
     * answers to.
     *
     * So the questions live on here as schema input only. `Faq.tsx` renders
     * `faq.items` and nothing else, so these cannot leak into the visible page
     * — keep them out of that array. src/content/jsonLd.ts pairs each one with
     * the paragraphs above: cost → `money` + `drivers`, timeline → `time`.
     *
     * ⚠ NEEDS A FOUNDER READ-THROUGH, AND IT IS AN EDITORIAL JUDGEMENT, NOT A
     * MECHANICAL ONE. Both halves are the founder's own words — the questions
     * verbatim from the pre-overhaul `faq.items`, the answers verbatim from
     * this section — but the two were never written as a pair. Nobody has yet
     * read question and answer together as one unit. Read them that way once
     * and confirm they land; if the seam shows, the fix is to edit the
     * question, not to invent an answer.
     */
    schemaOnlyQuestions: {
      cost: 'هزینهٔ طراحی سایت در شیراز چقدر است؟',
      time: 'ساخت یک وب‌سایت چقدر طول می‌کشد؟',
    },
  },

  faq: {
    title: 'پرسش‌های پرتکرار',
    /* Four, down from eight. Price and timeline moved to `pricing`; ownership
     * and aftercare moved to `delivery`. What is left is what has nowhere else
     * to live. A question whose answer is already on the page is not a
     * question — it is the page repeating itself with a question mark. */
    items: [
      {
        q: 'با یک تیم کوچک کار کردن چه فرقی دارد؟',
        /* Expands the hero's claim rather than restating it: the hero says who
         * you deal with, this says what that removes. */
        a: 'واسطه‌ای در کار نیست — نه مدیر پروژه‌ای که پیام‌ها را رد و بدل کند، نه صفی که پشتش منتظر بمانید، نه کاری که به کسی سپرده شود که شما هرگز ندیده‌اید. سؤال فنی‌تان همان روز به کسی می‌رسد که جوابش را می‌داند.',
      },
      {
        q: 'فقط در شیراز کار می‌کنید؟',
        a: 'ما در شیرازیم و با مشتریان همین شهر ترجیح می‌دهیم دست‌کم یک بار حضوری بنشینیم؛ حرف زدن رو در رو خیلی چیزها را کوتاه می‌کند. اما بیشتر کار از راه دور پیش می‌رود و با کسب‌وکارهایی در شهرهای دیگر ایران هم همکاری می‌کنیم.',
      },
      {
        q: 'چه کارهایی را قبول نمی‌کنید؟',
        /* The most professional sentence on the page, and the previous draft
         * over-corrected it into a policy document («دو دسته را نمی‌پذیریم»).
         * Saying no is a competence claim; it should sound like a person making
         * one, not like a clause. */
        a: 'کاری که در آن تخصص کافی نداریم، و کاری که بودجه و انتظاراتش با هم نمی‌خواند. در هر دو حالت همان جلسهٔ اول صریح می‌گوییم، و اگر کسی را بشناسیم که بهتر انجامش می‌دهد، معرفی‌اش می‌کنیم. ترجیح می‌دهیم کاری را نپذیریم تا اینکه نیمه‌کاره ناراضی‌تان کنیم.',
      },
      {
        q: 'چطور شروع کنیم؟',
        /* Names both routes and what each is for. It does not repeat that the
         * first meeting is free and without obligation — that is process step
         * ۰۱ and it is said once. */
        a: 'دو راه دارید: در تلگرام به چند سؤال کوتاه جواب بدهید تا برآورد بگیرید، یا ایمیل بزنید و در چند خط بگویید چه چیزی اذیت‌تان می‌کند. لازم نیست فنی باشد. در یک روز کاری جواب می‌دهیم.',
      },
    ],
  },

  contact: {
    title: 'بیایید حرف بزنیم',
    body:
      'لازم نیست از قبل بدانید دقیقاً چه می‌خواهید. چند خط دربارهٔ کارتان و مشکلی که آزارتان می‌دهد بنویسید. در یک روز کاری جواب می‌دهیم.',
    /* `botCta` is the only button on the site. It echoes the hero's «شروع
     * گفتگو», which anchors here — so the action the page opened by offering is
     * the action it closes by giving.
     *
     * `cta` is the fallback label, used only if site.telegram is ever null. The
     * visible email address below the button is separate and always shown. */
    botCta: 'شروع گفتگو در تلگرام',
    cta: 'ارسال ایمیل',
  },

  footer: {
    tagline: 'طراحی سایت، اپلیکیشن و اتوماسیون — شیراز',
    rights: 'تمامی حقوق محفوظ است.',
  },

  /** The service pages. Declared above, and empty until written — see there. */
  pages,

  /**
   * Interface chrome, not marketing copy. These were not supplied in the brief
   * and a skip link with no label is an accessibility failure, so standard
   * Persian conventions are used here. NEEDS NATIVE REVIEW before launch.
   */
  ui: {
    brandName: 'بیزینکس',
    skipToContent: 'رفتن به محتوای اصلی',
    mainNav: 'ناوبری اصلی',
    /* The header's page menu. Deliberately not «خدمات» — that word is already a
     * nav link pointing at the home page's services *section*, and two controls
     * with the same label meaning different destinations is the kind of thing
     * a reader only notices by getting it wrong. ⚠ Claude draft; see
     * COPY-REVIEW.md. */
    pagesMenu: 'صفحه‌ها',
    emailUs: 'ارسال ایمیل به بیزینکس',
    skipIntro: 'رد کردن',
    switchToDark: 'حالت تیره',
    switchToLight: 'حالت روشن',

    /* The opening room. `overturePull` is the visible instruction beside the
     * cord; `overturePullLabel` is what a screen reader announces for the same
     * control, which needs to say what the control does rather than what the
     * visitor should reach for. */
    overtureTitle: 'مقدمهٔ بیزینکس',
    overturePull: 'طناب را بکشید',
    overturePullLabel: 'کشیدن طناب و روشن کردن چراغ',
    /* Shown once the light is on, so the same cord reads as a switch. */
    overturePullAgain: 'دوباره بکشید',
    overturePullOffLabel: 'کشیدن طناب و خاموش کردن چراغ',
    overtureEnter: 'ورود به سایت',
    overtureCountdown: 'ورود خودکار به سایت',
    overtureMute: 'قطع صدا',
    overtureUnmute: 'پخش صدا',
  },
} as const;

/**
 * Which copy slots for a route are still blank, named so a person can go and
 * fill them. Empty array means the page is ready to publish.
 *
 * This is what makes the `draft` flag in src/content/routes.ts safe rather than
 * merely honest: scripts/prerender.mjs calls it for every route it is about to
 * build and refuses the whole build if anything comes back, so clearing the
 * flag before the words exist fails loudly at build time instead of quietly
 * shipping a page with no heading.
 *
 * It lives here because this is the file that knows the shape of a page's copy.
 * The build script should not have to.
 */
export const emptyCopySlots = (key: RouteKey): string[] => {
  // Home has no entry in `pages` — its copy is the rest of this file, and it
  // has been live since before any of this existed.
  if (key === 'home') return [];

  const page = pages[key];
  const empty: string[] = [];

  if (page.title === '') empty.push('title');
  if (page.intro === '') empty.push('intro');

  // A service page with no body is a thin page, which is worse than no page:
  // it competes with the home page for the same terms and wins neither.
  if (page.sections.length === 0) empty.push('sections');

  page.sections.forEach((section, index) => {
    if (section.heading === '') empty.push(`sections[${index}].heading`);
    if (section.body === '') empty.push(`sections[${index}].body`);
  });

  return empty;
};
