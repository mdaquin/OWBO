
var existingProp = {}

function findLastClassNumer(){
    ln = 0
    cl = document.getElementsByClassName("owbo_class")
    for (var c in cl){
        if (cl[c].id){
            var n = parseInt(cl[c].id.replace("class_",""))
            if (n>ln) ln = n
        }
    }
    cl = document.getElementsByClassName("owbo_individual")
    for (var c in cl){
        if (cl[c].id){
            var n = parseInt(cl[c].id.replace("class_",""))
            if (n>ln) ln = n
        }
    }
    cl = document.getElementsByClassName("owbo_datatype")
    for (var c in cl){
        if (cl[c].id){
            var n = parseInt(cl[c].id.replace("class_",""))
            if (n>ln) ln = n
        }
    }
    return ln
}

function findLastPropertyNumber(){
    ln = 0
    pr = document.getElementsByClassName("owbo_property_name")
    for (var p in pr){
        if (pr[p].id){
            var n = parseInt(pr[p].id.replace("property_",""))
            if (n>ln) ln = n
        }
    }
    return ln
}

// Position the four connection handles at the cardinal edges of a node's ellipse.
function positionHandles(groupId) {
    var circle = document.getElementById(groupId + "_circle");
    if (!circle) return;
    var cx = parseFloat(circle.getAttribute("cx"));
    var cy = parseFloat(circle.getAttribute("cy"));
    var rx = parseFloat(circle.getAttribute("rx"));
    var ry = parseFloat(circle.getAttribute("ry"));
    var positions = { n: [cx, cy - ry], e: [cx + rx, cy], s: [cx, cy + ry], w: [cx - rx, cy] };
    for (var dir in positions) {
        var h = document.getElementById(groupId + "_handle_" + dir);
        if (h) {
            h.setAttribute("cx", positions[dir][0]);
            h.setAttribute("cy", positions[dir][1]);
        }
    }
}

// Add four connection handles to an existing node group (used for new nodes and
// for nodes loaded from a previously saved HTML file that pre-dates this feature).
function addHandlesToGroup(groupId) {
    var clg = document.getElementById(groupId);
    if (!clg) return;
    clg.setAttribute("class", "owbo_node_group");
    var circle = document.getElementById(groupId + "_circle");
    if (circle) circle.setAttribute("onclick", "event.stopPropagation()");
    var dirs = ['n', 'e', 's', 'w'];
    for (var d = 0; d < dirs.length; d++) {
        if (document.getElementById(groupId + "_handle_" + dirs[d])) continue;
        var handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        handle.setAttribute("r", "7");
        handle.setAttribute("class", "connect-handle");
        handle.id = groupId + "_handle_" + dirs[d];
        handle.setAttribute("onpointerdown", "connectHandleStart('" + groupId + "', event)");
        handle.setAttribute("onclick", "event.stopPropagation()");
        clg.appendChild(handle);
    }
    positionHandles(groupId);
}

function addClass(mx,my,name){
    clcount = findLastClassNumer()+1
    console.log("creating class "+clcount)
    const clg = document.createElementNS("http://www.w3.org/2000/svg", "g")
    clg.setAttribute("id", "class_"+(clcount))
    clg.setAttribute("class", "owbo_node_group")
    const clcir = document.createElementNS("http://www.w3.org/2000/svg", "ellipse")
    clcir.setAttribute("cx", mx)
    clcir.setAttribute("cy", my)
    clcir.setAttribute("rx", "60")
    clcir.setAttribute("ry", "30")
    clcir.setAttribute("class", "owbo_class")
    clcir.id = clg.id+"_circle"
    clcir.setAttribute("onpointerdown", "classDragStart('"+clg.id+"_circle', event)")
    clcir.setAttribute("onclick", "event.stopPropagation()")
    clg.appendChild(clcir)
    const cltext = document.createElementNS("http://www.w3.org/2000/svg", "text")
    clname = "New Concept"
    if (name) clname = name
    cltext.innerHTML= clname
    cltext.setAttribute("x", mx)
    cltext.setAttribute("y", my)
    cltext.setAttribute("style", "fill: #254468")
    clg.appendChild(cltext)
    svg.appendChild(clg)
    var cltl = cltext.getBBox().width
    var clth = cltext.getBBox().height
    cltext.setAttribute("x", mx-(cltl/2))
    cltext.setAttribute("y", my+(clth/4))
    cltext.setAttribute("class", "owbo_class_name")
    cltext.id = clg.id+"_name"
    cltext.setAttribute("onclick", "class_name_clicked('"+clg.id+"_name', event)")
    addHandlesToGroup(clg.id)
    if (name) {
        clcir.setAttribute("class", "owbo_class")
    } else changeClassName(cltext, undefined)
    return "class_"+(clcount-1)
}

