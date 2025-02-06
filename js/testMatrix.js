const funs = require('./index.js');
const fs = require('fs').promises;
const assert = require('assert');

const GT = '\x1b[1;32m%s\x1b[0m'; // Green Text
const GTB = '\x1b[1;32m%s\x1b[0m'; // Green Text Bold

function testGenerateTimeIntervals() {
    const intervals = funs.generateTimeIntervals(600, 800);
    console.log(intervals);
    if (intervals.length !== 4) {
        console.error('Error: testGenerateIntervals');
    }
}

const squad_35 = new funs.Squad(35, [35, 43], 1);
const squad_42 = new funs.Squad(42, [42], 1);
const squad_43 = new funs.Squad(43, [43], 1);
const squad_54 = new funs.Squad(54, [34,42,54], 1);


async function readJsonFile(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

let resultsDoc = undefined

function invokeTest(testName) {
    if (resultsDoc) {
        global[testName](resultsDoc[testName]['expectedResult']);
        return;
    } else {   
        readJsonFile('/Users/gnowakow/Projects/website/collab_calendar/js/expectedResults.json')
            .then(data => {
                resultsDoc = data;
                global[testName](data[testName]['expectedResult']);
            });
    }
}

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

function testAddSquadStart(expectedResults) {
    const slot = new funs.ShiftSlot(600, 800, 54).addSquad(squad_54).addSquad(squad_35);

    matrixTest([slot], 'testAddSquadStart', expectedResults);
}

function testAddSquadEnd(expectedResults) {
    const slot = new funs.ShiftSlot(530, 600, 54).addSquad(squad_35).addSquad(squad_54);

    matrixTest([slot], 'testAddSquadEnd', expectedResults);
}

function testAddSquads1(expectedResults) {
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

    matrixTest(slots, 'testAddSquads1', expectedResults);
}

function testAddSquadsOverlap1(expectedResults) {
    const slots = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_43),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42),
    ];

    matrixTest(slots, 'testAddSquadsOverlap1', expectedResults);
}


function testAddSecondTruck(expectedResults) {
    const slots = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1800, 500, 54).addSquad(squad_54)
    ];

    matrixTest(slots, 'testAddSecondTruck', expectedResults);
}


function testRemoveSquads(expectedResults) {
    const slots = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_43),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42),
    ];

    const matrix = funs.slotsToMatrix(slots);
    funs.removeShift(matrix, new funs.ShiftSlot(0, 100, 35).addSquad(squad_43), obliterate=true)    
    funs.removeShift(matrix, new funs.ShiftSlot(100, 200, 35).addSquad(squad_42))    
    compareTestResults(matrix, arguments.callee.name, expectedResults);
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
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_43).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(200, 600, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    const matrix = funs.slotsToMatrix(slots_1);

    const modSlots = funs.matrixToSlots(matrix);

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

    console.log(ss);
}


// ========================= Export functions =========================
global.testAddSquadStart = testAddSquadStart;
global.testAddSquadEnd = testAddSquadEnd;
global.testAddSquads1 = testAddSquads1;
global.testAddSquadsOverlap1 = testAddSquadsOverlap1;
global.testAddSecondTruck = testAddSecondTruck;
global.testRemoveSquads = testRemoveSquads;
// ========================= Run tests =========================

// Run the tests!!!!
// testGenerateTimeIntervals();
// testSquadIterator();

// invokeTest('testAddSquadStart');
// invokeTest('testAddSquadEnd');
// invokeTest('testAddSquads1');
// invokeTest('testAddSquadsOverlap1');
// invokeTest('testRemoveSquads');
// invokeTest('testAddSecondTruck');
// testIsCombinable();
// testSerDe();
testSlotsToSS();