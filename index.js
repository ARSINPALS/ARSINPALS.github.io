document.addEventListener("DOMContentLoaded", function () {
    const layer = document.getElementById('particles');
    if (!layer) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'interactive-stars-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '';
    layer.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mouse = { x: -9999, y: -9999, active: false };
    const particles = [];
    let width = 0, height = 0, last = performance.now();
    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let count = 0;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * DPR);
        canvas.height = Math.floor(height * DPR);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        count = Math.min(220, Math.max(120, Math.floor(width * height / 9000)));
    }

    function makeParticle() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.25;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            base: 0.3 + Math.random() * 0.7,
            size: 0.5 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.4 + Math.random() * 1.2,
            life: Math.random() * 1000
        };
    }

    function seed() {
        particles.length = 0;
        for (let i = 0; i < count; i++) particles.push(makeParticle());
    }

    window.addEventListener('pointermove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }, { passive: true });

    window.addEventListener('pointerout', () => { mouse.active = false; }, { passive: true });
    window.addEventListener('resize', () => { resize(); seed(); }, { passive: true });

    resize();
    seed();

    let rafId = 0;

    function frame(now) {
        const dt = Math.min(32, now - last) / 16.67;
        last = now;
        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
            p.life += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const twinkle = reduced ? 1 : (0.7 + Math.sin(p.life * 0.04 * p.twinkle + p.phase) * 0.3);
            const alpha = Math.max(0.15, Math.min(1, p.base * twinkle));

            ctx.beginPath();
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.shadowColor = 'rgba(255,255,255,1)';
            ctx.shadowBlur = p.size > 1.2 ? 6 : 3;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
});

// NAVBAR scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// HAMBURGER
function toggleMenu() {
    const links   = document.getElementById('navLinks');
    const ham     = document.getElementById('hamburger');
    const overlay = document.getElementById('navOverlay');
    links.classList.toggle('open');
    ham.classList.toggle('active');
    overlay.classList.toggle('visible');
}
function closeMenu() {
    document.getElementById('navLinks').classList.remove('open');
    document.getElementById('hamburger').classList.remove('active');
    document.getElementById('navOverlay').classList.remove('visible');
}

// FLIP CARDS CON BINDING SEGURO Y OPTIMIZADO
document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', e => {
        if (e.target.closest('.profile-btn')) return;
        card.classList.toggle('flipped');
    });
});

document.querySelectorAll('.profile-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        e.stopImmediatePropagation();
    }, true);
});

// SOUNDCLOUD REPRODUCTOR
(() => {
    const frame = document.getElementById('sc-player');
    const widgetEl = document.getElementById('musicWidget');
    if (!frame || !widgetEl) return;

    const init = () => {
        if (!window.SC) return;
        const playBtn = document.getElementById('musicToggle');
        const playIcon = document.getElementById('musicToggleIcon');
        const muteBtn = document.getElementById('musicMute');
        const volume = document.getElementById('musicVolume');
        const volumeIcon = document.getElementById('musicVolumeIcon');
        const status = document.getElementById('musicStatus');
        const widget = SC.Widget(frame);
        let muted = false;
        let volumeValue = Number(volume?.value || 0.35) * 100;

        const updatePlayUI = playing => {
            playIcon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
            playBtn.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
            playBtn.setAttribute('aria-pressed', String(playing));
            widgetEl.classList.toggle('is-playing', playing);
            status.textContent = playing ? 'Reproduciendo ahora' : 'Pulsa ▶ para escuchar';
        };
        const updateVolumeIcon = () => {
            volumeIcon.className = muted || volumeValue === 0 ? 'fa-solid fa-volume-xmark' : volumeValue < 50 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
        };

        widget.bind(SC.Widget.Events.READY, () => {
            widget.setVolume(volumeValue);
        });
        widget.bind(SC.Widget.Events.PLAY, () => updatePlayUI(true));
        widget.bind(SC.Widget.Events.PAUSE, () => updatePlayUI(false));
        widget.bind(SC.Widget.Events.FINISH, () => updatePlayUI(false));

        playBtn.addEventListener('click', () => {
            widget.isPaused(paused => paused ? widget.play() : widget.pause());
        });

        muteBtn.addEventListener('click', () => {
            muted = !muted;
            widget.setVolume(muted ? 0 : volumeValue);
            muteBtn.setAttribute('aria-pressed', String(muted));
            muteBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar música');
            updateVolumeIcon();
        });

        volume?.addEventListener('input', () => {
            volumeValue = Number(volume.value) * 100;
            muted = false;
            widget.setVolume(volumeValue);
            muteBtn.setAttribute('aria-pressed', 'false');
            muteBtn.setAttribute('aria-label', 'Silenciar música');
            updateVolumeIcon();
        });

        updateVolumeIcon();
    };
    if (window.SC) init(); else window.addEventListener('load', init, { once: true });
})();

// LIGHTBOX FOTO DE PERFIL + BLACK FLASH
(() => {
    const profile = document.querySelector('.profile-img');
    const box = document.getElementById('profileLightbox');
    const image = document.getElementById('profileLightboxImage');
    const close = document.getElementById('profileLightboxClose');
    const flash = document.getElementById('profileBlackFlash');
    const flashGif = document.getElementById('profileBlackFlashGif');
    if (!profile || !box || !image || !close || !flash || !flashGif) return;

    const gifUrl = 'https://giffiles.alphacoders.com/219/219893.gif';
    let opened = false;
    let hideTimer = null;

    const stopFlash = () => {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        flash.classList.remove('is-active');
        flashGif.removeAttribute('src');
    };

    const playFlash = () => {
        stopFlash();
        void flash.offsetWidth;
        flashGif.onerror = () => stopFlash();
        flashGif.onload = () => {
            hideTimer = window.setTimeout(stopFlash, 2600);
        };
        flashGif.src = gifUrl;
        flash.classList.add('is-active');
    };

    const open = () => {
        opened = true;
        image.classList.remove('is-zoomed');
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
        document.body.classList.add('profile-view-open');
        playFlash();
    };

    const hide = () => {
        opened = false;
        stopFlash();
        box.classList.remove('is-open');
        image.classList.remove('is-zoomed');
        box.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('profile-view-open');
    };

    profile.addEventListener('click', open);
    image.addEventListener('click', e => {
        e.stopPropagation();
        image.classList.toggle('is-zoomed');
    });
    close.addEventListener('click', hide);
    box.addEventListener('click', e => { if (e.target === box) hide(); });
    document.addEventListener('keydown', e => { if (opened && e.key === 'Escape') hide(); });
})();
