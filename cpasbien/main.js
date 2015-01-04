/********************* engine config *************************
**************************************************************/

var cpb = {};
cpb.engine_name = 'Cpasbien';
cpb.type="video";
cpb.totalPages = 0;
cpb.currentPage = 0;
cpb.itemsCount = 0;
cpb.pageLoading = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var os = require('os');
var i18n = require("i18n");
var fs = require('fs');
var _ = i18n.__;
var Iterator = require('iterator').Iterator;

/****************************/

// module global vars
var searchType = 'navigation';

// init module
cpb.init = function(gui,ht5) {
	$('#pagination').hide();
	cpb.gui = ht5;
	loadEngine();
    //play videos
    $(ht5.document).off('click','.preload_cpb_torrent');
    $(ht5.document).on('click','.preload_cpb_torrent',function(e){
    	e.preventDefault();
    	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    	var link = obj.link;
    	var id = obj.id;
    	$('.highlight').removeClass('highlight well');
    	$(this).closest('li').addClass('highlight well');
    	$.get(link, function(res) {
    		var table = $("#gauche", res).html();
    		var name = $(".h2fiche", res).text();
    		obj.torrent = 'http://www.cpasbien.pw'+$("a#telecharger",res).attr('href');
    		$('#fbxMsg').empty();
    		$('#fbxMsg').append('<div id="fbxMsg_header"><h3>'+obj.title+'</h3><a href="#" id="closePreview">X</a></div><div id="fbxMsg_downloads" class="well"></div><div id="fbxMsg_content"></div>');
    		$('#preloadTorrent').remove();
    		$('.mejs-overlay-button').hide();
    		$('.download-torrent').remove();
            // add play button
            $('#fbxMsg_downloads').append('<button type="button" id="cpb_play_'+id+'" data="" class="play_cpb_torrent btn btn-success" style="margin-right:20px;"> \
            	<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span>\
            	</button>');
            $('#cpb_play_'+id).attr('data',encodeURIComponent(JSON.stringify(obj)));
			// downloads buttons
			$('#fbxMsg_downloads').append('<button type="button" class="download_cpb_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="cpb_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span></span></button>');
			if(cpb.gui.freeboxAvailable) {
				$('#fbxMsg_downloads').append('<button type="button"  href="'+obj.torrent+'" class="download_cpb_torrentFile_fbx downloadText btn btn-info" id="cpb_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>');
			}
			// clean preview
			$('#fbxMsg_content').append(table);
			$('#fbxMsg_content .h2fiche').remove();
			$('#fbxMsg_content #telecharger').remove();
			$('#fbxMsg_content #infosficher').remove();
			$('#fbxMsg_content #banner3').remove();
			$('#fbxMsg_content h4').remove();
			$('#fbxMsg_content .ligne0,.ligne1').remove();
			// show
			$('#fbxMsg').slideDown();
		})
});

$(ht5.document).off('click','.play_cpb_torrent');
$(ht5.document).on('click','.play_cpb_torrent',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	cpb.gui.getTorrent(obj.torrent);
	$('#fbxMsg').slideUp();
	$('#playerToggle')[0].click();
});

$(ht5.document).off('click','.download_cpb_torrentFile');
$(ht5.document).on('click','.download_cpb_torrentFile',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	cpb.gui.getAuthTorrent(obj.torrent,false,false);
});

$(ht5.document).off('click','.download_cpb_torrentFile_fbx');
$(ht5.document).on('click','.download_cpb_torrentFile_fbx',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	cpb.gui.getAuthTorrent(obj.torrent,false,true);
});
}

function loadEngine() {
	/********************* Configure locales *********************/
	var localeList = ['en', 'fr'];
	i18n.configure({
		defaultLocale: 'en',
		locales:localeList,
		directory: cpb.gui.pluginsDir + 'cpasbien/locales',
		updateFiles: true
	});

	if ($.inArray(cpb.gui.settings.locale, localeList) >-1) {
		console.log('Loading cpasbien engine with locale' + cpb.gui.settings.locale);
		i18n.setLocale(cpb.gui.settings.locale);
	} else {
		i18n.setLocale('en');
	}

// menus needed by the module and menu(s) loaded by default
cpb.menuEntries = ["searchTypes","orderBy","categories"];
cpb.defaultMenus = ["searchTypes","orderBy"];
// searchTypes menus and default entry
cpb.searchTypes = JSON.parse('{"'+_("Search")+'":"search","'+_("Navigation")+'":"navigation"}');
cpb.defaultSearchType = 'navigation';
// orderBy filters and default entry
cpb.orderBy_filters = JSON.parse('{"'+_("Date")+'":"date","'+_("Seeds")+'":"seeds"}');
cpb.defaultOrderBy = 'date';
// orderBy filters and default entry
cpb.category_filters = JSON.parse('{"'+_("Movies")+'":"films","'+_("Series")+'":"series"}');
cpb.defaultCategory = 'films';
// others params
cpb.has_related = false;
cpb.categoriesLoaded = true;
}

