
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { Power, Feat, Armour, Weapon, GenItem, Implement } from './templates.js';
import { DND4EBETA } from './config.js';
import { fullCleanText, capitalizeFirstLetter, toTitleCase, camelToTitle, cleanText, cramText } from './utilityFunctions.js';
import { shortHands, powerTypes, actionTypes, typesOfArmor, weaponTypes, abilities, defenses, damageTypes } from './constants.js';
import { generalPowerData, attack, hit } from './newparse.js';
let db = new sqlite3.Database('../db/ddi.db', sqlite3.OPEN_READWRITE, (err) => {});
let jsonOutput = [];
let sqlStatements = {
  powers: {
    import: `SELECT * FROM Power;`,
    update: `UPDATE Power SET JSON = $data WHERE Name = $name;`,
  },
  feats: {
    import: `SELECT * FROM Feat;`,
    update: `UPDATE Feat SET JSON = $data WHERE Name = $name;`,
  },
  monsters: {
    import: `SELECT * FROM Monster;`,
    update: `UPDATE Monster SET JSON = $data WHERE Name = $name;`,
  },
  items: {
    import: `SELECT * FROM Item WHERE NOT CATEGORY='Armor' AND NOT CATEGORY='Weapon' AND NOT CATEGORY='Consumable' AND NOT CATEGORY='Implement';`,
    update: `UPDATE Item SET JSON = $data WHERE Name = $name;`,
  },
  armor: {
    import: `SELECT * FROM Item WHERE CATEGORY='Armor';`,
    update: `UPDATE Item SET JSON = $data WHERE Name = $name;`,
  },
  weapons: {
    import: `SELECT * FROM Item WHERE CATEGORY='Weapon';`,
    update: `UPDATE Item SET JSON = $data WHERE Name = $name;`,
  },
  implements: {
    import: `SELECT * FROM Item WHERE CATEGORY='Implement';`,
    update: `UPDATE Item SET JSON = $data WHERE Name = $name;`,
  },
};
db.each(sqlStatements.powers.import, (err, row) => {
  parsePower(row, db);
});
// db.each(sqlStatements.feats.import, (err, row) => {
//   parseFeat(row, db);
// });
// db.each(sqlStatements.monsters.import, (err, row) => {
//   parseMonster(row, db);
// });
// db.each(sqlStatements.items.import, (err, row) => {
//   parseGenItem(row, db);
// });
// db.each(sqlStatements.armor.import, (err, row) => {
//   parseArmor(row, db);
// });
// db.each(sqlStatements.weapons.import, (err, row) => {
//   parseWeapon(row, db);
// });
// db.each(sqlStatements.implements.import, (err, row) => {
//   parseImplement(row, db);
// });

