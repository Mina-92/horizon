// File: assets/js/main.js
/**
 * Template Name: Logis (modified for Horizon Connex)
 *
 * Core behaviors:
 *   1) Theme toggle (☼/⏾)
 *   2) Header scroll (adds .scrolled after 100px)
 *   3) AOS, PureCounter, GLightbox, Swiper
 *   4) Dynamically collapse/restore nav items based on “fit” (no fixed breakpoints)
 *   5) Logo snaps to 120px width as soon as any nav‐item collapses; otherwise stays at natural size
 *   6) Header never overflows; everything is measured to fit within container
 *   7) “≡” overlay uses original Logis colors; click‐to‐close works
 */

;(function() {
  "use strict";

  /*──────────────────────────────────────────────────────────────
   # 1) Theme Auto‐Detect & Toggle (now using ☼ and ⏾)
  ──────────────────────────────────────────────────────────────*/
  const rootEl      = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme  = localStorage.getItem('theme');

  function updateToggleIcon() {
    // If currently dark-mode, show ☼ (click to go light)
    if (rootEl.classList.contains('dark-mode')) {
      themeToggle.textContent = '☼';
    } else {
      // Otherwise (light-mode), show ⏾ (click to go dark)
      themeToggle.textContent = '☾';
    }
  }

  // 1a) Apply saved or system preference
  if (savedTheme === 'dark-mode' || savedTheme === 'light-mode') {
    rootEl.classList.add(savedTheme);
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      rootEl.classList.add('dark-mode');
    } else {
      rootEl.classList.add('light-mode');
    }
  }

  // Now set the correct toggle icon
  updateToggleIcon();

  // 1b) Toggle UI + persist in localStorage, then update icon
  themeToggle.addEventListener('click', () => {
    if (rootEl.classList.contains('dark-mode')) {
      rootEl.classList.replace('dark-mode', 'light-mode');
      localStorage.setItem('theme', 'light-mode');
    } else {
      rootEl.classList.replace('light-mode', 'dark-mode');
      localStorage.setItem('theme', 'dark-mode');
    }
    updateToggleIcon();
  });


  /*──────────────────────────────────────────────────────────────
   # 2) Core Logis Scripts (header scroll, preloader, AOS, etc.)
  ──────────────────────────────────────────────────────────────*/
  function onScroll() {
    const header = document.getElementById('header');
    if (!header.classList.contains('fixed-top')) return;
    document.body.classList.toggle('scrolled', window.scrollY > 100);
  }
  document.addEventListener('scroll', onScroll);
  window.addEventListener('load', onScroll);

  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => preloader.remove());
  }

  const scrollTopBtn = document.querySelector('.scroll-top');
  function toggleScrollTop() {
    scrollTopBtn.classList.toggle('active', window.scrollY > 100);
  }
  scrollTopBtn.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  window.addEventListener('load', () => {
    if (window.AOS) AOS.init({ duration: 600, easing: 'ease-in-out', once: true, mirror: false });
  });

  if (window.PureCounter) new PureCounter();
  if (window.GLightbox) GLightbox({ selector: '.glightbox' });

  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(el => {
      const cfg = JSON.parse(el.querySelector(".swiper-config").textContent.trim());
      new Swiper(el, cfg);
    });
  }
  window.addEventListener('load', initSwiper);

  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach(el => {
    el.addEventListener('click', () => el.parentNode.classList.toggle('faq-active'));
  });


  /*──────────────────────────────────────────────────────────────
   # 3) Dynamic Collapse/Restore of Navigation Items by “Fit”
  ──────────────────────────────────────────────────────────────*/
  const navList       = document.getElementById('nav-list');
  const dropdownLi    = document.getElementById('header-dropdown');
  const dropdownUl    = dropdownLi.querySelector('.dropdown-menu');
  const headerEl      = document.getElementById('header');
  const logoLink      = document.getElementById('logo-link');
  const langSelector  = document.querySelector('.lang-selector');
  const themeToggleEl = document.getElementById('theme-toggle');
  const logoImg       = logoLink.querySelector('img');

  // Gather the four main nav-items in DOM order: Home, About, Services, Contact-Button
  const allNavItems = Array.from(navList.querySelectorAll('.nav-item'))
    .filter(li => li.id !== 'header-dropdown');

  const totalNavItems = allNavItems.length; // should be 4

  // Collapse priority: Services → About → Home → Contact-Button
  // Determine indices based on DOM order:
  //   0: Home
  //   1: About
  //   2: Services
  //   3: Contact-Button
  const collapseOrderIndices = [2, 1, 0, 3];

  // Restore priority: Contact-Button → Home → About → Services
  const restoreOrderIndices = [3, 0, 1, 2];

  /**
   * Move a <li> (`navItem`) into the overlay dropdown, preserving dropdownOrder:
   *   - Clone its <a> into dropdownUl at the correct sorted position.
   *   - Add .hide-item to original.
   *   - Unhide dropdown toggle if needed.
   */
  function moveToDropdown(navItem) {
    if (!navItem.classList.contains('hide-item')) {
      const anchorClone = navItem.querySelector('a').cloneNode(true);
      const newLi = document.createElement('li');
      newLi.appendChild(anchorClone);

      // Insert clones in same order as original: append, then reorder
      dropdownUl.appendChild(newLi);
      reorderDropdownItems();

      navItem.classList.add('hide-item');
      dropdownLi.classList.remove('d-none');
    }
  }

  /**
   * Restore a <li> (`navItem`) from the overlay dropdown:
   *   - Remove its clone from dropdownUl.
   *   - Remove .hide-item from original.
   *   - If dropdownUl is empty, hide the toggle.
   */
  function restoreFromDropdown(navItem) {
    const href = navItem.querySelector('a').getAttribute('href');
    Array.from(dropdownUl.children).forEach(childLi => {
      const a = childLi.querySelector('a');
      if (a && a.getAttribute('href') === href) {
        childLi.remove();
      }
    });
    navItem.classList.remove('hide-item');
    if (dropdownUl.children.length === 0) {
      dropdownLi.classList.add('d-none');
      dropdownLi.classList.remove('dropdown-open');
    }
  }

  /**
   * After any change to dropdownUl, reorder its <li> children so that they follow
   * the left-to-right order of allNavItems (Home, About, Services, Contact-Button).
   */
  function reorderDropdownItems() {
    const clones = Array.from(dropdownUl.children);
    clones.sort((aLi, bLi) => {
      const aHref = aLi.querySelector('a').getAttribute('href');
      const bHref = bLi.querySelector('a').getAttribute('href');
      const aIndex = allNavItems.findIndex(origLi => origLi.querySelector('a').getAttribute('href') === aHref);
      const bIndex = allNavItems.findIndex(origLi => origLi.querySelector('a').getAttribute('href') === bHref);
      return aIndex - bIndex;
    });
    clones.forEach(node => dropdownUl.appendChild(node));
  }

  /**
   * Calculate “available width” for nav‐items, including the hamburger if visible:
   *   header width
   *   – logo width
   *   – langSelector width
   *   – themeToggle width
   *   – hamburger width (if not .d-none)
   *   – buffer (40px)
   */
  function availableWidthIncludingHamburger() {
    const headerRect  = headerEl.getBoundingClientRect();
    const logoRect    = logoLink.getBoundingClientRect();
    const langRect    = langSelector.getBoundingClientRect();
    const themeRect   = themeToggleEl.getBoundingClientRect();
    const hambRect    = dropdownLi.getBoundingClientRect();
    const hambWidth   = dropdownLi.classList.contains('d-none') ? 0 : hambRect.width;
    const buffer = 40; // spacing/margins buffer
    const reserved = logoRect.width + langRect.width + themeRect.width + hambWidth + buffer;
    return headerRect.width - reserved;
  }

  /**
   * Calculate sum of widths for all visible nav‐items (excluding hamburger).
   */
  function sumVisibleNavItemsWidth() {
    const visibleLis = allNavItems.filter(li => !li.classList.contains('hide-item'));
    return visibleLis.reduce((sum, li) => sum + li.getBoundingClientRect().width, 0);
  }

  /**
   * Check if header overflows given current logo width:
   *   Compare sum(logo + nav-items + hamburger(if visible) + lang + theme + buffer)
   *   against header width.
   */
  function headerOverflows() {
    const headerRect = headerEl.getBoundingClientRect();
    const logoRect   = logoLink.getBoundingClientRect();
    const langRect   = langSelector.getBoundingClientRect();
    const themeRect  = themeToggleEl.getBoundingClientRect();
    const hambRect   = dropdownLi.getBoundingClientRect();
    const hambWidth  = dropdownLi.classList.contains('d-none') ? 0 : hambRect.width;
    const buffer     = 40;

    const navSum     = sumVisibleNavItemsWidth();
    const totalUsed  = logoRect.width + navSum + hambWidth + langRect.width + themeRect.width + buffer;
    return totalUsed > headerRect.width;
  }

  /**
   * Collapse any nav‐items that collectively exceed “availableWidthIncludingHamburger”,
   * following collapseOrderIndices (Services → About → Home → Contact-Button):
   *   1) Compute initial sumWidths and avail.
   *   2) While overflow:
   *      - Iterate collapseOrderIndices; for each index:
   *          • If that navItem is still visible, collapse it, update sums/avail, break inner loop.
   *      - If no candidate was collapsed in a full pass, break to avoid infinite loop.
   *   3) If all totalNavItems are collapsed, add .small-collapsed.
   */
  function collapseOverflowingItems() {
    let avail = availableWidthIncludingHamburger();
    let sumWidths = sumVisibleNavItemsWidth();

    // Continue collapsing while there is overflow
    while (sumWidths > avail) {
      let collapsedOne = false;

      for (let idx of collapseOrderIndices) {
        const navItem = allNavItems[idx];
        if (navItem && !navItem.classList.contains('hide-item')) {
          // Collapse this item
          const itemWidth = navItem.getBoundingClientRect().width;
          moveToDropdown(navItem);
          sumWidths -= itemWidth;
          avail = availableWidthIncludingHamburger();
          collapsedOne = true;
          break;
        }
      }

      // If no collapse occurred (all candidates hidden), stop looping
      if (!collapsedOne) break;
    }

    // If now all nav items are hidden, set small-collapsed
    if (dropdownUl.children.length === totalNavItems) {
      headerEl.classList.add('small-collapsed');
    }
  }

  /**
   * Restore any nav‐items that can now fit within “available width ignoring hamburger”,
   * following restoreOrderIndices (Contact-Button → Home → About → Services):
   *   1) While dropdownUl not empty:
   *      - Iterate restoreOrderIndices; for each index:
   *          • If that navItem is currently hidden, attempt un-hide:
   *              › Remove .hide-item, check headerOverflows().
   *              › If no overflow, remove its clone; mark restoredAny = true; break inner loop.
   *              › If it overflows, re-hide it, break outer (stop restoration).
   *      - If no candidate found to restore, break loop.
   *   2) If any restored, remove .small-collapsed.
   *   3) If dropdown becomes empty, hide hamburger.
   */
  function restoreItemsIfFit() {
    // If dropdown is empty, ensure hamburger is hidden and exit early
    if (dropdownUl.children.length === 0) {
      dropdownLi.classList.add('d-none');
      dropdownLi.classList.remove('dropdown-open');
      return;
    }

    let restoredAny = false;

    while (dropdownUl.children.length > 0) {
      let didRestoreThisPass = false;

      for (let idx of restoreOrderIndices) {
        const navItem = allNavItems[idx];
        if (navItem && navItem.classList.contains('hide-item')) {
          // Attempt to un-hide temporarily
          navItem.classList.remove('hide-item');
          const stillOverflows = headerOverflows();

          if (!stillOverflows) {
            // It fits: remove its clone from dropdown
            restoreFromDropdown(navItem);
            restoredAny = true;
            didRestoreThisPass = true;
            break; // break restorePriority loop, re-enter while if still items
          } else {
            // It doesn't fit: revert hide and stop restoration entirely
            navItem.classList.add('hide-item');
            didRestoreThisPass = false;
            break;
          }
        }
      }

      // If no restoration happened in this pass, or dropdown is empty, break while
      if (!didRestoreThisPass) break;
    }

    if (restoredAny) {
      headerEl.classList.remove('small-collapsed');
    }

    // After attempts, if dropdown is empty, hide the hamburger
    if (dropdownUl.children.length === 0) {
      dropdownLi.classList.add('d-none');
      dropdownLi.classList.remove('dropdown-open');
    }
  }

  /**
   * Two‐state logo sizing:
   *   - If ANY nav item is collapsed (dropdownUl.children.length > 0), force logo width = 120px.
   *   - Otherwise, logo width = 'auto' (natural CSS size).
   */
  function adjustLogoSizeIfNeeded() {
    if (dropdownUl.children.length > 0) {
      logoImg.style.width = '120px';
    } else {
      logoImg.style.width = 'auto';
    }
  }

  /**
   * Master adjustment on load + resize:
   *   1) Restore items that fit (custom restore order)
   *   2) If header still overflows in natural logo state, shrink logo to 120px
   *   3) Collapse items until fits (custom collapse order)
   *   4) Snap logo state (already done in step 3)
   */
  function adjustHeaderDynamically() {
    // Attempt restoration first
    restoreItemsIfFit();

    // If still overflowing in “natural” logo state, enforce 120px
    if (headerOverflows()) {
      logoImg.style.width = '120px';
    }

    // Then collapse until no overflow (in custom order)
    collapseOverflowingItems();

    // Finally ensure logo matches “any collapsed? → 120px : auto”
    adjustLogoSizeIfNeeded();
  }

  // Run on load and shortly after
  window.addEventListener('load', () => {
    adjustHeaderDynamically();
    setTimeout(adjustHeaderDynamically, 100);
  });
  // Run on every resize
  window.addEventListener('resize', adjustHeaderDynamically);

  // Toggle the “≡” overlay when the hamburger is clicked
  const toggleBtn = dropdownLi.querySelector('.header-dropdown-toggle');
  toggleBtn.addEventListener('click', function(e) {
    e.preventDefault();
    dropdownLi.classList.toggle('dropdown-open');
  });

  // Close overlay if clicking outside
  document.addEventListener('click', function(e) {
    if (!dropdownLi.contains(e.target)) {
      dropdownLi.classList.remove('dropdown-open');
    }
  });

  // Close overlay if clicking any link inside it
  dropdownUl.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      dropdownLi.classList.remove('dropdown-open');
    }
  });

  // ───────────────────────────────
  // Scroll‐Spy: highlight nav link of the section in view
  // ───────────────────────────────
  const navLinks = document.querySelectorAll('.nav-item a');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 60;
      const sectionId = current.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

})(); // end IIFE
