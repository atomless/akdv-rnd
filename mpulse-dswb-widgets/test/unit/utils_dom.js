/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'



// ================================================================================================
// TEST SEQUENCE

const throwExceptionIfNotDOMNodeElement = async t => {

    t.plan(2); // Expect 2 passes

    let [validElement, invalidElement] = await browser.evaluate(() => {

        let validElement = true, invalidElement = false;

        try {
            window.akdv.utils_dom.throwExceptionIfNotDOMNodeElement( document.getElementById("akdv-chart1") );
        } catch {
            validElement = false;
        }

        try {
            window.akdv.utils_dom.throwExceptionIfNotDOMNodeElement( document.getElementById("banana") );
        } catch {
            invalidElement = true;
        }

        return [validElement, invalidElement];
    });
    
    t.truthy(validElement, `Valid DOM element returned as FALSE`);
    t.truthy(invalidElement, `Invalid DOM element returned as TRUE`);
};


const throwExceptionIfNotIterableListOfDOMNodeElements = async t => {

    t.plan(7);
    
    let [populatedNodeList, emptyNodeList, populatedArray, emptyArray, object, nullVal, undefinedVal] = await browser.evaluate(() => {

        let populatedNodeList = true,
        emptyNodeList = false,
        populatedArray = true,
        emptyArray = false,
        nullVal = false,
        undefinedVal = false;
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotIterableListOfDOMNodeElements( document.getElementById("section1").querySelectorAll('div') );
        } catch {
            populatedNodeList = false;
        }
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotIterableListOfDOMNodeElements( document.getElementById("section1").querySelectorAll('div.banana') );
        } catch {
            emptyNodeList = true;
        }
        
        try {
            const popArray = [document.getElementById("akdv-chart1"), document.getElementById("akdv-chart2"), document.getElementById("akdv-chart3")]
            window.akdv.utils_dom.throwExceptionIfNotIterableListOfDOMNodeElements( popArray );
        } catch {
            populatedNodeList = false;
        }
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotIterableListOfDOMNodeElements( [] );
        } catch {
            emptyArray = true;
        }
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotIterableListOfDOMNodeElements( {} );
        } catch {
            object = true;
        }
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotIterableListOfDOMNodeElements( null );
        } catch {
            nullVal = true;
        }
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotIterableListOfDOMNodeElements( undefined );
        } catch {
            undefinedVal = true;
        }
        
        return [populatedNodeList, emptyNodeList, populatedArray, emptyArray, object, nullVal, undefinedVal];
    });
    
    t.truthy(populatedNodeList, `Incorrectly FAILED a valid element LIST`);
    t.truthy(emptyNodeList, `Incorrectly PASSED an EMPTY element LIST`);
    t.truthy(populatedArray, `Incorrectly FAILED a valid element LIST`);
    t.truthy(emptyArray, `Incorrectly PASSED an EMPTY standard ARRAY`);
    t.truthy(object, `Incorrectly PASSED an OBJECT`);
    t.truthy(nullVal, `Incorrectly PASSED an NULL`);
    t.truthy(undefinedVal, `Incorrectly PASSED an NULL`);
};


const throwExceptionIfNotTextElement = async t => {

    t.plan(2);
    
    let [svgTextNode, divNode] = await browser.evaluate(() => {

        let svgTextNode = true, divNode = false;
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotTextElement( document.querySelector(".legendLabel text") );
        } catch {
            svgTextNode = false;
        }
        
        try {
            window.akdv.utils_dom.throwExceptionIfNotTextElement( document.getElementById("akdv-chart1") );
        } catch {
            divNode = true;
        }

        return [svgTextNode, divNode];
    });
    
    t.truthy(svgTextNode, `Incorrectly FAILED a valid svg TEXT node`);
    t.truthy(divNode, `Incorrectly PASS div node as an svg TEXT node`);
};


const appendResponsiveSVGToElement = async t => {

    t.plan(1);

    let [svgNode] = await browser.evaluate(() => {
        
        const div = document.createElement("div");
        document.querySelector("body").appendChild(div);
        div.setAttribute("id", "domTest-appendResponsiveSVGToElement");

        let svgDiv = window.akdv.utils_dom.appendResponsiveSVGToElement( document.getElementById('domTest-appendResponsiveSVGToElement') );
        
        svgNode = document.getElementById('domTest-appendResponsiveSVGToElement-svg').nodeName.toLowerCase();

        return [svgNode]; 
    });

    t.truthy(svgNode === 'svg', `SVG node was not appended to supplied DOM element`);
};


const appendFromHTMLString = async t => {

    t.plan(1);

    let [newNode] = await browser.evaluate(() => {
        
        const div = document.createElement("div");
        document.querySelector("body").appendChild(div);
        div.setAttribute("id", "domTest-appendFromHTMLString");
        
        window.akdv.utils_dom.appendFromHTMLString( div, '<span id="appended-node"></span>' );
        newNode = document.getElementById('appended-node').nodeName.toLowerCase();

        return [newNode];
    });

    t.truthy(newNode === 'span', `Expected Appended node is missing from DOM`);
};


