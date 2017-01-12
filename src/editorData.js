function EditorData(keySign, timeSign) {
    this.keySign = keySign;
    this.timeSign = timeSign;
    this.measures = [];
    this.tiesBetweenMeasures = [];
}

function NoteData(duration, isRest, keys, accidental, voice, id) {
    this.duration = duration;
    this.isRest = isRest;
    this.keys = keys;
    this.accidental = accidental;
    this.voice = voice;
    this.id = id;
}

function TieData(firstNote, lastNote) {
    this.firstNote = firstNote;
    this.lastNote = lastNote;
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