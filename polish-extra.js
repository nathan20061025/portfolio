/* polish-extra.js - modern UI/UX effects (cursor glow, tilt, ripple, scramble, command palette, a11y). */
(function () {
    var d = document;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }

    ready(function () {
        var main = d.getElementById('main-content') || d.getElementById('home') || d.querySelector('main, header');

        // --- Skip to content ---
        if (main) {
            if (!main.id) main.id = 'main-content';
            main.setAttribute('tabindex', '-1');
            var skip = d.createElement('a');
            skip.className = 'skip-link'; skip.href = '#' + main.id; skip.textContent = 'Skip to content';
            d.body.insertBefore(skip, d.body.firstChild);
        }

        // --- Nav landmark + animated N logo mirroring the favicon ---
        var nav = d.getElementById('navbar');
        if (nav) {
            nav.setAttribute('aria-label', 'Main navigation');
            var firstLink = nav.querySelector('a');
            var holder = firstLink ? firstLink.parentNode : nav.querySelector('div');
            if (holder) holder.style.alignItems = 'center';
            if (holder) {
                var logo = d.createElement('a');
                logo.href = 'index.html'; logo.className = 'nav-logo'; logo.setAttribute('aria-label', 'Nathan Fernando - Home');
                logo.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="nlc"><rect width="64" height="64" rx="14"/></clipPath></defs>' +
                    '<g clip-path="url(#nlc)"><rect width="64" height="64" fill="#6D4AFF"/><path d="M0 64 L64 0 L64 64 Z" fill="#1E1B4B"/></g>' +
                    '<path class="n-stroke" pathLength="100" d="M20 47 V17 L44 47 V17" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="miter"/></svg>';
                holder.insertBefore(logo, holder.firstChild);
            }
        }

        // --- Images: lazy-load, async decode, skeleton until loaded; videos: don't preload ---
        d.querySelectorAll('img').forEach(function (img, i) {
            if (!img.hasAttribute('loading') && !img.closest('#home, header')) img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
            if (!img.hasAttribute('alt')) img.setAttribute('alt', '');
            if (img.complete) img.classList.add('loaded'); else img.addEventListener('load', function () { img.classList.add('loaded'); });
        });
        d.querySelectorAll('video').forEach(function (v) { v.setAttribute('preload', 'none'); });

        // --- ARIA labels for icon-only links/buttons ---
        d.querySelectorAll('a, button').forEach(function (el) {
            if (el.getAttribute('aria-label') || el.textContent.trim()) return;
            var ic = el.querySelector('i[class*="fa-"]');
            if (!ic) return;
            var m = /fa-(github|linkedin-in|linkedin|envelope|whatsapp|twitter|instagram|facebook|arrow-up)/.exec(ic.className);
            if (m) el.setAttribute('aria-label', m[1].replace('-in', ''));
        });

        // --- Toast helper ---
        var toast = d.createElement('div');
        toast.id = 'toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
        d.body.appendChild(toast);
        var tt;
        function showToast(msg) {
            toast.textContent = msg; toast.classList.add('show');
            clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 2200);
        }
        window.showToast = showToast;

        // --- Email: copy to clipboard with toast (Ctrl/Cmd/long-press aware: plain click still opens mail) ---
        d.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
            a.addEventListener('contextmenu', function () {
                var addr = a.getAttribute('href').replace('mailto:', '').split('?')[0];
                if (navigator.clipboard) navigator.clipboard.writeText(addr).then(function () { showToast('Email copied: ' + addr); });
            });
        });

        // --- Button ripple ---
        if (!reduce) {
            d.addEventListener('click', function (e) {
                var host = e.target.closest && e.target.closest('button, a[class*="rounded-xl"], a[class*="bg-[#4f46e5]"]');
                if (!host || host.id === 'to-top') return;
                host.classList.add('ripple-host');
                var r = host.getBoundingClientRect();
                var size = Math.max(r.width, r.height) * 2;
                var s = d.createElement('span');
                s.className = 'ripple';
                s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
                host.appendChild(s);
                setTimeout(function () { s.remove(); }, 650);
            });
        }

        // --- Cursor glow + 3D card tilt (desktop only) ---
        if (finePointer && !reduce) {
            var glow = d.createElement('div');
            glow.id = 'cursor-glow'; glow.setAttribute('aria-hidden', 'true');
            d.body.appendChild(glow);
            var gx = 0, gy = 0, gq = false;
            d.addEventListener('mousemove', function (e) {
                gx = e.clientX; gy = e.clientY;
                if (gq) return; gq = true;
                requestAnimationFrame(function () {
                    glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
                    glow.classList.add('on'); gq = false;
                });
            }, { passive: true });
            d.addEventListener('mouseleave', function () { glow.classList.remove('on'); });

            var tiltSel = '.project-card, .cert-card, .tech-card';
            d.addEventListener('mousemove', function (e) {
                var card = e.target.closest && e.target.closest(tiltSel);
                if (!card) return;
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
                card.classList.add('tilt-active');
                card.style.transform = 'perspective(900px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
            }, { passive: true });
            d.addEventListener('mouseout', function (e) {
                var card = e.target.closest && e.target.closest(tiltSel);
                if (card && !card.contains(e.relatedTarget)) { card.classList.remove('tilt-active'); card.style.transform = ''; }
            });
        }

        // --- Text scramble on the hero role line (runs once) ---
        var role = d.querySelector('#home h2, main header h1');
        if (role && !reduce && role.children.length === 0) {
            var finalText = role.textContent, chars = '01<>/{}[]#$%&*';
            var frame = 0, total = 28;
            var timer = setInterval(function () {
                frame++;
                var out = '';
                for (var i = 0; i < finalText.length; i++) {
                    var ch = finalText[i];
                    out += (ch === ' ' || i < (frame / total) * finalText.length) ? ch : chars[Math.floor(Math.random() * chars.length)];
                }
                role.textContent = out;
                if (frame >= total) { clearInterval(timer); role.textContent = finalText; }
            }, 40);
            role.setAttribute('aria-label', finalText);
        }

        // --- Command palette (Ctrl/Cmd + K) ---
        var items = [
            ['Home', 'index.html', 'Page'], ['About', 'about.html', 'Page'], ['Portfolio', 'portfolio.html', 'Page'],
            ['Tech Stack', 'techstack.html', 'Page'], ['Certificates', 'certificates.html', 'Page'], ['Contact', 'contact.html', 'Page'],
            ['Download CV', 'Nathan_Fernando_CV_AI_Automation_Engineer.pdf', 'File'],
            ['GitHub', 'https://github.com/nathan20061025', 'External'],
            ['LinkedIn', 'https://linkedin.com/in/nathan-fernando-se', 'External']
        ];
        var pal = d.createElement('div');
        pal.id = 'cmdk'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Command palette');
        pal.innerHTML = '<div class="box"><input type="text" placeholder="Jump to... (type to filter)" aria-label="Search pages"><ul role="listbox"></ul></div>';
        d.body.appendChild(pal);
        var input = pal.querySelector('input'), list = pal.querySelector('ul'), sel = 0, shown = items;

        function render() {
            var q = input.value.toLowerCase();
            shown = items.filter(function (it) { return it[0].toLowerCase().indexOf(q) !== -1; });
            sel = Math.min(sel, Math.max(shown.length - 1, 0));
            list.innerHTML = '';
            shown.forEach(function (it, i) {
                var li = d.createElement('li');
                li.setAttribute('role', 'option');
                if (i === sel) li.className = 'sel';
                li.innerHTML = '<span>' + it[0] + '</span><small>' + it[2] + '</small>';
                li.addEventListener('click', function () { go(it); });
                list.appendChild(li);
            });
        }
        function go(it) {
            close();
            if (/^https?:/.test(it[1])) window.open(it[1], '_blank', 'noopener'); else window.location.href = it[1];
        }
        function open() { pal.classList.add('open'); input.value = ''; sel = 0; render(); input.focus(); }
        function close() { pal.classList.remove('open'); }
        pal.addEventListener('click', function (e) { if (e.target === pal) close(); });
        input.addEventListener('input', function () { sel = 0; render(); });
        d.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('open') ? close() : open(); return; }
            if (!pal.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); render(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
            else if (e.key === 'Enter' && shown[sel]) go(shown[sel]);
        });
        var hint = d.createElement('button');
        hint.id = 'cmdk-hint'; hint.type = 'button'; hint.textContent = 'Ctrl K - quick jump';
        hint.addEventListener('click', open);
        d.body.appendChild(hint);
    });
})();
