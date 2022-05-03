import express from "express";
import power from "../../data/data_storage/foundry_datastores/powers_output.json" assert { "type": "json" };
import weapon from "../../data/data_storage/foundry_datastores/weapon_output.json" assert { "type": "json" };
import armor from "../../data/data_storage/foundry_datastores/armor_output.json" assert { "type": "json" };
import monster from "../../data/data_storage/foundry_datastores/monsters_output.json" assert { "type": "json" };
import feat from "../../data/data_storage/foundry_datastores/feat_output.json" assert { "type": "json" };
import items from "../../data/data_storage/foundry_datastores/magic_item_output.json" assert { "type": "json" };
const router = express.Router();

async function createContentRoute(content, path) {
  router.get(`${path}/indexes`, function (req, res) {
    const indexes = content.map((v, i) => {
      return { name: v.name, index: i };
    });
    res.json(indexes);
  });
  router.get(`${path}/:index`, function (req, res) {
    const p = content[req.params.index];
    if (!p) {
      res.status(404).send("Content not found");
    } else {
      res.json(p);
    }
  });
}

createContentRoute(power, "/powers");
createContentRoute(weapon, "/weapons");
createContentRoute(armor, "/armor");
createContentRoute(monster, "/monsters");
createContentRoute(feat, "/feats");
createContentRoute(items, "/items");
export default router;
