const isEnglish = document.documentElement.lang === 'en';
const languageLinks = [...document.querySelectorAll('.language-switch a')];

function syncLanguageLinks() {
  for (const link of languageLinks) {
    link.hash = location.hash;
    link.search = location.search;
  }
}

window.addEventListener('hashchange', syncLanguageLinks);
syncLanguageLinks();
for (const link of languageLinks) {
  link.addEventListener('click', () => {
    try {
      localStorage.setItem(languagePreferenceKey, link.hreflang);
    } catch {
      // The language link works without saving a preference.
    }
  });
}

const tabs = [...document.querySelectorAll('.tabs a')];
const sections = new Map(tabs.map(tab => [
  tab.hash,
  document.getElementById(tab.hash.slice(1))
]));
const overview = document.querySelector('.overview');
const backToTop = document.querySelector('#back-to-top');
const dayLinks = [...document.querySelectorAll('.jump a')];
const main = document.querySelector('main');
const defaultTitle = document.title;
const dayCards = [...document.querySelectorAll('.days article')];
const singleDay = document.querySelector('#single-day');
const dayViewStatus = document.querySelector('#day-view-status');
const dayModeKey = 'travelpalau:single-day';
const activeDayKey = 'travelpalau:active-day';
let selectedDay = dayCards[0];

function renderDays(target) {
  const targetDay = target?.closest('.days article');
  if (targetDay && targetDay !== selectedDay) {
    selectedDay = targetDay;
    try {
      sessionStorage.setItem(activeDayKey, selectedDay.id);
    } catch {
      // Keep the current day in memory.
    }
  }
  for (const day of dayCards) day.hidden = singleDay.checked && day !== selectedDay;
  dayViewStatus.textContent = singleDay.checked
    ? selectedDay.querySelector('.day').textContent + ' · ' + selectedDay.querySelector('[id$="-title"]').textContent
    : '';
  return singleDay.checked ? targetDay || selectedDay : targetDay;
}

try {
  singleDay.checked = sessionStorage.getItem(dayModeKey) === '1';
  selectedDay = dayCards.find(day => day.id === sessionStorage.getItem(activeDayKey)) || selectedDay;
} catch {
  // The view toggle still works on the current page.
}
singleDay.closest('.itinerary-controls').hidden = false;
singleDay.addEventListener('change', () => {
  try {
    sessionStorage.setItem(dayModeKey, singleDay.checked ? '1' : '0');
  } catch {
    // The view toggle still works on the current page.
  }
  showTopic(false, false);
});

function hashDestination() {
  try {
    return document.getElementById(decodeURIComponent(location.hash.slice(1)));
  } catch {
    return null;
  }
}
let activeSection;
let revealSight;

function focusContent(element) {
  if (element.tabIndex < 0) element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
}

function showTopic(focusOnChange = false, scrollToDestination = true) {
  const target = hashDestination();
  const section = target?.closest('main > section[id]');
  const topic = target === main ? activeSection || '#itinerary' : section ? '#' + section.id : '#itinerary';
  const panel = sections.get(topic);
  const heading = panel.querySelector('h2');
  const currentDay = renderDays(target);
  const dayTitle = target?.matches('.days article') ? target.querySelector('[id$="-title"]').textContent : '';
  const topicTitle = dayTitle || (topic === '#itinerary' ? '' : heading.textContent);
  document.title = topicTitle ? `${topicTitle} | ${defaultTitle}` : defaultTitle;

  for (const [hash, panel] of sections) {
    panel.hidden = hash !== topic;
  }
  for (const tab of tabs) {
    if (tab.hash === topic) {
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.removeAttribute('aria-current');
    }
  }
  for (const link of dayLinks) {
    if (topic === '#itinerary' && link.hash === '#' + currentDay?.id) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
  overview.hidden = topic !== '#itinerary';

  activeSection = topic;
  if (!scrollToDestination) return;
  if (target instanceof HTMLDetailsElement) target.open = true;
  const daySchedule = target?.closest('.days article')?.querySelector('.day-schedule');
  if (daySchedule) daySchedule.open = true;
  const container = target?.closest('details');
  if (container) container.open = true;
  revealSight?.(target);
  if (target && target !== section) {
    target.scrollIntoView();
    if (focusOnChange) focusContent(target);
  } else {
    window.scrollTo(0, 0);
    if (focusOnChange) focusContent(heading);
  }
}

backToTop.addEventListener('click', event => {
  event.preventDefault();
  window.scrollTo(0, 0);
  focusContent(document.querySelector('.brand'));
});
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  const content = sections.get(activeSection);
  content.scrollIntoView();
  focusContent(content.querySelector('h2'));
});
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]');
  if (link && link.hash === location.hash) {
    event.preventDefault();
    showTopic(true);
  }
});
window.addEventListener('hashchange', () => showTopic(true));
showTopic();

