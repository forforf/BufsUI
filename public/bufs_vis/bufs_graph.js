
//Prototype Observers
//-----------------------
//Event.observe(window, "load", initialize_page );
document.observe("dom:loaded", initialize_page );

var myGraph = "not set yet";
var uniqIteration = 0;

function initialize_page(){
  myGraph = index_nodes();
  //Add click event to the div holding the canvas
  $("infovis").observe("click", show_create_node_form ); 
  //$("update_node_button").observe("click", alert("clicked") );
  $('node_id_input_edit').value = " ";
  //$('files_uploaded_iframe_id').onload = alert("Uploaded file");
  setAuthToken('authtok_attach_form');  
};

//New Jit2 Functions
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


function routeClickedNodeDataToElements(node) {
  //Recenter graph (note this is redundancy rgraph and myGraph
  //alert(inspect(myGraph));
  //alert(node.id);
  myGraph.onClick(node.id); 
  //elements to receive node data
  var parentCatEditBox = $('related_tags_edit');
  var nodeIdBox = $('node_id_edit');
  var nodeIdBoxLabel = $('node_id_edit_label');
  var attachmentListBox = $('attachment_list');
  var linksListBox = $('links_list');
  //alert(node.data.attached_files);
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
   //window.current_attachments = attachments;
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
   //window.current_attachments = attachments;
   if(!links) links = {0:null};
   var node_id = $('node_id_edit_label').innerHTML;
   //alert(links["http://www.yahoo.com"]);
   

   newHTML = "<span id='dynamic_links_label'>Links</span><br />";
   var index = 0
   for (var src in links) {
   //for (var i = 0, len = links.length; i < len; ++ i) {
     //linkData = links[i]
     //for (var src in linkData){
     var linkName = links[src];
       //alert(inspect(linkNames));
       //alert(src);
       //alert(linkNames.length);
       //var link_url = "/bufs_info_doc/get_attachment?node_cat=" + node_id + "&att_name=" + attachment;
       //alert(attachment);
       //for (var j = 0, len = linkNames.length; j < len; ++ j) {
       if(linkName){
         newHTML += "<div class='link_item'><a href='" + src + "' target='_blank'>" + linkName + "</a>";
         //newHTML += "<div class='link_item'><span id='link_src'>" + link + "</a>";
         newHTML += "<input type='checkbox' onclick='javascript:delete_link(this)' name='checkbox_" + index + "'> Delete?</div>";
         }
        //else newHTML = "";
         //index += 1
       //};
     index += 1;
     //};
   };
   //alert(newHTML);
   $(el_name).innerHTML = newHTML;
};

function show_edit_node_form(node_id){
  //alert("Edit: " + node_id);
  //$('node_id_edit').value = node_id;
  //$('node_id_edit_label').innerHTML =  node_id;
  $('create-node-form').hide();
  $('edit-node-form').show();
  //$("update_node_button").observe("click", alert("clicked") );//update_node(node_id) );

  //update_node_form_attachments(node_id);
  //update_node_form_links(node_id);
};

/*
function update_node_form_links(node_id){
  var el_name = 'links_list'
  new Ajax.Request('/bufs_info_doc/list_links',
        { method:'post',
          parameters: { 'node_cat':node_id },
          onSuccess: function(transport){
            //alert("got links");
            json = transport.responseJSON;
            $('node_id_input_edit').value = node_id;
            make_links_list(json, el_name);
            //dynamically_create_attachment_list(json);
          },
          onFailure: function(){ alert('Something went wrong updating links...\n Response:' + transport.headerJSON)}
        });
};
*/

/*
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
          onFailure: function(){ alert('Something went wrong updating attachments... \n Response:' + transport.headerJSON)}
        });
};
*/



/*  Replaced by routeNodeDataToElements (and no longer needs server side ajax request
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
*/

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

