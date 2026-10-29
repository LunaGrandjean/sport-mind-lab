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

  function initializeTestShell() {
    var prenom = readSessionValue("prenom", "Sportif");
    var nom = readSessionValue("nom", "Session");
    var age = readSessionValue("age", "");

    hydrateHiddenField("prenom", prenom);
    hydrateHiddenField("nom", nom);
    hydrateHiddenField("age", age || "0");

    // Les jeux utilisent toute la fenêtre : aucun bandeau ne doit les recouvrir.
    document.body.classList.add("sl-harmonized");
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
    document.addEventListener("DOMContentLoaded", initializeTestShell);
  } else {
    initializeTestShell();
  }
})();
