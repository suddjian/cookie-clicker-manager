// a nice middle manager to grow your cookie empire

const Game = window.Game;
const Beautify = window.Beautify;
const StockMarket = Game.Objects.Bank.minigame;
const Grimoire = Game.Objects["Wizard tower"].minigame;
const bigCookie = document.getElementById("bigCookie");
const lumps = document.getElementById("lumps");
const store = document.getElementById("store");
const buffs = document.getElementById("buffs");
const bankContent = document.getElementById("bankContent");
const grimoireSpells = document.getElementById("grimoireSpells");

var clicksps = 100;
var intervals = {};
var timers = [];

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
  Array.from(document.getElementsByClassName("shimmer")).forEach(l => {
    clickOn(l);
  });
}

function harvestLumpIfRipe() {
  if (Date.now() - Game.lumpT > Game.lumpRipeAge) {
    clickOn(lumps);
  }
}

function popWrinklers() {
  for (var w of Game.wrinklers) {
    w.hp = 0;
  }
}

/*:･ﾟ✧*:･ﾟ✧ -----  SHOPPING  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function shopGreedily() {
  if (store.querySelector("#storeBulkBuy.selected") == null) {
    return;
  }
  var item = getShopItemsSortedByProfitability()[0];
  if (item && item.profitability > 0 && item.l.matches(".product:not(.disabled), .upgrade.enabled")) {
    clickOn(item.l);
    console.log(`%cCookie manager: Purchased ${item.name}`, "font-weight:bold");
    return item;
  }
}

function getShopItemsSortedByProfitability() {
  var products = Object.values(Game.Objects)
    .filter(o => !o.locked)
    .map((product) => ({
      name: product.name,
      product,
      l: product.l,
      profitability: getProductCps(product) * Game.buyBulk / product.bulkPrice
    }));
  var upgrades = Game.UpgradesInStore
    .map((upgrade) => ({
      name: upgrade.name,
      upgrade,
      l: store.querySelector(`#store .upgrade[data-id='${upgrade.id}']`),
      profitability: upgrade.pool === "toggle" ? 0 : getUpgradeCps(upgrade) / upgrade.getPrice(),
    }));
  var shopitems = [...products, ...upgrades];
  for (let item of shopitems) {
    if (isNaN(item.profitability)) {
      console.warn(`Cookie manager: Be advised, bad profitability calculation for ${item.name}`);
      console.warn(item);
    }
  }
  shopitems = shopitems.filter(item => !isNaN(item.profitability));
  shopitems.sort((a, b) => b.profitability - a.profitability);
  return shopitems;
}

/*:･ﾟ✧*:･ﾟ✧ -----  CPS CALCULATIONS  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function getProductCps(product) {
  return (product.amount ? product.storedTotalCps / product.amount : product.storedCps) * Game.globalCpsMult;
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
  if (/^golden cookie/i.test(upgrade.desc)) {
    return 0.07 * Game.cookiesPs;
  }
  if (upgrade.pool === "kitten" || /^kitten /i.test(upgrade.name)) {
    return Game.cookiesPs * 0.5;
  }
  if (/^cookie production multiplier /i.test(upgrade.desc)) {
    return Game.cookiesPs * extractPercent(upgrade.desc);
  }
  if (/potential of your prestige level/i.test(upgrade.desc)) {
    const heavenlyMultiplier = parseFloat(Game.prestige)*Game.heavenlyPower*Game.GetHeavenlyMultiplier()*0.01;
    return Game.cookiesPs * heavenlyMultiplier;
  }
  if (upgrade.buildingTie) {
    return getProductCps(upgrade.buildingTie) * upgrade.buildingTie.amount;
  }
  return 0;
}

/*:･ﾟ✧*:･ﾟ✧ -----  STOCK MARKET  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function adjustStockPortfolio() {
  if (bankContent == null || !bankContent.checkVisibility()) {
    return;
  }
  var analysis = analyzeStockMarketV2();
  var { toBuy, toSell } = analysis;
  toBuy.forEach(({ good, max }) => {
    var stockTradeStr = getStockTradeStr(good, max);
    console.log(`%cCookie manager: buying ${stockTradeStr}`, "color:sienna");
    clickOn(document.getElementById(good.l.id + "_Max"));
  });
  toSell.forEach(({ good }) => {
    console.log(`%cCookie manager: selling ${getStockTradeStr(good, good.stock)}`, "color:green");
    clickOn(document.getElementById(good.l.id + "_-All"));
  });
}

function analyzeStockMarketV2() {
  // buy below stddev, sell above
  var goods = Object.values(StockMarket.goods).sort((a, b) => a.id - b.id);
  if (goods.length < 3) {
    return null;
  }

  var maxes = goods.map(good => StockMarket.getGoodMaxStock(good));
  var marketcaps = goods.map((good, i) => good.val * maxes[i]);
  var avgmktcap = marketcaps.reduce((a, b) => a + b) / marketcaps.length;
  var summation = marketcaps.reduce((acc, num) => {
    var dev = avgmktcap - num;
    return acc + dev * dev;
  }, 0);
  var mktcapstddev = Math.sqrt(summation / marketcaps.length);

  var thegoods = goods.map((good, i) => ({
    good,
    max: maxes[i],
    marketcap: marketcaps[i]
  }));
  var brokersPercent = 0.2 * Math.pow(0.95,StockMarket.brokers);
  var buyAt = avgmktcap - mktcapstddev;
  buyAt -= brokersPercent * buyAt;
  var sellAt = avgmktcap + mktcapstddev;

  var budgeted = 0;
  var toBuy = thegoods.filter(({ good, marketcap, max }) => {
    var cost = good.val * (max - good.stock);
    var shouldBuy = marketcap < buyAt && good.stock < max && Game.cookies > budgeted + cost;
    if (shouldBuy) {
      budgeted += cost;
    }
    return shouldBuy;
  });
  var toSell = thegoods.filter(({ good, marketcap }) => marketcap > sellAt && good.stock > 0);

  return { toBuy, toSell, buyAt, sellAt, mktcapstddev, avgmktcap, thegoods };
}

function analyzeStockMarketV1(buyPercentile=0.1, sellPercentile=0.3) {
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
  var buyAt = minVal + (maxVal * buyPercentile);
  var sellAt = maxVal - (maxVal * sellPercentile);
  var totalCost = 0;
  var toBuy = goods.filter(
    good => {
      totalCost += good.val * (StockMarket.getGoodMaxStock(good) - good.stock);
      return (
        good.val < buyAt
        && good.stock < StockMarket.getGoodMaxStock(good)
        && Game.cookies > totalCost
      );
    }
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

function getStockTradeStr(good, amount) {
  var $ = Beautify(good.val * amount);
  var cookies = Beautify(Game.cookiesPsRawHighest * good.val * amount);
  return `${Beautify(amount)} ${good.symbol} at $${Beautify(good.val, 2)} for $${$} (${cookies} 🍪)`;
}

/*:･ﾟ✧*:･ﾟ✧ -----  GRIMOIRE  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function handOfFateToBoostBuffs() {
  if (
    grimoireSpells != null
    && grimoireSpells.checkVisibility()
    && buffs.children.length >= 2
    && Grimoire.getSpellCost(Grimoire.spells["hand of fate"]) <= Grimoire.magic
  ) {
    const handOfFateL = grimoireSpells.children[Grimoire.spells["hand of fate"].id];
    console.log("%cCookie manager forcing the hand of fate to boost buffs", "color:slateblue");
    clickOn(handOfFateL);
  }
}

/*:･ﾟ✧*:･ﾟ✧ -----  UTILITIES  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

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

/*:･ﾟ✧*:･ﾟ✧ -----  SCRIPT LIFECYCLE  ----- *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ *:･ﾟ✧*:･ﾟ✧ */

