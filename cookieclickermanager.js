// convert this to a bookmarklet and it'll manage your cookie clicker game for you undetected

var enabledupgrades = store.getElementsByClassName("upgrade enabled");
var shimmers = document.getElementsByClassName("shimmer");

var clicksps = 100;

function clickOn(l) {
  // unknown why, but .click() is unreliable.
  var e = new Event("click", { bubbles: true, cancelable: true });
  l.dispatchEvent(e);
}

function clickBigCookie() {
  clickOn(bigCookie);
}

function clickShimmer() {
  Array.from(shimmers).forEach(s => clickOn(s));
}

function harvestLumpIfRipe() {
  if (Date.now() - Game.lumpT > Game.lumpRipeAge) {
    clickOn(lumps);
  }
}

function purchaseCheapestUpgrade() {
  clickOn(enabledupgrades[0]);
}

function purchaseBiggestUpgrade() {
  clickOn(lastOf(enabledupgrades));
}

function purchaseOptimalShopItem() {
  var item = getShopItemsSortedByProfitability()[0];
  if (item && item.profitability > 0) {
    clickOn(item.l);
  }
}

function getShopItemsSortedByProfitability() {
  var products = Object.values(Game.Objects)
    .filter(o => !o.locked)
    .map((product) => ({
      name: product.name,
      product,
      l: product.l,
      profitability: (product.storedTotalCps/product.amount) * Game.globalCpsMult / product.price
    }));
  var upgrades = Game.UpgradesInStore
    .map((upgrade, i) => ({
      name: upgrade.name,
      upgrade,
      l: store.querySelector(`#store .upgrade[data-id='${upgrade.id}']`),
      profitability: getUpgradeValue(upgrade) / upgrade.basePrice,
    }));
  var shopitems = [...products, ...upgrades];
  shopitems.sort((a, b) => b.profitability - a.profitability);
  return shopitems;
}

function extractNum(desc) {
  var match = /((?:\d*\.)?\d+)/.exec(desc);
  if (!match) return 0;
  return parseFloat(match);
}

function extractPercent(desc) {
  var match = /((?:\d*\.)?\d+)\%/.exec(desc);
  if (!match) return 0;
  return parseFloat(match) / 100;
}

function getUpgradeValue(upgrade) {
  if (/grandmas$/i.test(upgrade.name)) {
    var [buildingclause, clausegrandmas] = /\. .+ gain .+ per (\d+) grandma/.exec(upgrade.desc.toLowerCase()) || ["", "1"];
    clausegrandmas = parseInt(clausegrandmas);
    var building = Object.values(Game.Objects)
      .find((building) => buildingclause.includes(building.plural));
    var percent = extractPercent(buildingclause);
    var buildingbonus = !building  ?  0  :  Game.cookiesPsByType[building.name] * percent * (Game.Objects.Grandma.amount / clausegrandmas);
    return Game.cookiesPsByType.Grandma + buildingbonus;
  }
  if (/ mouse$/i.test(upgrade.name)) {
    return extractPercent(upgrade.desc) * getClickCookiesPs();
  }
  if (/The mouse and cursors are /i.test(upgrade.desc)) {
    // twice as efficient
    return Game.cookiesPsByType.Cursor + getClickCookiesPs();
  }
  if (/ fingers$/i.test(upgrade.name)) {
    // plus X cookies for each non-cursor building
    var buildings = Game.BuildingsOwned - Game.Objects.Cursor.amount;
    return extractNum(upgrade.desc) * buildings * (Game.Objects.Cursor.amount + clicksps);
  }
  if (upgrade.pool === "cookie") {
    return extractPercent(upgrade.desc) * Game.cookiesPs;
  }
  if (/golden cookie/i.test(upgrade.desc)) {
    return 0.07 * Game.cookiesPs;
  }
  if (upgrade.pool === "kitten" || /^kitten /i.test(upgrade.name)) {
    return Game.cookiesPs * 0.5;
  }
  if (/^cookie production multiplier /i.test(upgrade.desc)) {
    return Game.cookiesPs * extractPercent(upgrade.desc);
  }
  if (upgrade.buildingTie) {
    return Game.cookiesPsByType[upgrade.buildingTie.name];
  }
  return 0;
}

function getClickCookiesPs() {
  return !intervals.click ? 0 : Game.computedMouseCps * clicksps;
}

function lastOf(arr) {
  return arr[arr.length - 1];
}

function cleanup() {
  Object.values(window.cookieclickerhacks.intervals).forEach(clearInterval);
  clearInterval(window.cookieclickerhacks.autoclick);
  clearInterval(window.cookieclickerhacks.autoshimmer);
  clearInterval(window.cookieclickerhacks.autoupgrade);
  clearInterval(window.cookieclickerhacks.autobuy);
}

var intervals = {
  click: setInterval(clickBigCookie, 1000 / clicksps),
  /* primes bcuz */
  buy: setInterval(purchaseOptimalShopItem, 997),
  shimmer: setInterval(clickShimmer, 1999),
  lump: setInterval(harvestLumpIfRipe, 2999),
};


if (window.cookieclickerhacks != null) {
  cleanup();
}

window.cookieclickerhacks = {
  enabledupgrades,
  shimmers,
  clicksps,
  clickOn,
  clickBigCookie,
  purchaseCheapestUpgrade,
  purchaseBiggestUpgrade,
  purchaseOptimalShopItem,
  extractNum,
  extractPercent,
  getShopItemsSortedByProfitability,
  getUpgradeValue,
  lastOf,
  intervals,
  cleanup,
};