const prepend = async t => {

    t.plan(3);

    let [prependedNode, toElError, elError] = await browser.evaluate(() => {
        
        const body = document.querySelector("body");
        const parentEl = document.createElement("div");
        parentEl.setAttribute("id", "domTest-prependElement");
        
        body.appendChild(parentEl);
        parentEl.appendChild( document.createElement("span") );
        parentEl.appendChild( document.createElement("span") );
        
        const prependedEl = document.createElement("span");
        prependedEl.setAttribute("id", "prepended-element");
        
        window.akdv.utils_dom.prepend( parentEl, prependedEl );

        prependedNode = parentEl.firstChild.id;

        //--
        
        toElError = false;
        try {
            window.akdv.utils_dom.prepend( null, prependedEl );
        } catch {
            toElError = true;
        }
        
        //--
        
        elError = false;
        try {
            window.akdv.utils_dom.prepend( parentEl, null );
        } catch {
            elError = true;
        }
        
        return [prependedNode, toElError, elError];
    });

    t.truthy(prependedNode === 'prepended-element', `Expected prepended Node was not found at correct position in DOM`);
    t.truthy(toElError, `Element to prepend too was not a valid DOM node`);
    t.truthy(elError, `Element to prepend was not a valid DOM node`);
};


const removeChildren = async t => {

    t.plan(1);

    let [childCount] = await browser.evaluate(() => {
        
        const body = document.querySelector("body");
        const parentEl = document.createElement("div");
        parentEl.setAttribute("id", "domTest-removeChildren");
        
        body.appendChild(parentEl);
        
        parentEl.appendChild( document.createElement("span") );
        parentEl.appendChild( document.createElement("span") );
        parentEl.appendChild( document.createElement("span") );
        
        window.akdv.utils_dom.removeChildren( parentEl );

        childCount = parentEl.childNodes.length;

        return [childCount];
    });

    t.truthy(childCount === 0, `Child count was not ZERO, as expected`);
};


const remove = async t => {

    t.plan(1);

    let [removedNode] = await browser.evaluate(() => {
        
        removedNode = false;
        
        const body = document.querySelector("body");
        const removeEl = document.createElement("div");
        removeEl.setAttribute("id", "domTest-remove");
        body.appendChild( removeEl );

        window.akdv.utils_dom.remove( document.getElementById('domTest-remove') );

        if( document.getElementById('removeEl') === null )
        {
            removedNode = true;
        }

        return [removedNode];
        
    });

    t.truthy(removedNode, `Removed element still exists in DOM`);
};


const removeAll = async t => {

    t.plan(1);

    let [childCount] = await browser.evaluate(() => {
        
        childCount = 100;
        
        const body = document.querySelector("body");
        const parentEl = document.createElement("div");
        parentEl.setAttribute("id", "domTest-removeAll");
        body.appendChild( parentEl );

        parentEl.appendChild( document.createElement("span") );
        parentEl.appendChild( document.createElement("span") );
        parentEl.appendChild( document.createElement("span") );
        
        window.akdv.utils_dom.removeAll( '#domTest-removeAll span' );

        childCount = parentEl.childNodes.length;

        return [childCount];
        
    });

    t.truthy(childCount === 0, `Child count was not ZERO, as expected`);
};


const createElementFromHTMLString = async t => {

    t.plan(1);

    let [elementCreated] = await browser.evaluate(() => {
        
        elementCreated = false;
        let newElement = window.akdv.utils_dom.createElementFromHTMLString( '<span id="domTest-createElementFromHTMLString"></span>' ); 
        elementCreated = ( !!newElement.nodeName && newElement.nodeName.toLowerCase() == 'span' && newElement.id == 'domTest-createElementFromHTMLString' );

        return [elementCreated];
    });

    t.truthy(elementCreated, `Element was not created successfully`);
};


const getTextContentFromHTMLString = async t => {

    t.plan(1);

    let [textStringReturned] = await browser.evaluate(() => {
        
        textStringReturned = false;
        const text = window.akdv.utils_dom.getTextContentFromHTMLString( '<span id="domTest-getTextContentFromHTMLString">Here is the text content</span>' ); 
        
        if(text === 'Here is the text content')
        {
            textStringReturned = true;
        }

        return [textStringReturned];
    });

    t.truthy(textStringReturned, `Text content NOT returned correctly from HTML string`);
};


const getLocalizationKeyFromHTMLString = async t => {

    t.plan(1);

    let [keyReturned] = await browser.evaluate(() => {
        
        keyReturned = false;
        
        const key = window.akdv.utils_dom.getLocalizationKeyFromHTMLString( '<span id="domTest-getLocalizationKeyFromHTMLString" data-localization-key="EN"></span>' ); 

        if(key === 'EN')
        {
            keyReturned = true;
        }

        return [keyReturned];
    });

    t.truthy(keyReturned, `Localisation key NOT returned correctly from HTML string`);
};


