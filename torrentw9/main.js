/********************* engine config *************************
**************************************************************/

var tw9 = {};
tw9.engine_name = 'Torrent9';
tw9.type="video";
tw9.totalPages = 0;
tw9.currentPage = 0;
tw9.itemsCount = 0;
tw9.pageLoading = false;
tw9.protected = true;
tw9.url = "http://www.torrent9.pe"
tw9.initialized = false;
tw9.Win = null;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var os = require('os');
var i18n = require("i18n");
var fs = require('fs');
var _ = i18n.__;
var Iterator = require('iterator').Iterator;
var cloudscraper = require('cloudscraper');

/****************************/

// module global vars
var searchType = 'navigation';

// init module
tw9.init = function(gui,win,doc,console) {
	$('#pagination',doc).hide();
  	$=win.$
	tw9.gui = win;
	tw9.mainWin = gui;
	if(!tw9.initialized) {
		tw9.Win = tw9.mainWin.Window
		tw9.Win.open('http://www.torrent9.pe', {show:false},function(win) {
			win.on('loaded',function() {
				$("#searchTypes_select [data-value='navigation']",doc).addClass('active').click();
				tw9.initialized = true;
				win.close()
			});
		})
	}
	loadEngine()
    //play videos
    $(doc).off('click','.preload_tw9_torrent');
    $(doc).on('click','.preload_tw9_torrent',function(e){
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
		tw9.gui.showPopup(html,'body');
});

$(doc).off('mouseenter','#tw9_cont .list-row');
$(doc).on('mouseenter','#tw9_cont .list-row',function(e){
	var self = $(this);
	if($(this).find('.optionsTop').is(':hidden')) {
		setTimeout(function() {
			if ($("#tw9_cont li:hover").attr('id') == self.attr('id')) {
				self.find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeIn("fast");
				self.find('.coverPlayImg').fadeIn('fast');
			}
		},100);
	}
});

$(doc).off('mouseleave','#tw9_cont .list-row');
$(doc).on('mouseleave','#tw9_cont .list-row',function(e){
	if($(this).find('.optionsTop').is(':visible')) {
		$(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
		$(this).find('.coverPlayImg').fadeOut("fast");
	}
});

$(doc).off('click','.preload_tw9Play_torrent');
$(doc).on('click','.preload_tw9Play_torrent',function(e){
	e.preventDefault();
	tw9.gui.saveTorrent = false;
  tw9.gui.torrentSaved = false;
	tw9.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	var link = obj.link;
	var id = obj.id;
	saveTorrent = false;
	var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;'+obj.background+'"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>'+obj.title+'</h3><br><img style="width:180;height:240px;" src="'+obj.cover+'" /><br><br> \
	<button type="button" id="tw9_play_'+id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" class="closePopup play_tw9_torrent btn btn-success"> \
    	<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span> \
    </button>  \
    <button type="button" class="closePopup download_tw9_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="tw9_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'">  \
    	<span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span>  \
    	</span>  \
    </button>';

	if(tw9.gui.freeboxAvailable) {
		html += '<button type="button"  href="'+obj.torrent+'" class="closePopup download_tw9_torrentFile_fbx downloadText btn btn-info" id="tw9_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>';
	}
	html += '<br/><br/><div><label>'+_("Keep torrent file after downloading ?")+'</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
	// show
	tw9.gui.showPopup(html,'body')
});

$(doc).off('click','.play_tw9_torrent');
$(doc).on('click','.play_tw9_torrent',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	tw9.gui.getAuthTorrent(obj.torrent,true,false);
	tw9.gui.itemTitle = obj.title;
	$('#playerToggle')[0].click();
});

$(doc).off('click','.download_tw9_torrentFile');
$(doc).on('click','.download_tw9_torrentFile',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	tw9.gui.getAuthTorrent(obj.torrent,false,false);
});

$(doc).off('click','.download_tw9_torrentFile_fbx');
$(doc).on('click','.download_tw9_torrentFile_fbx',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	tw9.gui.getAuthTorrent(obj.torrent,false,true);
});

$(doc).off('click','.addToFavorites');
$(doc).on('click','.addToFavorites',function(e){
	e.preventDefault();
	$(this).removeClass('addToFavorites');
	$(this).attr('title',_("Already in your favorites"));
	$(this).find('i').css('color','#F8963F');
	var title = $(this).attr("data");
	$('#favoritesToggle')[0].click()
	tw9.gui.addSerieToDb(title);
});

}

