// a nice middle manager to grow your cookie empire

const Game = window.Game;
const StockMarket = Game.Objects.Bank.minigame;
const bigCookie = document.getElementById("bigCookie");
const lumps = document.getElementById("lumps");
const store = document.getElementById("store");
const bankContent = document.getElementById("bankContent");

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
    return item;
  }
  return null;
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
    .map((upgrade) => ({
      name: upgrade.name,
      upgrade,
      l: store.querySelector(`#store .upgrade[data-id='${upgrade.id}']`),
      profitability: getUpgradeCps(upgrade) / upgrade.basePrice,
    }));
  var shopitems = [...products, ...upgrades];
  for (let item in shopitems) {
    if (isNaN(item)) {
      console.warn(`Cookie manager: Be advised, bad profitability calculation for ${item.name}`);
    }
  }
  shopitems.sort((a, b) => b.profitability - a.profitability);
  return shopitems;
}

/*:･ﾟ✧*:･ﾟ✧ -----  CPS CALCULATIONS  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function getProductCps(product) {
  return product.amount ? product.storedTotalCps / product.amount : product.storedCps * Game.globalCpsMult;
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

/*:･ﾟ✧*:･ﾟ✧ -----  STOCK MARKET  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function adjustStockPortfolio() {
  if (!bankContent.checkVisibility()) {
    return;
  }
  var analysis = analyzeStockMarket();
  var { toBuy, toSell } = analysis;
  toBuy.forEach(good => {
    console.log(`Cookie manager: buying ${good.symbol}`);
    clickOn(document.getElementById(good.l.id + "_Max"));
  });
  toSell.forEach(good => {
    console.log(`Cookie manager: selling ${good.symbol}`);
    clickOn(document.getElementById(good.l.id + "_-All"));
  });
}

function analyzeStockMarket(percentile=0.1) {
  // buy low sell high
  var goods = Object.values(StockMarket.goods).filter(good => !good.hidden);
  if (goods.length < 3) {
    return null;
  }
  goods.sort((a, b) => a.val - b.val);
  var allVals = goods.reduce(
    (acc, good) => acc.concat(good.vals),
    []
  );
  var maxVal = allVals.reduce(
    (running, val) => val > running ? val : running
  );
  var minVal = allVals.reduce(
    (running, val) => val < running ? val : running
  );
  var range = (maxVal - minVal) * percentile;
  var buyAt = minVal + range;
  var sellAt = maxVal - range;
  var toBuy = goods.filter(
    good => good.val < buyAt && good.stock < StockMarket.getGoodMaxStock(good)
  );
  var toSell = goods.filter(
    good => good.val > sellAt && good.stock > 0
  );
  toSell.reverse();
  return {
    goods,
    maxVal,
    minVal,
    buyAt,
    sellAt,
    toBuy,
    toSell,
  };
}

/*:･ﾟ✧*:･ﾟ✧ -----  CONVENIENCE FUNCTIONS  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function extractNum(desc) {
  var match = /((?:\d*\.)?\d+)/.exec(desc);
  if (!match) return 0;
  return parseFloat(match);
}

function extractPercent(desc) {
  var match = /((?:\d*\.)?\d+)%/.exec(desc);
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
  stockmarket: setInterval(adjustStockPortfolio, 4999),
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
  adjustStockPortfolio,
  analyzeStockMarket,
  lastOf,
  intervals,
  cleanup,
};