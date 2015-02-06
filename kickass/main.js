/********************* engine config *************************
**************************************************************/

var kick = {};
kick.engine_name = 'kickass';
var kick_eng=require('kickass-torrent');
kick.type="video";
kick.totalPages = 0;
kick.currentPage = 0;
kick.itemsCount = 0;
kick.pageLoading = false;

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
var searchType = 'search';

// init module
kick.init = function(gui,ht5) {
	$('#pagination').hide();
    kick.gui = ht5;
    loadEngine();
    //play videos
    $(ht5.document).off('click','.preload_kick_torrent');
    $(ht5.document).on('click','.preload_kick_torrent',function(e){
        e.preventDefault();
        kick.gui.initPlayer();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = obj.link;
        var id = obj.id;
        $('.highlight').removeClass('highlight well');
		$(this).closest('li').addClass('highlight well');
        $.get(link, function(res) {
            var table = $("#movieinfo", res).html();
            if(table == undefined) {
				var table = $("#tab-main", res).html().replace(/"\/img/g,'"http://kickass.so/img').replace(/"\/\//g,'"http://');
			}
            table += $("#desc", res).html();
            var name = obj.title;
            obj.torrent = obj.torrentLink;
            $('#fbxMsg').empty();
            $('#fbxMsg').append('<div id="fbxMsg_header"><h3>'+obj.title+'</h3><a href="#" id="closePreview">X</a></div><div id="fbxMsg_downloads" class="well"></div><div id="fbxMsg_content"></div>');
            $('#preloadTorrent').remove();
			$('.mejs-overlay-button').hide();
            $('.download-torrent').remove();
            // add play button
			$('#fbxMsg_downloads').append('<button type="button" id="kick_play_'+id+'" data="" class="play_kick_torrent btn btn-success" style="margin-right:20px;"> \
											<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span>\
										  </button>');
			$('#kick_play_'+id).attr('data',encodeURIComponent(JSON.stringify(obj)));
			// downloads buttons
			$('#fbxMsg_downloads').append('<button type="button" class="download_kick_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="kick_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'" ><span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span></span></button>');
			if(kick.gui.freeboxAvailable) {
				$('#fbxMsg_downloads').append('<button type="button"  href="'+obj.torrent+'" class="download_kick_torrentFile_fbx downloadText btn btn-info" id="kick_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>');
			}
			// clean preview
			$('#fbxMsg_content').append(table);
			// show
            $('#fbxMsg').slideDown();
        })
    });
    
    $(ht5.document).on('click','#fbxMsg_content a',function(e) {
		e.preventDefault();
		ht5.gui.Window.open('http://kickass.so'+$(this).attr('href').replace(/(.*)?\/\//,''),{"always-on-top":true,position:"center",toolbar:false,height:800,width:1024});
	})
    
    $(ht5.document).off('click','.play_kick_torrent');
    $(ht5.document).on('click','.play_kick_torrent',function(e){
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        kick.gui.getTorrent(obj.torrent);
        $('#fbxMsg').slideUp();
        $('#playerToggle')[0].click();
    });
    
    $(ht5.document).off('click','.download_kick_torrentFile');
    $(ht5.document).on('click','.download_kick_torrentFile',function(e){
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        kick.gui.getAuthTorrent(obj.torrent,false,false)
    });
     
    $(ht5.document).off('click','.download_kick_torrentFile_fbx');
    $(ht5.document).on('click','.download_kick_torrentFile_fbx',function(e){
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        kick.gui.getAuthTorrent(obj.torrent,false,true)
    });
}

function loadEngine() {
/********************* Configure locales *********************/
var localeList = ['en', 'fr','de'];
i18n.configure({
	defaultLocale: 'en',
    locales:localeList,
    directory: kick.gui.pluginsDir + 'kickass/locales',
    updateFiles: true
});

if ($.inArray(kick.gui.settings.locale, localeList) >-1) {
	console.log('Loading kick engine with locale' + kick.gui.settings.locale);
	i18n.setLocale(kick.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

// menus needed by the module and menu(s) loaded by default
kick.menuEntries = ["searchTypes","orderBy"];
kick.defaultMenus = ["searchTypes","orderBy"];
// searchTypes menus and default entry
kick.searchTypes = JSON.parse('{"'+_("Search")+'":"search"}');
kick.defaultSearchType = 'search';
// orderBy filters and default entry
kick.orderBy_filters = JSON.parse('{"'+_("Date")+'":"time_add","'+_("Seeds")+'":"seeds"}');
kick.defaultOrderBy = 'time_add';
// others params
kick.has_related = false;
kick.categoriesLoaded = true;

}

// search videos
kick.search = function (query, options,gui) {
    kick.gui = gui;
    kick.pageLoading = true;
	var page = options.currentPage;
	if(page == 1) {
		$('#items_container').empty().append('<ul id="kick_cont" class="list" style="margin:0;"></ul>').show();
		kick.itemsCount = 0;
	}
	kick.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	kick.currentPage = kick.gui.current_page;
    var url;
    var videos = {};
    if(options.searchType === "search") {
		kick_eng({
			q: ''+query+'',//actual search term
			field:''+options.orderBy+'',//seeders, leechers, time_add, files_count, empty for best match
			order:'desc',//asc or desc
			page: page,//page count, obviously
			url: 'http://kickass.so',//changes site default url (http://kick.to)
		},function(e, data){
			if(e || data.total_results == 0) {
				$('#loading').hide();
				$("#search_results p").empty().append(_("No results found..."));
				$("#search").show();
				$("#pagination").hide();
				return;
			} else {
				if(data.total_results == 0) {
					$('#loading').hide();
					$("#search_results p").empty().append(_("No results found..."));
					$("#search").show();
					$("#pagination").hide();
					return;	
				} else {
					// add new items to total items count for lazy loading
					kick.itemsCount += 25;
					kick.totalItems = data.total_results;
					kick.totalPages = kick.totalItems / 25;
					var list = data.list;
					analyseResults(list);
				}
			}
		})
    }
}

function analyseResults(list) {
	Iterator.iterate(list).forEach(function (item) {
		var video = {};
		video.torrentLink = item.torrentLink;
		video.link = item.guid;
		video.title = item.title.replace(/\./g,' ');
		video.seeders = item.seeds;
		video.leechs = item.leechs;
		var converted_size = Math.floor( Math.log(item.size) / Math.log(1024) );
		video.size = ( item.size / Math.pow(1024, converted_size) ).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_size];
		appendVideo(video);
	});
	$('#loading').hide();
	$('#search_results p').empty().append(_("%s results founds", kick.totalItems)).show();
	$('#search').show();
}

kick.search_type_changed = function() {
	kick.gui.current_page = 1;
	$('#items_container').empty();
	searchType = $("#searchTypes_select").val();
	category = $("#categories_select").val();
	if (searchType === 'navigation') {
		if(kick.categoriesLoaded === false) {
			$.each(kick.category_filters, function(key, value){
				$('#categories_select').append('<option value="'+value+'">'+key+'</option>');
			});
			kick.categoriesLoaded = true;
			category = $("#categories_select").val();
		}
		$("#orderBy_select").hide();
		$("#orderBy_label").hide();
		$("#categories_label").show();
		$("#categories_select").show();
		$("#dateTypes_select").hide();
		$("#searchFilters_select").hide();
		$('#video_search_query').prop('disabled', true);
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

kick.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			kick.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

kick.loadMore = function() {
	kick.pageLoading = true;
	kick.gui.changePage();
}

// functions
function appendVideo(video) {
	var viewed = "none";
	kick.gui.sdb.find({"title":video.title},function(err,result){
		if(!err){
			if(result.length > 0 ) {
				viewed = "block"
			}
		} else { 
			console.log(err)
		}
	})
        video.id = ((Math.random() * 1e6) | 0);
		var html = '<li id="'+video.id+'" class="list-row" style="margin:0;padding:0;"> \
						<div class="mvthumb"> \
							<span class="viewedItem" style="display:'+viewed+';"><i class="glyphicon glyphicon-eye-open"></i>'+_("Already watched")+'</span> \
							<img src="" style="float:left;width:100px;height:125px;" /> \
						</div> \
						<div style="margin: 0 0 0 105px;"> \
							<a href="#" class="preload_kick_torrent item-title" data="'+encodeURIComponent(JSON.stringify(video))+'">'+video.title+'</a> \
							<div class="item-info"> \
								<span><b>'+_("Size: ")+'</b>'+video.size+'</span> \
							</div> \
							<div class="item-info"> \
								<span><b>'+_("Seeders: ")+'</b>'+video.seeders+'</span> \
							</div> \
							<div class="item-info"> \
								<span><b>'+_("Leechers: ")+'</b>'+video.leechs+'</span> \
							</div> \
						</div>  \
						<div id="torrent_'+video.id+'"> \
						</div> \
					</li>';
			$("#kick_cont").append(html);
			$.get(video.link,function(res) { 
				try {
					var img = 'http:'+$('.movieCover img',res).attr('src');
				} catch(err) {
					var img = "images/kick.png";
				}
				if(img === "http:undefined") {
					var img = "images/kick.png";
				}
				$('#'+video.id+' img').attr('src',img.replace('file:','http:'))
			});
			if($('#items_container ul li').length === kick.itemsCount) {
				kick.pageLoading = false;
			}
}

module.exports = kick;
