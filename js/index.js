
class Squad {
    constructor(call_id, territories_covered, number_of_trucks=1, is_first_responder=false) {
        this.call_id = call_id;
        this.territories_covered = territories_covered;
        this.number_of_trucks = number_of_trucks;
        this.is_first_responder = is_first_responder;
    }

    static fromInstance(instance) {
        return new Squad(
            instance.call_id,
            instance.territories_covered?.slice(),
            instance.number_of_trucks,
            instance.is_first_responder
        );
    }

    static fromJson(json) {
        return new Squad(
            json.call_id,
            json.territories_covered,
            json.number_of_trucks,
            json.is_first_responder
        );
    }

    // Optional: Add getters and setters
    get callId() {
        return this.call_id;
    }

    get territoriesCovered() {
        return this.territories_covered;
    }

    get numberOfTrucks() {
        return this.number_of_trucks;
    }

    get isFirstResponder() {
        return this.is_first_responder;
    }

    toString() {
        return `${this.call_id} (trk=${this.number_of_trucks}) covering [${this.territories_covered}]`;
    }

    asJsonString() {
        return {
            call_id: this.call_id,
            territories_covered: this.territories_covered,
            number_of_trucks: this.number_of_trucks,
            is_first_responder: this.is_first_responder
        };
    }
}

class ShiftSlot {
    constructor(startTime, endTime, tango) {
        this._startTime = startTime;
        this._endTime = endTime;
        this._tango = tango;
    }

    modifySquadTerritories(squadTerritoryMap) {
        if (squadTerritoryMap === undefined) {
            throw new Error('Invalid squadTerritoryMap provided.  Exiting.');
        }
        this._squads.forEach(squad => {
            if (squad.number_of_trucks === 0) {
                squad.territories_covered = ['No Crew'];
            } else {
                if (!squadTerritoryMap.has(String(squad.call_id))) {
                    console.log(`Error: Squad ${squad.call_id} not found in territory map.  Exiting.`);
                    throw new Error(`Squad ${squad.call_id} not found in territory map.  Exiting.`);
                }
                squad.territories_covered = squadTerritoryMap.get(String(squad.call_id));
            }
        });
    }

    // Getters
    get startTime() {
        return this._startTime;
    }

    get endTime() {
        return this._endTime;
    }

    get tango() {
        return this._tango;
    }

    // Optional: Add methods to modify the fields
    set startTime(time) {
        this._start_time = parseInt(time);
    }

    set endTime(time) {
        this._endTime = parseInt(time);
    }

    set tango(tango) {
        this._tango = tango;
    }

    get numberOfTrucks() {
        let total = 0;
        this._squads?.forEach(squad => total += squad.number_of_trucks);
        return total;
    }

    get numberOfSquads() {
        return this._squads?.size || 0;
    }

    get squads() {
        // Returns a copy of the map!
        return new Map(this._squads);
    }

    get squadIterator() {

        /**
         * Example of how to iterate: 
         * 
         *     
            let next = iterator.next();
            while (!next.done) {
                // console.log(next.value);
                next = iterator.next();
            }
         */

        if (this._squads === undefined) {
            return {
                next: function() {
                    return { done: true };
                }
            };
        }

        // Sort by keys and get values
        const sortedEntries = [...this._squads.entries()]
            .sort((a, b) => a[0] - b[0])  // Sort by keys
            .map(entry => entry[1]);       // Get just the values
        
        let index = 0;

        return {
            next: function() {
                if (index < sortedEntries.length) {
                    return { value: sortedEntries[index++], done: false };
                } else {
                    return { done: true };
                }
            }
        };
    }

    toString() {
        let asString = `ShiftSlot ${padToFour(this.startTime)} - ${padToFour(this.endTime)} (Tango: ${this.tango})`;
        
        const iter = this.squadIterator;
        let next = iter.next();
        while (!next.done) {
            const squad = next.value;
            asString += `|${squad}`;
            next = iter.next();
        }

        return asString;
    }

    asJsonString() {
        let squads = [];
        const iter = this.squadIterator;
        let next = iter.next();
        while (!next.done) {
            squads.push(next.value.asJsonString());
            next = iter.next();
        }

        return JSON.stringify({
            startTime: this.startTime,
            endTime: this.endTime,
            tango: this.tango,
            squads: squads
        });
    }


    addSquad(squad) {
        // Add the squad to a map, or just increment the number of trucks
        // Saves a copy (not a reference)!
        if (this._squads === undefined) {
            this._squads = new Map();
        }
        if (this._squads.has(squad.call_id)) {
            this._squads.get(squad.call_id).number_of_trucks++;
        } else {
            this._squads.set(squad.call_id, Squad.fromInstance(squad));
        }
        return this;
    }

