function svg_clicked(){    
    hideHelp();
    if (events.length>0 && events[events.length-1].type=="click" && (new Date().getTime() - events[events.length-1].time) < 200){
    } else {
	if (creating_prop) {
	    creating_prop = false
	    document.getElementById("prop_cr_message").remove()
	} else {
	    const mx = event.clientX
	    const my = event.clientY
	    addClass(mx,my,undefined)
	}
    }
}
var classDragged
var dragging = false
var timeStarted
var deltaX
var deltaY
function classDragStart(eln){
	el = document.getElementById(eln)	
    timeStarted = new Date().getTime()
    if (!dragging){
	classDragged = el
	deltaX=parseInt(el.getAttribute("cx"))-event.clientX
	deltaY=parseInt(el.getAttribute("cy"))-event.clientY	
    } 
}
function classDragOver(){
    if (dragging){
	classDragged.setAttribute("cx", event.clientX+deltaX)
	classDragged.setAttribute("cy", event.clientY+deltaY)
	var tel = classDragged.parentNode.childNodes[1]
	var mx = parseInt(classDragged.getAttribute("cx"))
	var my = parseInt(classDragged.getAttribute("cy"))
        var cltl = tel.getBBox().width
        var clth = tel.getBBox().height      
        tel.setAttribute("x", mx-(cltl/2))
        tel.setAttribute("y", my+(clth/4))
    }
}
function class_clicked(eln){
	el = document.getElementById(eln)
	if (new Date().getTime() - timeStarted > 300) {
	dragging = true
        events.push({type: "click", caughtby: "class__clicked", time: new Date().getTime()})	
	var clname = el.parentNode.childNodes[1].innerHTML
	const txt = document.createElement("div")
	txt.setAttribute("style", "position:fixed; bottom: 20px; left:20%; text-align: center; width: 60%;")
	txt.setAttribute("id","prop_cr_message")
	txt.innerHTML="Dragging class "+clname+". Click/tap again to stop."
	document.getElementsByTagName("BODY")[0].appendChild(txt);
	return
    } else if (dragging) {
	dragging=false
        events.push({type: "click", caughtby: "class__clicked", time: new Date().getTime()})
	var clid = el.parentNode.getAttribute("id")
	var props = document.getElementsByClassName("property_"+clid)
	var toremove = []
	for(var p in props)
	    if (typeof props[p].remove == "function") toremove.push(props[p])	    
	for(var e in toremove) {
	    var classID1 = toremove[e].getAttribute("class").split(" ")[1].substring(9)
	    var classID2 = toremove[e].getAttribute("class").split(" ")[2].substring(9)	    
	    console.log(classID1+" "+classID2)
		var x1 = parseInt(document.getElementById(classID1).childNodes[0].getAttribute("cx"))
	    var y1 = parseInt(document.getElementById(classID1).childNodes[0].getAttribute("cy"))
	    var x2 = parseInt(document.getElementById(classID2).childNodes[0].getAttribute("cx"))
	    var y2 = parseInt(document.getElementById(classID2).childNodes[0].getAttribute("cy"))
	    var label = toremove[e].childNodes[4].innerHTML
	    console.log(x1+" "+y1+" "+x2+" "+y2)
	    addProperty(x1,y1,x2,y2,classID1,classID2, label)
	    toremove[e].remove()
	}
	document.getElementById("prop_cr_message").remove()
	return 
    }
    if (events.length>0 && events[events.length-1].type=="click" && (new Date().getTime() - events[events.length-1].time) < 200){
    } else {
        events.push({type: "click", caughtby: "class__clicked", time: new Date().getTime()})
	if (creating_prop){
	    creating_prop = false
	    document.getElementById("prop_cr_message").remove()	    
	    var x1 = parseFloat(prop_origin.getAttribute("cx"))
	    var y1 = parseFloat(prop_origin.getAttribute("cy"))
	    var x2 = parseFloat(el.getAttribute("cx"))
	    var y2 = parseFloat(el.getAttribute("cy"))
	    var classId1 = prop_origin.parentNode.getAttribute('id')
	    var classId2 = el.parentNode.getAttribute('id')	    
	    addProperty(x1,y1,x2,y2,classId1,classId2, undefined)
	} else {
	    creating_prop = true
	    prop_origin = el
	    const txt = document.createElement("div")
	    txt.setAttribute("style", "position:fixed; bottom: 25px; left:20%; text-align: center; width: 60%;")
	    txt.setAttribute("id","prop_cr_message")
	    txt.innerHTML="Creating a relation. Select the destination concept (or click/tap in white space to cancel)."
	    document.getElementsByTagName("BODY")[0].appendChild(txt);
	}
    }
}
function class_name_clicked(eln){
    events.push({type: "click", caughtby: "class_name_clicked", time: new Date().getTime()})
	el = document.getElementById(eln)
    changeClassName(el, el.innerHTML)
}
function property_name_clicked(eln){
    events.push({type: "click", caughtby: "property_name_clicked", time: new Date().getTime()})
	el = document.getElementById(eln)
	changePropertyName(el, el.innerHTML)
}
function showPrefixes(){
    if (document.getElementById("prefixes").style.display == "block")
	document.getElementById("prefixes").style.display = "none"
    else
	document.getElementById("prefixes").style.display = "block"
}
function showHelp(){
    if (document.getElementById("help_dialog").style.display == "block")
	document.getElementById("help_dialog").style.display = "none"
    else
	document.getElementById("help_dialog").style.display = "block"	
}
function hideHelp(){
    document.getElementById("help_dialog").style.display = "none"
}
