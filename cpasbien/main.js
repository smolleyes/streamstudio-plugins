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
cpb.init = function(gui,win,doc,console) {
	cpb.console = console
	$('#pagination',doc).hide();
  $=win.$
	cpb.gui = win;
	loadEngine();
    //play videos
    $(doc).off('click','.preload_cpb_torrent');
    $(doc).on('click','.preload_cpb_torrent',function(e){
    	e.preventDefault();
    	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    	var link = obj.link;
    	var id = obj.id;
    	//$('.highlight').removeClass('highlight well');
    	//$(this).closest('li').addClass('highlight well');
		var html = '<div id="fbxMsg_header"> \
			<h3>'+obj.title+'</h3> \
			</div> \
			<div id="fbxMsg_content" style="height:auto;"> \
				<img src="'+obj.cover+'" /> \
				<p style="margin-top:10px;font-weight:bold;">'+obj.synopsis+'</p> \
			</div>';
		cpb.gui.showPopup(html,'body');
});

$(doc).off('mouseenter','#cpb_cont .list-row');
$(doc).on('mouseenter','#cpb_cont .list-row',function(e){
	var self = $(this);
	if($(this).find('.optionsTop').is(':hidden')) {
		setTimeout(function() {
			if ($("#cpb_cont li:hover").attr('id') == self.attr('id')) {
				self.find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeIn("fast");
				self.find('.coverPlayImg').fadeIn('fast');
			}
		},100);
	}
});

$(doc).off('mouseleave','#cpb_cont .list-row');
$(doc).on('mouseleave','#cpb_cont .list-row',function(e){
	if($(this).find('.optionsTop').is(':visible')) {
		$(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
		$(this).find('.coverPlayImg').fadeOut("fast");
	}
});

$(doc).off('click','.preload_cpbPlay_torrent');
$(doc).on('click','.preload_cpbPlay_torrent',function(e){
	e.preventDefault();
	cpb.gui.saveTorrent = false;
  cpb.gui.torrentSaved = false;
	cpb.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	var link = obj.link;
	var id = obj.id;
	saveTorrent = false;
	var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;'+obj.background+'"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>'+obj.title+'</h3><br><img style="width:180;height:240px;" src="'+obj.cover+'" /><br><br> \
	<button type="button" id="cpb_play_'+id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" class="closePopup play_cpb_torrent btn btn-success"> \
    	<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span> \
    </button>  \
    <button type="button" class="closePopup download_cpb_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="cpb_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'">  \
    	<span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span>  \
    	</span>  \
    </button>';

	if(cpb.gui.freeboxAvailable) {
		html += '<button type="button"  href="'+obj.torrent+'" class="closePopup download_cpb_torrentFile_fbx downloadText btn btn-info" id="cpb_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>';
	}
	html += '<br/><br/><div><label>'+_("Keep torrent file after downloading ?")+'</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
	// show
	cpb.gui.showPopup(html,'body')
});

$(doc).off('click','.play_cpb_torrent');
$(doc).on('click','.play_cpb_torrent',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	cpb.gui.getTorrent(obj.torrent,obj.cover);
	cpb.gui.itemTitle = obj.title;
	$('#playerToggle')[0].click();
});

$(doc).off('click','.download_cpb_torrentFile');
$(doc).on('click','.download_cpb_torrentFile',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	cpb.gui.getAuthTorrent(obj.torrent,false,false);
});

$(doc).off('click','.download_cpb_torrentFile_fbx');
$(doc).on('click','.download_cpb_torrentFile_fbx',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	cpb.gui.getAuthTorrent(obj.torrent,false,true);
});

