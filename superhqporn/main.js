/********************* engine config *************************
**************************************************************/

var shq = {};
shq.engine_name = 'Superhqporn';
// menus needed by the module and menu(s) loaded by default
shq.menuEntries = ["searchTypes"];
shq.defaultMenus = ["searchTypes"];
// searchTypes menus and default entry
shq.searchTypes = {"Videos":"videos","Most recent":"recent","Most viewed":"viewed"};
shq.defaultSearchType = 'recent';
// orderBy filters and default entry
shq.orderBy_filters = {};
// others params
shq.has_related = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');

/****************************/

// module global vars
var videos_responses = new Array();
var has_more = true;
var searchType = 'recent';
var init = false;
var browser_mode= false;

// init module
shq.init = function(gui,ht5) {
	$('#pagination').hide();
    $('#search').hide();
    $('#loading p').empty().append("Loading Superhqporn engine...");
    $('#loading').show();
    shq.gui = ht5;
    
    //play videos
    $(ht5.document).on('click','.start_media',function(e){
		e.preventDefault();
		$(".mejs-overlay").show();
		$(".mejs-layer").show();
		$(".mejs-overlay-play").hide();
		$(".mejs-overlay-loading").show();
		var video = JSON.parse(decodeURIComponent($(this).attr("data")));
		$('.highlight').toggleClass('highlight','false');
		$(this).closest('li').toggleClass('highlight','true');
    var p = $('.highlight').position().top;
    $('#left-component').scrollTop(p+13);
		video.type='object.item.videoItem';
		ht5.startPlay(video);
	});
}

// search videos
shq.search = function (query, options, gui){
	shq.gui = gui;
    videos_responses = new Array();
    var page = options.currentPage;
    var cat;
    searchType = options.searchType;
    if ((searchType === 'videos') || (query !== '')) {
		cat = 'search';
		browser_mode = false;
	} else {
		cat = searchType;
		browser_mode = true;
	}
	console.log('http://www.superhqporn.com/?s='+cat+'&search='+query+'&p='+page+'')
    var req=http.get('http://www.superhqporn.com/?s='+cat+'&search='+query+'&p='+page+'');
    req.on('response',function(response) { 
        var data = new Array(); 
        response.on("data", function(chunk) {
            data.push(chunk);
        });
        response.on('end',function(){
            var datas = $(data.join(''));
            var videos = {};
            var totalItems
            try {
				totalItems = $('.header',datas).text().match(/ (.*) videos/)[1];
			} catch(err) {
				totalItems = 0;
			}
            var list=$('.thumb',datas);
            videos.totalItems = parseInt(totalItems);
            videos.total = list.length;
            videos.items = [];
            for (var i=0; i<list.length; i++) {
                var infos = {};
                infos.wslink = 'http://www.superhqporn.com'+$(list[i]).find("a").attr('href');
                infos.id = infos.wslink.match(/v=(.*)/)[1];
                infos.thumb = $(list[i]).find("img").attr('src');
                infos.title = $(list[i]).find("a").attr('title');
                getVideoInfos(videos,infos,i);
            }
        });
    });
    req.on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    req.end();
}

shq.search_type_changed = function() {
	searchType = $("#searchTypes_select").val();
	$("#categories_select").hide();
	$("#dateTypes_select").hide();
	$("#searchFilters_select").hide();
	$("#orderBy_select").hide();
	$('#video_search_query').prop('disabled', false);
	if (init === false) {
		shq.gui.startSearch('');
		init=true;
	}
}

shq.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			shq.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

// functions
function getVideoInfos(videos,infos,num) {
    var req=http.get('http://www.superhqporn.com/?v='+infos.id+'');
    var data = new Array(); 
    req.on('response',function(response) { 
        response.on("data", function(chunk) {
            data.push(chunk);
        });
        response.on('end',function(){
            var datas = data.join('');
            var link = datas.match('url: \'(.*?)\'')[1];
            infos.link = link;
            infos.ext = '.mp4';
            storeVideosInfos(videos,infos,num);
        });
    });
    req.on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    req.end();
}

function print_videos(videos) {
	$('#loading').hide();
	$("#loading p").empty().append("Loading videos...");
	$("#search").show();
	searchType = $("#searchTypes_select").val();
	// init pagination if needed
	var total = videos[0].totalItems;
	if (browser_mode === true) {
		shq.gui.init_pagination(0,120,true,true);
    } else {
		shq.gui.init_pagination(total,120,false,false);
	}
    $("#pagination").show();
    
    // load videos in the playlist
	$('#items_container').empty().append('<ul id="beeg_cont" class="list" style="margin:0;"></ul>').show();
	$.each(videos[0].items,function(index,video) {
		var html = '<li class="list-row" style="margin:0;padding:0;"> \
						<img src="'+video.thumb+'" style="float: left; margin-left: -10px;height:100px;width:100px;top:0;" /> \
						<div style="margin: 0 0 0 105px;padding-top:10px;"> \
							<a href="#" class="start_media" data="'+encodeURIComponent(JSON.stringify(video))+'" style="font-size:16px;font-weight:bold;">'+video.title+'</a> \
							<div> \
								<a class="start_download" href="#">download</a> \
								<a class="open_in_browser" title="Open in '+shq.engine_name+'" href="'+video.wslink+'"><img style="margin-top:8px;" src="images/export.png" /></a> \
							</div> \
						</div> \
					</li>';
		$("#beeg_cont").append(html);
	});
}

// store videos and return it in the right order...
function storeVideosInfos(video,infos,num) {
    video.items.push(infos); 
    videos_responses[num]=video;
    if (videos_responses.length == video.total) {
        print_videos(videos_responses);
        videos_responses = new Array();
    }
}

module.exports = shq;
