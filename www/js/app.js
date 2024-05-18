import XYZ from '../olRecent/source/XYZ.js';
import Point from '../olRecent/geom/point.js';
import GeoJSON from '../olRecent/format/GeoJSON.js';
import FullScreen from '../olRecent/control/FullScreen.js';

// initialise global map variable
var map;
var logoImage;

//run initMap function onload
window.onload = initMap();

function initMap() {

    var osm; //open street map layer declaration
    var bing_aerial; //bing street map layer declaration
    var google_aerial; // google map layer declaration
    var myview;
    var dayservices_wfs;
    var carergroups_wfs;
    var getStyle;
    var count = 0;	
	
	//populate mapfeatures and add features to mapmarkers vector sources
	var mapmarkers = new ol.source.Vector(); //use in day service cluster layer
	var c_mapmarkers = new ol.source.Vector(); //use in carer group cluster layer
	
	/*private ip*/
    /* var ds_url = 'http://172.31.81.193:8080/geoserver/egm715/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=egm715%3ADayServices_AWLD&maxFeatures=50&outputFormat=application%2Fjson'
	var c_url = 'http://172.31.81.193:8080/geoserver/egm715/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=egm715%3ADayServices_Carers1&maxFeatures=50&outputFormat=application%2Fjson'	 */
	
	/*public ip*/	
	var ds_url = 'http://52.201.115.158:8080/geoserver/egm715/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=egm715%3ADayServices_AWLD&maxFeatures=50&outputFormat=application%2Fjson'
	var c_url = 'http://52.201.115.158:8080/geoserver/egm715/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=egm715%3ADayServices_Carers1&maxFeatures=50&outputFormat=application%2Fjson' 
	var mapfeatures = null;
	var c_mapfeatures = null;

	//populate carergroups features 
	fetch(c_url)
	.then(function(response) {
		return response.json();
	})
	.then(function(json) {
		Origin: 'anonymous',
		c_mapfeatures = new ol.format.GeoJSON().readFeatures(json);
		c_mapmarkers.addFeatures(c_mapfeatures);
	}); 
		
	//populate dayservice features 
	fetch(ds_url)
	.then(function(response) {
		return response.json();
	})
	.then(function(json) {
		Origin: 'anonymous',
		mapfeatures = new ol.format.GeoJSON().readFeatures(json);
		mapmarkers.addFeatures(mapfeatures);
	});


    getStyle = function(feature) {

        var mycolor;
        var ds_Type;
        var length;
        var iconStyle;
		
        // get the length of the array containing the clustered features
        length = feature.get('features').length;

        //if carer group or day service for awld
        ds_Type = feature.get('features')[0].get('DSType');

        //If length is > 1 display cluster marker else if length ==1 display png icon.
        if (length == 1){
            if (ds_Type == "Day_Service"){
				logoImage = 'img/OrangePinSmall.PNG';
				return [
					iconStyle = new ol.style.Style({
						image: new ol.style.Icon({
							scale: 0.3,
							anchor: [0.5, 46],
							anchorXUnits: 'fraction',
							anchorYUnits: 'pixels',
							src: logoImage
						}),
					})
				];
			}
			else if (ds_Type == "Carer_Group")
			{
				logoImage = 'img/YellowPinSmall.PNG';
				return [
					iconStyle = new ol.style.Style({
						image: new ol.style.Icon({
							scale: 0.3,
							anchor: [0.5, 46],
							anchorXUnits: 'fraction',
							anchorYUnits: 'pixels',
							src: logoImage
						}),
					})
				];					
			}
        } 
		else if (length > 1) {
            //cluster with correct colour showing count
			if (ds_Type.includes("Day_Service")) 
			{			
                //orange
				mycolor = [240, 77, 11, 0.7];
            } 
			else if (ds_Type.includes("Carer_Group"))
			{
                //yellow
				mycolor = [253, 185, 19, 0.7];
            }
            return [
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: Math.min(
                            Math.max(length * 0.5, 10), 20
                        ),
                        fill: new ol.style.Fill({
                            color: mycolor
                        })
                    }),
                    text: new ol.style.Text({
                        text: length.toString(),
                        fill: new ol.style.Fill({
                            color: 'black'
                        }),
                        font: '10px Verdana, Arial'
                    })
                })
            ];
        };
    }; //end getstyle

  
	// Create a Tile layer getting tiles from OpenStreetMap source, base map
	osm = new ol.layer.Tile({
		preload: Infinity,
		source: new ol.source.OSM(),
		title: 'Open Street Map',
		type: 'base'
	});

	//Create a Tile layer getting tiles from Google source, base map
	google_aerial = new ol.layer.Tile({
		source: new XYZ({
			url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}&key=AIzaSyApF_omds0eNW46yhgkJ8jr_B7Ur0FgMAw',
		}),
		title: 'Google Aerial',
		type: 'base'
	});

	//Create a WFS layer, Vector layer for day services
	dayservices_wfs = new ol.layer.Vector({
		//cluster points within 70 pixels
		source: new ol.source.Cluster({
			distance: 70,
			source: mapmarkers
		}),
		title: 'Day Services',
		visible: true,
		style: getStyle
	});
		

    //Create a WFS layer, Vector layer for carer groups
    carergroups_wfs = new ol.layer.Vector({
        //cluster points within 70 pixels
        source: new ol.source.Cluster({
            distance: 70,
            source: c_mapmarkers
        }),
        title: 'Carer Groups',
        visible: true,
        style: getStyle
    });


    // Create a view centered on Dorset
    myview = new ol.View({        
        center: ol.proj.fromLonLat([-2.4134950, 50.8359663], "EPSG:3857"),
   	    zoom: 9.3,
        projection: 'EPSG:3857'
    });



    // Create a map with layers
    map = new ol.Map({
        target: 'mymap',
        layers: [google_aerial, osm, dayservices_wfs, carergroups_wfs],
        view: myview,
        controls: [
            new ol.control.Zoom(),
            new ol.control.ZoomSlider(),
            new ol.control.ScaleLine(),
            new ol.control.LayerSwitcher()
        ]
    }); //end map constructor
	
	
	//popup
    //popup declarations
    const container = document.getElementById('popup');
    const content_element = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');

    //close popup
    closer.onclick = function() {
        popup.setPosition(undefined);
        closer.blur();
        return false;
    };

    //popup overlay
    var popup = new ol.Overlay({
        element: container,
        positioning: 'bottom-center',
        stopEvent: false,
    });
    map.addOverlay(popup);

    var feature_onClick;
    var features;

    //map.on events	
    //filter sidebar feature list to only show features in current map bounds */
    map.on("moveend", function(evt) {
       UpdateSideMenu();
    });

    //filter sidebar feature list to only show features in current map bounds */
    map.on("load", function(evt) {
       UpdateSideMenu();	  
    });

    //map.on adds the click event trigger to the map element	
    map.on('click', function(evt) {
        ShowPopUp(evt);
    });

    //event to turn side menu on and off
    //depending on dayservice layer visibility.
    dayservices_wfs.on('change:visible', function() {        
        UpdateSideMenu();        
    });
	
	//event to turn side menu on and off
    //depending on carer group layer visibility.
    carergroups_wfs.on('change:visible', function() {
        UpdateSideMenu();
    });

    function ShowPopUp(evt) 
	{
        if (evt) 
		{
            //find geojson marker from feature layer
            feature_onClick = map.forEachFeatureAtPixel(evt.pixel, function(feature) {

                //populate array with geojson data for clicked marker	
                features = feature.get('features');

                if (features) {
                    return features[0];
                };
            });
        };

        if (feature_onClick) 
		{
            //if length == 1 then is individual service marker and can display popup
            //if > 1 then is cluster marker so do not display popup and populate
            if (features.length == 1) {
				//get marker coordinates to place popup in correct position
                var geometry = features[0].getGeometry();
                var coord = geometry.getCoordinates();
				var URL = features[0].get('Website');
				var content = "";
				
				//If feature has a URL add it as a link
				if (URL.length != 0)
				{
				     content = '<div><h3><a href='+ features[0].get('Website')+' target="_blank">' + features[0].get('Name') + '</a></h3>';		
				}
				else
				{
				     content = '<div><h3>' + features[0].get('Name') + '</h3>';						
				}

                content += '<h5>' + features[0].get('ContactNo') + '</h5>';
				content += '<h5>' + features[0].get('Address') + '</h5></div>';

                content_element.innerHTML = content;
                popup.setPosition(coord);
            };
        };
    };

    function UpdateSideMenu() {
		
		//jquery - clear side menu contents
        $("#jsoncontent").empty();
		
		//Get Map Bounds and transform the extent
		let mapExtent = map.getView().calculateExtent(map.getSize());
		mapExtent = ol.proj.transformExtent(mapExtent, 'EPSG:3857', 'EPSG:4326');				
        
		//dayservices
		var img= "img/OrangePinMenu.PNG";
		//carer groups
		var img1= "img/YellowPinMenu.PNG";
	   
	    //Write Title of side menu depending on selected layers
		if ((dayservices_wfs.get('visible') == true)&&(carergroups_wfs.get('visible') == false)) 
		{				
			document.getElementById("jsoncontent").innerHTML = "<tr width ='100%' height='50px'><th class='sidetitle'><img src="+img+"> Day Services</th><th></th></tr>";			
			FeatureType(mapfeatures, mapExtent, img);	
		}
		else if((dayservices_wfs.get('visible') == false)&&(carergroups_wfs.get('visible') == true))
		{			
			document.getElementById("jsoncontent").innerHTML = "<tr width ='100%' height='50px'><th class='sidetitle'><img src="+img1+"> Carer Groups</th><th></th></tr>";			
			FeatureType(c_mapfeatures, mapExtent, img1);			
		}
		else if((dayservices_wfs.get('visible') == true)&&(carergroups_wfs.get('visible') == true))
		{				
			document.getElementById("jsoncontent").innerHTML = "<tr width ='100%' height='50px'><th class='sidetitle'><img src="+img+"> Day Services and <img src="+img1+"> Carer Groups</th></tr>";	
						
			FeatureType(mapfeatures, mapExtent, img);				    
			FeatureType(c_mapfeatures, mapExtent, img1);						
		};
    };	
	
	//function to populate sidebar
	function FeatureType(mapfeaturetype, mapExtent, imgType)
	{			
	    var htmlStr;
		var accordionid;
		
		//create unique identifiers for each layers collapsible list.
		if (imgType == "img/OrangePinMenu.PNG")
		{
			accordionid = "accordionExample1";
			htmlStr = "<div class='accordion' id="+accordionid+">";
		}
		else if (imgType == "img/YellowPinMenu.PNG")
		{
			accordionid = "accordionExample2";
			htmlStr = "<div class='accordion' id="+accordionid+">";
		}
		
		// iterate through the feature array
		for (var i = 0, ii = mapfeaturetype.length; i < ii; ++i) 
		{
			var featuretemp = mapfeaturetype[i];

			// get the geometry for each feature point
			var geometry = featuretemp.getGeometry();
			var extent = geometry.getExtent();
			extent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

			//If the feature is within the map view bounds display its details
			//in a collapsible div in the side menu
			var inExtent = (ol.extent.containsExtent(mapExtent, extent));
			if (inExtent) 
			{						
					
				htmlStr += "<div class='accordion-item'><div class='accordion-header' id='oneline'>"
				htmlStr += "<span class='image'><img src="+imgType+"></span><span class='text'>"
				htmlStr += "<a class='btn' data-bs-toggle='collapse' data-bs-target='#collapse"+i+"' href='#collapse"+i+""
				htmlStr += "aria-expanded='false' aria-controls='collapse"+i+"'>"+featuretemp.get('Name')+"</a></span>"
				
				htmlStr += "</div><div id='collapse"+i+"' class='accordion-collapse collapse' data-bs-parent='#"+accordionid+"'>"		
				htmlStr += "<div class='accordion-body'><h3>"+featuretemp.get('Address')+"</h3><h3>"+featuretemp.get('ContactNo')+"</h3>"
				htmlStr += "<h5><a href = "+featuretemp.get('Website')+" target='_blank'>"+featuretemp.get('Website')+"</a></h5>"
				htmlStr += "<h5>"+featuretemp.get('Email')+"</h5><h5>"+featuretemp.get('Descriptio')+"</h5>"
				htmlStr += "</div></div></div>";				
				    								
			};
		};
		
		htmlStr += "</div>"
		document.getElementById("jsoncontent").innerHTML += htmlStr
	}
	
    //change cursor to pointer when over a marker on the map
    map.on("pointermove", function(evt) {
        var hit = this.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            return true;
        });
        if (hit) {
            this.getTargetElement().style.cursor = 'pointer';
        } else {
            this.getTargetElement().style.cursor = '';
        };
    });	
	
};