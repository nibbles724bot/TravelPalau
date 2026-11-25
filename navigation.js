const tabs = [...document.querySelectorAll('.tabs a')];
const sections = new Map(tabs.map(tab => [
  tab.hash,
  document.getElementById(tab.hash.slice(1))
]));
const overview = document.querySelector('.overview');
const backToTop = document.querySelector('#back-to-top');
let activeSection;

function showTopic() {
  const target = document.getElementById(location.hash.slice(1));
  const section = target?.closest('main > section[id]');
  const topic = section ? '#' + section.id : '#itinerary';

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
  overview.hidden = topic !== '#itinerary';

  if (target && target !== section) {
    target.scrollIntoView();
  } else if (topic !== activeSection || target) {
    window.scrollTo(0, 0);
  }
  activeSection = topic;
}

backToTop.addEventListener('click', event => {
  event.preventDefault();
  window.scrollTo(0, 0);
});
window.addEventListener('hashchange', showTopic);
showTopic();

const packingStorageKey = 'travelpalau:packing';
const packingItems = [...document.querySelectorAll('.packing-list input')];

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

document.querySelector('.packing-list')?.addEventListener('change', () => {
  const checkedItems = packingItems.filter(item => item.checked).map(item => item.name);
  try {
    localStorage.setItem(packingStorageKey, JSON.stringify(checkedItems));
  } catch {
    // The current page keeps its checkmarks even without storage.
  }
});
