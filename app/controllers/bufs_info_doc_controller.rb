class BufsInfoDocController < ApplicationController
  CouchDB = CouchRest.database!('http://127.0.0.1:5984/bufs_integration_test_spec')

  protect_from_forgery :except => :att_test

  def index_nodes
    #user = params[:user]
    #user_db = UserDB.new(CouchDB, user)
    @user_db = current_user_db
    nodes = @user_db.docClass.all
    jvis = BufsJsvisData.new(nodes)
    top_cat= session[:user_id]  #top category
    depth = 4
    jvis_data = jvis.json_vis(top_cat, depth)

    json_str = <<-EOS
{"id":"dummy_view2","name":"bid_view","data":{},"children":[{"id":"127.0.0.1:598
    EOS
    json_obj = jvis_data
    render :json => json_obj##, :content_type => 'text/plain'
  end

=begin
  def test_json_str
    #user = params[:user]
    #user_db = UserDB.new(CouchDB, user)
    @user_db = current_user_db
    nodes = @user_db.docClass.all
    jvis = BufsJsvisData.new(nodes)
    top_cat= session[:user_id]  #top category
    depth = 4
    jvis_data = jvis.json_vis(top_cat, depth)

    json_str = <<-EOS
{"id":"dummy_view2","name":"bid_view","data":{},"children":[{"id":"127.0.0.1:5984\/bufs_integration_test_spec_a","name":"a","data":{},"children":[]}]
    EOS
    json_obj = jvis_data
    render :json => json_obj##, :content_type => 'text/plain'
  end
=end
  def get_current_nodes(depth=4)
    nodes = @user_db.docClass.all
    jvis = BufsJsvisData.new(nodes)
    top_cat= session[:user_id]  #top category
    #depth = 4
    return jvis.json_vis(top_cat, depth)
  end

  def create_node
    #test_hash = {'test_key' => 'test_value'}
    #test = params
    @user_db = current_user_db
    #puts "User DB Doc Class#{@user_db.docClass.inspect}"
    my_cat = params[:node_cat]
    parent_cats_munged = params[:related_tags]
    parent_cats = parent_cats_munged.split(/, */)
    new_node = {:my_category => my_cat, :parent_categories => parent_cats}
    #puts "New Node Params: #{new_node.inspect}"
    new_doc = @user_db.docClass.new(new_node)
    #puts "New Doc: #{new_doc.inspect}"
    #puts "New Doc Class: #{new_doc.class.inspect}"
    new_doc.save
    #jvis_data = get_current_nodes #jvis.json_vis(top_cat, depth)
    #puts "JVIS: #{jvis_data.inspect}"
    render :json => get_current_nodes
    #render :text => jvis_data
    #render :text => "#{params} \n #{@user_doc.inspect}"
  end

  def edit_node
    @user_db = current_user_db
    new_node_cat = params[:node_cat]
    new_parent_cats_munged = params[:related_tags]
    parent_cats = parent_cats_munged.split(/, */)
    raise "Need to figure out what to do with edits"
    node_docs = @user_db.docClass.by_my_category(:key => node_cat)
    node_doc = node_docs.first

    #jvis_data = get_current_nodes
    render :json => get_current_nodes

  end

  def echo_parms
    render :text => params.inspect
  end

  def list_attachments(node_cat=params[:node_cat])
    @user_db = current_user_db
    node_docs = @user_db.docClass.by_my_category(:key => node_cat)
    node_doc = node_docs.first
    @node_cat = node_cat
    @attachment_names = node_doc.get_attachment_names
  end

  def remove_attachment
    @user_db = current_user_db
    node_cat = params[:node_cat]
    att_name = params[:att_name]
    node_docs = @user_db.docClass.by_my_category(:key => node_cat)
    node_doc = node_docs.first
    node_doc.remove_attachment(att_name)
    render :text => "Attachment Removed"
  end


  def att_test
    @user_db = current_user_db
    node_cat = params[:node_cat]
    node_docs = @user_db.docClass.by_my_category(:key => node_cat)
    node_doc = node_docs.first
    
    #render :text => node_doc.my_category
    #render :text => params[:add_attachment].inspect.gsub("<","[-").gsub(">","-]")
    @att_file = params[:add_attachment]
    #FIXME: Real fix is to the bufs_info_doc model
    new_file_dir = "/tmp/#{@user_db.hash}"
    new_file_loc = "#{new_file_dir}/#{@att_file.original_filename}"
    if File.exist?(new_file_dir)
      FileUtils.cp(@att_file.path, new_file_loc)
    else
      FileUtils.mkdir(new_file_dir)
      FileUtils.cp(@att_file.path, new_file_loc)
    end
    #TODO test for success before deleting Rack tmp file
    FileUtils.rm(@att_file.path)
    node_doc.add_data_file(new_file_loc)
    FileUtils.rm(new_file_loc)
    FileUtils.rmdir(new_file_dir)
    @attachment_names = list_attachments(node_cat)
    #render :text => "OK"
    #render :text => @att_file.original_filename
  end

  def parent_cats
    @user_db = current_user_db
    node_cat = params[:node_cat]
    node_docs = @user_db.docClass.by_my_category(:key => node_cat)
    node_doc = node_docs.first
    render :text => node_doc.parent_categories.join(", ")

  end

  def destroy_node
    @user_db = current_user_db
    node_cat = params[:node_cat]
    node_docs = @user_db.docClass.by_my_category(:key => node_cat)
    node_doc = node_docs.first
    node_doc.destroy
    jvis_data = get_current_nodes
    render :json => jvis_data
  end

  def log_in
    session[:couch_db_url] = params[:couch_db_url]
    session[:user_id] = params[:user_id]
    #render :text => session
    #@user_db = current_user_db  #method in application_controller.rb
    #render :text => "Log In User DB: #{@user_db.inspect}"
    redirect_to '/jit/bufs_graph.html'
  end

  def log_out
    session[:load]
    session.clear
    redirect_to '/bufs_info_doc/log_in_form'
  end

  def create_node_form
    #render :text => params.to_s
  end

end

