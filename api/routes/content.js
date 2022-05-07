import express from "express";
import power from "../../parsing/output/powers_output.json" assert { "type": "json" };
import weapon from "../../parsing/output/magic_weapon_output.json" assert { "type": "json" };
import armor from "../../parsing/output/armor_output.json" assert { "type": "json" };
import monster from "../../parsing/output/monsters_output.json" assert { "type": "json" };
import feat from "../../parsing/output/feat_output.json" assert { "type": "json" };
import items from "../../parsing/output/magic_item_output.json" assert { "type": "json" };
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
