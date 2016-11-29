$(document).ready(function () {
    var VF = Vex.Flow;
    var canvas = document.getElementById("score");
    var renderer = new VF.Renderer(canvas, Vex.Flow.Renderer.Backends.SVG);
    var ctx = renderer.getContext();
    var bassoNotes = new Array();
    var tenoreNotes = new Array();
    var altoNotes = new Array();
    var sopranoNotes = new Array();
    var bassoVoice = new VF.Voice({num_beats: 4,  beat_value: 4});
    var tenoreVoice = new VF.Voice({num_beats: 4,  beat_value: 4});
    var altoVoice = new VF.Voice({num_beats: 4,  beat_value: 4});
    var sopranoVoice = new VF.Voice({num_beats: 4,  beat_value: 4});
    var staff,
        formatter,
        voice,
        noteOffsetLeft,
        tickIndex = 0,
        noteIndex = 0,
        numBeats = 4,
        beatValue = 4,
        cursorHeight = 150;
    processStaves();
    drawStaves();
    canvas.addEventListener("click", addNote, false);
    //alert(bassStave.getBottomLineY());
    altoNotes.push(new Vex.Flow.StaveNote({clef: "treble", keys: ["c/3", "e/4", "g/4"], duration: "h" }));
    altoVoice.setStrict(false);
    altoVoice.addTickables(altoNotes);
    var formatter = new VF.Formatter().joinVoices([altoVoice]).format([altoVoice], 400);
    altoVoice.draw(ctx, trebleStave);
    bassoNotes.push(new Vex.Flow.StaveNote({clef: "bass", keys: ["c/3", "e/4", "g/4"], duration: "q" }));
    bassoVoice.setStrict(false);
    bassoVoice.addTickables(bassoNotes);
    var formatter = new VF.Formatter().joinVoices([bassoVoice]).format([bassoVoice], 400);
    bassoVoice.draw(ctx, bassStave);

    function processStaves() {

        var staveSize;

        // set stave width
        if (isStaveEmpty())
            staveSize = 930;
        else {
            // about 85 pixels per note
            staveSize = (maxNotes() + 1) * 85;
        }
        renderer.resize(staveSize, 500);

        trebleStave = new VF.Stave(10, 20, staveSize);
        bassStave = new VF.Stave(10, trebleStave.getBottomLineY() + 10, staveSize);
        trebleStave.addClef("treble").addTimeSignature(numBeats + "/" + beatValue);
        bassStave.addClef("bass").addTimeSignature(numBeats + "/" + beatValue);

        // add key
        trebleStave.addKeySignature("C");
        bassStave.addKeySignature("C");
        // calc offset for first note - accounts for pixels used by treble clef & time signature & key signature
        noteOffsetLeft = trebleStave.start_x + trebleStave.glyph_start_x;
    }

    function drawStaves() {
        trebleStave.setContext(ctx).draw();
        bassStave.setContext(ctx).draw();
    }

    //return the radio element selected with the given name
    function getRadioSelected(name) {
        var elements = document.getElementsByName(name);
        for (i = 0; i < elements.length; i++) {
            if (elements[i].checked)
                return elements[i].id;
        }
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
        var tone = getRadioSelected("tone");
        var pitch = calculatePitch(e, tone);
    }

    //calculate the pitch based on the mouse click position
    function calculatePitch(e, tone) {
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var trebleBottom = trebleStave.getBottomLineY();
        var bassBottom = bassStave.getBottomLineY();
        if(tone == "basso") {
            if(y <= bassBottom + 5 && y >= bassBottom - 65) {

            }
        }
        else if(tone == "tenore") {
            if(y <= bassBottom - 20 && y >= bassBottom - 80) {

            }
        }
        else if(tone == "alto") {
            if(y <= trebleBottom + 20 && y >= trebleBottom - 40) {

            }
        }
        else if(tone == "soprano") {
            if(y <= trebleBottom && y >= trebleBottom - 60) {

            }
        }
    }
});