const getHTMLStringFromElement = async t => {

    t.plan(1);

    let [htmlStringReturned] = await browser.evaluate(() => {
        
        htmlStringReturned = false;
        
        const el = document.createElement("div");
        el.setAttribute("id", "domTest-getHTMLStringFromElement");
        
        const htmlString = window.akdv.utils_dom.getHTMLStringFromElement( el ); 

        if(htmlString === '<div id="domTest-getHTMLStringFromElement"></div>')
        {
            htmlStringReturned = true;
        }

        return [htmlStringReturned];
    });

    t.truthy(htmlStringReturned, `HTML string not returned correctly`);
};


const getPercentileMarkup = async t => {

    t.plan(1);

    let [percentileHTMLStringReturned] = await browser.evaluate(() => {
        
        percentileHTMLStringReturned = false;
        
        const percentilHTMLString = window.akdv.utils_dom.getPercentileMarkup( 56.33 ); 
 
        if(percentilHTMLString === '(<i class="percentile-element">P<sub>56.33</sub></i>)')
        {
            percentileHTMLStringReturned = true;
        }

        return [percentileHTMLStringReturned];
    });

    t.truthy(percentileHTMLStringReturned, `Percentile HTML string not returned correctly`);
};


const getNearestParentElementWithClass = async t => {

    t.plan(1);

    let [correctEl] = await browser.evaluate(() => {
        
        correctEl = false;
        
        const body = document.querySelector("body");
        const parentEl = document.createElement("div");
        parentEl.setAttribute("id", "domTest-getNearestParentElementWithClass");
        body.appendChild( parentEl );

        const spanLevel1 = document.createElement("span");
        spanLevel1.setAttribute("class", "target-class");
        parentEl.appendChild( spanLevel1 );
        
        const spanLevel2 = document.createElement("span");
        spanLevel2.setAttribute("id", "target-element");
        spanLevel2.setAttribute("class", "target-class");
        spanLevel1.appendChild( spanLevel2 );
        
        const spanLevel3 = document.createElement("span");
        spanLevel3.setAttribute("class", "dummy-class");
        spanLevel2.appendChild( spanLevel3 );
        
        const spanLevel4 = document.createElement("span");
        spanLevel3.appendChild( spanLevel4 );
        
        const spanLevel5 = document.createElement("span");
        spanLevel5.setAttribute("class", "dummy-class");
        spanLevel4.appendChild( spanLevel5 );
        
        const nElement = window.akdv.utils_dom.getNearestParentElementWithClass( spanLevel5, 'target-class' );

        if( !!nElement.nodeName && nElement.nodeName.toLowerCase() === 'span' && nElement.id === 'target-element' )
        {
            correctEl = true;
        }

        return [correctEl];
    });

    t.truthy(correctEl, `Incorrect Node returned from DOM`);
};


const getNearestParentElementOfType = async t => {

    t.plan(2);

    let [correctEl, invalidChildEl] = await browser.evaluate(() => {
        
        correctEl = false;
        
        const body = document.querySelector("body");
        
        const level0 = document.createElement("div");
        body.appendChild( level0 );
        level0.setAttribute("id", "domTest-getNearestParentElementOfType");
        level0.setAttribute("class", "level0");
        
        const level1 = document.createElement("div");
        level1.setAttribute("id", "div-target-element");
        level1.setAttribute("class", "level1");
        
        const level2 = document.createElement("date")
        level2.setAttribute("class", "level2");           
        
        const level3 = document.createElement("span")
        level3.setAttribute("class", "level3");
        
        const level4 = document.createElement("span")
        level4.setAttribute("class", "level4");   
        
        const level5 = document.createElement("span")
        level5.setAttribute("class", "level5");
        
        level0.appendChild( level1 );
        level1.appendChild( level2 );
        level2.appendChild( level3 );
        level3.appendChild( level4 );
        level4.appendChild( level5 );
        
        const fElement = window.akdv.utils_dom.getNearestParentElementOfType( level5, 'div' );

        if( !!fElement.nodeName && fElement.nodeName.toLowerCase() === 'div' && fElement.id === 'div-target-element' )
        {
            correctEl = true;
        }

        invalidChildEl = false;
        try {
            let nullElement = window.akdv.utils_dom.getNearestParentElementOfType( null, 'div' );
        } catch {
            invalidChildEl = true;
        }
        
        return [correctEl,invalidChildEl];
    });

    t.truthy(correctEl, `Incorrect Node returned from DOM`);
    t.truthy(invalidChildEl, `Invalid child Element was flagged as valid`);
};


