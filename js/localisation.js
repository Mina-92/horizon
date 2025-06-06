;(function() {
  const btn     = document.getElementById('lang-toggle');
  const menu    = document.getElementById('lang-menu');
  const options = menu.querySelectorAll('li[data-lang]');
  const stored  = localStorage.getItem('lang') || 'en-US';
  const flags   = {
    en: '🇺🇸', ar: '🇸🇦', it: '🇮🇹', fr: '🇫🇷',
    de: '🇩🇪', es: '🇪🇸', ru: '🇷🇺', zh: '🇨🇳'
  };

  async function applyLang(lang) {
    try {
      const res  = await fetch(`lang/${lang}.json`);
      const dict = await res.json();
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (dict[key]) el.textContent = dict[key];
      });
      btn.querySelector('.flag').textContent = flags[lang.split('-')[0]] || '🏳️';
      if (lang.startsWith('ar')) {
        document.documentElement.dir = 'rtl';
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.classList.remove('rtl');
      }
      localStorage.setItem('lang', lang);
    } catch (e) {
      console.error('i18n load error:', e);
    }
  }

  applyLang(stored);

  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  options.forEach(item => item.addEventListener('click', () => {
    applyLang(item.dataset.lang);
    menu.style.display = 'none';
  }));

  document.addEventListener('click', () => menu.style.display = 'none');
})();
