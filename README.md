# OWBO - Ontology White Board

Ontology are formal conceptual models of a domain, which can be used to structure, understand and providing meaning to data. Existing ontology editors tend to be very complicated, enabling the users to write complex models. However, it is often the case that, at least when starting an ontology, one mostly only need basic conceptual constructs, i.e. the ability to create classes and to relate them through relations. In this case, drawing them on a white board is often more efficient than trying to implement such an initial "skeleton" ontology directly in the ontology editor. 

OWBO aims to provide basic support for this. It makes it possible to create basic conceptual structures by simply adding and naming classes, and relating them with relations. Clicking in the white space creates an class. Clicking on a class starts a relation, clicking on a second class ends it. 

An interesting technical aspect of OWBO is that it is entirely contained in one HTML file. The drawing of the diagram is done through SVG, and the interaction through javascript. It does not rely on any external libraries or dependencies, or even require an internet connection. This means that starting designing an ontology could not be simpler: Open the file in a browser and start clicking (or even tapping if you have a touch screen or are creating ontologies on a mobile device). 
