function Renderer() {
    r = this;
    VF = Vex.Flow;
    canvas = document.getElementById("score");
    scoreDiv = document.getElementById("scoreDiv");
    vmCanvas = document.getElementById("vmCanvas");
    VFRenderer = new VF.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
    ctx = VFRenderer.getContext();
    document.getElementById("del").addEventListener("click", this.delNotes, false);
    document.getElementById("tie").addEventListener("click", this.tie, false);
    document.getElementById("visualMelody").addEventListener("click", this.vmResize, false);
    this.selectedNotes = [];
    this.measures = []; //save
    vmRenderer = new vmRenderer(this.measures);
    //save
    this.tiesBetweenMeasures = []; //array of ties that connect notes belonging to different staves
    //save $("#ks :selected").text() too
    this.connection = new FireBaseConnection();
    this.user;
}

Renderer.prototype.init = function () {
    r.timeSign = getRadioSelected("time"); //save
    r.beatNum = r.timeSign.split("/")[0];
    r.beatValue = r.timeSign.split("/")[1];
    r.keySign = $("#ks :selected").text();
    r.measures.push(new Measure(0));
    r.measures.push(new Measure(1));
    r.measures.push(new Measure(2));
    r.measures.push(new Measure(3));
    r.renderMeasures();
    vmRenderer.update(); //notify the observers that the measures array has changed
    canvas.addEventListener("click", this.processClick, false);
}

//renders all the measures
Renderer.prototype.renderMeasures = function () {
    var size = 0;
    for (var i = 0; i < r.measures.length; i++)
        size += r.measures[i].width;
    VFRenderer.resize(size + 1500, 250);
    for (var i = 0; i < r.measures.length; i++) {
        if (i == 0)
            r.measures[i].render(10);
        else
            r.measures[i].render(r.measures[i - 1].getEndX());
    }
}

Renderer.prototype.processClick = function (e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var i = r.getMeasureIndex(x);
    var found = false; //set to true if a note is clicked
    if (r.measures[i].isEmpty())
        r.addNote(e);
    else {
        loop:
            for (var voiceName in r.measures[i].voices) {
                for (var note in r.measures[i].voices[voiceName].getTickables()) {
                    if (r.measures[i].voices[voiceName].getTickables()[note] instanceof VF.StaveNote &&
                        r.isSelected(r.measures[i].voices[voiceName].getTickables()[note], x, y, voiceName)) {
                        found = true; //the user clicked on a note
                        var foundNote = r.measures[i].voices[voiceName].getTickables()[note];
                        for (var n in r.selectedNotes) {
                            if (foundNote == r.selectedNotes[n]["note"]) {
                                //if the note was already selected, color it black and
                                //remove from the selected notes array
                                r.colorNote(foundNote, i, voiceName, "black");
                                r.selectedNotes.splice(Number(n), 1);
                                break loop;
                            }
                        }
                        //if the note was not selected color it red and add it to the selected notes array
                        r.selectedNotes.push({"note": foundNote, "voiceName": voiceName, "index": i});
                        r.colorNote(foundNote, i, voiceName, "red");
                        break loop;
                    }
                }
            }
        //if the user didn't click on a note, add a new one
        if (!found)
            r.addNote(e);
    }
}

//color the note red
//index = the measure index
Renderer.prototype.colorNote = function (note, index, voiceName, color) {
    for (var n in r.measures[index].notesArr[voiceName]) {
        if (r.measures[index].notesArr[voiceName][n] == note) {
            //note.setStyle({strokeStyle: color, stemStyle: color, fillStyle: color});
            note.setStyle({fillStyle: color});
            r.measures[index].notesArr[voiceName][n] = note;
            r.renderAndDraw();
            break;
        }
    }
}