    removeSquad(squad, obliterate=false) {
        if (this._squads === undefined || !this._squads.has(squad.call_id) || this._squads.get(squad.call_id).number_of_trucks < 1) {
            throw new Error(`Attempted to removeSquad: ${squad.call_id} but it does not exist`);
        }

        const _targetSquad = this._squads.get(squad.call_id);
        _targetSquad.number_of_trucks--;

        if (obliterate && _targetSquad.number_of_trucks == 0) {
            this._squads.delete(squad.call_id);
        }
        return this;
    }

    static isCombinable(slot1, slot2) {
        function areMapsEqual(map1, map2) {
            if (map1.size !== map2.size) return false;
            return showSquadMap(map1) === showSquadMap(map2);
            // return [...map1.entries()].every(
            //     ([key, value]) => map2.has(key) && map2.get(key) === value
            // );
        }

        if (parseInt(slot1.endTime) == parseInt(slot2.startTime) || parseInt(slot2.endTime) == parseInt(slot1.startTime)) {
            // console.log(`Checking Maps: Slot1: ${showSquadMap(slot1.squads)} Slot2: ${showSquadMap(slot2.squads)} Result: ${areMapsEqual(slot1.squads,slot2.squads)}`);
            return areMapsEqual(slot1.squads, slot2.squads) &&
                slot1.tango === slot2.tango && slot1.number_of_trucks === slot2.number_of_trucks;
        } else {
            // console.log(`Slots are not combinable (bad time): Slot1: ${slot1.startTime} - ${slot1.endTime} Slot2: ${slot2.startTime} - ${slot2.endTime} Result: ${(slot1.endTime == slot2.startTime || slot2.endTime == slot1.startTime)}`);
            return false;
        }
    }

    static fromInstance(instance) {
        const slot = new ShiftSlot(instance.startTime, instance.endTime, instance.tango);
        if (instance.squads !== undefined) {
            instance.squads.forEach(sqd => slot.addSquad(Squad.fromInstance(sqd)));
        }
        return slot;
    }

    static fromJson(json) {
        // First create the ShiftSlot with basic properties
        const slot = new ShiftSlot(
            json.startTime,
            json.endTime,
            json.tango
        );
    
        // If squads exist in the JSON, add them
        if (json.squads && Array.isArray(json.squads)) {
            json.squads.forEach(squadJson => {
                const squad = Squad.fromJson(squadJson);
                slot.addSquad(squad);
            });
        }
    
        return slot;
    }        
}

class ShiftSlotCollection {

    addShiftSlot(shiftSlot) {
        if (this._theCollection === undefined) {
            this._theCollection = [];
        }
        this._theCollection.push(ShiftSlot.fromInstance(shiftSlot));
    }

    get shiftSlots() {
        const cloned = [];

        for (let i = 0; i < this._theCollection?.length ?? 0; i++) {
            cloned.push(ShiftSlot.fromInstance(this._theCollection[i]));
        }

        return cloned;
    }

    get size() {
        return this._theCollection?.length || 0;
    }

    static fromJsonString(jsonString) {

        const shiftSlotCollection = new ShiftSlotCollection();
        const json = JSON.parse(jsonString);

        for (let i = 0; i < json.length; i++) {
            shiftSlotCollection.addShiftSlot(ShiftSlot.fromJson(JSON.parse(json[i])));
        }
        return shiftSlotCollection;
    }

    asJsonString() {
        const shifts = [];
        for (let i = 0; i < this._theCollection.length; i++) {
            shifts.push(this._theCollection[i].asJsonString());
        }
        return JSON.stringify(shifts);
    }
}

function showSquadMap(map) {
    let str = '';
    map.forEach((value, key) => {
        str += `${key} => ${value} `;
    });
    return str;
}



// ===================================================================
// ===================================================================
// ===================================================================

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

// ===================================================================
// CONSTANTS
// ===================================================================

const INTERVAL_GRANULARITY = 30;
// ===================================================================

const padToFour = (num) => num.toString().padStart(4, '0');

function schedSlotFromRow(row) {
    let start_time = 0;
    let end_time = 0;
    let tango = '';
    let squads = [];

    console.log(row)
    for (let i = 0; i < row.length; i++) {
        const col = row[i];
        if (col.includes(' - ')) {
            const times = col.match(/(\d{3,4})\s*-\s*(\d{4})/);
            start_time = parseInt(times[1], 10);
            end_time = parseInt(times[2], 10);
            if (col.includes('Tango')) {
                tango = parseInt(col.match(/\(Tango:(\d+)\)/)[1], 10);
            }
        } else {
            squads.push(parseInt(col.match(/^\d+/)[0],10));
        }
    }
    const slot = new ShiftSlot(start_time, end_time, tango);
    squads.forEach(sqd => slot.addSquad(new Squad(sqd, [sqd])));
    return slot;
}

