(function () {
  function readSessionValue(key, fallback) {
    var params = new URLSearchParams(window.location.search);
    var value = params.get(key);
    return value && value.trim() ? value.trim() : fallback;
  }

  function hydrateHiddenField(id, value) {
    var field = document.getElementById(id);
    if (field) field.value = value;
  }

  function titleFromDocument() {
    var h1 = document.querySelector("h1");
    var h2 = document.querySelector("h2");
    return (h1 && h1.textContent) || (h2 && h2.textContent) || document.title || "Test";
  }

  function injectHeader() {
    if (document.querySelector(".sl-test-header")) return;

    var prenom = readSessionValue("prenom", "Sportif");
    var nom = readSessionValue("nom", "Session");
    var age = readSessionValue("age", "");

    hydrateHiddenField("prenom", prenom);
    hydrateHiddenField("nom", nom);
    hydrateHiddenField("age", age || "0");

    var header = document.createElement("header");
    header.className = "sl-test-header";
    header.innerHTML =
      '<div class="sl-test-brand">' +
      '<img src="/logo.png" alt="Sport Mind Lab">' +
      "<div>" +
      "<strong>" + titleFromDocument() + "</strong>" +
      "<span>Performance sportive</span>" +
      "</div>" +
      "</div>" +
      '<div class="sl-test-session">' +
      '<span class="sl-test-pill">' + prenom + " " + nom + "</span>" +
      (age ? '<span class="sl-test-pill">' + age + " ans</span>" : "") +
      "</div>";

    var accent = document.createElement("div");
    accent.className = "sl-test-accent";

    document.body.classList.add("sl-harmonized");
    document.body.prepend(accent);
    document.body.prepend(header);
  }

  window.SportMindLabResult = function (rawScore, label) {
    var numericScore = Number(rawScore);
    if (Number.isNaN(numericScore)) return;
    window.parent.postMessage(
      {
        type: "sport-mind-lab:test-result",
        rawScore: numericScore,
        label: label || "Résultat brut",
      },
      window.location.origin
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectHeader);
  } else {
    injectHeader();
  }
})();
