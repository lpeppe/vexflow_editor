//index represents the position of the measure inside the stave
function Measure(index) {
    this.index = index;
    this.bassoNotes = [];
    this.tenoreNotes = [];
    this.sopranoNotes = [];
    this.altoNotes = [];
    this.bassoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue});
    this.tenoreVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue});
    this.sopranoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue});
    this.altoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue});
    this.bassoVoice.setMode(3);
    this.tenoreVoice.setMode(3);
    this.sopranoVoice.setMode(3);
    this.altoVoice.setMode(3);
}

Measure.prototype.getIndex = function () {
    return index;
}

//adds a note in the measure TODO: add notes to the voices
Measure.prototype.addNote = function (note, voiceName) {
    switch(voiceName) {
        case "basso":
            this.bassoNotes.push(new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration}));
            break;
        case "tenore":
            this.tenoreNotes.push(new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration}));
            break;
        case "alto":
            this.altoNotes.push(new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration}));
            break;
        case "soprano":
            this.sopranoNotes.push(new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration}));
            break;
    }
}

//scale is used to format notes in the measure
Measure.prototype.computeScale = function() {

}

