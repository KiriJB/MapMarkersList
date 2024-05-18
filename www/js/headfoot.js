	//JQuery to include header and footer on every page
	//https://stackoverflow.com/questions/18712338/make-header-and-footer-files-to-be-included-in-multiple-html-pages
	$(function(){
    $("#mainheader").load("header.html"); 
    $("#footer").load("footer.html"); 
	});