//index represents the position of the measure inside the stave
function Measure(index) {
    this.index = index;
    this.bassoNotes = [];
    this.tenoreNotes = [];
    this.sopranoNotes = [];
    this.altoNotes = [];
    this.bassoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.tenoreVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.sopranoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.altoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.formatter = new VF.Formatter();
    this.minNote = 1; //1 is w, 2 is h, 3 is q, 4 is 8, 5 is 16
    this.width;
    this.computeScale();
}

Measure.prototype.getIndex = function () {
    return this.index;
}

//adds a note in the measure
//in case adding the note creates an error, the voice is restored to the previous state
Measure.prototype.addNote = function (note, voiceName) {
    switch(voiceName) {
        case "basso":
            this.bassoNotes.push(note);
            try {
                this.bassoVoice.addTickable(note.setStemDirection(-1));
            }
            catch(err) {
                this.bassoNotes.pop();
                this.bassoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
                    resolution: Vex.Flow.RESOLUTION}).setMode(3);
                this.bassoVoice.addTickables(this.bassoNotes);
            }
            break;
        case "tenore":
            this.tenoreNotes.push(note);
            try {
                this.tenoreVoice.addTickable(note);
            }
            catch(err) {
                this.tenoreNotes.pop();
                this.tenoreVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
                    resolution: Vex.Flow.RESOLUTION}).setMode(3);
                this.tenoreVoice.addTickables(this.tenoreNotes);
            }
            break;
        case "alto":
            this.altoNotes.push(note);
            try {
                this.altoVoice.addTickable(note.setStemDirection(-1));
            }
            catch(err) {
                this.altoNotes.pop();
                this.altoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
                    resolution: Vex.Flow.RESOLUTION}).setMode(3);
                this.altoVoice.addTickables(this.altoNotes);
            }
            break;
        case "soprano":
            this.sopranoNotes.push(note);
            try {
                this.sopranoVoice.addTickable(note);
            }
            catch(err) {
                this.sopranoNotes.pop();
                this.sopranoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
                    resolution: Vex.Flow.RESOLUTION}).setMode(3);
                this.sopranoVoice.addTickables(this.sopranoNotes);
            }
            break;
    }
}

//render the measure. the x param is the start of the previous measure
Measure.prototype.render = function (x) {
    this.computeScale();
    this.trebleStave = new VF.Stave(x, 20, this.width);
    this.bassStave = new VF.Stave(x, this.trebleStave.getBottomLineY() + 10, this.width);
    if(this.index == 0) {
        this.trebleStave.addClef("treble").addTimeSignature(timeSign);
        this.bassStave.addClef("bass").addTimeSignature(timeSign);
        var keySign = $("#ks :selected").text();
        this.trebleStave.addKeySignature(keySign);
        this.bassStave.addKeySignature(keySign);
        this.bassStave.setNoteStartX(this.trebleStave.getNoteStartX());
        this.bassStave.setWidth(this.bassStave.getNoteStartX()
            - this.bassStave.getX() + this.width);
        this.trebleStave.setWidth(this.trebleStave.getNoteStartX() - this.trebleStave.getX() + this.width);
    }
    this.trebleStave.setContext(ctx).draw();
    this.bassStave.setContext(ctx).draw();
}

//scale is used to format notes in the measure
Measure.prototype.computeScale = function() {
    var notes = { "w":1, "h":2, "q":4, "8":8, "16":16, "wr":1, "hr":2, "qr":4, "8r":8, "16r":16};
    for(var i = 0; i < this.bassoNotes.length; i++) {
        var noteDuration = this.bassoNotes[i].duration;
        if(notes[noteDuration] > this.minNote)
            this.minNote = notes[noteDuration];
    }

    for(i = 0; i < this.tenoreNotes.length; i++) {
        var noteDuration = this.tenoreNotes[i].duration;
        if(notes[noteDuration] > this.minNote)
            this.minNote = notes[noteDuration];
    }
    for(i = 0; i < this.altoNotes.length; i++) {
        var noteDuration = this.altoNotes[i].duration;
        if(notes[noteDuration] > this.minNote)
            this.minNote = notes[noteDuration];
    }
    for(i = 0; i < this.sopranoNotes.length; i++) {
        var noteDuration = this.sopranoNotes[i].duration;
        if(notes[noteDuration] > this.minNote)
            this.minNote = notes[noteDuration];
    }
    this.width = 85 * this.minNote;
}

//check if the given voice is full or not
Measure.prototype.isComplete = function (voiceName) {
    var toReturn;
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
    this.completeVoices();
    this.formatter.format([this.bassoVoice, this.tenoreVoice, this.altoVoice, this.sopranoVoice], this.width - 10);
    this.bassoVoice.draw(ctx, this.bassStave);
    this.tenoreVoice.draw(ctx, this.bassStave);
    this.altoVoice.draw(ctx, this.trebleStave);
    this.sopranoVoice.draw(ctx, this.trebleStave);
    this.bassoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.bassoVoice.addTickables(this.bassoNotes);
    this.tenoreVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.tenoreVoice.addTickables(this.tenoreNotes);
    this.altoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.altoVoice.addTickables(this.altoNotes);
    this.sopranoVoice = new VF.Voice({num_beats: beatNum, beat_value: beatValue,
        resolution: Vex.Flow.RESOLUTION}).setMode(3);
    this.sopranoVoice.addTickables(this.sopranoNotes);
}

Measure.prototype.getStaveBottom = function(stave) {
    switch(stave){
        case "bass":
            return this.bassStave.getBottomLineY();
        case "treble":
            return this.trebleStave.getBottomLineY();
    }
}

Measure.prototype.getWidth = function () {
    return this.trebleStave.getWidth();
}

Measure.prototype.completeVoices = function () {
    while(!(this.bassoVoice.isComplete())){
        this.bassoVoice.addTickable(new Vex.Flow.GhostNote({clef: "bass", keys: ["e/2"], duration: "16"}));
    }
    while(!(this.tenoreVoice.isComplete())){
        this.tenoreVoice.addTickable(new Vex.Flow.GhostNote({clef: "bass", keys: ["c/3"], duration: "16"}));
    }
    while(!(this.altoVoice.isComplete())){
        this.altoVoice.addTickable(new Vex.Flow.GhostNote({clef: "treble", keys: ["g/3"], duration: "16"}));
    }
    while(!(this.sopranoVoice.isComplete())){
        this.sopranoVoice.addTickable(new Vex.Flow.GhostNote({clef: "treble", keys: ["c/4"], duration: "16"}));
    }
}