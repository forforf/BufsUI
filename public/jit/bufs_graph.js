var Log = {
    elem: false,
    write: function(text){
        if (!this.elem) 
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
    }
};

function addEvent(obj, type, fn) {
    if (obj.addEventListener) obj.addEventListener(type, fn, false);
    else obj.attachEvent('on' + type, fn);
};

function inspect(obj, maxLevels, level)
{
  var str = '', type, msg;

    // Start Input Validations
    // Don't touch, we start iterating at level zero
    if(level == null)  level = 0;

    // At least you want to show the first level
    if(maxLevels == null) maxLevels = 1;
    if(maxLevels < 1)     
        return '<font color="red">Error: Levels number must be > 0</font>';

    // We start with a non null object
    if(obj == null)
    return '<font color="red">Error: Object <b>NULL</b></font>';
    // End Input Validations

    // Each Iteration must be indented
    str += '<ul>';

    // Start iterations for all objects in obj
    for(property in obj)
    {
      try
      {
          // Show "property" and "type property"
          type =  typeof(obj[property]);
          str += '<li>(' + type + ') ' + property + 
                 ( (obj[property]==null)?(': <b>null</b>'):('')) + '</li>';

          // We keep iterating if this property is an Object, non null
          // and we are inside the required number of levels
          if((type == 'object') && (obj[property] != null) && (level+1 < maxLevels))
          str += inspect(obj[property], maxLevels, level+1);
      }
      catch(err)
      {
        // Is there some properties in obj we can't access? Print it red.
        if(typeof(err) == 'string') msg = err;
        else if(err.message)        msg = err.message;
        else if(err.description)    msg = err.description;
        else                        msg = 'Unknown';

        str += '<li><font color="red">(Error) ' + property + ': ' + msg +'</font></li>';
      }
    }

      // Close indent
      str += '</ul>';

    return str;
}


var jsonNoResp = {"id":"dummy","name":"no data from server","data":{},"children":[]}
function ajaxRequest(url) { new Ajax.Request(url,
  {
    method:'get',
    onSuccess: function(transport){
      alert("text:\n" + transport.responseText + "\nhead json:\n" + transport.headerJSON + "\nresp json:\n" + transport.responseJSON);
      json = transport.responseJSON
      alert("Ajax json: " + json.name);
    },
    onFailure: function(){ alert('Something went wrong...') }
  });
};


function viz_update(data_url){
 new Ajax.Request(data_url,
  {
    method:'get',
    onSuccess: function(transport){
      json = transport.responseJSON
      rgraph.op.morph(json, {
        type: 'fade',
	duration: 1500 
	}
       );
    },
    onFailure: function(){ alert('Something went wrong with viz update...') }
  });
}; 

function show_create_node_form(){
   $('create-node-form').show();
}

function show_destroy_node_form(){
   $('destroy-node-form').show();
}

// Ajax Example
function create_node_data(){
 var node_cat = $('node_cat_create');
 var related_tags = $('related_tags_create');
   
 var node_data = { node_cat: node_cat.value, related_tags: related_tags.value }
 new Ajax.Request('/bufs_info_doc/create_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        json = transport.responseJSON;
        rgraph.op.morph(json, {
          type: 'fade',
          duration: 1500});
      }
    //onSuccess: function(transport){
    //  alert(transport.responseText);
    //}
  });

//  new Ajax.Updater(divToUpdate, dataUrl, { method: 'get' });
};

function destroy_node_data(){
 var node_cat = $('node_cat_destroy');

 var node_data = { node_cat: node_cat.value }
 new Ajax.Request('/bufs_info_doc/destroy_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        json = transport.responseJSON;
        rgraph.op.morph(json, {
          type: 'fade',
          duration: 1500});
      }
    //onSuccess: function(transport){
    //  alert(transport.responseText);
    //}
  });

//  new Ajax.Updater(divToUpdate, dataUrl, { method: 'get' });
};


function init(data_url){
 new Ajax.Request(data_url,
  {
    method:'get',
    onSuccess: function(transport){
      json = transport.responseJSON
      viz_init(json);  
    },
    onFailure: function(){ alert('Something went wrong...') }
  });
};


function viz_init(json){
    
    var infovis = document.getElementById('infovis');
    var w = infovis.offsetWidth, h = infovis.offsetHeight;
    
    //init canvas
    //Create a new canvas instance.
    var canvas = new Canvas('mycanvas', {
        //Where to append the canvas widget
        'injectInto': 'infovis',
        'width': w,
        'height': h,
        
        //Optional: create a background canvas and plot
        //concentric circles in it.
        'backgroundCanvas': {
            'styles': {
                'strokeStyle': '#555'
            },
            
            'impl': {
                'init': function(){},
                'plot': function(canvas, ctx){
                    var times = 6, d = 100;
                    var pi2 = Math.PI * 2;
                    for (var i = 1; i <= times; i++) {
                        ctx.beginPath();
                        ctx.arc(0, 0, i * d, 0, pi2, true);
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
            }
        }
    });
    //end
    //init RGraph
    rgraph = new RGraph(canvas, {
        //Set Node and Edge colors.
        Node: {
            color: '#ccddee'
        },
        
        Edge: {
            color: '#772277'
        },

        onBeforeCompute: function(node){
            Log.write("centering " + node.name + "...");
            //Add the relation list in the right column.
            //This list is taken from the data property of each JSON node.
            document.getElementById('inner-details').innerHTML = node.data.relation;
        },
        
        onAfterCompute: function(){
            Log.write("done");
        },
        //Add the name of the node in the correponding label
        //and a click handler to move the graph.
        //This method is called once, on label creation.
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            domElement.onclick = function(){
                rgraph.onClick(node.id);
            };
        },
        //Change some label dom properties.
        //This method is called each time a label is plotted.
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = '';
            style.cursor = 'pointer';

            if (node._depth <= 1) {
                style.fontSize = "0.8em";
                style.color = "#ccc";
            
            } else if(node._depth == 2){
                style.fontSize = "0.7em";
                style.color = "#494949";
            
            } else {
                style.display = 'none';
            }

            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
        }
    });
    
    //load JSON data
    rgraph.loadJSON(json);
    //compute positions and make the first plot
    rgraph.refresh();
    //end
    //append information about the root relations in the right column
    document.getElementById('inner-details').innerHTML = rgraph.graph.getNode(rgraph.root).data.relation;
}
