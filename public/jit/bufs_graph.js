
//Prototype Observers
//-----------------------
//Event.observe(window, "load", initialize_page );
document.observe("dom:loaded", initialize_page );

function initialize_page(){
  index_nodes();
  //Add click event to the div holding the canvas
  $("infovis").observe("click", show_create_node_form ); 
  //$("update_node_button").observe("click", alert("clicked") );
  $('node_id_input_edit').value = " ";
  //$('files_uploaded_iframe_id').onload = alert("Uploaded file");
  setAuthToken('authtok_attach_form');  
};



//Helper Functions
//Prototype already does this?
//function addEvent(obj, type, fn) {
//    if (obj.addEventListener) obj.addEventListener(type, fn, false);
//    else obj.attachEvent('on' + type, fn);
//};

function stoppropagation(e) 
{ 
e=e||event; 
e.stoppropagation? e.stoppropagation() : e.cancelBubble=true; 
}

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

//bufs_graph Functions
var Log = {
    elem: false,
    write: function(text){
        if (!this.elem)
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
    }
};


//var jsonNoResp = {"id":"dummy","name":"no data from server","data":{},"children":[]}
//function ajaxRequest(url) { new Ajax.Request(url,
//  {
//    method:'get',
//    onSuccess: function(transport){
//      alert("text:\n" + transport.responseText + "\nhead json:\n" + transport.headerJSON + "\nresp json:\n" + transport.responseJSON);
//      json = transport.responseJSON
//      alert("Ajax json: " + json.name);
//    },
//    onFailure: function(){ alert('Something went wrong...') }
//  });
//};

function setAuthToken(el_id){
  new Ajax.Request('/bufs_info_doc/a_t',
    {
      method:'get',
      onSuccess: function(transport){
        window.authToken = transport.responseText;
        $(el_id).value = window.authToken.replace(/\s/g,'');
      },
      onFailure: function(){alert('Auth Token not retrieved');} 
    });
};

function ajaxGetParentCats(el, node_cat){ new Ajax.Request('/bufs_info_doc/parent_cats',
  {
    method:'get',
    parameters: { 'node_cat': node_cat },
    onSuccess: function(transport){
      //alert(transport.responseText);
      el.value = transport.responseText;
    },
    onFailure: function(){ alert('Unable to retrieve parent cats') }
  });
};

function viz_update(data_url){
 new Ajax.Request(data_url,
  {
    method:'get',
    onSuccess: function(transport){
      json = transport.responseJSON;
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
   $('edit-node-form').hide();
   $('create-node-form').show();
};

function show_destroy_node_form(){
   $('destroy-node-form').show();
};

function show_edit_node_form(node_id){
  //alert("Edit: " + node_id);
  $('node_id_edit').value = node_id;
  $('node_id_edit_label').innerHTML =  node_id;
  $('create-node-form').hide();
  $('edit-node-form').show();
  //$("update_node_button").observe("click", alert("clicked") );//update_node(node_id) );

  update_node_form_attachments(node_id);
};

function update_node(){
  var node_id = $('node_id_edit_label').innerHTML;
  var related_tags = $('related_tags_edit').value;
  //alert('Update -> NodeID: ' + node_id);
  var node_data = { 'node_cat': node_id, 'related_tags':related_tags }
  new Ajax.Request('/bufs_info_doc/update_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        json = transport.responseJSON;
        rgraph.op.morph(json, {
          type: 'fade',
          duration: 1500});
      }
  });
};


function delete_node(){
  var node_id = $('node_id_edit_label').innerHTML;
  alert('Delete Node ID: ' + node_id + '?');
  var node_data = { 'node_cat': node_id }
  new Ajax.Request('/bufs_info_doc/destroy_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        json = transport.responseJSON;
        rgraph.op.morph(json, {
          type: 'fade',
          duration: 1500});
      }
  });
};


function update_node_form_attachments(node_id){
  var el_name = 'attachment_list'
  new Ajax.Request('/bufs_info_doc/list_attachments',
        { method:'post',
          parameters: { 'node_cat':node_id },
          onSuccess: function(transport){
            json = transport.responseJSON;
            $('node_id_input_edit').value = node_id;
            make_attachment_list(json, el_name);
            //dynamically_create_attachment_list(json);
          },
          onFailure: function(){ alert('Something went wrong updating attachments...')}
        });
};

//  new Ajax.Updater('attachment_list','/bufs_info_doc/list_attachments',{
//                  parameters:{ node_cat: node_id }
//                });

function make_attachment_list(attachments, el_name){
   //window.current_attachments = attachments;
   var node_id = $('node_id_edit_label').innerHTML;
   newHTML = "<span id='dynamic_attachment_label'>Attachments</span><br />";
   for (var index = 0, len = attachments.length; index < len; ++ index) {
     var attachment = attachments[index];
     var att_url = "/bufs_info_doc/get_attachment?node_cat=" + node_id + "&att_name=" + attachment;
     //alert(attachment);
     newHTML += "<div class='attachment_item'><a href='" + att_url + "'>" + attachment + "</a>";
     newHTML += "<input type='checkbox' onclick='javascript:delete_attachment(this)' name='checkbox_" + index + "'> Delete?</div>";
   };
   $(el_name).innerHTML = newHTML;
};

function delete_attachment(el){
  //var index = el.name.replace(/checkbox_/g,''));
  var attach_name = el.previousSibling.innerHTML;
  var node_id = $('node_id_edit_label').innerHTML;
  //alert(attach_name);
  //alert(node_id);
  new Ajax.Updater('', '/bufs_info_doc/remove_attachment',{
    parameters: {'node_cat': node_id, 'att_name':attach_name }
  });
  update_node_form_attachments(node_id);

}

//not needed anymore?
//function att_cb_clk(node_id, att_name){
//  new Ajax.Updater('', '/bufs_info_doc/remove_attachment',{
//    parameters: {node_cat: node_id}
//  });
//
//  show_edit_node_form(node_id);
//}


function redirect_submit(){
$('add_attach_form').target = 'files_uploaded_iframe'; //iframe
$('add_attach_form').submit();
};

function adda_attachment(){
  redirect_submit();
  update_node_form_attachments($('node_id_edit_label').innerHTML);
};
//function show_create_node_form() {
//  alert("Create New Node");
//}

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
 //var node_cat = $('node_cat_destroy');
 var node_id = $('node_id_edit_label').innerHTML;
 var node_data = { 'node_cat': node_id }
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


function index_nodes(){
  var data_url = '/bufs_info_doc/index_nodes';
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
            type: 'arrow',
            color: '#772277'
        },

        onBeforeCompute: function(node){
            Log.write("centering " + node.name + "...");
            //Add the relation list in the right column.
            //This list is taken from the data property of each JSON node.
            //document.getElementById('inner-details').innerHTML = node.data.relation;
        },
        
        onAfterCompute: function(){
            Log.write("done");
        },
        //Add the name of the node in the correponding label
        //and a click handler to move the graph.
        //This method is called once, on label creation.
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            domElement.addEventListener('click',function (e) {
                rgraph.onClick(node.id);
                ajaxGetParentCats($('related_tags_edit'),node.name);
                show_edit_node_form(node.name);
                //e.stopPropagation();
                stoppropagation(e);
                },true);

            //domElement.onclick = function(){
            //    rgraph.onClick(node.id);
            //    show_edit_node_form(node.name);
            //};
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
    //document.getElementById('inner-details').innerHTML = rgraph.graph.getNode(rgraph.root).data.relation;
}
