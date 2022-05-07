import sqlite3 from "sqlite3";
import fs from "fs";
import {
  fullCleanText,
} from "./utilities/utility_functions.js";
import {
  POWERTYPES,
  ABILITIES,
  DEFENSES,
  DAMAGETYPES,
  POWERSOURCES,
} from "./utilities/constants.js";
class powerParser {
  constructor(row, db) {
    this.row = row;
    this.db = db;
    this.processBasicInfo();
    this.processText();
    this.processDescription();
    this.processRange();
    this.processAttacks();
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
      areaBurst: /area.+burst.(\d+).+within.(\d+)/im,
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
        [, this.area, this.distance] = this.cleanText.match(value);
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
      if (arrtxt[i].length > longest) {
        flavortext = arrtxt[i];
        longest = arrtxt[i].length;
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
    };
  }
}

function startParsePower(err, row) {
  const power = new powerParser(row, db);
  powers.push(power.createOutput());
  console.log(powers.length);
}

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
fs.writeFileSync("powersOutput.json", data);
