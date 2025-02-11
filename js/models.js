
class Squad {
    constructor(call_id, territories_covered, number_of_trucks, is_first_responder) {
        this.call_id = call_id;
        this.territories_covered = territories_covered;
        this.number_of_trucks = number_of_trucks;
        this.is_first_responder = is_first_responder;
    }

    static create_empty() {
        return new Squad("", [], 0, false);
    }

    // Optional: Add getters and setters
    getCallId() {
        return this.call_id;
    }

    getTerritoriesCovered() {
        return this.territories_covered;
    }

    getNumberOfTrucks() {
        return this.number_of_trucks;
    }

    getIsFirstResponder() {
        return this.is_first_responder;
    }
}

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

export default {
    ShiftSlot
}