import magic_items from "../../../data_storage/general_datastores/magic_items.json" assert { type: "json" };
import consumable_template from "../../../data_storage/general_datastores/consumable_template.json" assert { type: "json" };
import config from "./dnd4ebeta_config.js";
import fs from "fs";

let output = [];
for (let j = 0; j < magic_items.length; j++) {
  let magicItem = magic_items[j];
  let combined = JSON.parse(JSON.stringify(item_template));
  let subclass = magicItem.subclass.toLowerCase();
  if (subclass.includes("alchemical") || subclass.includes("consumable")) {
    continue;
  }
  for (let [key, value] of Object.entries(config.equipmentTypes)) {
    if (subclass.includes(key)) {
      combined.data.armour.type = key;
      break;
    }
  }

  console.log(magicItem.enhancement);
  combined.data.price = Number(
    magicItem.cost
      .split("")
      .filter((i) => !isNaN(i))
      .join("")
  );
  combined.data.rarity = magicItem.class;
  combined.data.level = magicItem.level;
  //get enhancements

  for (let [key, value] of Object.entries(config.def)) {
    if (magicItem.enhancement.includes(value)) {
      combined.data.armour[key] = Number(
        magicItem.bonus
          .split("")
          .filter((i) => !isNaN(i))
          .join("")
      );
    }
  }
  combined.name = magicItem.name;
  let description = "";
  let powers = "";
  let flavor = "";
  let props = "";
  if (magicItem.props != "") {
    props = `<b>Properties:</b><br> ${magicItem.props.join("<br>")}`;
  }
  if (magicItem.powers != "") {
    let fmtPowers = "";
    for (let i = 0; i < magicItem.powers.length; i++) {
      for (let [key, value] of Object.entries(magicItem.powers[i])) {
        fmtPowers += `<b>${key}</b>: ${value}<br>`;
      }
    }
    powers = `<b>Powers:</b><br> ${fmtPowers}`;
  }
  if (magicItem.flavor != "") {
    flavor = `<b>Flavor:</b><br> ${magicItem.flavor}`;
  }
  description = `${flavor}<br>${props}<br>${powers}`;
  description = description.replaceAll("\\n", "<br>").replaceAll("\n", "<br>");
  combined.data.description.value = description;
  output.push(combined);
}
let data = JSON.stringify(output);
fs.writeFileSync(
  "../../../data_storage/foundry_datastores/magic_item_output.json",
  data
);
