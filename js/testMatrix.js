const { get } = require('http');
const funs = require('./index.js');
const fs = require('fs').promises;
const assert = require('assert');

const GT = '\x1b[1;32m%s\x1b[0m'; // Green Text
const GTB = '\x1b[1;32m%s\x1b[0m'; // Green Text Bold


// Test State
let resultsDoc = undefined;
let territoryMap = undefined;
// --------------------------------

function testGenerateTimeIntervals() {
    const intervals = funs.generateTimeIntervals(600, 1200);
    const expected = 12;
    if (intervals.length !== expected) {
        console.error(`Error: testGenerateTimeIntervals Expected: ${expected} Actual: ${intervals.length}`);
    }
}

const squad_35 = new funs.Squad(35, [35, 43], 1);
const squad_42 = new funs.Squad(42, [42], 1);
const squad_43 = new funs.Squad(43, [43], 1);
const squad_54 = new funs.Squad(54, [34,42,54], 1);

const squadNoTerr_34 = new funs.Squad(34, [], 1);
const squadNoTerr_35 = new funs.Squad(35, [], 1);
const squadNoTerr_42 = new funs.Squad(42, [], 1);
const squadNoTerr_43 = new funs.Squad(43, [], 1);
const squadNoTerr_54 = new funs.Squad(54, [], 1);

async function readJsonFile(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

async function readFile(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return data;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}


async function readTestState(expectedResultsFile, territoriesFile) {
    resultsDoc = await readJsonFile(expectedResultsFile);
    territoryMap = funs.buildTeamMap(await readFile(territoriesFile));
}

function getCallerFunctionName() {
    const err = new Error();
    const stack = err.stack.split('\n');
    // stack[0] is 'Error'
    // stack[1] is current function
    // stack[2] is caller function
    return stack[3].trim().split(' ')[1];
}

function assertEqualSlots(slots, matrix) {
    const functionName = getCallerFunctionName();
    // console.log(GT, `assertEqualSlots called from: ${functionName}`);
    const slotsAsString = slots
        .map(item => item.asJsonString())
        .sort()
        .join(',');

    const expectedResults = resultsDoc[functionName]['expectedResult'];
    if (expectedResults === slotsAsString) {
        console.log(GTB, `${functionName} passed`);
    } else {
        console.error(`${functionName} failed`);
        if (matrix) {
            funs.showMatrix(matrix);
        }
        funs.showShifts(slots);
        console.log(`Expected: ${JSON.stringify(expectedResults)}\nActual: \n`);
        console.log(slotsAsString.replaceAll('"' , '\\"'));
    }
}

function compareArrays(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        console.log(`Arrays have different lengths: ${arr1.length} vs ${arr2.length}`);
        for (let i = 0; i < arr1.length; i++) {
            console.log(`arr1[${i}]: ${arr1[i]}`);
        }
        console.log('---------');
        for (let i = 0; i < arr2.length; i++) {
            console.log(`arr2[${i}]: ${arr2[i]}`);
        }
        return false;
    }
    
    let allMatch = true;
    arr1.forEach((element, index) => {
        if (element.toString() !== arr2[index].toString()) {
            console.log(`Mismatch at index ${index}: ${element} !== ${arr2[index]}`);
            allMatch = false;
        }
    });
    
    return allMatch;
}



// function invokeTest(testName) {
//     if (resultsDoc) {
//         global[testName](resultsDoc[testName]['expectedResult']);
//         return;
//     } else {   
//         readJsonFile('/Users/gnowakow/Projects/website/collab_calendar/js/expectedResults.json')
//             .then(data => {
//                 resultsDoc = data;
//                 global[testName](data[testName]['expectedResult']);
//             });
//     }
// }

// function invokeTest(testName) {
//     if (resultsDoc) {
//         global[testName](resultsDoc[testName]['expectedResult']);
//         return;
//     }
// }
// function invoke(functionName) {
//     const functionToCall = global[functionName];
    
//     if (typeof functionToCall !== 'function') {
//         throw new Error(`Function ${functionName} is not defined`);
//     }
//     functionToCall(territoryMap, resultsDoc[functionName]['expectedResult'])
// }

// async function invoke(functionName, expectedResultsFile, territoriesFile = null) {
//     try {
//         // Read the expected results file
//         const expectedResults = await readJsonFile(expectedResultsFile);

//         // console.log(GT, `Running test: ${functionName} ${JSON.stringify(expectedResults)}`);
        
//         // Get the function to call by name (assuming it's defined in global scope)
//         const functionToCall = global[functionName];
        
//         if (typeof functionToCall !== 'function') {
//             throw new Error(`Function ${functionName} is not defined`);
//         }