function addProperty(ox1,y1,ox2,y2,c1,c2,pname){
    pcount=findLastPropertyNumber()+1
    console.log("creating property "+pcount)
    var x1 = ox1; var x2 = ox2;
    if (ox1==ox2 && y1==y2) {x1 = ox1 - 20; x2 = ox2 + 20;}
    const pg = document.createElementNS("http://www.w3.org/2000/svg", "g")
    pg.setAttribute("id", "property_"+(pcount))
    pg.setAttribute("class", "property_"+c1+"_"+c2+" property_"+c1+" property_"+c2)
    var mx = (x1+x2)/2
    var my = (y1+y2)/2
    var label = Math.max(x1,x2)+" "+Math.max(y1,y2)+" "+Math.min(x1,x2)+" "+Math.min(y1,y2)
    var l = Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2))
    var cosa = (x2-x1)/l
    var sina = (y2-y1)/l
    if (!existingProp[label]) existingProp[label] = 1
    else existingProp[label]++
    var sign = 1
    if (existingProp[label]%2==0) sign = -1
    if (ox1==ox2 && y1==y2) my = my + (sign*100)
    var increment = 20*Math.floor(existingProp[label]/2)
    if (Math.abs(cosa)>Math.abs(sina)) my += sign*increment
    else mx += sign*increment
    const pline11 = document.createElementNS("http://www.w3.org/2000/svg", "line")
    pline11.setAttribute("x1", x1)
    pline11.setAttribute("y1", y1)
    pline11.setAttribute("x2", mx)
    pline11.setAttribute("y2", my)
    pline11.setAttribute("style", "stroke-width: 1px; stroke: #254468; stroke-dasharray: 3 1;")
    pg.appendChild(pline11)
    const pline12 = document.createElementNS("http://www.w3.org/2000/svg", "line")
    pline12.setAttribute("x1", mx)
    pline12.setAttribute("y1", my)
    pline12.setAttribute("x2", x2)
    pline12.setAttribute("y2", y2)
    pline12.setAttribute("style", "stroke-width: 1px; stroke: #254468; stroke-dasharray: 3 1;")
    pg.appendChild(pline12)
    const pline2 = document.createElementNS("http://www.w3.org/2000/svg", "line")
    pline2.setAttribute("x1", mx)
    pline2.setAttribute("y1", my)
    pline2.setAttribute("x2", mx+((cosa*-10)-(sina*-5)))
    pline2.setAttribute("y2", my+((cosa*-5)-(sina*10)))
    pline2.setAttribute("style", "stroke-width: 1px; stroke: #254468")
    pg.appendChild(pline2)
    const pline3 = document.createElementNS("http://www.w3.org/2000/svg", "line")
    pline3.setAttribute("x1", mx)
    pline3.setAttribute("y1", my)
    pline3.setAttribute("x2", mx+((cosa*-10)-(sina*+5)))
    pline3.setAttribute("y2", my+((cosa*+5)-(sina*10)))
    pline3.setAttribute("style", "stroke-width: 1px; stroke: #254468")
    pg.appendChild(pline3)
    const ptext = document.createElementNS("http://www.w3.org/2000/svg", "text")
    ptext.innerHTML=pname
    if (!pname) ptext.innerHTML="New Relation"
    ptext.setAttribute("x", mx-10)
    ptext.setAttribute("y", my-10)
    ptext.setAttribute("style", "fill: #254468")
    ptext.setAttribute("class", "owbo_property_name")
    pg.appendChild(ptext)
    svg.insertBefore(pg, svg.childNodes[0])
    var cltl = ptext.getBBox().width
    var clth = ptext.getBBox().height
    ptext.setAttribute("x", mx-10-(cltl/2))
    ptext.setAttribute("y", my-10+(clth/4))
    ptext.id = pg.id+"_name"
    ptext.setAttribute("onclick", "property_name_clicked('"+pg.id+"_name', event)")
    if (!pname) changePropertyName(ptext, undefined)
    else if (pname=="isa"){
	    pline11.parentNode.children[0].setAttribute("style",  "stroke-width: 1px; stroke: black;")
	    pline12.parentNode.children[1].setAttribute("style",  "stroke-width: 1px; stroke: black;")
	}
}

