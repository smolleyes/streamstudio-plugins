/********************* engine config *************************
**************************************************************/

var bg = {};
bg.engine_name = 'Beeg';
bg.type="video";
// menus needed by the module and menu(s) loaded by default
bg.menuEntries = ["searchTypes","categories"];
bg.defaultMenus = ["searchTypes"];
// searchTypes menus and default entry
bg.searchTypes = {"Videos":"videos","Categories":"categories"};
bg.defaultSearchType = 'categories';
// orderBy filters and default entry
bg.orderBy_filters = {};
// others params
bg.has_related = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');

/****************************/

// module global vars
var videos_responses = new Array();
var has_more = true;
var searchType = 'categories';

// init module
bg.init = function(gui,ht5) {
	$('#pagination').hide();
    $('#search').hide();
    $('#loading p').empty().append("Loading Beeg engine...");
    $('#loading').show();
    bg.gui = ht5;
    // load categories from html file
    $.get(ht5.pluginsDir+'beeg/beeg-cat.html', function(data){
        $('#categories_select').html(data);
        $('#categories_select').val("18");
        selected_category = '18';
        bg.search_type_changed();
		bg.gui.startSearch();
    });
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
		ht5.startPlay(video);
	});
}

// search videos
bg.search = function (query, options,gui){
	bg.gui = gui;
    videos_responses = new Array();
    var page = options.currentPage;
    if (searchType === 'videos') {
        var url = '/search?q='+query+'&page='+page+'';
    } else if (searchType === 'categories'){
        var url = '/tag/'+options.category+'/'+page+'/'
    }
    var options = 
    {
        host: 'beeg.com',
        headers: {'user-agent': 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8G4 Safari/6533.18.5'},
        path: url
    }
    var req=http.request(options);
    req.on('response',function(response) { 
        var data = new Array(); 
        response.on("data", function(chunk) {
            data.push(chunk);
        });
        response.on('end',function(){
            var datas = $(data.join(''));
            var videos = {};
            if (searchType === 'videos'){
                var totalItems = parseInt($('.pager-box',data.join('')).text().split(' ').splice(-1)[0].trim())* 50;
                videos.totalItems = totalItems;
            }
            console.log(videos)
            var list=$('#thumbs a',datas);
            videos.total = list.length;
            videos.items = [];
            for (var i=0; i<list.length; i++) {
                var infos = {};
                infos.wslink = list[i].href;
                infos.id = infos.wslink.split('/')[3];
                infos.thumb = "http://cdn.anythumb.com/236x177/"+infos.id+".jpg";
                infos.title = list[i].children[0].alt;
                infos.link = 'http://video.mystreamservice.com/480p/'+infos.id+'.mp4';
                infos.ext = '.mp4';
                storeVideosInfos(videos,infos,i);
            }
        });
    });
    req.on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    req.end();
}

bg.search_type_changed = function() {
	searchType = $("#searchTypes_select").val();
	if (searchType === 'categories') {
		$("#orderBy_select").hide();
		$("#categories_select").show();
        $("#categories_label").show();
		$("#dateTypes_select").hide();
		$("#searchFilters_select").hide();
		$('#video_search_query').prop('disabled', true);
	} else {
		$("#categories_select").hide();
		$("#dateTypes_select").hide();
		$("#searchFilters_select").hide();
		$("#orderBy_select").hide();
        $("#categories_label").hide();
		$("#search p").empty().append("<p>Beeg "+searchType+" section</p>");
		$('#video_search_query').prop('disabled', false);
	}
}

bg.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			bg.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
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

// functions
function print_videos(videos) {
	$('#loading').hide();
	$("#loading p").empty().append("Loading videos...");
	$("#search").show();
	
	// init pagination if needed
	if (searchType === 'videos') {
        bg.gui.init_pagination(videos[0].totalItems,50,false,true,0);
    } else {
		bg.gui.init_pagination(0,50,true,true,0);
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
								<a class="open_in_browser" title="Open in '+bg.engine_name+'" href="'+video.wslink+'"><img style="margin-top:8px;" src="images/export.png" /></a> \
							</div> \
						</div> \
					</li>';
		$("#beeg_cont").append(html);
	});
}

module.exports = bg;
