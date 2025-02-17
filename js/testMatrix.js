const funs = require('./index.js');
const fs = require('fs').promises;
const assert = require('assert');

const GT = '\x1b[1;32m%s\x1b[0m'; // Green Text
const GTB = '\x1b[1;32m%s\x1b[0m'; // Green Text Bold


// Test State
let resultsDoc = undefined;
let territoryMap = undefined;
// --------------------------------

exports.unitTest_GenerateTimeIntervals = function() {
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
    const slotsAsString = slots
        .map(item => item.asJsonString())
        .sort()
        .join(',');

    const jobKey = getTestKey(functionName);
    const expectedResults = resultsDoc[jobKey]['expectedResult'];
    if (expectedResults === slotsAsString) {
        return;
    } else {
        console.error(`${jobKey} failed`);
        if (matrix) {
            funs.showMatrix(matrix);
        }
        funs.showShifts(slots);
        console.log(`Expected: ${JSON.stringify(expectedResults)}\nActual  : ${slotsAsString.replaceAll('"' , '\\"')}`);
        throw new Error();
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
            console.log(`Mismatch at index ${index} (Expected followed by Actual):\nE:${element}\nA:${arr2[index]}`);
            allMatch = false;
        }
    });
    
    return allMatch;
}

function getTestKey(functionName) {
    return functionName.startsWith('exports.') ? functionName.substring(8) : functionName
}

function assertResultsStringify(results) {
 
    const callerFunction = getCallerFunctionName();
    const jobKey = getTestKey(callerFunction)

    if (JSON.stringify(results) != JSON.stringify(resultsDoc[jobKey]['expectedResult'])) {
         console.error('testSlotsToSS failed');
         console.log('Expected');
         console.log(JSON.stringify(resultsDoc['testSlotsToSS']['expectedResult']));
         console.log('Actual');
         console.log(JSON.stringify(ss));
         throw new Error();
    }
}

function matrixTest(slots) {
    const matrix = funs.slotsToMatrix(slots);
    const jobKey = getTestKey(getCallerFunctionName());
    compareTestResults(matrix, jobKey, resultsDoc[jobKey]['expectedResult']);
    // funs.showMatrix(matrix);
}

function assertTestResults(matrix) {
    const jobKey = getTestKey(getCallerFunctionName());
    const expectedResults = resultsDoc[jobKey]['expectedResult'];
    compareTestResults(matrix, jobKey, expectedResults);
}

function compareTestResults(matrix, testName, expectedResults) {
    function _compare_results(actual, expected) {
        if (actual.length != expected.length) {
            console.error('Lengths do not match');
            return false;
        }
    
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] != expected[i]) {
                console.error(`Mismatch at index ${i} - ${actual[i]} != ${expected[i]}`);
                throw new Error();
            }
        }
    
        return true;
    }
    
    if (!_compare_results(JSON.stringify(matrix), expectedResults.replaceAll('\\"', '"'))) {
        funs.showMatrix(matrix);
        console.error(`\nError: ${testName}`)
        console.error(`Expected: `);
        console.error(`${expectedResults.replaceAll('"', '\\"')} \nGot: `);
        console.error(JSON.stringify(matrix).replaceAll('"', '\\"'));
        throw new Error();
    // } else {
    //     console.log(GTB, `${testName} passed`);
    }
    return true;
}

function compareSlots(expectedSlots, actualSlots) {

    if (expectedSlots.length !== actualSlots.length) {
        console.error('Lengths do not match');
        console.error(`\nExpected: ${expectedSlots.length}`);
        for (let i = 0; i < expectedSlots.length; i++) {
            console.error(`index: ${i} | ${expectedSlots[i].toString()}`);
        }
        console.error(`\nActual: ${actualSlots.length}`);
        for (let i = 0; i < actualSlots.length; i++) {
            console.error(`index: ${i} | ${actualSlots[i].toString()}`);
        }
        throw new Error();
    }

    expected_output = '';
    actual_output = '';
    allEqual = true;
    for (let i = 0; i < expectedSlots.length; i++) {
        expected_output += expectedSlots[i].toString() + '\n';
        actual_output += actualSlots[i].toString() + '\n';
        allEqual = allEqual && (expectedSlots[i].toString() === actualSlots[i].toString());
    }

    if (!allEqual) {
        console.error('Expected:');
        console.error(expected_output);
        console.error('Actual:');
        console.error(actual_output);
        throw new Error();
    }
}

