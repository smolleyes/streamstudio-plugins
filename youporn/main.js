/********************* engine config *************************
**************************************************************/

var yp = {};
yp.engine_name = 'Youporn';
yp.type="video";

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var i18n = require("i18n");
var _ = i18n.__;

/****************************/

// module global vars
var searchType = 'videos';

// init module
yp.init = function(gui,ht5) {
	$('#pagination').hide();
    $('#search').hide();
    yp.gui = ht5;
    loadEngine();
    //play videos
    $(ht5.document).on('click','.start_media',function(e){
		e.preventDefault();
		var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
		$(".mejs-overlay").show();
		$(".mejs-layer").show();
		$(".mejs-overlay-play").hide();
		$(".mejs-overlay-loading").show();
		$('.highlight').toggleClass('highlight','false');
		$(this).closest('li').toggleClass('highlight','true');
		var p = $('.highlight').position().top;
		$.get(obj.wslink,function(res){
			try {
                obj.link = $(res).find('.downloadList a')[1].href;
                ht5.startPlay(obj);
            } catch(err) {
                return;
            }
		});
	});
}

function loadEngine() {
/********************* Configure locales *********************/
var localeList = ['en', 'fr'];
i18n.configure({
	defaultLocale: 'en',
    locales:localeList,
    directory: yp.gui.pluginsDir + 'youporn/locales',
    updateFiles: true
});

if ($.inArray(yp.gui.settings.locale, localeList) >-1) {
	console.log('Loading youporn engine with locale' + yp.gui.settings.locale);
	i18n.setLocale(yp.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

// menus needed by the module and menu(s) loaded by default
yp.menuEntries = ["searchTypes","orderBy","categories"];
yp.defaultMenus = ["searchTypes","orderBy"];
// searchTypes menus and default entry
yp.searchTypes = JSON.parse('{"'+_("Videos")+'":"videos","'+_("Categories")+'":"categories"}');
yp.defaultSearchType = 'videos';
// orderBy filters and default entry
yp.orderBy_filters = JSON.parse('{"'+_("Relevance")+'":"relevance","'+_("Views")+'":"views","'+_("Rating")+'":"rating","'+_("Date")+'":"time","'+_("Duration")+'":"duration"}');
yp.defaultOrderBy = 'relevance';
// others params
yp.has_related = false;
yp.categoriesLoaded = false;

}

// search videos
yp.search = function (query, options,gui) {
    yp.gui = gui;
    videos_responses = new Array();
    if(options.currentPage != 0) {
    	var page = options.currentPage - 1;
	}
    var url;
    if (options.searchType === 'categories') {
		url = options.category+'?page='+page;
	} else {
		url='http://www.youporn.com/search/'+options.orderBy+'/?category_id=0&query='+query.replace(' ','+')+'&page='+page;
	}
    $.get(url,function(res){
		var videos = {};
		try {
		var totalItems = parseInt($('.prev-next',res).prev().closest('li').text()) * 31;
        } catch(err) {
            return;
        }
            var list=$('.preloaded',res).find('li');
            videos.totalItems = parseInt(totalItems);
            videos.total = list.length;
            videos.items = [];
            for (var i=0; i<list.length; i++) {
				var ypvid = $(list[i]); 
                var infos = {};
                infos.wslink = 'http://www.youporn.com'+$(list[i]).find('a').attr('href');
                infos.id = $(list[i]).attr('data-video-id');
                infos.thumb = ypvid.find('img')[0].src;
                infos.title = $('.videoTitle',ypvid).text();
                videos.items.push(infos);
                if(i+1 == list.length) {
                	print_videos(videos)
                }
            }
    });
}

yp.search_type_changed = function() {
	searchType = $("#searchTypes_select").val();
	if (searchType === 'categories') {
		if (yp.categoriesLoaded === false) {
			$('#search').show();
			$('#search_results p').empty().append(_('Loading categories, please wait...')).show();
			$.get('http://www.youporn.com/categories/',function(res){
				var list = $('#categoryList li a',res);
				$.each(list,function(index,obj){
					var title = $(this).find('img').attr('alt');
					var link = 'http://www.youporn.com'+$(this).attr('href').replace('file://','');
					$('#categories_select').append('<option value = "'+link+'">'+title+'</option>');
					if (index + 1 === list.length) {
						$('#search_results p').empty();
						yp.categoriesLoaded = true;
					}
				});
			});
		}
		$("#orderBy_select").hide();
		$("#orderBy_label").hide();
		$("#categories_label").show();
		$("#categories_select").show();
		$("#dateTypes_select").hide();
		$("#searchFilters_select").hide();
		$('#video_search_query').prop('disabled', true);
	} else {
		$("#categories_select").hide();
		$("#dateTypes_select").hide();
		$("#searchFilters_select").hide();
		$("#orderBy_select").show();
		$("#search p").empty().append(_("<p>Youporn %s section</p>",searchType));
		$('#video_search_query').prop('disabled', false);
	}
}

yp.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			yp.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

function getYpVideoInfos(videos,infos,num) {
   $.get(infos.wslink,function(res) {
            try {
                infos.link = $(res).find('.downloadList a')[1].href;
            } catch(err) {
                videos.total -=1 ;
                return;
            }
            storeVideosInfos(videos,infos,num);
    });
}

yp.getVideoById = function(link,cb) {
    var req=request(link);
    var data = new Array(); 
    req.on('response',function(response) { 
        response.on("data", function(chunk) {
            data.push(chunk);
        });
        response.on('end',function(){
            var datas = data.join('');
            console.log(datas);
            return;
            var link = $('.downloadList a',datas)[1].attribs.href;
            infos.resolutions=[];
            infos.resolutions['480p'] = {};
            infos.resolutions['480p']['link'] = link;
            infos.resolutions['480p']['container'] = 'mp4';
            cb(infos);
        });
    });
    req.on('error', function(e) {
        console.log("Got error: " + e.message);
    });
    req.end();
}

// store videos and return it in the right order...
function storeVideosInfos(video,infos,num) {
    video.items.push(infos); 
    videos_responses[num]=video;
    console.log(video.total, num+1)
    if (videos_responses.length == video.total+1) {
        print_videos(videos_responses);
        videos_responses = new Array();
    }
}


// functions
function print_videos(videos) {
	console.log(videos)
	$('#loading').hide();
	$("#loading p").empty().append(_("Loading videos..."));
	$("#search").show();
	
	// init pagination if needed
	if (searchType === 'videos') {
        yp.gui.init_pagination(videos.totalItems,31,false,true,0);
    } else {
		yp.gui.init_pagination(0,31,true,true,0);
	}
    $("#pagination").show();
    
    // load videos in the playlist
	$('#items_container').empty().append('<ul id="youporn_cont" class="list" style="margin:0;"></ul>').show();
	$.each(videos.items,function(index,video) {
		var html = '<li class="list-row" style="margin:0;padding:0;"> \
						<img src="'+video.thumb+'" style="float: left; margin-left: -10px;height:100px;width:100px;top:0;" /> \
						<div style="margin: 0 0 0 105px;padding-top:10px;"> \
							<a href="#" class="start_media" data="'+encodeURIComponent(JSON.stringify(video))+'" style="font-size:16px;font-weight:bold;">'+video.title+'</a> \
							<div> \
								<a class="start_download" href="#">'+_("download")+'</a> \
								<a class="open_in_browser" title="'+("Open in %s",yp.engine_name)+'" href="'+video.wslink+'"><img style="margin-top:8px;" src="images/export.png" /></a> \
							</div> \
						</div> \
					</li>';
		$("#youporn_cont").append(html);
	});
}

module.exports = yp;