/* replaced by routeNodeDataToElements
function show_edit_node_form(node_id){
  //alert("Edit: " + node_id);
  $('node_id_edit').value = node_id;
  $('node_id_edit_label').innerHTML =  node_id;
  $('create-node-form').hide();
  $('edit-node-form').show();
  //$("update_node_button").observe("click", alert("clicked") );//update_node(node_id) );

  update_node_form_attachments(node_id);
  update_node_form_links(node_id);
};
*/
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
  var node_data = { 'node_cat': node_id, uniqIterator : uniqIteration+'' }
  new Ajax.Request('/bufs_info_doc/destroy_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        var json = transport.responseJSON;
        uniqIteration += 1;
/*
        var parent_node;
        //alert(myGraph.toJSON().children.length);
        //alert('deleting node');
        var visnode = myGraph.graph.getNode(node_id);
        visnode.eachSubnode(function(node) {
          //alert(visnode.data.parent_categories);
          visnode.data.parent_categories.each(function(parCat, index){
            //alert(index + ':' + parCat);
            if(parCat == node.id){
              parent_node = parCat;
              //alert('found: ' + parCat);
            }
          });  
          //alert(node.id);  
         });
        //alert('click on: ' + parent_node);
        //alert(inspect(myGraph));
        myGraph.onClick(parent_node);
*/
      //  myGraph.op.removeNode(node_id, {
      //    type: 'fade:seq',
      //    duration: 1500});
        myGraph.op.morph(json, {
          type: 'fade:seq',
          duration: 1500});
        alert('node removed');
        //guessing below
        //$jit.Graph.Util.computeLevels(myGraph.graph, parent_node);
        //newJson = myGraph.toJSON();
        //myGraph.loadJSON(newJson);
        //myGraph.compute();
        //myGraph.refresh();
        alert('refreshed');
        //node is undefined at this point
        //myGraph.onclick(this.root);
        //alert(myGraph.toJSON().children.length);
        //alert('node deleted');
        //myGraph.loadJSON(json);
        //myGraph.op.morph(json, {
        //  type: 'fade:con',
        //  duration: 1500});
        //myGraph.refresh();
        
        myGraph.empty();
        myGraph.fx.clearLabels(true);
        tmpGraph = rgraph_init(json);
        //myGraph = null;
        //myGraph = tmpGraph;
      }
  });
};

/*
        //alert('deleting node');
        myGraph.op.removeNode(node_id, {
          type: 'fade:seq',
          duration: 1500});
        //alert('node deleted');
        myGraph.loadJSON(json);
        myGraph.refresh();
*/



//  new Ajax.Updater('attachment_list','/bufs_info_doc/list_attachments',{
//                  parameters:{ node_cat: node_id }
//                });





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


function delete_link(el){
  //var index = el.name.replace(/checkbox_/g,''));
  var link_name = el.previousSibling.innerHTML;
  //alert(link_name);
  var node_id = $('node_id_edit_label').innerHTML;
  //alert(attach_name);
  //alert(node_id);
  new Ajax.Updater('', '/bufs_info_doc/remove_link',{
    parameters: {'node_cat': node_id, 'link_name':link_name }
  });
  update_node_form_links(node_id);

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

function adda_link(){
  //redirect_submit();
  var node_id = $('node_id_edit_label').innerHTML;
  //TODO: clean up link naming (maybe link_src and link_label?)
  var link_name = $('add_link_edit').value;
  var link_name_label = $('add_link_name_edit').value;
  //alert(link_name);
  //alert(link_name_label);
  new Ajax.Updater('', '/bufs_info_doc/add_link',{
    parameters: {'node_cat': node_id, 'link_uri':link_name, 'link_label':link_name_label }
  });
  //alert($('node_id_edit_label').innerHTML);
  //TODO: This should only be ran after the ajax update?  Right now it
  // seems like it will execute asynchrounously
  update_node_form_links($('node_id_edit_label').innerHTML);
};

//function show_create_node_form() {
//  alert("Create New Node");
//}

// Ajax Example

function create_node_data(){
 var node_cat = $('node_cat_create');
 var related_tags = $('related_tags_create');
 //TODO Create Node using local information
 // then use ajax to update it to the final authoritative view
   
 var node_data = { node_cat: node_cat.value, related_tags: related_tags.value, uniqIterator : uniqIteration+'' }
 new Ajax.Request('/bufs_info_doc/create_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        uniqIteration += 1; 
        json = transport.responseJSON;
        //The below should move to the local section
        //using locally provided json manipulation
        myGraph.op.sum(json, {
          type: 'fade:con',
          duration: 1500});
        myGraph.empty();
        tmpGraph = rgraph_init(json);
        myGraph = tmpGraph;
        //alert('new node graphed');
      }
  });