function parsePower(row, db) {
  let roll20 = `&{template:dnd4epower}`;
  let { Name, Level, Action, Source, Class, Kind, Usage, ID } = row;

  roll20 += `{{name=${Name}}} {{class=${Class}}} {{level=${Level}}} {{type=${Kind} ♦ }} {{action=${Action}  ♦ }}`;
  let [txt, cramtxt, linebreakText] = fullCleanText(row.Txt);
  let arrtxt = linebreakText.split('<br>');
  let output = new Power();
  let general = new generalPowerData();
  output.data.data.description.value = linebreakText;
  general.data.description.value = linebreakText;
  output.data.name = Name;
  general.data.name = Name;
  output.data.data.level = Level;
  general.data.level = Level;
  Action = Action.toLowerCase().replace('immediate ', '').trim();
  output.data.data.actionType = Action;
  general.data.actionType = Action;
  output.data.data.source = Source;
  general.data.source = Source;
  general.data.ddID = ID;
  general.data.class = Class;
  output.data.data.powerType = Kind;
  if (Usage === 'At-Will') {
    Usage = 'atwill';
  } else {
    Usage = Usage.toLowerCase();
  }
  output.data.data.useType = Usage;
  output.data.data.type = Usage;
  general.data.useType = Usage;
  general.data.type = Usage;
  roll20 += `{{${output.data.data.useType}=1}}`;
  output.data.data.subName = `${Class} ${Kind} ${Level}`;
  general.data.subName = `${Class} ${Kind} ${Level}`;

  let rangeType, area, rangePower;
  let roll20Range = '';
  if (cramtxt.match(/closeburst\d/)) {
    let matches = cramtxt.match(/closeburst\d{1,2}/);
    rangeType = 'closeBurst';
    area = Number(matches[0].match(/\d{1,2}/g)[0]);
  } else if (cramtxt.match(/closeblast\d/)) {
    let matches = cramtxt.match(/closeblast\d{1,2}/);
    rangeType = 'closeBlast';
    area = Number(matches[0].match(/\d{1,2}/)[0]);
  } else if (cramtxt.match(/areaburst\d{1,2}within\d{1,2}/)) {
    let matches = cramtxt.match(/areaburst\d{1,2}within\d{1,2}/);
    rangeType = 'rangeBurst';
    area = Number(matches[0].match(/\d{1,2}/g)[0]);
    rangePower = Number(matches[0].match(/\d{1,2}/g)[1]);
  } else if (cramtxt.match(/areablast\d{1,2}within\d{1,2}/)) {
    let matches = cramtxt.match(/areablast\d{1,2}within\d{1,2}/);
    rangeType = 'rangeBlast';
    area = Number(matches[0].match(/\d{1,2}/g)[0]);
    rangePower = Number(matches[0].match(/\d{1,2}/g)[1]);
  } else if (cramtxt.match(/areawall\d{1,2}within\d{1,2}/)) {
    let matches = cramtxt.match(/areawall\d{1,2}within\d{1,2}/);
    rangeType = 'wall';
    area = Number(matches[0].match(/\d{1,2}/g)[0]);
    rangePower = Number(matches[0].match(/\d{1,2}/g)[1]);
  } else if (cramtxt.match(/personal/)) {
    rangeType = 'personal';
  } else if (cramtxt.match(/melee\d/)) {
    rangeType = 'melee';
  } else if (cramtxt.match(/weapon/)) {
    rangeType = 'weapon';
  } else if (cramtxt.match(/ranged\d{1,2}/)) {
    let matches = cramtxt.match(/ranged\d{1,2}/);
    rangeType = 'range';
    rangePower = Number(matches[0].match(/\d{1,2}/g)[0]);
  } else if (cramtxt.match(/touch/)) {
    rangeType = 'touch';
  }
  if (rangeType) {
    output.data.data.rangeType = rangeType;
    general.data.rangeType = rangeType;
    roll20Range += `${camelToTitle(rangeType)} `;
  }

  if (area) {
    output.data.data.area = area;
    general.data.area = area;
    roll20Range += `${area} `;
  }

  if (rangePower) {
    output.data.data.range = rangePower;
    general.data.range = rangePower;
    if (area) roll20Range += `within `;
    roll20Range += `${rangePower}`;
  }

  roll20 += `{{range=${roll20Range}}}`;
  //parse out an attack if one exists
  let attacklines = arrtxt.filter((i) => i.includes('Attack'));

  function parseAttack(line) {
    let attacks = [];
    let defense = [];
    for (let k of Object.keys(abilities)) {
      if (line.includes(k)) {
        attacks.push(k);
      }
    }
    for (let k of Object.keys(defenses)) {
      if (line.includes(k)) {
        defense.push(k);
      }
    }

    if (attacks.length > 0 && defense.length > 0) {
      return [attacks[0], defense[0]];
    } else {
      return null;
    }
  }
  let attacks = attacklines.map((i) => parseAttack(i)).filter((i) => i !== null);
  if (attacks[0]) {
    //console.log('found attack');
    general.data.attacks.push(attacks.map((i) => new attack(...i)));
    output.data.data.attack.isAttack = true;
    general.data.isAttack = true;
    let [atk1, def1] = attacks[0].map((i) => i.toLowerCase());
    roll20 += `{{attack=[[ 1d20 + [[ @{${atk1}-mod} ]] [${atk1} modifier] + [[@{halflevel}]] [half level] + [[ @{weapon-1-attack} ]] [weapon attack bonus]]] vs **${def1}**}}`;
    if (attacks[1]) {
      let [atk2, def2] = attacks[1].map((i) => i.toLowerCase());
      roll20 += `{{secondaryattack=[[ 1d20 + [[ @{${atk2}-mod} ]] [${atk2} modifier] + [[@{halflevel}]] [half level] + [[ @{weapon-1-attack} ]] [weapon attack bonus]]] vs **${def2}**}}`;
    }
    output.data.data.attack.ability = abilities[attacks[0][0]];
    output.data.data.attack.def = defenses[attacks[0][1]];
    output.data.data.weaponType = 'any';
    output.data.data.weaponUse = 'default';
  } else {
    output.data.data.attack.isAttack = false;
  }
  //parse out damage if it exists
  let damagelines = arrtxt.filter((i) => i.includes('Hit : '));
  function parseHit(line) {
    let dieSizes = line.match(/d\d+/g) ? line.match(/d\d+/g) : line.match(/\[W\]/g) ? ['weapon'] : ['0'];
    let dieCounts = line.match(/\d+(d|\[W\])/g) ? line.match(/\d+(d|\[W\])/g).map((i) => Number(i.match(/\d+/g)[0])) : [];
    let types = damageTypes.filter((i) => line.includes(i));
    if (types.length < 1) types.push('damage');
    let detail = line.replace('Hit : ', '');
    let modifier = Object.keys(abilities).filter((i) => line.includes(i));
    if (dieSizes && dieCounts && types) {
      return [dieCounts, dieSizes, modifier, types, detail];
    } else {
      return null;
    }
  }
  let hits = damagelines.map((i) => parseHit(i)).filter((i) => i !== null);
  function roll20Hit(count, size, modifier, types, detail, secondary) {
    let roll20 = '';
    let roll20DamageType = types.join(' and ');
    let roll20mod = ``;
    let die = size.substring(1, size.length);
    let prefix = '';
    secondary ? (prefix = 'secondary') : (prefix = '');
    roll20 += `{{${prefix}hiteffect=${detail}}}`;
    if (detail.includes('damage')) {
      roll20mod = modifier.length > 0 ? `[[ @{${modifier[0].toLowerCase()}-mod} ]] [${modifier[0].toLowerCase()} modifier]` : '';
      if (size === 'weapon') {
        roll20 += `{{${prefix}damage=[[ ${count}d@{weapon-1-dice} + ${roll20mod} ]]}}{{${prefix}critical=[[ ${count}*@{weapon-1-dice} + ${roll20mod} ]] ${roll20DamageType} damage}}`;
      } else if (size === '0') {
        roll20 += `{{${prefix}damage=[[ ${roll20mod} ]]}}{{${prefix}critical=[[ ${roll20mod} ]] ${roll20DamageType} damage}}`;
      } else {
        roll20 += `{{${prefix}damage=[[ ${count}${size} + ${roll20mod} ]]}}{{${prefix}critical=[[ ${count}*${die} + ${roll20mod} ]] ${roll20DamageType} damage}}`;
      }
    }

    return roll20;
  }
  if (hits[0]) {
    general.data.hits.push(hits.map((i) => new hit(...i)));
    output.data.data.hit.isDamage = true;
    let [counts, sizes, modifier, types, detail] = hits[0];
    output.data.data.hit.detail = detail;
    output.data.data.hit.baseDiceType = sizes[0];
    output.data.data.hit.baseQuantity = counts[0];
    types.forEach((t) => (output.data.data.damageType[t] = true));
    roll20 += roll20Hit(counts[0], sizes[0], modifier, types, detail, false);
  }
  if (hits[1]) {
    general.data.hits.push(hits.map((i) => new hit(...i)));
    let [counts, sizes, modifier, types, detail] = hits[1];
    roll20 += roll20Hit(counts[0], sizes[0], modifier, types, detail, true);
  }
  //parse out target
  let targettest = arrtxt.filter((i) => i.includes('Target : ') && !i.includes('Secondary'));
  if (targettest.length > 0) {
    let t = targettest[0].replace('Target : ', '');
    output.data.data.target = t;
    general.data.target = t;
    roll20 += `{{target=${t}}}`;
  }
  let targettest2 = arrtxt.filter((i) => i.includes('Secondary Target : '));
  if (targettest2.length > 0) {
    let t = targettest2[0].replace('Secondary Target : ', '');
    //output.data.data.target = t;
    general.data.target = t;
    roll20 += `{{secondarytarget=${t}}}`;
  }
  //parse out effect if one exists
  let effect = arrtxt.filter((i) => i.includes('Effect : '));
  if (effect.length > 0) {
    let e = effect[0].replace('Effect : ', '');
    output.data.data.effect.detail = e;
    general.data.effect = e;
    roll20 += `{{effect=${e}}}`;
  }
  //parse out miss text
  let missText = arrtxt.filter((i) => i.includes('Miss : '));
  if (missText.length > 0) {
    let m = missText[0].replace('Miss : ', '');
    output.data.data.miss.detail = m;
    general.data.miss = m;
    roll20 += `{{miss=${m}}}`;
  }
  //parse out trigger text
  let triggerText = arrtxt.filter((i) => i.includes('Trigger : '));
  if (triggerText.length > 0) {
    let t = triggerText[0].replace('Trigger : ', '');
    output.data.data.trigger = t;
    general.data.trigger = t;
    roll20 += `{{trigger=${t}}}`;
  }
  //parse out special text
  let specialText = arrtxt.filter((i) => i.includes('Special : '));
  if (specialText.length > 0) {
    let s = specialText[0].replace('Special : ', '');
    output.data.data.special = s;
    general.data.special = s;
    roll20 += `{{special=${s}}}`;
  }
  //parse out requirement text
  let requirementText = arrtxt.filter((i) => i.includes('Requirement : '));
  if (requirementText.length > 0) {
    let r = requirementText[0].replace('Requirement : ', '');
    output.data.data.requirement = r;
    general.data.requirement = r;
    roll20 += `{{requirement=${r}}}`;
  }
  //parse out sustain text
  let sustainText = arrtxt.filter((i) => i.includes('Sustain'));
  if (sustainText.length > 0) {
    let sustain = sustainText[0].replace('Sustain : ', '');
    output.data.data.sustain.detail = sustain;
    general.data.sustain.detail = sustain;
    roll20 += `{{sustain=${sustain}}}`;
    for (let i = 0; i < actionTypes.length; i++) {
      if (sustainText[0].toLowerCase().includes(actionTypes[i])) {
        output.data.data.sustain.actionType = actionTypes[i];
        general.data.sustain.actionType = actionTypes[i];
      }
    }
  }

  for (let k of Object.keys(DND4EBETA.weaponType)) {
    if (cramtxt.includes(k)) {
      output.data.data.weaponType = k;
      output.data.data.weaponUse = 'default';
      general.data.weaponType = k;
      general.data.weaponUse = 'default';
    }
  }
  let roll20keywords = [];
  for (let k of Object.keys(DND4EBETA.powerSource)) {
    if (cramtxt.includes(k)) {
      output.data.data.powersource = k;
      general.data.powersource = k;
      if (k === 'ki' && Class.toLowerCase() !== 'monk') {
        continue;
      } else {
        roll20keywords.push(capitalizeFirstLetter(k));
      }
      if (k == 'elemental') {
        output.data.data.powersource = 'Elemental';
        general.data.powersource = 'Elemental';
      }
    }
  }

  //parse out flavor text
  let longest = 0;
  let flavortext = ``;
  for (let i = 0; i < 5; i++) {
    if (arrtxt[i].length > longest) {
      flavortext = arrtxt[i];
      longest = arrtxt[i].length;
    }
  }
  output.data.data.chatFlavor = flavortext;
  general.data.chatFlavor = flavortext;
  roll20 += `{{emote=${flavortext}}}`;
  //parse out power types

  for (const [key, value] of Object.entries(powerTypes)) {
    if (cramtxt.includes(key)) {
      roll20keywords.push(capitalizeFirstLetter(key));
      output.data.data.effectType[value] = true;
      general.data.powerTypes.push(capitalizeFirstLetter(key));
    }
  }
  if (roll20keywords.length > 0) {
    roll20 += `{{keywords=${roll20keywords.join(', ')}}}`;
  }
  roll20 = roll20.replace(/damage\s+damage/gi, 'damage');
  let data = JSON.stringify(output.data);
  general.data.foundry = data;
  general.data.roll20 = roll20;
  jsonOutput.push(general.data);
  //console.log(roll20);
  db.run(sqlStatements.powers.update, {
    $name: Name,
    $data: data,
  });
  return general.data;
}
function parseGenItem(row, db) {
  let { Name, Source, Rarity, Category } = row;
  let roll20 = ``;

  let [txt, cramtxt, linebreakText] = fullCleanText(row.Txt);
  let arrtxt = linebreakText.split('<br>');
  let output = new GenItem();
  output.data.data.armour.type = Category.toLowerCase();
  output.data.name = Name;
  output.data.data.description.value = txt;
  output.data.data.source = Source;
  output.data.data.rarity = Rarity;
  let weight = arrtxt.filter((i) => i.includes('Weight : '));
  if (weight.length > 0) {
    weight = weight[0].match(/\d+/)[0];
    output.data.data.weight = Number(weight);
  }
  let acbonus = arrtxt.filter((i) => i.includes('AC Bonus : '));
  if (acbonus.length > 0) {
    acbonus = acbonus[0].match(/\d+/)[0];
    output.data.data.armour.ac = Number(acbonus);
  }
  let data = JSON.stringify(output.data);
  updateDb(`UPDATE Item SET JSON = $data WHERE Name = $name;`, Name, data, db);
}
function parseArmor(row, db) {
  let { Name, Source } = row;
  let [txt, cramtxt, linebreakText] = fullCleanText(row.Txt);
  let arrtxt = linebreakText.split('<br>');
  let output = new Armour();
  output.data.name = Name;
  output.data.data.description.value = linebreakText;
  output.data.data.source = Source;
  let weight = arrtxt.filter((i) => i.includes('Weight : '));
  if (weight.length > 0) {
    weight = weight[0].match(/\d+/)[0];
    output.data.data.weight = Number(weight);
  }
  let acbonus = arrtxt.filter((i) => i.includes('AC Bonus : '));
  if (acbonus.length > 0) {
    acbonus = acbonus[0].match(/\d+/)[0];
    output.data.data.armour.ac = Number(acbonus);
  }
  let subtype = arrtxt.filter((i) => i.includes('Type : '));
  if (subtype.length > 0) {
    subtype = subtype[0].replace('Type : ', '').toLowerCase();
    for (let k of Object.keys(typesOfArmor)) {
      if (typesOfArmor[k].includes(subtype)) {
        output.data.data.armour.subType = k.toLowerCase();
      }
    }
  }
  let data = JSON.stringify(output.data);
  updateDb(
    `UPDATE Item
                SET JSON = $data
                WHERE Name = $name;`,
    Name,
    data,
    db
  );
}
function parseWeapon(row, db) {
  let { Name, CostSort, Source, Rarity } = row;
  let [txt, cramtxt, linebreakText] = fullCleanText(row.Txt);
  let arrtxt = linebreakText.split('<br>');
  let output = new Weapon();
  output.data.name = Name;
  output.data.data.description.value = linebreakText;
  output.data.data.source = Source;
  output.data.data.price = CostSort;
  if (!Rarity.includes('\n')) {
    output.data.data.rarity = Rarity;
  }

  let weight = arrtxt.filter((i) => i.includes('Weight : '));
  if (weight.length > 0) {
    let tweight = weight[0].match(/\d+/)[0];
    output.data.data.weight = Number(tweight);
  }

  //need to parse damage
  let damage = arrtxt.filter((i) => i.includes('Damage : '));
  if (damage.length > 0) {
    let damageFormula = damage[0].match(/\d+d\d+/)[0];
    let totalDice = damageFormula.match(/\d+/g)[0];
    let dieSize = damageFormula.match(/\d+/g)[1];
    output.data.data.damageDice.parts = [[totalDice, dieSize, '']];
  }

  //need to parse the type of weapon
  for (const [key, value] of Object.entries(weaponTypes)) {
    if (value.every((i) => cramtxt.includes(i))) {
      output.data.data.weaponType = key;
      break;
    }
  }

  //need to parse the proficiency bonus
  let proficient = arrtxt.filter((i) => i.includes('Proficient'));
  if (proficient.length > 0) {
    let bonus = proficient[0].match(/\+\d+/)[0];
    output.data.data.profBonus = Number(bonus.slice(1));
  }

  //need to parse weapon group
  let data = JSON.stringify(output.data);
  updateDb(
    `UPDATE Item
                SET JSON = $data
                WHERE Name = $name;`,
    Name,
    data,
    db
  );
}
function parseImplement(row, db) {
  let { Name, Source, Rarity, Category } = row;
  let [txt, cramtxt, linebreakText] = fullCleanText(row.Txt);
  let arrtxt = linebreakText.split('<br>');
  let output = new Implement();
  output.data.data.armour.type = Category.toLowerCase();
  output.data.name = Name;
  output.data.data.description.value = linebreakText;
  output.data.data.source = Source;
  output.data.data.rarity = Rarity;

  let weight = arrtxt.filter((i) => i.includes('Weight : '));
  if (weight.length > 0) {
    let tweight = weight[0].match(/\d+/)[0];
    output.data.data.weight = Number(tweight);
  }

  //need to parse damage
  let damage = arrtxt.filter((i) => i.includes('Damage : '));
  if (damage.length > 0) {
    let damageFormula = damage[0].match(/\d+d\d+/)[0];
    let totalDice = damageFormula.match(/\d+/g)[0];
    let dieSize = damageFormula.match(/\d+/g)[1];
    output.data.data.damageDice.parts = [[totalDice, dieSize, '']];
  }

  //need to parse the type of weapon
  for (const [key, value] of Object.entries(weaponTypes)) {
    if (value.every((i) => cramtxt.includes(i))) {
      output.data.data.weaponType = key;
      break;
    }
  }

  //need to parse the proficiency bonus
  let proficient = arrtxt.filter((i) => i.includes('Proficient'));
  if (proficient.length > 0) {
    let bonus = proficient[0].match(/\+\d+/)[0];
    output.data.data.profBonus = Number(bonus.slice(1));
  }

  //need to parse weapon group
  let data = JSON.stringify(output.data);
  updateDb(
    `UPDATE Item
                SET JSON = $data
                WHERE Name = $name;`,
    Name,
    data,
    db
  );
}
function parseMonster(row, db) {
  let { Name, Level, ID } = row;
  let cleanname = cramText(cleanText(Name));
  let match = mdata.filter((i) => {
    let n = cramText(cleanText(i.name));
    return cleanname.slice(0, 15) === n.slice(0, 15);
  });
  let data = JSON.stringify(match[0]);
  updateDb(
    `UPDATE Monster
                SET JSON = $data
                WHERE Name = $name;`,
    Name,
    data,
    db
  );
}

let mdata = fs
  .readFileSync('../db/all.db', 'utf8')
  .split('\n')
  .map((i) => {
    return JSON.parse(i);
  });
function updateDb(sqlText, name, data, db) {
  let sql = sqlText;
  const values = {
    $name: name,
    $data: data,
  };
}
// const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// await wait(10000);
// let data = JSON.stringify(jsonOutput);
// fs.writeFileSync("output.json", data);
