
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
}



class ShiftSlot {
    constructor(startTime, endTime, tango) {
        this._startTime = startTime;
        this._endTime = endTime;
        this._tango = tango;
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
            console.log(`Slots are not combinable (bad time): Slot1: ${slot1.startTime} - ${slot1.endTime} Slot2: ${slot2.startTime} - ${slot2.endTime} Result: ${(slot1.endTime == slot2.startTime || slot2.endTime == slot1.startTime)}`);
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

// Test the function
// const intervals = generateTimeIntervals();
// intervals.forEach(interval => console.log(interval));

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

function matrixToSlots(matrix) {
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
    return slots;
}

/**
 * 
 * @param {ShiftSlot[]} matrix 
 * @param {ShiftSlot} shift 
 */
function addShift(matrix, shift) {
    // console.log(`Adding shift with time interval: ${shift.startTime} - ${shift.endTime}`);
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
    // TODO: Do something about tango!
    console.log('Reminder: Do something about tango!');
    const slot_intervals = generateTimeIntervals(shift.startTime, shift.endTime);
    const intervalStartIndex = matrix.findIndex(matrixRow => padToFour(matrixRow.startTime) === slot_intervals[0]);

    if (intervalStartIndex < 0 || intervalStartIndex >= matrix.length) {
        console.log(`Error: Interval start index out of bounds.  IntervalStartIndex: ${intervalStartIndex} after trying to find: ${slot_intervals[0]}`);
    } 

    for (let i = 0; i < slot_intervals.length; i++) {
        matrix[intervalStartIndex + i].removeSquad(shift.squads.entries().next().value[1], obliterate);
    }
}

function areArraysEqualIgnoreFirst(arr1, arr2) {
    return JSON.stringify(arr1.slice(1)) === JSON.stringify(arr2.slice(1));
}

/**
 * Given an Interval Matrix, return ShiftSlot[]
 * @param {} matrix 
 */
function matrix_to_slots(matrix) {
    let prev_row = undefined;
    let series_start = undefined;
    
    let slots = [];
    for (let i = 0; i < matrix.length; i++) {
        const row = matrix[i];

        if (prev_row === undefined) {
            series_start = row[0];
        } else if (!areArraysEqualIgnoreFirst(row, prev_row)) {
            slots.push(new ShiftSlot(series_start, row[0], prev_row[1], prev_row.getSquads()));
            series_start = row[0];            
        } 
        prev_row = row;
    }

    if (prev_row !== undefined) {
        slots.push(new ShiftSlot(series_start, row[0], prev_row.getTango(), prev_row.getSquads()));
    }
    
    return slots;
}

function showShifts(slots) {
    for (let i = 0; i < slots.length; i++) {
        console.log(slots[i]);
    }
}

function squadToPrettyString(squad) {
    return `${squad.callId} (trk=${squad.number_of_trucks}) covering [${squad.territoriesCovered}]`;
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
            .map(key => formatted_string += '\t' + squadToPrettyString(squads_on_row_map.get(key)));

        console.log(formatted_string)
    }
}

module.exports = {
    Squad,
    ShiftSlot,
    parseSchedulePastedInput,
    slotsToSS,
    adjustMatrix: addShift,
    generateTimeIntervals,
    slotsToMatrix,
    matrix_to_slots,
    showShifts,
    showMatrix,
    removeShift,
    matrixToSlots
}
