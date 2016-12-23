function vmRenderer(measures) {
    this.ctx = vmCanvas.getContext("2d");
    this.drawVoiceNames();
    this.measures = measures;
    this.trajectories = {
        "basso": new trajectory(),
        "tenore": new trajectory(),
        "alto": new trajectory(),
        "soprano": new trajectory()
    };
    measures.subscribe(this);
}

vmRenderer.prototype.drawVoiceNames = function () {
    this.ctx.font = "12px Arial";
    this.ctx.fillText("Basso", 0, 100);
    this.ctx.fillText("Tenore", 0, 80);
    this.ctx.fillText("Alto", 0, 40);
    this.ctx.fillText("Soprano", 0, 20);
}

vmRenderer.prototype.drawMeasureLines = function () {
    var width = 0;
    this.ctx.setLineDash([5, 2]);
    for (var i = 0; i < this.measures.length; i++) {
        var x = this.measures[i].bassStave.end_x;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 20);
        this.ctx.lineTo(x, 100);
        this.ctx.stroke();
        width += this.measures[i].bassStave.width;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(0, 60);
    this.ctx.lineTo(width+10, 60);
    this.ctx.stroke();
}

vmRenderer.prototype.createTrajectories = function(){
    for(var i in this.measures) {
        for(var voiceName in this.measures[i].voices) {
            if(this.measures[i].notesArr[voiceName].length >= 2) {
                var count = 0;
                for(var note in this.measures[i].voices[voiceName]) {

                }
            }
        }
    }
}

vmRenderer.prototype.update = function () {
    //this.ctx.clearRect(0, 0, vmCanvas.width, vmCanvas.height);
    vmCanvas.width = canvas.width;
    this.drawVoiceNames();
    this.drawMeasureLines();
}

function segment(startX, startY, endX, endY) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    //this.m = (this.endY - this.startY)/(this.endX - this.startX);
}

segment.prototype.draw = function () {
    vmRenderer.ctx.moveTo(this.startX, this.startY);
    vmRenderer.ctx.lineTo(this.endX, this.endY);
    vmRenderer.ctx.stroke();
}

segment.prototype.isIntersecting = function (otherSegment) {
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
}

function trajectory() {
    this.segments = [];
}

trajectory.prototype.getSegmentsBetween = function (x1, x2) {
    var toReturn = [];
    for(var i in this.segments) {
        if(this.segments[i].endX < x1 || this.segments[i].startX > x2)
            continue;
        toReturn.push(this.segments[i]);
    }
    return toReturn;
}

trajectory.prototype.push = function(segment){
    this.segments.push(segment);
}