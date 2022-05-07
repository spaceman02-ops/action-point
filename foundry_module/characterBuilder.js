const apiLink = `https://api.marchingwest.com`;
const skillKey = {
  acr: "acrobatics",
  arc: "arcana",
  ath: "athletics",
  blu: "bluff",
  dip: "diplomacy",
  dun: "dungeoneering",
  end: "endurance",
  hea: "heal",
  his: "history",
  ins: "insight",
  itm: "intimidate",
  nat: "nature",
  prc: "perception",
  rel: "religion",
  stl: "stealth",
  stw: "streetwise",
  thi: "thievery",
};

const swappedKeys = Object.fromEntries(
  Object.entries(skillKey).map(([k, v]) => [v, k])
);

let content = `
<div style="padding: 5px; width: 100%" class="form-group dialog distance-prompt">
  <label>Paste in Character Builder text...</label> <input style="white-space:pre" type="textarea" id="data"
  name="data" value="paste text here" / autofocus>
</div>
`;

new Dialog(
  {
    title: `Character Builder`,
    content,
    buttons: {
      inputname: {
        icon: "<i class='fas fa-pencil-alt'></i>",
        label: `Build it!`,
        callback: (html) => {
          let data = html.find("#data").html();
          console.log(data.split("\n"));
          characterBuilder(data);
        },
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: `Cancel`,
      },
    },
  },
  { width: 800 }
).render(true);

async function characterBuilder(data) {
  const statLine = data[data.findIndex((i) => i.includes("FINAL")) + 1];
  const defenseLine = data[data.findIndex((i) => i.includes("AC:"))];
  const skillLine = data[data.findIndex((i) => i.includes("TRAINED")) + 1];
  const healthLine = data[data.findIndex((i) => i.includes("HP:"))];
  function getFeats(data) {
    const feats = [];
    const featStart = data.findIndex((i) => i.includes("FEAT")) + 1;

    for (let i = featStart; i < data.length; i++) {
      let line = data[i];

      if (line.length < 6) {
        break;
      }
      feats.push(line);
      //clean up the feats
    }
    let cleanFeats = feats.map((i) => i.replace(/^.+: /, ""));
    return cleanFeats;
  }
  function getPowers(data) {
    const powers = [];
    const powerStart = data.findIndex((i) => i.includes("POWER")) + 1;

    for (let i = powerStart; i < data.length; i++) {
      let line = data[i];

      if (line.length < 6) {
        break;
      }
      powers.push(line);
      //clean up the powers
    }
    let cleanPowers = powers.map((i) =>
      i
        .replace(/^.+: /, "")
        .replace(/\(.+\)/, "")
        .trim()
    );
    return cleanPowers;
  }
  const feats = getFeats(data);
  const powers = getPowers(data);
  const stats = statLine.match(/\d+/gi).map((i) => Number(i));
  const defenses = defenseLine.match(/\d+/gi).map((i) => Number(i));
  const trainedSkills = skillLine
    .split(", ")
    .map((i) => i.replace(/[^a-zA-Z]/gi, ""))
    .map((i) => swappedKeys[i.toLowerCase()]);
  const health = healthLine.match(/\d+/gi).map((i) => Number(i));
  const cLevel = Number(data[1].match(/\d+/)[0]);
  const [race, cClass] = data[2].split(", ");
  const name = data[1].split(", ")[0];
  const [str, con, dex, int, wis, cha] = stats;
  const [strmod, conmod, dexmod, intmod, wismod, chamod] = stats.map((i) =>
    Math.floor((i - 10) / 2)
  );
  const [ac, fort, ref, wil] = defenses.map((i) => i - Math.floor(cLevel / 2));
  const [hp, surges, surgeValue] = health;

  //create our actor
  let create = await Actor.create({ name, type: "Player Character" });
  let createdActor = await game.actors.getName(name);
  //update abilities
  await createdActor.update({
    "data.abilities.str.value": str,
    "data.abilities.dex.value": dex,
    "data.abilities.con.value": con,
    "data.abilities.int.value": int,
    "data.abilities.wis.value": wis,
    "data.abilities.cha.value": cha,
    "data.defences.ac.value": ac,
    "data.defences.fort.value": fort - Math.max(conmod, strmod),
    "data.defences.ref.value": ref - dexmod,
    "data.defences.wil.value": wil - wismod,
    "data.details.surgeValue": surgeValue,
    "data.details.surges.max": surges,
    "data.details.surges.value": surges,
    "data.attributes.hp.value": hp,
    "data.attributes.hp.max": hp,
    "data.details.level": cLevel,
    "data.details.class": cClass,
    "data.details.race": race,
  });

  trainedSkills.forEach(async (v) => {
    let update = {};
    update[`data.skills.${v}.value`] = 5;
    console.log(v);
    console.log(update);
    await createdActor.update(update);
  });

  const powerIndex = await getIndexes("powers");
  const featIndex = await getIndexes("feats");

  powers.forEach(async (v) => {
    let id = powerIndex.find((i) => i.name === v);
    if (id) {
      await importFromAPI("powers", id.index, createdActor);
    }
  });

  feats.forEach(async (v) => {
    let id = featIndex.find((i) => i.name === v);
    if (id) {
      await importFromAPI("feats", id.index, createdActor);
    }
  });

  async function importFromAPI(itemType, id, actor) {
    const response = await window.fetch(
      `${apiLink}/content/${itemType}/${id}`,
      {
        headers: { "Content-Type": "application/json" },
        method: "GET",
      }
    );
    const feat = await response.json();
    console.log(feat);
    const item = new Item(feat);
    await actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }

  async function getIndexes(itemType) {
    const response = await window.fetch(
      `${apiLink}/content/${itemType}/indexes`,
      {
        headers: { "Content-Type": "application/json" },
        method: "GET",
      }
    );
    let indexes = await response.json();
    return indexes;
  }
}