//         // If territoriesFile is provided, read it and call function with both parameters
//         if (territoriesFile) {
//             const data = await readFile(territoriesFile);
//             const territoryMap = funs.buildTeamMap(data);
//             console.log(GT, `Territories: ${territories}`);
//             functionToCall(territoryMap, expectedResults[functionName]['expectedResult'])
//             return;
//         } else {
//             // Call function with single parameter
//             functionToCall(expectedResults[functionName]['expectedResult'])
//             return;
//         }
//     } catch (error) {
//         console.error('Error in processFiles:', error);
//         throw error;
//     }
// }

function compare_results(actual, expected) {
    if (actual.length != expected.length) {
        console.error('Lengths do not match');
        return false;
    }

    for (let i = 0; i < actual.length; i++) {
        if (actual[i] != expected[i]) {
            console.error(`Mismatch at index ${i} - ${actual[i]} != ${expected[i]}`);
            return false;
        }
    }

    return true;
}

function matrixTest(slots, testName, expectedResults) {
    const matrix = funs.slotsToMatrix(slots);
    compareTestResults(matrix, testName, expectedResults);
}

function compareTestResults(matrix, testName, expectedResults) {
    if (!compare_results(JSON.stringify(matrix), expectedResults.replaceAll('\\"', '"'))) {
        funs.showMatrix(matrix);
        console.error(`\nError: ${testName}`)
        console.error(`Expected: `);
        console.error(`${expectedResults.replaceAll('"', '\\"')} \nGot: `);
        console.error(JSON.stringify(matrix).replaceAll('"', '\\"'));
    } else {
        console.log(GTB, `${testName} passed`);
    }
}


// ========================= Test functions =========================
// ========================= Test functions =========================
function testAddSquadStart() {
    const slot = new funs.ShiftSlot(600, 800, 54).addSquad(squad_54).addSquad(squad_35);

    matrixTest([slot], 'testAddSquadStart', resultsDoc['testAddSquadStart']['expectedResult']);
}

function testAddSquadEnd() {
    const slot = new funs.ShiftSlot(530, 600, 54).addSquad(squad_35).addSquad(squad_54);

    matrixTest([slot], 'testAddSquadEnd', resultsDoc['testAddSquadEnd']['expectedResult']);
}

function testAddSquads1() {
    // 1800 - 0000 35, 54
    // 0000 - 0100 35
    // 0100 - 0200 35, 43
    // 0200 - 0600 35, 42
    const slots = [
        new funs.ShiftSlot(1800, 0, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_35),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_35).addSquad(squad_43),
        new funs.ShiftSlot(200, 600, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    matrixTest(slots, 'testAddSquads1', resultsDoc['testAddSquads1']['expectedResult']);
}

function testAddSquadsOverlap1() {
    const slots = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_43),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42),
    ];

    matrixTest(slots, 'testAddSquadsOverlap1', resultsDoc['testAddSquadsOverlap1']['expectedResult']);
}


function testAddSecondTruck() {
    const slots = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1800, 500, 54).addSquad(squad_54)
    ];

    matrixTest(slots, 'testAddSecondTruck', resultsDoc['testAddSecondTruck']['expectedResult']);
}


function testRemoveSquads() {
    const slots = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_43),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42),
    ];

    const matrix = funs.slotsToMatrix(slots);
    funs.removeShift(matrix, new funs.ShiftSlot(0, 100, 35).addSquad(squad_43), obliterate=true)    
    funs.removeShift(matrix, new funs.ShiftSlot(100, 200, 35).addSquad(squad_42))  

    compareTestResults(matrix, arguments.callee.name, resultsDoc['testRemoveSquads']['expectedResult']);
}

function testSquadIterator() {
    const slot = new funs.ShiftSlot(1800, 600, 54).addSquad(squad_42).addSquad(squad_35).addSquad(squad_54);

    results = [];
    const iterator = slot.squadIterator;
    let next = iterator.next();
    while (!next.done) {
        // console.log(next.value);
        results.push(next.value.call_id)
        next = iterator.next();
    }

    if (compareArrays(results, [35, 42, 54])) {
        console.log(GTB, `testSquadIterator passed`);
    } else {
        console.error('testSquadIterator failed');
    }
}