const getNearestParentElementWithId = async t => {

    t.plan(2);

    let [correctEl, invalidChildEl] = await browser.evaluate(() => {
        
        correctEl = false;
        
        const body = document.querySelector("body");
        
        const level0 = document.createElement("div");
        body.appendChild( level0 );
        level0.setAttribute("id", "domTest-getNearestParentElementOfType");
        level0.setAttribute("class", "level0");
        
        const level1 = document.createElement("div");
        level1.setAttribute("id", "div-target-element");
        level1.setAttribute("class", "target-element");
        
        const level2 = document.createElement("date")
        level2.setAttribute("class", "level2");           
        
        const level3 = document.createElement("span")
        level3.setAttribute("class", "level3");
        
        const level4 = document.createElement("span")
        level4.setAttribute("class", "level4");   
        
        const level5 = document.createElement("span")
        level5.setAttribute("class", "level5");
        
        level0.appendChild( level1 );
        level1.appendChild( level2 );
        level2.appendChild( level3 );
        level3.appendChild( level4 );
        level4.appendChild( level5 );
        
        const idElement = window.akdv.utils_dom.getNearestParentElementWithId( level5, 'div-target-element' );

        if( !!idElement.nodeName && idElement.id === 'div-target-element' )
        {
            correctEl = true;
        }

        invalidChildEl = false;
        try {
            let nullElement = window.akdv.utils_dom.getNearestParentElementWithId( null, 'div-target-element' );
        } catch {
            invalidChildEl = true;
        }
        
        return [correctEl,invalidChildEl];
    });

    t.truthy(correctEl, `NULL, or incorrect Node returned from DOM`);
    t.truthy(invalidChildEl, `Invalid child Element was flagged as valid`);
};


const addClassToElementAndRemoveAfterDuration = async t => {
    t.plan(2);

    let added = await browser
        .evaluate(() => window.akdv.utils_dom.addClassToElementAndRemoveAfterDuration(document.body, 'banana', 1000))
        .wait('body.banana')
        .evaluate(() => true);

    let removed = await browser.wait('body:not(.banana)').evaluate(() => true);

    t.truthy(added, `Class was not added.`);
    t.truthy(removed, `Class was not removed.`);
};


const addClassToListOfDOMNodeElementsAndRemoveAfterDuration = async t => {
    
    t.plan(7);

    await browser.evaluate(() => {
        
        const baseID = 'domTest-addClassToListAndRemove';
        
        const body = document.querySelector("body");
        
        const level0 = document.createElement("div");
        level0.setAttribute("id", baseID);
        
        const level1 = document.createElement("span");
        level1.setAttribute("id", baseID + "-el1");
        
        const level2 = document.createElement("span");
        level2.setAttribute("id", baseID + "-el2");
        
        const level3 = document.createElement("span");
        level3.setAttribute("id", baseID + "-el3");
        
        body.appendChild( level0 );
        level0.appendChild( level1 );
        level1.appendChild( level2 );
        level2.appendChild( level3 );
          
    });
    
    let [populatedArray, emptyArray, object, nullVal, undefinedVal] = await browser.evaluate(() => {

        populatedArray = true;
        emptyArray = false;
        object = false;
        nullObj = false;
        undefinedObj = false;
        
        try {
            let classElements = [document.getElementById( 'domTest-addClassToListAndRemove-el1' ),document.getElementById( 'domTest-addClassToListAndRemove-el2' ),document.getElementById( 'domTest-addClassToListAndRemove-el3' )];
            window.akdv.utils_dom.addClassToListOfDOMNodeElementsAndRemoveAfterDuration( classElements, 'orange', 500); 
        } catch {
            populatedArray = false;
        }

        try {
            window.akdv.utils_dom.addClassToListOfDOMNodeElementsAndRemoveAfterDuration( [], 'lemon', 500);
        } catch {
            emptyArray = true;
        }
        
        try {
            window.akdv.utils_dom.addClassToListOfDOMNodeElementsAndRemoveAfterDuration( {}, 'lemon', 500);
        } catch {
            object = true;
        }
        
        try {
            window.akdv.utils_dom.addClassToListOfDOMNodeElementsAndRemoveAfterDuration( null, 'lemon', 500);
        } catch {
            nullVal = true;
        }
        
        try {
            window.akdv.utils_dom.addClassToListOfDOMNodeElementsAndRemoveAfterDuration( undefined, 'lemon', 500);
        } catch {
            undefinedVal = true;
        }
        
        return [populatedArray, emptyArray, object, nullVal, undefinedVal];
    });
    
    let classesAdded = await browser
            .evaluate(() => {
                let classElements = [document.getElementById( 'domTest-addClassToListAndRemove-el1' ),document.getElementById( 'domTest-addClassToListAndRemove-el2' ),document.getElementById( 'domTest-addClassToListAndRemove-el3' )];
                window.akdv.utils_dom.addClassToListOfDOMNodeElementsAndRemoveAfterDuration( classElements, 'banana', 1000); 
            })
            .wait( '#domTest-addClassToListAndRemove-el1.banana' )
            .wait( '#domTest-addClassToListAndRemove-el2.banana' )
            .wait( '#domTest-addClassToListAndRemove-el3.banana' )
            .evaluate(() => true);

    let classesRemoved = await browser
        .wait( '#domTest-addClassToListAndRemove-el1:not(.banana)' )
        .wait( '#domTest-addClassToListAndRemove-el2:not(.banana)' )
        .wait( '#domTest-addClassToListAndRemove-el3:not(.banana)' )
        .evaluate(() => true);

    
    t.truthy(populatedArray, `Valid ARRAY of nodes was thrown as an error`);
    t.truthy(emptyArray, `EMPTY ARRAY was passed as being valid, expected ARRAY of DOM nodes`);
    t.truthy(object, `OBJECT was passed as being valid, expected ARRAY of DOM nodes`);
    t.truthy(nullVal, `NULL was passed as being valid, expected ARRAY of DOM nodes`);
    t.truthy(undefinedVal, `UNDEFINED was passed as being valid, expected ARRAY of DOM nodes`);
    
    t.truthy(classesAdded, `Classes were not added to specified DOM nodes.`);
    t.truthy(classesRemoved, `Classes were not removed from specified DOM nodes.`);
};