const packingStorageKey = 'travelpalau:packing';
const packingItems = [...document.querySelectorAll('.packing-list input')];
const packingCount = document.querySelector('#packing-count');
const packingMeter = document.querySelector('#packing-meter');
const packingFilter = document.querySelector('#packing-unpacked');
const packingDone = document.querySelector('#packing-done');
const packingRemaining = document.querySelector('#packing-remaining');
const packingGroups = [...document.querySelectorAll('.packing-list fieldset')];

function filterPackingItems() {
  for (const item of packingItems) {
    const label = item.closest('label');
    label.hidden = packingFilter.checked && item.checked;
  }
  for (const group of packingGroups) {
    group.hidden = !group.querySelector('label:not([hidden])');
  }
}

function updatePackingProgress() {
  const checkedItems = packingItems.filter(item => item.checked).map(item => item.name);
  packingCount.textContent = isEnglish
    ? `${checkedItems.length} of ${packingItems.length} items packed`
    : `已打包 ${checkedItems.length}／${packingItems.length} 項`;
  const remaining = packingItems.length - checkedItems.length;
  packingRemaining.textContent = remaining
    ? (isEnglish ? `${remaining} left to pack` : `還有 ${remaining} 項待打包`)
    : '';
  packingRemaining.hidden = remaining === 0;
  packingMeter.max = packingItems.length;
  packingMeter.value = checkedItems.length;
  packingCount.parentElement.hidden = false;
  for (const group of packingGroups) {
    const count = group.querySelector('.packing-group-count');
    const total = group.querySelectorAll('input').length;
    const packed = group.querySelectorAll('input:checked').length;
    count.textContent = `${packed}/${total}`;
    count.hidden = false;
    count.setAttribute('aria-label', isEnglish ? `${packed} of ${total} packed` : `已打包 ${packed}／${total} 項`);
  }
  packingDone.hidden = checkedItems.length !== packingItems.length;
  filterPackingItems();
  return checkedItems;
}

function restorePackingItems() {
  try {
    const savedItems = JSON.parse(localStorage.getItem(packingStorageKey) || '[]');
    if (Array.isArray(savedItems)) {
      for (const item of packingItems) item.checked = savedItems.includes(item.name);
    }
  } catch {
    // Browser storage is optional.
  }
  updatePackingProgress();
}

restorePackingItems();
window.addEventListener('storage', event => {
  if (event.key === packingStorageKey || event.key === null) restorePackingItems();
});
try {
  packingFilter.checked = sessionStorage.getItem('travelpalau:unpacked') === '1';
  filterPackingItems();
} catch {
  // The filter works without session storage.
}
packingFilter.addEventListener('change', () => {
  filterPackingItems();
  try {
    sessionStorage.setItem('travelpalau:unpacked', packingFilter.checked ? '1' : '0');
  } catch {
    // The filter still applies to the current page.
  }
});
document.querySelector('.packing-list').addEventListener('change', event => {
  const checkedItems = updatePackingProgress();
  if (event.target.closest('label').hidden) {
    const position = packingItems.indexOf(event.target);
    const remaining = [...packingItems.slice(position + 1), ...packingItems.slice(0, position)];
    const next = remaining.find(item => !item.closest('label').hidden);
    (next || packingFilter).focus();
  }
  try {
    localStorage.setItem(packingStorageKey, JSON.stringify(checkedItems));
  } catch {
    // The current page keeps its checkmarks even without storage.
  }
});


