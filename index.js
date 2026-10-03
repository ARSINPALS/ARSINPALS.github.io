/* Interacciones de Fabi Faisal: menú, flip cards y visor de perfil. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function closeMenu() {
    const nav = $('#navLinks');
    const button = $('#hamburger');
    const overlay = $('#navOverlay');
    nav?.classList.remove('active', 'open', 'show');
    button?.classList.remove('active');
    overlay?.classList.remove('visible');
    button?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  function toggleMenu() {
    const nav = $('#navLinks');
    const button = $('#hamburger');
    const overlay = $('#navOverlay');
    if (!nav || !button) return;
    const opening = !nav.classList.contains('active');
    nav.classList.toggle('active', opening);
    nav.classList.toggle('open', opening);
    button.classList.toggle('active', opening);
    overlay?.classList.toggle('visible', opening);
    button.setAttribute('aria-expanded', String(opening));
    document.body.classList.toggle('menu-open', opening);
  }
  // The HTML has inline onclick handlers, so expose these functions globally.
  window.closeMenu = closeMenu;
  window.toggleMenu = toggleMenu;

  function setupFlipCards() {
    $$('.flip-card').forEach((card, index) => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Tarjeta de juego ${index + 1}. Pulsa para girar`);
      card.setAttribute('aria-pressed', String(card.classList.contains('flipped')));

      const flip = () => {
        const isFlipped = card.classList.toggle('flipped');
        card.setAttribute('aria-pressed', String(isFlipped));
      };
      card.addEventListener('click', (event) => {
        // Don't block links or controls on the reverse side.
        if (event.target.closest('a, button, input, select, textarea, [data-no-flip]')) return;
        flip();
      });
      card.addEventListener('keydown', (event) => {
        if (event.target.closest('a, button, input, select, textarea')) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          flip();
        }
      });
    });
  }

  function setupProfileLightbox() {
    const image = $('.profile-img');
    const lightbox = $('#profileLightbox');
    if (!image || !lightbox) return;
    const stage = $('.profile-lightbox-stage', lightbox);
    const closeButton = $('.profile-lightbox-close', lightbox);
    const faces = $$('.profile-lightbox-face', lightbox);
    let previousFocus = null;

    const open = () => {
      previousFocus = document.activeElement;
      stage?.classList.remove('is-flipped');
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('profile-lightbox-open');
      closeButton?.focus({ preventScroll: true });
    };
    const close = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('profile-lightbox-open');
      stage?.classList.remove('is-flipped');
      previousFocus?.focus?.({ preventScroll: true });
    };
    const flip = () => {
      const flipped = stage?.classList.toggle('is-flipped') ?? false;
      if (faces[0]) faces[0].setAttribute('aria-hidden', String(flipped));
      if (faces[1]) faces[1].setAttribute('aria-hidden', String(!flipped));
    };

    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', 'Ampliar y girar foto de perfil');
    image.addEventListener('click', open);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
    closeButton?.addEventListener('click', close);
    stage?.addEventListener('click', flip);
    stage?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flip(); }
    });
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.classList.contains('open')) close();
    });
  }

  function setupNavbar() {
    const navbar = $('#navbar');
    const update = () => navbar?.classList.toggle('scrolled', window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
    $$('#navLinks a').forEach(link => link.addEventListener('click', closeMenu));
    $('#navOverlay')?.addEventListener('click', closeMenu);
    window.addEventListener('resize', () => { if (window.innerWidth > 850) closeMenu(); });
  }

  function setupParticles() {
    if (typeof window.particlesJS !== 'function' || !$('#particles')) return;
    try {
      window.particlesJS('particles', {
        particles: {
          number: { value: 38, density: { enable: true, value_area: 900 } },
          color: { value: ['#ff4fd8', '#ff00a8', '#ffc2ef'] },
          shape: { type: 'circle' },
          opacity: { value: 0.45, random: true },
          size: { value: 3, random: true },
          line_linked: { enable: false },
          move: { enable: true, speed: 0.8, direction: 'none', random: true, straight: false, out_mode: 'out' }
        },
        interactivity: { detect_on: 'canvas', events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
        retina_detect: true
      });
    } catch (error) { console.warn('No se pudieron iniciar las partículas:', error); }
  }

  function setupBackgroundMusic() {
    const audio = $('#backgroundMusic');
    const button = $('#musicToggle');
    const status = $('#musicStatus');
    if (!audio || !button || !status) return;

    audio.volume = 0.35;
    const setPlayingUI = (playing) => {
      button.textContent = playing ? 'Ⅱ' : '▶';
      button.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
      button.title = playing ? 'Pausar música' : 'Reproducir música';
      status.textContent = playing ? 'Reproduciendo' : 'Pulsa ▶ para activar';
    };

    // El navegador puede bloquear autoplay con sonido; se intenta al cargar y
    // se ofrece un botón si necesita un gesto del usuario.
    const attemptAutoplay = () => {
      const promise = audio.play();
      if (promise && typeof promise.then === 'function') {
        promise.then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
      } else { setPlayingUI(!audio.paused); }
    };
    button.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => setPlayingUI(true)).catch(() => {
          status.textContent = 'No se pudo cargar seconda.mp3';
          setPlayingUI(false);
        });
      } else { audio.pause(); setPlayingUI(false); }
    });
    audio.addEventListener('play', () => setPlayingUI(true));
    audio.addEventListener('pause', () => setPlayingUI(false));
    audio.addEventListener('error', () => { status.textContent = 'Falta seconda.mp3'; setPlayingUI(false); });
    attemptAutoplay();
  }

  function init() {
    setupBackgroundMusic();
    setupFlipCards();
    setupProfileLightbox();
    setupNavbar();
    setupParticles();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
