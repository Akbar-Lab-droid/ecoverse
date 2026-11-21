(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= 3D EARTH (Three.js) ================= */
  var canvas = document.getElementById("earth");
  var fallback = document.getElementById("globeFallback");
  function showFallback(){ canvas.style.display = "none"; fallback.style.display = "block"; }
  try {
    if (typeof THREE === "undefined") throw new Error("Three.js not loaded");
    var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true, antialias: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5.4);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    var sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    var rim = new THREE.DirectionalLight(0x38bdf8, 0.5);
    rim.position.set(-5, -2, -3);
    scene.add(rim);

    /* --- procedural Earth texture --- */
    function earthTexture(){
      var c = document.createElement("canvas"); c.width = 1024; c.height = 512;
      var x = c.getContext("2d");
      var g = x.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "#0d4d8f"); g.addColorStop(0.5, "#0b5fa5"); g.addColorStop(1, "#0d4d8f");
      x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
      // subtle ocean noise
      for (var i = 0; i < 900; i++){
        x.fillStyle = "rgba(255,255,255," + (Math.random() * 0.03) + ")";
        x.fillRect(Math.random() * 1024, Math.random() * 512, 2, 2);
      }
      // continents: clusters of blobby ellipses
      var greens = ["#2fae5f", "#57c465", "#1e8a4c", "#7ac74f"];
      var clusters = [
        [150, 130, 90], [330, 110, 70], [520, 150, 100], [700, 120, 80], [860, 140, 70],
        [220, 300, 80], [430, 320, 90], [620, 300, 70], [800, 330, 80],
        [120, 210, 55], [950, 250, 55], [380, 200, 60], [580, 230, 60]
      ];
      clusters.forEach(function(cl){
        var cx = cl[0], cy = cl[1], r = cl[2];
        for (var j = 0; j < 12; j++){
          var a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.7;
          var ex = cx + Math.cos(a) * d, ey = cy + Math.sin(a) * d * 0.6;
          var er = r * (0.25 + Math.random() * 0.45);
          x.fillStyle = greens[Math.floor(Math.random() * greens.length)];
          x.globalAlpha = 0.9;
          x.beginPath(); x.ellipse(ex, ey, er, er * 0.62, Math.random() * Math.PI, 0, Math.PI * 2); x.fill();
        }
      });
      x.globalAlpha = 1;
      // polar caps
      x.fillStyle = "rgba(240,248,255,.92)";
      x.beginPath(); x.ellipse(512, -6, 560, 34, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(512, 518, 560, 30, 0, 0, Math.PI * 2); x.fill();
      var t = new THREE.CanvasTexture(c);
      t.anisotropy = 4;
      return t;
    }
    function cloudTexture(){
      var c = document.createElement("canvas"); c.width = 1024; c.height = 512;
      var x = c.getContext("2d");
      for (var i = 0; i < 70; i++){
        var px = Math.random() * 1024, py = 60 + Math.random() * 392, pr = 18 + Math.random() * 42;
        var g = x.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, "rgba(255,255,255,.55)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = g;
        x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
      }
      return new THREE.CanvasTexture(c);
    }

    var earthGroup = new THREE.Group();
    scene.add(earthGroup);

    var earth = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 64, 64),
      new THREE.MeshPhongMaterial({map: earthTexture(), shininess: 12, specular: new THREE.Color(0x1a2a3a)})
    );
    earthGroup.add(earth);

    var clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.74, 48, 48),
      new THREE.MeshLambertMaterial({map: cloudTexture(), transparent: true, opacity: 0.6, depthWrite: false})
    );
    earthGroup.add(clouds);

    // atmosphere glow (fresnel shader)
    var atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.92, 48, 48),
      new THREE.ShaderMaterial({
        vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.25,0.85,1.0,1.0) * i; }",
        blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false
      })
    );
    earthGroup.add(atmo);

    // orbit ring + satellite
    var orbitTilt = new THREE.Group();
    orbitTilt.rotation.x = Math.PI / 2.6;
    orbitTilt.rotation.y = 0.3;
    earthGroup.add(orbitTilt);
    var ringPts = [];
    for (var ri = 0; ri <= 128; ri++){
      var ra = (ri / 128) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(ra) * 2.6, Math.sin(ra) * 2.6, 0));
    }
    orbitTilt.add(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(ringPts),
      new THREE.LineBasicMaterial({color: 0x38bdf8, transparent: true, opacity: 0.45})
    ));
    var satSpinner = new THREE.Group();
    orbitTilt.add(satSpinner);
    var satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({color: 0xa3e635})
    );
    satellite.position.set(2.6, 0, 0);
    satSpinner.add(satellite);

    // orbiting particles (pollen / fireflies)
    var pCount = 700, pos = new Float32Array(pCount * 3), col = new Float32Array(pCount * 3);
    var palette = [new THREE.Color(0xa3e635), new THREE.Color(0x22c55e), new THREE.Color(0x38bdf8), new THREE.Color(0xffffff)];
    for (var p = 0; p < pCount; p++){
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 2.5 + Math.random() * 1.9;
      pos[p*3] = r * Math.sin(ph) * Math.cos(th);
      pos[p*3+1] = r * Math.cos(ph) * 0.75;
      pos[p*3+2] = r * Math.sin(ph) * Math.sin(th);
      var cc = palette[Math.floor(Math.random() * palette.length)];
      col[p*3] = cc.r; col[p*3+1] = cc.g; col[p*3+2] = cc.b;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({size: 0.045, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending}));
    scene.add(particles);

    // floating leaves
    var leaves = [];
    var leafGeo = new THREE.PlaneGeometry(0.09, 0.14);
    for (var l = 0; l < 26; l++){
      var lm = new THREE.Mesh(leafGeo, new THREE.MeshBasicMaterial({color: [0x4ade80, 0xa3e635, 0x22c55e][l % 3], side: THREE.DoubleSide, transparent: true, opacity: 0.9}));
      var la = Math.random() * Math.PI * 2, lr = 2.6 + Math.random() * 1.2;
      lm.position.set(Math.cos(la) * lr, (Math.random() - 0.5) * 2.6, Math.sin(la) * lr);
      lm.userData = {baseY: lm.position.y, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 0.8};
      earthGroup.add(lm);
      leaves.push(lm);
    }

    /* --- layout / resize --- */
    function layout(){
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (camera.aspect < 1) { earthGroup.position.set(0, 1.5, 0); earthGroup.scale.setScalar(0.72); }
      else { earthGroup.position.set(1.25, 0, 0); earthGroup.scale.setScalar(1); }
    }
    layout();
    window.addEventListener("resize", layout);

    /* --- interaction: drag to spin + mouse parallax --- */
    var userRotY = 0, userRotX = 0, dragging = false, lastX = 0, lastY = 0, velY = 0;
    var mx = 0, my = 0;
    canvas.addEventListener("pointerdown", function(e){ dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", function(e){
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      userRotY += dx * 0.005; velY = dx * 0.005;
      userRotX = Math.max(-0.45, Math.min(0.45, userRotX + dy * 0.002));
      lastX = e.clientX; lastY = e.clientY;
    });
    function endDrag(){ dragging = false; }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    window.addEventListener("pointermove", function(e){
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    /* --- animate --- */
    var autoRot = 0, clock = new THREE.Clock();
    (function animate(){
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      if (!reduced) {
        autoRot += 0.0016;
        if (!dragging) { userRotY += velY; velY *= 0.95; userRotX *= 0.96; }
      }
      earth.rotation.y = autoRot + userRotY;
      earth.rotation.x = 0.12 + userRotX;
      clouds.rotation.y = autoRot * 1.35 + userRotY;
      particles.rotation.y = t * 0.02;
      if (!reduced) satSpinner.rotation.z += 0.004;
      leaves.forEach(function(leaf){
        var u = leaf.userData;
        leaf.position.y = u.baseY + Math.sin(t * u.speed + u.phase) * 0.14;
        leaf.rotation.x += 0.004; leaf.rotation.y += 0.006;
      });
      camera.position.x += ((mx * 0.35) - camera.position.x) * 0.04;
      camera.position.y += ((-my * 0.22) - camera.position.y) * 0.04;
      camera.lookAt(earthGroup.position.x * 0.6, 0, 0);
      renderer.render(scene, camera);
    })();
  } catch (err) {
    showFallback();
  }
})();
