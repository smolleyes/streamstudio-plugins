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

$(ht5.document).off('mouseenter','#cpb_cont .list-row');
$(ht5.document).on('mouseenter','#cpb_cont .list-row',function(e){
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

$(ht5.document).off('mouseleave','#cpb_cont .list-row');
$(ht5.document).on('mouseleave','#cpb_cont .list-row',function(e){
	if($(this).find('.optionsTop').is(':visible')) {
		$(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
		$(this).find('.coverPlayImg').fadeOut("fast");
	}
});

$(ht5.document).off('click','.preload_cpbPlay_torrent');
$(ht5.document).on('click','.preload_cpbPlay_torrent',function(e){
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

$(ht5.document).off('click','.play_cpb_torrent');
$(ht5.document).on('click','.play_cpb_torrent',function(e){
	e.preventDefault();
	var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	cpb.gui.getTorrent(obj.torrent,obj.cover);
	cpb.gui.itemTitle = obj.title;
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

$(ht5.document).off('click','.addToFavorites');
$(ht5.document).on('click','.addToFavorites',function(e){
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
cpb.orderBy_filters = JSON.parse('{"'+_("Date descending")+'":"date_desc","'+_("Date ascending")+'":"date_asc","'+_("Seeds")+'":"seeds"}');
cpb.defaultOrderBy = 'date_desc';
// orderBy filters and default entry
cpb.category_filters = JSON.parse('{"'+_("Movies")+'":"films","'+_("Series")+'":"series"}');
cpb.defaultCategory = 'films';
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
	cpb.gui = gui;
	cpb.pageLoading = true;
	var page;
	try {
		page = parseInt(options.currentPage) - 1;
	} catch(err) {
		page = 0;
		cpb.gui.current_page = 0;
	}
	if(page == 0) {
		$('#items_container').empty().append('<ul id="cpb_cont" class="list"></ul>').show();
		cpb.itemsCount = 0;
	}
	cpb.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	cpb.currentPage = cpb.gui.current_page;

	var query = query.replace(/ /g,'-');
	var url;
	var videos = {};

	if(options.searchType === "search") {
		if(options.orderBy ==="date_asc") {
			url='http://www.cpasbien.cm/recherche/'+query+'/page-'+page+',trie-date-a';
		} else if(options.orderBy ==="date_desc") {
			url='http://www.cpasbien.cm/recherche/'+query+'/page-'+page+',trie-date-d';
		} else {
			url='http://www.cpasbien.cm/recherche/'+query+'/page-'+page+',trie-'+options.orderBy+'-d';
		}
	} else {
		url='http://www.cpasbien.cm/view_cat.php?categorie='+options.category+'&page='+page;
	}

	console.log(url)
	$.get(url,function(data) {
		var list=$('.ligne0,.ligne1',data).get();
		cpb.itemsCount += list.length;

		if(cpb.itemsCount == 0) {
			$('#loading').hide();
			$("#search_results p").empty().append(_("No results found..."));
			$("#search").show();
			$("#pagination").hide();
			cpb.pageLoading = false;
			return;
		}

		var pagesCount  = parseInt($('#pagination',data).find('a:last').prev().text());
		if(isNaN(pagesCount) && cpb.itemsCount == 0) {
				$('#loading').hide();
				$("#search_results p").empty().append(_("No results found..."));
				$("#search").show();
				$("#pagination").hide();
				cpb.pageLoading = false;
				return;
		} else if (cpb.itemsCount < 30){
				cpb.totalItems = cpb.itemsCount;
		} else {
				cpb.totalItems = pagesCount * 30;
		}
		console.log(cpb.totalItems)
		analyseResults(list);
	});
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
		video.title = $(item).find('a')[0].innerHTML;
		video.quality = video.title.match(/720|1080/) !== null ? 'glyphicon-hd-video' : 'glyphicon-sd-video';
		video.hd = video.title.match(/720/) !== null ? '720p' : video.title.match(/1080/) !== null ? '1080p' : '';
		video.size = $(item).find('.poid').text();
		video.seeders = $(item).find('.up').text();
		video.leechers = $(item).find('.down').text();
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
		<span><i class="glyphicon glyphicon-cloud-upload"></i>'+video.seeders+'</span> \
		<span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>'+video.size+'</span> \
		</div> \
		<div class="mvthumb"> \
		<img class="cpbthumb" style="float:left;" /> \
		</div> \
		<div> \
			<img class="coverPlayImg preload_cpbPlay_torrent" style="display:none;" data="" /> \
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
			var img = $("#bigcover img",res).attr('src');
			$('#'+video.id+' .cpbthumb').attr('src',img);
			//store img
			video.cover = img;
			//store description and torrent link
			video.torrent = 'http://www.cpasbien.cm'+$("a#telecharger",res).attr('href');
			video.synopsis = $('#textefiche p',res).last().text();
			//save in data
			$('#'+video.id+' .preload_cpb_torrent').attr('data',encodeURIComponent(JSON.stringify(video)));
			$('#'+video.id+' .coverPlayImg').attr('data',encodeURIComponent(JSON.stringify(video)));

			if($('#items_container .cpbthumb:visible').length === cpb.itemsCount) {
				cpb.pageLoading = false;
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
	if(cpb.pageLoading) {
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
