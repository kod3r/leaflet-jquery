// A singleton for taking advantage of GeoExt in a smoother way
//
// **Library URL:**
// http://geobootstrap.com.ar/gbs.geoext/gbs.geoext.js
//
// **jsbin:**
// http://jsbin.com/tejovexu/16

// `GeoBootstrap` is an internal class following the singleton pattern
// http://addyosmani.com/resources/essentialjsdesignpatterns/book/#singletonpatternjavascript
// The singleton gets instantiated like this:
//
// `gbs = GeoBootstrap.getInstance();`
var GeoBootstrap = (function () {

  // `gbsInstance` stores a reference to the Singleton
  // to ensure we get only one instance with getInstance()
  var gbsInstance;

  function init() {


    // `instances` holds OpenLayers and GeoExt instances that we need to keep referenced.
    var instances = {
      baseLayer: new OpenLayers.Layer.WMS(
        "Capa Base Argenmap",
        "http://wms.ign.gob.ar/geoserver/gwc/service/wms", {
          layers: "capabaseargenmap"
        }
      ),
      overlayTestLayer: new OpenLayers.Layer.WMS(
        "Red Vial",
        "http://wms.ign.gob.ar/geoserver/wms", {
          layers: "red_vial",
          transparent: true
        }, {
          isBaseLayer: false
        }
      ),
      mapPanel: null,
      legendPanel: null,
      baseLayerContainer: null,
      baseLayerTreePanel: null,
      overlayLayerContainer: null,
      overlayLayerTreePanel: null,
      wmsCapabilitiesTreePanel: null
    };
    //private
    var mapApi = new OpenLayers.Map();

    // Private methods and variables
    function privateMethod() {
      console.log("I am private");
    }

    // Returns defaults $.extend()ed with options
    function setupOptions(defaults, options) {
      return $.extend({}, defaults, options);
    }

    function proxyizeUrl(url) {
      var proxyUrl = "http://crossproxy.aws.af.cm?u=";
      return proxyUrl + encodeURIComponent(url);
    }

    // **mapPanel**
    //
    // Options:
    //
    // * applyTo: The div to use as placeholder for the map panel
    // * center: An `Openlayers.LonLat`
    // * zoom: An initial zoom level
    // 
    // Instantiates a GeoExt.mapPanel Component
    function mapPanel(options) {
      options = setupOptions({
        title: null, // No title bar
        border: false, // No border
        map: gbs.mapApi,
        center: new OpenLayers.LonLat(-34, -40),
        zoom: 5
      }, options);

      gbs.mapApi.addLayer(instances.baseLayer);
      gbs.mapApi.addLayer(instances.overlayTestLayer);

      instances.mapPanel = new GeoExt.MapPanel(options);
      return instances.mapPanel;
    }
    // **legendPanel**
    //
    function legendPanel(options) {
      options = setupOptions({
        title: null, // No title bar
        border: false, // No border
        layerStore: instances.mapPanel.layers,
        defaults: {
          labelCls: 'mylabel',
        },
        autoScroll: true,
      }, options);

      instances.legendPanel = new GeoExt.LegendPanel(options);
      return instances.legendPanel;
    }

    // **baseLayerTreePanel**
    //
    // instantiates an Ext.tree.Panel with an
    // GeoExt.tree.BaseLayerContainer inside.
    // gbs.instances.mapPanel.layers is used as layerStore
    function baseLayerTreePanel(options) {
      instances.baseLayerContainer = new GeoExt.tree.BaseLayerContainer({
        layerStore: instances.mapPanel.layers
      });
      options = setupOptions({
        title: null, // No title bar
        border: false, // No border
        root: instances.baseLayerContainer,
        enableDD: true
      }, options);
      instances.baseLayerTreePanel = new Ext.tree.TreePanel(options);
      return instances.baseLayerTreePanel;
    }

    // overlayLayerTreePanel
    //
    // instantiates an Ext.tree.Panel with an
    // GeoExt.tree.BaseLayerContainer inside.
    // gbs.instances.mapPanel.layers is used as layerStore
    function overlayLayerTreePanel(options) {
      instances.overlayLayerContainer = new GeoExt.tree.OverlayLayerContainer({
        layerStore: instances.mapPanel.layers
      });
      options = setupOptions({
        title: null, // No title bar
        border: false, // No border
        root: instances.overlayLayerContainer,
        enableDD: true
      }, options);
      instances.overlayLayerTreePanel = new Ext.tree.TreePanel(options);
      return instances.overlayLayerTreePanel;
    }

    // **wmsTreePanel**
    //
    //  `gbs.wmsTreePanel({`
    //    `url: // wms URL`
    //  });
    //
    // Instantiates a new Ext.tree.TreePanel
    function wmsTreePanel(options) {
      options = setupOptions({
        title: null, // No title bar
        border: false, // No border
        url: "http://vmap0.tiles.osgeo.org/wms/vmap0?"

      }, options);



      var root = new Ext.tree.AsyncTreeNode({
        text: 'WMS Capabilities Layers',
        loader: new GeoExt.tree.WMSCapabilitiesLoader({
          url: proxyizeUrl(options.url),
          layerOptions: {
            buffer: 0,
            singleTile: false,
            ratio: 1
          },
          layerParams: {
            'TRANSPARENT': 'TRUE'
          },
          // customize the createNode method to add a checkbox to nodes
          createNode: function (attr) {
            attr.checked = attr.leaf ? false : undefined;
            return GeoExt.tree.WMSCapabilitiesLoader.prototype.createNode.apply(this, [attr]);
          }
        })
      });

      options = setupOptions({
        root: root,
        border: false, // No border
        listeners: {
          // Add layers to the map when ckecked, remove when unchecked.
          // Note that this does not take care of maintaining the layer
          // order on the map.
          'checkchange': function (node, checked) {
            if (checked === true) {
              instances.mapPanel.map.addLayer(node.attributes.layer);
            } else {
              instances.mapPanel.map.removeLayer(node.attributes.layer);
            }
          }
        }
      }, options);

      instances.wmsCapabilitiesTreePanel = new Ext.tree.TreePanel(options);
      return instances.wmsCapabilitiesTreePanel;
    }

    return {
      // Public methods and variables
      instances: instances,
      mapApi: mapApi,
      mapPanel: mapPanel,
      legendPanel: legendPanel,
      baseLayerTreePanel: baseLayerTreePanel,
      overlayLayerTreePanel: overlayLayerTreePanel,
      wmsTreePanel: wmsTreePanel
    };

  };

  return {

    // Get the Singleton instance if one exists
    // or create one if it doesn't
    getInstance: function () {
      if (!gbsInstance) {
        gbsInstance = init();
      }
      return gbsInstance;
    }
  };

})();

var gbs = GeoBootstrap.getInstance();