const sightQuery = document.querySelector('#sight-query');
const sightCount = document.querySelector('#sight-count');
const onTrip = document.querySelector('#sights-on-trip');
const savedOnly = document.querySelector('#sights-saved');
const savedKey = 'travelpalau:saved-sights';
let savedSights = new Set();

function restoreSavedSights() {
  try {
    const stored = JSON.parse(localStorage.getItem(savedKey) || '[]');
    savedSights = new Set(Array.isArray(stored) ? stored : []);
  } catch {
    // Favorites still work on the current page.
  }
}
const clearSightQuery = document.querySelector('#clear-sight-query');
const normalizeSearch = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();
const sights = [...document.querySelectorAll('#sight-results li')].map(element => {
  const copy = element.querySelector('.sight-copy');
  const title = copy.querySelector('h3').textContent;
  const text = normalizeSearch(copy.textContent + ' ' + element.id.replaceAll('-', ' '));
  const actions = document.createElement('div');
  actions.className = 'sight-actions';
  const tripLink = copy.querySelector('a[href^="#day-"]');
  if (tripLink) actions.append(tripLink);
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'save-sight';
  save.addEventListener('click', () => {
    if (savedSights.has(element.id)) savedSights.delete(element.id);
    else savedSights.add(element.id);
    try {
      localStorage.setItem(savedKey, JSON.stringify([...savedSights]));
    } catch {
      // Keep this page's favorites in memory.
    }
    filterSights();
    if (element.hidden) savedOnly.focus();
  });
  const direct = document.createElement('a');
  direct.href = '#' + element.id;
  direct.textContent = isEnglish ? 'Open' : '開啟';
  direct.setAttribute('aria-label', (isEnglish ? 'Open ' : '開啟') + title);
  const map = copy.querySelector('a[href^="https://www.google.com/maps/"]');
  if (map) actions.append(map);
  actions.append(save, direct);
  copy.append(actions);
  return { element, text, hasTripLink: Boolean(tripLink), save, title };
});
restoreSavedSights();

function filterSights() {
  const tokens = normalizeSearch(sightQuery.value).split(/\s+/).filter(Boolean);
  let matches = 0;
  for (const { element, text, hasTripLink, save, title } of sights) {
    const saved = savedSights.has(element.id);
    save.setAttribute('aria-pressed', String(saved));
    save.setAttribute('aria-label', (isEnglish ? 'Save ' : '收藏') + title);
    save.textContent = saved ? (isEnglish ? 'Saved' : '已收藏') : (isEnglish ? 'Save' : '收藏');
    element.hidden = (savedOnly.checked && !saved) || (onTrip.checked && !hasTripLink) ||
      !tokens.every(token => text.includes(token));
    if (!element.hidden) matches++;
  }
  if (isEnglish) {
    sightCount.textContent = matches
      ? `Showing ${matches} of ${sights.length} attractions`
      : 'No matches. Try another search or adjust the filter.';
  } else {
    sightCount.textContent = matches
      ? `顯示 ${matches}／${sights.length} 個景點`
      : '找不到符合的景點，請調整搜尋或篩選。';
  }
  clearSightQuery.hidden = !sightQuery.value && !onTrip.checked && !savedOnly.checked;
}

function resetSights() {
  sightQuery.value = '';
  onTrip.checked = false;
  savedOnly.checked = false;
  filterSights();
  sightQuery.focus();
}

sightQuery.closest('.sight-tools').hidden = false;
sightQuery.addEventListener('input', event => {
  if (!event.isComposing) filterSights();
});
sightQuery.addEventListener('compositionend', filterSights);
sightQuery.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !event.isComposing) resetSights();
});
onTrip.addEventListener('change', filterSights);
savedOnly.addEventListener('change', filterSights);
window.addEventListener('storage', event => {
  if (event.key === savedKey || event.key === null) {
    restoreSavedSights();
    filterSights();
  }
});
revealSight = target => {
  if (target?.matches('#sight-results li[hidden]')) {
    sightQuery.value = '';
    onTrip.checked = false;
    savedOnly.checked = false;
    filterSights();
  }
};
clearSightQuery.addEventListener('click', resetSights);
filterSights();