//check if the mouse has clicked the given note
Renderer.prototype.isSelected = function isSelected(note, x, y, voiceName) {
    var bb = note.getBoundingBox();
    var offset = 0;
    if (voiceName == "tenore" || voiceName == "soprano") //if the stem is up the height must be lowered by 30
        if(note.duration != "w" && !note.isRest())
        offset = 30;
    else if (note.isRest() && note.duration == "q")
        offset = 10;
    else if (note.isRest() && note.duration == "h")
        offset = -10;
    else if (note.isRest() && note.duration == "16")
        offset = 5;
    if (x >= bb.getX() && x <= bb.getX() + bb.getW())
        if (y >= bb.getY() + offset && y <= bb.getY() + 10 + offset)
            return true;
    return false;
}

//return the index of the measure clicked
Renderer.prototype.getMeasureIndex = function (x) {
    for (var i = 0; i < r.measures.length; i++)
        if (x >= r.measures[i].bassStave.getX() && x <= r.measures[i].bassStave.getNoteEndX())
            return i;
}

//return the index of the new note
Renderer.prototype.calcNoteIndex = function (index, voiceName, x) {
    var notes = r.measures[index].voices[voiceName].getTickables();
    var tmp = [];
    for (var i in notes)
        if (notes[i] instanceof VF.StaveNote)
            tmp.push(notes[i]);
    for (var i = 0; i < tmp.length; i++) {
        if (x < tmp[i].getBoundingBox().getX())
            return i;
    }
    return i++;
}

//delete the selected notes
Renderer.prototype.delNotes = function () {
    for (var i in r.selectedNotes) {
        var notes = r.measures[r.selectedNotes[i]["index"]].notesArr[r.selectedNotes[i]["voiceName"]];
        for (var j in notes)
            if (notes[j] == r.selectedNotes[i]["note"])
                notes.splice(Number(j), 1);
        r.measures[r.selectedNotes[i]["index"]].minNote = 1; //reset the min note to resize the measure properly
    }
    var toUpdate = [];
    for (var k in r.selectedNotes)
        if (!(toUpdate.includes(r.selectedNotes[k]["index"])))
            toUpdate.push(r.selectedNotes[k]["index"]);
    for (var i in toUpdate)
        r.measures[toUpdate[i]].updateTiesIndex();
    //after deleting empty the selectedNotes array
    r.selectedNotes.splice(0, r.selectedNotes.length)
    r.renderAndDraw();
}

