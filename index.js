// ── PARTICLES / ESTRELLAS INTERACTIVAS ──
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
        count = Math.min(320, Math.max(180, Math.floor(width * height / 6200)));
    }

    function makeParticle() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.10 + Math.random() * 0.38;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            base: 0.28 + Math.random() * 0.62,
            size: 0.55 + Math.random() * 1.75,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.45 + Math.random() * 1.4,
            life: Math.random() * 1000
        };
    }

    function seed() {
        particles.length = 0;
        for (let i = 0; i < count; i++) particles.push(makeParticle());
    }

    function pointerMove(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    }

    function pointerLeave() { mouse.active = false; }

    function interactionBurst(x, y, strength = 3.2, radius = 270) {
        for (const p of particles) {
            const dx = p.x - x;
            const dy = p.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < radius * radius) {
                const d = Math.max(12, Math.sqrt(d2));
                const force = (1 - d / radius) * strength;
                p.vx += (dx / d) * force;
                p.vy += (dy / d) * force;
            }
        }
    }

    window.addEventListener('pointermove', pointerMove, { passive: true });
    window.addEventListener('pointerout', e => {
        if (!e.relatedTarget) pointerLeave();
    }, { passive: true });
    window.addEventListener('pointerdown', e => interactionBurst(e.clientX, e.clientY, 4.2, 300), { passive: true });

    // Cualquier interacción con elementos de la página provoca una onda en las estrellas.
    document.addEventListener('pointerover', e => {
        const target = e.target.closest?.('a, button, .tag, .flip-card, .social-card, .content-card, .media-card, .embed-card, .music-widget, .profile-img, .section-title');
        if (!target || target.dataset.starReactive === '1') return;
        target.dataset.starReactive = '1';
        const rect = target.getBoundingClientRect();
        interactionBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.55, 190);
        setTimeout(() => { try { delete target.dataset.starReactive; } catch (_) {} }, 140);
    }, { passive: true });

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

            // Deriva orgánica: cada estrella cambia ligeramente de dirección.
            const driftX = Math.sin(p.life * 0.008 + p.phase) * 0.010;
            const driftY = Math.cos(p.life * 0.007 + p.phase * 1.37) * 0.010;
            p.vx += driftX * dt;
            p.vy += driftY * dt;

            // El cursor genera una repulsión suave y continua.
            if (mouse.active) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const d2 = dx * dx + dy * dy;
                const radius = 210;
                if (d2 < radius * radius) {
                    const d = Math.max(16, Math.sqrt(d2));
                    const force = Math.pow(1 - d / radius, 2) * 0.16 * dt;
                    p.vx += (dx / d) * force;
                    p.vy += (dy / d) * force;
                }
            }

            // Fricción mínima para que el movimiento nunca se quede congelado.
            p.vx *= Math.pow(0.992, dt);
            p.vy *= Math.pow(0.992, dt);

            const minSpeed = 0.055;
            const maxSpeed = 1.15;
            let speed = Math.hypot(p.vx, p.vy);
            if (speed < minSpeed) {
                const a = p.phase + p.life * 0.003;
                p.vx += Math.cos(a) * minSpeed;
                p.vy += Math.sin(a) * minSpeed;
                speed = Math.hypot(p.vx, p.vy);
            }
            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            const pad = 16;
            if (p.x < -pad) p.x = width + pad;
            if (p.x > width + pad) p.x = -pad;
            if (p.y < -pad) p.y = height + pad;
            if (p.y > height + pad) p.y = -pad;

            const twinkle = reduced ? 1 : (0.72 + Math.sin(p.life * 0.055 * p.twinkle + p.phase) * 0.28);
            const alpha = Math.max(0.10, Math.min(1, p.base * twinkle));
            const r = p.size;

            ctx.beginPath();
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.shadowColor = 'rgba(255,255,255,1)';
            ctx.shadowBlur = r > 1.35 ? 9 : 5;
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
            return;
        }
        last = performance.now();
        rafId = requestAnimationFrame(frame);
    }, { passive: true });
});