function parseSchedulePastedInput(sched) {
    const rows = sched.trim().split('\t');

    slots = []; // Array of ShiftSlot objects
    sched_grid = [];
    curr_row = [];

    for (let i = 0; i < rows.length; i++) {
        const col = rows[i].replaceAll('"', '').trim();
        if (col.includes(' - ')) {
            if (curr_row.length > 0) {
                sched_grid.push(curr_row);
                slots.push(schedSlotFromRow(curr_row));
            }
            curr_row = [];
        }
        curr_row.push(col);
    }

    if (curr_row.length > 0) {
        sched_grid.push(curr_row);
        slots.push(schedSlotFromRow(curr_row));
    }

    return slots;
}

/**
 * 
 * @param {ShiftSlot[]} slots 
 * @returns Formatted string that is ready to be pasted into a Google Sheet
 */
function slotsToSS(slots) {
    let ss = '';
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        ss += `\"${slot.startTime} - ${slot.endTime}\n`;
        ss += `(Tango:${slot.tango})\"`;

        const iterator = slot.squadIterator;
        let next = iterator.next();
        while (!next.done) {
            const squad = next.value;
            
            let squadString = `${squad.callId}`;
            let coverageString = '';
            if (squad.numberOfTrucks < 0 ) {
                coverageString += '[No Crew]';
            } else if (slot.squads.size == 1) {
                coverageString += '[All]';
            } else if (squad.territoriesCovered.length > 0) {
                coverageString += `[${squad.territoriesCovered}]`;
            }

            let squadStringified = `\t\"${squadString}\n${coverageString}\"`;
            if (squad.numberOfTrucks > 1) {
                ss += squadStringified.repeat(squad.numberOfTrucks);
            } else {
                ss += squadStringified;
            }
            next = iterator.next();
        }


        // for (let j = 0; j < slot.squads.length; j++) {
        //     ss += `\"${slot.squads[j]}\n[All]\"\t`;
        // }
        ss += '\n';
    }
    return ss;
}

function generateTimeIntervals(start_time = 600, end_time = 600) {
    const intervals = [];
    let currentTime = start_time;  // Start at 6:00 AM

    while (true) {
        // Format current time to 4 digits
        let startTime = currentTime.toString().padStart(4, '0');
        
        // Calculate next time (add 30 minutes)
        let nextTime = addMinutes(currentTime);
        
        // Add to intervals array
        intervals.push(startTime);
        
        // Update current time
        currentTime = nextTime;
        
        // Break if we've reached 0600 the next day
        if (currentTime === end_time) break;
    }

    return intervals;
}

function addMinutes(time) {
    let hours = Math.floor(time / 100);
    let minutes = time % 100;
    
    // Add 30 minutes
    minutes += INTERVAL_GRANULARITY;
    
    // Handle minute overflow
    if (minutes >= 60) {
        hours += 1;
        minutes -= 60;
    }
    
    // Handle hour overflow
    if (hours >= 24) {
        hours -= 24;
    }
    
    // Return in military time format
    return (hours * 100) + minutes;
}

function initializeScheduleMatrix(intervals) {
    /**
     * Given a list of intervals (intervals is a string[] eg: 0600, 0630, 0700...)
     * Return a list of ShiftSlot objects
    */
    let matrix = [];
    for (let i = 0; i < intervals.length; i++) {
        let endTime = addMinutes(intervals[i]);
        matrix.push(new ShiftSlot(intervals[i], endTime, undefined, []));
    }
    return matrix;
}

/**
 * Create a new matrix and populate it with the shifts, expanding each shift to cover the interval of time
 * @param {ShiftSlot} slots 
 * @returns ShiftSlot[]
 */
function slotsToMatrix(slots) {

    const intervals = generateTimeIntervals();
    let matrix = initializeScheduleMatrix(intervals); 

    for (let slot_ctr = 0; slot_ctr < slots.length; slot_ctr++) {
        addShift(matrix, slots[slot_ctr]);
    }
    return matrix;
}