const isScrolledIntoView = async t => {
    
    t.plan(4);

    let [testOne, testTwo, testThree, validElementTest] = await browser.evaluate(() => {

        const body = document.querySelector("body");
        
        const section2 = document.createElement("section");
        section2.setAttribute("id", "section2");
        body.appendChild( section2 );
        
        section2.setAttribute("style", "width:300px; height:50px; background:black; padding:0; margin:0; overflow-x:hidden; overflow-y:auto; margin:3px;");

        const list = document.createElement("span");
        list.setAttribute("id", "domtest-isScrolledIntoView-list");
        section2.appendChild( list );
        
        const listItem1 = document.createElement("div")
        listItem1.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:pink;");
        list.appendChild( listItem1 );
        
        const listItem2 = document.createElement("div")
        listItem2.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:yellow;");
        list.appendChild( listItem2 );
        
        const listItem3 = document.createElement("div")
        listItem3.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:green;");
        list.appendChild( listItem3 );
        
        const listItem4 = document.createElement("div")
        listItem4.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:orange;");
        list.appendChild( listItem4 );
                
        let testOne = (
                window.akdv.utils_dom.isScrolledIntoView( listItem1, section2 ) &&
                window.akdv.utils_dom.isScrolledIntoView( listItem2, section2 ) &&
                !window.akdv.utils_dom.isScrolledIntoView( listItem3, section2 ) &&
                !window.akdv.utils_dom.isScrolledIntoView( listItem4, section2 )
        );
        
        listItem2.scrollIntoView();
        
        let testTwo = (
                !window.akdv.utils_dom.isScrolledIntoView( listItem1, section2 ) &&
                window.akdv.utils_dom.isScrolledIntoView( listItem2, section2 ) &&
                window.akdv.utils_dom.isScrolledIntoView( listItem3, section2 ) &&
                !window.akdv.utils_dom.isScrolledIntoView( listItem4, section2 )
        );
        
        listItem3.scrollIntoView();
        
        let testThree = (
                !window.akdv.utils_dom.isScrolledIntoView( listItem1, section2 ) &&
                !window.akdv.utils_dom.isScrolledIntoView( listItem2, section2 ) &&
                window.akdv.utils_dom.isScrolledIntoView( listItem3, section2 ) &&
                window.akdv.utils_dom.isScrolledIntoView( listItem4, section2 )
        );
        
        let validElementTest = false;
        try {
            window.akdv.utils_dom.isScrolledIntoView( null, section2 )
        } catch {
            validElementTest = true;
        }

        return [testOne, testTwo, testThree, validElementTest];
        
    });
    
    t.truthy(testOne, `Elements expected to be in view was not`);
    t.truthy(testTwo, `Elements expected to be in view was not`);
    t.truthy(testThree, `Elements expected to be in view was not`);
    t.truthy(validElementTest, `Invalid Element reported as being Valid`);
};


const addSimpleScrollbar = async t => {
    
    t.plan(1);

    await browser.evaluate(() => {

        const body = document.querySelector("body");
        
        const section3 = document.createElement("section");
        section3.setAttribute("id", "section3");
        section3.setAttribute("style", "width:320px; height:80px; background:grey; overflow-x:hidden; overflow-y:auto; margin:3px;");
        body.appendChild( section3 );
        
        const chartContainer = document.createElement("div");
        chartContainer.setAttribute("id", "domtest-addSimpleScrollbar-chart-container");
        chartContainer.setAttribute("class", "chart-grid");
        section3.appendChild( chartContainer );
        
        const dummyChart = document.createElement("div");
        dummyChart.setAttribute("id", "domtest-addSimpleScrollbar-dummy-chart");
        dummyChart.setAttribute("style", "width:320px; height:80px; background:red; overflow-x:hidden; overflow-y:auto;");
        dummyChart.setAttribute("class", "simple-scrollbar-enabled");
        chartContainer.appendChild( dummyChart );
        
        
        const list = document.createElement("div");
        list.setAttribute("id", "domtest-addSimpleScrollbar-list");
        dummyChart.appendChild( list );
        
        const listItem1 = document.createElement("div")
        listItem1.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:pink;");
        list.appendChild( listItem1 );
        
        const listItem2 = document.createElement("div")
        listItem2.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:yellow;");
        list.appendChild( listItem2 );
        
        const listItem3 = document.createElement("div")
        listItem3.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:green;");
        list.appendChild( listItem3 );
        
        const listItem4 = document.createElement("div")
        listItem4.setAttribute("style", "width:280px; height:40px; padding:0; margin:0; background:orange;");
        list.appendChild( listItem4 );
        
        window.akdv.utils_dom.addSimpleScrollbar( '#domtest-addSimpleScrollbar-list', { autoHide: false } );    
    });
    
    let simpleScrollbarPresent = await browser
        .wait( '#domtest-addSimpleScrollbar-chart-container div.ss-wrapper' )
        .evaluate(() => true);
    
    t.truthy(simpleScrollbarPresent, `Simple Scrollbar not added`);;
};


