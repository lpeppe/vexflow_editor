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
    this.formatter = new VF.Formatter();
}

Measure.prototype.getIndex = function () {
    return index;
}

//adds a note in the measure
Measure.prototype.addNote = function (note, voiceName) {
    switch(voiceName) {
        case "basso":
            //this.bassoNotes.push(note);
            //this.bassoVoice.addTickables(this.bassoNotes);
            this.bassoNotes.push(note);
            this.bassoVoice.addTickable(note);
            //this.drawNotes(this.bassoVoice, this.bassStave);
            break;
        case "tenore":
            this.tenoreNotes.push(note);
            this.tenoreVoice.addTickable(note);
            //this.drawNotes(this.tenoreVoice, this.bassStave);
            break;
        case "alto":
            this.altoNotes.push(note);
            this.altoVoice.addTickable(note);
            //this.drawNotes(this.altoVoice, this.trebleStave);
            break;
        case "soprano":
            this.sopranoNotes.push(note);
            this.sopranoVoice.addTickable(note);
            //this.drawNotes(this.sopranoVoice, this.trebleStave);
            break;
    }
}

//render the measure. the x param is the start of the previous measure
Measure.prototype.render = function (x) {
    var staveSize = 300;
    if(this.index == 0)
        staveSize = 350;
    this.trebleStave = new VF.Stave(x, 20, staveSize);
    this.bassStave = new VF.Stave(x, this.trebleStave.getBottomLineY() + 10, staveSize);
    if(this.index == 0) {
        this.trebleStave.addClef("treble").addTimeSignature(timeSign);
        this.bassStave.addClef("bass").addTimeSignature(timeSign);
        var keySign = $("#ks :selected").text();
        this.trebleStave.addKeySignature(keySign);
        this.bassStave.addKeySignature(keySign);
    }
    this.trebleStave.setContext(ctx).draw();
    this.bassStave.setContext(ctx).draw();
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

Measure.prototype.getEndX = function () {
    return this.trebleStave.getX() + this.trebleStave.getWidth();
}

Measure.prototype.drawNotes = function () {
    this.formatter.joinVoices([this.bassoVoice]).format([this.bassoVoice], this.trebleStave.getWidth());
    this.formatter.joinVoices([this.tenoreVoice]).format([this.tenoreVoice], this.trebleStave.getWidth());
    this.formatter.joinVoices([this.altoVoice]).format([this.altoVoice], this.trebleStave.getWidth());
    this.formatter.joinVoices([this.sopranoVoice]).format([this.sopranoVoice], this.trebleStave.getWidth());
    this.bassoVoice.draw(ctx, this.bassStave);
    this.tenoreVoice.draw(ctx, this.bassStave);
    this.altoVoice.draw(ctx, this.trebleStave);
    this.sopranoVoice.draw(ctx, this.trebleStave);
}

Measure.prototype.getStaveBottom = function(stave) {
    switch(stave){
        case "bass":
            return this.bassStave.getBottomLineY();
        case "treble":
            return this.trebleStave.getBottomLineY();
    }
}