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

// get the current semester start date
async function getSemesterStartDate() {
    const url = `${base}&sheet=Hall%20List&tq=${query}`
    let dateArray = await fetch(url)
        .then(res => res.text())
        .then(rep => {

            //Remove additional text and extract only JSON:
            const jsonData = JSON.parse(rep.substring(47).slice(0, -2));

            let currentRow = jsonData.table.rows[0];
            semesterStartDate = parseAlarmString(currentRow.c[4].v);
        })
    
    return semesterStartDate;
}


function sortAlarmEntry(dateArray, currentDate, semesterStartDate, currentRow) {
    let currentAlarmDict = {};

    // add the alarm record to our return array
    currentAlarmDict["date"] = currentDate;

    // add any notes on that alarm to our return array
    if (currentRow.c[2] !== null) {
        currentAlarmDict["comments"] = currentRow.c[2].v;
    } else {
        currentAlarmDict["comments"] = null;
    }

    if (currentRow.c[3] !== null && (currentRow.c[3].v === 'y' || currentRow.c[3].v === 'Y')) {
            currentAlarmDict["includeComments"] = true;
    } else {
            currentAlarmDict["includeComments"] = false;
    }

    if (currentDate >= semesterStartDate) {
        currentAlarmDict['thisSemster'] = true;
    } else {
        currentAlarmDict['thisSemster'] = false;
    }
    
    dateArray.push(currentAlarmDict);
    

    return dateArray;
}

// connect to the spreadsheet and pull data from a 5ticular sheet (specifed
// by the hallToFetch variable)
async function grabHallData(hallToFetch, semesterStartDate) {
    const url = `${base}&sheet=${hallToFetch}&tq=${query}`
    let currentSemesterAlarms = await fetch(url)
        .then(res => res.text())
        .then(rep => {

            //Remove additional text and extract only JSON:
            const jsonData = JSON.parse(rep.substring(47).slice(0, -2));

            var currentSemesterAlarms = [];

            // loop through all records
            for (let i = (jsonData.table.rows.length - 1); i >= 0; i--) {
                let currentRow = jsonData.table.rows[i];
                
                // should we add it to the website?
                if (currentRow.c[1] !== null && (currentRow.c[1].v === "y" || currentRow.c[1].v === "Y")) {
                    // lets make sure the date entry actually exists
                    if (currentRow.c[0].v !== null) {
                        let currentDate = parseAlarmString(currentRow.c[0].v);

                        // add the alarm to our all time alarms list
                        currentSemesterAlarms = sortAlarmEntry(currentSemesterAlarms, currentDate, semesterStartDate, currentRow);

                        // did the alarm happen this semester?
                        
                       
                    }
                }

            }

            return currentSemesterAlarms;
        })

    return currentSemesterAlarms;
}

async function retrieveAllAlarms(activeHalls, semesterStartDate) {
    let allHallData = {};
    for (let i = 0; i < activeHalls.length; i++) {
        let currentSemesterAlarms = await(grabHallData(activeHalls[i], semesterStartDate));
        allHallData[activeHalls[i]] = currentSemesterAlarms;
    }
    return allHallData;
}

async function init() {
    let activeHalls = [ "AJ", "Campbell", "Cochrane", "CID", "Eggleston", "GLC", "Harper", "Hillcrest", "Hoge", "Johnson", "Miles", "New Hall West", "New Hall East", "Newman", "O Shag", "Payne", "Pearson East", "Pearson West", "Peddrew-Yates", "Pritchard", "Slusher", "Vawter", "Whitehurst" ];
    let semesterStartDate = await(getSemesterStartDate());
    let allHallData = await(retrieveAllAlarms(activeHalls, semesterStartDate));
    let alarmData = {};

    alarmData["lastUpdate"] = new Date();
    alarmData["halls"] = allHallData;
    
    const fs = require('fs');

    fs.writeFileSync('data.json', JSON.stringify(alarmData), err => {
    if (err) {
        console.error(err);
    }
    // file written successfully
    });

}

init();