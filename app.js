const form = document.querySelector("#island-form");
const typeInput = document.querySelector("#island-type");
const modeInput = document.querySelector("#travel-mode");
const list = document.querySelector("#island-list");
const emptyState = document.querySelector("#empty-state");
const count = document.querySelector("#island-count");
const clearAll = document.querySelector("#clear-all");
const message = document.querySelector("#form-message");
let islands = [];

const limits = {
  small: { hours: 6, respawnDays: 1, label: "Small Island" },
  large: { hours: 16, respawnDays: 3, label: "Large Island" },
};
const $ = (selector) => document.querySelector(selector);
const number = (selector) => Number($(selector).value);

function setDefaultDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $("#occupied-at").value = now.toISOString().slice(0, 16);
}
function duration(hours, minutes, seconds) {
  return (hours * 60 + minutes) * 60 + seconds;
}
function readDuration(prefix = "") {
  return duration(
    number(`#${prefix}hours`),
    number(`#${prefix}minutes`),
    number(`#${prefix}seconds`),
  );
}
function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}
function formatCoordinate(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
function showError(text) {
  message.textContent = text;
  message.hidden = false;
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function hideError() {
  message.hidden = true;
}

function calculateAttackDuration(data) {
  if (data.travelMode === "manual") return data.travelDuration;
  const distance = Math.hypot(data.playerX - data.x, data.playerY - data.y);
  return (distance / data.speed) * 3600;
}
function makeIsland(data) {
  const occupiedAt = new Date(data.occupiedAt);
  const disappearsAt = new Date(
    occupiedAt.getTime() + data.activeDuration * 1000,
  );
  const respawnsAt = new Date(
    disappearsAt.getTime() + limits[data.type].respawnDays * 86400000,
  );
  const targetAt = data.attackTarget === "respawn" ? respawnsAt : disappearsAt;
  const travelDuration = calculateAttackDuration(data);
  return {
    ...data,
    id: crypto.randomUUID(),
    disappearsAt,
    respawnsAt,
    targetAt,
    travelDuration,
    respawnX: data.x + randomBetween(data.offsetXMin, data.offsetXMax),
    respawnY: data.y + randomBetween(data.offsetYMin, data.offsetYMax),
  };
}
function validate(data) {
  const limit = limits[data.type];
  if (!data.name.trim()) return "Island name is required.";
  if (Number.isNaN(new Date(data.occupiedAt).getTime()))
    return "Enter a valid occupation time.";
  if (data.activeDuration <= 0)
    return "Active duration must be greater than zero.";
  if (data.activeDuration > limit.hours * 3600)
    return `${limit.label} cannot stay occupied longer than ${limit.hours} hours.`;
  if ([data.x, data.y].some(Number.isNaN))
    return "Island X and Y coordinates are required.";
  if (data.offsetXMin > data.offsetXMax || data.offsetYMin > data.offsetYMax)
    return "Each offset minimum must be less than or equal to its maximum.";
  if (data.travelMode === "manual" && data.travelDuration <= 0)
    return "Travel duration must be greater than zero.";
  if (
    data.travelMode === "distance" &&
    (Number.isNaN(data.playerX) ||
      Number.isNaN(data.playerY) ||
      Number.isNaN(data.speed) ||
      data.speed <= 0)
  )
    return "Player coordinates and a positive speed are required.";
  return "";
}
function collectForm() {
  return {
    name: $("#island-name").value,
    type: typeInput.value,
    occupiedAt: $("#occupied-at").value,
    activeDuration: readDuration(),
    x: number("#island-x"),
    y: number("#island-y"),
    offsetXMin: number("#offset-x-min"),
    offsetXMax: number("#offset-x-max"),
    offsetYMin: number("#offset-y-min"),
    offsetYMax: number("#offset-y-max"),
    attackTarget: $("#attack-target").value,
    travelMode: modeInput.value,
    travelDuration: readDuration("travel-"),
    playerX: number("#player-x"),
    playerY: number("#player-y"),
    speed: number("#speed"),
  };
}
function render() {
  count.textContent = islands.length;
  clearAll.hidden = islands.length === 0;
  emptyState.hidden = islands.length > 0;
  list.innerHTML = islands
    .map((island) => {
      const limit = limits[island.type];
      const travelText = formatClock(island.travelDuration);
      const sendAt = new Date(
        island.targetAt.getTime() - island.travelDuration * 1000,
      );
      return `<article class="island-card ${island.type}" data-id="${island.id}"><div class="card-top"><div><h3 class="card-name">${escapeHtml(island.name)}</h3><div class="badge"><i class="dot ${island.type === "small" ? "small-dot" : "large-dot"}"></i>${limit.label.toUpperCase()} · OCCUPIED ${formatDate(island.occupiedAt)}</div></div><div class="card-actions"><button data-action="regenerate" type="button">↻ regenerate</button><button data-action="remove" type="button">remove</button></div></div><div class="timeline"><div class="timeline-item"><label>DISAPPEARS</label><strong>${formatDate(island.disappearsAt)}</strong></div><div class="timeline-item highlight"><label>NEXT RESPAWN</label><strong>${formatDate(island.respawnsAt)}</strong></div><div class="timeline-item"><label>RESPAWN COORDINATES</label><strong>${formatCoordinate(island.respawnX)} / ${formatCoordinate(island.respawnY)}</strong></div></div><div class="attack-strip"><span>ATTACK WINDOW <b>${island.attackTarget === "respawn" ? "RESPAWN" : "DISAPPEARANCE"}</b></span><span>TRAVEL <b>${travelText}</b></span><span>SEND AT <b>${formatDate(sendAt)}</b></span></div></article>`;
    })
    .join("");
}
function formatClock(totalSeconds) {
  const seconds = Math.round(totalSeconds);
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
function escapeHtml(text) {
  return text.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}
function refreshTypeLimit() {
  $("#duration-limit").textContent =
    `Maximum ${String(limits[typeInput.value].hours).padStart(2, "0")}:00:00 for ${limits[typeInput.value].label}`;
}
function toggleTravelMode() {
  const distance = modeInput.value === "distance";
  $("#distance-travel").hidden = !distance;
  $("#manual-travel").hidden = distance;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = collectForm();
  const error = validate(data);
  if (error) return showError(error);
  hideError();
  islands.unshift(makeIsland(data));
  render();
  form.reset();
  setDefaultDate();
  refreshTypeLimit();
});
typeInput.addEventListener("change", refreshTypeLimit);
modeInput.addEventListener("change", toggleTravelMode);
list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const card = button.closest(".island-card");
  const island = islands.find((item) => item.id === card.dataset.id);
  if (button.dataset.action === "remove")
    islands = islands.filter((item) => item.id !== island.id);
  if (button.dataset.action === "regenerate") {
    island.respawnX =
      island.x + randomBetween(island.offsetXMin, island.offsetXMax);
    island.respawnY =
      island.y + randomBetween(island.offsetYMin, island.offsetYMax);
  }
  render();
});
clearAll.addEventListener("click", () => {
  islands = [];
  render();
});
setDefaultDate();
refreshTypeLimit();
toggleTravelMode();
render();
