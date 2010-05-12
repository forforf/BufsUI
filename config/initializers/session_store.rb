# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_bufs_rails_session',
  :secret      => 'a30f8a763bd15738d7d5373bcedaf4cc6c9fff97e90a815edf33bbed4258eece8d9e6d76ce0ff9ca47dbe71e017e030f05e5b082cc4ef346ac84f545b8cda5a3'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
