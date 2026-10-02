// Highlight the nav link for the section currently in view.
(() => {
  const links = document.querySelectorAll('.nav a');
  const sections = [...links]
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const setActive = id => {
    links.forEach(a => {
      const on = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('is-active', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        a.scrollIntoView({ inline: "center", block: "nearest" });
      } else {
        a.removeAttribute('aria-current');
      }
    });
  };

  if (!('IntersectionObserver' in window)) return;

  // The band between 35% and 55% of the viewport decides which section "owns" the screen.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-35% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
})();

// Scroll-reveal with staggered entrances and no-JS fallback
(() => {
  // Mark JS as active so CSS hiding kicks in
  document.documentElement.classList.add('js');

  const reveals = document.querySelectorAll('.reveal');

  // Fallback if IntersectionObserver is unsupported or prefers-reduced-motion is active
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || motionQuery.matches) {
    reveals.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const phoneQuery = window.matchMedia('(max-width: 600px)');

  const setupDelays = isPhone => {
    // 1. Hero load sequence: name, role, tagline, badges, buttons
    const heroElements = document.querySelectorAll('.hero .reveal');
    heroElements.forEach((el, index) => {
      el.style.setProperty('--delay', isPhone ? '0ms' : `${index * 150}ms`);
    });

    // 2. Stagger sibling groups in grids/lists (desktop/tablet only)
    const groupSelectors = ['.projects', '.projects__upcoming', '.skills', '.stats'];
    groupSelectors.forEach(selector => {
      const container = document.querySelector(selector);
      if (!container) return;
      const items = container.querySelectorAll('.reveal');
      items.forEach((item, index) => {
        const delay = isPhone ? 0 : Math.min(index * 120, 480);
        item.style.setProperty('--delay', `${delay}ms`);
      });
    });
  };

  let currentObserver = null;

  const initObserver = () => {
    if (currentObserver) {
      currentObserver.disconnect();
    }

    const isPhone = phoneQuery.matches;
    setupDelays(isPhone);

    const observerConfig = isPhone
      ? { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
      : { threshold: 0.15, rootMargin: '0px 0px -8% 0px' };

    currentObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        } else {
          // If scrolled past fast on phone (element is already above viewport), reveal instantly
          const rect = entry.target.getBoundingClientRect();
          if (isPhone && rect.bottom < 0) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        }
      });
    }, observerConfig);

    reveals.forEach(el => {
      if (!el.classList.contains('is-visible')) {
        const rect = el.getBoundingClientRect();
        // Elements already in the viewport on load reveal immediately
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-visible');
        } else if (isPhone && rect.bottom < 0) {
          // Above viewport when fast scrolled
          el.classList.add('is-visible');
        } else {
          currentObserver.observe(el);
        }
      }
    });
  };

  initObserver();

  // Listen for media query change (phone rotation / window resize)
  try {
    phoneQuery.addEventListener('change', () => {
      initObserver();
    });
  } catch (e) {
    phoneQuery.addListener(() => {
      initObserver();
    });
  }
})();

// Interactive Skill Cards: level bars animation and accordion drawers
(() => {
  const cards = document.querySelectorAll('.skill-card[data-level]');

  // Animate level bar fill when card enters view
  if ('IntersectionObserver' in window) {
    const levelObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const level = card.dataset.level || 0;
          card.style.setProperty('--level', `${level}%`);
          obs.unobserve(card);
        }
      });
    }, { threshold: 0.2 });

    cards.forEach(card => levelObserver.observe(card));
  } else {
    // If no IntersectionObserver, apply level widths immediately
    cards.forEach(card => {
      const level = card.dataset.level || 0;
      card.style.setProperty('--level', `${level}%`);
    });
  }

  // Populate data-note if present, otherwise leave empty so :empty rule hides it
  cards.forEach(card => {
    const note = (card.dataset.note || '').trim();
    const noteEl = card.querySelector('.skill-card__note');
    if (noteEl) {
      noteEl.textContent = note;
    }
  });

  // Tap-to-expand details toggle
  const toggles = document.querySelectorAll('.skill-card__toggle');
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.skill-card');
      if (!card) return;
      const isOpen = card.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
      const btnText = btn.querySelector('span');
      if (btnText) {
        btnText.textContent = isOpen ? 'Hide details' : 'Show details';
      }
    });
  });
})();
// Theme switch & dark mode persistence
(() => {
  const toggleBtn = document.querySelector('.theme-toggle');
  if (!toggleBtn) return;

  const label = toggleBtn.querySelector('.theme-toggle__label');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const getSavedTheme = () => {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  };

  const saveTheme = theme => {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  };

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    toggleBtn.setAttribute('aria-checked', String(isDark));
    if (label) label.textContent = isDark ? 'Dark' : 'Light';
    if (metaTheme) metaTheme.setAttribute('content', isDark ? '#15150F' : '#F4EEDC');
    if (persist) saveTheme(theme);
  };

  // Sync initial button state with html[data-theme] set by head script or fallback
  const currentTheme =
    document.documentElement.getAttribute('data-theme') ||
    getSavedTheme() ||
    getSystemTheme();
  applyTheme(currentTheme, false);

  // Toggle on click
  toggleBtn.addEventListener('click', () => {
    const isCurrentDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isCurrentDark ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  });

  // Respond to OS color scheme changes if user hasn't explicitly chosen
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', e => {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  } catch (e) {}
})();

