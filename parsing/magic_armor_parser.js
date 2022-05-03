import magic_armors from "../../../data_storage/general_datastores/magic_armors.json" assert { type: "json" };
import armor from "../../../data_storage/general_datastores/armor.json" assert { type: "json" };
import fs from "fs";

const armorScaling = {
  cloth: [1, 2, 3, 5, 6, 8],
  chainmail: [7, 9, 11, 13, 15, 18],
  leather: [3, 4, 5, 7, 8, 10],
  scale: [8, 10, 12, 14, 16, 19],
  hide: [4, 5, 6, 8, 9, 11],
  plate: [9, 11, 13, 15, 17, 20],
};

let output = [];
for (let j = 0; j < magic_armors.length; j++) {
  let magicArmor = magic_armors[j];
  for (let i = 0; i < armor.length; i++) {
    function makeNumber(str) {
      return Number(
        str
          .split("")
          .filter((i) => !isNaN(i))
          .join("")
      );
    }
    let combined = JSON.parse(JSON.stringify(armor[i]));
    let cArmorType = combined.name.replace("Armor", "").toLowerCase().trim();
    let mArmorType = magicArmor.subclass.toLowerCase();
    if (
      (!mArmorType.includes(cArmorType) && !mArmorType.includes("any")) ||
      cArmorType.includes("shield")
    ) {
      continue;
    }

    combined.data.price = makeNumber(magicArmor.cost);
    combined.data.rarity = magicArmor.class;
    combined.data.level = magicArmor.level;
    combined.data.armour.ac =
      armorScaling[cArmorType][makeNumber(magicArmor.bonus) - 1];
    let newName;
    if (magicArmor.name.includes("Armor")) {
      newName = magicArmor.name.replace(/armor/gi, combined.name);
    } else {
      newName = `${magicArmor.name} (${combined.name})`;
    }
    combined.name = newName;
    let description = "";
    let powers = "";
    let flavor = "";
    let props = "";
    if (magicArmor.props != "") {
      props = `<b>Properties:</b><br> ${magicArmor.props.join("<br>")}`;
    }
    if (magicArmor.powers != "") {
      let fmtPowers = "";
      for (let i = 0; i < magicArmor.powers.length; i++) {
        for (let [key, value] of Object.entries(magicArmor.powers)) {
          if (value.length > 0) {
            fmtPowers += `<b>${key}</b>: ${value}<br>`;
          }
        }
      }
      powers = `<b>Powers:</b><br> ${fmtPowers}`;
    }
    if (magicArmor.flavor != "") {
      flavor = `<b>Flavor:</b><br> ${magicArmor.flavor}`;
    }
    description = `${flavor}<br>${props}<br>${powers}`;
    description = description
      .replaceAll("\\n", "<br>")
      .replaceAll("\n", "<br>");
    combined.data.description.value = description;
    output.push(combined);
  }
}
console.log(output.map((i) => [i.name, i.data.price]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(10000);
output = JSON.stringify(output);
fs.writeFileSync(
  "../../../data_storage/foundry_datastores/armor_output.json",
  output
);
