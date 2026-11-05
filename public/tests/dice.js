"use strict";

const DOTS = {
  1: [[.5,.5]],
  2: [[.3,.5],[.7,.5]],
  3: [[.3,.5],[.5,.5],[.7,.5]],
  4: [[.25,.25],[.75,.25],[.25,.75],[.75,.75]],
  5: [[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],
  6: [[.25,.3],[.75,.3],[.25,.5],[.75,.5],[.25,.7],[.75,.7]],
};
const DEFAULT_COLORS = [
  {name:"Rouge",hex:"#ef4444"}, {name:"Bleu",hex:"#3b82f6"}, {name:"Vert",hex:"#22c55e"},
  {name:"Orange",hex:"#f59e0b"}, {name:"Violet",hex:"#a855f7"}, {name:"Turquoise",hex:"#14b8a6"},
  {name:"Jaune",hex:"#eab308"}, {name:"Blanc",hex:"#ffffff"}, {name:"Noir",hex:"#000000"},
];
const scene = document.getElementById("scene");
const toolbar = document.getElementById("toolbar");
const countInput = document.getElementById("count");
const rotationInput = document.getElementById("rotation");
const statusElement = document.getElementById("diceStatus");
let rollTimers = [];
let rollToken = 0;
rotationInput.checked = new URLSearchParams(location.search).get("rotation") === "1";

DEFAULT_COLORS.forEach((color, index) => {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `color${index}`;
  checkbox.value = color.hex;
  checkbox.checked = true;
  label.append(checkbox, document.createTextNode(color.name));
  document.getElementById("colorsCheckboxes").append(label);
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function addDots(die, value, color, size) {
  const dotSize = size * .15;
  DOTS[value].forEach(([x,y]) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    Object.assign(dot.style, {
      width:`${dotSize}px`, height:`${dotSize}px`,
      left:`${x * size - dotSize / 2}px`, top:`${y * size - dotSize / 2}px`,
      background:color === "#000000" ? "#fff" : "#000",
    });
    die.append(dot);
  });
}

function rollDice() {
  if (!countInput.reportValidity()) return;
  const count = countInput.valueAsNumber;
  const colors = [...document.querySelectorAll("#colorsCheckboxes input:checked")].map(input => input.value);
  if (!colors.length) {
    statusElement.textContent = "Choisissez au moins une couleur avant de lancer.";
    return;
  }
  rollToken += 1;
  const token = rollToken;
  rollTimers.forEach(clearTimeout);
  rollTimers = [];
  scene.replaceChildren();
  toolbar.classList.add("small");

  const width = scene.clientWidth, height = scene.clientHeight;
  let size = Math.min(120, width - 16, height - 16);
  while (size > 40 && Math.floor(width / (size + 16)) * Math.floor(height / (size + 16)) < count) size -= 4;
  size = Math.max(24, size);
  const cell = size + 16;
  const cols = Math.floor(width / cell), rows = Math.floor(height / cell);
  const positions = [];
  const offsetX = (width - cols * cell) / 2, offsetY = (height - rows * cell) / 2;
  for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
    positions.push({x:offsetX + col * cell + 8, y:offsetY + row * cell + 8});
  }
  shuffle(positions);
  const rotating = rotationInput.checked;
  const displayed = Math.min(count, positions.length);
  for (let index = 0; index < displayed; index += 1) {
    const die = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const value = Math.floor(Math.random() * 6) + 1;
    die.className = "die";
    die.dataset.value = String(value);
    die.setAttribute("aria-label", `Dé ${index + 1}`);
    Object.assign(die.style, {
      width:`${size}px`,height:`${size}px`,background:color,
      left:`${positions[index].x}px`,top:`${positions[index].y}px`,
      animation:rotating ? "roll .8s ease forwards" : "fall .9s cubic-bezier(.2,.8,.3,1) forwards",
    });
    scene.append(die);
    if (rotating) {
      rollTimers.push(setTimeout(() => {
        if (token !== rollToken || !die.isConnected) return;
        addDots(die, value, color, size);
        die.style.animation = "bounce .5s ease";
      }, 800));
    } else addDots(die, value, color, size);
  }
  const mode = rotating ? "avec rotation" : "sans rotation";
  statusElement.textContent = displayed === count
    ? `${displayed} dé${displayed > 1 ? "s" : ""} · ${mode}`
    : `${displayed} dés affichés sur ${count} · ${mode}. Agrandissez la fenêtre pour afficher tous les dés.`;
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    if (scene.children.length) rollDice();
  } catch {
    statusElement.textContent = "Le plein écran n’est pas disponible. Vous pouvez lancer les dés dans cette fenêtre.";
  }
}

document.getElementById("rollButton").addEventListener("click", rollDice);
document.getElementById("fullscreenButton").addEventListener("click", toggleFullscreen);
rotationInput.addEventListener("change", () => {
  statusElement.textContent = `Mode ${rotationInput.checked ? "avec" : "sans"} rotation sélectionné. Cliquez sur Lancer.`;
});
let resizeFrame;
new ResizeObserver(() => {
  cancelAnimationFrame(resizeFrame);
  if (scene.children.length) resizeFrame = requestAnimationFrame(rollDice);
}).observe(scene);
