require 'compass'
require 'sass-css-importer'

add_import_path "./bower_components"
add_import_path Sass::CssImporter::Importer.new "./bower_components"

http_images_dir = "img"
images_dir = "app/img"