function assertSlotsEqualsExpected(slots) {
    const functionName = getCallerFunctionName();
    const jobKey = getTestKey(functionName);
    const expectedResults = resultsDoc[jobKey]['expectedResult'];

    actualResults = '';
    slots.map(item => actualResults += item.toString() + '\n');

    if (expectedResults !== actualResults) {
        console.error(`Expected: \n${expectedResults}\n\nActual: \n${actualResults}`);

        console.error('If correct, replace expected with: ');
        console.error(JSON.stringify(actualResults));
        throw new Error();
    }   
}


// ========================= Test functions =========================
// Functions should take the form: 
// exports.unitTest_<functionName> = function() { ... }
// where <functionName> is the name of the function to test
// They should take no parameters, and throw an error if the test fails
// ========================= Test functions =========================
exports.unitTest_AddSquadStart = function() {
    const slots = [
        new funs.ShiftSlot(600, 1800, 54).addSquad(squad_54).addSquad(squad_35),
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_54).addSquad(squad_35)
    ];

    assertSlotsEqualsExpected(slots);
}

exports.unitTest_AddSquadsToMatrix = function() {
    const slots = [
        new funs.ShiftSlot(600, 1800, 54).addSquad(squad_54).addSquad(squad_35),
        new funs.ShiftSlot(0, 600, 54).addSquad(squad_54).addSquad(squad_35)
    ];

    newSlots = funs.matrixToSlots(funs.slotsToMatrix(slots), territoryMap);

    assertSlotsEqualsExpected(newSlots);
}


exports.unitTest_AddSquadsNoOverlap = function() {

    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(1800, 0, 35).addSquad(squad_35));
    funs.addShift(matrix, new funs.ShiftSlot(0, 100, 43).addSquad(squad_43));

    newSlots = funs.matrixToSlots(matrix, territoryMap);

    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_AddSquadsOverlap1 = function() {
    const slots = [
        new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(0, 100, 35).addSquad(squad_43),
        new funs.ShiftSlot(100, 200, 35).addSquad(squad_42),
    ];

    newSlots = funs.matrixToSlots(funs.slotsToMatrix(slots), territoryMap);

    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_AddSecondTruck = function() {
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(1800, 600, 35).addSquad(squad_35));
    funs.addShift(matrix, new funs.ShiftSlot(0, 600, 43).addSquad(squad_43));

    newSlots = funs.matrixToSlots(matrix, territoryMap);

    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_AddSecondTruck2 = function() {
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(1800, 600, 43).addSquad(squad_43));
    funs.addShift(matrix, new funs.ShiftSlot(0, 600, 43).addSquad(squad_43));

    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}


exports.unitTest_RemoveSquads = function() {
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54));
    funs.addShift(matrix, new funs.ShiftSlot(0, 100, 35).addSquad(squad_43));
    funs.addShift(matrix, new funs.ShiftSlot(100, 200, 35).addSquad(squad_42));

    funs.removeShift(matrix, new funs.ShiftSlot(0, 100, 35).addSquad(squad_43), obliterate=true)    
    funs.removeShift(matrix, new funs.ShiftSlot(100, 200, 35).addSquad(squad_42))  

    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_SquadIterator = function() {
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

exports.unitTest_SerDe = function() {
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

exports.unitTest_IsCombinable = function() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(830, 1000, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 300, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(300, 600, 54).addSquad(squad_35).addSquad(squad_54),
    ];


    assert.equal(funs.ShiftSlot.isCombinable(slots[0], slots[1]), true);
    assert.equal(funs.ShiftSlot.isCombinable(slots[2], slots[3]), true);
    assert.equal(funs.ShiftSlot.isCombinable(slots[4], slots[5]), true);

    console.log(GTB, `testIsCombinable passed`);

}

exports.unitTest_SlotsToSS = function() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(830, 1000, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    const ss = funs.slotsToSS(slots);

    assertResultsStringify(ss);
}

exports.unitTest_JsonSerde = function() {
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

function unitTest_IncrementSquad() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(830, 1000, 54).addSquad(squad_35).addSquad(squad_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squad_35).addSquad(squad_54),
    ];

    const matrix = funs.slotsToMatrix(slots);

    funs.addShift(matrix, new funs.ShiftSlot(1800, 1830, 54).addSquad(squad_42));
    newSlots = funs.matrixToSlots(matrix, territoryMap);

    matrixTest(newSlots); 
}

exports.unitTest_TerritoryPopulationSingle = function() {
    const slots = [
        new funs.ShiftSlot(800, 830, 34).addSquad(squadNoTerr_34)
    ];

    funs.populateTerritories(slots, territoryMap);
    assertEqualSlots(slots);    
}


exports.unitTest_TerritoryPopulation = function() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(830, 1000, 42).addSquad(squadNoTerr_42).addSquad(squadNoTerr_54),

        new funs.ShiftSlot(1800, 1830, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
    ];

    funs.populateTerritories(slots, territoryMap);
    assertEqualSlots(slots); 
}

