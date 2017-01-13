//index represents the position of the measure inside the stave
function Measure(index) {
    this.index = index;
    this.notesArr = {
        "basso": [],
        "tenore": [],
        "soprano": [],
        "alto": []
    };
    /*setMode(3) allows to insert notes inside the measure even if the measure is not complete, but
     throws an exception if the duration of the inserted notes exceeds the time signature*/
    this.voices = {
        "basso": new VF.Voice({
            num_beats: r.beatNum, beat_value: r.beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3),
        "tenore": new VF.Voice({
            num_beats: r.beatNum, beat_value: r.beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3),
        "alto": new VF.Voice({
            num_beats: r.beatNum, beat_value: r.beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3),
        "soprano": new VF.Voice({
            num_beats: r.beatNum, beat_value: r.beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3)
    };
    //array of ties inside the measure
    this.ties = [];
    this.formatter = new VF.Formatter();
    this.minNote = 1; //1 is w, 2 is h, 3 is q, 4 is 8, 5 is 16
    this.width;
    this.computeScale();
}

Measure.prototype.getIndex = function () {
    return this.index;
}

/*adds a note in the measure
 in case adding the note generates an error (the new inserted note exceeds the time signature),
 the voice is restored to the previous state*/
Measure.prototype.addNote = function (note, voiceName, index) {
    this.notesArr[voiceName].splice(index, 0, note);
    try {
        if (voiceName == "basso" || voiceName == "alto")
            note.setStemDirection(-1);
        this.voices[voiceName] = new VF.Voice({
            num_beats: r.beatNum, beat_value: r.beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3);
        this.voices[voiceName].addTickables(this.notesArr[voiceName]);
    }
    catch (err) {
        //this.notesArr[voiceName].pop();
        this.notesArr[voiceName].splice(index, 1);
        this.voices[voiceName] = new VF.Voice({
            num_beats: r.beatNum, beat_value: r.beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3);
        this.voices[voiceName].addTickables(this.notesArr[voiceName]);
    }
}

//Renderer the measure. the x param is the start of the previous measure
Measure.prototype.render = function (x) {
    this.computeScale();
    this.trebleStave = new VF.Stave(x, 20, this.width);
    this.bassStave = new VF.Stave(x, this.trebleStave.getBottomLineY() + 10, this.width);
    if (this.index == 0) {
        this.trebleStave.addClef("treble").addTimeSignature(r.timeSign);
        this.bassStave.addClef("bass").addTimeSignature(r.timeSign);
        var keySign = r.keySign;
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

//calculate the width of the stave based on the note with the minimum duration
Measure.prototype.computeScale = function () {
    this.restoreVoices();
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
    /*this.restoreVoices();
     return this.voices[voiceName].isComplete();*/
    for (var i in this.voices[voiceName].getTickables())
        if (this.voices[voiceName].getTickables()[i] instanceof VF.GhostNote)
            return false;
    return this.voices[voiceName].isComplete();
}

//check if the note is the first of the stave(used for tiesBetweenMeasures)
Measure.prototype.isFirstNote = function (voiceName, note) {
    var cont = 0;
    for (var i in this.notesArr[voiceName]) {
        if (this.notesArr[voiceName][i] == note)
            return cont == 0;
        cont++;
    }
}

//check if the note is the last of the stave (used for tiesBetweenMeasures)
Measure.prototype.isLastNote = function (voiceName, note) {
    var cont = 0;
    for (var i in this.notesArr[voiceName]) {
        cont++;
        if (this.notesArr[voiceName][i] == note)
            return cont == this.notesArr[voiceName].length;
    }
}

Measure.prototype.getEndX = function () {
    return this.trebleStave.getX() + this.trebleStave.getWidth();
}

//draw the notes on the staves
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
}

//Renderer the ties inside the measure
Measure.prototype.renderTies = function () {
    for (var i = 0; i < this.ties.length; i++) {
        var hasFirst = false;
        var hasLast = false;
        var cont = 0;
        loop:
            for (var voiceName in this.notesArr) {
                for (var j in this.notesArr[voiceName]) {
                    if (hasFirst)
                        cont++;
                    if (this.notesArr[voiceName][j] === this.ties[i][0].first_note)
                        hasFirst = true;
                    if (this.notesArr[voiceName][j] === this.ties[i][0].last_note) {
                        hasLast = true;
                        if (!hasFirst || cont > 1) {
                            this.ties.splice(Number(i), 1);
                            i--;
                        }
                        break loop;
                    }
                }
            }
        if (!hasLast || !hasFirst) {
            this.ties.splice(Number(i), 1);
            i--;
        }
    }
    this.ties.forEach(function (t) {
        t[0].setContext(ctx).draw()
    })
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

//add ghostNotes to the voice until it's complete (allows proper formatting)
Measure.prototype.completeVoices = function () {
    for (var voice in this.voices)
        while (!this.voices[voice].isComplete())
            this.voices[voice].addTickable(new Vex.Flow.GhostNote({clef: "bass", keys: ["e/2"], duration: "16"}));
}

//remove ghostNotes from the voices
Measure.prototype.restoreVoices = function () {
    for (var voice in this.voices) {
        this.voices[voice] = new VF.Voice({
            num_beats: r.beatNum, beat_value: r.beatValue,
            resolution: Vex.Flow.RESOLUTION
        }).setMode(3);
        this.voices[voice].addTickables(this.notesArr[voice]);
    }
}

//check if the measure is empty
Measure.prototype.isEmpty = function () {
    for (var voiceName in this.notesArr)
        if (this.notesArr[voiceName].length > 0)
            return false;
    return true;
}

Measure.prototype.updateTiesIndex = function () {
    for (var i in this.ties) {
        loop:
            for (var voiceName in this.notesArr) {
                for (var j in this.notesArr[voiceName]) {
                    if (this.ties[i][0].first_note == this.notesArr[voiceName][j]) {
                        this.ties[i][2] = j;
                        break loop;
                    }
                }
            }
    }
}