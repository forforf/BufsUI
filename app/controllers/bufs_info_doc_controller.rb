class BufsInfoDocController < ApplicationController
  #CouchDB = CouchRest.database!('http://127.0.0.1:5984/bufs_integration_test_spec')
  CouchDBLocation = 'http://127.0.0.1:5984/'

  protect_from_forgery :except => :att_test

  def index_nodes
    #user = params[:user]
    #user_db = UserDB.new(CouchDB, user)
    uniq_id_postfix = params[:uniqIterator]
    puts "Uniq Iterator: #{uniq_id_postfix}"
    @user_class = current_user_db
    puts "Index Nodes: #{@user_class.inspect}"
    nodes = @user_class.all :add => {:links => nil}
    
    full_id = session[:user_id] 
    user_name = full_id.to_s.gsub(@user_class.name.to_s, "") #top category
    #puts "Nodes: #{nodes.last.inspect}" 
    #puts "Nodes size: #{nodes.size}"
    
    jvis = BufsJsvisData.new(user_name, nodes)
    
    #puts "Top Category: #{user_name}"
    depth = 4
    jvis_data = jvis.json_vis_tree(user_name, depth)
    #puts "Jvis_Data: #{jvis_data.inspect}"

    json_obj = jvis_data
    puts "Rendering json: #{json_obj.inspect}"
    render :json => json_obj##, :content_type => 'text/plain'
  end

  def get_current_nodes(depth=4) 
    #TODO: This is very close to the index nodes method, dry it up
    @user_class = current_user_db
    puts "GCN: #{@user_class.inspect}"
    nodes = @user_class.all
    puts "Nodes before graphing: #{nodes.map{|n| [n.my_category, n.parent_categories]}.inspect}"
    
    #simplifies user name
    full_id = session[:user_id] 
    user_name = full_id.to_s.gsub(@user_class.name.to_s, "") #top category

    jvis = BufsJsvisData.new(user_name, nodes)
    top_cat= session[:user_id]  #top category
    #depth = 4
    json_tree =jvis.json_vis_tree(top_cat, depth)
    puts "JSON VIZ DATA: #{json_tree.inspect}"    
    return json_tree
  end

  def create_node
    @user_class = current_user_db
    my_cat = params[:node_cat]
    parent_cats_munged = params[:related_tags]
    if parent_cats_munged.empty?||parent_cats_munged.nil?
      parent_cats_munged= @user_class.myGlueEnv.user_id
    end
    puts "Parent Cats: #{parent_cats_munged}"
    parent_cats = parent_cats_munged.split(/, */)
    new_node = {:my_category => my_cat, :parent_categories => parent_cats}
    #puts "New Node Params: #{new_node.inspect}"
    new_doc = @user_class.new(new_node)
    #puts "New Doc: #{new_doc.inspect}"
    #puts "New Doc Class: #{new_doc.class.inspect}"
    new_doc.__save
    render :json => get_current_nodes
    #render :text => jvis_data
    #render :text => "#{params} \n #{@user_doc.inspect}"
  end

  def edit_node
    @user_class = current_user_db
    new_node_cat = params[:node_cat]
    new_parent_cats_munged = params[:related_tags]
    parent_cats = parent_cats_munged.split(/, */)
    raise "Need to figure out what to do with edits"
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first

    #jvis_data = get_current_nodes
    render :json => get_current_nodes

  end

  def update_node
    @user_class = current_user_db
    node_cat = params[:node_cat]
    parent_cats_munged = params[:related_tags]
    parent_cats = parent_cats_munged.split(/, */)
    node_docs = @user_class.call_view(:my_category, node_cat)
    raise "Duplicate keys for node doc" if node_docs.size > 1
    node_doc = node_docs.first if node_docs
    node_doc.parent_categories_add(parent_cats)
    #Hack need to fix model
    #add_parents = parent_cats - node_doc.parent_categories
    #rmv_parents = node_doc.parent_categories - parent_cats
    #node_doc.add_parent_categories(add_parents)
    #node_doc.remove_parent_categories(rmv_parents)
    render :json => get_current_nodes
  end

  def echo_parms
    render :text => "Params: #{params.inspect}"
  end

  def echo_node
    @user_class = current_user_db
    node_cat = params[:node_cat]
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    render :text => node_doc.inspect
  end
 
  def a_t
  end

  def form_test
  end

  def get_attachment
    node_cat = params[:node_cat]
    attachment_name = params[:att_name]
    @user_class = current_user_db
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    #The proxy approach is better than the file approach, but need to t/s
    #attachment_url_text = node_doc.attachment_url(attachment_name)
    #att_url = URI.parse(attachment_url_text)
    #req = Net::HTTP::Get.new(att_url.path)
    #res = Net::HTTP.start(att_url.host, att_url.port) {|http|
    #        http.request(req)
    #}
        #render error if result. ...
    #render :text => res.body
    send_data( node_doc.attachment_data(attachment_name), 
               { :filename => attachment_name }
             )
  end

  def dry_list_attachments(node_cat)
    @user_class = current_user_db
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    @node_cat = node_cat
    @attachment_names = node_doc.attached_files if node_doc
  end

  def dry_list_links(node_cat)
    @user_class = current_user_db
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    @node_cat = node_cat
    #FIXME: GET LINKS IS BROKEN
    @link_names = node_doc.links if node_doc
  end

  def list_attachments
    @user_class = current_user_db
    node_cat = params[:node_cat]
    @attachment_names = dry_list_attachments(node_cat)
    render :json => @attachment_names.to_json
  end

  def list_links
    @user_class = current_user_db
    node_cat = params[:node_cat]
    @link_names = dry_list_links(node_cat)
    #render :text => @link_names.inspect
    #raise @link_names.to_json.inspect
    render :json => @link_names.to_json
  end

  def remove_attachment
    @user_class = current_user_db
    node_cat = params[:node_cat]
    att_name = params[:att_name]
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    node_doc.files_subtract(att_name)
    render :text => "Attachment Removed"
  end

  def remove_link
    @user_class = current_user_db
    node_cat = params[:node_cat]
    link_name = params[:link_name]
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    node_doc.links_subtract(link_name)
    render :text => "Link Removed"
  end


  def add_link
    @user_class = current_user_db
    node_cat = params[:node_cat]
    link_uri_to_add = params[:link_uri]
    link_label_to_add = params[:link_label]
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    link_data_to_add = {link_uri_to_add => link_label_to_add}
    node_doc.links_add(link_data_to_add)
    
    @link_names = dry_list_links(node_cat)
    render :text => node_doc.inspect #@link_names.inspect
  end

  def att_test
    @user_class = current_user_db
    node_cat = params[:node_cat]
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    
    #render :text => node_doc.my_category
    #render :text => params[:add_attachment].inspect.gsub("<","[-").gsub(">","-]")
    @att_file = params[:add_attachment]
    #FIXME: Real fix is to the bufs_info_doc model
    new_file_dir = "/tmp/#{@user_class.hash}"
    new_file_loc = "#{new_file_dir}/#{@att_file.original_filename}"
    if File.exist?(new_file_dir)
      FileUtils.cp(@att_file.path, new_file_loc)
    else
      FileUtils.mkdir(new_file_dir)
      FileUtils.cp(@att_file.path, new_file_loc)
    end
    #TODO test for success before deleting Rack tmp file
    FileUtils.rm(@att_file.path)
    node_doc.files_add(:src_filename => new_file_loc)
    FileUtils.rm(new_file_loc)
    FileUtils.rmdir(new_file_dir)
    @attachment_names = dry_list_attachments(node_cat)
    #render :text => "OK"
    #render :text => @att_file.original_filename
  end

  def parent_cats
    @user_class = current_user_db
    puts "PC: #{@user_class.inspect}"
    node_cat = params[:node_cat]
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    render :text => node_doc.parent_categories.join(", ")

  end

  def destroy_node
    @user_class = current_user_db
    node_cat = params[:node_cat]
    node_docs = @user_class.call_view(:my_category, node_cat)
    node_doc = node_docs.first
    node_doc.__destroy_node
    jvis_data = get_current_nodes
    render :json => jvis_data
  end

  def log_in_form
    @couch_db_location = CouchDBLocation
    @db_default = "bufs_integration_test_spec"
    @user_id_default = "test_user002"
  end

  def log_in
    user_id = params[:user_id]
    node_class_id = "BufsUI#{user_id}"
    core_lib_path = "/home/bufs/bufs/lib"
    bufs_lib_path = "glue_envs/bufs_couchrest_glue_env"
    bufs_libs = [File.join(core_lib_path, bufs_lib_path)]
    bufs_includes = [:CouchRestEnv]
    couch_db_url = "#{CouchDBLocation}#{params[:db_name]}" 
    couchdb = CouchRest.database!(couch_db_url)
    couchdb_env = { node_class_id => {
                      :requires => bufs_libs,
                      :includes => bufs_includes,
                      :glue_name => "BufsCouchRestEnv",
                      :class_env => {
                         :bufs_info_doc_env => {
                           :host => couchdb.host,
                           :path => couchdb.uri,
                           :user_id => user_id}}}}
    session[:bufs_couch_env] = couchdb_env                                      
    #session[:couch_db_url] = couch_db_url
    session[:user_id] = user_id #params[:user_id]
    #render :text => session
    @user_class = current_user_db  #method in application_controller.rb
    #render :text => "Log In User Class: #{@user_class.inspect}"
    redirect_to '/bufs_vis/bufs_graph.html'
  end

  def log_out
    session[:load]
    session.clear
    redirect_to '/index'
  end

  def create_node_form
    #render :text => params.to_s
  end

  def export_to_file
    raise "refactor from new arch"
    @user_class = current_user_db
    user_id = session[:user_id]
    #TODO Add passwords to sessions
    user_pw = session[:pw]||"1234"
    #retrieve user specific file node class
    #FIXME: export to file probably broken
    file_nodeClass = ::BindUserFileSystem.get_user_node(user_id, user_pw)
    file_nodes = []
    node_docs = @user_class.all
    amodel_dir = ::BindUserFileSystem.get_home_dir(user_id) + ::UserFileNode.model_dir + '/'
    FileUtils.rm_rf(amodel_dir)
    node_docs.each do |node_doc|
      file_nodes << file_nodeClass.create_from_doc_node(node_doc)
    end
    #create view
    #TODO: Unhack build viewer
    #TODO: fix BufsViewBuilder to allow home as parent
    home_dir = ::BindUserFileSystem.get_home_dir(user_id) 

    #TODO: Fix so model dir is set right in the correct spot (wherever that may be
    #amodel_dir = ::BindUserFileSystem.get_home_dir(user_id) + ::UserFileNode.model_dir + '/'
    view_builder = ::BufsViewBuilder.new
    top_level_nodes = file_nodeClass.by_parent_categories(user_id)
    view_builder.build_view(home_dir, top_level_nodes, file_nodes, amodel_dir) unless top_level_nodes.empty?
    user_dir_frontend = "http://bufsuser.younghawk.org/#{user_id}"
    redirect_to user_dir_frontend
  end

  def import_from_file
    @user_class = current_user_db
    user_id = session[:user_id]
    user_pw = session[:pw]||"1234"
    file_nodeClass = ::BindUserFileSystem.get_user_node(user_id, user_pw)
    doc_nodes = @user_class.all
    file_nodes = file_nodeClass.all
    doc_nodes.each do |doc_node|
      doc_node.destroy
    end
    doc_nodes = [] 
    file_nodes.each do |file_node|
      doc_nodes << @user_class.create_from_other_node(file_node)
    end 
    #TODO: Better way than deleting all previous docs?
    #TODO: Better way than individually destroying records?
    #TODO: undo for imports and exports 
    #render :text => "soon ..."
    redirect_to '/jit/bufs_graph.html'
  end

end

