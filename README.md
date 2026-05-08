# OWBO - Semantic Network Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OWBO is a very simple editor of semantic network. Those are diagrams where nodes are concepts, and edges are relations between these concepts. By simply cliking in the white space, connecting concepts and draging them arround, OWBO provides a very simple interface to create such diagrams.

A key feature of OWBO is that it is entirely contained in one single HTML file. It can work locally and offline since it has no external dependencies. In addition, this means that saving an OWBO semantic network simply means saving that file (crtl-s in your browser). Once saved, you can simply reload that HTML file and carry on where you left off (the features of the editors are save with the file).

In addition, the semantic network can be exported in the RDF Schema turtle format and be worked on, as an ontology, in editors such as Protégé. 

## Usage

* Either clone this repository and open the `owbo.html` file using your favourite Web browser,
* or simply [preview the latest source file](https://htmlpreview.github.io/?https://github.com/mdaquin/OWBO/blob/master/owbo.html).

## RDF/OWL Export Mapping

The export produces a [Turtle](https://www.w3.org/TR/turtle/) file. OWBO concepts and individuals carry no explicit type declaration in the output — their roles are implied by the triples in which they appear. Datatypes are referenced using the `xsd:` prefix.

### Relations

| From | Relation name | To | RDF/OWL triple(s) produced |
|---|---|---|---|
| Concept | `isa` | Concept | `<A> rdfs:subClassOf <B> .` |
| Individual | `isa` | Concept | `<a> rdf:type <B> .` |
| Concept | *any* | Concept or Datatype | `<prop> rdfs:domain <A> .` `<prop> rdfs:range <B> .` |
| Concept | *any* | Individual | `<A> rdfs:subClassOf [ a owl:Restriction ; owl:onProperty <prop> ; owl:hasValue <b> ] .` |
| Individual | *any* | Individual | `<a> <prop> <b> .` |
| Individual | *any* | Datatype | `<a> <prop> "value" .` |

Relations involving other combinations are not exported.

### Union domains and ranges

When the same property name appears on multiple edges at the concept level, OWBO emits a single property declaration whose domain (or range) is the OWL union of all the corresponding concepts, rather than repeating `rdfs:domain` / `rdfs:range` (which would be interpreted as an intersection under RDFS semantics):

```turtle
# hasColor used from both Animal and Vehicle to Color
<hasColor> rdfs:domain [ a owl:Class ; owl:unionOf ( <Animal> <Vehicle> ) ] .
<hasColor> rdfs:range  <Color> .
```

## Rights

OWBO is free and open source. Please see the [License](LICENSE) file for details.