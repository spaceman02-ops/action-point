import weapons from "./templates/weapon_templates.json" assert { type: "json" };
import magic_weapons from "./collections/magic_weapon_collection.json" assert { type: "json" };
import config from "./utilities/dnd4ebeta_config.js"
import fs from "fs";
let output = [];
const { weaponGroup, weaponTypes } = config;
for (let j = 0; j < magic_weapons.length; j++) {
  let magicWeapon = magic_weapons[j];
  for (let i = 0; i < weapons.length; i++) {
    let combined = JSON.parse(JSON.stringify(weapons[i]));
    let cWeaponKeywords = [];
    for (let [key, value] of Object.entries(combined.data.weaponGroup)){
      if (value){
        cWeaponKeywords.push(weaponGroup[key].toLowerCase());
      }
    }
    
    cWeaponKeywords.push(weaponTypes[combined.data.weaponType].toLowerCase());
    let { group } = magicWeapon;
    let groupstr = group.toLowerCase();
    group = group.split(/,\s|or/).map(word => word.toLowerCase().trim());
    if (!cWeaponKeywords.some(word => group.includes(word))) {
      if (!groupstr.includes("any")) {
      continue;
      }
    }
    
    combined.data.price = Number(
      magicWeapon.cost
        .split("")
        .filter((i) => !isNaN(i))
        .join("")
    );

    combined.data.rarity = magicWeapon.class;
    combined.data.level = magicWeapon.level;
    combined.data.enhance = Number(
      magicWeapon.bonus
        .split("")
        .filter((i) => !isNaN(i))
        .join("")
    );
    let newName;
    if (magicWeapon.name.includes("Weapon")) {
      newName = magicWeapon.name.replace(/weapon/gi, combined.name);
    } else {
      newName = `${magicWeapon.name} ${combined.name}`;
    }
    combined.name = newName;

    let critDie = magicWeapon.critical.match(/d\d+/gi);
    let crit = ``;
    if (critDie) {
      crit = critDie.map((i) => `(@enhance)${i}`).join(" + ");
    } else {
      crit = `(@enhance)d6`;
    }
    combined.data.critDamageForm = crit;
    let description = "";
    let powers = "";
    let flavor = "";
    let props = "";
    if (magicWeapon.properties != "") {
      props = `<b>Properties:</b><br> ${magicWeapon.properties}<br>`;
    }
    if (magicWeapon.powers != "") {
      let fmtPowers = "";
      for (let i = 0; i < magicWeapon.powers.length; i++) {
        for (let [, value] of Object.entries(magicWeapon.powers)) {
            fmtPowers += `${value}<br>`;
        }
      }
      powers = `<b>Powers:</b><br> ${fmtPowers}`;
    }
    if (magicWeapon.flavor != "") {
      flavor = `<b>Flavor:</b><br> ${magicWeapon.flavor}`;
    }
    description = `${flavor}<br>${props}<br>${powers}`;
    description = description
      .replaceAll("\\n", "<br>")
      .replaceAll("\n", "<br>");
    combined.data.description.value = description;
    output.push(combined);
  }
}
console.log(output.length)
let data = JSON.stringify(output);
fs.writeFileSync("./output/magic_weapon_output.json", data);
