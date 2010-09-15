# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  helper :all # include all helpers, all the time
  protect_from_forgery # See ActionController::RequestForgeryProtection for details

  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password

  #TODO Move this into the helper for the controller
  def current_user_db
    #couch_db = CouchRest.database!( session[:couch_db_url] )
    #@current_user_db ||= UserDB.new(couch_db, session[:user_id])
    @current_user_db_class ||= BufsNodeFactory.make(session[:bufs_couch_env])
  end
end
