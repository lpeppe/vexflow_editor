function EditorData(keySign, timeSign) {
    this.keySign = keySign;
    this.timeSign = timeSign;
    this.measures = [];
    this.tiesBetweenMeasures = [];
}

function NoteData(duration, isRest, keys, accidental) {
    this.duration = duration;
    this.isRest = isRest;
    this.keys = keys;
    this.accidental = accidental;
}

function TieData(firstParam, lastParam) {
    this.firstParam = firstParam;
    this.lastParam = lastParam;
}

function MeasureData(index) {
    this.index = index;
    this.notesArr = {
        "basso": [],
        "tenore": [],
        "alto": [],
        "soprano": []
    };
    this.ties = [];
}