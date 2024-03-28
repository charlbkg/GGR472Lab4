/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhcmxvdHRlYmtnIiwiYSI6ImNscjlvYzM1OTA1MW8ya24xbjdmNHRhaWkifQ.H2WW8WJZiHWFksxymyigTw'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map 
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/charlottebkg/cltq7xpkz03h901p0e3fy61l9',  //adding my map style
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12.25 // starting zoom level
});

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
let collisgeojson;
fetch('https://raw.githubusercontent.com/smith-lg/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    //      Convert the response to JSON format and then store the response in your new variable
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        collisgeojson = response; // Store geojson as variable using URL from fetch response
    });


/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/

//Create map load event handler
map.on('load', () => {
    //create bounding box and store as array variable
    let bboxcoords = turf.bbox(collisgeojson);
    //create hexgrid and store as variable, use bounding box as an argument
    let hexgeojson = turf.hexGrid(bboxcoords, 0.25, { units: 'kilometers' });
    //confirm by logging to console
    console.log(bboxcoords);
    console.log(hexgeojson);

    /*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
    //Collect all '_id' properties from the collision points data for each heaxagon using turf.collect
    let collishexcollect = turf.collect(hexgeojson, collisgeojson, '_id', 'values');
    //Confirm in console
    console.log(collishexcollect);
    //Create variable for max collisions
    let maxcollis = 0;
    //Create a foreach loop that creates a count property giving the total number of collisions per hex bin
    //Foreach loop also calculates the maximum number and saves it as the variable maxcollis
    collishexcollect.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollis) {
            maxcollis = feature.properties.COUNT
        }
    });
    //Check maximum number in console
    console.log('The maximum number of collisions is: ' + maxcollis);
    //Add maxcollis number to the legend
    document.getElementById("demo").innerHTML = 'The maximum number of collisions is: ' + maxcollis;

    //add data sources for collisions and hexgrid
    map.addSource('pedcyc-collis', {
        type: 'geojson',
        data: collisgeojson
    });

    map.addSource('collis-hex', {
        type: 'geojson',
        data: hexgeojson
    });

    //add layers to map
    map.addLayer({
        'id': 'pedcyc-collis-pnts',
        'type': 'circle',
        'source': 'pedcyc-collis',
        'paint': {
            'circle-radius': 3,
            'circle-color': 'red'
        }
    });

    map.addLayer({
        'id': 'collis-hex',
        'type': 'fill',
        'source': 'collis-hex',
        'paint': {
            'fill-color': 'black',
            //adds a linear color scale for the number of collisions in a polygon
            'fill-opacity': [
                "interpolate", ["linear"], ["get", 'COUNT'],
                0, 0,
                25, 1,
            ],
            'fill-outline-color': "red",
        }
    });

});
// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows

//Create a popup, but don't add it to the map yet.
const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});
map.on('mouseenter', 'pedcyc-collis-pnts', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.INVTYPE;
    console.log(coordinates)
    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
// Populate the popup and set its coordinates
// based on the feature found.
popup.setLngLat(coordinates).setHTML(description).addTo(map);
});
map.on('mouseleave', 'places-points', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
});

// Add zoom and rotation controls, position controls
map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
map.addControl(new mapboxgl.FullscreenControl(), 'bottom-left');