function loadEngine() {
	/********************* Configure locales *********************/
	var localeList = ['en', 'fr'];
	i18n.configure({
		defaultLocale: 'en',
		locales:localeList,
		directory: tw9.gui.pluginsDir + 'torrentw9/locales',
		updateFiles: true
	});

	if ($.inArray(tw9.gui.settings.locale, localeList) >-1) {
		console.log('Loading torrentw9 engine with locale' + tw9.gui.settings.locale);
		i18n.setLocale(tw9.gui.settings.locale);
	} else {
		i18n.setLocale('en');
	}

// menus needed by the module and menu(s) loaded by default
tw9.menuEntries = ["searchTypes","orderBy","categories"];
tw9.defaultMenus = ["searchTypes","orderBy"];
// searchTypes menus and default entry
tw9.searchTypes = JSON.parse('{"'+_("Search")+'":"search","'+_("Navigation")+'":"navigation"}');
tw9.defaultSearchType = '';
// orderBy filters and default entry
tw9.orderBy_filters = JSON.parse('{"'+_("Date descending")+'":"trie-date-d","'+_("Date ascending")+'":"trie-date-a","'+_("Seeds descending")+'":"trie-seeds-d","'+_("Seeds ascending")+'":"trie-seeds-a"}');
tw9.defaultOrderBy = 'trie-date-d';
// orderBy filters and default entry
tw9.category_filters = JSON.parse('{"'+_("Movies")+'":"films","'+_("Movies DVDRIP")+'":"films DVDRIP (.avi)","'+_("Movies DVDRIP (x264)")+'":"films DVDRIP (x264)","'+_("Movies 1080p")+'":"films 1080p","'+_("Movies 720p")+'":"films 720p","'+_("Movies VOSTFR")+'":"films VOSTFR","'+_("Series")+'":"series","'+_("Series FRENCH")+'":"series FRENCH","'+_("Series VOSTFR")+'":"series VOSTFR"}');
tw9.defaultCategory = 'films';
// others params
tw9.has_related = false;
tw9.categoriesLoaded = true;
}

// search videos
tw9.search = function (query, options,gui) {
	$("#search_results p").empty()
	if(options.searchType === "navigation" && !options.category) {
		return;
	}
	tw9.gui = gui;
	tw9.pageLoading = true;
	var page;
	try {
		page = parseInt(options.currentPage) - 1;
	} catch(err) {
		page = 0;
		tw9.gui.current_page = 0;
	}
	if(page == 0) {
		$('#items_container').empty().append('<ul id="tw9_cont" class="list"></ul>').show();
		tw9.itemsCount = 0;
	}
	tw9.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	tw9.currentPage = tw9.gui.current_page;

	var query = query.replace(/ /g,'+');
	var url;
	var videos = {};

	if(options.searchType === "search") {
		url='http://www.torrent9.pe/search_torrent/'+query;
		url+='/page-'+page+','+options.orderBy;
	} else {
		var baseUrl = "http://www.torrent9.pe"
		var url = ""
		if(options.category == "films") {
			url = baseUrl+"/torrents_films.html"
		} else if(options.category == "films DVDRIP (.avi)") {
			url = baseUrl+"/torrents_films_dvdrip-avi.html"
		} else if(options.category == "films DVDRIP (x264)") {
			url = baseUrl+"/torrents_films_dvdrip-x264.html"
		} else if(options.category == "films 1080p") {
			url = baseUrl+"/torrents_films_1080p.html"
		} else if(options.category == "films 720p") {
			url = baseUrl+"/torrents_films_720p.html"
		} else if(options.category == "films VOSTFR") {
			url = baseUrl+"/torrents_films_vostfr.html"
		}  else if(options.category == "series") {
			url = baseUrl+"/torrents_series.html"
		}  else if(options.category == "series FRENCH") {
			url = baseUrl+"/torrents_series_french.html"
		}  else if(options.category == "series VOSTFR") {
			url = baseUrl+"/torrents_series_vostfr.html"
		}
		url+=',page-'+page+'&'+options.orderBy;
	}

	cloudscraper.get(url, function(error, response, data) {
		if (error) {
			console.log('Error occurred');
		} else {
		var list=$('.cust-table tr',data).get().slice(1)
		tw9.itemsCount += list.length;

		if(tw9.itemsCount == 0) {
			$('#loading').hide();
			$("#search_results p").empty().append(_("No results found..."));
			$("#search").show();
			$("#pagination").hide();
			tw9.pageLoading = false;
			return;
		}

		var pagesCount  = $('ul.pagination li',data).length
		if(isNaN(pagesCount) && tw9.itemsCount == 0) {
				$('#loading').hide();
				$("#search_results p").empty().append(_("No results found..."));
				$("#search").show();
				$("#pagination").hide();
				tw9.pageLoading = false;
				return;
		} else if (tw9.itemsCount < 60){
				tw9.totalItems = tw9.itemsCount;
		} else {
				tw9.totalItems = pagesCount * 60;
		}
		console.log(tw9.totalItems)
		analyseResults(list);
		}
	});
}

