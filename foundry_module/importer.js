const apiLink = `https://api.marchingwest.com`;

let itemType = "";
let contentIndexes = [];
window.getContentType = async function (selectObject) {
  let value = selectObject.value;
  itemType = value;
  $("#myInput").val("");
  $("#filteredList").empty();
  contentIndexes = await getIndexes(value);
};

window.handleSearch = function () {
  $("#filteredList").empty();
  let filteredItems = contentIndexes.filter((i) => {
    return i.name.toLowerCase().includes(
      document.getElementById("myInput").value.toLowerCase()
    );
  });
  if (filteredItems.length < 100) {
    for (let f of filteredItems) {
      $("#filteredList").append(`
<tr>
<td>
                <div style="margin: 10px; display: block">
                <div onClick="importFromAPI(${f.index})" style="display: inline; color: #444; border: 1px solid #ccc;
                background: #ddd; box-shadow: 0 0 5px -1px rgba(0, 0, 0, 0.2); cursor: pointer; vertical-align: middle;
                max-width: 100px; padding: 5px; margin: 5px; text-align: center;">
                Import 
                </div>
                ${f.name}
                </div>
</div>
</td>
</tr>
            `);
    }
  }
};

window.importFromAPI = async function (id) {
  const response = await window.fetch(`${apiLink}/content/${itemType}/${id}`, {
    headers: { "Content-Type": "application/json" },
    method: "GET",
  });
  const feat = await response.json();
  if (itemType === "monster") {
    let i = await Actor.create({ name: "test", type: "NPC" });
    game.actors.getName("test").importFromJSON(JSON.stringify(feat));
  } else {
    let i = await Item.create({ name: "test", type: "equipment" });
    game.items.getName("test").importFromJSON(JSON.stringify(feat));
  }
};

async function getIndexes(itemType) {
  const response = await window.fetch(
    `${apiLink}/content/${itemType}/indexes`,
    {
      headers: { "Content-Type": "application/json" },
      method: "GET",
    }
  );
  let indexes = await response.json();
  console.log(indexes)
  return indexes;
}

new Dialog(
  {
    title: `Content Import`,
    content: `<div class="inputcontainer" style="width: 95%; height:500px; overflow: scroll; margin: 10px;">
    <select id = "getContent" onchange = "getContentType(this)" style="margin-bottom: 5px;">
    <option value="">Select the type of content to import...</option>
    <option value="powers">Power</option>
    <option value="feat">Feat</option>
    <option value="armor">Armor</option>
    <option value="weapons">Weapon</option>
    <option value='item'>Item</option>
    <option value='monsters'>Monster</option>
  </select >
  
  <div style="margin-bottom:10px; margin-right:10px;">
  <input type="text" id="myInput" onkeyup="handleSearch()" placeholder="Search for content..." title="Type in a name">
  </div>
    <table id="filteredList"></table>
</div>
      `,
    buttons: {
      confirm: {
        label: `Close`,
        default: true,
      },
    },
  },
  { width: 500 }
).render(true);
