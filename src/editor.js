function render() {
    VF = Vex.Flow;
    canvas = document.getElementById("score");
    renderer = new VF.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
    ctx = renderer.getContext();
    timeSign = getRadioSelected("time");
    beatNum = timeSign.split("/")[0];
    beatValue = timeSign.split("/")[1];
    document.getElementById("del").addEventListener("click", delNote, false);

    var selectedNote = [];
    var measures = [];
    var curIndex = 0;
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
        renderer.resize(size + 600, 600);
        for (var i = 0; i < measures.length; i++) {
            if (i == 0)
                measures[i].render(10);
            else
                measures[i].render(measures[i - 1].getEndX());
        }
    }

    function processClick(e) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var i = getMeasureIndex(x);
        var found = false;
        if (measures[i].isEmpty())
            addNote(e);
        else {
            loop:
                for (var voiceName in measures[i].voices) {
                    for (var note in measures[i].voices[voiceName].getTickables()) {
                        if (measures[i].voices[voiceName].getTickables()[note] instanceof VF.StaveNote &&
                            isSelected(measures[i].voices[voiceName].getTickables()[note], x, y, voiceName)) {
                            found = true;
                            var foundNote = measures[i].voices[voiceName].getTickables()[note];
                            if(foundNote == selectedNote["note"]) {
                                colorNote(foundNote, i, voiceName, "black");
                                selectedNote = [];
                            }
                            else {
                                //console.log(selectedNote.length)
                                if(Object.keys(selectedNote).length > 0)
                                    colorNote(selectedNote["note"], selectedNote["index"], selectedNote["voiceName"], "black");
                                colorNote(foundNote, i, voiceName, "red");
                                selectedNote["note"] = foundNote;
                                selectedNote["voiceName"] = voiceName;
                                selectedNote["index"] = i;
                            }
                            break loop;
                        }
                    }
                }
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
        if(voiceName == "tenore" || voiceName == "soprano") //if the stem is up the height must be lowered by 30
            offset = 30;
        if(x >= bb.getX() && x <= bb.getX() + bb.getW())
            if(y >= bb.getY() + offset && y <= bb.getY() + 10 + offset)
                return true;
        return false;
    }

    //return the index of the measure clicked
    function getMeasureIndex(x) {
        for (var i = 0; i < measures.length; i++)
            if (x >= measures[i].bassStave.getX() && x <= measures[i].bassStave.getNoteEndX())
                return i;
    }

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

    function delNote() {
        var notes = measures[selectedNote["index"]].notesArr[selectedNote["voiceName"]];
        for(var i in notes)
            if(notes[i] == selectedNote["note"])
                notes.splice(i, 1);
        measures[selectedNote["index"]].minNote = 1; //reset the min note to resize the measure properly
        renderAndDraw();
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
        if (i == measures.length - 2)
            measures.push(new Measure(i + 2));
        renderAndDraw();
    }

    function renderAndDraw() {
        ctx.clear();
        renderMeasures();
        for (var i = 0; i < measures.length; i++)
            measures[i].drawNotes();
    }

    //calculate the pitch based on the mouse click position
    function calculatePitch(e, tone) {
        var rect = canvas.getBoundingClientRect();
        //console.log(x)
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
