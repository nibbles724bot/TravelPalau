const languagePreferenceKey = 'travelpalau:language';
const currentLanguage = document.documentElement.lang;

function preferredLanguage() {
  try {
    const savedLanguage = localStorage.getItem(languagePreferenceKey);
    if (savedLanguage === 'zh-Hant' || savedLanguage === 'en') return savedLanguage;
  } catch {
    // Browser language still works when storage is unavailable.
  }

  const supported = (navigator.languages || [navigator.language])
    .find(language => /^(zh|en)(-|$)/i.test(language));
  return /^zh(-|$)/i.test(supported || '') ? 'zh-Hant' : 'en';
}

if (currentLanguage === 'zh-Hant' && location.pathname.endsWith('/') && preferredLanguage() === 'en') {
  location.replace('en.html' + location.search + location.hash);
}
