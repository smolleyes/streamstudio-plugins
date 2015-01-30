/********************* engine config *************************
 **************************************************************/
var tna = {};
tna.engine_name = 'Tnaflix';
tna.type = "video";
tna.totalPages = 0;
tna.currentPage = 0;
tna.itemsCount = 0;
tna.pageLoading = false;
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
tna.init = function(gui, ht5) {
	$('#pagination').hide();
	tna.gui = ht5;
	loadEngine();
	//play videos
	$(ht5.document).off('click', '.preload_tna_torrent');
	$(ht5.document).on('click', '.preload_tna_torrent', function(e) {
		e.preventDefault();
		var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
		var link = obj.config;
		var id = obj.id;
		$('.highlight').removeClass('highlight well');
		$(this).closest('li').addClass('highlight well');
		$.get(link,function(res){
			var list = $('quality>item',res).map(function(i){
				var r = $(this)[0].textContent.split('//');
				var res = r[0].trim();
				var link = 'https://'+r[1].trim();
				$('#tnaPlayContainer_'+obj.id).append('<a href="'+link+'" data-title="'+obj.title+'" class="twitchQualityLink playTnaVideo">'+res+' </a>');
				$('#tnaDownloadContainer_'+obj.id).append('<a href="'+link+'" data-title="'+obj.title+'" data-id="'+obj.id+'" class="twitchQualityLink downloadTnaVideo">'+res+' </a>');
			});
		});
	});
	$(ht5.document).off('click', '.playTnaVideo');
	$(ht5.document).on('click', '.playTnaVideo', function(e) {
		e.preventDefault();
		var vid = {};
		vid.link = $(this).attr('href');
		vid.title = $(this).attr('data-title');
		tna.gui.startPlay(vid);
	});
	$(ht5.document).off('click', '.downloadTnaVideo');
	$(ht5.document).on('click', '.downloadTnaVideo', function(e) {
		e.preventDefault();
		var link = $(this).attr('href');
		var title = $(this).attr('data-title')+'.mp4';
		var id = $(this).attr('data-id');
		tna.gui.downloadFileHttps(link, title, id, false);
	});
	$(ht5.document).off('click', '.download_tna_torrentFile_fbx');
	$(ht5.document).on('click', '.download_tna_torrentFile_fbx', function(e) {
		e.preventDefault();
		var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
		tna.gui.getAuthTorrent(obj.torrent, false, true);
	});
}

function loadEngine() {
		/********************* Configure locales *********************/
		var localeList = ['en', 'fr'];
		i18n.configure({
			defaultLocale: 'en',
			locales: localeList,
			directory: tna.gui.pluginsDir + 'tnaflix/locales',
			updateFiles: true
		});
		if ($.inArray(tna.gui.settings.locale, localeList) > -1) {
			console.log('Loading tnaflix engine with locale' + tna.gui.settings.locale);
			i18n.setLocale(tna.gui.settings.locale);
		} else {
			i18n.setLocale('en');
		}
		// menus needed by the module and menu(s) loaded by default
		tna.menuEntries = ["searchTypes", "orderBy", "categories"];
		tna.defaultMenus = ["searchTypes", "orderBy"];
		// searchTypes menus and default entry
		tna.searchTypes = JSON.parse('{"' + _("Search") + '":"search","' + _("Categories") + '":"categories"}');
		tna.defaultSearchType = 'search';
		// orderBy filters and default entry
		tna.orderBy_filters = JSON.parse('{"' + _("Date") + '":"date","' + _("Rate") + '":"rate","' + _("Relevance") + '":"relevance"}');
		tna.defaultOrderBy = 'date';
		// orderBy filters and default entry
		tna.category_filters = JSON.parse('{"' + _("Movies") + '":"films","' + _("Series") + '":"series"}');
		tna.defaultCategory = 'films';
		// others params
		tna.has_related = false;
		tna.categoriesLoaded = true;
	}
	// search videos
