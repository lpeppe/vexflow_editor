$(document).ready(function () {
    var canvas = document.getElementById("score");
    var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.SVG);
    var ctx = renderer.getContext();
    var bassoVoice = new Array();
    var tenoreVoice = new Array();
    var altoVoice = new Array();
    var sopranoVoice = new Array();
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
    alert(trebleStave.getBottomLineY());

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

        //TODO bassStave position relative to trebleStave
        trebleStave = new Vex.Flow.Stave(10, 20, staveSize);
        bassStave = new Vex.Flow.Stave(10, 100, staveSize);
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

    //returns the radio element selected with the given name
    function getRadioSelected(name) {
        var elements = document.getElementsByName(name);
        for (i = 0; i < elements.length; i++) {
            if (elements[i].checked)
                return elements[i].id;
        }
    }

    function isStaveEmpty() {
        if (bassoVoice.length <= 0 && tenoreVoice.length <= 0 && tenoreVoice.length <= 0 && altoVoice.length <= 0)
            return true;
        return false;
    }

    //returns the length of the longest voice
    function maxNotes() {
        return Math.max(bassoVoice.length, tenoreVoice.length, altoVoice.length, sopranoVoice.length);
    }

    function addNote(e) {
        var x, y;

        if (e.pageX != undefined && e.pageY != undefined) {
            x = e.pageX;
            y = e.pageY;
        }
        else {
            x = e.clientX + document.body.scrollLeft +
                document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop +
                document.documentElement.scrollTop;
        }


        var rect = canvas.getBoundingClientRect();

        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        alert(x + " " + y);
    }


});