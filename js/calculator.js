(function(){
  "use strict";

  /* ================= CARBON CALCULATOR ================= */
  var car = document.getElementById("carRange"), fly = document.getElementById("flyRange"),
      power = document.getElementById("powerRange"),
      carOut = document.getElementById("carOut"), flyOut = document.getElementById("flyOut"),
      powerOut = document.getElementById("powerOut"),
      co2Total = document.getElementById("co2Total"), co2Compare = document.getElementById("co2Compare"),
      verdict = document.getElementById("verdict"), treesBar = document.getElementById("treesBar"),
      treesCount = document.getElementById("treesCount"), dietPills = document.getElementById("dietPills"),
      compareYou = document.getElementById("compareYou"), compareYouBar = document.getElementById("compareYouBar");
  var diet = 1.7;
  function fill(input){
    var p = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--fill", p + "%");
  }
  function calc(){
    var carT = (car.value * 52 * 0.12) / 1000;
    var flyT = fly.value * 0.25;
    var powT = (power.value * 12 * 0.4) / 1000;
    var total = carT + flyT + powT + diet;
    co2Total.textContent = total.toFixed(1);
    compareYou.textContent = total.toFixed(1) + " t";
    compareYouBar.style.width = Math.min(total / 10 * 100, 100) + "%";
    var trees = Math.round(total * 1000 / 21);
    treesCount.textContent = trees.toLocaleString("en-US");
    treesBar.style.width = Math.min(trees / 500 * 100, 100) + "%";
    if (total < 3) { verdict.textContent = "Below average — great job!"; verdict.style.color = "var(--lime)"; }
    else if (total <= 6) { verdict.textContent = "Around the global average"; verdict.style.color = "var(--lime)"; }
    else { verdict.textContent = "Above average — room to improve"; verdict.style.color = "#fbbf24"; }
    var diff = total - 4.7;
    co2Compare.textContent = diff <= -0.1
      ? Math.abs(diff).toFixed(1) + " t below the global average of 4.7 t."
      : diff >= 0.1
      ? diff.toFixed(1) + " t above the global average of 4.7 t."
      : "Right around the global average of 4.7 t.";
    carOut.textContent = car.value + " km / week";
    flyOut.textContent = fly.value + (fly.value == 1 ? " / year" : " / year");
    powerOut.textContent = power.value + " kWh / month";
    [car, fly, power].forEach(fill);
  }
  [car, fly, power].forEach(function(inp){ inp.addEventListener("input", calc); });
  dietPills.querySelectorAll("button").forEach(function(btn){
    btn.addEventListener("click", function(){
      dietPills.querySelectorAll("button").forEach(function(b){ b.classList.remove("active"); });
      btn.classList.add("active");
      diet = parseFloat(btn.getAttribute("data-diet"));
      calc();
    });
  });
  calc();
})();