//  new Ajax.Updater(divToUpdate, dataUrl, { method: 'get' });
};

//When is this used?????
function destroy_node_data(){
 alert('entered destroy node');
 //var node_cat = $('node_cat_destroy');
 var node_id = $('node_id_edit_label').innerHTML;
 var node_data = { 'node_cat': node_id }
 new Ajax.Request('/bufs_info_doc/destroy_node', { method:'get',
    parameters: node_data,
    onSuccess: function(transport, json){
        alert('getting json');
        json = transport.responseJSON;
        alert('deleting node');
        myGraph.op.removeNode(node_id, {
          type: 'fade',
          duration: 1500});
        alert('node deleted');
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
      parameters: {uniqIterator : uniqIteration+''},
      onSuccess: function(transport){
        uniqIteration += 1;
        //uniq_id = '__' + uniqIteration;
        //alert(uniq_id);
        json = transport.responseJSON
        //console.log("============= ORIGINAL ==============");
        //traverse(json,log, 0);
        //traverse(json,rekey, uniq_id);
        //console.log("============= REKEYED ==============");
        //traverse(json,log, 0);
        var rgraph = rgraph_init(json);
      },
      onFailure: function(){ alert('Something went wrong indexing nodes...') }
    });
  return rgraph
};

//Based off of an answery by Hippo on StackOverflow
//an object is traversed, and every sub-object of that object is traversed as well
//if the sub-object is not a function than the function passed in to traverse
// will be applied to that sub-object
// An external object can also be carried through and refrenced in the paramterized function
function log(obj, key,value,newValue, extObj) {
    if(key=="id"){
      console.log(key + " ::: "+value);}
    else{
      console.log(key + " : " + value);
    }
}

function rekey(obj, key,value, extObj) {
    if(key=="id"){
      //key = key + "test"}
      obj[key] = value + extObj;
    //else{
    //  console.log(key + " : " + value);
    }
}
function traverse(obj,func,extObj) {
    for (o in obj) {
    //obj.each(function(o){
        //console.log('Type: ' + typeof(obj[o]));
        if(typeof(obj[o])!="function" )func.apply(this,[obj,o,obj[o],extObj]);      
        if (typeof(obj[o])=="object") {
                //going on step down in the object tree!!
                traverse(obj[o],func, extObj);
        }
    }
    //);//close each
}
//End Hippo Stuff

function rgraph_init(json){
    alert(myGraph);
    

    //remove canvas
    //var canvasElement = document.getElementById('infovis');
    //canvasElement.parentNode.removeChild(canvasElement);
    //make a new instance
    //canvas = new Canvas('mycanvas', {'injectInto': canvasElementId,});
    //ht = new Hypertree(canvas, { .. } ) 
/*    
    myGraph.canvas = myCanvas.canvas ||new Canvas("mycanvas",{
    //Where to append the visualization
        injectInto: 'infovis',
        //Optional: create a background canvas that plots
        //concentric circles.
        background: {
          CanvasStyles: {
            strokeStyle: '#555'
          }
        }
      });
*/
    alert(myGraph);
//    $("mycanvas-label").empty();
    
     //init RGraph new
    var rgraph = new $jit.RGraph({
        //Where to append the visualization
        injectInto: 'infovis',
        //Optional: create a background canvas that plots
        //concentric circles.
        background: {
          CanvasStyles: {
            strokeStyle: '#555'
          }
        },
      //canvas,{
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
              myGraph.onClick(node.id);
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
        //onCreateLabel: function(domElement, node){
        //    domElement.innerHTML = node.name;
        //    domElement.onclick = function(){
        //        rgraph.onClick(node.id);
        //    };
        //},
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            domElement.addEventListener('click',function (e) {
                alert('clicked');
                rgraph.onClick(node.id);
                alert('clicked past onClick');
                routeClickedNodeDataToElements(node);
                //ajaxGetParentCats($('related_tags_edit'),node.name);
                //show_edit_node_form(node.name);
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
    myGraph = rgraph;
    myGraph.loadJSON(json);
    //compute positions and make the first plot
    myGraph.refresh();
    
    return myGraph;
}
