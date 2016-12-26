function vmRenderer(measures) {
    this.ctx = vmCanvas.getContext("2d");
    this.drawVoiceNames();
    this.measures = measures;
    measures.subscribe(this);
}

vmRenderer.prototype.drawVoiceNames = function () {
    this.ctx.font = "12px Arial";
    this.ctx.fillText("Basso", 0, 100);
    this.ctx.fillText("Tenore", 0, 80);
    this.ctx.fillText("Alto", 0, 55);
    this.ctx.fillText("Soprano", 0, 35);
}

vmRenderer.prototype.drawMeasureLines = function () {
    var width = 0;
    this.ctx.setLineDash([5, 2]);
    for (var i = 0; i < this.measures.length; i++) {
        var x = this.measures[i].bassStave.end_x;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, 130);
        this.ctx.stroke();
        width += this.measures[i].bassStave.width;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(0, 62.5);
    this.ctx.lineTo(width + 10, 62.5);
    this.ctx.stroke();
}

vmRenderer.prototype.createTrajectories = function () {
    this.trajectories = {
        "basso": new trajectory(),
        "tenore": new trajectory(),
        "alto": new trajectory(),
        "soprano": new trajectory()
    };
    for (var i in this.measures) {
        for (var voiceName in this.measures[i].voices) {
            var count = 0, firstX, firstY;
            var notes = this.measures[i].voices[voiceName].getTickables();
            for (var j in notes) {
                if (notes[j] instanceof VF.GhostNote)
                    break;
                if(notes[j].isRest())
                    continue;
                if (count == 0) {
                    var k = i - 1;
                    if(i > 0 && this.measures[k].isComplete(voiceName)) {
                        var prevNotes = this.measures[k].voices[voiceName].getTickables();
                        firstX = prevNotes[prevNotes.length - 1].getBoundingBox().getX();
                        firstY = this.getCanvasPosition(prevNotes[prevNotes.length - 1].getBoundingBox().getY(), voiceName);
                        this.trajectories[voiceName].push(new segment(firstX, firstY,
                            notes[j].getBoundingBox().getX(), this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName)));
                        firstX = notes[j].getBoundingBox().getX();
                        firstY = this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName);
                        count++;
                    }
                    else {
                        firstX = notes[j].getBoundingBox().getX();
                        firstY = this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName);
                        count++;
                    }
                }
                else {
                    this.trajectories[voiceName].push(new segment(firstX, firstY,
                        notes[j].getBoundingBox().getX(), this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName)));
                    firstX = notes[j].getBoundingBox().getX();
                    firstY = this.getCanvasPosition(notes[j].getBoundingBox().getY(), voiceName);
                }
            }
        }
    }
}

vmRenderer.prototype.update = function () {
    this.ctx.clearRect(0, 0, vmCanvas.width, vmCanvas.height);
    vmCanvas.width = canvas.width;
    this.drawVoiceNames();
    this.drawMeasureLines();
    this.ctx.setLineDash([5, 0]);
    this.createTrajectories();
    this.drawTrajectories();
}

vmRenderer.prototype.drawTrajectories = function () {
    for (var voiceName in this.trajectories)
        this.trajectories[voiceName].draw();
}

vmRenderer.prototype.calcIntersections = function () {

}

function segment(startX, startY, endX, endY) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    //this.m = (this.endY - this.startY)/(this.endX - this.startX);
}

vmRenderer.prototype.getCanvasPosition = function (y, voiceName) {
    if(voiceName == "alto" || voiceName == "soprano")
        y+=40;
    if(voiceName == "tenore" || voiceName == "soprano")
        y+=30;
    return ((y-55)/180)*125;
}

segment.prototype.draw = function () {
    vmRenderer.ctx.beginPath();
    vmRenderer.ctx.moveTo(this.startX, this.startY);
    vmRenderer.ctx.lineTo(this.endX, this.endY);
    vmRenderer.ctx.stroke();
}

/*segment.prototype.isIntersecting = function (otherSegment) {
 var x=((this.startX*this.endY-this.startY*this.endX)*(otherSegment.startX-otherSegment.endX)-(this.startX-this.endX)*(otherSegment.startX*otherSegment.endY-otherSegment.startY*otherSegment.endX)) /
 ((this.startX-this.endX)*(otherSegment.startY-otherSegment.endY)-(this.startY-this.endY)*(otherSegment.startX-otherSegment.endX));
 var y=((this.startX*this.endY-this.startY*this.endX)*(otherSegment.startY-otherSegment.endY)-(this.startY-this.endY)*(otherSegment.startX*otherSegment.endY-otherSegment.startY*otherSegment.endX)) /
 ((this.startX-this.endX)*(otherSegment.startY-otherSegment.endY)-(this.startY-this.endY)*(otherSegment.startX-otherSegment.endX));
 if (isNaN(x)||isNaN(y)) {
 return false;
 } else {
 if (this.startX>=this.endX) {
 if (!(this.endX<=x&&x<=this.startX)) {return false;}
 } else {
 if (!(this.startX<=x&&x<=this.endX)) {return false;}
 }
 if (this.startY>=this.endY) {
 if (!(this.endY<=y&&y<=this.startY)) {return false;}
 } else {
 if (!(this.startY<=y&&y<=this.endY)) {return false;}
 }
 if (otherSegment.startX>=otherSegment.endX) {
 if (!(otherSegment.endX<=x&&x<=otherSegment.startX)) {return false;}
 } else {
 if (!(otherSegment.startX<=x&&x<=otherSegment.endX)) {return false;}
 }
 if (otherSegment.startY>=otherSegment.endY) {
 if (!(otherSegment.endY<=y&&y<=otherSegment.startY)) {return false;}
 } else {
 if (!(otherSegment.startY<=y&&y<=otherSegment.endY)) {return false;}
 }
 }
 return true;
 }*/

segment.prototype.calcIntersection = function (otherSegment) {
    var m1 = (this.startY - this.endY) / (this.startX - this.endX);  // slope of line 1
    var m2 = (otherSegment.startY - otherSegment.endY) / (otherSegment.startX - otherSegment.endX);  // slope of line 2
    if (m1 - m2 >= Number.EPSILON) {
        var x = (m1 * this.startX - m2 * otherSegment.startX + otherSegment.startY - this.startY) / (m1 - m2);
        var y = (m1 * m2 * (otherSegment.startX - this.startX) + m2 * this.startY - m1 * otherSegment.startY) / (m2 - m1);
        if (Math.min(this.startX, otherSegment.startX) >= x &&
            Math.max(this.endX, otherSegment.endX) <= x)
            return [x, y];
    }
    return undefined;
}

function trajectory() {
    this.segments = [];
}

trajectory.prototype.getSegmentsBetween = function (x1, x2) {
    var toReturn = [];
    for (var i in this.segments) {
        if (this.segments[i].endX < x1 || this.segments[i].startX > x2)
            continue;
        toReturn.push(this.segments[i]);
    }
    return toReturn;
}

trajectory.prototype.push = function (segment) {
    this.segments.push(segment);
}

trajectory.prototype.draw = function () {
    for (var i in this.segments)
        this.segments[i].draw();
}