// ── NAVBAR scroll ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ── HAMBURGER ──
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

// ── EMBEDS (carga diferida) ──
// Los scripts de Instagram y TikTok son pesados (cada uno crea iframes
// completos por cada post). En vez de cargarlos siempre al abrir la página,
// los inyectamos solo cuando la sección "Contenido" entra en pantalla,
// y solo para la plataforma (pestaña) que está activa en ese momento.
const embedScripts = {
    tiktok:    { src: 'https://www.tiktok.com/embed.js',    loaded: false, loading: null },
    instagram: { src: 'https://www.instagram.com/embed.js', loaded: false, loading: null }
};

function loadEmbedScript(platform) {
    const entry = embedScripts[platform];
    if (!entry) return Promise.resolve();
    if (entry.loaded) return Promise.resolve();
    if (entry.loading) return entry.loading;

    entry.loading = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = entry.src;
        script.async = true;
        script.onload = () => { entry.loaded = true; resolve(); };
        script.onerror = () => resolve(); // si falla, no bloqueamos el resto de la página
        document.body.appendChild(script);
    });
    return entry.loading;
}

function renderEmbeds(platform) {
    if (platform === 'instagram' && window.instgrm) instgrm.Embeds.process();
    if (platform === 'tiktok' && window.tiktokEmbed) window.tiktokEmbed.lib.render(document.querySelectorAll('.tiktok-embed'));
}

// Cuando la sección "Contenido" entra en pantalla, cargamos únicamente
// el embed de la pestaña activa en ese momento (por defecto, TikTok).
const contenidoSection = document.getElementById('contenido');
if (contenidoSection) {
    const contenidoObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeTab = document.querySelector('#contenido .tab-content.active');
                if (activeTab) {
                    loadEmbedScript(activeTab.id).then(() => renderEmbeds(activeTab.id));
                }
                obs.disconnect();
            }
        });
    }, { threshold: 0.15 });
    contenidoObserver.observe(contenidoSection);
}

// ── TABS ──
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(b => {
        if (b.textContent.toLowerCase().includes(tabName)) b.classList.add('active');
    });
    loadEmbedScript(tabName).then(() => {
        setTimeout(() => renderEmbeds(tabName), 100);
    });
}

// ── FLIP CARDS ──
document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', e => {
        // Si el click fue en el botón "Ver perfil", no voltear — dejar que el link funcione
        if (e.target.closest('.profile-btn')) return;
        card.classList.toggle('flipped');
    });
});

// Blindaje extra: capturamos el click en profile-btn ANTES de que
// pueda llegar al listener de la card (fase de captura, no de burbuja),
// y detenemos su propagación de inmediato. Esto garantiza que el flip
// nunca se dispare al usar el botón "Ver perfil", sin importar el
// dispositivo o el orden de los demás listeners.
document.querySelectorAll('.profile-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        e.stopImmediatePropagation();
    }, true);
});

// ── SCROLL reveal ──
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.12 });
document.querySelectorAll('.section, .social-card, .flip-card, .anime-item').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
});
// ── REPRODUCTOR — ESTILO FABI / SOUNDCLOUD ──
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


// ── FOTO DE PERFIL: LIGHTBOX + BLACK FLASH GIF ──
(() => {
    const profile = document.querySelector('.profile-img');
    const box = document.getElementById('profileLightbox');
    const image = document.getElementById('profileLightboxImage');
    const close = document.getElementById('profileLightboxClose');
    const flash = document.getElementById('profileBlackFlash');
    const flashGif = document.getElementById('profileBlackFlashGif');
    if (!profile || !box || !image || !close || !flash || !flashGif) return;

    // GIF solicitado por el usuario. Se carga únicamente al abrir la foto.
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
            // El GIF puede venir configurado en loop; ocultamos el overlay
            // después de una reproducción visual para que nunca quede repitiéndose.
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
