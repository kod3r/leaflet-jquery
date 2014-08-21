// Leaflet widget
// --------------


//Example using methods and triggers
//http://jsbin.com/xefonobo/5/edit
//the method name is the plugin name + triggername (all lowercase) 


// jQuery widget to build a leaflet map
//
// Testbed http://jsbin.com/losobice/1/edit

// ## Sample usage:
/*

var mapa = $("#map").leaflet({
  "center": [-35, -59],
  "zoom": 7
});

mapa.leaflet("addGeoJsonLayer", {
  "url": "http://wms.ign.gob.ar/geoserver/IGN/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IGN:localidad&maxFeatures=50&outputFormat=json"
});

*/

// `$(selector).leaflet([options])` Sets up a Leaflet Map in `selector`

$.widget("gbs.leaflet", {
    // Parameter `options` is, of course, optional and can provide
    // inicialization map parameters:
    //
    // -  zoom: int zoom level
    // -  center: array[lat: float, lon: float] coordinates for the map center
    //
    options: {
      center:[-34.505, -59.09],
      zoom:5
    },

    // Completar doocumentacion de eventos
    widgetEventPrefix:"leaflet:",
    // Internal reference to the `L.Map` object
    map:null,
    layerCollection:[],
    // `Constructor`
    _create:function(){
        var _this=this;
        this.map = L.map(this.element.get(0), this.options);
        this.addOsmLayer();
        this.element.droppable();
        this.map.on('layeradd',function(l){
            if (l.layer._layers !== undefined){
                $.each(l.layer._layers, function (key,marker){
                    var propiedades=marker.feature.properties;
                    if (!jQuery.isEmptyObject(propiedades)){
                        var content="";
                        $.each(propiedades, function (k,v){
                            content+=k.toString()+': '+v.toString()+'<br />';
                        });

                        marker.bindPopup('<p>'+content+'</p>');
                    }
                    

                });
            }
            
            
            _this._trigger("LayerAdded",null, l);

        });
    },

    // `addWmsLayer(options:{})` adds a layer from a WMS service
    //
    // `options`: not optional, needs to set basic parameters for the WMS service
    // -  url: *string* Root url of the WMS service
    // -  layers: *string* Layer to get from WMS service
    // -  format: *string* Mime type for image format
    // > image/png
    // -  transparent: *boolean* WMS parameter, has to be consisten with `format`
    // -  attribution: *string* Attribution of the WMS Layer/Service

    addWmsLayer:function(options){
        options = this._mixinOptions({
            layers: options.layer,
            format: 'image/png',
            transparent: true,
            attribution: "IGN"        
        }, options);
        var myWms = L.tileLayer.wms(options.url, options);
  
        myWms.addTo(this.map);
        this.layerCollection.push(myWms);
        this._trigger( "wmsLayerAdded", null, { layer: myWms } );
    },

    // `addGeoJsonLayer(options:{})` adds a layer from a GeoJSON object
    //
    // `options`: not optional, needs to set basic parameters
    // -  url: *string* Url of the GeoJSON file
    // > The URL is passed through an open proxy to avoid 
    // > Same Origin Policy security error
    //
    addGeoJsonLayer:function(options){
        var _this=this;
        if(options["url"] !== undefined) {
            url=this.proxyizeUrl(options.url);
            $.getJSON(url,function(data){
                var myGeoJson = L.geoJson(data).addTo(_this.map);
                this.layerCollection.push(myGeoJson);
                this._trigger( "geoJsonLayerAdded", null, { layer: myGeoJson } );
            });
        }else if(options["contentString"] !== undefined){
            var myGeoJson = L.geoJson(options["contentString"]).addTo(_this.map);
            this.layerCollection.push(myGeoJson);
            this._trigger( "geoJsonLayerAdded", null, { layer: myGeoJson } );
        }
    }, 

    // `addKmlLayer(options:{})` adds a layer from a KML file
    //
    // `options`: not optional, needs to set basic parameters
    // -  url: *string* Url of the KML file
    // > The URL is passed through an open proxy to avoid 
    // > Same Origin Policy security error
    //
    addKmlLayer:function(options){
        var myKml;
        if(options["url"] !== undefined) {
            url=this.proxyizeUrl(options.url);
            myKml=omnivore.kml(url).addTo(this.map);
            this.layerCollection.push(myKml);
            this._trigger( "kmlLayerAdded", null, { layer: myKml } );
        }else if(options["contentString"] !== undefined){
            var myKml=omnivore.kml.parse(options.contentString).addTo(this.map);
            this.layerCollection.push(myKml);
            this._trigger( "kmlLayerAdded", null, { layer: myKml } );
        }
    },

    // `addGpxLayer(options:{})` adds a layer from a GPS GPX file
    //
    // `options`: not optional, needs to set basic parameters
    // -  url: *string* Url of the GPX file
    // > The URL is passed through an open proxy to avoid 
    // > Same Origin Policy security error
    //
    addGpxLayer:function(options){
        var myGpx;
        if(options["url"] !== undefined) {
            url=this.proxyizeUrl(options.url);
            var myGpx=omnivore.gpx(url).addTo(this.map);
            this.layerCollection.push(myGpx);
            this._trigger( "gpxLayerAdded", null, { layer: myGpx } );
        }else if(options["contentString"] !== undefined) {
            var myGpx=omnivore.gpx.parse(options.contentString).addTo(this.map);
            this.layerCollection.push(myGpx);
            this._trigger( "gpxLayerAdded", null, { layer: myGpx } );
        }
    },

    // `addCsvLayer(options:{})` adds a layer from a CSV file
    //
    // `options`: not optional, needs to set basic parameters
    // -  url: *string* Url of the CSV file
    // > The URL is passed through an open proxy to avoid 
    // > Same Origin Policy security error
    // -  latfield: *string* Name of the column in the CSV file that represents Latitude values
    // -  lonfield: *string* Name of the column in the CSV file that represents Longitude values
    // -  delimiter: *string* character used to separate values in the same row

    //If latitude and longitude options are not set, it'll search for columns named 'LONGITUDE' and 'LATITUDE'

    addCsvLayer:function(options){
        var myCsv;
        if(options["url"] !== undefined) {
            url=this.proxyizeUrl(options.url);
            var myCsv=omnivore.csv(url,options).addTo(this.map);
            this.layerCollection.push(myCsv);
            this._trigger( "csvLayerAdded", null, { layer: myCsv } );
        }else if(options["contentString"] !== undefined) {
            var myCsv=omnivore.csv.parse(options.contentString,options).addTo(this.map);
            this.layerCollection.push(myCsv);
            this._trigger( "csvLayerAdded", null, { layer: myCsv } );
        }
    },

    // `addWktLayer(options:{})` adds a layer from a WKT file
    //
    // `options`: not optional, needs to set basic parameters
    // -  url: *string* Url of the WKT file
    // > The URL is passed through an open proxy to avoid 
    // > Same Origin Policy security error
    addWktLayer:function(options){
        var myWkt;
        if(options["url"] !== undefined) {
            url=this.proxyizeUrl(options.url);
            var myWkt=omnivore.wkt(url).addTo(this.map);
            this.layerCollection.push(myWkt);
            this._trigger( "wktLayerAdded", null, { layer: myWkt } );
        }else if(options["contentString"] !== undefined) {
            var myWkt=omnivore.wkt.parse(options.contentString).addTo(this.map);
            this.layerCollection.push(myWkt);
            this._trigger( "wktLayerAdded", null, { layer: myWkt } );

        }
    },

    // `addTopoJsonLayer(options:{})` adds a layer from a TopoJson file
    //
    // `options`: not optional, needs to set basic parameters
    // -  url: *string* Url of the TopoJson file
    // > The URL is passed through an open proxy to avoid 
    // > Same Origin Policy security error
    addTopoJsonLayer:function(options){
        var _this=this;
        var myTopoJson;
        if(options["url"] !== undefined) {
            url=this.proxyizeUrl(options.url);
            var myTopoJson=omnivore.topojson(url).addTo(this.map);
            this.layerCollection.push(myTopoJson);
            this._trigger( "topoJsonLayerAdded", null, { layer: myTopoJson } );
        }else if(options["contentString"] !== undefined) {
            var myTopoJson = L.geoJson(omnivore.topojson.parse(options.contentString)).addTo(_this.map);
            this.layerCollection.push(myTopoJson);
            this._trigger( "topoJsonLayerAdded", null, { layer: myTopoJson } );

        }
    },


    // `addOsmLayer()` adds a layer from OSM Service
    addOsmLayer:function(){
        var url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var myOsm = L.tileLayer(url);
        myOsm.addTo(this.map);
        this.layerCollection.push(myOsm);
        this._trigger( "osmLayerAdded", null, { layer: myOsm } );


    },

    addGoogleLayer:function(options){
        options = this._mixinOptions({
            mapType:'ROADMAP'   
        }, options);
        var myGoogleLayer = new L.Google(options.mapType);
        this.map.addLayer(myGoogleLayer);
        this.layerCollection.push(myGoogleLayer);
        this._trigger( "googleLayerAdded", null, { layer: myGoogleLayer } );
    },
    
    // Returns `URL` string routed through proxy
    proxyizeUrl:function(url) {
      var proxyUrl = "http://crossproxy.aws.af.cm?u=";
      return proxyUrl + encodeURIComponent(url);
    },

    // Mixes user options with default options. Returns an unique options object.
    _mixinOptions: function(defaultOptions, userOptions) {
      return $.extend({}, defaultOptions, userOptions);
    },

    // `addJsonLayer` adds a layer from a JSON url/string
    //
    // `options` *Object* **required**
    // - `url`: *string* url to retrieve the json string. **NOT required if `contentString` is present**
    // - `contentString`: *string* JSON.stringified array of objects. **NOT required if `url` is present**
    // - `root`: *string* path to new root for each entry. Ex: "results.items"
    // - `structure`: *Object* hash of paths to values for:
    // -- `lat`: *string* path to object latitude value. Ex: "location.latitude"
    // -- `lon`: *string* path to object longitude value. Ex: "location.longitude"
    // -- `properties`: *Object* key/value pairs. Values are string paths
    // 
    // Example:
    //
    // var obj = {
    //     "results": {
    //         "items":[
    //             {
    //                 "venue": "Humboldt 2145, Buenos Aires"
    //                 "location": {
    //                     "latitude": -33.23,
    //                     "longitude": -57.47
    //                 }
    //             }
    //         ]
    //     }
    // }
    //
    // var paths = {
    //     lat: "location.latitude",
    //     lon: "location.longitude",
    //     properties: {
    //         "Address":"venue" /* relative to root property*/
    //     }
    // }
    //
    // $(selector).leaflet("addJsonLayer",{
    //     contentString: JSON.stringify(obj),
    //     structure: paths,
    //     root: "results.items"
    // })
    //
    // Ejemplo de como se usa esto:
    //
    // http://jsbin.com/bagak/1/edit
    addJsonLayer: function(options){
        var _this=this;
        var geoJson = {"type":"FeatureCollection","features":[]};
        if(options.url!==undefined){
            url=this.proxyizeUrl(options.url);
            $.getJSON(url, function(data, status, xhr){
                data = options.root ? data[options.root] : data;
                $.each(data,function(i,v){
                    geoJson.features.push(_this.json2geojson(v, options.structure));
                }); 
                var myGeoJson = L.geoJson(geoJson/*,{onEachFeature:function(feature,layer){
                    console.log(feature);
                }}*/);
                myGeoJson.addTo(_this.map);
                _this.layerCollection.push(myGeoJson);
                _this._trigger( "jsonLayerAdded", null, { layer: myGeoJson } );
            });
        }else if(options["contentString"] !== undefined) {
            //contentString tiene que ser un Array. []
            json = JSON.parse(options["contentString"]);

            json = options.root ? _this.index(json,options.root) : json;
            $.each(json,function(i,v){
                geoJson.features.push(_this.json2geojson(v, options.structure));
            }); 
            var myGeoJson = L.geoJson(geoJson/*,{onEachFeature:function(feature,layer){
                console.log(feature);
            }}*/);
            myGeoJson.addTo(_this.map);
            _this.layerCollection.push(myGeoJson);
            _this._trigger( "jsonLayerAdded", null, { layer: myGeoJson } );

        }
    },

/*

        addGSLayer: function(options){
        var _this=this;
        var geoJson = {"type":"FeatureCollection","features":[]};

        url="https://spreadsheets.google.com/feeds/list/"+options.id+"/od6/public/values?alt=json";
        $.getJSON(url, function(data, status, xhr){
            $.each(data,function(i,v){
                geoJson.features.push(_this.json2geojson(v, options.structure));
            }); 
            var myGeoJson = L.geoJson(geoJson);
            myGeoJson.addTo(_this.map);
            _this.layerCollection.push(myGeoJson);
            _this._trigger( "jsonLayerAdded", null, { layer: myGeoJson } );
            

        });
    },
*/

    // `json2geojson` converts JSON to GeoJSON
    //
    // `jsonString` *string* | *object* string/object with geotagged items
    //
    // `propsMap` *object* a map to mandatory properties needed for GeoJSON
    // - `lat`: *string* path to latitud value
    // - `lon`: *string* path to longitud value
    // - `properties`: *object* key:value pairs. Values: *string* paths to values in JSON object
    //
    json2geojson: function(jsonString, propsMap) {
        _this=this;
        var json = Object.prototype.toString.call(jsonString) == "[object Object]" ? jsonString : JSON.parse(jsonString);
        var geojson = {
            type: "Feature", //featureCollection
            geometry: {
                type: 'Point',
                coordinates: [_this.index(json, propsMap.lat), _this.index(json, propsMap.lon)]
            },
            properties: {}
        };
      
        $.each(propsMap.properties, function(k,v){
          geojson.properties[k] = _this.index(json,v);
        });

        return geojson;
    },

    // esto lo saque de
    // http://stackoverflow.com/questions/6393943/convert-javascript-string-in-dot-notation-into-an-object-reference
    // lee una propiedad de un objeto basado en un path (string) a esa propiedad. Ej:
    // index({a:{b:{c:"valor"}}}, "a.b.c") == "valor" // true 
    index: function(obj, is, value) {
    if (typeof is == 'string')
        return this.index(obj,is.split('.'), value);
    else if (is.length==1 && value!==undefined)
        return obj[is[0]] = value;
    else if (is.length===0)
        return obj;
    else
        return this.index(obj[is[0]],is.slice(1), value);
    }

/*
    var structure = {
        lat: "lat",
        lon: "long",
        properties: {
            "Nombre": "nombre",
            "Descripcion": "descripcion",
            "Partido": "partido"
        }
    };
    var la_url = "http://www.acumar.gov.ar/interface/default/desktop/js/mapacuenca/json/establecimientos_industriales_la_matanza.json";
    --------
    var structure = {
        lat: "geometry.lat",
        lon: "geometry.lng",
        properties: {
            "Address": "formatted_address"
        }
    }
    var la_url = "https://maps.googleapis.com/maps/api/geocode/json?address=Amphitheatre+Parkway,+Mountain+View,+CA";
*/

});


