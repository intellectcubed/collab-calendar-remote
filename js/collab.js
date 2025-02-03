
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

class ShiftSlot {
    constructor(start_time, end_time, tango, squads) {
        this.start_time = start_time;
        this.end_time = end_time;
        this.tango = tango;
        this.squads = squads;
    }

    // Optional: Add getters and setters
    getStartTime() {
        return this.start_time;
    }

    getEndTime() {
        return this.end_time;
    }

    getTango() {
        return this.tango;
    }

    getSquads() {
        return this.squads;
    }

    // Optional: Add methods to modify the fields
    setStartTime(time) {
        this.start_time = time;
    }

    setEndTime(time) {
        this.end_time = time;
    }

    setTango(tango) {
        this.tango = tango;
    }

    addSquad(squad) {
        this.squads.push(squad);
    }

    removeSquad(squad) {
        const index = this.squads.indexOf(squad);
        if (index > -1) {
            this.squads.splice(index, 1);
        }
    }
}

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
    return new ShiftSlot(start_time, end_time, tango, squads);
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
        ss += `\"${slot.getStartTime()} - ${slot.getEndTime()}\n`;
        ss += `(Tango:${slot.getTango()})\"\t`;
        for (let j = 0; j < slot.getSquads().length; j++) {
            ss += `\"${slot.getSquads()[j]}\n[All]\"\t`;
        }
        ss += '\n';
    }
    return ss;
}

function showShifts(slots) {
    for (let i = 0; i < slots.length; i++) {
        console.log(slots[i]);
    }


}

// node js/collab.js
// For local testing, uncomment the below
// slots = parseSchedulePastedInput(schedule_input);
// showShifts(slots);
// console.log(slotsToSS(slots));
