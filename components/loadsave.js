function showTTLImportWarning() {
    var existing = document.getElementById('ttl_import_warning');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.id = 'ttl_import_warning';
    div.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
        'background:white;color:#254468;border:1px solid #254468;border-radius:5px;' +
        'padding:15px 20px;max-width:500px;z-index:1000;box-shadow:0 2px 8px rgba(0,0,0,0.15)';
    div.innerHTML = '<strong>Import complete</strong><br><br>' +
        'Note: OWBO covers only a subset of OWL/RDF expressivity. ' +
        'Axioms not representable as labelled edges between named nodes ' +
        '(e.g. complex restrictions, imports, cardinalities) ' +
        'will not appear in the diagram and will be lost if you re-export. ' +
        'Annotations (labels, comments...) are not shown, but are kept and re-exported.<br><br>' +
        '<a href="javascript:document.getElementById(\'ttl_import_warning\').remove();" ' +
        'style="float:right;background:#254468;color:white;border-radius:5px;padding:5px 14px;text-decoration:none;font-size:14px">OK</a>' +
        '<div style="clear:both"></div>';
    document.body.appendChild(div);
}

function loadTTL(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var svgEl = document.getElementsByTagName('svg')[0];
        svgEl.innerHTML = '';
        svgEl.setAttribute('width', '100%');
        svgEl.setAttribute('height', '100%');
        existingProp = {};
        var parsed = turtleParse(e.target.result);
        buildOwboGraph(parsed.triples, parsed.prefixes);
        showTTLImportWarning();
    };
    reader.readAsText(file);
}

var WELL_KNOWN_NS = {
    rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    owl:  'http://www.w3.org/2002/07/owl#',
    xsd:  'http://www.w3.org/2001/XMLSchema#',
    owbo: 'https://mosaik.loria.fr/tool/owbo#'
};

function hasScheme(s) { return /^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(s); }

function resolveIri(rel, base) {
    if (hasScheme(rel) || !base) return rel;
    try { return new URL(rel, base).href; } catch (e) { return rel; }
}

// Canonical form of an IRI, so that the same entity always gets the same key
// however it was written: pfx:local for the standard vocabularies, <full-iri> otherwise.
function canonicalIri(iri) {
    for (var p in WELL_KNOWN_NS) {
        var ns = WELL_KNOWN_NS[p];
        if (iri.length > ns.length && iri.indexOf(ns) === 0) return p + ':' + iri.slice(ns.length);
    }
    return '<' + iri + '>';
}

function splitIri(iri) {
    var k = Math.max(iri.lastIndexOf('#'), iri.lastIndexOf('/'));
    return { ns: iri.slice(0, k + 1), local: iri.slice(k + 1) };
}

// Attribute of concept and relation groups holding their annotations, as JSON [[pred, obj], ...]
var ANNOTATIONS_ATTR = 'data-owbo-annotations';

// Annotation properties that need no declaration: the RDFS/OWL built-ins,
// Dublin Core, and the SKOS label and documentation properties.
var BUILTIN_ANNOTATIONS = ['rdfs:label', 'rdfs:comment', 'rdfs:seeAlso', 'rdfs:isDefinedBy',
    'owl:versionInfo', 'owl:deprecated', 'owl:priorVersion', 'owl:backwardCompatibleWith', 'owl:incompatibleWith'];
var SKOS_ANNOTATIONS = ['prefLabel', 'altLabel', 'hiddenLabel', 'note', 'changeNote', 'definition',
    'editorialNote', 'example', 'historyNote', 'scopeNote'];

function isBuiltinAnnotation(p) {
    if (typeof p !== 'string') return false;
    if (BUILTIN_ANNOTATIONS.indexOf(p) !== -1) return true;
    if (p.indexOf('<http://purl.org/dc/elements/1.1/') === 0 || p.indexOf('<http://purl.org/dc/terms/') === 0) return true;
    var skos = '<http://www.w3.org/2004/02/skos/core#';
    return p.indexOf(skos) === 0 && SKOS_ANNOTATIONS.indexOf(p.slice(skos.length, -1)) !== -1;
}

// Turtle text of a parsed term, with full IRIs so it does not depend on the prefix box.
// Returns null for terms that cannot be written on their own (blank nodes, lists).
function termToTurtle(t) {
    if (t && typeof t === 'object') {
        if (t.t !== 'lit') return null;
        var s = t.q !== undefined ? t.q : t.v;
        if (t.lang) s += '@' + t.lang;
        else if (t.dt) { var d = termToTurtle(t.dt); if (d) s += '^^' + d; }
        return s;
    }
    if (typeof t !== 'string' || t.indexOf('_:') === 0) return null;
    var c = t.indexOf(':');
    if (t.charAt(0) !== '<' && c > 0 && WELL_KNOWN_NS.hasOwnProperty(t.slice(0, c)))
        return '<' + WELL_KNOWN_NS[t.slice(0, c)] + t.slice(c + 1) + '>';
    return t;
}

