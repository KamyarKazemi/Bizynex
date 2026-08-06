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
 * owner they respect. The failure mode of that brief is a company that sounds
 * like a contract, and the mechanism is almost always the same: **passive
 * voice.** «محدوده مکتوب می‌شود» has no one in it. «محدوده را می‌نویسیم» has us
 * in it. Warmth here is not adjectives and it is certainly not exclamation
 * marks — it is a human being visibly on the other end of the sentence.
 *
 * So: first person plural, active verbs, and the reader addressed as شما. Short
 * sentences. Ordinary words. Where a promise is made, it is specific enough to
 * be broken — a promise that cannot be broken was not a promise.
 *
 * Still banned, unchanged: exclamation marks, «راهکار», «بروز»، «حرفه‌ای‌ترین»,
 * and any adjective we could not defend in a meeting.
 *
 * NEEDS A NATIVE READ-THROUGH BEFORE LAUNCH.
 */
export const fa = {
  nav: { services: 'خدمات', process: 'روش کار', contact: 'تماس' },

  hero: {
    /* The one h1. Carries وب‌سایت and نرم‌افزار for search, and the promise the
     * whole brand rests on for everyone else. اپلیکیشن، اتوماسیون and شیراز are
     * in the subtitle immediately below, so nothing is lost by keeping this
     * short enough to read in one breath. */
    title: 'وب‌سایت و نرم‌افزاری که سال‌ها کنارتان می‌ماند',
    subtitle:
      'ما یک تیم کوچک در شیرازیم و برای کسب‌وکارها وب‌سایت، اپلیکیشن و اتوماسیون می‌سازیم. از اولین گفتگو تا سال‌ها بعد از تحویل، همان آدم‌هایی هستیم که جواب می‌دهیم.',
    cta: 'شروع گفتگو',
    ctaSecondary: 'خدمات ما',
  },

  problem: {
    title: 'چرا پروژه‌های نرم‌افزاری شکست می‌خورند',
    /* Two paragraphs, not one. The first names the reader's experience and
     * stops; the second answers it. Run together they become a wall of text
     * that reads as a company defending itself, which is the opposite of the
     * effect. */
    lead:
      'بیشتر کسانی که با ما تماس می‌گیرند یک بار این راه را رفته‌اند و خوب تمام نشده: پیمانکاری که کم‌کم دیر جواب داد و بعد اصلاً جواب نداد، سایتی که بعد از تحویل کسی سراغش را نگرفت، صورت‌حسابی که تا آخر معلوم نشد بابت چه بوده. اگر محتاط شده‌اید، حق دارید.',
    body:
      'کاری که ما می‌کنیم پیچیده نیست. پیش از شروع می‌نویسیم قرار است چه چیزی ساخته شود و چقدر هزینه دارد. در طول کار خبرتان می‌کنیم، بی‌آنکه بپرسید. و بعد از تحویل همان‌جا می‌مانیم — چون بیشترِ ارزش یک سیستم در سال‌های بعدش ساخته می‌شود، نه در روز تحویلش.',
  },

  services: {
    title: 'خدمات',
    /* Outcome first, deliverable second — CONTEXT.md section 1. The deliverable
     * line is what people type into Google; the title is what they are actually
     * buying. Both are needed, in that order. */
    items: [
      {
        title: 'اعتبار دیجیتال',
        deliverable: 'طراحی و توسعهٔ وب‌سایت',
        body: 'وب‌سایتی که وقتی کسی نام کسب‌وکارتان را جستجو می‌کند، همان حسی را بدهد که در جلسهٔ حضوری می‌دهید. سریع روی اینترنت ایران، درست روی موبایل.',
      },
      {
        title: 'توانمندی عملیاتی',
        deliverable: 'طراحی اپلیکیشن و سامانه‌های سفارشی',
        body: 'اول می‌نشینیم و می‌بینیم کارتان واقعاً چطور پیش می‌رود، بعد نرم‌افزار را دور همان می‌سازیم. شما را داخل یک قالب آماده جا نمی‌دهیم.',
      },
      {
        title: 'کارایی بیشتر',
        deliverable: 'اتوماسیون و یکپارچه‌سازی',
        body: 'همان کارهای تکراری که هر روز وقت می‌گیرند — گزارش‌گیری، صدور فاکتور، جابه‌جا کردن دستی داده‌ها — می‌سپاریمشان به سیستم، تا وقت تیم شما صرف کاری شود که فقط از آدم برمی‌آید.',
      },
      {
        title: 'آرامش بلندمدت',
        deliverable: 'پشتیبانی و نگهداری',
        body: 'بعد از تحویل، پروژه بایگانی نمی‌شود. به‌روزرسانی، پشتیبان‌گیری و پایش ادامه دارد، و هر وقت تماس بگیرید همان کسی جواب می‌دهد که سیستم را ساخته.',
      },
    ],
  },

  process: {
    title: 'روش کار',
    steps: [
      {
        n: '۰۱',
        title: 'گفتگو و شناخت',
        body: 'اول فقط حرف می‌زنیم. می‌خواهیم بفهمیم کسب‌وکارتان چطور کار می‌کند و کجا واقعاً گیر کرده. این جلسه رایگان است و هیچ تعهدی نمی‌آورد.',
      },
      {
        n: '۰۲',
        title: 'برنامه و قرارداد',
        body: 'هرچه قرار است انجام شود — و هرچه قرار نیست — روی کاغذ می‌آید: محدوده، زمان‌بندی، هزینه. چیزی به «بعداً هماهنگ می‌کنیم» موکول نمی‌شود.',
      },
      {
        n: '۰۳',
        title: 'ساخت',
        body: 'هر هفته می‌بینید کار کجا رسیده. لازم نیست پیگیری کنید؛ خودمان می‌گوییم — چه خبر خوب باشد، چه نباشد.',
      },
      {
        n: '۰۴',
        title: 'تحویل و همراهی',
        body: 'تحویل وسط راه است، نه آخرش. تیم شما را آموزش می‌دهیم، مستندات را تحویل می‌دهیم، و بعد از آن هم در دسترسیم.',
      },
    ],
  },

  why: {
    title: 'چرا بیزینکس',
    items: [
      {
        title: 'به قولمان عمل می‌کنیم',
        body: 'تخمین‌هایمان محافظه‌کارانه است، تا بعداً مجبور به عذرخواهی نشویم. اگر کاری عقب بیفتد، همان روز می‌گوییم؛ نه در هفتهٔ آخر.',
      },
      {
        title: 'دربارهٔ پول رودربایستی نداریم',
        body: 'هر رقمی که می‌گوییم دلیلی دارد و دلیلش را هم می‌گوییم. هزینهٔ پنهانی در کار نیست و «این جزو قرارداد نبود» را از ما نمی‌شنوید.',
      },
      {
        title: 'بی‌خبرتان نمی‌گذاریم',
        body: 'گزارش پیشرفت را بدون آنکه بپرسید می‌فرستیم، و به پیام‌هایتان در همان روز کاری جواب می‌دهیم.',
      },
      {
        title: 'برای فردا می‌سازیم',
        body: 'کد را طوری می‌نویسیم که دو سال بعد هم بشود رویش کار کرد — حتی اگر آن روز تیم دیگری پشتش نشسته باشد.',
      },
      {
        title: 'همه‌چیز از روز اول مال شماست',
        body: 'کد، دامنه، سرور و همهٔ دسترسی‌ها به نام خودتان است. اگر روزی خواستید بروید، در باز است و چیزی گرو نمی‌ماند.',
      },
      {
        title: 'به رابطه فکر می‌کنیم',
        body: 'دوست داریم پنج سال دیگر هم با هم کار کنیم. همین یک جمله تقریباً همه‌چیز را روشن می‌کند: چه کاری را قبول کنیم، چه قیمتی بدهیم، و کجا بگوییم نه.',
      },
    ],
  },

  faq: {
    title: 'پرسش‌های پرتکرار',
    items: [
      {
        q: 'هزینهٔ طراحی سایت در شیراز چقدر است؟',
        /* No published bands, so this answer carries the whole money
         * conversation: why there is no number yet, when there will be one, and
         * what protects it afterwards. Vagueness with a date attached is not
         * the same thing as vagueness. */
        a: 'به اندازه و پیچیدگی کار بستگی دارد، و رُک بگوییم پیش از شناختن پروژه هر عددی که بگوییم حدس است. در همان جلسهٔ اول — که رایگان است — یک بازهٔ واقع‌بینانه می‌گوییم و بعد پیشنهاد مکتوبی می‌فرستیم که تا پایان قرارداد تغییر نمی‌کند. اگر خودتان وسط کار چیزی به محدوده اضافه کردید، تفاوت هزینه را پیش از انجامش با شما در میان می‌گذاریم.',
      },
      {
        q: 'ساخت یک وب‌سایت چقدر طول می‌کشد؟',
        a: 'یک وب‌سایت معرفی شرکت معمولاً سه تا شش هفته، و اپلیکیشن‌ها و سامانه‌های سفارشی از دو ماه به بالا. زمان دقیق در قرارداد می‌آید. اگر جایی عقب افتادیم همان روز می‌گوییم؛ خبر بدِ زودهنگام خیلی بهتر از خبر بدِ دیرهنگام است.',
      },
      {
        q: 'با یک تیم کوچک کار کردن چه فرقی دارد؟',
        /* The objection nobody says out loud. Answering it honestly turns the
         * smallest thing about us into the reason to choose us, without
         * pretending to be bigger than three people. */
        a: 'کسی که با او حرف می‌زنید همان کسی است که کار را انجام می‌دهد. بین شما و کدی که نوشته می‌شود هیچ واسطه‌ای نیست: نه مدیر پروژه‌ای که پیام‌ها را رد و بدل کند، نه صفی که پشتش منتظر بمانید. در عوض همزمان پروژه‌های کمی برمی‌داریم، و دقیقاً همین به ما اجازه می‌دهد این‌طور کار کنیم.',
      },
      {
        q: 'بعد از تحویل چه اتفاقی می‌افتد؟',
        a: 'همان تیمی که ساخته، پشتیبانی هم می‌کند؛ پروژه‌تان به کس دیگری واگذار نمی‌شود. قرارداد نگهداری ماهانه شامل به‌روزرسانی، پشتیبان‌گیری، پایش و رفع اشکال است. اگر هم نگهداری نگرفتید، اشکالات مربوط به خودِ تحویل را تا سه ماه بدون هزینه درست می‌کنیم.',
      },
      {
        q: 'کد و دسترسی‌ها مال کیست؟',
        a: 'از روز اول مال شماست. کد، دامنه، سرور و همهٔ حساب‌ها به نام خودتان ثبت می‌شود و دسترسی کاملش را دارید. ما هیچ بخشی را قفل نمی‌کنیم؛ اگر روزی تصمیم گرفتید کار را به تیم دیگری بسپارید، همه‌چیز را مرتب و مستند تحویل می‌دهیم.',
      },
      {
        q: 'فقط در شیراز کار می‌کنید؟',
        a: 'ما در شیرازیم و با مشتریان همین شهر ترجیح می‌دهیم دست‌کم یک بار حضوری بنشینیم؛ حرف زدن رو در رو خیلی چیزها را کوتاه می‌کند. اما بیشتر کار از راه دور پیش می‌رود و با کسب‌وکارهایی در شهرهای دیگر ایران هم همکاری می‌کنیم.',
      },
      {
        q: 'چه کارهایی را قبول نمی‌کنید؟',
        /* Rewritten. The earlier draft used «پروژه‌ای که به ما نخورد» and «همان
         * تماس اول می‌گوییم» — both too colloquial to carry a sentence about
         * turning down work, which is the most professional thing on the page.
         * Saying no is a competence claim; it has to sound like one. */
        a: 'دو دسته را نمی‌پذیریم: کاری که در آن تخصص کافی نداریم، و کاری که بودجه و انتظاراتش با یکدیگر نمی‌خواند. در هر دو حالت، همان جلسهٔ نخست صریح می‌گوییم و اگر همکاری بشناسیم که کار را بهتر انجام دهد، معرفی‌اش می‌کنیم. ترجیح می‌دهیم پروژه‌ای را نپذیریم تا اینکه نیمه‌کاره ناراضی‌تان کنیم.',
      },
      {
        q: 'چطور شروع کنیم؟',
        a: 'یک ایمیل بنویسید و در چند خط بگویید چه چیزی اذیت‌تان می‌کند. لازم نیست فنی باشد. در یک روز کاری جواب می‌دهیم و یک جلسهٔ گفتگو می‌گذاریم — بدون هزینه، و بدون اینکه بعدش کسی پیگیرتان شود.',
      },
    ],
  },

  contact: {
    title: 'بیایید حرف بزنیم',
    body:
      'لازم نیست از قبل بدانید دقیقاً چه می‌خواهید. چند خط دربارهٔ کارتان و مشکلی که آزارتان می‌دهد بنویسید؛ بقیه‌اش را با هم پیدا می‌کنیم. در یک روز کاری جواب می‌دهیم، و اگر کمکی از ما برنیاید، بی‌تعارف می‌گوییم.',
    cta: 'ارسال ایمیل',
  },

  footer: {
    tagline: 'طراحی سایت، اپلیکیشن و اتوماسیون — شیراز',
    rights: 'تمامی حقوق محفوظ است.',
  },

  /**
   * Interface chrome, not marketing copy. These were not supplied in the brief
   * and a skip link with no label is an accessibility failure, so standard
   * Persian conventions are used here. NEEDS NATIVE REVIEW before launch.
   */
  ui: {
    brandName: 'بیزینکس',
    skipToContent: 'رفتن به محتوای اصلی',
    mainNav: 'ناوبری اصلی',
    openMenu: 'باز کردن منو',
    closeMenu: 'بستن منو',
    emailUs: 'ارسال ایمیل به بیزینکس',
    toTop: 'بازگشت به بالا',
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
