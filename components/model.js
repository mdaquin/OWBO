var clcount=0;
var pcount=0;
var existingProp = {}

function addClass(mx,my,name){
    const clg = document.createElementNS("http://www.w3.org/2000/svg", "g")
    clg.setAttribute("id", "class_"+(clcount++))  
    const clcir = document.createElementNS("http://www.w3.org/2000/svg", "ellipse")
    clcir.setAttribute("cx", mx)
    clcir.setAttribute("cy", my)
    clcir.setAttribute("rx", "60")
    clcir.setAttribute("ry", "30")
    clcir.setAttribute("draggable", "true")    
    clcir.setAttribute("class", "owbo_class")
    clcir.onpointerdown = function() {classDragStart(this);}
    clcir.onmousemove = function() {classDragOver(this);}
//    clcir.onmouseleave = function() {class_clicked(this);}
    clcir.onpointerup = function() {class_clicked(this);}
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
    cltext.onclick = function() { class_name_clicked(this) }
    // clcir.setAttribute("fill", classColour)
    if (name) {
        let isLiteral = ['string','integer','int','float'].includes(name);
	    // clcir.setAttribute("fill", isLiteral ? litColour : classColour);
	    clcir.setAttribute("class", isLiteral ? "owbo_literal" : "owbo_class") 
    } else changeClassName(cltext, undefined)
    return "class_"+(clcount-1)
}

function addProperty(ox1,y1,ox2,y2,c1,c2,pname){
    var x1 = ox1; var x2 = ox2;
    if (ox1==ox2 && y1==y2) {x1 = ox1 - 20; x2 = ox2 + 20;}
    const pg = document.createElementNS("http://www.w3.org/2000/svg", "g")
    pg.setAttribute("id", "property_"+(pcount++))
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
    console.log(mx+" "+my+" "+l+" "+cosa+" "+sina)
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
    pg.appendChild(ptext)
    svg.insertBefore(pg, svg.childNodes[0])
    var cltl = ptext.getBBox().width
    var clth = ptext.getBBox().height      
    ptext.setAttribute("x", mx-10-(cltl/2))
    ptext.setAttribute("y", my-10+(clth/4))
    ptext.setAttribute("class", "owbo_property_name")
    ptext.onclick = function() {property_name_clicked(this)}
    if (!pname)
	changePropertyName(ptext, undefined)
    else if (pname=="isa"){
	    pline11.parentNode.children[0].setAttribute("style",  "stroke-width: 1px; stroke: black;")
	    pline12.parentNode.children[1].setAttribute("style",  "stroke-width: 1px; stroke: black;")	
	}
}
function changeClassName(el, v){
    var diags = document.getElementsByClassName('diag')
    if (diags.length!=0) diags[0].remove()
    const body = document.getElementsByTagName("BODY")[0]
    const ndiv = document.createElement("div")
    const pp = el.parentNode    
    ndiv.setAttribute("style", "position:fixed; top: 20px; left: 20%; width: 60%; background: white; border: 1px solid #666; border-radius: 10px; padding: 10px 10px 10px 10px;")
    ndiv.setAttribute("id", "diag_n_"+pp.id)
    ndiv.setAttribute("class", "diag")    
    const inputtext = document.createElement("input")
    inputtext.setAttribute("type", "text")
    inputtext.setAttribute("style", "width: 95%; border: 1px solid #aaa; padding: 5px 5px 5px 5px; border-radius: 5px; font-size:120%")
    inputtext.setAttribute("placeholder", "concept name")
    inputtext.setAttribute("id", "class_name_input")
    if (v) inputtext.setAttribute("value", v)
    inputtext.onchange = function() {
        const litMap = { 
            'string':'string',
            'str':'string',
            'integer':'integer',
            'int':'integer',
            'float':'float',
            'double':'float'
        };
        var newname = this.value;
        var isLiteral = newname.toLowerCase() in litMap;
        if (isLiteral) { newname = litMap[newname.toLowerCase()] };
        el.innerHTML = newname
        const p = el.previousSibling
        var mx = parseInt(p.getAttribute("cx"))
        var my = parseInt(p.getAttribute("cy"))
        var cltl = el.getBBox().width
        var clth = el.getBBox().height      
        el.setAttribute("x", mx-(cltl/2))
        el.setAttribute("y", my+(clth/4))
        p.setAttribute("rx", (cltl/2)+20)
        p.setAttribute("ry", (clth/2)+20)
	    // p.setAttribute("fill", isLiteral ? litColour : classColour);
	    p.setAttribute("class", isLiteral ? "owbo_literal" : "owbo_class") 
        // ndiv.remove()
    }
    const message = document.createElement("p")
    message.setAttribute("class", "message")
    message.innerHTML='Type <i>string</i>, <i>str</i>, <i>integer</i>, <i>int</i> or <i>float</i> if this is a datatype rather than a concept.'
    // this was not working...
    // var links = message.getElementsByTagName('a')
    // for (var l in links) links[l].onclick = function(e){
    //    	preventDefaults(e)
    //    	inputtext.value = e.target.textContent
    //    	inputtext.onchange()
    //}

    const dl = document.createElement("a")
    dl.href= "javascript:deleteClass('"+pp.id+"');"
    dl.innerHTML = "delete"
    dl.setAttribute("class", "delete_button")
    dl.id = "delete_class_button"
    if (!v) dl.style="display:none;"

    const ca = document.createElement("a")
    if (!v) ca.href= "javascript:deleteClass('"+pp.id+"');"
    else ca.href= "javascript:cancelClass('"+v+"');"
    ca.innerHTML = "cancel"
    ca.setAttribute("class", "cancel_button")
    ca.id = "cancel_class_button"

    const dob = document.createElement("a")
    dob.href= "javascript:closeDiag();"
    dob.innerHTML = "done"
    dob.setAttribute("class", "done_button")
  
    ndiv.appendChild(inputtext)
    ndiv.appendChild(message)    
    ndiv.appendChild(dob)
    ndiv.appendChild(ca)
    ndiv.appendChild(dl)
    body.appendChild(ndiv)
    inputtext.focus()
}

