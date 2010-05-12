class BufsInfoDocController < ApplicationController
  CouchDB = CouchRest.database!('http://127.0.0.1:5984/bufs_integration_test_spec')
  #BufsInfoDoc.set_name_space(CouchDB)
  #user = params[:user]
  #user_db = UserDB.new(CouchDB, user)
  #@@nodes = user_db.docClass.all
  #@@jvis = BufsJsvisData.new(@@nodes)

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
{"id":"dummy_view2","name":"bid_view","data":{},"children":[{"id":"127.0.0.1:5984\/bufs_integration_test_spec_a","name":"a","data":{},"children":[]}]}
    EOS
    json_obj = jvis_data 
    render :json => json_obj##, :content_type => 'text/plain'
  end

  def test_resync
    SyncIntegration.sync_file_view('/media-ec2/ec2a/projects/bufs/sandbox_for_specs/bufs_spec/view/',
                                   '/media-ec2/ec2a/projects/bufs/sandbox_for_specs/bufs_spec/model/')
    test_json_str
  end

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
    jvis_data = get_current_nodes #jvis.json_vis(top_cat, depth)
    #puts "JVIS: #{jvis_data.inspect}"
    render :json => jvis_data
    #render :text => jvis_data
    #render :text => "#{params} \n #{@user_doc.inspect}"
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

  def create_node_form
    #render :text => params.to_s
  end

end