const ellipsizeDOMNodeTextElement = async t => {
    
    t.plan(5);

    await browser.evaluate(() => {

        const body = document.querySelector("body");
        
        const container = document.createElement("div");
        container.setAttribute("id", "domtest-ellipsizeDOMNodeTextElement-container");
        container.setAttribute("style", "display: inline-block; overflow: hidden; width: 200px; height: 200px; background:yellow;");
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        svg.setAttribute("id", "domtest-ellipsizeDOMNodeTextElement-svg");
        svg.setAttribute("style", "background: #040;");
        svg.setAttribute("width", "200px");
        svg.setAttribute("height", "200px");
        svg.setAttribute("viewBox", "0 0 200 100");

        body.appendChild( container );
        container.appendChild( svg );
        
        const textEl1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl1.setAttribute("id", "domtest-ellipsizeDOMNodeTextElement-textEl1");
        textEl1.setAttribute("x", 0);
        textEl1.setAttribute("y", 0);
        textEl1.textContent = "Supercalifragilisticexpialidocious";
        textEl1.setAttribute("style", "font-size:19px;");
        svg.appendChild( textEl1 );
        
        const textEl2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl2.setAttribute("x", 0);
        textEl2.setAttribute("y", 20);
        textEl2.setAttribute("id", "domtest-ellipsizeDOMNodeTextElement-textEl2");
        textEl2.textContent = "Supercalifragilisticexpialidocious";
        textEl2.setAttribute("style", "font-size:16px;");
        svg.appendChild( textEl2 );
        
        const textEl3 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl3.setAttribute("x", 0);
        textEl3.setAttribute("y", 40);
        textEl3.setAttribute("id", "domtest-ellipsizeDOMNodeTextElement-textEl3");
        textEl3.textContent = "Supercalifragilisticexpialidocious";
        textEl3.setAttribute("style", "font-size:16px;");
        svg.appendChild( textEl3 );
        
        const nonSVGTextNode = document.createElement("text");
        nonSVGTextNode.setAttribute("id", "domtest-ellipsizeDOMNodeTextElement-nonsvg-textnode");
        container.appendChild( nonSVGTextNode );
    });
    
    
    let ellipseText1 = await browser
    .evaluate(() => {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( document.getElementById("domtest-ellipsizeDOMNodeTextElement-textEl1"), 'MIDDLE', '...', 90 );
    })
    .wait( '#domtest-ellipsizeDOMNodeTextElement-textEl1[data-fulltext]' )
    .evaluate(() => { 
        const eText1 = document.getElementById("domtest-ellipsizeDOMNodeTextElement-textEl1").textContent;
    
        if(eText1 === 'Super...cious')
        {
            return true;
        }

        return false;
    });
    
    let ellipseText2 = await browser
    .evaluate(() => {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( document.getElementById("domtest-ellipsizeDOMNodeTextElement-textEl2"), 'MIDDLE', '.', 90 );
    })
    .wait( '#domtest-ellipsizeDOMNodeTextElement-textEl2[data-fulltext]' )
    .evaluate(() => { 
        const eText2 = document.getElementById("domtest-ellipsizeDOMNodeTextElement-textEl2").textContent;
    
        if(eText2 === 'Super.cious')
        {
            return true;
        }

        return false;  
    });
    
    let ellipseText3 = await browser
    .evaluate(() => {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( document.getElementById("domtest-ellipsizeDOMNodeTextElement-textEl3"), 'END', '...', 50 );
    })
    .wait( '#domtest-ellipsizeDOMNodeTextElement-textEl3[data-fulltext]' )
    .evaluate(() => { 
        const eText3 = document.getElementById("domtest-ellipsizeDOMNodeTextElement-textEl3").textContent;
    
        if(eText3 === 'Superc...')
        {
            return true;
        }

        return false;  
    });
    
    let nonSVGTextNodeTest = false;
    try {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( document.getElementById("domtest-ellipsizeDOMNodeTextElement-nonsvg-textnode"), 'END', '...', 90 );
    } catch {
        nonSVGTextNodeTest = true;
    }
    
    let nullElementTest = false;
    try {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( null, 'END', '...', 90 );
    } catch {
        nullElementTest = true;
    }
    
    
    t.truthy(ellipseText1, `Ellipsized text did not match expected result`);
    t.truthy(ellipseText2, `Ellipsized text did not match expected result`);
    t.truthy(ellipseText3, `Ellipsized text did not match expected result`);
    t.truthy(nonSVGTextNodeTest, `An invalid non SVG TEXT node passed in for Ellipsizing was accepted`);
    t.truthy(nullElementTest, `An invalid NULL passed in for Ellipsizing was accepted`);
};