function changeClassName(el, v){
    var diags = document.getElementsByClassName('diag')
    if (diags.length!=0) diags[0].remove()

    const pp = el.parentNode
    const circle = el.previousSibling
    const elc = document.getElementById(el.id.replace("_name", "_circle"))

    var svgEl = document.getElementsByTagName('svg')[0]
    var svgRect = svgEl.getBoundingClientRect()
    var cx = parseFloat(circle.getAttribute("cx"))
    var cy = parseFloat(circle.getAttribute("cy"))
    var rx = parseFloat(circle.getAttribute("rx"))
    var panelW = Math.max(rx * 2 + 20, 170)

    const ndiv = document.createElement("div")
    ndiv.setAttribute("id", "diag_n_"+pp.id)
    ndiv.setAttribute("class", "diag")
    ndiv.style.cssText = "position:fixed;background:white;border:1px solid #aaa;border-radius:8px;" +
        "padding:8px;box-shadow:0 2px 10px rgba(0,0,0,0.18);box-sizing:border-box;" +
        "width:"+panelW+"px;" +
        "left:"+(svgRect.left + cx - panelW/2)+"px;" +
        "top:"+(svgRect.top + cy - 16)+"px"

    // Name input — live update as the user types
    const inputtext = document.createElement("input")
    inputtext.type = "text"
    inputtext.id = "class_name_input"
    inputtext.placeholder = "concept name"
    inputtext.style.cssText = "width:100%;box-sizing:border-box;border:1px solid #aaa;" +
        "padding:4px 6px;border-radius:4px;font-size:100%;margin-bottom:6px;"
    if (v) inputtext.value = v

    var updateName = function() {
        el.innerHTML = inputtext.value
        var cltl = el.getBBox().width
        var clth = el.getBBox().height
        var mx = parseInt(circle.getAttribute("cx"))
        var my = parseInt(circle.getAttribute("cy"))
        el.setAttribute("x", mx-(cltl/2))
        el.setAttribute("y", my+(clth/4))
        circle.setAttribute("rx", Math.max(cltl/2+20, 40))
        circle.setAttribute("ry", Math.max(clth/2+20, 25))
        positionHandles(pp.id)
    }
    inputtext.oninput  = updateName
    inputtext.onchange = updateName

    // Type toggle buttons shown just below the node
    const typeRow = document.createElement("div")
    typeRow.style.cssText = "display:flex;gap:4px;margin-bottom:6px;"
    var currentType = elc.getAttribute("class")
    var typeDefs = [
        { cls:"owbo_class",      label:"Concept"    },
        { cls:"owbo_individual", label:"Individual" },
        { cls:"owbo_datatype",   label:"Datatype"   }
    ]
    typeDefs.forEach(function(t) {
        var btn = document.createElement("button")
        btn.textContent = t.label
        var active = currentType === t.cls
        btn.style.cssText = "flex:1;padding:3px 0;font-size:75%;border-radius:4px;cursor:pointer;" +
            "border:1px solid #254468;" +
            (active ? "background:#254468;color:white;" : "background:white;color:#254468;")
        btn.onclick = function(e) {
            e.stopPropagation()
            elc.setAttribute("class", t.cls)
            typeRow.querySelectorAll("button").forEach(function(b){
                b.style.background="white"; b.style.color="#254468"
            })
            btn.style.background="#254468"; btn.style.color="white"
        }
        typeRow.appendChild(btn)
    })

    // Subtle delete link, only for existing concepts
    const actionRow = document.createElement("div")
    actionRow.style.cssText = "display:flex;justify-content:flex-end;"
    if (v) {
        var delLink = document.createElement("a")
        delLink.href = "javascript:deleteClass('"+pp.id+"');"
        delLink.textContent = "delete"
        delLink.style.cssText = "color:#bbb;font-size:80%;text-decoration:none;cursor:pointer;"
        delLink.onmouseover = function(){ this.style.color="#c00" }
        delLink.onmouseout  = function(){ this.style.color="#bbb" }
        actionRow.appendChild(delLink)
    }

    ndiv.appendChild(inputtext)
    ndiv.appendChild(typeRow)
    ndiv.appendChild(actionRow)
    document.body.appendChild(ndiv)
    inputtext.focus()
    if (v) inputtext.select()

    inputtext.onkeydown = function(e) {
        if (e.key === "Enter")  closeDiag()
        if (e.key === "Escape") { if (v) cancelClass(v); else deleteClass(pp.id) }
    }
}

function cancelClass(v){
    console.log(v)
    document.getElementById("class_name_input").value = v
    document.getElementById("class_name_input").onchange()
    closeDiag()
}

function closeDiag(){
    var diags = document.getElementsByClassName('diag')
    if (diags.length != 0) diags[0].remove()
}