function cancelClass(v){
    console.log(v)
    document.getElementById("class_name_input").value = v
    document.getElementById("class_name_input").onchange()
    closeDiag()  
}

function closeDiag(){
    document.getElementsByClassName('diag')[0].remove()
}

function changePropertyName(el, v){
    var diags = document.getElementsByClassName('diag')
    if (diags.length!=0) diags[0].remove()
    const body = document.getElementsByTagName("BODY")[0]
    const ndiv = document.createElement("div")
    const pp = el.parentNode
    ndiv.setAttribute("style", "position:fixed; top: 20px; left: 20%; width: 60%; background: white; border: 1px solid #666; border-radius: 10px; padding: 10px 10px 10px 10px")
    ndiv.setAttribute("id", "diag_n_"+pp.id)
    ndiv.setAttribute("class", "diag")    
    const inputtext = document.createElement("input")
    inputtext.setAttribute("type", "text")
    inputtext.setAttribute("style", "width: 100%; border: 1px solid #aaa; padding: 5px 5px 5px 5px; border-radius: 5px;font-size: 120%")
    inputtext.setAttribute("placeholder", "relation name")
    if (v){
	inputtext.setAttribute("value", v)
    }
    inputtext.onchange = function() {
	var newname = this.value
	el.parentNode.children[0].setAttribute("style",  "stroke-width: 1px; stroke: black; stroke-dasharray: 3 1;")
	el.parentNode.children[1].setAttribute("style",  "stroke-width: 1px; stroke: black; stroke-dasharray: 3 1;")	
	if (newname.toLowerCase() == "subclassof" || newname.toLowerCase() == "isa"){
	    newname = "isa"
	    el.parentNode.children[0].setAttribute("style",  "stroke-width: 1px; stroke: black;")
	    el.parentNode.children[1].setAttribute("style",  "stroke-width: 1px; stroke: black;")	
	}
	el.innerHTML = newname
	const p = el.previousSibling
	var mx = parseFloat(p.getAttribute("x1"))
	var my = parseFloat(p.getAttribute("y1"))
        var cltl = el.getBBox().width
        var clth = el.getBBox().height      
        el.setAttribute("x", mx-10-(cltl/2))
        el.setAttribute("y", my-10+(clth/4))
	// ndiv.remove()
	  }
    const message = document.createElement("p")
    message.setAttribute("class", "message")
    message.innerHTML="Type <i>isa</i> for a subconcept (between concept) or a type (between individual and concept) relation."
    var links = message.getElementsByTagName('a')
    for (var l in links) links[l].onclick = function(e){
        	preventDefaults(e)
        	inputtext.value = e.target.textContent
        	inputtext.onchange()
    }
    
    const dl = document.createElement("a")
    dl.href= "javascript:deleteProperty('"+pp.id+"');"
    dl.innerHTML = "delete"
    dl.setAttribute("class", "delete_button")
    dl.id = "delete_prop_button"
    if (!v) dl.style="display:none;"

    const ca = document.createElement("a")
    if (!v) ca.href= "javascript:deleteProperty('"+pp.id+"');"
    else ca.href= "javascript:cancelProperty('"+v+"');"
    ca.innerHTML = "cancel"
    ca.setAttribute("class", "cancel_button")
    ca.id = "cancel_property_button"

    const dob = document.createElement("a")
    dob.href= "javascript:closeDiag();"
    dob.innerHTML = "done"
    dob.setAttribute("class", "done_button")
  
    ndiv.appendChild(inputtext)
    ndiv.appendChild(message)
    ndiv.appendChild(dob)
    ndiv.appendChild(ca)
    ndiv.appendChild(dl)
    body.appendChild(ndiv)
    inputtext.focus()    
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