exports.unitTest_TangoPopulation = function() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(830, 1000, '').addSquad(squadNoTerr_42).addSquad(squadNoTerr_54),

        new funs.ShiftSlot(1800, 1830, 34).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
        new funs.ShiftSlot(1830, 1900, 54).addSquad(squadNoTerr_35).addSquad(squadNoTerr_54),
    ];

    funs.populateTango(slots);
    assertEqualSlots(slots);
}

exports.unitTest_TerritoriesOneSquad = function() {
    const slots = [
        new funs.ShiftSlot(800, 830, 54).addSquad(squad_35)
    ];

    funs.populateTerritories(slots, territoryMap);
    assertEqualSlots(slots);
}

exports.unitTest_TerritoriesTwoCrewsNoCrew = function() {
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54));

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35));
    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_TerritoriesThreeCrewsNoCrew = function() {
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54).addSquad(squad_43));

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35));
    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_TerritoriesTwoCrewsRemoveCrew = function() {
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54));

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35), obliterate=true);
    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_TerritoriesThreeCrewsRemoveCrew = function() {
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35).addSquad(squad_54).addSquad(squad_43));

    funs.removeShift(matrix, new funs.ShiftSlot(800, 830, 54).addSquad(squad_35), obliterate=true);
    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}

exports.unitTest_ParseSchedulePastedInput = function() {

    const schedule_input = `"0600 - 1200
(Tango:54)"	"42
[35, 42]"	"54
[34, 43, 54]"	
"1200 - 1300
(Tango:54)"	"42
['All']"	"54
['No Crew']"	
"1300 - 1600
(Tango:54)"	"42
[35, 42]"	"54
[34, 43, 54]"	
"1600 - 1800
(Tango:54)"	"42
['All']"	"54
['No Crew']"	
"1800 - 0600
(Tango:43)"	"42
[35, 42, 54]"	"43
[34, 43]"	`;

    const expected_slots = [
        new funs.ShiftSlot(600, 1200, 54)
            .addSquad(new funs.Squad(42, [35, 42], 1))
            .addSquad(new funs.Squad(54, [34, 43, 54], 1)),

        new funs.ShiftSlot(1200, 1300, 54)
        .addSquad(new funs.Squad(42, [34,35,42,43,54], 1))
        .addSquad(new funs.Squad(54, [], 0)),

        new funs.ShiftSlot(1300, 1600, 54)
        .addSquad(new funs.Squad(42, [35, 42], 1))
        .addSquad(new funs.Squad(54, [34, 43, 54], 1)),

        new funs.ShiftSlot(1600, 1800, 54)
        .addSquad(new funs.Squad(42, [34,35,42,43,54], 1))
        .addSquad(new funs.Squad(54, [], 0)),

        new funs.ShiftSlot(1800, 600, 43)
        .addSquad(new funs.Squad(42, [35, 42, 54], 1))
        .addSquad(new funs.Squad(43, [34, 43], 1))
    ];


    const result = funs.parseSchedulePastedInput(schedule_input);
    if (compareArrays(expected_slots, result)) {
        console.log(GTB, 'testParseSchedulePastedInput passed');
    } else {
        console.error('testParseSchedulePastedInput failed');
    }
}

exports.unitTest_SSSerDe = function() {
    const schedule_input = `"0600 - 1200
(Tango:54)"	"42
[35, 42]"	"54
[34, 43, 54]"	
"1200 - 1300
(Tango:54)"	"42
['All']"	"54
['No Crew']"	
"1300 - 1600
(Tango:54)"	"42
[35, 42]"	"54
[34, 43, 54]"	
"1600 - 1800
(Tango:54)"	"42
['All']"	"54
['No Crew']"	
"1800 - 0600
(Tango:43)"	"42
[35, 42, 54]"	"43
[34, 43]"	`;

    const result = funs.parseSchedulePastedInput(schedule_input);
    const actual = funs.slotsToSS(result)

    if (schedule_input === actual) {
        console.log(GTB, 'testSSSerDe passed');
    } else {
        console.log(`Expected: |${JSON.stringify(schedule_input)}|`);
        console.log(`\nActual  : |${JSON.stringify(actual)}|`);
        console.log('testSSSerDe failed');
    }

}

exports.unitTest_Squad = function() {
    const squad = new funs.Squad(42, [35, 42], 1);
    assert.equal(squad.toString(), 'Squad: 42 (trk=1) covering [35,42]');

    const squad2 = new funs.Squad(42);
    assert.equal(squad2.toString(), 'Squad: 42 (trk=1) covering []');

    const squad3 = new funs.Squad(42, [], number_of_trucks=0);
    assert.equal(squad3.toString(), 'Squad: 42 (trk=0) covering []');
}

