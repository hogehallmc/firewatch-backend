// lets specify our spreadsheet to pull data from
const sheetId = '1x5RhQWfxfx-qEgNC4a6Eb38i5FUFkXkq6YI_6DoxMHQ';
const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
const query = encodeURIComponent('Select *');
const data = [];
const fetch = require('node-fetch');

// lets not look to closely at this function, trust me, im not proud
// it simply takes the string returned by google sheet's api and turns it into a date string
function parseAlarmString(stringToParse) { 
    let cycleOne = stringToParse.split("(");
    let cycleTwo = cycleOne[1].split(")");
    let cycleThree = cycleTwo[0].split(",");

    let returnDate = new Date(cycleThree[0], cycleThree[1], cycleThree[2], cycleThree[3], cycleThree[4], cycleThree[5]);

    return returnDate;
}

// connect to the spreadsheet and pull data from a 5ticular sheet (specifed
// by the hallToFetch variable)
async function grabHallData(hallToFetch) {
    const url = `${base}&sheet=${hallToFetch}&tq=${query}`
    let dateArray = await fetch(url)
        .then(res => res.text())
        .then(rep => {

            //Remove additional text and extract only JSON:
            const jsonData = JSON.parse(rep.substring(47).slice(0, -2));

            var dateArray = [];

            // loop through all records
            for (let i = (jsonData.table.rows.length - 1); i >= 0; i--) {
                let currentRow = jsonData.table.rows[i];

                let currentAlarmDict = {};

                // should we add it to the website?
                if (currentRow.c[1].v === "y" || currentRow.c[1].v === "Y") {

                    // lets make sure the date entry actually exists
                    if (currentRow.c[0].v !== null) {
                        // add the alarm record to our return array
                        currentAlarmDict["date"] = parseAlarmString(currentRow.c[0].v);

                        // add any notes on that alarm to our return array
                        if (currentRow.c[2] !== null) {
                            currentAlarmDict["comments"] = currentRow.c[2].v;
                        } else {
                            currentAlarmDict["comments"] = null;
                        }

                        if (currentRow.c[3] !== null) {
                            if (currentRow.c[3].v === 'y' || currentRow.c[3].v === 'Y') {
                                    currentAlarmDict["includeComments"] = true;
                            } else {
                                    currentAlarmDict["includeComments"] = false;
                            }
                        } else {
                            currentAlarmDict["includeComments"] = false;
                        }
                        
                        dateArray.push(currentAlarmDict);
                    }
                }
            }

            return dateArray;
        })

    return dateArray;
}

async function retrieveAllAlarms(activeHalls) {
    let allHallData = {};
    for (let i = 0; i < activeHalls.length; i++) {
        let currentHallData = await(grabHallData(activeHalls[i]));
        allHallData[activeHalls[i]] = currentHallData;
    }
    return allHallData;
}

async function init() {
    let activeHalls = [ "Pritchard", "Hoge", "Slusher", "CID", "O Shag", "AJ", "Cochrane", "Vawter", "Johnson", "Harper", "The Hub (Apartment)" ];
    let allHallData = await(retrieveAllAlarms(activeHalls));
    let alarmData = {};

    alarmData["lastUpdate"] = new Date();
    alarmData["halls"] = allHallData;
    
    const fs = require('fs');

    fs.writeFileSync('/var/www/pritchardalarms.com/alarmdata/data.json', JSON.stringify(alarmData), err => {
    if (err) {
        console.error(err);
    }
    // file written successfully
    });

}

init();
