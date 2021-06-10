/* eslint-disable no-unused-vars */
'use strict';

/**
  This is a javascript test file with a startuml tag in the top jsdoc and some more at the
  function definitions

  @startuml js-top-note.png
  note right: note from class with image name
  @enduml

  And here some tag without filename - will be ignored

  @startuml
  note left: note from class without image name
  @enduml
  @author Stefan Seide
*/

/** Test function comment with named uml
  @startuml js-function-note.png
  note right: note from method testWithNamedUml
  @enduml
*/
function testWithNamedUml() {
    console.log('function testWithUml');
}

/** Test function comment with unnamed uml
 @startuml
 note right: note from testWithUnnamedUml
 @enduml
 */
function testWithUnnamedUml() {
    console.log('function testWithUml');
}

/** Test function comment without uml
*/
function testWithoutUml() {
    console.log('function testWithoutUml');
}

