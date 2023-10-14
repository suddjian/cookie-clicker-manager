// a nice middle manager to grow your cookie empire 

var clicksps = 100;

/*:･ﾟ✧*:･ﾟ✧ -----  UI ACTIONS  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function clickOn(l) {
  // unknown why, but .click() is unreliable.
  var e = new Event("click", { bubbles: true, cancelable: true });
  l.dispatchEvent(e);
}

function clickBigCookie() {
  clickOn(bigCookie);
}

function clickShimmer() {
  Array.from(document.getElementsByClassName("shimmer")).forEach(s => clickOn(s));
}

function harvestLumpIfRipe() {
  if (Date.now() - Game.lumpT > Game.lumpRipeAge) {
    clickOn(lumps);
  }
}

function shopOptimally() {
  var item = getShopItemsSortedByProfitability()[0];
  if (item && item.profitability > 0 && item.l.matches(".product:not(.disabled), .upgrade.enabled")) {
    clickOn(item.l);
    console.log(`Cookie manager: Purchased ${item.name}`);
    return item
  }
  return null
}

/*:･ﾟ✧*:･ﾟ✧ -----  SHOPPING  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function getShopItemsSortedByProfitability() {
  var products = Object.values(Game.Objects)
    .filter(o => !o.locked)
    .map((product) => ({
      name: product.name,
      product,
      l: product.l,
      profitability: getProductCps(product) / product.price
    }));
  var upgrades = Game.UpgradesInStore
    .map((upgrade, i) => ({
      name: upgrade.name,
      upgrade,
      l: store.querySelector(`#store .upgrade[data-id='${upgrade.id}']`),
      profitability: getUpgradeCps(upgrade) / upgrade.basePrice,
    }));
  var shopitems = [...products, ...upgrades];
  for (let item in shopitems) {
    if (isNaN(item)) {
      console.warn(`Cookie manager: Be advised, bad profitability calculation for ${item.name}`)
    }
  }
  shopitems.sort((a, b) => b.profitability - a.profitability);
  return shopitems;
}

/*:･ﾟ✧*:･ﾟ✧ -----  CPS CALCULATIONS  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function getProductCps(product) {
  return product.amount ? product.storedTotalCps / product.amount : product.storedCps * Game.globalCpsMult
}

function getClickCps() {
  return !intervals.click ? 0 : Game.computedMouseCps * clicksps;
}

function getUpgradeCps(upgrade) {
  if (/grandmas$/i.test(upgrade.name)) {
    var [buildingclause, clausegrandmas] = /\. .+ gain .+ per (\d+) grandma/.exec(upgrade.desc.toLowerCase()) || ["", "1"];
    clausegrandmas = parseInt(clausegrandmas);
    var building = Object.values(Game.Objects)
      .find((b) => buildingclause.includes(b.plural));
    var buildingbonus = !building  ?  0  :  getProductCps(building) * extractPercent(buildingclause) * (Game.Objects.Grandma.amount / clausegrandmas);
    return getProductCps(Game.Objects.Grandma) + buildingbonus;
  }
  if (/ mouse$/i.test(upgrade.name)) {
    return extractPercent(upgrade.desc) * getClickCps();
  }
  if (/The mouse and cursors are /i.test(upgrade.desc)) {
    // twice as efficient
    return getProductCps(Game.Objects.Cursor) + getClickCps();
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
    return upgrade.buildingTie.storedTotalCps * Game.globalCpsMult;
  }
  return 0;
}

/*:･ﾟ✧*:･ﾟ✧ -----  CONVENIENCE FUNCTIONS  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

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

function lastOf(arr) {
  return arr[arr.length - 1];
}

/*:･ﾟ✧*:･ﾟ✧ -----  SCRIPT LIFECYCLE  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function cleanup() {
  Object.values(window.cookieclickerhacks.intervals).forEach(clearInterval);
}

var intervals = {
  click: setInterval(clickBigCookie, 1000 / clicksps),
  /* primes bcuz */
  buy: setInterval(shopOptimally, 997),
  shimmer: setInterval(clickShimmer, 1999),
  lump: setInterval(harvestLumpIfRipe, 2999),
};

if (window.cookieclickerhacks != null) {
  cleanup();
  console.log("cookie clicker manager restarted");
} else {
  console.log("cookie clicker manager started");
}

window.cookieclickerhacks = {
  clicksps,
  clickOn,
  clickBigCookie,
  shopOptimally,
  extractNum,
  extractPercent,
  getShopItemsSortedByProfitability,
  getClickCps,
  getProductCps,
  getUpgradeCps,
  lastOf,
  intervals,
  cleanup,
};