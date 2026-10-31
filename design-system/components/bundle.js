/* @ds-bundle: {"format":4,"namespace":"Plate","components":[{"name":"BrandMark"},{"name":"NavRail"},{"name":"FleetStrip"},{"name":"Icon"},{"name":"StatusChip"},{"name":"StatePill"},{"name":"PlateBadge"},{"name":"VehicleSilhouette"},{"name":"VehicleImage"},{"name":"VehicleCard"},{"name":"VehicleRow"},{"name":"ListCard"},{"name":"Button"},{"name":"AttentionBar"},{"name":"MoneyBlock"},{"name":"Checklist"},{"name":"BlockedPanel"},{"name":"ConfirmationBlock"},{"name":"HistoryLine"},{"name":"Notice"},{"name":"AppHeader"},{"name":"LanguageSwitch"},{"name":"BottomTabBar"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  /* Bilingual label: "සිංහල · English" -> Sinhala at full weight, English as a quieter echo. */
  function bi(text) {
    if (typeof text !== 'string') return text;
    var i = text.indexOf(' · ');
    if (i < 0 || !/[\u0D80-\u0DFF]/.test(text.slice(0, i)) || !/^[A-Za-z]/.test(text.slice(i + 3))) return text;
    return [text.slice(0, i), h('span', { key: 'en', className: 'rt-en' }, ' · ' + text.slice(i + 3))];
  }
  /* Record ids (R-0218, BOC-448812, CBK 4127) never break across lines. */
  function nb(t) { return typeof t === 'string' ? t.replace(/([A-Za-z]+)-(\d)/g, '$1\u2011$2') : t; }
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }

  /* ---------- Icons: 24px grid, 2px stroke, round joins ---------- */
  var P = {
    car: '<path d="M3 13l2-5.6A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.4L21 13v4a1 1 0 0 1-1 1h-1.2M3 13v4a1 1 0 0 0 1 1h1.2M3 13h18M8.8 18h6.4"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    key: '<circle cx="7.5" cy="15.5" r="4"/><path d="M10.5 12.5L20 3M16 7l3 3M14 9l2 2"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    clockAlert: '<circle cx="10.5" cy="12.5" r="7.5"/><path d="M10.5 8.5v4l2.6 1.6M20.5 6v6M20.5 16v.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    unlink: '<path d="M15 13.7l3.7-3.7a4 4 0 0 0-5.7-5.7L11 6.3M9 10.3L5.3 14a4 4 0 0 0 5.7 5.7L13 17.7M4 4l16 16"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-2.6 3.2M6.6 7.6C4.4 9.2 3 12 3 12s4 6 9 6a8.6 8.6 0 0 0 4.2-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3v3a5 5 0 0 0 10 0V3M7 21v-3a5 5 0 0 1 10 0v3"/>',
    banknote: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v.01M18 14.5v.01"/>',
    drawer: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 13h18M10 16.5h4M7 9l1.5-4h7L17 9"/>',
    alert: '<path d="M12 4l9.5 16h-19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    stamp: '<path d="M9 12V9a3 3 0 1 1 6 0v3M5 12h14v4H5zM5 20h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    phone: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    home: '<path d="M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 11h7M8.5 15h5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    handshake: '<path d="M2.5 11.5L6.5 7.5l4.5 2 3-2 7.5 4M2.5 11.5l5.5 5.5 1.8-1 2 2 1.8-1 1.8 1 3.6-4.5M11 9.5l-2.2 2.2a1.5 1.5 0 0 0 2.1 2.1l2.1-1.1"/>',
    wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4zM4 7V5.5A1.5 1.5 0 0 1 5.5 4H16v3M16 13.5h4"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    returnCar: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    calendarPlus: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M12 13v5M9.5 15.5h5"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/>',
    fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M15 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3M8 7h4"/>',
    pen: '<path d="M4 20h16M6 16l9.5-9.5a2 2 0 0 1 3 3L9 19H6z"/>',
    idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16a3 3 0 0 1 6 0M14 10h4M14 14h3"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3"/>',
    swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/>',
    box: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5L12 12l9-4.5M12 12v9"/>'
  };
  function Icon(props) {
    var name = props.name, size = props.size || 20;
    var a = { className: cx('rt-ico', props.className), width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: props.stroke || 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', dangerouslySetInnerHTML: { __html: P[name] || P.info } };
    if (props.title) { a.role = 'img'; a['aria-label'] = props.title; } else { a['aria-hidden'] = 'true'; }
    return h('svg', a);
  }
  Icon.names = Object.keys(P);

  /* ---------- Words, in both languages ---------- */
  var STATUS = {
    overdue: { icon: 'clockAlert', si: 'පරක්කුයි', en: 'Overdue' },
    available: { icon: 'check', si: 'නිදහස්', en: 'Available' },
    rented: { icon: 'key', si: 'කුලියට ගිහින්', en: 'Rented' },
    repair: { icon: 'wrench', si: 'අලුත්වැඩියාවට', en: 'Under repair' },
    unavailable: { icon: 'pause', si: 'තාවකාලිකව කුලියට නැහැ', en: 'Temporarily unavailable' },
    retired: { icon: 'box', si: 'ඉවත් කළා', en: 'Retired' },
    warning: { icon: 'alert', si: 'බලන්න', en: 'Check' }
  };
  var STATE = {
    recorded: { icon: 'pen', si: 'සටහන් කළා', en: 'Recorded' },
    notChecked: { icon: 'clock', si: 'තවම බැලුවේ නැහැ', en: 'Not yet checked' },
    matched: { icon: 'link', si: 'ගැලපුවා', en: 'Matched' },
    unmatched: { icon: 'unlink', si: 'ගැලපුණේ නැහැ', en: 'Unmatched' },
    resolved: { icon: 'check', si: 'විසඳුවා', en: 'Resolved' },
    open: { icon: 'alert', si: 'විවෘතයි', en: 'Open' },
    provisional: { icon: 'eyeOff', si: 'තාවකාලික', en: 'Provisional' },
    finalised: { icon: 'lock', si: 'අවසන් කළා', en: 'Finalised' },
    paid: { icon: 'check', si: 'ගෙව්වා', en: 'Paid' },
    partPaid: { icon: 'hourglass', si: 'කොටසක් ගෙව්වා', en: 'Part-paid' },
    pending: { icon: 'hourglass', si: 'Admin තීරණය බලාපොරොත්තුවෙන්', en: 'Admin decision pending' },
    deposit: { icon: 'banknote', si: 'Deposit · ආදායම නොවේ', en: 'Deposit · not income' }
  };
  function word(map, key, lang) { var m = map[key] || map.warning || {}; return lang === 'en' ? m.en : m.si; }

  function StatusChip(props) {
    var s = props.status || 'available', m = STATUS[s] || STATUS.available, lang = props.lang || 'si';
    return h('span', { className: cx('rt-chip', 'rt-chip-' + s, props.size === 'sm' && 'rt-chip-sm', props.className) },
      h(Icon, { name: props.icon || m.icon, size: props.size === 'sm' ? 16 : 18 }),
      h('span', null, props.label || word(STATUS, s, lang)),
      props.detail ? h('span', { className: 'rt-chip-detail' }, '· ' + props.detail) : null);
  }

  function StatePill(props) {
    var k = props.kind || 'recorded', m = STATE[k] || STATE.recorded, lang = props.lang || 'si';
    return h('span', { className: cx('rt-pill', 'rt-pill-' + k, props.className) },
      h(Icon, { name: m.icon, size: 16 }),
      h('span', null, props.label || word(STATE, k, lang)),
      props.by ? h('span', { className: 'rt-pill-by' }, '· ' + props.by) : null);
  }

  function PlateBadge(props) {
    return h('span', { className: cx('rt-plate', props.size && 'rt-plate-' + props.size, props.className), 'aria-label': (props.lang === 'en' ? 'Registration ' : 'අංකය ') + props.plate }, props.plate);
  }

  /* ---------- Vehicle silhouettes (fallback when no photo exists) ---------- */
  var HUB = function (x, y) { return '<circle class="rt-sil-wheel" cx="' + x + '" cy="' + y + '" r="10"/><circle class="rt-sil-hub" cx="' + x + '" cy="' + y + '" r="4"/>'; };
  var SIL = {
    hatch: '<path class="rt-sil-road" d="M4 82h160"/><path class="rt-sil-body" d="M14 68V52l10-6 14-20c3-4 7-6 12-6h46c6 0 10 2 13 7l13 19 22 6c4 1 6 4 6 8v8c0 3-2 5-5 5H19c-3 0-5-2-5-5z"/><path class="rt-sil-glass" d="M45 45l10-16c2-3 4-4 7-4h17v20zM86 45V25h10c3 0 5 1 7 4l9 16z"/>' + HUB(42, 72) + HUB(122, 72),
    van: '<path class="rt-sil-road" d="M4 82h160"/><path class="rt-sil-body" d="M14 70V32c0-8 5-14 13-14h92c6 0 10 3 12 8l13 26 4 2c3 1 4 3 4 6v10c0 3-2 5-5 5H19c-3 0-5-2-5-5z"/><path class="rt-sil-glass" d="M30 26h33v19H24V32c0-3 3-6 6-6zM69 26h31v19H69zM106 26h11c3 0 5 1 6 4l8 15h-25z"/>' + HUB(42, 72) + HUB(124, 72),
    sedan: '<path class="rt-sil-road" d="M4 82h160"/><path class="rt-sil-body" d="M8 68V58c0-4 3-7 7-8l26-6 18-14c4-3 8-4 13-4h34c6 0 10 2 14 6l16 14 14 3c4 1 6 4 6 8v11c0 3-2 5-5 5H13c-3 0-5-2-5-5z"/><path class="rt-sil-glass" d="M53 44l14-10c2-2 5-3 8-3h11v13zM92 44V31h12c3 0 6 1 8 3l11 10z"/>' + HUB(40, 72) + HUB(128, 72)
  };
  function VehicleSilhouette(props) {
    if (props.model) return h(VehicleImage, { model: props.model, size: props.size, label: props.label, className: props.className });
    return h('svg', { className: cx('rt-sil', props.className), viewBox: '0 0 168 86', role: 'img', 'aria-label': props.label || 'Vehicle outline · no photo', dangerouslySetInnerHTML: { __html: SIL[props.body] || SIL.hatch } });
  }
  /* ---------- Vehicle images: SNS vehicle PNG pack v2 (transparent, front three-quarter) ----------
     One image per vehicle family, picked by model name; unknown models get the generic car.
     The URLs below are this environment's copies of the pack. In the app, point them at the
     pack's own files: s = 256px (thumbnails up to 128 CSS px), l = 512px from the 1024px export. */
  var VIMG = { /* @vehicle-images */
    s: { 'alto': 'brand/vehicles/256/sns-vehicle-alto.png', 'axio': 'brand/vehicles/256/sns-vehicle-axio.png', 'every': 'brand/vehicles/256/sns-vehicle-every.png', 'generic': 'brand/vehicles/256/sns-vehicle-generic.png', 'hustler': 'brand/vehicles/256/sns-vehicle-hustler.png', 'mid-suv': 'brand/vehicles/256/sns-vehicle-mid-suv.png', 'pickup': 'brand/vehicles/256/sns-vehicle-pickup.png', 'premium-sedan': 'brand/vehicles/256/sns-vehicle-premium-sedan.png', 'prius': 'brand/vehicles/256/sns-vehicle-prius.png', 'spacia': 'brand/vehicles/256/sns-vehicle-spacia.png', 'station-wagon': 'brand/vehicles/256/sns-vehicle-station-wagon.png', 'suv': 'brand/vehicles/256/sns-vehicle-suv.png', 'van': 'brand/vehicles/256/sns-vehicle-van.png', 'wagon-r': 'brand/vehicles/256/sns-vehicle-wagon-r.png' },
    l: { 'alto': 'design-system/assets/vehicles-512/sns-vehicle-alto.png', 'axio': 'design-system/assets/vehicles-512/sns-vehicle-axio.png', 'every': 'design-system/assets/vehicles-512/sns-vehicle-every.png', 'generic': 'design-system/assets/vehicles-512/sns-vehicle-generic.png', 'prius': 'design-system/assets/vehicles-512/sns-vehicle-prius.png', 'spacia': 'design-system/assets/vehicles-512/sns-vehicle-spacia.png', 'wagon-r': 'design-system/assets/vehicles-512/sns-vehicle-wagon-r.png' }
  };
  var VKEY = { 'wagon r': 'wagon-r', 'wagonr': 'wagon-r', 'wagon-r': 'wagon-r', 'alto': 'alto', 'every': 'every', 'prius': 'prius', 'axio': 'axio', 'spacia': 'spacia',
    'hustler': 'hustler', 'van': 'van', 'mid-suv': 'mid-suv', 'suv': 'suv', 'pickup': 'pickup', 'station-wagon': 'station-wagon', 'premium-sedan': 'premium-sedan', 'generic': 'generic' };
  function vehicleKey(model) { return VKEY[String(model || '').toLowerCase().trim()] || 'generic'; }
  function VehicleImage(props) {
    var k = vehicleKey(props.model);
    var src = (props.size === 'lg' && VIMG.l[k]) || VIMG.s[k] || VIMG.s.generic;
    return h('img', { className: cx('rt-vimg', props.className), src: src, alt: props.label || '', loading: 'lazy', decoding: 'async', draggable: false });
  }
  function Photo(props) {
    return props.photo ? h('img', { src: props.photo, alt: '', loading: 'lazy' }) : h(VehicleImage, { model: props.model });
  }

  function VehicleCard(props) {
    var lang = props.lang || 'si', s = props.status || 'available';
    var ownerWord = props.partner ? (lang === 'en' ? 'Partner' : 'Partner') + (props.partnerName ? ' · ' + props.partnerName : '') : (lang === 'en' ? 'SNS' : 'SNS');
    return h('button', { type: 'button', className: cx('rt-vcard', s === 'overdue' && 'rt-vcard-overdue', props.className), onClick: props.onClick, 'aria-label': props.plate + ' ' + props.model + ' ' + word(STATUS, s, lang) },
      h('div', { className: 'rt-photo' }, h(Photo, props),
        h(StatusChip, { status: s, lang: lang }),
        (!props.photo && props.canAddPhoto) ? h('span', { className: 'rt-photo-add' }, lang === 'en' ? 'No photo · add one' : 'Photo නැහැ · එකතු කරන්න') : null),
      h('div', { className: 'rt-vcard-body' },
        h('div', { className: 'rt-vcard-top' }, h(PlateBadge, { plate: props.plate, lang: lang })),
        h('div', { className: 'rt-vcard-model' }, props.model + ' · ' + ownerWord),
        props.statusDetail ? h('div', { className: cx('rt-vcard-detail', 'rt-vcard-detail-' + s) }, nb(props.statusDetail)) : null,
        props.warning ? h('div', { className: 'rt-vwarn' }, h(Icon, { name: props.warning.icon || 'question', size: 18 }), h('span', null, props.warning.label)) : null,
        props.next ? h('div', { className: cx('rt-vcard-next', s === 'overdue' && 'rt-vcard-next-overdue') }, nb(props.next)) : null));
  }

  /* Compact car line: thumbnail, plate and status on top, model · owner · next event below. A link when `href` is given. */
  function VehicleRow(props) {
    var lang = props.lang || 'si', s = props.status || 'available';
    var line = [props.model, props.partner ? 'Partner' + (props.partnerName ? ' · ' + props.partnerName : '') : 'SNS'].join(' · ');
    return h(props.href ? 'a' : 'button', { type: props.href ? undefined : 'button', href: props.href, className: cx('rt-vrow', s === 'overdue' && 'rt-vrow-overdue', props.className), onClick: props.onClick, 'aria-label': props.plate + ' ' + props.model + ' ' + word(STATUS, s, lang) },
      h('span', { className: 'rt-thumb' }, h(Photo, props)),
      h('span', { className: 'rt-vrow-main' },
        h('span', { className: 'rt-vrow-top' }, h(PlateBadge, { plate: props.plate, size: 'sm', lang: lang }), h(StatusChip, { status: s, lang: lang, size: 'sm', detail: props.statusDetail })),
        h('span', { className: 'rt-vrow-line' }, h('b', null, line), props.next ? ' · ' + nb(props.next) : null)),
      h(Icon, { name: 'arrowRight', size: 18, className: 'rt-li-arrow' }));
  }

  /* ---------- Lists: one card, divided rows, each row opens what is behind it ---------- */
  function ListRow(r) {
    var value = r.figure != null ? h('span', { className: 'rt-li-fig' }, r.currency ? h('small', null, 'LKR ') : null, fmt(r.figure))
      : r.meta ? h('span', { className: 'rt-li-meta' }, r.meta) : h('span', null);
    var detail = r.plate || r.tag
      ? h('span', { className: 'rt-li-stack' }, r.plate ? h('span', { className: 'rt-li-plate' }, h(PlateBadge, { plate: r.plate, size: 'sm' }), r.detail ? h('span', { className: 'rt-li-d' }, nb(r.detail)) : null) : (r.detail ? h('span', { className: 'rt-li-d' }, nb(r.detail)) : null), r.tag ? h('span', { className: 'rt-li-tag' }, r.tag) : null)
      : r.detail ? h('span', { className: 'rt-li-d' }, nb(r.detail)) : null;
    return h(r.href ? 'a' : 'div', { href: r.href, className: cx('rt-li', r.small && 'rt-li-sm', !r.href && 'rt-li-static') },
      h('span', { className: cx('rt-li-ico', r.tone && 'rt-li-ico-' + r.tone) }, h(Icon, { name: r.icon || 'info', size: 20 })),
      h('span', { className: 'rt-li-text' }, r.title ? h('span', { className: 'rt-li-t' }, bi(r.title)) : null, detail),
      value,
      r.href ? h(Icon, { name: 'arrowRight', size: 18, className: 'rt-li-arrow' }) : h('span', null));
  }
  function ListCard(props) {
    var groups = props.groups || [{ rows: props.rows || [] }];
    var Tag = props.heading === 'h3' ? 'h3' : 'h2';
    return h(props.bare ? 'div' : 'section', { className: cx('rt-lc', props.columns === 2 && 'rt-lc-2', props.bare && 'rt-lc-bare', props.className) },
      props.bare || !props.title ? null : h('div', { className: 'rt-lc-head' },
        h(Tag, { className: 'rt-lc-title' }, bi(props.title)),
        props.more ? h('a', { className: 'rt-lc-more', href: props.more.href }, bi(props.more.label), h(Icon, { name: 'arrowRight', size: 18 })) : null,
        props.sub ? h('span', { className: 'rt-lc-sub' }, props.sub) : null),
      groups.map(function (g, gi) {
        return h(React.Fragment, { key: gi },
          g.label ? h('div', { className: 'rt-lc-group' }, bi(g.label)) : null,
          h('div', { className: 'rt-lc-rows' }, (g.rows || []).map(function (r, i) {
            return r.car ? h(VehicleRow, Object.assign({ key: i }, r.car)) : r.link ? h('a', { key: i, className: 'rt-li rt-li-link', href: r.link.href }, h('span', null, bi(r.link.label)), h(Icon, { name: 'arrowRight', size: 18 })) : h(ListRow, Object.assign({ key: i }, r));
          })));
      }),
      props.foot ? h('div', { className: 'rt-lc-foot' }, props.foot) : null);
  }

  /* ---------- Actions ---------- */
  function Button(props) {
    var v = props.variant || 'primary';
    var rest = Object.assign({}, props); ['variant', 'icon', 'full', 'children', 'className'].forEach(function (k) { delete rest[k]; });
    rest.type = rest.type || 'button';
    rest.className = cx('rt-btn', 'rt-btn-' + v, props.full && 'rt-btn-full', props.className);
    return h('button', rest, props.icon ? h(Icon, { name: props.icon, size: 20 }) : null, h('span', null, props.children));
  }

  function AttentionBar(props) {
    return h('div', { className: cx('rt-attn', props.className), role: 'list' }, (props.items || []).map(function (it, i) {
      return h(it.href ? 'a' : 'button', { key: i, type: it.href ? undefined : 'button', href: it.href, role: 'listitem', className: cx('rt-attn-item', 'rt-attn-' + (it.tone || 'neutral'), !it.count && 'rt-attn-zero'), onClick: it.onClick },
        h(Icon, { name: it.icon || 'flag', size: 24 }),
        h('span', { className: 'rt-attn-count' }, String(it.count)),
        h('span', { className: 'rt-attn-label' }, bi(it.label)));
    }));
  }

  function fmt(n) { if (typeof n !== 'number') return n; var neg = n < 0; var s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); return (neg ? '−' : '') + s; }

  function MoneyBlock(props) {
    return h('section', { className: cx('rt-money', props.alert && 'rt-money-alert', props.className) },
      h('div', { className: 'rt-money-head' }, props.icon ? h(Icon, { name: props.icon, size: 20 }) : null, h('span', null, bi(props.label)), props.pill ? h('span', { style: { marginLeft: 'auto' } }, props.pill) : null),
      props.figure !== undefined && props.figure !== null ? h('div', { className: 'rt-money-fig' }, h('small', null, 'LKR'), fmt(props.figure)) : null,
      props.state ? h('div', { className: 'rt-money-state' }, props.state) : null,
      props.lines && props.lines.length ? h('div', { className: 'rt-money-lines' }, props.lines.map(function (l, i) {
        return h('div', { key: i, className: cx('rt-money-line', l.sign === 'in' && 'rt-money-in', l.sign === 'out' && 'rt-money-out', l.total && 'rt-money-line-total') },
          h('span', null, l.label), h('b', null, (l.sign === 'in' ? '+ ' : l.sign === 'out' ? '− ' : '') + fmt(l.sign === 'out' && typeof l.amount === 'number' ? Math.abs(l.amount) : l.amount)));
      })) : null,
      props.note ? h('div', { className: 'rt-money-note' }, props.note) : null,
      props.children);
  }

  function Checklist(props) {
    var items = props.items || [], done = items.filter(function (i) { return i.state === 'done'; }).length, req = items.filter(function (i) { return i.state !== 'open'; }).length;
    return h('section', { className: cx('rt-check', props.className) },
      h('div', { className: 'rt-check-head' },
        h('div', null, h('div', { style: { fontWeight: 600, fontSize: 17 } }, bi(props.title)), h('div', { className: 'rt-caption' }, props.progressLabel || (done + ' / ' + req))),
        h('div', { style: { width: 120 } }, h('div', { className: 'rt-check-progress', role: 'progressbar', 'aria-valuenow': done, 'aria-valuemax': req }, h('span', { style: { width: (req ? done / req * 100 : 0) + '%' } })))),
      items.map(function (it, i) {
        var st = it.state || 'missing';
        return h('div', { key: i, className: cx('rt-check-item', 'rt-check-' + st) },
          h('span', { className: 'rt-check-mark' }, h(Icon, { name: st === 'done' ? 'check' : st === 'open' ? 'hourglass' : (it.icon || 'x'), size: 18 })),
          h('div', null, h('div', { className: 'rt-check-label' }, it.label), it.meta ? h('div', { className: 'rt-check-meta' }, it.meta) : null, it.tag ? h('div', null, h('span', { className: 'rt-check-tag' }, it.tag)) : null),
          it.action || null);
      }),
      props.footer ? h('div', { className: 'rt-check-foot' }, props.footer) : null);
  }

  function BlockedPanel(props) {
    var en = props.lang === 'en';
    return h('section', { className: cx('rt-blocked', props.className), role: 'note' },
      h('div', { className: 'rt-blocked-title' }, h(Icon, { name: props.icon || 'lock', size: 20 }), h('span', null, bi(props.what))),
      h('dl', null,
        h('dt', null, en ? 'Why' : 'ඇයි'), h('dd', null, props.why),
        h('dt', null, en ? 'Who can' : 'කාටද පුළුවන්'), h('dd', null, props.who),
        h('dt', null, en ? 'Next step' : 'ඊළඟට'), h('dd', null, props.next)),
      props.actionLabel ? h('div', null, h(Button, { variant: 'secondary', icon: props.actionIcon || 'stamp', onClick: props.onAction }, props.actionLabel)) : null);
  }

  /* SNS 3D icons (44, supplied by SNS 25 Oct 2026): soft pearl objects with one group accent, used ONLY on
     launcher tiles, quick actions, empty states and done screens. Status, money states and navigation keep line icons. */
  var GICON = {"activity-log":"design-system/assets/icons-256/sns-icon-activity-log.png","add-customer":"design-system/assets/icons-256/sns-icon-add-customer.png","all-cars":"design-system/assets/icons-256/sns-icon-all-cars.png","approvals":"design-system/assets/icons-256/sns-icon-approvals.png","bank-card-check":"design-system/assets/icons-256/sns-icon-bank-card-check.png","close-day":"design-system/assets/icons-256/sns-icon-close-day.png","count-drawer":"design-system/assets/icons-256/sns-icon-count-drawer.png","customers":"design-system/assets/icons-256/sns-icon-customers.png","done-cashout":"design-system/assets/icons-256/sns-icon-done-cashout.png","done-day":"design-system/assets/icons-256/sns-icon-done-day.png","done-drawer":"design-system/assets/icons-256/sns-icon-done-drawer.png","done-handover":"design-system/assets/icons-256/sns-icon-done-handover.png","done-payment":"design-system/assets/icons-256/sns-icon-done-payment.png","done-return":"design-system/assets/icons-256/sns-icon-done-return.png","done-sign-in":"design-system/assets/icons-256/sns-icon-done-sign-in.png","empty-approvals":"design-system/assets/icons-256/sns-icon-empty-approvals.png","empty-checks":"design-system/assets/icons-256/sns-icon-empty-checks.png","empty-debts":"design-system/assets/icons-256/sns-icon-empty-debts.png","empty-expenses":"design-system/assets/icons-256/sns-icon-empty-expenses.png","empty-overdue":"design-system/assets/icons-256/sns-icon-empty-overdue.png","empty-search":"design-system/assets/icons-256/sns-icon-empty-search.png","expense":"design-system/assets/icons-256/sns-icon-expense.png","extend-rental":"design-system/assets/icons-256/sns-icon-extend-rental.png","flag-customer":"design-system/assets/icons-256/sns-icon-flag-customer.png","handover":"design-system/assets/icons-256/sns-icon-handover.png","maintenance":"design-system/assets/icons-256/sns-icon-maintenance.png","morning-check":"design-system/assets/icons-256/sns-icon-morning-check.png","my-payslip":"design-system/assets/icons-256/sns-icon-my-payslip.png","new-rental":"design-system/assets/icons-256/sns-icon-new-rental.png","offline":"design-system/assets/icons-256/sns-icon-offline.png","partner-cashouts":"design-system/assets/icons-256/sns-icon-partner-cashouts.png","partner-owners":"design-system/assets/icons-256/sns-icon-partner-owners.png","partner-statement":"design-system/assets/icons-256/sns-icon-partner-statement.png","payroll":"design-system/assets/icons-256/sns-icon-payroll.png","print-document":"design-system/assets/icons-256/sns-icon-print-document.png","ready-to-start":"design-system/assets/icons-256/sns-icon-ready-to-start.png","receive-return":"design-system/assets/icons-256/sns-icon-receive-return.png","received-by-staff":"design-system/assets/icons-256/sns-icon-received-by-staff.png","record-payment":"design-system/assets/icons-256/sns-icon-record-payment.png","rentals":"design-system/assets/icons-256/sns-icon-rentals.png","reports":"design-system/assets/icons-256/sns-icon-reports.png","search":"design-system/assets/icons-256/sns-icon-search.png","settings":"design-system/assets/icons-256/sns-icon-settings.png","swap-car":"design-system/assets/icons-256/sns-icon-swap-car.png"};
  function GameIcon(props) {
    var px = props.size === 'hero' ? 96 : props.size === 'lg' ? 72 : typeof props.size === 'number' ? props.size : 56;
    var src = GICON[props.name];
    if (!src) return null;
    return h('img', { className: cx('rt-gicon', props.className), src: src, width: px, height: px, alt: props.label || '', draggable: false, style: { width: px, height: px } });
  }
  /* A launcher tile: 3D icon over the Sinhala label and English echo; optional short note and count. */
  function LauncherTile(props) {
    return h(props.href ? 'a' : 'button', { className: cx('rt-tile', props.className), href: props.href, type: props.href ? undefined : 'button', onClick: props.onClick },
      h('span', { className: 'rt-tile-ico' }, h(GameIcon, { name: props.icon }), props.badge ? h('span', { className: cx('rt-tile-badge', props.badgeTone === 'overdue' && 'rt-tile-badge-overdue') }, props.badge) : null),
      (function () { var t = String(props.label || ''), k = t.indexOf(' · ');
        return h('span', { className: 'rt-tile-label' }, k < 0 ? t : t.slice(0, k), k < 0 ? null : h('span', { className: 'rt-tile-en' }, t.slice(k + 3))); })(),
      props.sub ? h('span', { className: 'rt-tile-sub' }, props.sub) : null);
  }
  /* A titled grid of LauncherTiles. columns: 2, 3 or 4. */
  function LauncherGrid(props) {
    return h('section', { className: cx('rt-tiles', (props.columns || 3) >= 3 && 'rt-tiles-compact', props.className) },
      props.title ? h('h2', { className: 'rt-tiles-title' }, bi(props.title)) : null,
      h('div', { className: 'rt-tiles-grid', style: { gridTemplateColumns: 'repeat(' + (props.columns || 3) + ', minmax(0, 1fr))' } },
        (props.items || []).map(function (it, i) { return h(LauncherTile, Object.assign({ key: i }, it)); })));
  }
  /* Empty list or result: calm 3D icon (no accent), what is empty, what happens next, optional action. */
  function EmptyState(props) {
    return h('div', { className: cx('rt-empty', props.className) },
      h(GameIcon, { name: props.icon || 'empty-search', size: 'hero' }),
      h('div', { className: 'rt-empty-title' }, bi(props.title)),
      props.body ? h('div', { className: 'rt-empty-body' }, props.body) : null,
      props.children ? h('div', { className: 'rt-empty-act' }, props.children) : null);
  }
  function ConfirmationBlock(props) {
    return h('section', { className: cx('rt-confirm', props.className), role: 'status' },
      h('div', { className: 'rt-confirm-head' }, props.icon ? h(GameIcon, { name: props.icon, size: 'lg', className: 'rt-confirm-gicon' }) : h('span', { className: 'rt-confirm-mark' }, h(Icon, { name: 'check', size: 22 })),
        h('div', null, h('div', { className: 'rt-confirm-title' }, bi(props.title)), props.sentence ? h('div', { className: 'rt-muted' }, props.sentence) : null)),
      props.rows && props.rows.length ? h('dl', null, props.rows.map(function (r, i) { return [h('dt', { key: 'k' + i }, r.label), h('dd', { key: 'v' + i }, r.value)]; })) : null,
      props.actions ? h('div', { className: 'rt-row' }, props.actions) : null);
  }

  function HistoryLine(props) {
    var initials = (props.actor || '?').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
    return h('div', { className: cx('rt-hist', props.className) },
      h('span', { className: 'rt-hist-av', 'aria-hidden': 'true' }, props.actor === 'System' ? h(Icon, { name: 'settings', size: 18 }) : initials),
      h('div', null,
        h('div', { className: 'rt-hist-main' }, h('b', null, props.actor), ' · ', props.action, props.target ? h('span', null, ' · ', props.target) : null, props.amount ? h('span', { className: 'rt-num' }, ' · LKR ' + fmt(props.amount)) : null),
        props.type ? h('div', { style: { margin: '4px 0' } }, h(StatePill, { kind: props.type, lang: props.lang })) : null,
        props.reason ? h('div', { className: 'rt-hist-reason' }, '“' + props.reason + '”') : null),
      h('span', { className: 'rt-hist-time' }, props.time));
  }

  function Notice(props) {
    var t = props.tone || 'info';
    return h('div', { className: cx('rt-notice', 'rt-notice-' + t, props.className), role: t === 'danger' ? 'alert' : 'note' },
      h(Icon, { name: props.icon || (t === 'info' ? 'info' : 'alert'), size: 20 }),
      h('div', null, props.title ? h('b', null, bi(props.title)) : null, props.children));
  }

  /* ---------- App chrome ---------- */
  function LanguageSwitch(props) {
    var lang = props.lang || 'si';
    return h('div', { className: cx('rt-lang', props.onLight && 'rt-lang-light'), role: 'group', 'aria-label': 'භාෂාව · Language' },
      h('button', { type: 'button', 'aria-pressed': lang === 'si' ? 'true' : 'false', lang: 'si', onClick: function () { props.onChange && props.onChange('si'); } }, 'සිං'),
      h('button', { type: 'button', 'aria-pressed': lang === 'en' ? 'true' : 'false', lang: 'en', onClick: function () { props.onChange && props.onChange('en'); } }, 'EN'));
  }

  /* The SNS logo, supplied by SNS: the yellow road "S" with the SNS RENT CAR wordmark.
     The URLs are this environment's copies; in the app, point them at the logo files. */
  var LOGO = { full: 'design-system/assets/brand/sns-logo.png', mark: 'design-system/assets/brand/sns-logo-mark.png' };
  function BrandMark(props) {
    var v = props.variant === 'mark' ? 'mark' : 'full';
    return h('span', { className: cx('rt-mark', 'rt-mark-' + v, props.size && 'rt-mark-' + props.size, props.className) },
      h('img', { src: LOGO[v], alt: 'SNS Rent Car', draggable: false }));
  }

  function AppHeader(props) {
    var initials = (props.user || '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
    return h('header', { className: cx('rt-header', props.className) },
      props.showMark ? h(BrandMark, null) : null,
      h('div', { className: 'rt-header-title' }, h('span', null, bi(props.title)), props.subtitle ? h('small', null, props.subtitle) : null),
      props.searchHref
        ? h('a', { className: 'rt-search rt-search-link', href: props.searchHref }, h(Icon, { name: 'search', size: 20 }), h('span', null, props.search || 'හොයන්න · Search'))
        : (props.search ? h('label', { className: 'rt-search' }, h(Icon, { name: 'search', size: 20 }), h('input', { type: 'search', placeholder: props.search, 'aria-label': props.search })) : null),
      props.newHref ? h('a', { className: 'rt-btn rt-btn-primary rt-header-new', href: props.newHref }, h(Icon, { name: 'plus', size: 20 }), h('span', null, bi(props.newLabel || 'අලුත් කුලියක් · New rental'))) : null,
      h(LanguageSwitch, { lang: props.lang, onChange: props.onLang, onLight: true }),
      props.user ? h('div', { className: 'rt-header-user', title: props.user + (props.role ? ' · ' + props.role : '') }, h('span', { className: 'rt-avatar', 'aria-hidden': 'true' }, initials), h('span', { className: 'rt-header-who' }, props.user, props.role ? h('small', null, props.role) : null)) : null);
  }

  /* Desktop navigation: a labelled sidebar grouped by job (chosen 25 Oct 2026).
     Same items, order and permissions as before; the component groups them by their label. */
  var NAV_EN = { 'අද': 'Today', 'උදේ check': 'Morning check', 'වාහන': 'Cars', 'කුලී': 'Rentals', 'පාරිභෝගිකයෝ': 'Customers',
    'මුදල්': 'Money', 'ලාච්චුව': 'Drawer', 'Partner ගණන්': 'Partners', 'පඩි': 'Payroll', 'මගේ පඩිපත': 'My payslip',
    'මගේ මුදල්': 'My earnings', 'මුදල් ගන්න': 'Cash out', 'අනුමැති': 'Approvals', 'නඩත්තුව': 'Maintenance', 'වාර්තා': 'Reports', 'සැකසුම්': 'Settings' };
  var NAV_GROUP = { 'අද': 0, 'උදේ check': 0, 'වාහන': 1, 'කුලී': 1, 'පාරිභෝගිකයෝ': 1, 'මුදල්': 2, 'ලාච්චුව': 2, 'Partner ගණන්': 2, 'පඩි': 2,
    'මගේ පඩිපත': 2, 'මගේ මුදල්': 2, 'මුදල් ගන්න': 2, 'අනුමැති': 3, 'නඩත්තුව': 3, 'වාර්තා': 3, 'සැකසුම්': 9 };
  var NAV_HEAD = { 1: 'වාහන සහ කුලී · Cars and rentals', 2: 'මුදල් · Money', 3: 'ව්‍යාපාරය · Running SNS' };
  function NavRail(props) {
    var groups = {}, bottom = [];
    (props.items || []).forEach(function (it) {
      var g = it.group != null ? it.group : (NAV_GROUP[it.label] != null ? NAV_GROUP[it.label] : 0);
      if (g === 9) bottom.push(it); else (groups[g] = groups[g] || []).push(it);
    });
    function link(it, i) {
      var en = it.en || NAV_EN[it.label];
      var tone = it.badgeTone === 'overdue';
      var count = it.badge ? h(it.badgeHref ? 'a' : 'span', { className: cx('rt-side-badge', tone && 'rt-side-badge-overdue'), href: it.badgeHref,
        'aria-label': it.badge + (tone ? ' overdue' : ' waiting') + (it.badgeHref ? ', show them' : '') }, it.badge) : null;
      return h('div', { key: i, className: cx('rt-side-row', it.active && 'rt-side-row-active') },
        h('a', { href: it.href || '#', className: 'rt-side-item', 'aria-current': it.active ? 'page' : undefined, onClick: it.onClick, title: en ? it.label + ' · ' + en : it.label },
          h('span', { className: 'rt-side-ico' }, h(Icon, { name: it.icon, size: 20 })),
          h('span', { className: 'rt-side-label' }, it.label, en ? h('span', { className: 'rt-en' }, ' · ' + en) : null)),
        count);
    }
    var body = Object.keys(groups).sort().map(function (g) {
      return h('div', { key: g, className: 'rt-side-group' }, NAV_HEAD[g] ? h('div', { className: 'rt-side-head' }, bi(NAV_HEAD[g])) : null, groups[g].map(link));
    });
    return h('nav', { className: cx('rt-side', props.className), 'aria-label': 'ප්‍රධාන මෙනුව · Main menu' },
      h('div', { className: 'rt-side-mark' }, h(BrandMark, { className: 'rt-side-logo' }), h(BrandMark, { variant: 'mark', className: 'rt-side-logo-mark' })),
      props.newHref ? h('a', { href: props.newHref, className: 'rt-btn rt-btn-primary rt-btn-full' }, h(Icon, { name: 'plus', size: 20 }), h('span', null, bi(props.newLabel || 'අලුත් කුලියක් · New rental'))) : null,
      h('div', { className: 'rt-side-groups' }, body),
      bottom.length ? h('div', { className: 'rt-side-foot' }, bottom.map(link)) : null,
      props.footer ? h('div', { className: 'rt-side-foot' }, props.footer) : null);
  }

  var ORDER = ['overdue', 'available', 'rented', 'repair', 'unavailable'];
  function FleetStrip(props) {
    var cars = props.cars || [], lang = props.lang || 'si';
    var sorted = ORDER.map(function (s) { return cars.filter(function (c) { return c.status === s; }); });
    return h('section', { className: cx('rt-fleet', props.className), 'aria-label': (props.label || 'වාහන') + ' ' + cars.length },
      h('div', { className: 'rt-fleet-ticks', role: 'img', 'aria-label': ORDER.map(function (s, i) { return word(STATUS, s, lang) + ' ' + sorted[i].length; }).join(', ') },
        sorted.map(function (grp, gi) { return grp.map(function (c, i) { return h('span', { key: ORDER[gi] + i, className: 'rt-tick rt-tick-' + ORDER[gi] + (c.warn ? ' rt-tick-warn' : ''), title: c.plate }); }); })),
      h('div', { className: 'rt-fleet-legend' }, ORDER.map(function (s, i) {
        var href = props.hrefs && props.hrefs[s];
        return h(href ? 'a' : 'span', { key: s, href: href, className: 'rt-fleet-key rt-fleet-key-' + s },
          h('span', { className: 'rt-tick rt-tick-' + s, 'aria-hidden': 'true' }), h(Icon, { name: STATUS[s].icon, size: 18 }),
          h('span', null, word(STATUS, s, lang)), h('b', { className: 'rt-num' }, String(sorted[i].length)));
      })));
  }

  function Sidebar(props) {
    return h('nav', { className: cx('rt-side', props.className), 'aria-label': 'ප්‍රධාන මෙනුව · Main menu' }, (props.groups || []).map(function (g, gi) {
      return h(React.Fragment, { key: gi }, g.label ? h('div', { className: 'rt-side-group' }, g.label) : null, g.items.map(function (it, i) {
        return h('button', { key: i, type: 'button', className: 'rt-side-item', 'aria-current': it.active ? 'page' : undefined, onClick: it.onClick },
          h(Icon, { name: it.icon, size: 22 }), h('span', null, it.label), it.badge ? h('span', { className: 'rt-side-badge' }, it.badge) : null);
      }));
    }));
  }

  /* Phone page header: back link, title (Sinhala · English), subtitle, optional action. */
  function PageHeader(props) {
    return h('header', { className: cx('rt-pagehead', props.className) },
      props.backHref ? h('a', { className: 'rt-pagehead-back', href: props.backHref, 'aria-label': props.backLabel || 'ආපසු · Back' }, h(Icon, { name: 'arrowLeft', size: 22 })) : null,
      h('div', { className: 'rt-pagehead-text' },
        h('div', { className: cx('rt-pagehead-title', props.numeric && 'rt-num') }, bi(props.title)),
        props.subtitle ? h('div', { className: 'rt-pagehead-sub' }, props.subtitle) : null),
      props.children ? h('div', { className: 'rt-pagehead-act' }, props.children) : null);
  }
  function BottomTabBar(props) {
    var tabs = (props.tabs || []).map(function (t, i) {
      return h(t.href ? 'a' : 'button', { key: i, type: t.href ? undefined : 'button', href: t.href, className: 'rt-tab', 'aria-current': t.active ? 'page' : undefined, onClick: t.onClick },
        h('span', { className: 'rt-tab-ico' }, h(Icon, { name: t.icon, size: 24 }), t.badge ? h('span', { className: 'rt-tab-badge' }, t.badge) : null), h('span', null, t.label));
    });
    if (props.fab) {
      var mid = Math.ceil(tabs.length / 2);
      tabs.splice(mid, 0, h(props.fab.href ? 'a' : 'button', { key: 'fab', type: props.fab.href ? undefined : 'button', href: props.fab.href, className: 'rt-tab rt-tab-fab', 'aria-current': props.fab.active ? 'page' : undefined, onClick: props.fab.onClick },
        h('span', { className: 'rt-fab' }, h(Icon, { name: props.fab.icon || 'plus', size: 26 })), h('span', null, props.fab.label)));
    }
    return h('nav', { className: cx('rt-tabs', props.className), 'aria-label': 'Tabs' }, tabs);
  }

  var api = { BrandMark: BrandMark, NavRail: NavRail, FleetStrip: FleetStrip, Icon: Icon, StatusChip: StatusChip, StatePill: StatePill, PlateBadge: PlateBadge, VehicleSilhouette: VehicleSilhouette, VehicleImage: VehicleImage, vehicleKey: vehicleKey, VehicleCard: VehicleCard, VehicleRow: VehicleRow, ListCard: ListCard, ListRow: ListRow, Button: Button, AttentionBar: AttentionBar, MoneyBlock: MoneyBlock, Checklist: Checklist, BlockedPanel: BlockedPanel, ConfirmationBlock: ConfirmationBlock, HistoryLine: HistoryLine, Notice: Notice, AppHeader: AppHeader, LanguageSwitch: LanguageSwitch, BottomTabBar: BottomTabBar, PageHeader: PageHeader, GameIcon: GameIcon, LauncherTile: LauncherTile, LauncherGrid: LauncherGrid, EmptyState: EmptyState, formatLKR: fmt, words: { status: STATUS, state: STATE } };
  window.Plate = Object.assign(window.Plate || {}, api);
})();
