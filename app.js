const form = document.querySelector("#island-form");
const typeInput = document.querySelector("#island-type");
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

function duration(hours, minutes, seconds) {
  return (hours * 60 + minutes) * 60 + seconds;
}
function readDuration() {
  return duration(number("#hours"), number("#minutes"), number("#seconds"));
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
function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
function showError(text) {
  message.textContent = text;
  message.hidden = false;
}
function hideError() {
  message.hidden = true;
}
function distanceBetween(playerX, playerY, islandX, islandY) {
  return Math.hypot(islandX - playerX, islandY - playerY);
}
function bearingBetween(playerX, playerY, islandX, islandY) {
  const angle =
    Math.atan2(islandX - playerX, playerY - islandY) * (180 / Math.PI);
  return (angle + 360) % 360;
}
function countdown(target, now) {
  const difference = new Date(target).getTime() - now.getTime();
  return difference <= 0 ? "NOW" : formatClock(difference / 1000);
}
function clockState(island, now) {
  if (now < island.disappearsAt)
    return {
      value: countdown(island.disappearsAt, now),
      label: "until disappearance",
    };
  if (now < island.respawnsAt)
    return { value: countdown(island.respawnsAt, now), label: "until respawn" };
  return { value: "READY", label: "respawn window reached" };
}
function collectForm() {
  return {
    name: $("#island-name").value,
    type: typeInput.value,
    occupiedAt: new Date(),
    activeDuration: readDuration(),
    playerX: number("#player-x"),
    playerY: number("#player-y"),
    islandX: number("#island-x"),
    islandY: number("#island-y"),
  };
}
function validate(data) {
  const limit = limits[data.type];
  if (!data.name.trim()) return "Island name is required.";
  if (data.activeDuration <= 0)
    return "Active duration must be greater than zero.";
  if (data.activeDuration > limit.hours * 3600)
    return `${limit.label} cannot stay occupied longer than ${limit.hours} hours.`;
  if (
    [data.playerX, data.playerY, data.islandX, data.islandY].some(Number.isNaN)
  )
    return "Player and island coordinates are required.";
  return "";
}
function makeIsland(data) {
  const occupiedAt = new Date(data.occupiedAt);
  const disappearsAt = new Date(
    occupiedAt.getTime() + data.activeDuration * 1000,
  );
  const respawnsAt = new Date(
    disappearsAt.getTime() + limits[data.type].respawnDays * 86400000,
  );
  return {
    ...data,
    id: crypto.randomUUID(),
    disappearsAt,
    respawnsAt,
    distance: distanceBetween(
      data.playerX,
      data.playerY,
      data.islandX,
      data.islandY,
    ),
    bearing: bearingBetween(
      data.playerX,
      data.playerY,
      data.islandX,
      data.islandY,
    ),
  };
}
function render() {
  const now = new Date();
  count.textContent = islands.length;
  clearAll.hidden = islands.length === 0;
  emptyState.hidden = islands.length > 0;
  list.innerHTML = islands
    .map((island) => {
      const limit = limits[island.type];
      const clock = clockState(island, now);
      return `<article class="island-card ${island.type}" data-id="${island.id}"><div class="card-top"><div><h3 class="card-name">${escapeHtml(island.name)}</h3><div class="badge"><i class="dot ${island.type === "small" ? "small-dot" : "large-dot"}"></i>${limit.label.toUpperCase()} · OCCUPIED ${formatDate(island.occupiedAt)}</div></div><div class="card-actions"><button data-action="remove" type="button">remove</button></div></div><div class="island-clock"><span>TIME REMAINING</span><strong>${clock.value}</strong><small>${clock.label}</small></div><div class="timeline"><div class="timeline-item"><label>DISAPPEARS</label><strong>${formatDate(island.disappearsAt)}</strong></div><div class="timeline-item highlight"><label>NEXT RESPAWN</label><strong>${formatDate(island.respawnsAt)}</strong></div><div class="timeline-item"><label>RESPAWN COORDINATES</label><strong>${formatCoordinate(island.islandX)} / ${formatCoordinate(island.islandY)}</strong></div></div><div class="direction-strip"><div class="direction-arrow" style="--bearing: ${island.bearing}deg"><span>↑</span><small>${Math.round(island.bearing)}°</small></div><div><b>FROM PLAYER TO ISLAND</b><span>${formatCoordinate(island.playerX)}:${formatCoordinate(island.playerY)} → ${formatCoordinate(island.islandX)}:${formatCoordinate(island.islandY)}</span></div><strong>~${formatCoordinate(island.distance)} <small>coordinates</small></strong></div></article>`;
    })
    .join("");
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
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = collectForm();
  const error = validate(data);
  if (error) return showError(error);
  hideError();
  islands.unshift(makeIsland(data));
  render();
  form.reset();
  refreshTypeLimit();
});
typeInput.addEventListener("change", refreshTypeLimit);
list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const card = button.closest(".island-card");
  if (button.dataset.action === "remove")
    islands = islands.filter((island) => island.id !== card.dataset.id);
  render();
});
clearAll.addEventListener("click", () => {
  islands = [];
  render();
});
refreshTypeLimit();
render();
setInterval(render, 1000);