function changePropertyName(el, v){
    var diags = document.getElementsByClassName('diag')
    if (diags.length!=0) diags[0].remove()

    const pp = el.parentNode

    var svgEl = document.getElementsByTagName('svg')[0]
    var svgRect = svgEl.getBoundingClientRect()
    var bbox = el.getBBox()
    var centerX = svgRect.left + bbox.x + bbox.width / 2
    var topY    = svgRect.top  + bbox.y
    var panelW  = 240

    const ndiv = document.createElement("div")
    ndiv.setAttribute("id", "diag_n_"+pp.id)
    ndiv.setAttribute("class", "diag")
    // Horizontal inline layout: [input] [isa] [×]
    ndiv.style.cssText = "position:fixed;background:white;border:1px solid #aaa;border-radius:8px;" +
        "padding:6px 8px;box-shadow:0 2px 10px rgba(0,0,0,0.18);" +
        "display:flex;align-items:center;gap:6px;box-sizing:border-box;" +
        "width:"+panelW+"px;" +
        "left:"+(centerX - panelW/2)+"px;" +
        "top:"+(topY - 46)+"px"

    // Name input — live update as the user types
    const inputtext = document.createElement("input")
    inputtext.type = "text"
    inputtext.id = "property_name_input"
    inputtext.placeholder = "relation name"
    inputtext.style.cssText = "flex:1;min-width:0;border:1px solid #aaa;" +
        "padding:4px 6px;border-radius:4px;font-size:100%;"
    if (v) inputtext.value = v

    var updatePropertyName = function() {
        var newname = inputtext.value
        el.parentNode.children[0].setAttribute("style", "stroke-width:1px;stroke:black;stroke-dasharray:3 1;")
        el.parentNode.children[1].setAttribute("style", "stroke-width:1px;stroke:black;stroke-dasharray:3 1;")
        if (newname.toLowerCase() == "subclassof" || newname.toLowerCase() == "isa") {
            newname = "isa"
            inputtext.value = "isa"
            el.parentNode.children[0].setAttribute("style", "stroke-width:1px;stroke:black;")
            el.parentNode.children[1].setAttribute("style", "stroke-width:1px;stroke:black;")
        }
        el.innerHTML = newname
        var p = el.previousSibling
        var mx = parseFloat(p.getAttribute("x1"))
        var my = parseFloat(p.getAttribute("y1"))
        var cltl = el.getBBox().width
        var clth = el.getBBox().height
        el.setAttribute("x", mx-10-(cltl/2))
        el.setAttribute("y", my-10+(clth/4))
    }
    inputtext.oninput  = updatePropertyName
    inputtext.onchange = updatePropertyName

    // isa shortcut — one click to declare a subclass/type relation
    var isaBtn = document.createElement("button")
    isaBtn.textContent = "isa"
    isaBtn.title = "Make this a subclass / type-of relation"
    isaBtn.style.cssText = "padding:3px 8px;font-size:90%;border-radius:4px;cursor:pointer;" +
        "border:1px solid #254468;background:white;color:#254468;white-space:nowrap;flex-shrink:0;"
    isaBtn.onclick = function(e) {
        e.stopPropagation()
        inputtext.value = "isa"
        updatePropertyName()
        closeDiag()
    }

    ndiv.appendChild(inputtext)
    ndiv.appendChild(isaBtn)

    // Delete control, only for existing relations
    if (v) {
        var delLink = document.createElement("a")
        delLink.href = "javascript:deleteProperty('"+pp.id+"');"
        delLink.textContent = "×"
        delLink.title = "delete relation"
        delLink.style.cssText = "color:#bbb;font-size:120%;text-decoration:none;cursor:pointer;flex-shrink:0;"
        delLink.onmouseover = function(){ this.style.color="#c00" }
        delLink.onmouseout  = function(){ this.style.color="#bbb" }
        ndiv.appendChild(delLink)
    }

    document.body.appendChild(ndiv)
    inputtext.focus()
    if (v) inputtext.select()

    inputtext.onkeydown = function(e) {
        if (e.key === "Enter")  closeDiag()
        if (e.key === "Escape") { if (v) cancelProperty(v); else deleteProperty(pp.id) }
    }
}

function deleteClass(id){
    document.getElementById("diag_n_"+id).remove()
    document.getElementById(id).remove()
    var props = document.getElementsByClassName("property_"+id)
    console.log(props)
    var toremove = []
    for(var p in props)
	if (typeof props[p].remove == "function")
	    toremove.push(props[p])
    for(var e in toremove)
	toremove[e].remove()
}

function deleteProperty(id){
    document.getElementById("diag_n_"+id).remove()
    document.getElementById(id).remove()
}

function cancelProperty(v){
    console.log(v)
    document.getElementById("property_name_input").value = v
    document.getElementById("property_name_input").onchange()
    closeDiag()
}