const ellipsizeListOfDOMNodeTextElements = async t => {
    
    t.plan(4);

    await browser.evaluate(() => {

        const body = document.querySelector("body");
        
        const container = document.createElement("div");
        container.setAttribute("id", "domtest-ellipsizeListOfDOMNodeTextElements-container");
        container.setAttribute("style", "display: inline-block; overflow: hidden; width: 200px; height: 200px; background:yellow;");
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        svg.setAttribute("id", "domtest-ellipsizeListOfDOMNodeTextElements-svg");
        svg.setAttribute("style", "background: #040;");
        svg.setAttribute("width", "200px");
        svg.setAttribute("height", "200px");
        svg.setAttribute("viewBox", "0 0 200 100");

        body.appendChild( container );
        container.appendChild( svg );
        
        const textEl1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl1.setAttribute("x", 0);
        textEl1.setAttribute("y", 0);
        textEl1.setAttribute("id", "domtest-ellipsizeListOfDOMNodeTextElements-textEl1");
        textEl1.textContent = "Supercalifragilisticexpialidocious";
        textEl1.setAttribute("style", "font-size:19px;");
        svg.appendChild( textEl1 );
        
        const textEl2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl2.setAttribute("x", 0);
        textEl2.setAttribute("y", 20);
        textEl2.setAttribute("id", "domtest-ellipsizeListOfDOMNodeTextElements-textEl2");
        textEl2.textContent = "Supercalifragilisticexpialidocious";
        textEl2.setAttribute("style", "font-size:16px;");
        svg.appendChild( textEl2 );
        
        const textEl3 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl3.setAttribute("x", 0);
        textEl3.setAttribute("y", 40);
        textEl3.setAttribute("id", "domtest-ellipsizeListOfDOMNodeTextElements-textEl3");
        textEl3.textContent = "Supercalifragilisticexpialidocious";
        textEl3.setAttribute("style", "font-size:16px;");
        svg.appendChild( textEl3 );

    });
    
    
    let ellipseText = await browser
    .wait( '#domtest-ellipsizeListOfDOMNodeTextElements-textEl1' )
    .wait( '#domtest-ellipsizeListOfDOMNodeTextElements-textEl2' )
    .wait( '#domtest-ellipsizeListOfDOMNodeTextElements-textEl3' )
    .evaluate(() => {
        const textElArray = [
            document.getElementById("domtest-ellipsizeListOfDOMNodeTextElements-textEl1"),
            document.getElementById("domtest-ellipsizeListOfDOMNodeTextElements-textEl2"),
            document.getElementById("domtest-ellipsizeListOfDOMNodeTextElements-textEl3")
            ];
        
        window.akdv.utils_dom.ellipsizeListOfDOMNodeTextElements( textElArray, 'MIDDLE', '...', 90 );
        
    })
    .wait( '#domtest-ellipsizeListOfDOMNodeTextElements-textEl1[data-fulltext]' )
    .wait( '#domtest-ellipsizeListOfDOMNodeTextElements-textEl2[data-fulltext]' )
    .wait( '#domtest-ellipsizeListOfDOMNodeTextElements-textEl3[data-fulltext]' )
    .evaluate(() => { 
        const eText1 = document.getElementById("domtest-ellipsizeListOfDOMNodeTextElements-textEl1").textContent;
        const eText2 = document.getElementById("domtest-ellipsizeListOfDOMNodeTextElements-textEl2").textContent;
        const eText3 = document.getElementById("domtest-ellipsizeListOfDOMNodeTextElements-textEl3").textContent;
    
        if(eText1 === 'Super...cious' && eText2 === 'Super...cious' && eText3 === 'Super...cious')
        {
            return true;
        }

        return false;
    });
    
    let nullVal = false;
    try {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( null, 'END', '...', 90 );
    } catch {
        nullVal = true;
    }
    
    let emptyArrayVal = false;
    try {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( [], 'END', '...', 90 );
    } catch {
        emptyArrayVal = true;
    }
    
    let objVal = false;
    try {
        window.akdv.utils_dom.ellipsizeDOMNodeTextElement( [], 'END', '...', 90 );
    } catch {
        objVal = true;
    }
    
    t.truthy(ellipseText, `Ellipsized text did not match expected result`);
    t.truthy(nullVal, `An invalid NULL passed in for Ellipsizing was accepted, only array of SVG text nodes is allowed`);
    t.truthy(emptyArrayVal, `An empty node array passed in for Ellipsizing was accepted, only array of SVG text nodes is allowed`);
    t.truthy(objVal, `An invalid OBJECT passed in for Ellipsizing was accepted, only array of SVG text nodes is allowed`);
};


