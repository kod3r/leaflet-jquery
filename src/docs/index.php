<?php
shell_exec("docco -o . ../*.js");
#cp docs/gbs.geoext.html docs/index.html

echo readfile( "gbs.geoext.html");
