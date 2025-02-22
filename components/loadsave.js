// this is very, very much deprecated
function load(e) {
    var file = e.target.files[0]
    loadFile(file)
}
function loadFile(file){
    document.getElementsByTagName('svg')[0].innerHTML=''
    existingProp = {}
    //var file = e.target.files[0]
    document.getElementById("onto-name").value = file.name.replace(/\.ttl/, '')
    if (!file) {
	return
    }
    var reader = new FileReader()
    reader.onload = function(e) {
	const contents = e.target.result
	var lines = contents.split(/\r?\n/)

	var prefstr = ""
	var properties = {}
	var classes = {}
	
	/** BEGIN alexdma's alternative miniparser */
	var chunks = contents.split(/\.\s+/)
	for (var ii in chunks) {
	    var chu = chunks[ii];
	    var stmts = chu.split(/\s*;\s*/);
	    var subj = stmts[0].split(/\s+/)[0];
	    for( var iii in stmts) {
            var stmt = stmts[iii].trim();
            var tr = stmt.split(/\s+/);
            if (tr[0]=='@base' || tr[0]=='@prefix')
                prefstr += tr[0]+' '+tr[1]+' '+(tr[2]?tr[2]:'')+'. \n';
            else {
                //var prop = tr.length == 2 || tr[1].startsWith('"') || tr[1].startsWith('[') ? tr[0] : tr[1];
            }
	    }
	}
	/** END alexdma's alternative miniparser */
	for (var l in lines){
	    var tr = lines[l].split(/  */)
	    if (tr[0]=='@base' || tr[0]=='@prefix')
		prefstr += lines[l]+'\n'
	    else {
	    //console.log(tr)
		if (tr.length > 3){
		    if (tr[1]=='rdfs:domain'){
			if (!properties[tr[0]])
			    properties[tr[0]] = []			
			if (properties[tr[0]].length > 0 &&
			    !properties[tr[0]][properties[tr[0]].length-1].domain)
			    properties[tr[0]][properties[tr[0]].length-1].domain = tr[2]
			else
			    properties[tr[0]].push({'domain': tr[2]})
		    }
		    if (tr[1]=='rdfs:range'){
			if (!properties[tr[0]])
			    properties[tr[0]] = []
			if (properties[tr[0]].length > 0 &&
			    !properties[tr[0]][properties[tr[0]].length-1].range)
			    properties[tr[0]][properties[tr[0]].length-1].range = tr[2]
			else
			    properties[tr[0]].push({'range': tr[2]})
		    }
		    if (tr[1]=='rdfs:subClassOf'){
			if (!properties["isa"])
			    properties["isa"] = []			
			properties["isa"].push({'domain': tr[0], 'range': tr[2]})
		    }
		    if (tr[1]=='owbo:x'){
			if (classes[tr[0]])
			    classes[tr[0]].x = tr[2]
			else			    
			    classes[tr[0]] = {'x': tr[2]}
		    }
		    if (tr[1]=='owbo:y'){
			if (classes[tr[0]])
			    classes[tr[0]].y = tr[2]
			else			    
			    classes[tr[0]] = {'y': tr[2]}
		    }
		}
	    }
	}
	console.log(properties)
	console.log(classes)	
	document.getElementById('prefixes_ta').value=prefstr
	var clids = {}
	for (var c in classes){
	    var clid = addClass(parseInt(classes[c].x), parseInt(classes[c].y), c.replace(/>/,'').replace(/</,'').replace("xsd:", ""))
	    clids[c] = clid
	}
	console.log(clids)
	for (var p in properties){
	    for(var i in properties[p]){
		pr = properties[p][i]	    
		console.log(p)
		console.log(pr)
		console.log(pr.domain)
		console.log(classes)
		addProperty(parseInt(classes[pr.domain].x),
			    parseInt(classes[pr.domain].y),
			    parseInt(classes[pr.range].x),
			    parseInt(classes[pr.range].y), 
			    clids[pr.domain],
			    clids[pr.range], p.replace(/>/,'').replace(/</,'').replace("xsd:", ""))
	    }
	}
    };
    reader.readAsText(file);
}

// this should be called export
function save() {
    events.push({type: "click", caughtby: "save", time: new Date().getTime()})
    var data = document.getElementById("prefixes_ta").value
    data += "\n@prefix owbo: <http://datascienceinstitute.ie/owbo/> . \n"
    const svg = document.getElementsByTagName('svg')[0]
    var gs = svg.getElementsByTagName('g')    
    var classes = {} // should be renamed entities
    var properties = {}
    for (var g in gs){
		if (gs[g] && gs[g].getAttribute){
	    	var id = gs[g].getAttribute('id')
	    	if (id.indexOf("property")==0){
		  		var cl = gs[g].getAttribute("class").split(' ')
		  		properties[id] = {}
		  		properties[id].name = toUri(gs[g].childNodes[4].innerHTML.replace(/ /g, '_'), "property")
		  		properties[id].from = cl[1].substring(9)
		  		properties[id].to = cl[2].substring(9)		
	    	} else if (id.indexOf("class")==0){
		  		classes[id] = {}
		  		const circle = document.getElementById(id+"_circle")
		  		classes[id].type = circle.getAttribute('class').replace("owbo_", "")
				classes[id].name=toUri(gs[g].childNodes[1].innerHTML.replace(/ /g, '_'), classes[id].type)
		  		classes[id].x=gs[g].childNodes[0].getAttribute('cx')
		  		classes[id].y=gs[g].childNodes[0].getAttribute('cy')
	    	}
		}
    }
    for(var p in properties) {
		if (properties[p].name == "<isa>") {
			if (classes[properties[p].from].type == "class")
	    		data += "\n"+classes[properties[p].from].name+" rdfs:subClassOf "+classes[properties[p].to].name+" . "
			else if (classes[properties[p].from].type == "individual")
	    		data += "\n"+classes[properties[p].from].name+" rdf:type "+classes[properties[p].to].name+" . "
		} else {
			if (classes[properties[p].from].type == "class" && 
				(classes[properties[p].to].type == "class" ||
				classes[properties[p].to].type == "datatype")) {
	  		  		data += "\n"+properties[p].name+" rdfs:domain "+classes[properties[p].from].name+" . "
	    	  		data += "\n"+properties[p].name+" rdfs:range "+classes[properties[p].to].name+" . "
			}
			else if (classes[properties[p].from].type == "individual" &&
					(classes[properties[p].to].type == "individual" || 
			 		classes[properties[p].to].type == "datatype")) {
						var nname = classes[properties[p].to].name
						if (classes[properties[p].to].type == "datatype")
							nname = '"'+classes[properties[p].to].name.
									replace("xsd:", "")+'"'
						data += "\n"+classes[properties[p].from].name+" "+
								properties[p].name+" "+
				        		nname+" . "
			 	}
    	}
	}
    // for(var p in classes){
	// 	data += "\n"+classes[p].name+" owbo:x "+classes[p].x+" . "
	// 	data += "\n"+classes[p].name+" owbo:y "+classes[p].y+" . "	
    // }
    var file = new Blob([data], {type: "text/plain"});
    var filename = "owbo_export.ttl" // document.getElementById("onto-name").value+".ttl"
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else { 
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}
function toUri(s,t){
    if (s.indexOf(':')!==-1) return 
	if (t == "datatype") return "xsd:"+s
    else return '<'+s+'>'
}
