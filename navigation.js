const tabs = [...document.querySelectorAll('.tabs a')];
const sections = new Map(tabs.map(tab => [
  tab.hash,
  document.getElementById(tab.hash.slice(1))
]));
const overview = document.querySelector('.overview');
const backToTop = document.querySelector('#back-to-top');
const dayLinks = [...document.querySelectorAll('.jump a')];
const main = document.querySelector('main');
let activeSection;

function focusContent(element) {
  if (element.tabIndex < 0) element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
}

function showTopic(focusOnChange = false) {
  const target = document.getElementById(location.hash.slice(1));
  const section = target?.closest('main > section[id]');
  const topic = target === main ? activeSection || '#itinerary' : section ? '#' + section.id : '#itinerary';
  const panel = sections.get(topic);

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
    if (link.hash === location.hash) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
  overview.hidden = topic !== '#itinerary';

  if (target instanceof HTMLDetailsElement) target.open = true;
  if (target && target !== section) {
    target.scrollIntoView();
    if (focusOnChange) focusContent(target);
  } else if (topic !== activeSection || target) {
    window.scrollTo(0, 0);
    if (focusOnChange) focusContent(panel.querySelector('h2'));
  }
  activeSection = topic;
}

backToTop.addEventListener('click', event => {
  event.preventDefault();
  window.scrollTo(0, 0);
  focusContent(document.querySelector('.brand'));
});
for (const tab of tabs) {
  tab.addEventListener('click', event => {
    if (location.hash === tab.hash && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      showTopic(true);
    }
  });
}
window.addEventListener('hashchange', () => showTopic(true));
showTopic();

const packingStorageKey = 'travelpalau:packing';
const packingItems = [...document.querySelectorAll('.packing-list input')];
const packingCount = document.querySelector('#packing-count');
const packingMeter = document.querySelector('#packing-meter');
const packingFilter = document.querySelector('#packing-unpacked');
const packingDone = document.querySelector('#packing-done');

function filterPackingItems() {
  for (const item of packingItems) {
    const label = item.closest('label');
    label.hidden = packingFilter.checked && item.checked;
  }
  for (const group of document.querySelectorAll('.packing-list fieldset')) {
    group.hidden = !group.querySelector('label:not([hidden])');
  }
}

function updatePackingProgress() {
  const checkedItems = packingItems.filter(item => item.checked).map(item => item.name);
  packingCount.textContent = `已打包 ${checkedItems.length}／${packingItems.length} 項`;
  packingMeter.max = packingItems.length;
  packingMeter.value = checkedItems.length;
  packingCount.parentElement.hidden = false;
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
packingFilter.addEventListener('change', filterPackingItems);
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
const clearSightQuery = document.querySelector('#clear-sight-query');
const normalizeSearch = value => value.normalize('NFKC').toLowerCase().trim();
const sights = [...document.querySelectorAll('#sight-results li')].map(element => ({
  element,
  text: normalizeSearch(element.querySelector('.sight-copy').textContent),
  hasTripLink: Boolean(element.querySelector('a[href^="#day-"]'))
}));

function filterSights() {
  const tokens = normalizeSearch(sightQuery.value).split(/\s+/).filter(Boolean);
  let matches = 0;
  for (const { element, text, hasTripLink } of sights) {
    element.hidden = (onTrip.checked && !hasTripLink) || !tokens.every(token => text.includes(token));
    if (!element.hidden) matches++;
  }
  sightCount.textContent = matches
    ? `顯示 ${matches}／${sights.length} 個景點`
    : '找不到符合的景點，請調整搜尋或篩選。';
  clearSightQuery.hidden = !sightQuery.value && !onTrip.checked;
}

function resetSights() {
  sightQuery.value = '';
  onTrip.checked = false;
  filterSights();
  sightQuery.focus();
}

sightQuery.closest('.sight-tools').hidden = false;
sightQuery.addEventListener('input', filterSights);
sightQuery.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !event.isComposing) resetSights();
});
onTrip.addEventListener('change', filterSights);
clearSightQuery.addEventListener('click', resetSights);
filterSights();

const printTopic = document.querySelector('#print-topic');
let expandedForPrint = [];
printTopic.hidden = false;
printTopic.addEventListener('click', () => window.print());
window.addEventListener('beforeprint', () => {
  expandedForPrint = [...document.querySelectorAll('section:not([hidden]) details:not([open])')];
  expandedForPrint.forEach(details => details.open = true);
});
window.addEventListener('afterprint', () => {
  expandedForPrint.forEach(details => details.open = false);
  expandedForPrint = [];
});