// search videos
cpb.search = function (query, options,gui) {
	cpb.gui = gui;
	cpb.pageLoading = true;
	var page;
	try {
		page = options.currentPage - 1;
	} catch(err) {
		page = 0;
		cpb.gui.current_page = 1;
	}	
	if(page == 0) {
		$('#items_container').empty().append('<ul id="cpb_cont" class="list" style="margin:0;"></ul>').show();
		cpb.itemsCount = 0;
	}
	cpb.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	cpb.currentPage = cpb.gui.current_page;
	
	var query = query.replace(/ /g,'-');
	var url;
	var videos = {};
	if(options.searchType === "search") {
		url='http://www.cpasbien.pw/recherche/'+query+'/page-'+page+',trie-'+options.orderBy+'-d';
	} else {
		url='http://www.cpasbien.pw/view_cat.php?categorie='+options.category+'&page='+page+'';
	}
	console.log(url)
	$.when($.ajax(url)).then(function(data, textStatus, jqXHR ) {
		var mlist=$('#centre div',data).get();
		var list = [];
		Iterator.iterate(mlist).forEach(function (item) {
			if($(item).hasClass('ligne0') || $(item).hasClass('ligne1')){
				list.push(item);
			}
		});
		if(list.length === 0 ) {
			$('#loading').hide();
			$("#search_results p").empty().append(_("No results found..."));
			$("#search").show();
			$("#pagination").hide();
			return;
		}
		// add new items to total items count for lazy loading
		cpb.itemsCount += list.length;
		try {
			cpb.totalPages = parseInt($($('#pagination a',data)[$('#pagination a',data).length - 2]).text())
			if(isNaN(cpb.totalPages)) {
				cpb.totalItems =  list.length;
				cpb.totalPages = 1;
			} else {
				cpb.totalItems =  cpb.totalPages * 30;
			}
			analyseResults(list);
		} catch(err) {
			cpb.totalItems = list.length;
			cpb.totalPages = 1;
			analyseResults(list);
		}
	});
}

function analyseResults(list) {
	var arr = []
	Iterator.iterate(list).forEach(function (item,index) {
		var video = {};
		video.link = $(item).find('a')[0].href;
		video.title = $(item).find('a')[0].innerHTML;
		video.size = $(item).find('.poid').text();
		video.seeders = $(item).find('.up').text();
		video.leechers = $(item).find('.down').text();
		var c = checkDb(video);
		video.viewed = c.next().value.length > 0 ? 'block' : 'none';
		appendVideo(video);
	});
	$('#loading').hide();
	var type = category !== 'series' ? 'movies' : 'chapters';
	if(searchType === 'navigation') {
		var type = category !== 'series' ? 'movies' : 'chapters'
		$('#search_results p').empty().append(_("%s availables %s", cpb.totalItems,_(type))).show();
		$('#search').show();
	} else {
		$('#search_results p').empty().append(_("%s results founds", cpb.totalItems,_(type))).show();
		$('#search').show();
	}
}

function wait(video,place) {
	setTimeout(function() {
		if($("#cpb_cont ul li").length + 1 !== place) {
			wait(video,place)
		} else {
			appendVideo(video);
		}
	},100);
}
 
function* checkDb(video) {
	try {
		yield cpb.gui.sdb.find({"title":video.title});
	} catch(err) {
		return err;
	}
}
 
function appendVideo(video) {
	    var res = video.html;
		var img = $("#bigcover img",res).attr('src');
		video.id = ((Math.random() * 1e6) | 0);
		var html = '<li id="'+video.id+'" class="list-row" style="margin:0;padding:0;"> \
		<div class="mvthumb"> \
		<span class="viewedItem" style="display:'+video.viewed+';"><i class="glyphicon glyphicon-eye-open"></i>'+_("Already watched")+'</span> \
		<img src="" style="float:left;width:100px;height:125px;" /> \
		</div> \
		<div style="margin: 0 0 0 105px;"> \
		<a href="#" class="preload_cpb_torrent item-title" data="'+encodeURIComponent(JSON.stringify(video))+'">'+video.title+'</a> \
		<div class="item-info"> \
		<span><b>'+_("Size: ")+'</b>'+video.size+'</span> \
		</div> \
		<div class="item-info"> \
		<span><b>'+_("Seeders: ")+'</b>'+video.seeders+'</span> \
		</div> \
		</div>  \
		<div id="torrent_'+video.id+'"> \
		</div> \
		</li>';
		$("#cpb_cont").append(html);
		$.get(video.link,function(res) {
			var img = $("#bigcover img",res).attr('src');
			$('#'+video.id+' img').attr('src',img)
		});
		if($('#items_container ul li').length === cpb.itemsCount) {
			cpb.pageLoading = false;
		}
}

cpb.loadMore = function() {
	cpb.pageLoading = true;
	cpb.gui.changePage();
}

cpb.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			cpb.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

cpb.search_type_changed = function() {
	cpb.gui.current_page = 1;
	$('#items_container').empty();
	searchType = $("#searchTypes_select").val();
	category = $("#categories_select").val();
	$('#search').hide();
	if (searchType === 'navigation') {
		$("#orderBy_select").hide();
		$("#orderBy_label").hide();
		$("#categories_label").show();
		$("#categories_select").show();
		$("#dateTypes_select").hide();
		$("#searchFilters_select").hide();
		$('#video_search_query').prop('disabled', true);
		$('#video_search_btn').click();
	} else {
		$("#dateTypes_select").hide();
		$("#searchFilters_label").hide();
		$("#searchFilters_select").hide();
		$("#categories_label").hide();
		$("#categories_select").hide();
		$("#orderBy_label").show();
		$("#orderBy_select").show();
		$('#video_search_query').prop('disabled', false);
	}
}

module.exports = cpb;