function matrixToSlots(matrix, territories) {
    let slots = [];

    for (let i = 0; i < matrix.length; i++) {
        const slot = matrix[i];
        if (slot.squads.size === 0) {
            continue;
        }

        if ( slots.length === 0 || !ShiftSlot.isCombinable(slots[slots.length - 1], slot)) {
            slots.push(ShiftSlot.fromInstance(slot));
        } else if (ShiftSlot.isCombinable(slots[slots.length - 1], slot)) {
            slots[slots.length - 1].endTime = slot.endTime;
        }
        // console.log(`Slot: ${slot.startTime} - ${slot.endTime}`);
    }
    populateTerritories(slots, territories);
    populateTango(slots);
    return slots;
}

function _makeKeyForSlot(slot) {
    let key = '';
    slot.squads.forEach(squad => {
        if (key !== '') {
            key += ',';
        }
        key += squad.call_id;
    });

    return key.split(',').sort().join(',');
}

/**
 * 
 * @param {ShiftSlot} slot 
 * @returns nada
 * This method takes a slot (which has squads in it) and creates a key for look up in the territory map.
 * The key is a string consisting of the concatination of the sorted list of squad ids seperated by commas.  For 
 * example, if the ShiftSlot contains squads 34, 35, and 42, the key would be '34,35,42'.  This key is used to look up
 * the territories covered by the squads in the territory map.
 * 
 * Note that if a squad is in the list, but it has no trucks, it is not included in the key.
 */
function makeKeyForSlot(slot) {
    let key = '';
    slot.squads.forEach(squad => {
        if (squad.numberOfTrucks > 0) {
            if (key !== '') {
                key += ',';
            }
            key += squad.call_id;
        }
    });

    return key.split(',').sort().join(',');
}

/**
 * 
 * @param {ShiftSlot[]} slots 
 * @param {Map(Map())} territories 
 */
function populateTerritories(slots, territories) {
    slots.forEach(slot => {
        // Don't get your panties in a bunch over two loops here. It's not that bad.  There can be only 3 squads per slot.
        let key = makeKeyForSlot(slot);
        if (!territories.has(key)) {
            console.log(`Error: Key ${key} not found in territories.  Exiting.`);
            throw new Error(`Key ${key} not found in territories.  Exiting.`);
        }
        // Populate the squads with no crew since they won't be populated in slot.modifySquadTerritories()
        slot.squads.forEach(squad => {
            if (squad.numberOfTrucks === 0) {
                squad.territories_covered = ['No Crew'];
            }
        });
        slot.modifySquadTerritories(territories.get(key));
    });
}


function _populateTerritories(slots, territories) {
    slots.forEach(slot => {
        if (slot.numberOfSquads === 1) {
            slot.modifySquadTerritories(new Map([[String(slot.squads.keys().next().value),'All']]));
        } else {
            // Don't get your panties in a bunch over two loops here. It's not that bad.  There can be only 3 squads per slot.
            let key = makeKeyForSlot(slot);
            if (!territories.has(key)) {
                console.log(`Error: Key ${key} not found in territories.  Exiting.`);
                throw new Error(`Key ${key} not found in territories.  Exiting.`);
            }
            slot.modifySquadTerritories(territories.get(key));
        }
    });
}

/**
 * 
 * @param {ShiftSlot[]} slots 
 * 
 * If tango is populated, and the squad exists, use the tango.  Otherwise, use the first squad in the (sorted) list.
 */
function populateTango(slots) {
    slots.forEach(slot => {
        const defaultTango = slot.squads.size > 0 ? 
            Array.from(slot.squads.keys()).sort()[0] : '';
        
        if (!slot.tango || slot.tango === '' || !slot.squads.has(slot.tango)) {
            slot.tango = defaultTango;
        }
    });
}

/**
 * 
 * @param {ShiftSlot[]} matrix 
 * @param {ShiftSlot} shift 
 */
function addShift(matrix, shift) {
    // Create a list of start times in the matrix that corresponds to the start time - end time of the shift
    const slot_intervals = generateTimeIntervals(shift.startTime, shift.endTime);
    const intervalStartIndex = matrix.findIndex(matrixRow => padToFour(matrixRow.startTime) === slot_intervals[0]);
    if (intervalStartIndex < 0 || intervalStartIndex >= matrix.length) {
        console.log(`Error: Interval start index out of bounds.  IntervalStartIndex: ${intervalStartIndex} after trying to find: ${slot_intervals[0]}`);
    } 
    // Clone the object for each interval
    for (let i = 0; i < slot_intervals.length; i++) {
        matrix[intervalStartIndex + i].tango = shift?.tango;
        shift.squads.forEach(sqd => {matrix[intervalStartIndex + i].addSquad(sqd)});
    }
}

/**
 * 
 * @param {ShiftSlot[]} matrix 
 * @param {ShiftSlot} shift 
 * @param {boolean} obliterate 
 * -- If obliterate = true, remove the squad altogether, otherwise, decrement truck count and keep if 0
 */