function cleanup() {
  Object.values(window.cookieclickerhacks.intervals).forEach(clearInterval);
  timers.forEach(clearTimeout);
}

function init() {
  var isRestart = window.cookieclickerhacks != null;
  if (isRestart) {
    cleanup();
  }

  intervals.click = setInterval(clickBigCookie, 1000 / clicksps);
  /* primes bcuz */
  intervals.buy = setInterval(shopGreedily, 997);
  intervals.hofboost = setInterval(handOfFateToBoostBuffs, 1117);
  intervals.shimmer = setInterval(clickShimmer, 1999);
  intervals.lump = setInterval(harvestLumpIfRipe, 2999);
  intervals.stockmarket = setInterval(adjustStockPortfolio, 49999);

  if (isRestart) {
    console.log("cookie clicker manager restarted");
  } else {
    console.log("cookie clicker manager started");
  }
}

init();

window.cookieclickerhacks = {
  clicksps,
  clickOn,
  clickBigCookie,
  clickShimmer,
  harvestLumpIfRipe,
  popWrinklers,
  shopGreedily,
  extractNum,
  extractPercent,
  getShopItemsSortedByProfitability,
  getClickCps,
  getProductCps,
  getUpgradeCps,
  getStockTradeStr,
  adjustStockPortfolio,
  analyzeStockMarketV1,
  analyzeStockMarketV2,
  handOfFateToBoostBuffs,
  intervals,
  timers,
  cleanup,
};
