function render() {
    var VF = Vex.Flow;
    var canvas = document.getElementById("score");
    var renderer = new VF.Renderer(canvas, Vex.Flow.Renderer.Backends.SVG);
    var ctx = renderer.getContext();

    var bassoNotes = new Array();
    var tenoreNotes = new Array();
    var altoNotes = new Array();
    var sopranoNotes = new Array();

    //TODO parse num_beats and beat_value from the selected radio button
    var bassoVoice = new VF.Voice({num_beats: 4, beat_value: 4});
    var tenoreVoice = new VF.Voice({num_beats: 4, beat_value: 4});
    var altoVoice = new VF.Voice({num_beats: 4, beat_value: 4});
    var sopranoVoice = new VF.Voice({num_beats: 4, beat_value: 4});

    processStaves();
    drawStaves();
    canvas.addEventListener("click", addNote, false);
    //altoVoice.setStrict(true);
    //altoVoice.setMode(3);
    //altoNotes.push(//new Vex.Flow.StaveNote({clef: "treble", keys: ["a/4"], duration: "h"}),
        //new Vex.Flow.StaveNote({clef: "treble", keys: ["a/4"], duration: "h"}),
        //new Vex.Flow.StaveNote({clef: "treble", keys: ["a/4"], duration: "h"}));
    //altoVoice.setStrict(false);

    //alert(altoVoice.isComplete());
    /*altoVoice.addTickables(altoNotes);
    var formatter = new VF.Formatter().joinVoices([altoVoice]).format([altoVoice], 400);
    altoVoice.draw(ctx, trebleStave);
    bassoNotes.push(new Vex.Flow.StaveNote({clef: "bass", keys: ["d/3"], duration: "q"}));
    bassoVoice.setStrict(false);
    bassoVoice.addTickables(bassoNotes);
    var formatter = new VF.Formatter().joinVoices([bassoVoice]).format([bassoVoice], 400);
    bassoVoice.draw(ctx, bassStave);*/

    function processStaves() {

        var staveSize;

        // set stave width
        if (isStaveEmpty() || maxNotes() < 10)
            staveSize = 930;
        else {
            // about 85 pixels per note
            staveSize = (maxNotes() + 1) * 85;
        }
        renderer.resize(staveSize, 500);

        trebleStave = new VF.Stave(10, 20, staveSize);
        bassStave = new VF.Stave(10, trebleStave.getBottomLineY() + 10, staveSize);
        var timeSign = getRadioSelected("time");
        trebleStave.addClef("treble").addTimeSignature(timeSign);
        bassStave.addClef("bass").addTimeSignature(timeSign);

        // add key
        var keySign = $("#ks :selected").text();

        trebleStave.addKeySignature(keySign);
        bassStave.addKeySignature(keySign);
    }

    function drawStaves() {
        trebleStave.setContext(ctx).draw();
        bassStave.setContext(ctx).draw();
    }

    //check if there are no notes to display
    function isStaveEmpty() {
        if (bassoNotes.length <= 0 && tenoreNotes.length <= 0 && tenoreNotes.length <= 0 && altoNotes.length <= 0)
            return true;
        return false;
    }

    //return the length of the longest voice
    function maxNotes() {
        return Math.max(bassoNotes.length, tenoreNotes.length, altoNotes.length, sopranoNotes.length);
    }

    //add the note to the stave
    function addNote(e) {
        var duration = getRadioSelected("notes");
        var accidental = getRadioSelected("accidental");
        var voice = getRadioSelected("voice");
        var pitch = calculatePitch(e, voice);
        switch(voice) {
            case "basso":
                bassoNotes.push(new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration}));
                break;
            case "tenore":
                tenoreNotes.push(new Vex.Flow.StaveNote({clef: "bass", keys: [pitch], duration: duration}));
                break;
            case "alto":
                altoNotes.push(new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration}));
                break;
            case "soprano":
                sopranoNotes.push(new Vex.Flow.StaveNote({clef: "treble", keys: [pitch], duration: duration}));
                break;
        }
        ctx.clear();
        processStaves();
        drawStaves();
        processVoices();
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
            y = y*1 + (5 - diff);
        var trebleBottom = trebleStave.getBottomLineY();
        var bassBottom = bassStave.getBottomLineY();
        if (tone == "basso") {
            if (y <= bassBottom && y >= bassBottom - 60) {
                //first note e/2, last note c/4 on the bass stave
                return getNote(y, bassStave);
            }
            return;
        }
        else if (tone == "tenore") {
            if (y <= bassBottom - 25 && y >= bassBottom - 80) {
                //first note c/3, last note g/4 on the bass stave
                return getNote(y, bassStave);
            }
            return;
        }
        else if (tone == "alto") {
            if (y <= trebleBottom + 15 && y >= trebleBottom - 35) {
                //first note g/3, last note c/5 on the treble stave
                return getNote(y, trebleStave);
            }
            return;
        }
        else if (tone == "soprano") {
            if (y <= trebleBottom && y >= trebleBottom - 60) {
                //first note c/4, last note a/5 on the treble stave
                return getNote(y, trebleStave);
            }
            return;
        }
    }

    function getNote(y, stave) {
        var octave;
        var note;
        var bottom;
        var diff = y % 5;
        if (diff <= 2)
            y = y - diff;
        else
            y += Number((5 - diff));
        if (stave === trebleStave) {
            bottom = trebleStave.getBottomLineY() + 15;
            note = 4; //c is 0, b is 6
            octave = 3;
        }
        else if (stave === bassStave) {
            bottom = bassStave.getBottomLineY();
            note = 2; //c is 0, b is 6
            octave = 2;
        }
        for (i = bottom; i >= bottom - 80; i-=5) {
            if(i == y)
                break;
            if(note == 6) {
                note = 0;
                octave++;
            }
            else
                note++;
        }
        switch(note) {
            case 0:
                return 'c/'+octave;
            case 1:
                return 'd/'+octave;
            case 2:
                return 'e/'+octave;
            case 3:
                return 'f/'+octave;
            case 4:
                return 'g/'+octave;
            case 5:
                return 'a/'+octave;
            case 6:
                return 'b/'+octave;
        }
    }

    function processVoices() {
        bassoVoice = new VF.Voice({num_beats: 4, beat_value: 4, resolution: Vex.Flow.RESOLUTION});
        tenoreVoice = new VF.Voice({num_beats: 4, beat_value: 4, resolution: Vex.Flow.RESOLUTION});
        altoVoice = new VF.Voice({num_beats: 4, beat_value: 4, resolution: Vex.Flow.RESOLUTION});
        sopranoVoice = new VF.Voice({num_beats: 4, beat_value: 4, resolution: Vex.Flow.RESOLUTION});
        bassoVoice.setStrict(false);
        tenoreVoice.setStrict(false);
        altoVoice.setStrict(false);
        sopranoVoice.setStrict(false);
        bassoVoice.addTickables(bassoNotes);
        tenoreVoice.addTickables(tenoreNotes);
        altoVoice.addTickables(altoNotes);
        sopranoVoice.addTickables(sopranoNotes);
        var formatter = new VF.Formatter();
        if(bassoNotes.length != 0 && tenoreNotes.length != 0) {
            formatter.joinVoices([bassoVoice, tenoreVoice]).format([bassoVoice, tenoreVoice], 400);
            bassoVoice.draw(ctx, bassStave);
            tenoreVoice.draw(ctx, bassStave);
        }
        else if(bassoNotes.length == 0) {
            formatter.joinVoices([tenoreVoice]).format([tenoreVoice], 400);
            tenoreVoice.draw(ctx, bassStave);
        }
        else {
            formatter.joinVoices([bassoVoice]).format([bassoVoice], 400);
            bassoVoice.draw(ctx, bassStave);
        }
        if(sopranoNotes.length != 0 && altoNotes.length != 0) {
            formatter.joinVoices([sopranoVoice, altoVoice]).format([sopranoVoice, altoVoice], 400);
            sopranoVoice.draw(ctx, trebleStave);
            altoVoice.draw(ctx, trebleStave);
        }
        else if(sopranoNotes.length == 0) {
            formatter.joinVoices([altoVoice]).format([altoVoice], 400);
            altoVoice.draw(ctx, trebleStave);
        }
        else {
            formatter.joinVoices([sopranoVoice]).format([sopranoVoice], 400);
            sopranoVoice.draw(ctx, trebleStave);
        }
        //formatter.joinVoices([sopranoVoice, altoVoice]).format([sopranoVoice, altoVoice], 400);
        /*bassoVoice.draw(ctx, bassStave);
        tenoreVoice.draw(ctx, bassStave);
        sopranoVoice.draw(ctx, trebleStave);
        altoVoice.draw(ctx, trebleStave);*/
    }
}

//return the radio element selected with the given name
function getRadioSelected(name) {
    var elements = document.getElementsByName(name);
    for (i = 0; i < elements.length; i++) {
        if (elements[i].checked)
            return elements[i].id;
    }
}