//Dropable widget

$.widget("gbs.droppable", {
  widgetEventPrefix: "droppable:",
  options: {
    readerMode: 'text'
  },
  waitingElement: null,
  
  _init: function() {
    this.waitingElement = $('<img src="http://geobootstrap.com.ar/gbs.geoext/img/loading.gif"/>')
    .css('position','absolute')
    .css('width','45px')
    .css('top',(this.element.height() - 100) / 2 + 'px')
    .css('left',(this.element.width() - 100) / 2 + 'px');
  },
  
  _create: function(){
    var _this = this;
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob)
      return;
    _this.reader = new FileReader();
    _this.element.bind('dragover', function(e) {
      _this.onFileDrag(e);
    }).bind('drop', function(e) {
      _this.onFileDrop(e);
    }).bind('dragleave', function(e) {
      _this.onDragLeave(e);
    });
    _this.element.droppable({
      fileLoaded: function(evt,data){
        var ext = data.file.name.split('.').pop();
        switch(ext) {
          case "kml":
            //$(this).leaflet("parseKml",data.contents);
            $(this).leaflet("addKmlLayer", {contentString: data.contents});
            break;
          case "gpx":
            $(this).leaflet("addGpxLayer", {contentString: data.contents});
            break;
          case "geojson":
            $(this).leaflet("addGeoJsonLayer", {contentString: data.contents});
            break;
          case "topojson":
            $(this).leaflet("addTopoJsonLayer", {contentString: data.contents});
            break;
          case "json" /* We took as reference: http://techslides.com/d3-geojson-and-topojson-renderer/ */:
            var contents;
            try{
              contents = JSON.parse(data.contents);
            }catch(e) {
              alert('You shall not pass!\r\n\r\nNo se pudo identificar el tipo de archivo :(');
              return;
            }
            if( $(this).droppable('isTopojson',contents) ) {
              $(this).leaflet("addTopoJsonLayer", {contentString: data.contents});
            }else if ( $(this).droppable('isGeojson',contents) ) {
              $(this).leaflet("addGeoJsonLayer", {contentString: data.contents});
            }else{
              alert('You shall not pass!\r\n\r\nNo se pudo identificar el tipo de archivo :(');
            }
            break;
          case "csv":
            $(this).leaflet("addCsvLayer", {contentString: data.contents});
            break;
          case "wkt":
            $(this).leaflet("addWktLayer", {contentString: data.contents});
            break;
        }
      }
    });
  },
  onDragLeave: function(e /*event*/) {
    this.waitingElement.remove();
  },
  onFileDrag: function(e /*event*/) {
    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = 'copy';
    this.waitingElement.appendTo(this.element);
  },
  onFileDrop: function(e /* event */) {

    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();
    this.waitingElement.remove();
    var _this = this;

    var dt = e.originalEvent.dataTransfer;
    var files = dt.files;

    if(dt.files.length === 1) {
      var file = dt.files[0];

      _this.reader.onload = function(progressEvent) {
        // _this.options.onDrop(progressEvent);
        _this._trigger('fileLoaded', e, {instance: _this, file: file, contents: progressEvent.target.result});
      };
      switch (_this.options.readerMode) {
        case 'text':
          _this.reader.readAsText(file);
          break;
        case 'binary':
          break;
      }
    }
  },
  isTopojson: function(contents /* object */) {
    return (contents.hasOwnProperty("type") && contents.type.toLowerCase() == "topology");
  },
  isGeojson: function(contents /* object */) {
    return (contents.hasOwnProperty("type") && (contents.type.toLowerCase() == "feature" || contents.type.toLowerCase() == "featurecollection"));
  }
});
