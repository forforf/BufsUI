
//Prototype Observers
//-----------------------
//Event.observe(window, "load", initialize_page );
document.observe("dom:loaded", initialize_page );

var myGraph = "not set yet";
var uniqIteration = 0;

// Used in conjunction with the below for troubleshooting
// and logging object values for when Firebug is not an option
function clog(key,value) {
    var cValue = value || "value is null"
    if(key=="id"){
      console.log(key + " : " + cValue);
      }
    else{
      console.log("# ->" + key + " : " + cValue);
    };
}

//The below Based off of an answer by Hippo on StackOverflow
//example:  traverseObj(someObj, myFunction)
// For every object obj that is a sub-object of someObj will
// have the myFunction ran on it, that is myFunction(obj)
// This is done recursively for the entire object tree.
function traverseObj(obj,func) {
    //alert('obj size: ' + obj.length);
    for (item in obj) {
        if(typeof(obj[item])!="function" )func.apply(this,[ item, obj[item] ]);      
        if (typeof(obj[item])=="object") {
                //going on step down in the object tree!!
                traverseObj(obj[item],func);
        }
    }
    //);//close each
}
//End Hippo Stuff

function initialize_page(){
  //alert('going to init graph');
  blankGraph = rgraph_init(); //insert canvas into here if you can figure it out
  nodeSource = '/bufs_info_doc/index_nodes'
  //the below assigns the graph to myGraph (via Ajax)
  insertNodesIntoGraph(blankGraph, nodeSource);
  $('node_id_input_edit').value = " ";
  setAuthToken('authtok_attach_form');  
};

//New Jit2 Functions  (move someplace else?)
var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();
//End Jit2


//JIT Graph Function (writes current status to the log element
var Log = {
    elem: false,
    write: function(text){
        if (!this.elem)
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
    }
};


//Better way?
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


function routeClickedNodeDataToElements(nodeStale) {
  //not sure why, but the node passed into the function
  //is stale, and new tree data isn't part of it
  //the below is to update the passed in node with updated
  //information
  node = $jit.json.getSubtree(myGraph.json, nodeStale.id);
  //elements to receive node data
  var parentCatEditBox = $('related_tags_edit');
  var nodeIdBox = $('node_id_edit');
  var nodeIdBoxLabel = $('node_id_edit_label');
  var attachmentListBox = $('attachment_list');
  var linksListBox = $('links_list');
  //distribute node data
  parentCatEditBox.value = node.data.parent_categories;
  nodeIdBox.value = node.name;
  nodeIdBoxLabel.innerHTML = node.name;
  //functions to distribute data to 
  show_edit_node_form(node.name);
  make_attachment_list(node.data.attached_files, attachmentListBox);
  make_links_list(node.data.links, linksListBox);
}

function make_attachment_list(attachments, el_name){
   if(!attachments) attachments = [];
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

function make_links_list(links, el_name){
   if(!links) links = {0:null};
   var node_id = $('node_id_edit_label').innerHTML;
   
   newHTML = "<span id='dynamic_links_label'>Links</span><br />";
   var index = 0
   for (var src in links) {
     var linkName = links[src];
       if(linkName){
         newHTML += "<div class='link_item'><a href='" + src + "' target='_blank'>" + linkName + "</a>";
         newHTML += "<input type='checkbox' onclick='javascript:delete_link(this)' name='checkbox_" + index + "'> Delete?</div>";
         }
     index += 1;
   };
   $(el_name).innerHTML = newHTML;
};

function show_edit_node_form(node_id){
  $('node_id_input_edit').value = node_id;
  $('create-node-form').hide();
  $('edit-node-form').show();
};


function update_node_form_links(node_id, retry_count){
  var el_name = 'links_list'
  if(retry_count == null) {
      retry_count = 1;
  }
  if(retry_count > 0) {
    retry_count -= 1;
    setTimeout(function() {update_node_form_links(node_id, retry_count)}, 1000);
  }
  new Ajax.Request('/bufs_info_doc/list_links',
        { method:'post',
          parameters: { 'node_cat':node_id },
          onSuccess: function(transport){
            json = transport.responseJSON;
            var this_tree
            this_tree = $jit.json.getSubtree(myGraph.json, node_id);
            this_tree.data.links = json;
            $('node_id_input_edit').value = node_id;
            make_links_list(json, el_name);
          },
          onFailure: function(){ alert('Something went wrong updating links...\n Response:' + transport.headerJSON)}
        });
};



function update_node_form_attachments(node_id, retry_count){
  if(retry_count == null) {
      retry_count = 1;
  }
  //ugly hack to make sure slow updates at the server are accounted for
  //long term solution is for server to not respond with invalid response
  // i.e., wait until the data is fully propogated through the data store
  if(retry_count > 0) {
    retry_count -= 1;
    setTimeout(function() {update_node_form_attachments(node_id, retry_count)}, 1000);
  }
  var el_name = 'attachment_list'
  new Ajax.Request('/bufs_info_doc/list_attachments',
        { method:'post',
          parameters: { 'node_cat': node_id },
          onSuccess: function(transport){
            json = transport.responseJSON;
            var this_tree
            this_tree = $jit.json.getSubtree(myGraph.json, node_id);
            this_tree.data.attached_files = json;            
            $('node_id_input_edit').value = node_id;
            make_attachment_list(json, el_name);
          },
          onFailure: function(transport){ alert('Something went wrong updating attachments... \n Response:' + transport.headerJSON)}
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

function update_node(){
  var node_id = $('node_id_edit_label').innerHTML;
  var related_tags = $('related_tags_edit').value;
  //alert('Update -> NodeID: ' + node_id);
  var node_data = { 'node_cat': node_id, 'related_tags':related_tags }
  new Ajax.Request('/bufs_info_doc/update_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        json = transport.responseJSON;
        myGraph.loadJSON(json);
        myGraph.root = node_id;
        myGraph.refresh();
      }
  });
};


function delete_node(){
  var node_id = $('node_id_edit_label').innerHTML;
  var node_data = { 'node_cat': node_id, uniqIterator : uniqIteration+'' }
  new Ajax.Request('/bufs_info_doc/destroy_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        var json = transport.responseJSON;
        uniqIteration += 1;
        var parent_node;
        var visnode = myGraph.graph.getNode(node_id);
        visnode.eachSubnode(function(node) {
          visnode.data.parent_categories.each(function(parCat, index){
            if(parCat == node.id){
              parent_node = parCat;
            }
          });  
         });

        myGraph.loadJSON(json);
        myGraph.refresh();
        myGraph.onClick(parent_node);
        myGraph.empty();
        myGraph.fx.clearLabels(true);
        tmpGraph = rgraph_init(json);
      }
  });
};

