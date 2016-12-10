//index represents the position of the measure inside the stave
function Measure(index) {
    this.index = index;
    this.notesArr = {
        "basso": [],
        "tenore": [],
        "soprano": [],
        "alto": []
    };
    this.voices = {
        "basso": new VF.Voice({
            num_beats: beatNum, beat_value: beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3),
        "tenore": new VF.Voice({
            num_beats: beatNum, beat_value: beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3),
        "alto": new VF.Voice({
            num_beats: beatNum, beat_value: beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3),
        "soprano": new VF.Voice({
            num_beats: beatNum, beat_value: beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3)
    };
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
    this.notesArr[voiceName].push(note);
    try {
        if (voiceName == "basso" || voiceName == "alto")
            note.setStemDirection(-1);
        this.voices[voiceName].addTickable(note);
    }
    catch (err) {
        this.notesArr[voiceName].pop();
        this.voices[voiceName] = new VF.Voice({
            num_beats: beatNum, beat_value: beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3);
        this.voices[voiceName].addTickables(this.notesArr[voiceName]);
    }
}

//render the measure. the x param is the start of the previous measure
Measure.prototype.render = function (x) {
    this.computeScale();
    this.trebleStave = new VF.Stave(x, 20, this.width);
    this.bassStave = new VF.Stave(x, this.trebleStave.getBottomLineY() + 10, this.width);
    if (this.index == 0) {
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
Measure.prototype.computeScale = function () {
    var notes = {"w": 1, "h": 2, "q": 4, "8": 8, "16": 16, "wr": 1, "hr": 2, "qr": 4, "8r": 8, "16r": 16};
    for (var voiceName in this.notesArr) {
        for (var i = 0; i < this.notesArr[voiceName].length; i++) {
            var noteDuration = this.notesArr[voiceName][i].duration;
            if (notes[noteDuration] > this.minNote)
                this.minNote = notes[noteDuration];
        }
    }
    this.width = 85 * this.minNote;
}

//check if the given voice is full or not
Measure.prototype.isComplete = function (voiceName) {
    return this.voices[voiceName].isComplete();
}

Measure.prototype.getEndX = function () {
    return this.trebleStave.getX() + this.trebleStave.getWidth();
}

Measure.prototype.drawNotes = function () {
    this.completeVoices();
    var toFormat = [];
    for (var voice in this.voices)
        toFormat.push(this.voices[voice]);
    this.formatter.format(toFormat, this.width);
    for (var voice in this.voices) {
        if (voice == "basso" || voice == "tenore")
            this.voices[voice].draw(ctx, this.bassStave);
        else
            this.voices[voice].draw(ctx, this.trebleStave);
    }
    for (var voice in this.voices) {
        this.voices[voice] = new VF.Voice({
            num_beats: beatNum, beat_value: beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3);
        this.voices[voice].addTickables(this.notesArr[voice]);
    }
}

Measure.prototype.getStaveBottom = function (stave) {
    switch (stave) {
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
    for (var voice in this.voices)
        while (!this.voices[voice].isComplete())
            this.voices[voice].addTickable(new Vex.Flow.GhostNote({clef: "bass", keys: ["e/2"], duration: "16"}));
}