tna.search = function(query, options, gui) {
	tna.gui = gui;
	tna.pageLoading = true;
	var page;
	if(options.currentPage == 0) {
		options.currentPage += 1;
	}
	page = options.currentPage;
	if (page == 1) {
		$('#items_container').empty().append('<ul id="tna_cont" class="list" style="margin:0;"></ul>').show();
		tna.itemsCount = 0;
	}
	tna.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	tna.currentPage = tna.gui.current_page;
	var query = query.replace(/ /g, '-');
	var url;
	var videos = {};
	if (options.searchType === "search") {
		url = 'https://alpha.tnaflix.com/search.php?page='+page+'&what=' + query + '&category=&sb=' + options.orderBy + '&su=anytime&sd=all&dir=desc';
	} else {
		url = 'http://www.cpasbien.pw/view_cat.php?categorie=' + options.category + '&page=' + page + '';
	}
	console.log(url)
	$.when($.ajax(url)).then(function(data, textStatus, jqXHR) {
		var list = [];
		var mlist = $('.thumbsList.clear.found-items li', data);
		mlist.map(function(i) {
			list.push({
				"attributes": $(this)[0].attributes,
				"img": $(this)[0].children[0].children[0].attributes[2].nodeValue
			})
			if (list.length == mlist.length) {
				if (list.length === 0) {
					$('#loading').hide();
					$("#search_results p").empty().append(_("No results found..."));
					$("#search").show();
					$("#pagination").hide();
					return;
				}
				// add new items to total items count for lazy loading
				tna.itemsCount += list.length;
				tna.totalPages = 6000
				tna.totalItems = 100000;
				analyseResults(list);
			}
		})
	});
}

function analyseResults(list) {
	var arr = []
	Iterator.iterate(list).forEach(function(item, index) {
		var video = {};
		video.vid = item.attributes[0].value;
		video.nkey = item.attributes[1].value
		video.vkey = item.attributes[2].value
		video.config = 'https://alpha.tnaflix.com/_config.php?vid=' + video.vid + '&nkey=' + video.nkey + '&vkey=' + video.vkey + '&thumb=8';
		video.title = item.attributes[6].value;
		video.thumb = 'https://' + item.img;
		appendVideo(video);
	});
	$('#loading').hide();
	$('#search_results p').empty().append(_("%s results in the list", tna.itemsCount)).show();
	$('#search').show();
}

function wait(video, place) {
	setTimeout(function() {
		if ($("#tna_cont ul li").length + 1 !== place) {
			wait(video, place)
		} else {
			appendVideo(video);
		}
	}, 100);
}

function* checkDb(video) {
	try {
		yield tna.gui.sdb.find({
			"title": video.title
		});
	} catch (err) {
		return err;
	}
}

function appendVideo(video) {
	var res = video.html;
	video.id = ((Math.random() * 1e6) | 0);
	var html = '<li id="' + video.id + '" class="list-row" style="margin:0;padding:0;"> \
		<div class="mvthumb"> \
			<img src="' + video.thumb + '" style="float:left;width:100px;height:125px;" /> \
		</div> \
		<div style="margin: 0 0 0 105px;"> \
			<a href="#" class="preload_tna_torrent item-title" data="' + encodeURIComponent(JSON.stringify(video)) + '">' + video.title + '</a> \
		</div>  \
		<div class="item-info"> \
			<span style="margin-left:5px;"><b>'+_("Play: ")+'</span><div id="tnaPlayContainer_'+video.id+'" style="margin-left:105px;"></div> \
		</div> \
		<div class="item-info"> \
			<span style="margin-left:5px;"><b>'+_("Download: ")+'</span><div id="tnaDownloadContainer_'+video.id+'" style="margin-left:105px;"></div> \
		</div> \
	</li>';
	$("#tna_cont").append(html);
	$.get(video.link, function(res) {
		var img = $("#bigcover img", res).attr('src');
		$('#' + video.id + ' img').attr('src', img)
	});
	if ($('#items_container ul li').length === tna.itemsCount) {
		tna.pageLoading = false;
	}
}
tna.loadMore = function() {
	tna.pageLoading = true;
	tna.gui.changePage();
}
tna.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch (err) {
		console.log("end of playlist reached");
		try {
			tna.gui.changePage();
		} catch (err) {
			console.log('no more videos to play');
		}
	}
}
tna.search_type_changed = function() {
	tna.gui.current_page = 1;
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
module.exports = tna;