Renderer.prototype.tie = function () {
    if (r.selectedNotes.length == 2 &&
        r.selectedNotes[0]["note"].getKeys()[0] == r.selectedNotes[1]["note"].getKeys()[0] &&
        r.selectedNotes[0]["voiceName"] == r.selectedNotes[1]["voiceName"]) {
        if (r.selectedNotes[0]["index"] == r.selectedNotes[1]["index"]) { //if the notes belong to the same stave
            //sort the first and second selected notes in selectedNotes
            var firstNote, secondNote;
            var foundFirst = false;
            var firstIndex;
            var notes = r.measures[r.selectedNotes[0]["index"]].notesArr[r.selectedNotes[0]["voiceName"]];
            for (var i in notes) {
                if (notes[i] == r.selectedNotes[0]["note"] || notes[i] == r.selectedNotes[1]["note"]) {
                    if (foundFirst) {
                        secondNote = notes[i];
                        break;
                    }
                    else {
                        firstNote = notes[i];
                        firstIndex = i;
                        foundFirst = true;
                    }
                }
            }
            if (!(r.areTied(firstNote, secondNote, r.selectedNotes[0]["index"], true))[0]) { //if the notes aren't tied yet
                r.measures[r.selectedNotes[0]["index"]].ties.push([
                    new VF.StaveTie({
                        first_note: firstNote,
                        last_note: secondNote,
                        first_indices: [0],
                        last_indices: [0]
                    }), r.selectedNotes[0]["voiceName"], firstIndex]
                );
            }
            else { //otherwise remove the tie
                var index = r.areTied(firstNote, secondNote, r.selectedNotes[0]["index"], true)[1];
                r.measures[r.selectedNotes[0]["index"]].ties.splice(index, 1);
            }
            r.renderAndDraw();
        } //if the selected notes belong to adjacent measures
        else if (Math.abs(r.selectedNotes[0]["index"] - r.selectedNotes[1]["index"]) == 1) {
            var firstNote, secondNote, i;
            if (r.selectedNotes[0]["index"] < r.selectedNotes[1]["index"]) {
                firstNote = r.selectedNotes[0]["note"];
                secondNote = r.selectedNotes[1]["note"];
                i = r.selectedNotes[0]["index"]
            }
            else {
                firstNote = r.selectedNotes[1]["note"];
                secondNote = r.selectedNotes[0]["note"];
                i = r.selectedNotes[1]["index"];
            }
            /*ties can be added only if the first stave is complete,
             the first note is the last note of the first stave and the
             second note is the first of the second stave*/
            if (r.measures[i].isComplete(r.selectedNotes[0]["voiceName"]) &&
                r.measures[i].isLastNote(r.selectedNotes[0]["voiceName"], firstNote) &&
                r.measures[i + 1].isFirstNote(r.selectedNotes[0]["voiceName"], secondNote)) {
                if (!(r.areTied(firstNote, secondNote, i, false))[0]) {
                    r.tiesBetweenMeasures.push([new VF.StaveTie({
                        first_note: firstNote,
                        last_note: secondNote,
                        first_indices: [0],
                        last_indices: [0]
                    }), i, r.selectedNotes[0]["voiceName"]
                    ]);
                }
                else {
                    var index = r.areTied(firstNote, secondNote, i, false)[1];
                    r.tiesBetweenMeasures.splice(index, 1);
                }
                r.renderAndDraw();
            }
        }
    }
}

//TODO move to visual-melody.js
Renderer.prototype.vmResize = function () {
    if (scoreDiv.style.height == "270px") {
        scoreDiv.style.height = "400px";
        vmCanvas.style.display = "block";
    }
    else {
        scoreDiv.style.height = "270px";
        vmCanvas.style.display = "none";
    }

}

//the sameMeasure variable is set to true when firstNote and secondNote belong to the same measure
//return an array containing a boolean value and the index of the tie inside the ties array, if the tie exists.
Renderer.prototype.areTied = function (firstNote, secondNote, index, sameMeasure) {
    if (sameMeasure) {
        for (var i in r.measures[index].ties)
            if (r.measures[index].ties[i][0].first_note == firstNote && r.measures[index].ties[i][0].last_note == secondNote)
                return [true, i];
        return [false, null];
    }
    else {
        for (var i in r.tiesBetweenMeasures)
            if (r.tiesBetweenMeasures[i][0].first_note == firstNote && r.tiesBetweenMeasures[i][0].last_note == secondNote)
                return [true, i];
        return [false, null];
    }
}

//TODO pass x and y from processClick
//add the note to the stave
Renderer.prototype.addNote = function (e) {
    var duration = getRadioSelected("notes");
    var accidental = getRadioSelected("accidental");
    var voice = getRadioSelected("voice");
    var pitch = r.calculatePitch(e, voice);
    var newNote;
    if (voice == "basso" || voice == "tenore")
        newNote = new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration});
    else
        newNote = new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration});
    if (accidental != "clear")
        newNote.addAccidental(0, new VF.Accidental(accidental));
    var i = r.getMeasureIndex(e.clientX - canvas.getBoundingClientRect().left);
    if (r.measures[i].isEmpty())
        r.measures[i].addNote(newNote, voice, 0);
    else {
        var pos = r.calcNoteIndex(i, voice, e.clientX - canvas.getBoundingClientRect().left);
        r.measures[i].addNote(newNote, voice, pos);
        r.measures[i].updateTiesIndex();
    }
    //add new measures
    if (i >= r.measures.length - 2)
        r.measures.push(new Measure(i + 2));
    r.renderAndDraw();
}

