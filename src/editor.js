function render() {
    VF = Vex.Flow;
    canvas = document.getElementById("score");
    renderer = new VF.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
    ctx = renderer.getContext();
    timeSign = getRadioSelected("time");
    beatNum = timeSign.split("/")[0];
    beatValue = timeSign.split("/")[1];

    var measures = [];
    var curIndex = 0;
    init();

    function init() {
        measures.push(new Measure(0));
        measures.push(new Measure(1));
        measures.push(new Measure(2));
        measures.push(new Measure(3));
        renderMeasures();
        canvas.addEventListener("click", addNote, false);
    }

    //renders all the measures
    function renderMeasures() {
        var size = 0;
        for(var i = 0; i < measures.length; i++)
            size += measures[i].width;
        renderer.resize(size + 600, 500);
        for (var i = 0; i < measures.length; i++) {
            if (i == 0)
                measures[i].render(10);
            else
                measures[i].render(measures[i - 1].getEndX());
        }
    }

    //add the note to the stave
    function addNote(e) {
        var duration = getRadioSelected("notes");
        var accidental = getRadioSelected("accidental");
        var voice = getRadioSelected("voice");
        var pitch = calculatePitch(e, voice);
        //TODO if all the measure's voices are complete create a new measure
        var newNote;
        if (voice == "basso" || voice == "tenore")
            newNote = new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration});
        else
            newNote = new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration});
        if (accidental != "clear")
            newNote.addAccidental(0, new VF.Accidental(accidental));
        var i;
        for (i = 0; i < measures.length; i++) {
            if (measures[i].isComplete(voice) == false) {
                measures[i].addNote(newNote, voice);
                break;
            }
        }
        if(i == measures.length - 2)
            measures.push(new Measure(i+2));
        ctx.clear();
        renderMeasures();
        for (var i = 0; i < measures.length; i++)
            measures[i].drawNotes();
    }

    //calculate the pitch based on the mouse click position
    function calculatePitch(e, tone) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
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
        var notes = {0:'c', 1:'d', 2:'e', 3:'f', 4:'g', 5:'a', 6:'b'};
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
