function render() {
    VF = Vex.Flow;
    canvas = document.getElementById("score");
    scoreDiv = document.getElementById("scoreDiv");
    vmCanvas = document.getElementById("vmCanvas");
    renderer = new VF.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
    ctx = renderer.getContext();
    timeSign = getRadioSelected("time");
    beatNum = timeSign.split("/")[0];
    beatValue = timeSign.split("/")[1];
    document.getElementById("del").addEventListener("click", delNotes, false);
    document.getElementById("tie").addEventListener("click", tie, false);
    document.getElementById("visualMelody").addEventListener("click", vmResize, false);
    var selectedNotes = [];
    var measures = [];
    measures.observers = []; //a list of the observers
    measures.subscribe = function (callBack) {
        measures.observers.push(callBack);
    }
    measures.unsubscribe = function (callBack) {
        for(var i = 0; i < measure.observers.length; i++) {
            if(measure.observers[i] == callBack) {
                measure.observers.splice(i, 1);
                return;
            }
        }
    }
    measures.notify = function() { //gets called whenever a change occurs on the measures and notifies the observers
        for(var i in measures.observers)
            measures.observers[i].update();
    }
    var tiesBetweenMeasures = []; //array of ties that connect notes belonging to different staves
    var curIndex = 0;
    vmRenderer = new vmRenderer(measures);
    init();

    function init() {
        measures.push(new Measure(0));
        measures.push(new Measure(1));
        measures.push(new Measure(2));
        measures.push(new Measure(3));
        renderMeasures();
        canvas.addEventListener("click", processClick, false);
    }

    //renders all the measures
    function renderMeasures() {
        var size = 0;
        for (var i = 0; i < measures.length; i++)
            size += measures[i].width;
        renderer.resize(size + 1500, 250);
        for (var i = 0; i < measures.length; i++) {
            if (i == 0)
                measures[i].render(10);
            else
                measures[i].render(measures[i - 1].getEndX());
        }
        measures.notify(); //notify the observers that the measures array has changed
    }

    function processClick(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var i = getMeasureIndex(x);
        var found = false; //set to true if a note is clicked
        if (measures[i].isEmpty())
            addNote(e);
        else {
            loop:
                for (var voiceName in measures[i].voices) {
                    for (var note in measures[i].voices[voiceName].getTickables()) {
                        if (measures[i].voices[voiceName].getTickables()[note] instanceof VF.StaveNote &&
                            isSelected(measures[i].voices[voiceName].getTickables()[note], x, y, voiceName)) {
                            found = true; //the user clicked on a note
                            var foundNote = measures[i].voices[voiceName].getTickables()[note];
                            for (var n in selectedNotes) {
                                if (foundNote == selectedNotes[n]["note"]) {
                                    //if the note was already selected, color it black and
                                    //remove from the selected notes array
                                    colorNote(foundNote, i, voiceName, "black");
                                    selectedNotes.splice(Number(n), 1);
                                    break loop;
                                }
                            }
                            //if the note was not selected color it red and add it to the selected notes array
                            selectedNotes.push({"note": foundNote, "voiceName": voiceName, "index": i});
                            colorNote(foundNote, i, voiceName, "red");
                            break loop;
                        }
                    }
                }
                //if the user didn't click on a note, add a new one
            if (!found)
                addNote(e);
        }
    }

    //color the note red
    //index = the measure index
    function colorNote(note, index, voiceName, color) {
        for (var n in measures[index].notesArr[voiceName]) {
            if (measures[index].notesArr[voiceName][n] == note) {
                //note.setStyle({strokeStyle: color, stemStyle: color, fillStyle: color});
                note.setStyle({fillStyle: color});
                measures[index].notesArr[voiceName][n] = note;
                renderAndDraw();
                break;
            }
        }
    }

    //check if the mouse has clicked the given note
    function isSelected(note, x, y, voiceName) {
        var bb = note.getBoundingBox();
        var offset = 0;
        if (voiceName == "tenore" || voiceName == "soprano") //if the stem is up the height must be lowered by 30
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
    function getMeasureIndex(x) {
        for (var i = 0; i < measures.length; i++)
            if (x >= measures[i].bassStave.getX() && x <= measures[i].bassStave.getNoteEndX())
                return i;
    }

    //return the index of the new note
    function calcNoteIndex(index, voiceName, x) {
        var notes = measures[index].voices[voiceName].getTickables();
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
    function delNotes() {
        for (var i in selectedNotes) {
            var notes = measures[selectedNotes[i]["index"]].notesArr[selectedNotes[i]["voiceName"]];
            for (var j in notes)
                if (notes[j] == selectedNotes[i]["note"])
                    notes.splice(Number(j), 1);
            measures[selectedNotes[i]["index"]].minNote = 1; //reset the min note to resize the measure properly
        }
        //after deleting empty the selectedNotes array
        selectedNotes.splice(0, selectedNotes.length)
        renderAndDraw();
    }

    function tie() {
        if (selectedNotes.length == 2 &&
            selectedNotes[0]["note"].getKeys()[0] == selectedNotes[1]["note"].getKeys()[0] &&
            selectedNotes[0]["voiceName"] == selectedNotes[1]["voiceName"]) {
            if (selectedNotes[0]["index"] == selectedNotes[1]["index"]) { //if the notes belong to the same stave
                //sort the first and second selected notes in selectedNotes
                var firstNote, secondNote;
                var foundFirst = false;
                var notes = measures[selectedNotes[0]["index"]].notesArr[selectedNotes[0]["voiceName"]];
                for (var i in notes) {
                    if (notes[i] == selectedNotes[0]["note"] || notes[i] == selectedNotes[1]["note"]) {
                        if (foundFirst) {
                            secondNote = notes[i];
                            break;
                        }
                        else {
                            firstNote = notes[i];
                            foundFirst = true;
                        }
                    }
                }
                if (!(areTied(firstNote, secondNote, selectedNotes[0]["index"], true))[0]) { //if the notes aren't tied yet
                    measures[selectedNotes[0]["index"]].ties.push(
                        new VF.StaveTie({
                            first_note: firstNote,
                            last_note: secondNote,
                            first_indices: [0],
                            last_indices: [0]
                        })
                    );
                }
                else { //otherwise remove the tie
                    var index = areTied(firstNote, secondNote, selectedNotes[0]["index"], true)[1];
                    measures[selectedNotes[0]["index"]].ties.splice(index, 1);
                }
                renderAndDraw();
            } //if the selected notes belong to adjacent measures
            else if (Math.abs(selectedNotes[0]["index"] - selectedNotes[1]["index"]) == 1) {
                var firstNote, secondNote, i;
                if (selectedNotes[0]["index"] < selectedNotes[1]["index"]) {
                    firstNote = selectedNotes[0]["note"];
                    secondNote = selectedNotes[1]["note"];
                    i = selectedNotes[0]["index"]
                }
                else {
                    firstNote = selectedNotes[1]["note"];
                    secondNote = selectedNotes[0]["note"];
                    i = selectedNotes[1]["index"];
                }
                /*ties can be added only if the first stave is complete,
                the first note is the last note of the first stave and the
                second note is the first of the second stave*/
                if (measures[i].isComplete(selectedNotes[0]["voiceName"]) &&
                    measures[i].isLastNote(selectedNotes[0]["voiceName"], firstNote) &&
                    measures[i + 1].isFirstNote(selectedNotes[0]["voiceName"], secondNote)) {
                    if (!(areTied(firstNote, secondNote, i, false))[0]) {
                        tiesBetweenMeasures.push([new VF.StaveTie({
                            first_note: firstNote,
                            last_note: secondNote,
                            first_indices: [0],
                            last_indices: [0]
                        }), i, selectedNotes[0]["voiceName"]
                        ]);
                    }
                    else {
                        var index = areTied(firstNote, secondNote, i, false)[1];
                        tiesBetweenMeasures.splice(index, 1);
                    }
                    renderAndDraw();
                }
            }
        }

    }

    //TODO move to visual-melody.js
    function vmResize() {
        if(scoreDiv.style.height == "270px") {
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
    function areTied(firstNote, secondNote, index, sameMeasure) {
        if (sameMeasure) {
            for (var i in measures[index].ties)
                if (measures[index].ties[i].first_note == firstNote && measures[index].ties[i].last_note == secondNote)
                    return [true, i];
            return [false, null];
        }
        else {
            for (var i in tiesBetweenMeasures)
                if (tiesBetweenMeasures[i][0].first_note == firstNote && tiesBetweenMeasures[i][0].last_note == secondNote)
                    return [true, i];
            return [false, null];
        }
    }

    //TODO pass x and y from processClick
    //add the note to the stave
    function addNote(e) {
        var duration = getRadioSelected("notes");
        var accidental = getRadioSelected("accidental");
        var voice = getRadioSelected("voice");
        var pitch = calculatePitch(e, voice);
        var newNote;
        if (voice == "basso" || voice == "tenore")
            newNote = new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration});
        else
            newNote = new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration});
        if (accidental != "clear")
            newNote.addAccidental(0, new VF.Accidental(accidental));
        var i = getMeasureIndex(e.clientX - canvas.getBoundingClientRect().left);
        if (measures[i].isEmpty())
            measures[i].addNote(newNote, voice, 0);
        else {
            var pos = calcNoteIndex(i, voice, e.clientX - canvas.getBoundingClientRect().left);
            measures[i].addNote(newNote, voice, pos);
        }
        //add new measures
        if (i >= measures.length - 2)
            measures.push(new Measure(i + 2));
        renderAndDraw();
    }

    function renderAndDraw() {
        ctx.clear();
        renderMeasures();
        for (var i = 0; i < measures.length; i++) {
            measures[i].drawNotes();
            measures[i].renderTies();
        }
        checkTiesBetweenMeasures();
        tiesBetweenMeasures.forEach(function (t) {
            t[0].setContext(ctx).draw()
        });
    }

    //remove the ties that aren't valid anymore
    function checkTiesBetweenMeasures() {
        for(var i = 0; i < tiesBetweenMeasures.length; i++) {
            if (!measures[tiesBetweenMeasures[i][1]].isComplete(tiesBetweenMeasures[i][2])
                || !measures[tiesBetweenMeasures[i][1]].isLastNote(tiesBetweenMeasures[i][2], tiesBetweenMeasures[i][0].first_note)
                || !measures[tiesBetweenMeasures[i][1] + 1].isFirstNote(tiesBetweenMeasures[i][2], tiesBetweenMeasures[i][0].last_note)) {
                tiesBetweenMeasures.splice(Number(i), 1);
                i--;
            }
        }
    }

    //calculate the pitch based on the mouse y position
    function calculatePitch(e, tone) {
        var rect = canvas.getBoundingClientRect();
        var y = e.clientY - rect.top;
        y = y.toFixed();
        var diff = y % 5;
        if (diff <= 2)
            y = y - diff;
        else
            y = y * 1 + (5 - diff);
        var trebleBottom = measures[0].getStaveBottom("treble");
        var bassBottom = measures[0].getStaveBottom("bass");
        if (tone == "basso") {
            if (y <= bassBottom && y >= bassBottom - 60) {
                //first note e/2, last note c/4 on the bass stave
                return getNote(y, bassBottom, "bass");
            }
            return;
        }
        else if (tone == "tenore") {
            if (y <= bassBottom - 25 && y >= bassBottom - 80) {
                //first note c/3, last note g/4 on the bass stave
                return getNote(y, bassBottom, "bass");
            }
            return;
        }
        else if (tone == "alto") {
            if (y <= trebleBottom + 15 && y >= trebleBottom - 35) {
                //first note g/3, last note c/5 on the treble stave
                return getNote(y, trebleBottom, "treble");
            }
            return;
        }
        else if (tone == "soprano") {
            if (y <= trebleBottom && y >= trebleBottom - 60) {
                //first note c/4, last note a/5 on the treble stave
                return getNote(y, trebleBottom, "treble");
            }
            return;
        }
    }

    function getNote(y, staveBottom, stave) {
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

    function calcStavesLenght() {
        var totLength = 0;
        for (var i = 0; i < measures.length; i++)
            totLength += measures[i].getWidth();
        return totLength;
    }
}

//return the radio element selected with the given name
function getRadioSelected(name) {
    var elements = document.getElementsByName(name);
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].checked)
            return elements[i].id;
    }
}