function analyseResults(list) {
	var arr = []
	var favMainList = tw9.gui.sdb.find();
	var favList = [];
	try {
		Iterator.iterate(favMainList).forEach(function (item,index) {
			if(item.hasOwnProperty('serieName')) {
				favList.push(item);
			}
		});
		Iterator.iterate(list).forEach(function (item,index) {
			var video = {};
			video.link = 'http://www.torrent9.pe'+$(item).find('a')[0].href.replace(/.*?torrent/,'/torrent')
			video.title = $($(item).find('a')[0]).text();
			video.quality = video.title.match(/720|1080/) !== null ? 'glyphicon-hd-video' : 'glyphicon-sd-video';
			video.hd = video.title.match(/720/) !== null ? '720p' : video.title.match(/1080/) !== null ? '1080p' : '';
			video.size = $($(item).find('td')[1]).text();
			video.seeders = $($(item).find('td')[2]).text();
			video.leechers = $($(item).find('td')[3]).text();
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
					if(item.serieName == video.serieName || video.serieName == item.query || video.serieName.match(re) || video.serieName.match(re2)) {
						video.isFavorite = true;
						video.favId = item.id;
					}
				});
				if(video.isFavorite) {
					video.background = 'background: url('+tw9.gui.confDir+'/images/'+video.favId+'-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box';
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
	} catch(err) {
		console.log(err)
	}
	$('#loading').hide();
	$('#search_results p').empty()
	$('#search').show();
	var type = category !== 'series' ? 'movies' : 'chapters';
	var ctype = _(type)
	if(isNaN(tw9.totalItems)) {
		tw9.pageLoading = false;
		return;
	}
	if(searchType === 'navigation') {
		$('#search_results p').empty().append(_("%s availables %s", tw9.totalItems,ctype)).show();
	} else {
		$('#search_results p').empty().append(_("%s results founds", tw9.totalItems)).show();
	}
}

function* checkDb(video) {
	try {
		yield tw9.gui.sdb.find({"title":video.title});
	} catch(err) {
		return err;
	}
}

function appendVideo(video) {
	    var res = video.html
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
		<span><i class="glyphicon glyphicon-cloud-upload"></i>'+video.seeders+'</span> \
		<span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>'+video.size+'</span> \
		</div> \
		<div class="mvthumb"> \
		<img class="tw9thumb" style="float:left;" /> \
		</div> \
		<div> \
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg preload_tw9Play_torrent" style="display:none;" data="" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
			<span><i class="glyphicon '+video.quality+'"></i>'+video.hd+'</span> \
			<span style="float:right;"><a href="#" class="preload_tw9_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
			'+video.toggle+' \
		</div> \
		<div> \
			<p class="coverInfosTitle" title="'+video.title+'">'+text+'</p> \
		</div> \
		</li>';
		$("#tw9_cont").append(html);
		cloudscraper.get(video.link, function(error, response, res) {
			var img = $(".movie-img img",res).attr('src');
			$('#'+video.id+' .tw9thumb').attr('src',img);
			//store img
			video.cover = img;
			//store description and torrent link
			video.torrent = 'http://www.torrent9.pe'+$($('.download-btn a',res)[0]).attr('href')
			var r = $('.movie-information',res)
			r.find('strong').remove()
			video.synopsis = r.find('p').text()
			//save in data
			$('#'+video.id+' .preload_tw9_torrent').attr('data',encodeURIComponent(JSON.stringify(video)));
			$('#'+video.id+' .coverPlayImg').attr('data',encodeURIComponent(JSON.stringify(video)));

			if($('#items_container .tw9thumb:visible').length === tw9.itemsCount) {
				tw9.pageLoading = false;
				tw9.gui.updateScroller();
			}
		});
}

tw9.loadMore = function() {
	$('#search_results p').empty()
	tw9.pageLoading = true;
	tw9.gui.changePage();
}

tw9.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			tw9.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

tw9.search_type_changed = function() {
	if(tw9.pageLoading) {
		if (searchType === 'navigation') {
			$('#video_search_query').prop('disabled', true);
		} else {
			$('#video_search_query').prop('disabled', false);
		}
		return;
	}
	tw9.gui.current_page = 1;
	$('#items_container').empty();
	searchType = $("#searchTypes_select a.active").attr("data-value");
	category = $("#categories_select a.active").attr("data-value");
	$('#search').hide();
	if (searchType === 'navigation') {
		$("#orderBy_select").show();
		$("#orderBy_label").show();
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

module.exports = tw9;
