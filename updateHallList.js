// lets specify our spreadsheet to pull data from
const sheetId = '1x5RhQWfxfx-qEgNC4a6Eb38i5FUFkXkq6YI_6DoxMHQ';
const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
const query = encodeURIComponent('Select *');
const fetch = require('node-fetch');

// get the current semester start date
async function getHallList() {
    const url = `${base}&sheet=Website%20Control%20Panel&tq=${query}`
    let hallList = await fetch(url)
        .then(res => res.text())
        .then(rep => {

          //Remove additional text and extract only JSON:
          const jsonData = JSON.parse(rep.substring(47).slice(0, -2));

          let numOfHalls = (jsonData.table.rows.length - 1);
          let hallList = {};

          for (let i = 1; i <= numOfHalls; i++) {
            let currentRow = jsonData.table.rows[i];
            let currentHall = {}

            currentHall['name'] = currentRow.c[0].v;
            currentHall['img'] = currentRow.c[2].v;

            if (currentRow.c[3] !== null) {
              currentHall['imgCredit'] = currentRow.c[3].v;
            } else {
              currentHall['imgCredit'] = null;
            }

            hallList[currentRow.c[1].v] = currentHall
          }

          return hallList
        })
    
    return hallList;
}

async function init() {
  let hallList = await(getHallList());

  const fs = require('fs');

  fs.writeFileSync('hallList.json', JSON.stringify(hallList), err => {
  if (err) {
      console.error(err);
  }
  // file written successfully
  });
}

init();