const moveToFrontListOfDOMNodeElements = async t => {

    t.plan(1);

    let nodesMoved = await browser.evaluate(() => {
        
        const body = document.querySelector("body");
        
        const container = document.createElement("div");
        container.setAttribute("id", "domTest-moveToFrontListOfDOMNodeElements-container"); 
        body.appendChild(container);
        
        const el1 = document.createElement("div");
        el1.setAttribute("id", "domtest-moveToFrontListOfDOMNodeElements-el1");
        container.appendChild( el1 );
        
        const el2 = document.createElement("div");
        el2.setAttribute("id", "domtest-moveToFrontListOfDOMNodeElements-el2");
        container.appendChild( el2 );
        
        const el3 = document.createElement("div");
        el3.setAttribute("id", "domtest-moveToFrontListOfDOMNodeElements-el3");
        container.appendChild( el3 );
        
        const el4 = document.createElement("div");
        el4.setAttribute("id", "domtest-moveToFrontListOfDOMNodeElements-el4");
        container.appendChild( el4 );

        window.akdv.utils_dom.moveToFrontListOfDOMNodeElements([el2,el1]);
        
        const newOrder = document.querySelectorAll("#domTest-moveToFrontListOfDOMNodeElements-container div");

        if(newOrder[0].id === 'domtest-moveToFrontListOfDOMNodeElements-el3' &&
            newOrder[1].id === 'domtest-moveToFrontListOfDOMNodeElements-el4' &&
            newOrder[2].id === 'domtest-moveToFrontListOfDOMNodeElements-el2' &&
            newOrder[3].id === 'domtest-moveToFrontListOfDOMNodeElements-el1'
        )
        {
            return true;
        }

        return false
        
    });

    t.truthy(nodesMoved, `Specified DOM nodes not moved correctly`);
};


//test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV LITE TEST PAGE', config.akdv_lite_test_url));
const test_chart_html = 'unittestsdomutils_template.html'; // '_template.html' is appended to all nunjuck templates on publishing to dist
const test_data_file = 'donut.json';
test.serial('PAGE LOADED', t => common_tests.page_load_test(t, `AKDV UNIT : DOM UTILS UNIT TEST PAGE`, `${config.base_uri}html/${test_chart_html}?debug=${config.browser_logging_level}&data=${test_data_file}`));

test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_DOM - throwExceptionIfNotDOMNodeElement', throwExceptionIfNotDOMNodeElement);
test.serial('UTILS_DOM - throwExceptionIfNotIterableListOfDOMNodeElements', throwExceptionIfNotIterableListOfDOMNodeElements);
test.serial('UTILS_DOM - throwExceptionIfNotTextElement', throwExceptionIfNotTextElement);
test.serial('UTILS_DOM - appendResponsiveSVGToElement', appendResponsiveSVGToElement);
test.serial('UTILS_DOM - appendFromHTMLString', appendFromHTMLString);
test.serial('UTILS_DOM - prepend', prepend);
test.serial('UTILS_DOM - removeChildren', removeChildren);
test.serial('UTILS_DOM - remove', remove);
test.serial('UTILS_DOM - removeAll', removeAll);
test.serial('UTILS_DOM - createElementFromHTMLString', createElementFromHTMLString);
test.serial('UTILS_DOM - getTextContentFromHTMLString', getTextContentFromHTMLString);
test.serial('UTILS_DOM - getLocalizationKeyFromHTMLString', getLocalizationKeyFromHTMLString);
test.serial('UTILS_DOM - getHTMLStringFromElement', getHTMLStringFromElement);
test.serial('UTILS_DOM - getPercentileMarkup', getPercentileMarkup);
test.serial('UTILS_DOM - getNearestParentElementWithClass', getNearestParentElementWithClass);
test.serial('UTILS_DOM - getNearestParentElementOfType', getNearestParentElementOfType);
test.serial('UTILS_DOM - getNearestParentElementWithId', getNearestParentElementWithId);
test.serial('UTILS_DOM - addClassToElementAndRemoveAfterDuration', addClassToElementAndRemoveAfterDuration);
test.serial('UTILS_DOM - addClassToListOfDOMNodeElementsAndRemoveAfterDuration', addClassToListOfDOMNodeElementsAndRemoveAfterDuration);
test.serial('UTILS_DOM - isScrolledIntoView', isScrolledIntoView);
test.serial('UTILS_DOM - addSimpleScrollbar', addSimpleScrollbar);
test.serial('UTILS_DOM - ellipsizeDOMNodeTextElement', ellipsizeDOMNodeTextElement);
test.serial('UTILS_DOM - ellipsizeListOfDOMNodeTextElements', ellipsizeListOfDOMNodeTextElements);
test.serial('UTILS_DOM - moveToFrontListOfDOMNodeElements', moveToFrontListOfDOMNodeElements);

/* jshint ignore:end */