function testSerDe() {
    const slots_1 = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_43),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42),
    ];

    const expected_slots_1 = [
        new funs.ShiftSlot(1800, 0, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(new funs.Squad(43, [34,43], 1)).addSquad(new funs.Squad(35, [35,42], 1)).addSquad(new funs.Squad(54, [54], 1)),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42).addSquad(squad_35).addSquad(new funs.Squad(54, [34,54], 1)),
        new funs.ShiftSlot(200, 600, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    const modSlots = funs.matrixToSlots(
        funs.slotsToMatrix(slots_1), territoryMap);

    if (compareArrays(expected_slots_1, modSlots)) {
        console.log(GTB, `testSerDe passed`);
    } else {
        console.error('testSerDe failed');
    }
}

function testIsCombinable() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(830, 1000, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    assert.equal(funs.ShiftSlot.isCombinable(slots[0], slots[1]), true);
    assert.equal(funs.ShiftSlot.isCombinable(slots[2], slots[3]), true);

    console.log(GTB, `testIsCombinable passed`);

}

function testSlotsToSS() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(830, 1000, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    const ss = funs.slotsToSS(slots);

    if (JSON.stringify(ss) != JSON.stringify(resultsDoc['testSlotsToSS']['expectedResult'])) {
        console.error('testSlotsToSS failed');
        console.log('Expected');
        console.log(JSON.stringify(resultsDoc['testSlotsToSS']['expectedResult']));
        console.log('Actual');
        console.log(JSON.stringify(ss));
    } else {
        console.log(GTB, `testSlotsToSS passed`);
    }
}

function testJsonSerde() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(830, 1000, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    const collection = new funs.ShiftSlotCollection();

    slots.forEach(shift => {
        collection.addShiftSlot(shift);
    });

    const serializedCollection = collection.asJsonString();

    const collectionFromJson = funs.ShiftSlotCollection.fromJsonString(serializedCollection);

    const shifts = collectionFromJson.shiftSlots;

    for (let i = 0; i < shifts.length; i++) {
        assert.equal(shifts[i].toString(), slots[i].toString());
    }

    console.log(GTB, `testJsonSerde passed`);
}

function incrementSquad() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(830, 1000, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    const matrix = funs.slotsToMatrix(slots);

    funs.addShift(matrix, new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_42));
    newSlots = funs.matrixToSlots(matrix, territoryMap);

    matrixTest(newSlots, 'incrementSquad', resultsDoc['incrementSquad']['expectedResult']); 
}

function testTerritoryPopulationSingle() {
    const slots = [
        new funs.ShiftSlot(800, 830, 34).addSquad(squadNoTerr_34)
    ];

    funs.populateTerritories(slots, territoryMap);
    assertEqualSlots(slots);    
}

function testTerritoryPopulation() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(830, 1000, 42).addSquad(squadNoTerr_42).addSquad(squadNoTerr_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
    ];

    funs.populateTerritories(slots, territoryMap);
    assertEqualSlots(slots); 
}

function testTangoPopulation() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(830, 1000, '').addSquad(squadNoTerr_42).addSquad(squadNoTerr_54),

        new funs.ShiftSlot(1800, 1830, 34).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
    ];

    funs.populateTango(slots);
    assertEqualSlots(slots);
}

function testTerritoriesOneSquad() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35)
    ];

    funs.populateTerritories(slots, territoryMap);
    assertEqualSlots(slots);
}

function testTerritoriesTwoCrewsNoCrew() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54)
    ];
    
    const matrix = funs.slotsToMatrix(slots);

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35));
    newSlots = funs.matrixToSlots(matrix, territoryMap);

    assertEqualSlots(newSlots, matrix);
}

function testTerritoriesThreeCrewsNoCrew() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54).addSquad(squad_43)
    ];
    
    const matrix = funs.slotsToMatrix(slots);

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35));
    newSlots = funs.matrixToSlots(matrix, territoryMap);

    assertEqualSlots(newSlots, matrix);
}

function testTerritoriesTwoCrewsRemoveCrew() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54)
    ];
    
    const matrix = funs.slotsToMatrix(slots);

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35), obliterate=true);
    newSlots = funs.matrixToSlots(matrix, territoryMap);

    assertEqualSlots(newSlots, matrix);
}

function testTerritoriesThreeCrewsRemoveCrew() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54).addSquad(squad_43)
    ];
    
    const matrix = funs.slotsToMatrix(slots);

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35), obliterate=true);
    newSlots = funs.matrixToSlots(matrix, territoryMap);

    assertEqualSlots(newSlots, matrix);
}


// Run the tests!!!!
function runTests() {

    testGenerateTimeIntervals();
    testSquadIterator();

    testAddSquadStart();
    testAddSquadEnd();
    testAddSquads1();
    testAddSquadsOverlap1();
    testRemoveSquads();
    testAddSecondTruck();
    incrementSquad();
    testTerritoryPopulationSingle();
    testTerritoryPopulation();
    testTangoPopulation();

    testIsCombinable();
    testSerDe();
    testSlotsToSS();
    testJsonSerde();
    testTerritoriesOneSquad();
    testTerritoriesTwoCrewsNoCrew();
    testTerritoriesThreeCrewsNoCrew();
    testTerritoriesTwoCrewsRemoveCrew();
    testTerritoriesThreeCrewsRemoveCrew();
}


// ==== Main =====
readTestState('/Users/gnowakow/Projects/website/collab_calendar/js/expectedResults.json', '/Users/gnowakow/Projects/website/collab_calendar/data/territories.tsv')
    .then(() => {
        runTests();
        console.log(GT, 'All tests passed');
    });