function removeShift(matrix, shift, obliterate=false) {
    if (shift === undefined || shift.squads === undefined || shift.squads.size === 0) {
        throw new Error('Shift does not have any squads to remove');
    }

    if (shift.squads.size > 1) {
        console.log('Warning: Shift has more than one squad.  This function is not designed to handle this case.');
        throw new Error('Shift has more than one squad.  This function is not designed to handle this case.');
    }

    const slot_intervals = generateTimeIntervals(shift.startTime, shift.endTime);
    const intervalStartIndex = matrix.findIndex(matrixRow => padToFour(matrixRow.startTime) === slot_intervals[0]);

    if (intervalStartIndex < 0 || intervalStartIndex >= matrix.length) {
        console.log(`Error: Interval start index out of bounds.  IntervalStartIndex: ${intervalStartIndex} after trying to find: ${slot_intervals[0]}`);
    } 

    for (let i = 0; i < slot_intervals.length; i++) {
        matrix[intervalStartIndex + i].removeSquad(shift.squads.entries().next().value[1], obliterate);
    }
}

function showShifts(slots) {
    for (let i = 0; i < slots.length; i++) {
        console.log(slots[i].toString());
    }
}

function showMatrix(matrix) {
    for (let i = 0; i < matrix.length; i++) {
        const matrixRow = matrix[i];

        formatted_string = `${matrixRow.startTime}`;
        if (matrixRow.tango !== undefined) {
            formatted_string += `\tTango=${matrixRow.tango}`;
        } else {
            formatted_string += '\t';
        }

        squads_on_row_map = matrixRow.squads;
        [...squads_on_row_map.keys()]
            .sort()
            .map(key => formatted_string += '\t' + squads_on_row_map.get(key).toString());

        console.log(formatted_string)
    }
}

/**
 * 
 * @param {pathToTerritories file} tsvFile 
 * @returns 
 */
function createTerritoryMap(tsvFile) {
    /**
     * Read the TSV file and create a Map of Maps
     * Outer map key is the territory key (eg: '34,35,54'), value is an inner map
     * inner map key is the squad key (eg: '42'), value is territories covered (eg: [34,35])
     */
    return fetch(tsvFile)
        .then(response => response.text())
        .then(data => {
            return buildTeamMap(data);
        })
        .catch(error => {
            console.error('Error reading TSV file:', error);
            throw error;
        });
}
const ALL_SQUADS = [34,35,42,43,54];
function buildTeamMap(data) {
    // Create the outer Map
    const teamMap = new Map();
    
    // Add the 'All' values for each key that is just one squad: 
    ALL_SQUADS.forEach(squad => {
        const key = squad.toString();
        const innerMap = new Map();
        innerMap.set(key, 'All');
        teamMap.set(key, innerMap);
    });

    // Split into rows
    const rows = data.split('\n');
    
    // Skip header row and process each line
    for (let i = 1; i < rows.length; i++) {
        // Skip empty rows
        if (rows[i].trim() === '') continue;
        
        // Split row by tab
        const columns = rows[i].split('\t');
        
        // Process first group (columns 1-3)
        if (columns[1] && columns[2] && columns[3]) {
            const key = columns[1].trim();
            const innerMap = new Map();
            
            // Add squad1 and its covering
            innerMap.set(columns[2].trim(), columns[3].trim().replaceAll(' ', ''));
            // Add squad2 and its covering
            innerMap.set(columns[4].trim(), columns[5].trim().replaceAll(' ', ''));
            
            teamMap.set(key, innerMap);
        }

        // Process second group (columns 7-11)
        if (columns[7] && columns[8] && columns[9]) {
            const key = columns[7].trim();
            const innerMap = new Map();
            
            // Add squad1 and its covering
            innerMap.set(columns[8].trim(), columns[9].trim());
            // Add squad2 and its covering
            innerMap.set(columns[10].trim(), columns[11].trim().replaceAll(' ', ''));
            // Add squad3 and its covering
            innerMap.set(columns[12].trim(), columns[13].trim().replaceAll(' ', ''));
            
            teamMap.set(key, innerMap);
        }
    }
    return teamMap;
}

// ===================================================================
module.exports = {
    Squad,
    ShiftSlot,
    ShiftSlotCollection,
    parseSchedulePastedInput,
    slotsToSS,
    addShift,
    generateTimeIntervals,
    slotsToMatrix,
    showShifts,
    showMatrix,
    removeShift,
    matrixToSlots,
    populateTerritories,
    populateTango,
    buildTeamMap
}