function delete_attachment(el){
  var attach_name = el.previousSibling.innerHTML;
  var node_id = $('node_id_edit_label').innerHTML;
  new Ajax.Updater('', '/bufs_info_doc/remove_attachment',{
    parameters: {'node_cat': node_id, 'att_name':attach_name }
  });
  update_node_form_attachments(node_id);

}


function delete_link(el){
  var link_name = el.previousSibling.innerHTML;
  var link_dest = el.previousSibling.href;
  var node_id = $('node_id_edit_label').innerHTML;
  new Ajax.Updater('', '/bufs_info_doc/remove_link',{
    parameters: {'node_cat': node_id, 'link_name':link_name, 'link_dest':link_dest }
  });
  update_node_form_links(node_id);

}

function redirect_submit(){
$('add_attach_form').target = 'files_uploaded_iframe'; //iframe
$('add_attach_form').submit();
};

function adda_attachment(){
  //Sets the label appropriately
  update_node_form_attachments($('node_id_edit_label').innerHTML);
  redirect_submit();
  //Refreshes the list
  //TODO: Separate setting the label and refreshing the list to eliminate the duplicate call
  update_node_form_attachments($('node_id_edit_label').innerHTML);
};

function adda_link(){
  var node_id = $('node_id_edit_label').innerHTML;
  //TODO: clean up link naming (maybe link_src and link_label?)
  var link_name = $('add_link_edit').value;
  var link_name_label = $('add_link_name_edit').value;
  new Ajax.Updater('', '/bufs_info_doc/add_link',{
    parameters: {'node_cat': node_id, 'link_uri':link_name, 'link_label':link_name_label }
  });
  //TODO: This should only be ran after the ajax update?  Right now it
  // seems like it will execute asynchrounously
  update_node_form_links($('node_id_edit_label').innerHTML);
};

function create_node_data(){
 var node_cat = $('node_cat_create');
 var related_tags = $('related_tags_create');
 //TODO Create Node using local information
 // then use ajax to update it to the final authoritative view

 var node_data = { node_cat: node_cat.value, related_tags: related_tags.value, uniqIterator : uniqIteration}
 new Ajax.Request('/bufs_info_doc/create_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        uniqIteration += 1; 
        json = transport.responseJSON;
        //traverseObj(json, clog);
        //The below should move to the local section
        //using locally provided json manipulation
        myGraph.op.morph(json, {
          type: 'fade:con',
          duration: 1500});
        myGraph.empty();
        tmpGraph = rgraph_init(json);
        myGraph = tmpGraph;
      }
  });
};


function insertNodesIntoGraph(aGraph, nodeLoc){
  new Ajax.Request(nodeLoc,
    {
      method:'get',
      parameters: {uniqIterator : uniqIteration+''},
      onSuccess: function(transport){
        uniqIteration += 1;
        json = transport.responseJSON;
        //traverseObj(json, clog);
        aGraph.loadJSON(json);
        aGraph.refresh();
        myGraph = aGraph; //remember this is Asynchonous.  This won't be set right away.
      },
      onFailure: function(){ alert('Something went wrong getting nodes for visualization...') }
    });
}
  
function rgraph_init(){

    var rgraph = new $jit.RGraph({
        //Where to append the visualization
        injectInto: 'infovis',
        width: 700,
        height: 700,
        //Optional: create a background canvas that plots
        //concentric circles.
        background: {
            //numberOfCircles: 10,  //default - doesn't change node placement
            //levelDistance: 100,  //default - doesn't change node placement
          CanvasStyles: {
            strokeStyle: '#555'
          }
        },

        //Add navigation capabilities:
        //zooming by scrolling and panning.
        Navigation: {
          enable: true,
          panning: true,
          zooming: 10
        },
        //Set Node and Edge styles.
        Node: {
            color: '#ddeeff'
        },
        
        Edge: {
          color: '#C17878',
          lineWidth:1.5
        },
        
        Events: {  
          enable: true,  
          onClick: function(node, eventInfo, e) {  
            if(node==false){
              show_create_node_form(); }
            else {
              //myGraph.onClick(node.id);
            };
          }   
        },  

        onBeforeCompute: function(node){
            Log.write("centering " + node.name + "...");
            //Add the relation list in the right column.
            //This list is taken from the data property of each JSON node.
            $jit.id('inner-details').innerHTML = node.data.relation;
        },
        
        onAfterCompute: function(){
            Log.write("done");
        },
        //Add the name of the node in the correponding label
        //and a click handler to move the graph.
        //This method is called once, on label creation.

        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            domElement.onclick = function() {
                rgraph.onClick(node.id);
                routeClickedNodeDataToElements(node);
            }
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
    return rgraph;
}