Renderer.prototype.renderAndDraw = function () {
    ctx.clear();
    r.renderMeasures();
    for (var i = 0; i < r.measures.length; i++) {
        r.measures[i].drawNotes();
        r.measures[i].renderTies();
    }
    r.checkTiesBetweenMeasures();
    r.tiesBetweenMeasures.forEach(function (t) {
        t[0].setContext(ctx).draw()
    });
    vmRenderer.update(); //notify the observers that the measures array has changed
}

//remove the ties that aren't valid anymore
Renderer.prototype.checkTiesBetweenMeasures = function () {
    for (var i = 0; i < r.tiesBetweenMeasures.length; i++) {
        if (!r.measures[r.tiesBetweenMeasures[i][1]].isComplete(r.tiesBetweenMeasures[i][2])
            || !r.measures[r.tiesBetweenMeasures[i][1]].isLastNote(r.tiesBetweenMeasures[i][2], r.tiesBetweenMeasures[i][0].first_note)
            || !r.measures[r.tiesBetweenMeasures[i][1] + 1].isFirstNote(r.tiesBetweenMeasures[i][2], r.tiesBetweenMeasures[i][0].last_note)) {
            r.tiesBetweenMeasures.splice(Number(i), 1);
            i--;
        }
    }
}

//calculate the pitch based on the mouse y position
Renderer.prototype.calculatePitch = function (e, tone) {
    var rect = canvas.getBoundingClientRect();
    var y = e.clientY - rect.top;
    y = y.toFixed();
    var diff = y % 5;
    if (diff <= 2)
        y = y - diff;
    else
        y = y * 1 + (5 - diff);
    var trebleBottom = r.measures[0].getStaveBottom("treble");
    var bassBottom = r.measures[0].getStaveBottom("bass");
    if (tone == "basso") {
        if (y <= bassBottom && y >= bassBottom - 60) {
            //first note e/2, last note c/4 on the bass stave
            return r.getNote(y, bassBottom, "bass");
        }
        return;
    }
    else if (tone == "tenore") {
        if (y <= bassBottom - 25 && y >= bassBottom - 80) {
            //first note c/3, last note g/4 on the bass stave
            return r.getNote(y, bassBottom, "bass");
        }
        return;
    }
    else if (tone == "alto") {
        if (y <= trebleBottom + 15 && y >= trebleBottom - 35) {
            //first note g/3, last note c/5 on the treble stave
            return r.getNote(y, trebleBottom, "treble");
        }
        return;
    }
    else if (tone == "soprano") {
        if (y <= trebleBottom && y >= trebleBottom - 60) {
            //first note c/4, last note a/5 on the treble stave
            return r.getNote(y, trebleBottom, "treble");
        }
        return;
    }
}

Renderer.prototype.getNote = function (y, staveBottom, stave) {
    var octave;
    var note;
    var bottom;
    var diff = y % 5;
    if (diff <= 2)
        y = y - diff;
    else
        y += Number((5 - diff));
    if (stave == "treble") {
        bottom = staveBottom + 15;
        note = 4; //c is 0, b is 6
        octave = 3;
    }
    else if (stave == "bass") {
        bottom = staveBottom;
        note = 2; //c is 0, b is 6
        octave = 2;
    }
    for (i = bottom; i >= bottom - 80; i -= 5) {
        if (i == y)
            break;
        if (note == 6) {
            note = 0;
            octave++;
        }
        else
            note++;
    }
    var notes = {0: 'c', 1: 'd', 2: 'e', 3: 'f', 4: 'g', 5: 'a', 6: 'b'};
    return notes[note] + '/' + octave;
}

