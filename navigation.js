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
  element.setAttribute('tabindex', '-1');
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

function updatePackingProgress() {
  const checkedItems = packingItems.filter(item => item.checked).map(item => item.name);
  packingCount.textContent = `已打包 ${checkedItems.length}／${packingItems.length} 項`;
  packingMeter.max = packingItems.length;
  packingMeter.value = checkedItems.length;
  packingCount.parentElement.hidden = false;
  return checkedItems;
}

try {
  const savedItems = JSON.parse(localStorage.getItem(packingStorageKey) || '[]');
  if (Array.isArray(savedItems)) {
    for (const item of packingItems) {
      item.checked = savedItems.includes(item.name);
    }
  }
} catch {
  // The checklist still works when browser storage is unavailable.
}

updatePackingProgress();
document.querySelector('.packing-list').addEventListener('change', () => {
  const checkedItems = updatePackingProgress();
  try {
    localStorage.setItem(packingStorageKey, JSON.stringify(checkedItems));
  } catch {
    // The current page keeps its checkmarks even without storage.
  }
});
