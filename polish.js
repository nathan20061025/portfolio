/* polish.js - shared UI/UX polish behaviour for every page. */
(function () {
    var d = document;

    function ready(fn) {
        if (d.readyState !== 'loading') fn();
        else d.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        // --- Ambient aurora background ---
        var aurora = d.createElement('div');
        aurora.className = 'aurora';
        aurora.setAttribute('aria-hidden', 'true');
        aurora.innerHTML = '<span></span><span></span><span></span>';
        d.body.insertBefore(aurora, d.body.firstChild);

        // --- Scroll progress + back-to-top ---
        var bar = d.createElement('div');
        bar.id = 'scroll-progress';
        d.body.appendChild(bar);

        var up = d.createElement('button');
        up.id = 'to-top';
        up.setAttribute('aria-label', 'Back to top');
        up.innerHTML = '<i class="fas fa-arrow-up"></i>';
        up.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        d.body.appendChild(up);

        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var h = d.documentElement.scrollHeight - window.innerHeight;
                var p = h > 0 ? window.pageYOffset / h : 0;
                bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
                up.classList.toggle('show', window.pageYOffset > 500);
                ticking = false;
            });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // --- Highlight the current page in the navbar ---
        var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (page.indexOf('.') === -1) page += '.html';
        if (page === 'certificates.html' || page === 'techstack.html') page = 'portfolio.html';
        d.querySelectorAll('#navbar a').forEach(function (a) {
            var target = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
            if (target === page) {
                a.classList.add('nav-active');
                a.setAttribute('aria-current', 'page');
            }
        });

        // --- Card spotlight follows the cursor ---
        var cardSel = '.project-card, .cert-card, .tech-card, .glass-card';
        var raf = null;
        d.addEventListener('mousemove', function (e) {
            var card = e.target.closest && e.target.closest(cardSel);
            if (!card || raf) return;
            raf = requestAnimationFrame(function () {
                var r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
                raf = null;
            });
        }, { passive: true });

        // --- Staggered reveal timing (keeps any inline delays already set) ---
        var groups = new Map();
        d.querySelectorAll('.reveal-element').forEach(function (el) {
            if (el.style.transitionDelay) return;
            var list = groups.get(el.parentNode) || [];
            list.push(el);
            groups.set(el.parentNode, list);
        });
        groups.forEach(function (list) {
            list.forEach(function (el, i) { el.style.transitionDelay = Math.min(i, 8) * 70 + 'ms'; });
        });

        // --- Footer ---
        var year = new Date().getFullYear();
        var footer = d.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML =
            '<div class="inner">' +
                '<div><p class="brand">Nathan Fernando</p><p class="role">Software &amp; AI Engineer</p></div>' +
                '<div class="links">' +
                    '<a href="index.html">Home</a><a href="about.html">About</a>' +
                    '<a href="portfolio.html">Portfolio</a><a href="contact.html">Contact</a>' +
                '</div>' +
                '<div class="socials">' +
                    '<a href="https://github.com/nathan20061025" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>' +
                    '<a href="https://linkedin.com/in/nathan-fernando-se" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>' +
                    '<a href="mailto:nathanfernando045@gmail.com" aria-label="Email"><i class="fas fa-envelope"></i></a>' +
                '</div>' +
                '<p class="copy">&copy; ' + year + ' Nathan Fernando. All rights reserved.</p>' +
            '</div>';
        d.body.appendChild(footer);
    });

    // --- Reveal below-the-fold content as it scrolls into view ---
    window.addEventListener('load', function () {
        setTimeout(function () {
            var clearDelay = function (el) { setTimeout(function () { el.style.transitionDelay = ''; }, 1800); };

            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (en) {
                        if (en.isIntersecting) {
                            en.target.classList.add('start-reveal');
                            clearDelay(en.target);
                            io.unobserve(en.target);
                        }
                    });
                }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

                d.querySelectorAll('.reveal-element').forEach(function (el) {
                    if (el.getBoundingClientRect().top > window.innerHeight * 0.95) {
                        el.classList.remove('start-reveal');
                        io.observe(el);
                    }
                });
            }

            // Stagger delays would otherwise slow hover transitions down.
            setTimeout(function () {
                d.querySelectorAll('.reveal-element.start-reveal').forEach(function (el) { el.style.transitionDelay = ''; });
            }, 2500);
        }, 60);
    });
})();
