# OWBO - Ontology White Board

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ontologies are formal conceptual models of a domain, which can be used to structure, understand and provide meaning to data. Existing ontology editors enable users to write complex models, if tending to be very complicated. However, it is often the case that, at least when starting an ontology, one mostly only need basic conceptual constructs, i.e. the ability to create classes and to relate them through relations. In this case, drawing them on a white board is often more efficient than trying to implement such an initial "skeleton" ontology directly in the ontology editor. 

OWBO aims to provide basic support for this. It makes it possible to create basic conceptual structures by simply adding and naming classes, and relating them with relations. Clicking in a white space creates a class; clicking on a class starts a relation; and clicking on a second class ends it. 

An interesting technical aspect of OWBO is that it is entirely contained in one HTML file. The drawing of the diagram is done through SVG, and the interaction through JavaScript. It does not rely on any external libraries or dependencies, or even require an internet connection. This means that starting designing an ontology could not be simpler: Open the file in a browser and start clicking (or even tapping if you have a touch screen or are creating ontologies on a mobile device). 

## Features
* One single HTML file: works entirely offline with no external dependencies
* Load/save/drag files in simplified [Turtle](https://www.w3.org/TR/turtle/) format with custom prefix mappings
* Basic editing of named classes, properties and standard literals (string, integer, float)
* Supports class subsumption and property domains and ranges

## Usage

* Either clone this repository and open the `owbo.html` file using your favourite Web browser,
* or simply [preview the latest source file](https://htmlpreview.github.io/?https://github.com/mdaquin/OWBO/blob/master/owbo.html).

## Rights

OWBO is free and open source. Please see the [License](LICENSE) file for details.