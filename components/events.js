var DRAG_THRESHOLD = 5;
var pointerState = null;

// Handles all pointer releases on the SVG surface:
//   - No active state + released on background → create new concept
//   - Active 'connect' drag → complete or cancel relation
//   - Active 'node' drag → finish move, redraw attached relations
function svgPointerUp(event) {
    hideHelp();

    if (!pointerState) {
        if (event.target === event.currentTarget) {
            // Dismiss any open edit panel before creating a new concept
            var openDiags = document.getElementsByClassName('diag')
            if (openDiags.length > 0) { closeDiag(); return; }
            addClass(event.clientX, event.clientY, undefined);
        }
        return;
    }

    if (pointerState.type === 'connect') {
        var previewLine = document.getElementById('connect_preview');
        if (previewLine) previewLine.remove();
        var target = event.target;
        var isNode = target && target.classList &&
            (target.classList.contains("owbo_class") ||
             target.classList.contains("owbo_individual") ||
             target.classList.contains("owbo_datatype"));
        if (isNode) {
            var oc = pointerState.originCircle;
            if (oc.parentNode !== target.parentNode) {
                addProperty(
                    parseFloat(oc.getAttribute("cx")),
                    parseFloat(oc.getAttribute("cy")),
                    parseFloat(target.getAttribute("cx")),
                    parseFloat(target.getAttribute("cy")),
                    oc.parentNode.getAttribute("id"),
                    target.parentNode.getAttribute("id"),
                    undefined
                );
            }
        }
        document.body.classList.remove('connecting');
        pointerState = null;
        return;
    }

    if (pointerState.type === 'node') {
        if (pointerState.moved) {
            redrawRelationsForNode(pointerState.el.parentNode.getAttribute("id"));
        }
        pointerState = null;
    }
}

function classDragStart(eln, event) {
    event.stopPropagation();
    var el = document.getElementById(eln);
    pointerState = {
        type: 'node',
        el: el,
        startX: event.clientX,
        startY: event.clientY,
        deltaX: parseInt(el.getAttribute("cx")) - event.clientX,
        deltaY: parseInt(el.getAttribute("cy")) - event.clientY,
        moved: false
    };
}

function classDragOver(event) {
    if (!pointerState) return;

    if (pointerState.type === 'node') {
        var dx = event.clientX - pointerState.startX;
        var dy = event.clientY - pointerState.startY;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) pointerState.moved = true;
        if (pointerState.moved) {
            var el = pointerState.el;
            el.setAttribute("cx", event.clientX + pointerState.deltaX);
            el.setAttribute("cy", event.clientY + pointerState.deltaY);
            positionHandles(el.parentNode.getAttribute("id"));
            var tel = el.parentNode.childNodes[1];
            var mx = parseInt(el.getAttribute("cx"));
            var my = parseInt(el.getAttribute("cy"));
            tel.setAttribute("x", mx - (tel.getBBox().width / 2));
            tel.setAttribute("y", my + (tel.getBBox().height / 4));
        }
    } else if (pointerState.type === 'connect') {
        var pl = document.getElementById('connect_preview');
        if (pl) {
            pl.setAttribute("x2", event.clientX);
            pl.setAttribute("y2", event.clientY);
        }
    }
}

function connectHandleStart(groupId, event) {
    event.stopPropagation();
    var handle = event.target;
    var originCircle = document.getElementById(groupId + "_circle");
    var previewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    previewLine.setAttribute("x1", handle.getAttribute("cx"));
    previewLine.setAttribute("y1", handle.getAttribute("cy"));
    previewLine.setAttribute("x2", event.clientX);
    previewLine.setAttribute("y2", event.clientY);
    previewLine.setAttribute("style", "stroke:#254468;stroke-width:1.5px;stroke-dasharray:5 3;pointer-events:none;");
    previewLine.setAttribute("id", "connect_preview");
    svg.appendChild(previewLine);
    pointerState = { type: 'connect', originCircle: originCircle };
    document.body.classList.add('connecting');
}

function redrawRelationsForNode(clid) {
    var props = document.getElementsByClassName("property_" + clid);
    var toremove = [];
    for (var p in props)
        if (typeof props[p].remove == "function") toremove.push(props[p]);
    for (var e in toremove) {
        var cls = toremove[e].getAttribute("class").split(" ");
        var classID1 = cls[1].substring(9);
        var classID2 = cls[2].substring(9);
        var x1 = parseInt(document.getElementById(classID1).childNodes[0].getAttribute("cx"));
        var y1 = parseInt(document.getElementById(classID1).childNodes[0].getAttribute("cy"));
        var x2 = parseInt(document.getElementById(classID2).childNodes[0].getAttribute("cx"));
        var y2 = parseInt(document.getElementById(classID2).childNodes[0].getAttribute("cy"));
        var label = toremove[e].childNodes[4].innerHTML;
        addProperty(x1, y1, x2, y2, classID1, classID2, label);
        toremove[e].remove();
    }
}

// Backward-compat stub for onpointerup="class_clicked(...)" in saved HTML files.
// The SVG-level onpointerup handles everything; this is a no-op.
function class_clicked() {}

function class_name_clicked(eln, event) {
    event.stopPropagation();
    var el = document.getElementById(eln);
    changeClassName(el, el.innerHTML);
}

function property_name_clicked(eln, event) {
    event.stopPropagation();
    var el = document.getElementById(eln);
    changePropertyName(el, el.innerHTML);
}

function showPrefixes() {
    var el = document.getElementById("prefixes");
    el.style.display = el.style.display == "block" ? "none" : "block";
}

function showHelp() {
    var el = document.getElementById("help_dialog");
    el.style.display = el.style.display == "block" ? "none" : "block";
}

function hideHelp() {
    document.getElementById("help_dialog").style.display = "none";
}
