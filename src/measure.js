//index represents the position of the measure inside the stave
function Measure(index) {
    this.index = index;
    this.bassoNotes = [];
    this.tenoreNotes = [];
    this.sopranoNotes = [];
    this.altoNotes = [];
    this.bassoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue, resolution: Vex.Flow.RESOLUTION});
    this.tenoreVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue, resolution: Vex.Flow.RESOLUTION});
    this.sopranoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue, resolution: Vex.Flow.RESOLUTION});
    this.altoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue, resolution: Vex.Flow.RESOLUTION});
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
            this.bassoVoice.addTickables(this.bassoNotes);
            break;
        case "tenore":
            this.tenoreNotes.push(new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration}));
            this.tenoreVoice.addTickables(this.tenoreNotes);
            break;
        case "alto":
            this.altoNotes.push(new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration}));
            this.altoVoice.addTickables(this.altoNotes);
            break;
        case "soprano":
            this.sopranoNotes.push(new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration}));
            this.sopranoVoice.addTickables(this.sopranoNotes);
            break;
    }
}

//render the measure. the x param is the start of the previous measure
Measure.prototype.render = function (x) {
    var staveSize = 300;
    if(this.index == 0)
        staveSize = 350;
    var trebleStave = new VF.Stave(x, 20, staveSize);
    var bassStave = new VF.Stave(x, trebleStave.getBottomLineY() + 10, staveSize);
    if(this.index == 0) {
        trebleStave.addClef("treble").addTimeSignature(timeSign);
        bassStave.addClef("bass").addTimeSignature(timeSign);
        var keySign = $("#ks :selected").text();
        trebleStave.addKeySignature(keySign);
        bassStave.addKeySignature(keySign);
    }
    trebleStave.setContext(ctx).draw();
    bassStave.setContext(ctx).draw();
}

Measure.prototype.resize = function (size) {

}

//scale is used to format notes in the measure
Measure.prototype.computeScale = function() {

}

//check if the given voice is full or not
Measure.prototype.isComplete = function (voiceName) {
    switch(voiceName) {
        case "basso":
            return this.bassoVoice.isComplete();
        case "tenore":
            return this.tenoreVoice.isComplete();
        case "soprano":
            return this.sopranoVoice.isComplete();
        case "alto":
            return this.altoVoice.isComplete();
    }
}