$(doc).off('click','.addToFavorites');
$(doc).on('click','.addToFavorites',function(e){
	e.preventDefault();
	$(this).removeClass('addToFavorites');
	$(this).attr('title',_("Already in your favorites"));
	$(this).find('i').css('color','#F8963F');
	var title = $(this).attr("data");
	$('#favoritesToggle')[0].click()
	cpb.gui.addSerieToDb(title);
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
		cpb.console.log('Loading cpasbien engine with locale' + cpb.gui.settings.locale);
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
cpb.orderBy_filters = JSON.parse('{"'+_("Date")+'":"date","'+_("Title")+'":"titre"}');
cpb.defaultOrderBy = 'date';
// orderBy filters and default entry
cpb.category_filters = JSON.parse('{"'+_("Movies")+'":"accueil","'+_("Movies exclus")+'":"films/films-exclus","'+_("Movies Bluray 1080p")+'":"films/bluray-1080p","'+_("Movies Bluray 720p")+'":"films/bluray-720p","'+_("Movies HDlight 1080p")+'":"films/hdlight-1080p","'+_("Movies HDlight 720p")+'":"films/hdlight-720p","'+_("Movies Dvdrip/Bdrip")+'":"films/dvdrip-bdrip","'+_("Movies Dvdrip MKV")+'":"films/dvdrip-mkv","'+_("Movies Dvdscr/R5/TS/CAM")+'":"films/dvdscr-r5-ts-cam","'+_("Movies VO")+'":"films/films-vo","'+_("Series")+'":"series","'+_("Series FRENCH")+'":"series/series-vf","'+_("Series VOSTFR")+'":"series/series-vostfr"}');
cpb.defaultCategory = 'accueil';
// others params
cpb.has_related = false;
cpb.categoriesLoaded = true;
}

// search videos
cpb.search = function (query, options,gui) {
	$("#search_results p").empty()
	if(options.searchType === "navigation" && !options.category) {
		return;
	}
	cpb.pageLoading = true;
	//cpb.gui = gui;
	var page;
	try {
		page = parseInt(options.currentPage);
	} catch(err) {
		page = 1;
		cpb.gui.current_page = 1;
	}
	if(page == 1 && $('#cpb_cont').length == 0) {
		$('#items_container').empty().append('<ul id="cpb_cont" class="list"></ul>').show();
		cpb.itemsCount = 0;
	} else {
		page +=1
	}
	cpb.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	cpb.currentPage = cpb.gui.current_page;

	var url;
	var videos = {};

	cpb.console.log(options)

try {
	if(options.searchType === "search") {
		var from =0
		var p = page-1
		if(p == 1) {
			from = 0
		} else {
			from = 16*p-15;
		}
		cpb.console.log('http://www.cpasbien.cx/index.php?do=search&subaction=search&search_start='+p+'&full_search=0&result_from='+from+'&story='+query)
		$.get('http://www.cpasbien.cx/index.php?do=search&subaction=search&search_start='+p+'&full_search=0&result_from='+from+'&story='+query,function(res) {
			parseReply(res,options)
		})
	} else {
		if(options.category == "accueil") {
			url='http://www.cpasbien.cx'+'/page/'+page;
			cpb.console.log(options, url)
		} else {
			url='http://www.cpasbien.cx/'+options.category+'/page/'+page;
		}
	}
} catch(err) {
	cpb.console.log(err)
}

	cpb.console.log(url)
	$.get(url,function(data) {
		parseReply(data,options)
	});
}

function parseReply(data,options) {
	var list=$('.short-film',data).get();
	cpb.itemsCount += list.length;
	try {
		if(options.searchType == "search") {
			cpb.totalItems = parseInt($('.basecont',data).text().trim().match(/\d{1,4}/)[0])
		}
	} catch(err) {
		console.log(err)
	}

	if(cpb.itemsCount == 0) {
		$('#loading').hide();
		$("#search_results p").empty().append(_("No results found..."));
		$("#search").show();
		$("#pagination").hide();
		cpb.pageLoading = false;
		return;
	}

	var pagesCount  = parseInt($('.navigation',data).find('a:last').text());
	if(isNaN(pagesCount) && cpb.itemsCount == 0) {
			$('#loading').hide();
			$("#search_results p").empty().append(_("No results found..."));
			$("#search").show();
			$("#pagination").hide();
			cpb.pageLoading = false;
			return;
	} else if (cpb.itemsCount < 16){
		if(options.searchType == "navigation") {
			cpb.totalItems = cpb.itemsCount;
		}
	} else {
		if(options.searchType == "navigation") {
			cpb.totalItems = pagesCount * 16;
		}
	}
	cpb.console.log(cpb.totalItems)
	analyseResults(list);
}

function analyseResults(list) {
	var arr = []
	var favMainList = cpb.gui.sdb.find();
	var favList = [];
	Iterator.iterate(favMainList).forEach(function (item,index) {
		if(item.hasOwnProperty('serieName')) {
			favList.push(item);
		}
	});
	Iterator.iterate(list).forEach(function (item,index) {
		var video = {};
		video.link = $(item).find('a')[0].href;
		video.title = $(item).find('a')[1].innerHTML;
		video.quality = video.title.match(/720|1080/) !== null ? 'glyphicon-hd-video' : 'glyphicon-sd-video';
		video.hd = video.title.match(/720/) !== null ? '720p' : video.title.match(/1080/) !== null ? '1080p' : '';
		var c = checkDb(video);
		var l = c.next().value.length;
		video.css = l > 0 ? 'color:red;float: left;margin-top: 1px;display:block' : 'display:none;';
		video.viewedTitle = l > 0 ? _("Already watched") : '';
		video.isSerie = video.title.toLowerCase().match(/(.*)(s\d{1,3}e\d{1,3}|s\d{1,3}|saison \d{1,3})/) !== null ? true : false;
		video.isFavorite = false;
		video.favId = null;
    if(video.isSerie) {
        	video.serieName = video.title.toLowerCase().match(/(.*)(s\d{1,3}|saison \d{1,3})/)[1].replace(/\(.*\)/,'').replace('-','').trim();
			Iterator.iterate(favList).forEach(function (item,index) {
				var re = new RegExp(item.query, 'g');
				var re2 = new RegExp(item.serieName, 'g');
				if(item.serieName == video.serieName || video.serieName == item.query || video.serieName.match(re) || video.serieName.match(re2)) {
					video.isFavorite = true;
					video.favId = item.id;
				}
			});
			if(video.isFavorite) {
				video.background = 'background: url('+cpb.gui.confDir+'/images/'+video.favId+'-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box';
				video.toggle = '<span style="float:right;"><a href="#" data=""><i class="glyphicon glyphicon-star" style="color:#F8963F" title="'+_('Already in your favorites')+'"></i></span></a>';
			} else {
				video.background = '';
				video.toggle = '<span style="float:right;"><a href="#" style="cursor:pointer;" class="addToFavorites" data="'+video.serieName+'" title="'+_('Add to favorites')+'"><i class="glyphicon glyphicon-star"></i></span></a>';
			}
			appendVideo(video);
		} else {
			video.toggle = '';
			appendVideo(video);
		}
	});
	$('#loading').hide();
	$('#search_results p').empty()
	$('#search').show();
	var type = category !== 'series' ? 'movies' : 'chapters';
	var ctype = _(type)
	if(isNaN(cpb.totalItems)) {
		cpb.pageLoading = false;
		return;
	}
	if(searchType === 'navigation') {
		$('#search_results p').empty().append(_("%s availables %s", cpb.totalItems,ctype)).show();
	} else {
		$('#search_results p').empty().append(_("%s results founds", cpb.totalItems)).show();
	}
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
		if(video.title.length > 45){
			text = video.title.substring(0,45)+'...';
		} else {
			text = video.title;
		}
		var html = '<li id="'+video.id+'" class="list-row"> \
		<span class="optionsTop" style="display:none;"></span> \
		<div id="optionsTopInfos" style="display:none;"> \
		<span style="'+video.css+'" title="'+video.viewedTitle+'"><i class="glyphicon glyphicon-eye-open"></i></span> \
		</div> \
		<div class="mvthumb"> \
		<img class="cpbthumb" style="float:left;" /> \
		</div> \
		<div> \
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg preload_cpbPlay_torrent" style="display:none;" data="" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
			<span><i class="glyphicon '+video.quality+'"></i>'+video.hd+'</span> \
			<span style="float:right;"><a href="#" class="preload_cpb_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
			'+video.toggle+' \
		</div> \
		<div> \
			<p class="coverInfosTitle" title="'+video.title+'">'+text+'</p> \
		</div> \
		</li>';
		$("#cpb_cont").append(html);
		$.get(video.link,function(res) {
			var img = $(".img-poster img",res).attr('src');
			$('#'+video.id+' .cpbthumb').attr('src',img);
			//store img
			video.cover = img;
			//store description and torrent link
			video.torrent = $(".fstory-video-block a",res).attr('href');
			video.synopsis = $('.description span',res).text();
			//save in data
			$('#'+video.id+' .preload_cpb_torrent').attr('data',encodeURIComponent(JSON.stringify(video)));
			$('#'+video.id+' .coverPlayImg').attr('data',encodeURIComponent(JSON.stringify(video)));

			if($('#items_container .cpbthumb:visible').length === cpb.itemsCount) {
				cpb.pageLoading = false;
				cpb.gui.updateScroller();
			}
		});
}

cpb.loadMore = function() {
	$('#search_results p').empty()
	cpb.pageLoading = true;
	cpb.gui.changePage();
}

cpb.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		cpb.console.log("end of playlist reached");
		try {
			cpb.gui.changePage();
		} catch(err) {
			cpb.console.log('no more videos to play');
		}
	}
}

cpb.search_type_changed = function() {
	cpb.gui.current_page = 1;
	if(cpb.pageLoading) {
		if (searchType === 'navigation') {
			$('#video_search_query').prop('disabled', true);
		} else {
			$('#video_search_query').prop('disabled', false);
		}
		return;
	}
	$('#items_container').empty();
	searchType = $("#searchTypes_select a.active").attr("data-value");
	category = $("#categories_select a.active").attr("data-value");
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