Renderer.prototype.saveData = function () {
    var data = new EditorData(r.keySign, r.timeSign);
    for (var i in r.tiesBetweenMeasures)
        data.tiesBetweenMeasures.push(new TieData(r.tiesBetweenMeasures[i][1], r.tiesBetweenMeasures[i][2]));
    for (var i in r.measures) {
        var measure = new MeasureData(i);
        for (var voiceName in r.measures[i].notesArr) {
            for (var j in r.measures[i].notesArr[voiceName]) {
                var note = r.measures[i].notesArr[voiceName][j];
                var accidental = null;
                if (note.modifiers.length > 0)
                    accidental = note.modifiers[0].type;
                var noteData = new NoteData(note.duration, note.isRest() == undefined ? false : true, note.keys, accidental);
                measure.notesArr[voiceName].push(noteData);
            }
        }
        for (var k in r.measures[i].ties)
            measure.ties.push(new TieData(r.measures[i].ties[k][1], r.measures[i].ties[k][2]))
        data.measures.push(measure);
    }
    r.user = r.connection.login("slech92@gmail.com", "Simone92", data);
}

Renderer.prototype.loadData = function () {
    r.connection.return_all_data(r.user.uid)
}

Renderer.prototype.restoreData = function (data) {
    console.log(data)
    r.timeSign = data["timeSign"]
    r.beatNum = r.timeSign.split("/")[0];
    r.beatValue = r.timeSign.split("/")[1];
    r.keySign = data["keySign"];
    r.measures.splice(0, r.measures.length);
    r.tiesBetweenMeasures.splice(0, r.tiesBetweenMeasures.length)
    r.selectedNotes.splice(0, r.selectedNotes.length)
    for (var i in data["measures"]) {
        var measure = data["measures"][i];
        r.measures.push(new Measure(measure["index"]));
        for (var voiceName in measure["notesArr"]) {
            for (var j in measure["notesArr"][voiceName]) {
                var note = measure["notesArr"][voiceName][j];
                var vexNote, duration = note["duration"];
                if(note["isRest"])
                    duration += "r";
                if (voiceName == "basso" || voiceName == "tenore")
                    vexNote = new VF.StaveNote({clef: "bass", keys: [note["keys"][0]], duration: duration});
                else
                    vexNote = new VF.StaveNote({clef: "treble", keys: [note["keys"][0]], duration: duration});
                if (note["accidental"] != undefined)
                    vexNote.addAccidental(0, new VF.Accidental(note["accidental"]));
                r.measures[i].addNote(vexNote, voiceName, j);
            }
        }
        if (measure["ties"] != undefined) {
            for (var j in measure["ties"]) {
                var tie = measure["ties"][j];
                r.measures[i].ties.push([new VF.StaveTie({
                    first_note: r.measures[i].notesArr[tie["firstParam"]][tie["lastParam"]],
                    last_note: r.measures[i].notesArr[tie["firstParam"]][(tie["lastParam"]) * 1 + 1],
                    first_indices: [0],
                    last_indices: [0]
                }), tie["firstParam"], tie["lastParam"]]);
            }
        }
    }
    if (data["tiesBetweenMeasures"] != undefined) {
        for (var i in data["tiesBetweenMeasures"]) {
            var tie = data["tiesBetweenMeasures"][i];
            var firstVoiceNotes = r.measures[tie["firstParam"]].notesArr[tie["lastParam"]];
            r.tiesBetweenMeasures.push([new VF.StaveTie({
                first_note: firstVoiceNotes[firstVoiceNotes.length - 1],
                last_note: r.measures[(tie["firstParam"]) * 1 + 1].notesArr[tie["lastParam"]][0],
                first_indices: [0],
                last_indices: [0]
            }), tie["firstParam"], tie["lastParam"]
            ]);
        }
    }
    r.renderAndDraw();
}
//return the radio element selected with the given name
function getRadioSelected(name) {
    var elements = document.getElementsByName(name);
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].checked)
            return elements[i].id;
    }
}