exports.unitTest_AddLast2Hours = function() {
    const slots = [
        new funs.ShiftSlot(1800, 300, 35).addSquad(squad_35).addSquad(squad_54),
        new funs.ShiftSlot(300, 600, 54).addSquad(squad_54)
    ];

    const matrix = funs.slotsToMatrix(slots);

    funs.addShift(matrix, new funs.ShiftSlot(300, 600, 35).addSquad(squad_35));
    newSlots = funs.matrixToSlots(matrix, territoryMap);

    const expected = [
        new funs.ShiftSlot(1800, 600, 35).addSquad(squad_35).addSquad(squad_54)
    ];

    compareSlots(expected, newSlots);        
}

exports.unitTest_CrossBoundary = function() {
    /**
     * 
     * Create two shifts, full day and full night.  Same squads and tango
     * Should preserve the shift boundary
     * 
     * 0600 - 1800 35, 54 (35 Tango)
     * 1800 - 0600 35, 54 (35 Tango)
     *
     * Should not combine
     * 
     */
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(600, 1800, 54).addSquad(squad_35).addSquad(squad_54));
    funs.addShift(matrix, new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54));

    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}


exports.unitTest_RemoveShiftScenario1 = function() {
    /**
     * Test scenario:
     * On a Saturday, we have two shifts that are the same crews: 
     * 0600 - 1800 35, 54
     * 1800 - 0600 35, 54
     * 
     * We get a request to remove 35 from the hours of 0300 - 0600
     * The system has to be smart enough to realize that this applies to the 2nd shift, morning (which is actually the next day)
     */
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(600, 1800, 54).addSquad(squad_35).addSquad(squad_54));
    funs.addShift(matrix, new funs.ShiftSlot(1800, 600, 54).addSquad(squad_35).addSquad(squad_54));

    funs.removeShift(matrix, new funs.ShiftSlot(300, 600).addSquad(squad_35));
    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}


exports.unitTest_RemoveShiftScenario2 = function() {

    /**
     * Removing squad that is Tango
     * Test scenario:
     * On a Saturday, we have two shifts that are the same crews: 
     * 0600 - 1800 35, 54
     * 1800 - 0600 35, 54
     * 
     * We get a request to remove 35 from the hours of 0300 - 0600
     * The system has to be smart enough to realize that this applies to the 2nd shift, morning (which is actually the next day)
     */
    matrix = funs.slotsToMatrix([], territoryMap);   
    funs.addShift(matrix, new funs.ShiftSlot(600, 1800, 35).addSquad(squad_35).addSquad(squad_54));
    funs.addShift(matrix, new funs.ShiftSlot(1800, 600, 35).addSquad(squad_35).addSquad(squad_54));

    funs.removeShift(matrix, new funs.ShiftSlot(300, 600).addSquad(squad_35));
    newSlots = funs.matrixToSlots(matrix, territoryMap);
    assertSlotsEqualsExpected(newSlots);
}

// -----------------------

// Get all function names from the current file that start with unitTest_
function getFunctionNames() {
    const fs = require('fs');
    const fileContent = fs.readFileSync(__filename, 'utf8');
    const functionPattern = /exports\.(unitTest_[a-zA-Z0-9_$]*)\s*=/g;
    const matches = fileContent.matchAll(functionPattern);
    const functionNames = [];
    
    for (const match of matches) {
        if (match[1]) functionNames.push(match[1]);
    }
    
    return functionNames;
}

// Execute all unit tests
function runUnitTests() {
    const testFunctions = getFunctionNames();
    console.log("Found test functions:", testFunctions);
    
    testFunctions.forEach(functionName => {
        try {
            console.log(GTB, `\n Running ${functionName}...`);
            // Call the function from our exported object
            exports[functionName]();
            console.log(`✅ ${functionName} completed successfully`);
        } catch (error) {
            console.error(`❌ ${functionName} failed:`, error);
        }
    });
}

// Example test functions - make sure to export them
exports.unitTest_example1 = function() {
    console.log("Testing example 1");
    if (2 + 2 !== 4) throw new Error("Math is broken!");
};

exports.unitTest_example2 = function() {
    console.log("Testing example 2");
    if (10 - 5 !== 5) throw new Error("Subtraction is broken!");
};

// Run all tests
// runUnitTests();
// -----------------------


// ==== Main =====
readTestState('/Users/gnowakow/Projects/website/collab-calendar-remote/js/expectedResults.json', '/Users/gnowakow/Projects/website/collab-calendar-remote/data/territories.tsv')
    .then(() => {
        // runTests();
        runUnitTests();
        console.log(GT, 'All tests passed');
    });