const departureInput = document.querySelector('#departure-date');
const departureStatus = document.querySelector('#departure-status');
const flightDateMatch = document.querySelector('#flight-date-match');
const flightRows = [...document.querySelectorAll('[data-flight-days]')];
const dayDates = [...document.querySelectorAll('.day-date')];
const tideLinks = [...document.querySelectorAll('[data-tide-day]')];
const dateStorageKey = 'travelpalau:departure';
const dateFormatter = new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'zh-TW', {
  month: 'numeric', day: 'numeric', weekday: 'short', timeZone: 'UTC'
});
const shiftDate = (date, days) => new Date(date.getTime() + days * 86400000);

function updateDeparture() {
  const iso = departureInput.value;
  const valid = Boolean(iso) && departureInput.validity.valid;
  const departure = valid ? new Date(iso + 'T00:00:00Z') : null;
  for (const day of dayDates) {
    day.hidden = !departure;
    if (departure) {
      const date = shiftDate(departure, Number(day.dataset.dayOffset));
      day.dateTime = date.toISOString().slice(0, 10);
      day.textContent = dateFormatter.format(date);
    }
  }
  for (const link of tideLinks) {
    const url = new URL(link.href);
    url.searchParams.delete('bdate');
    url.searchParams.delete('edate');
    if (departure) {
      const date = shiftDate(departure, Number(link.dataset.tideDay) - 1);
      const key = date.toISOString().slice(0, 10).replaceAll('-', '');
      url.searchParams.set('bdate', key);
      url.searchParams.set('edate', key);
      link.textContent = (isEnglish ? 'Tides · ' : '潮汐 · ') + dateFormatter.format(date);
    } else {
      link.textContent = isEnglish ? 'Tide reference' : '潮汐參考';
    }
    link.href = url.href;
  }
  if (!departure) {
    departureStatus.textContent = isEnglish
      ? 'Choose a date to see all five dates and tide references.'
      : '選擇出發日後，可看五天日期與潮汐參考。';
  } else {
    const dates = [departure, shiftDate(departure, 4)].map(date => dateFormatter.format(date)).join(' – ');
    departureStatus.textContent = dates;
  }
  const referenceMonth = departure && iso.startsWith('2026-11-');
  let matchingFlight = '';
  for (const row of flightRows) {
    const matches = referenceMonth && row.dataset.flightDays.split(',').includes(String(departure.getUTCDay()));
    row.classList.toggle('flight-match', Boolean(matches));
    if (matches) matchingFlight = row.querySelector('th').firstChild.textContent.trim();
  }
  flightDateMatch.hidden = !departure;
  if (!departure) return;
  if (!referenceMonth) {
    flightDateMatch.textContent = isEnglish
      ? 'This table covers November 2026. Check the airline for your selected date.'
      : '這份班表僅供 2026 年 11 月參考，請向航空公司查詢所選日期。';
  } else if (matchingFlight) {
    flightDateMatch.textContent = isEnglish
      ? 'Reference flight for your selected weekday: ' + matchingFlight
      : '所選出發日的星期對應參考班號：' + matchingFlight;
  } else {
    flightDateMatch.textContent = isEnglish
      ? 'No outbound flight appears on this weekday in the reference table.'
      : '參考班表在所選星期沒有去程航班。';
  }
}

try {
  departureInput.value = localStorage.getItem(dateStorageKey) || '';
} catch {
  // The date still works without browser storage.
}
departureInput.closest('.departure-plan').hidden = false;
departureInput.addEventListener('input', () => {
  try {
    if (departureInput.validity.valid && departureInput.value) localStorage.setItem(dateStorageKey, departureInput.value);
    else localStorage.removeItem(dateStorageKey);
  } catch {
    // The date still works on the current page.
  }
  updateDeparture();
});
updateDeparture();
