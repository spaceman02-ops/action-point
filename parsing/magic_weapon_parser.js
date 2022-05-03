import magic_item from "../../../data_storage/general_datastores/magic_item_template.json" assert { type: "json" };
import all_items from "../../../data_storage/general_datastores/magic_items.json" assert { type: "json" };
import fs from "fs";

let output = [];
for (let j = 0; j < all_items.length; j++) {
  let combined = JSON.parse(JSON.stringify(magic_item));

  combined.data.price = Number(
    magicWeapon.cost
      .split("")
      .filter((i) => !isNaN(i))
      .join("")
  );

  combined.data.rarity = magicWeapon.class;
  combined.data.level = magicWeapon.level;
  combined.data.enhance = makeNumber(magicWeapon.bonus);
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
  let powersDescription = "";
  let propertyDescription = "";
  if (magicWeapon.powers.length > 1)
    powersDescription = `<b>Powers</b>:<br>${magicWeapon.powers}`;
  if (magicWeapon.properties.length > 1) {
    propertyDescription = `<b>Properties</b> <br> ${magicWeapon.properties}`;
  }
  let description = `<i>${magicWeapon.flavor}<i><br>${combined.data.chatFlavor}<br>${powersDescription}<br>${propertyDescription}`;
  description = description.replaceAll("\\n", "<br>").replaceAll("\n", "<br>");

  combined.data.description.value = description;
  output.push(combined);
}

let data = JSON.stringify(output);
fs.writeFileSync(
  "../../../data_storage/foundry_datastores/weapon_output.json",
  data
);
