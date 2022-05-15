import sqlite3 from "sqlite3";
import fs from "fs";
import { fullCleanText } from "./utilities/utility_functions.js";
import {
  POWERTYPES,
  ABILITIES,
  DEFENSES,
  DAMAGETYPES,
  POWERSOURCES,
} from "./utilities/constants.js";
import template from "./templates/power_template.json" assert { type: "json" };
class powerParser {
  constructor(row, db) {
    this.row = row;
    this.db = db;
    this.processBasicInfo();
    this.processText();
    this.processDescription();
    this.processRange();
    this.processAttacks();
    this.processFlavor();
    this.processTargets();
    this.processDamage();
    this.processEffect();
    this.processKeywords();
    this.processPowerSource();
  }
  processBasicInfo() {
    this.name = this.row.Name;
    this.level = this.row.Level;
    this.action = this.row.Action;
    this.source = this.row.Source;
    this.class = this.row.Class;
    this.kind = this.row.Kind;
    this.usage = this.row.Usage;
    this.id = this.row.ID;
  }
  processText() {
    [this.cleanText, , this.linebreakText, this.arrtext] = fullCleanText(
      this.row.Txt
    );
  }
  processDescription() {
    this.description = this.linebreakText;
  }
  processRange() {
    const ranges = {
      rangeBurst: /area.+burst.(\d+).+within.(\d+)/im,
      closeBurst: /close.+burst.(\d+)/im,
      closeBlast: /close.+blast.(\d+)/im,
      wall: /area.+wall.(\d+).+within.(\d+)/im,
      personal: /personal/im,
      melee: /melee.+(\d+)/im,
      weapon: /weapon/im,
      ranged: /ranged.+(\d+)/im,
      touch: /touch/im,
    };
    for (const [key, value] of Object.entries(ranges)) {
      if (value.test(this.cleanText)) {
        this.range = key;
        if (key == "rangeBurst" || key == "wall") {
          [, this.area, this.distance] = this.cleanText.match(value);
          console.log(this.range, this.area, this.distance);
        } else {
          this.distance = this.cleanText.match(value)[1];
        }
      }
    }
  }
  processAttacks() {
    let attacklines = this.arrtext.filter((i) => i.includes("Attack"));
    let attacks = [];
    for (let a of attacklines) {
      let ability = Object.keys(ABILITIES).find((i) => a.includes(i));
      let defense = Object.keys(DEFENSES).find((i) => a.includes(i));
      if (ability && defense) {
        attacks.push({ ability, defense });
      }
    }
    this.attacks = attacks;
  }
  processTargets() {
    this.targets = this.arrtext.filter((i) => i.match(/target.+:/i));
  }
  processDamage() {
    let damagelines = this.arrtext.filter((i) => /hit.+:/im.test(i));
    let hits = [];
    for (let line of damagelines) {
      let dieSizes = line.match(/d\d+/g)
        ? line.match(/d\d+/g)
        : line.match(/\[W\]/g)
        ? ["weapon"]
        : ["0"];
      let dieCounts = line.match(/\d+(d|\[W\])/g)
        ? line.match(/\d+(d|\[W\])/g).map((i) => Number(i.match(/\d+/g)[0]))
        : [];
      let types = DAMAGETYPES.filter((i) => line.includes(i));
      if (types.length < 1) types.push("damage");
      let detail = line.replace("Hit : ", "");
      let modifier = Object.keys(ABILITIES).filter((i) => line.includes(i));
      hits.push({
        dieSizes,
        dieCounts,
        types,
        detail,
        modifier,
      });
    }
    this.hits = hits;
  }
  processEffect() {
    let patterns = {
      effect: /effect.+:/i,
      miss: /miss.+:/i,
      trigger: /trigger.+:/i,
      special: /special.+:/i,
      requirement: /requirement.+:/i,
      sustain: /sustain.+:/i,
    };
    for (let [key, value] of Object.entries(patterns)) {
      let line = this.arrtext.filter((i) => value.test(i));
      if (line.length > 0) {
        this[key] = line[0].replace(value, "");
      } else {
        this[key] = "";
      }
    }
  }
  processKeywords() {
    let keywords = [];
    for (const [key, value] of Object.entries(POWERTYPES)) {
      if (this.cleanText.toLowerCase().includes(key)) {
        keywords.push(key);
      }
    }
    keywords.push(...Array.from(new Set(...this.hits?.map((i) => i.types))));
    this.keywords = keywords;
  }
  processFlavor() {
    let longest = 0;
    let flavortext = ``;
    for (let i = 0; i < 5; i++) {
      if (this.arrtext[i].length > longest) {
        flavortext = this.arrtext[i];
        longest = this.arrtext[i].length;
      }
    }
    this.flavor = flavortext;
  }
  processPowerSource() {
    this.powerSources = [];
    for (let p of POWERSOURCES) {
      if (this.cleanText.toLowerCase().includes(p)) {
        this.powerSources.push(p);
      }
    }
  }
  createOutput() {
    return {
      name: this.name,
      level: this.level,
      action: this.action,
      source: this.source,
      class: this.class,
      kind: this.kind,
      usage: this.usage,
      id: this.id,
      description: this.description,
      range: this.range,
      area: this.area,
      distance: this.distance,
      attacks: this.attacks,
      targets: this.targets,
      hits: this.hits,
      effect: this.effect,
      keywords: this.keywords,
      flavor: this.flavor,
      powerSources: this.powerSources,
      miss: this.miss,
      trigger: this.trigger,
      special: this.special,
      requirement: this.requirement,
      sustain: this.sustain,
    };
  }
  createFoundry() {
    let foundry = JSON.parse(JSON.stringify(template));
    foundry.data.description.value = this.description;
    foundry.name = this.name;
    foundry.data.level = this.level;
    foundry.data.actionType = this.action.toLowerCase().replace("-", "");
    foundry.data.source = this.source;
    foundry.class = this.class;
    foundry.data.powerType = this.kind;
    foundry.data.useType = this.usage.toLowerCase().replace("-", "");
    foundry.data.subName = `${this.class} ${this.kind} ${this.level}`;
    foundry.data.rangeType = this.range;
    foundry.data.area = this.area;
    foundry.data.range = this.distance;
    foundry.data.effect.detail = this.effect;
    foundry.data.target = this.targets[0];
    foundry.data.miss.detail = this.miss;
    foundry.data.trigger = this.trigger;
    foundry.data.special = this.special;
    foundry.data.requirement = this.requirement;
    foundry.data.sustain.detail = this.sustain;
    foundry.data.powersource = this.powerSources[0];
    foundry.data.weaponType = "any";
    foundry.data.weaponUse = "default";
    foundry.data.chatFlavor = this.flavor;
    for (let n of this.keywords) {
      foundry.data.effectType[n] = true;
    }
    let outputs = [];
    this.attacks.forEach((a, i) => {
      let o = JSON.parse(JSON.stringify(foundry));
      if (i == 1) {
        o.name = o.name + " Secondary";
        
      }
      if (i == 2) {
        o.name = o.name + " Tertiary";
        
      }
      o.data.attack.ability = ABILITIES[a.ability];
      o.data.attack.def = DEFENSES[a.defense];
      o.data.hit.isDamage = true;
      if (this.hits[i]) {
        o.data.hit.detail = this.hits[i].detail;
        o.data.hit.baseDiceType = this.hits[i].dieSizes[0];
        o.data.hit.baseQuantity = this.hits[i].dieCounts[0];
        this.hits[i].types.forEach((t) => (o.data.damageType[t] = true));
      }
      outputs.push(o);
    });
    return outputs;
  }
}

function startParsePower(err, row) {
  const power = new powerParser(row, db);
  powers.push(...power.createFoundry());
}

let sqlStatements = {
  powers: {
    import: `SELECT * FROM Power;`,
    update: `UPDATE Power SET JSON = $data WHERE Name = $name;`,
  },
};

let db = new sqlite3.Database(
  "./utilities/ddi_db/ddi.db",
  sqlite3.OPEN_READWRITE,
  (err) => {}
);
let powers = [];
db.each(sqlStatements.powers.import, (err, row) => {
  startParsePower(err, row);
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(2000);
let data = JSON.stringify(powers);
fs.writeFileSync("newpowersOutput.json", data);
