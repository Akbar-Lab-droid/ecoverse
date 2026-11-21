(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= HEADER + BURGER ================= */
  var header = document.getElementById("siteHeader");
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");
  function onScroll(){
    header.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
  burger.addEventListener("click", function(){ navLinks.classList.toggle("open"); });
  navLinks.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ navLinks.classList.remove("open"); }); });

  /* ================= REVEAL ================= */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, {threshold:.12});
  document.querySelectorAll(".reveal").forEach(function(el, i){
    el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + "ms";
    io.observe(el);
  });

  /* ================= 3D TILT ================= */
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (fine && !reduced) {
    document.querySelectorAll("[data-tilt]").forEach(function(card){
      card.addEventListener("pointermove", function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - py) * 10).toFixed(2) + "deg) rotateY(" + ((px - 0.5) * 10).toFixed(2) + "deg) translateZ(8px)";
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
      });
      card.addEventListener("pointerleave", function(){ card.style.transform = ""; });
    });
  }

  /* ================= COUNT-UP STATS ================= */
  function countUp(el){
    var target = parseFloat(el.getAttribute("data-count"));
    if (reduced) { el.textContent = target; return; }
    var dur = 1400, t0 = performance.now();
    (function tick(now){
      var p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  var statIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.querySelectorAll("[data-count]").forEach(countUp); statIO.disconnect(); }
    });
  }, {threshold:.3});
  var impact = document.getElementById("impact");
  if (impact) statIO.observe(impact);
})();
