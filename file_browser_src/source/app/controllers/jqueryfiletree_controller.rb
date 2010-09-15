class JqueryfiletreeController < ApplicationController
  protect_from_forgery :only => []
  def content
    @parent = params[:dir]
    @dir = Jqueryfiletree.new("public/"+@parent).get_content
  end
end