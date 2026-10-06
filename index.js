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
    let flipCount = 0;

    const open = () => {
      previousFocus = document.activeElement;
      stage?.classList.remove('is-flipped');
      lightbox.classList.remove('butterfly-center-active', 'calico-scene-active');
      flipCount = 0;
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
      lightbox.classList.remove('butterfly-center-active', 'calico-scene-active');
      flipCount = 0;
      previousFocus?.focus?.({ preventScroll: true });
    };
    const flip = () => {
      const flipped = stage?.classList.toggle('is-flipped') ?? false;
      if (faces[0]) faces[0].setAttribute('aria-hidden', String(flipped));
      if (faces[1]) faces[1].setAttribute('aria-hidden', String(!flipped));
      flipCount += 1;
      lightbox.classList.remove('butterfly-center-active', 'calico-scene-active');
      if (flipCount % 2 === 1) {
        // Flip impar: mariposa rosa pastel.
        const bigButterfly = $('.center-butterfly', lightbox);
        if (bigButterfly) {
          bigButterfly.style.animation = 'none';
          void bigButterfly.offsetWidth;
          bigButterfly.style.animation = '';
        }
        lightbox.classList.add('butterfly-center-active');
      } else {
        // Flip par: patita en primer plano y gatito cálico que camina hacia el fondo y se acuesta.
        const paw = $('.calico-paw', lightbox);
        const cat = $('.calico-cat', lightbox);
        [paw, cat].forEach((element) => {
          if (element) {
            element.style.animation = 'none';
            void element.offsetWidth;
            element.style.animation = '';
          }
        });
        lightbox.classList.add('calico-scene-active');
      }
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

  function setupMusicPlayer() {
    const audio = $('#backgroundMusic');
    const button = $('#musicToggle');
    const status = $('#musicStatus');
    if (!audio || !button) return;

    const setStatus = (message) => { if (status) status.textContent = message; };
    const updateButton = () => {
      const playing = !audio.paused;
      button.textContent = playing ? '❚❚' : '▶';
      button.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
      button.title = playing ? 'Pausar música' : 'Reproducir música';
      if (playing) setStatus('Reproduciendo');
    };

    audio.addEventListener('play', updateButton);
    audio.addEventListener('pause', () => {
      updateButton();
      if (audio.currentTime > 0) setStatus('En pausa');
    });
    audio.addEventListener('error', () => {
      setStatus('No se encontró mamichula.mp3');
      console.warn('No se pudo cargar la música. Comprueba que mamichula.mp3 esté en la raíz del repositorio y que el nombre coincida exactamente.');
    });

    const playMusic = async () => {
      try {
        await audio.play();
        updateButton();
      } catch (error) {
        // GitHub Pages works like any normal website: browsers may block autoplay with sound.
        setStatus('Pulsa ▶ para activar');
      }
    };

    button.addEventListener('click', async () => {
      if (audio.paused) {
        await playMusic();
      } else {
        audio.pause();
      }
    });

    // Attempt autoplay. If the browser blocks it, the pink player remains available.
    playMusic();
  }

  function setupButterflies() {
    const field = $('#butterflyField');
    if (!field) return;
    const positions = [
      ['8%', '18%', '48px', '0.70', '9.5s', '-1.4s'],
      ['78%', '15%', '64px', '0.86', '11s', '-4.8s'],
      ['18%', '66%', '56px', '0.78', '12.5s', '-6.2s'],
      ['84%', '69%', '46px', '0.72', '10.5s', '-2.7s'],
      ['52%', '24%', '38px', '0.62', '13.5s', '-8.1s'],
      ['62%', '78%', '70px', '0.74', '14s', '-10s'],
      ['31%', '42%', '34px', '0.55', '9s', '-5.4s']
    ];
    const svg = () => `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M48 38C38 11 14 2 8 17 2 31 18 43 43 44 22 43 14 55 23 65 32 73 45 59 49 46Z" fill="#fff0f8" stroke="#ff8bc7" stroke-width="2.5"/><path d="M52 38C62 11 86 2 92 17 98 31 82 43 57 44 78 43 86 55 77 65 68 73 55 59 51 46Z" fill="#ffd0e8" stroke="#ff8bc7" stroke-width="2.5"/><path d="M50 28C45 22 41 28 44 37L48 48 50 55 52 48 56 37C59 28 55 22 50 28Z" fill="#ff8fc9"/><circle cx="17" cy="23" r="3" fill="#ffb9dc"/><circle cx="83" cy="23" r="3" fill="#ffb9dc"/><circle cx="28" cy="57" r="2.5" fill="#ffb9dc"/><circle cx="72" cy="57" r="2.5" fill="#ffb9dc"/></svg>`;
    field.innerHTML = positions.map(([left,top,size,opacity,duration,delay], i) => {
      return `<span class="bg-butterfly butterfly-bg-${i+1}" style="--left:${left};--top:${top};--size:${size};--opacity:${opacity};--duration:${duration};animation-delay:${delay}">${svg()}</span>`;
    }).join('');
  }

  function setupMelodyCorner() {
    // Las tres Melodys permanecen visibles simultáneamente, cada una con
    // su propio GIF animado y un rebote CSS suave.
    const stages = $$('.melody-corner-stage');
    stages.forEach((stage, index) => {
      stage.classList.add('is-ready');
      stage.style.setProperty('--melody-index', index);
    });
  }


  function init() {
    // Las imágenes fuera del primer pantallazo se cargan bajo demanda.
    $$('img:not(.profile-img):not(.profile-lightbox-face img):not(.melody-gif)').forEach((img) => {
      if (!img.hasAttribute('loading')) img.loading = 'lazy';
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
    });
    setupFlipCards();
    setupProfileLightbox();
    setupNavbar();
    setupButterflies();
    setupMelodyCorner();
    setupMusicPlayer();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
