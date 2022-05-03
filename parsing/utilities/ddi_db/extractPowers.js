import sqlite3 from "sqlite3";
import fs from "fs";
let query = `SELECT * FROM Power;`;
let featquery = `SELECT * FROM Feat;`;
let db = new sqlite3.Database("./ddi.db", sqlite3.OPEN_READWRITE, (err) => {});
let output = [];
async function extract(row) {
  let json = await JSON.parse(row.JSON);
  output.push(json);
}
db.each(featquery, (err, row) => {
  extract(row);
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(10000);
let data = JSON.stringify(output);
fs.writeFileSync("./feat_output.json", data);
