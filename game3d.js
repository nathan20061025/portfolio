/* game3d.js - game-style layer: HUD, achievements and a lightweight WebGL space scene.
   Everything here is optional: if WebGL/Three.js is unavailable or the device is weak,
   the page simply keeps working without it. */
(function () {
    var d = document, w = window;
    var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var conn = navigator.connection || {};
    var weak = conn.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) || (navigator.deviceMemory && navigator.deviceMemory < 4);

    function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }

    // ---------------------------------------------------------------- HUD
    function buildHud() {
        if (!finePointer || w.innerWidth < 1100) return;
        var hud = d.createElement('aside');
        hud.id = 'hud';
        hud.setAttribute('aria-label', 'Player card');
        hud.innerHTML =
            '<div class="hud-top"><span class="hud-dot"></span><span class="hud-tag">PLAYER 1</span></div>' +
            '<div class="hud-name">Nathan Fernando</div>' +
            '<div class="hud-row"><span>CLASS</span><b>Junior Software Engineer</b></div>' +
            '<div class="hud-row"><span>BASE</span><b>Colombo, Sri Lanka</b></div>' +
            '<div class="hud-row"><span>STATUS</span><b class="ok">Open to work</b></div>' +
            '<div class="hud-xp"><span>QUEST PROGRESS</span><i><u id="hud-fill"></u></i></div>';
        d.body.appendChild(hud);
        var fill = d.getElementById('hud-fill'), q = false;
        function upd() {
            var h = d.documentElement.scrollHeight - w.innerHeight;
            fill.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, w.pageYOffset / h) : 0) + ')';
            hud.classList.toggle('compact', w.pageYOffset > 240);
            q = false;
        }
        w.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(upd); } }, { passive: true });
        upd();
    }

    // -------------------------------------------------------- Achievements
    function buildAchievements() {
        if (!/certificates\.html/i.test(location.pathname) || !('IntersectionObserver' in w)) return;
        var host = d.createElement('div');
        host.id = 'achievements'; host.setAttribute('aria-live', 'polite');
        d.body.appendChild(host);
        var queue = [], busy = false;
        function next() {
            if (busy || !queue.length) return;
            busy = true;
            var el = d.createElement('div');
            el.className = 'ach';
            el.innerHTML = '<i class="fas fa-trophy"></i><div><small>ACHIEVEMENT UNLOCKED</small><b></b></div>';
            el.querySelector('b').textContent = queue.shift();
            host.appendChild(el);
            requestAnimationFrame(function () { el.classList.add('show'); });
            setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); busy = false; next(); }, 400); }, 2200);
        }
        var seen = {};
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (!e.isIntersecting) return;
                var t = (e.target.querySelector('h4') || {}).textContent;
                if (t && !seen[t]) { seen[t] = 1; queue.push(t.trim()); next(); }
                io.unobserve(e.target);
            });
        }, { threshold: 0.6 });
        setTimeout(function () { d.querySelectorAll('.cert-card').forEach(function (c) { io.observe(c); }); }, 3200);
    }

    // ------------------------------------------------------------- 3D scene
    function loadThree(cb) {
        var s = d.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        s.async = true; s.onload = cb; s.onerror = function () {};
        d.head.appendChild(s);
    }

    function initScene() {
        var THREE = w.THREE;
        if (!THREE) return;
        var canvas = d.createElement('canvas');
        canvas.id = 'scene3d'; canvas.setAttribute('aria-hidden', 'true');
        var renderer;
        try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'low-power' }); }
        catch (e) { return; }
        renderer.setPixelRatio(Math.min(w.devicePixelRatio || 1, 1));
        renderer.setSize(w.innerWidth, w.innerHeight);
        d.body.insertBefore(canvas, d.body.firstChild);
        d.body.classList.add('has-scene3d');

        // the old 2D particle canvas is no longer needed: stop it so we do not pay for both
        try { if (w.pJSDom && w.pJSDom[0]) { w.pJSDom[0].pJS.fn.vendors.destroypJS(); w.pJSDom = []; } } catch (e) {}

        var scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x08080a, 0.055);
        var camera = new THREE.PerspectiveCamera(60, w.innerWidth / w.innerHeight, 0.1, 80);
        camera.position.set(0, 0, 7);

        // star field
        var N = 420, pos = new Float32Array(N * 3);
        for (var i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 36; pos[i * 3 + 1] = (Math.random() - 0.5) * 60; pos[i * 3 + 2] = -Math.random() * 30 + 6; }
        var sg = new THREE.BufferGeometry();
        sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        var stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.05, transparent: true, opacity: 0.85, depthWrite: false }));
        scene.add(stars);

        // floating low-poly "collectibles" placed toward the edges so text stays readable
        var defs = [
            [new THREE.IcosahedronGeometry(1.1, 0), 0x6d4aff, -8.2, 1.5, -3],
            [new THREE.OctahedronGeometry(0.9, 0), 0x38bdf8, 5.4, -1.2, -3],
            [new THREE.TorusGeometry(0.9, 0.22, 10, 28), 0xa78bfa, 5.8, 3.2, -6],
            [new THREE.TetrahedronGeometry(1.0, 0), 0x6d4aff, -9.5, -3.5, -5],
            [new THREE.DodecahedronGeometry(0.9, 0), 0x38bdf8, -8.4, -8, -4],
            [new THREE.IcosahedronGeometry(0.8, 0), 0xa78bfa, 5.0, -9.5, -3],
            [new THREE.OctahedronGeometry(1.1, 0), 0x6d4aff, -9.2, -14, -4],
            [new THREE.TorusGeometry(0.8, 0.2, 10, 28), 0x38bdf8, 5.6, -15, -5]
        ];
        var shapes = defs.map(function (a) {
            var m = new THREE.Mesh(a[0], new THREE.MeshBasicMaterial({ color: a[1], wireframe: true, transparent: true, opacity: a[2] < 0 ? 0.28 : 0.5 }));
            m.position.set(a[2], a[3], a[4]);
            m.userData = { r: 0.15 + Math.random() * 0.25, f: Math.random() * 6, y0: a[3] };
            scene.add(m);
            return m;
        });

        var mx = 0, my = 0, tx = 0, ty = 0, scrollP = 0, targetScroll = 0;
        d.addEventListener('mousemove', function (e) { tx = e.clientX / w.innerWidth - 0.5; ty = e.clientY / w.innerHeight - 0.5; }, { passive: true });
        w.addEventListener('scroll', function () {
            var h = d.documentElement.scrollHeight - w.innerHeight;
            targetScroll = h > 0 ? w.pageYOffset / h : 0;
        }, { passive: true });
        w.addEventListener('resize', function () {
            camera.aspect = w.innerWidth / w.innerHeight; camera.updateProjectionMatrix();
            renderer.setSize(w.innerWidth, w.innerHeight);
        });

        var clock = new THREE.Clock(), running = true, last = 0;
        d.addEventListener('visibilitychange', function () { running = !d.hidden; if (running) loop(); });
        function loop(now) {
            if (!running) return;
            requestAnimationFrame(loop);
            if (now - last < 33) return;           // cap at about 30 fps: smooth enough, light on the CPU/GPU
            last = now;
            var t = clock.getElapsedTime();
            mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
            scrollP += (targetScroll - scrollP) * 0.06;
            // "fly through" the level as you scroll
            camera.position.y = -scrollP * 14;
            camera.position.x = mx * 1.2;
            camera.position.z = 7 - scrollP * 2;
            camera.rotation.y = -mx * 0.12;
            camera.rotation.x = -my * 0.08;
            stars.rotation.y = t * 0.01;
            shapes.forEach(function (m) {
                m.rotation.x += m.userData.r * 0.01; m.rotation.y += m.userData.r * 0.013;
                m.position.y = m.userData.y0 + Math.sin(t * 0.6 + m.userData.f) * 0.25;
            });
            renderer.render(scene, camera);
        }
        requestAnimationFrame(loop);
    }

    ready(function () {
        buildHud();
        buildAchievements();
        // 3D scene: desktop only, capable devices only, never on the (already heavy) contact page
        var ok = finePointer && !reduce && !weak && w.innerWidth >= 900 && !d.querySelector('.stage-container');
        if (!ok) return;
        w.addEventListener('load', function () {
            var go = function () { loadThree(initScene); };
            if ('requestIdleCallback' in w) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 1200);
        });
    });
})();