function turtleTokenize(text) {
    var tokens = [], i = 0, n = text.length;
    while (i < n) {
        var c = text[i];
        if (c === '#') { while (i < n && text[i] !== '\n') i++; continue; }
        if (/\s/.test(c)) { i++; continue; }
        if (c === '<') {
            var j = i + 1;
            while (j < n && text[j] !== '>') { if (text[j] === '\\') j++; j++; }
            tokens.push({ t: 'uri', v: text.slice(i+1, j) });
            i = j + 1; continue;
        }
        if (c === '"') {
            // q keeps the literal as written (quotes and escapes), to write it back unchanged
            var lit, q;
            if (text.substr(i, 3) === '"""') {
                var j = i + 3;
                while (j < n && text.substr(j, 3) !== '"""') { if (text[j] === '\\') j++; j++; }
                lit = text.slice(i+3, j); q = text.slice(i, j+3);
                i = j + 3;
            } else {
                var j = i + 1;
                while (j < n && text[j] !== '"') { if (text[j] === '\\') j++; j++; }
                lit = text.slice(i+1, j); q = text.slice(i, j+1);
                i = j + 1;
            }
            if (i+1 < n && text[i] === '^' && text[i+1] === '^') {
                i += 2;
                if (i < n && text[i] === '<') {
                    var k = i + 1;
                    while (k < n && text[k] !== '>') k++;
                    tokens.push({ t: 'lit', v: lit, q: q, dt: { t: 'uri', v: text.slice(i+1, k) } });
                    i = k + 1;
                } else {
                    var k = i;
                    while (k < n && !/[\s,;.\[\]()"<>]/.test(text[k])) k++;
                    tokens.push({ t: 'lit', v: lit, q: q, dt: { t: 'w', v: text.slice(i, k) } });
                    i = k;
                }
            } else {
                var lang = '';
                if (i < n && text[i] === '@') { var k = i+1; while (k < n && /[a-zA-Z0-9\-]/.test(text[k])) k++; lang = text.slice(i+1, k); i = k; }
                tokens.push({ t: 'lit', v: lit, q: q, lang: lang });
            }
            continue;
        }
        if ('.,;[]()'.indexOf(c) >= 0) { tokens.push({ t: 'p', v: c }); i++; continue; }
        var j = i;
        while (j < n && !/[\s,;.\[\]()"<>#]/.test(text[j])) j++;
        if (j > i) { tokens.push({ t: 'w', v: text.slice(i, j) }); i = j; continue; }
        i++;
    }
    return tokens;
}

function turtleParse(text) {
    var toks = turtleTokenize(text), prefixes = {}, base = '', triples = [];
    var bnc = 0, i = 0, n = toks.length;

    function peek() { return i < n ? toks[i] : null; }
    function consume() { return i < n ? toks[i++] : null; }

    function resolve(tok) {
        if (!tok) return null;
        if (tok.t === 'uri') return canonicalIri(resolveIri(tok.v, base));
        if (tok.t === 'lit') return tok.dt ? { t: 'lit', v: tok.v, q: tok.q, dt: resolve(tok.dt) } : tok;
        if (tok.t === 'w') {
            if (tok.v === 'a') return 'rdf:type';
            if (/^([+-]?\d+|true|false)$/.test(tok.v)) return { t: 'lit', v: tok.v };
            var c = tok.v.indexOf(':');
            if (c >= 0) {
                var pfx = tok.v.slice(0, c);
                if (pfx !== '_' && prefixes.hasOwnProperty(pfx))
                    return canonicalIri(prefixes[pfx] + tok.v.slice(c + 1).replace(/\\(.)/g, '$1'));
            }
            return tok.v; // blank node label or undeclared prefix
        }
        return null;
    }

    function parseNode() {
        var tok = peek();
        if (!tok) return null;
        if (tok.t === 'p' && tok.v === '[') {
            consume();
            var bn = '_:owbo_b' + (bnc++);
            parsePOL(bn);
            if (peek() && peek().t === 'p' && peek().v === ']') consume();
            return bn;
        }
        if (tok.t === 'p' && tok.v === '(') {
            consume();
            var items = [];
            while (peek() && !(peek().t === 'p' && peek().v === ')')) {
                var item = parseNode();
                if (item !== null) items.push(item);
            }
            if (peek()) consume();
            return { t: 'list', items: items };
        }
        consume();
        return resolve(tok);
    }

    function parsePOL(subj) {
        while (i < n) {
            var tok = peek();
            if (!tok || (tok.t === 'p' && (tok.v === '.' || tok.v === ']'))) break;
            var pred = resolve(consume());
            if (!pred) break;
            while (i < n) {
                var obj = parseNode();
                if (obj !== null) triples.push([subj, pred, obj]);
                var nxt = peek();
                if (!nxt || nxt.t !== 'p') break;
                if (nxt.v === ',') { consume(); continue; }
                if (nxt.v === ';') { consume(); break; }
                break;
            }
        }
    }

    while (i < n) {
        var tok = peek();
        if (!tok) break;
        if (tok.t === 'p' && tok.v === '.') { consume(); continue; }
        if (tok.t === 'w' && (tok.v === '@prefix' || tok.v.toLowerCase() === 'prefix')) {
            consume();
            var pfx = consume(), uri = consume();
            if (pfx && uri) prefixes[(pfx.v || '').replace(':', '')] = resolveIri(uri.v || '', base);
            if (peek() && peek().t === 'p' && peek().v === '.') consume();
            continue;
        }
        if (tok.t === 'w' && (tok.v === '@base' || tok.v.toLowerCase() === 'base')) {
            consume();
            var uri = consume();
            base = uri ? resolveIri(uri.v || '', base) : '';
            if (peek() && peek().t === 'p' && peek().v === '.') consume();
            continue;
        }
        var subj = parseNode();
        if (!subj) { consume(); continue; }
        parsePOL(subj);
        if (peek() && peek().t === 'p' && peek().v === '.') consume();
    }

    return { triples: triples, prefixes: prefixes, base: base };
}

// Work out the diagram label of each imported entity/property so that exporting
// the diagram writes back the same IRI:
//  - a plain label L is exported as <L>, i.e. relative to the @base of the prefix
//    box, so IRIs that resolve that way are labelled with their local name only;
//  - other IRIs are labelled pfx:local, and the prefix is added to the prefix box
//    if it is not declared there yet.
// The @base of the prefix box is switched to the file's main namespace when that
// gives more entities a plain label.
function makeLabels(keys, filePrefixes) {
    var ta = document.getElementById('prefixes_ta');
    var current = turtleParse(ta.value);
    var pfxToNs = {}, nsToPfx = {}, added = [];
    function bind(p, ns) {
        pfxToNs[p] = ns;
        if (p && !nsToPfx.hasOwnProperty(ns)) nsToPfx[ns] = p;
    }
    for (var p in current.prefixes) bind(p, current.prefixes[p]);

    function isPlainLocal(local) { return local && !/[\s<>"{}|^`\\:?]/.test(local); }
    function plainUnder(iri, base) {
        var local = splitIri(iri).local;
        return isPlainLocal(local) && resolveIri(local, base) === iri;
    }

    var iris = [];
    keys.forEach(function(k) {
        if (!k || k.charAt(0) !== '<') return;
        var iri = k.slice(1, -1);
        if (hasScheme(iri) && iris.indexOf(iri) === -1) iris.push(iri);
    });

    // Pick the base that gives the most plain labels; on ties keep the current one
    var base = current.base, best = -1, candidates = [current.base];
    iris.forEach(function(iri) {
        var ns = splitIri(iri).ns;
        if (candidates.indexOf(ns) === -1 && resolveIri('x', ns) === ns + 'x') candidates.push(ns);
    });
    candidates.forEach(function(b) {
        var count = iris.filter(function(iri) { return plainUnder(iri, b); }).length;
        if (count > best) { best = count; base = b; }
    });

    function isReserved(name) { return pfxToNs.hasOwnProperty(name) || WELL_KNOWN_NS.hasOwnProperty(name); }
    function prefixFor(ns) {
        if (nsToPfx.hasOwnProperty(ns)) return nsToPfx[ns];
        var name = '';
        for (var fp in filePrefixes) if (fp && filePrefixes[fp] === ns) { name = fp; break; }
        if (!name || isReserved(name)) {
            // e.g. http://www.co-ode.org/ontologies/pizza/pizza.owl# -> pizza
            var stem = ns.replace(/[#\/]+$/, '').split('/').pop().replace(/\.[a-zA-Z]+$/, '').replace(/[^A-Za-z0-9]/g, '');
            if (!/^[A-Za-z]/.test(stem)) stem = 'ns';
            name = stem;
            for (var i = 1; isReserved(name); i++) name = stem + i;
        }
        bind(name, ns);
        added.push(name);
        return name;
    }

    var labels = {};
    keys.forEach(function(k) {
        if (!k || labels.hasOwnProperty(k)) return;
        if (k.indexOf('xsd:') === 0) { labels[k] = k.slice(4).replace(/_/g, ' '); return; }
        if (k.charAt(0) !== '<') { labels[k] = k; return; }
        var iri = k.slice(1, -1), sp = splitIri(iri);
        if (!hasScheme(iri))             labels[k] = iri.replace(/_/g, ' '); // relative, no base in file
        else if (plainUnder(iri, base))  labels[k] = sp.local.replace(/_/g, ' ');
        else                             labels[k] = prefixFor(sp.ns) + ':' + sp.local.replace(/_/g, ' ');
    });

    if (base !== current.base || added.length) {
        var lines = [];
        if (base) lines.push('@base <' + base + '> .');
        for (var cp in current.prefixes) lines.push('@prefix ' + cp + ': <' + current.prefixes[cp] + '> .');
        added.forEach(function(ap) { lines.push('@prefix ' + ap + ': <' + pfxToNs[ap] + '> .'); });
        // set both so the prefixes are kept when the page is saved with ctrl-s
        ta.textContent = ta.value = lines.join('\n') + '\n';
    }
    return labels;
}

// Grid layout via simulated annealing:
// Assign nodes to grid cells so that graph-adjacent nodes end up in nearby cells.
function gridLayout(keys, isaEdges, namedEdges) {
    var n = keys.length;
    var keyIdx = {};
    keys.forEach(function(k, i) { keyIdx[k] = i; });

    // Build weighted undirected adjacency: isa edges cost 1, named edges cost 2.
    // Lower isa weight means isa-connected nodes are seen as closer and cluster together.
    var adj = {};
    keys.forEach(function(k) { adj[k] = {}; });
    isaEdges.forEach(function(e) {
        if (adj[e.from] && adj[e.to]) { adj[e.from][e.to] = 1; adj[e.to][e.from] = 1; }
    });
    namedEdges.forEach(function(e) {
        if (adj[e.from] && adj[e.to]) {
            if (!adj[e.from][e.to]) adj[e.from][e.to] = 2;
            if (!adj[e.to][e.from]) adj[e.to][e.from] = 2;
        }
    });

    // All-pairs Dijkstra (O(n²) per source) for weighted shortest paths
    var INF = n * 2;
    var D = [];
    for (var si = 0; si < n; si++) {
        var d = new Array(n).fill(INF);
        var visited = new Array(n).fill(false);
        d[si] = 0;
        for (var step = 0; step < n; step++) {
            var u = -1;
            for (var j = 0; j < n; j++)
                if (!visited[j] && (u === -1 || d[j] < d[u])) u = j;
            if (u === -1 || d[u] === INF) break;
            visited[u] = true;
            var nbrs = Object.keys(adj[keys[u]]);
            for (var ki = 0; ki < nbrs.length; ki++) {
                var vi = keyIdx[nbrs[ki]];
                if (vi !== undefined && d[u] + adj[keys[u]][nbrs[ki]] < d[vi])
                    d[vi] = d[u] + adj[keys[u]][nbrs[ki]];
            }
        }
        D.push(d);
    }

    // Grid sized to roughly match screen aspect ratio (~16:9)
    var cols = Math.max(1, Math.round(Math.sqrt(n * 16 / 9)));
    var rows = Math.max(1, Math.ceil(n / cols));
    var gridSize = rows * cols;

    // Random initial assignment; empty cells padded at the end
    var grid = [];
    for (var i = 0; i < n; i++) grid[i] = i;
    for (var i = n; i < gridSize; i++) grid[i] = -1;
    for (var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = grid[i]; grid[i] = grid[j]; grid[j] = tmp;
    }

    // Precompute 8-connected neighbor lists for every cell
    var cellNbrs = [];
    for (var ci = 0; ci < gridSize; ci++) {
        var r = Math.floor(ci / cols), c = ci % cols, nb = [];
        for (var dr = -1; dr <= 1; dr++)
            for (var dc = -1; dc <= 1; dc++)
                if ((dr || dc) && r+dr >= 0 && r+dr < rows && c+dc >= 0 && c+dc < cols)
                    nb.push((r+dr)*cols + (c+dc));
        cellNbrs.push(nb);
    }

    // Cost of one cell: sum of graph distances to its occupied neighbors
    function cellCost(ci) {
        var ni = grid[ci]; if (ni < 0) return 0;
        var nb = cellNbrs[ci], cost = 0;
        for (var ki = 0; ki < nb.length; ki++) { var nj = grid[nb[ki]]; if (nj >= 0) cost += D[ni][nj]; }
        return cost;
    }

    // Simulated annealing: swap random cell pairs, accept if it lowers total adjacency cost
    var numIter = Math.max(1000, n * n * 4);
    var temp = n * 2.0;
    var cooling = Math.pow(0.1 / Math.max(temp, 0.2), 1.0 / numIter);
    for (var iter = 0; iter < numIter; iter++) {
        var ci = Math.floor(Math.random() * gridSize);
        var cj = Math.floor(Math.random() * gridSize);
        if (ci === cj) continue;
        var before = cellCost(ci) + cellCost(cj);
        var tmp = grid[ci]; grid[ci] = grid[cj]; grid[cj] = tmp;
        var after = cellCost(ci) + cellCost(cj);
        if (after > before && Math.random() >= Math.exp((before - after) / temp))
            { tmp = grid[ci]; grid[ci] = grid[cj]; grid[cj] = tmp; } // reject
        temp *= cooling;
    }

    var xSpacing = 200, ySpacing = 140;
    var positions = {};
    for (var ci = 0; ci < gridSize; ci++) {
        var ni = grid[ci]; if (ni < 0) continue;
        positions[keys[ni]] = { x: 100 + (ci % cols) * xSpacing, y: 80 + Math.floor(ci / cols) * ySpacing };
    }
    return positions;
}

function buildOwboGraph(triples, filePrefixes) {
    var types = {}, bnodes = {}, domains = {}, ranges = {};
    var isaEdges = [], namedEdges = [];

    function isBlank(s) { return typeof s === 'string' && s.startsWith('_:'); }
    function isList(o)  { return o && typeof o === 'object' && o.t === 'list'; }
    function isLit(o)   { return o && typeof o === 'object' && o.t === 'lit'; }
    function isUri(s)   { return typeof s === 'string' && !isBlank(s); }

    // Terms are canonical (see canonicalIri), so the standard vocabularies are always prefixed
    function isSystem(s) {
        if (!s || typeof s !== 'string') return true;
        return /^(owl|rdfs|rdf|xsd|owbo):/.test(s);
    }

    function isXsd(s) { return typeof s === 'string' && s.startsWith('xsd:'); }

    // Collect blank node properties
    for (var t = 0; t < triples.length; t++) {
        var s = triples[t][0], p = triples[t][1], o = triples[t][2];
        if (!isBlank(s)) continue;
        if (!bnodes[s]) bnodes[s] = {};
        if (p === 'owl:onProperty') bnodes[s].onProp  = o;
        if (p === 'owl:hasValue')   bnodes[s].hasValue = o;
        if (p === 'owl:unionOf' && isList(o)) bnodes[s].union = o.items;
        if (p === 'rdf:type') {
            var ov = typeof o === 'string' ? o : '';
            if (ov.indexOf('Restriction') >= 0) bnodes[s].isRestriction = true;
        }
    }

    // Infer entity types
    for (var t = 0; t < triples.length; t++) {
        var s = triples[t][0], p = triples[t][1], o = triples[t][2];
        if (isBlank(s)) continue;
        var oStr = typeof o === 'string' ? o : null;
        if (p === 'rdf:type' && oStr) {
            if (oStr.indexOf('Class') >= 0)              types[s] = 'class';
            else if (oStr.indexOf('NamedIndividual') >= 0) types[s] = 'individual';
            else if (!isSystem(oStr)) {
                if (!types[s])    types[s]    = 'individual';
                if (!types[oStr]) types[oStr] = 'class';
            }
        }
        if (p === 'rdfs:subClassOf') {
            types[s] = 'class';
            if (oStr && !isBlank(oStr)) types[oStr] = 'class';
        }
        if ((p === 'rdfs:domain' || p === 'rdfs:range') && oStr && !isBlank(oStr))
            types[oStr] = types[oStr] || 'class';
        if (isXsd(s)) types[s] = 'datatype';
    }

    // Annotation properties: built-in ones, plus those declared as owl:AnnotationProperty.
    // Their triples are not drawn, but kept on the diagram so that they are exported again,
    // along with the declarations of these properties and the ontology header.
    var annProps = {}, ontologies = {}, annTriples = [];
    for (var t = 0; t < triples.length; t++) {
        var s = triples[t][0], p = triples[t][1], o = triples[t][2];
        if (p !== 'rdf:type' || isBlank(s)) continue;
        if (o === 'owl:AnnotationProperty') annProps[s] = true;
        if (o === 'owl:Ontology')           ontologies[s] = true;
    }
    function isAnnotationTriple(s, p) {
        return isUri(s) && (isBuiltinAnnotation(p) || annProps[p] || annProps[s] || ontologies[s]);
    }
    for (var t = 0; t < triples.length; t++) {
        var tr = triples[t];
        if (!isAnnotationTriple(tr[0], tr[1])) continue;
        var pT = termToTurtle(tr[1]), oT = termToTurtle(tr[2]);
        if (pT && oT) annTriples.push({ s: tr[0], p: pT, o: oT });
    }

    // Subjects of rdfs:domain/range are properties, not graph nodes
    var propSubjects = {};
    for (var t = 0; t < triples.length; t++) {
        var s = triples[t][0], p = triples[t][1];
        if ((p === 'rdfs:domain' || p === 'rdfs:range') && !isBlank(s)) propSubjects[s] = true;
    }

    // Build edges
    for (var t = 0; t < triples.length; t++) {
        var s = triples[t][0], p = triples[t][1], o = triples[t][2];
        if (!isUri(s) || isSystem(s) || isAnnotationTriple(s, p)) continue;

        if (p === 'rdfs:subClassOf') {
            if (typeof o === 'string' && !isBlank(o))
                isaEdges.push({ from: s, to: o });
            else if (isBlank(o) && bnodes[o] && bnodes[o].isRestriction && bnodes[o].onProp && bnodes[o].hasValue) {
                var hv = bnodes[o].hasValue;
                if (isUri(hv)) {
                    if (!types[hv]) types[hv] = 'individual';
                    namedEdges.push({ from: s, to: hv, prop: bnodes[o].onProp });
                }
            }
        }

        if (p === 'rdf:type' && typeof o === 'string' && !isSystem(o) && !isBlank(o))
            isaEdges.push({ from: s, to: o });

        if (p === 'rdfs:domain' && !isBlank(s)) {
            var pn = s;
            if (!domains[pn]) domains[pn] = [];
            if (typeof o === 'string' && !isBlank(o)) {
                if (domains[pn].indexOf(o) === -1) domains[pn].push(o);
            } else if (isBlank(o) && bnodes[o] && bnodes[o].union) {
                bnodes[o].union.forEach(function(m) {
                    if (isUri(m) && domains[pn].indexOf(m) === -1) { domains[pn].push(m); types[m] = types[m] || 'class'; }
                });
            }
        }

        if (p === 'rdfs:range' && !isBlank(s)) {
            var pn = s;
            if (!ranges[pn]) ranges[pn] = [];
            if (typeof o === 'string' && !isBlank(o)) {
                if (ranges[pn].indexOf(o) === -1) { ranges[pn].push(o); if (isXsd(o)) types[o] = 'datatype'; }
            } else if (isBlank(o) && bnodes[o] && bnodes[o].union) {
                bnodes[o].union.forEach(function(m) {
                    if (isUri(m) && ranges[pn].indexOf(m) === -1) ranges[pn].push(m);
                });
            }
        }

        // Direct triples: individual assertions and individual->literal
        if (!propSubjects[s] && !isSystem(p)) {
            if (isLit(o)) {
                var litKey = 'xsd:' + o.v.replace(/ /g, '_');
                types[litKey] = 'datatype';
                namedEdges.push({ from: s, to: litKey, prop: p });
            } else if (typeof o === 'string' && !isBlank(o) && !isSystem(o) && !propSubjects[o]) {
                namedEdges.push({ from: s, to: o, prop: p });
            }
        }
    }

    // Domain/range pairs → named relation edges
    for (var pn in domains) {
        var doms = domains[pn], rngs = ranges[pn] || [];
        for (var d = 0; d < doms.length; d++)
            for (var r = 0; r < rngs.length; r++)
                namedEdges.push({ from: doms[d], to: rngs[r], prop: pn });
    }

    // Collect all entity keys for rendering
    var entities = {};
    function addEnt(k) { if (k && isUri(k) && (!isSystem(k) || isXsd(k)) && !propSubjects[k]) entities[k] = true; }
    isaEdges.forEach(function(e)   { addEnt(e.from); addEnt(e.to); });
    namedEdges.forEach(function(e) { addEnt(e.from); addEnt(e.to); });

    // Collect stored owbo:x / owbo:y coordinates (saved by a previous OWBO export)
    var storedCoords = {};
    for (var t = 0; t < triples.length; t++) {
        var s = triples[t][0], p = triples[t][1], o = triples[t][2];
        if (p !== 'owbo:x' && p !== 'owbo:y') continue;
        var val = typeof o === 'object' ? parseFloat(o.v) : parseFloat(o);
        if (isNaN(val) || !isUri(s)) continue;
        if (!storedCoords[s]) storedCoords[s] = {};
        if (p === 'owbo:x') storedCoords[s].x = val;
        else                storedCoords[s].y = val;
    }
    // Ensure isolated nodes (coords saved but no edges) are included in entities
    for (var sk in storedCoords) { addEnt(sk); }

    var keys = Object.keys(entities);
    var labels = makeLabels(keys.concat(namedEdges.map(function(e) { return e.prop; })), filePrefixes);
    var n = keys.length;

    // If every entity has stored coordinates, use them directly and skip layout
    var coordCount = 0;
    keys.forEach(function(k) { if (storedCoords[k] && storedCoords[k].x !== undefined && storedCoords[k].y !== undefined) coordCount++; });
    var positions = {};
    if (coordCount === n && n > 0) keys.forEach(function(k) { positions[k] = storedCoords[k]; });
    else positions = gridLayout(keys, isaEdges, namedEdges);

    var nodeIds = {};

    for (var ei = 0; ei < keys.length; ei++) {
        var ek = keys[ei];
        var pos = positions[ek];
        var x = pos ? pos.x : startX, y = pos ? pos.y : startY;
        var name = labels[ek];
        var prevMax = findLastClassNumer();
        addClass(x, y, name);
        var newId = 'class_' + (prevMax + 1);
        nodeIds[ek] = newId;
        var circle = document.getElementById(newId + '_circle');
        if (circle) {
            var tp = types[ek] || 'class';
            circle.setAttribute('class',
                tp === 'individual' ? 'owbo_individual' :
                tp === 'datatype'   ? 'owbo_datatype'   : 'owbo_class');
        }
    }

    var propIds = {}; // property key -> ids of the relations drawn for it
    function makeEdge(fromKey, toKey, label, propKey) {
        var fId = nodeIds[fromKey], tId = nodeIds[toKey];
        if (!fId || !tId) return;
        var fc = document.getElementById(fId + '_circle');
        var tc = document.getElementById(tId + '_circle');
        if (!fc || !tc) return;
        var pId = addProperty(parseFloat(fc.getAttribute('cx')), parseFloat(fc.getAttribute('cy')),
                              parseFloat(tc.getAttribute('cx')), parseFloat(tc.getAttribute('cy')),
                              fId, tId, label);
        if (propKey) (propIds[propKey] = propIds[propKey] || []).push(pId);
    }

    isaEdges.forEach(function(e)   { makeEdge(e.from, e.to, 'isa'); });
    namedEdges.forEach(function(e) { makeEdge(e.from, e.to, labels[e.prop], e.prop); });

    // Attach annotations to the concept or relations they are about, so they follow
    // renames and deletions; the others (ontology header, annotation properties,
    // entities not in the diagram) are kept as they are in the SVG metadata.
    var attached = {}, unattached = [];
    annTriples.forEach(function(a) {
        var ids = nodeIds[a.s] ? [nodeIds[a.s]] : propIds[a.s];
        if (!ids) { unattached.push(termToTurtle(a.s) + ' ' + a.p + ' ' + a.o + ' .'); return; }
        ids.forEach(function(id) { (attached[id] = attached[id] || []).push([a.p, a.o]); });
    });
    for (var aid in attached) document.getElementById(aid).setAttribute(ANNOTATIONS_ATTR, JSON.stringify(attached[aid]));
    if (unattached.length) {
        var meta = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        meta.id = 'owbo_annotations';
        meta.textContent = unattached.join('\n');
        document.getElementsByTagName('svg')[0].appendChild(meta);
    }

    // Resize SVG to fit all content so the board scrollbars appear when needed
    var svgEl = document.getElementsByTagName('svg')[0];
    var bb = svgEl.getBBox();
    if (bb.width > 0) {
        svgEl.setAttribute('width',  Math.round(bb.x + bb.width  + 150) + 'px');
        svgEl.setAttribute('height', Math.round(bb.y + bb.height + 150) + 'px');
    }
}

// this should be called export
function save() {
    events.push({type: "click", caughtby: "save", time: new Date().getTime()})
    var data = document.getElementById("prefixes_ta").value
    data += "\n@prefix owbo: <https://mosaik.loria.fr/tool/owbo#> . "
    data += "\n@prefix owl:  <http://www.w3.org/2002/07/owl#> . \n"
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
    // isa → subClassOf / rdf:type (one triple per edge, unchanged)
    for (var p in properties) {
        if (properties[p].name == "<isa>") {
            if (classes[properties[p].from].type == "class")
                data += "\n"+classes[properties[p].from].name+" rdfs:subClassOf "+classes[properties[p].to].name+" . "
            else if (classes[properties[p].from].type == "individual")
                data += "\n"+classes[properties[p].from].name+" rdf:type "+classes[properties[p].to].name+" . "
        }
    }

    // Class-level properties: group by name so that when multiple edges share
    // the same property name, domain and range are expressed as owl:unionOf
    // instead of repeated rdfs:domain/rdfs:range (which RDFS reads as intersection).
    var classPropsByName = {}
    for (var p in properties) {
        if (properties[p].name == "<isa>" || !properties[p].name) continue
        var from = classes[properties[p].from]
        var to   = classes[properties[p].to]
        if (!from || !to) continue
        if (from.type == "class" && (to.type == "class" || to.type == "datatype")) {
            var pname = properties[p].name
            if (!classPropsByName[pname]) classPropsByName[pname] = { domains: [], ranges: [] }
            if (classPropsByName[pname].domains.indexOf(from.name) === -1) classPropsByName[pname].domains.push(from.name)
            if (classPropsByName[pname].ranges.indexOf(to.name)   === -1) classPropsByName[pname].ranges.push(to.name)
        }
    }
    for (var pname in classPropsByName) {
        var domains = classPropsByName[pname].domains
        var ranges  = classPropsByName[pname].ranges
        data += "\n" + pname + " rdfs:domain " + (domains.length === 1
            ? domains[0]
            : "[ a owl:Class ; owl:unionOf ( " + domains.join(" ") + " ) ]") + " . "
        data += "\n" + pname + " rdfs:range "  + (ranges.length === 1
            ? ranges[0]
            : "[ a owl:Class ; owl:unionOf ( " + ranges.join(" ") + " ) ]") + " . "
    }

    // Concept → Individual: hasValue restriction on the concept
    for (var p in properties) {
        if (properties[p].name == "<isa>" || !properties[p].name) continue
        var from = classes[properties[p].from]
        var to   = classes[properties[p].to]
        if (!from || !to) continue
        if (from.type == "class" && to.type == "individual") {
            data += "\n" + from.name + " rdfs:subClassOf" +
                    " [ a owl:Restriction ; owl:onProperty " + properties[p].name +
                    " ; owl:hasValue " + to.name + " ] . "
        }
    }

    // Individual-level assertions: direct triples, no grouping needed
    for (var p in properties) {
        if (properties[p].name == "<isa>" || !properties[p].name) continue
        var from = classes[properties[p].from]
        var to   = classes[properties[p].to]
        if (!from || !to) continue
        if (from.type == "individual" && (to.type == "individual" || to.type == "datatype")) {
            var nname = to.name
            if (to.type == "datatype") nname = '"' + to.name.replace("xsd:", "") + '"'
            data += "\n" + from.name + " " + properties[p].name + " " + nname + " . "
        }
    }
    // Annotations kept from an imported Turtle file (not shown in the diagram).
    // Relations with the same name carry the same annotations, so dedupe the lines.
    var annLines = {}
    function addAnnotations(id, name) {
        var ann = document.getElementById(id).getAttribute(ANNOTATIONS_ATTR)
        if (!ann || !name) return
        JSON.parse(ann).forEach(function(a) { annLines["\n" + name + " " + a[0] + " " + a[1] + " . "] = true })
    }
    for (var c in classes) addAnnotations(c, classes[c].name)
    for (var p in properties) if (properties[p].name != "<isa>") addAnnotations(p, properties[p].name)
    data += Object.keys(annLines).join("")
    var meta = document.getElementById("owbo_annotations")
    if (meta) data += "\n" + meta.textContent
    for (var p in classes) {
        if (!classes[p].name || !classes[p].x || !classes[p].y) continue
        data += "\n"+classes[p].name+" owbo:x "+Math.round(parseFloat(classes[p].x))+" . "
        data += "\n"+classes[p].name+" owbo:y "+Math.round(parseFloat(classes[p].y))+" . "
    }
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
    if (s.indexOf(':')!==-1) return s
	if (t == "datatype") return "xsd:"+s
    else return '<'+s+'>'
}
