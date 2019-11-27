/********************* engine config *************************
**************************************************************/

var oxtorrent = {};
oxtorrent.engine_name = 'oxtorrent';
oxtorrent.type = "video";
oxtorrent.totalPages = 0;
oxtorrent.currentPage = 0;
oxtorrent.itemsCount = 0;
oxtorrent.pageLoading = false;
oxtorrent.protected = true;
oxtorrent.url = "https://www.oxtorrent.com"
oxtorrent.initialized = true;
oxtorrent.Win = null;

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
oxtorrent.init = function(gui, win, doc, console) {
  $('#pagination', doc).hide();
  $ = win.$
  oxtorrent.gui = win;
  oxtorrent.mainWin = gui;
  loadEngine()
  //play videos
  $(doc).off('click', '.preload_oxtorrent_torrent');
  $(doc).on('click', '.preload_oxtorrent_torrent', function(e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    var link = obj.link;
    var id = obj.id;
    //$('.highlight').removeClass('highlight well');
    //$(this).closest('li').addClass('highlight well');
    var html = '<div id="fbxMsg_header"> \
			<h3>' + obj.title + '</h3> \
			</div> \
			<div id="fbxMsg_content" style="height:auto;"> \
				<img src="' + obj.cover + '" /> \
				<p style="margin-top:10px;font-weight:bold;">' + obj.synopsis + '</p> \
			</div>';
    oxtorrent.gui.showPopup(html, 'body');
  });

  $(doc).off('mouseenter', '#oxtorrent_cont .list-row');
  $(doc).on('mouseenter', '#oxtorrent_cont .list-row', function(e) {
    var self = $(this);
    if ($(this).find('.optionsTop').is(':hidden')) {
      setTimeout(function() {
        if ($("#oxtorrent_cont li:hover").attr('id') == self.attr('id')) {
          self.find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeIn("fast");
          self.find('.coverPlayImg').fadeIn('fast');
        }
      }, 100);
    }
  });

  $(doc).off('mouseleave', '#oxtorrent_cont .list-row');
  $(doc).on('mouseleave', '#oxtorrent_cont .list-row', function(e) {
    if ($(this).find('.optionsTop').is(':visible')) {
      $(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
      $(this).find('.coverPlayImg').fadeOut("fast");
    }
  });

  $(doc).off('click', '.preload_oxtorrentPlay_torrent');
  $(doc).on('click', '.preload_oxtorrentPlay_torrent', function(e) {
    e.preventDefault();
    oxtorrent.gui.saveTorrent = false;
    oxtorrent.gui.torrentSaved = false;
    oxtorrent.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    var link = obj.link;
    var id = obj.id;
    saveTorrent = false;
    var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;' + obj.background + '"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>' + obj.title + '</h3><br><img style="width:180;height:240px;" src="' + obj.cover + '" /><br><br> \
	<button type="button" id="oxtorrent_play_' + id + '" data="' + encodeURIComponent(JSON.stringify(obj)) + '" class="closePopup play_oxtorrent_torrent btn btn-success"> \
    	<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">' + _("Start playing") + '</span></span> \
    </button>  \
    <button type="button" class="closePopup download_oxtorrent_torrentFile downloadText btn btn-info" href="' + obj.torrent + '" id="oxtorrent_downlink_' + obj.id + '" data="' + encodeURIComponent(JSON.stringify(obj)) + '" title="' + _("Download") + '">  \
    	<span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">' + _("Download") + '</span>  \
    	</span>  \
    </button>';

    if (oxtorrent.gui.freeboxAvailable) {
      html += '<button type="button"  href="' + obj.torrent + '" class="closePopup download_oxtorrent_torrentFile_fbx downloadText btn btn-info" id="oxtorrent_downlinkFbx_' + obj.id + '" data="' + encodeURIComponent(JSON.stringify(obj)) + '" title="' + _("Download") + '"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">' + _("Télécharger avec freebox") + '</span></span></button>';
    }
    html += '<br/><br/><div><label>' + _("Keep torrent file after downloading ?") + '</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
    // show
    oxtorrent.gui.showPopup(html, 'body')
  });

  $(doc).off('click', '.play_oxtorrent_torrent');
  $(doc).on('click', '.play_oxtorrent_torrent', function(e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    oxtorrent.gui.getAuthTorrent(obj.torrent, true, false);
    oxtorrent.gui.itemTitle = obj.title;
    $('#playerToggle')[0].click();
  });

  $(doc).off('click', '.download_oxtorrent_torrentFile');
  $(doc).on('click', '.download_oxtorrent_torrentFile', function(e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    oxtorrent.gui.getAuthTorrent(obj.torrent, false, false);
  });

  $(doc).off('click', '.download_oxtorrent_torrentFile_fbx');
  $(doc).on('click', '.download_oxtorrent_torrentFile_fbx', function(e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    oxtorrent.gui.getAuthTorrent(obj.torrent, false, true);
  });

  $(doc).off('click', '.addToFavorites');
  $(doc).on('click', '.addToFavorites', function(e) {
    e.preventDefault();
    $(this).removeClass('addToFavorites');
    $(this).attr('title', _("Already in your favorites"));
    $(this).find('i').css('color', '#F8963F');
    var title = $(this).attr("data");
    $('#favoritesToggle')[0].click()
    oxtorrent.gui.addSerieToDb(title);
  });

}

function loadEngine() {
  /********************* Configure locales *********************/
  var localeList = ['en', 'fr'];
  i18n.configure({
    defaultLocale: 'en',
    locales: localeList,
    directory: oxtorrent.gui.pluginsDir + 'oxtorrent/locales',
    updateFiles: true
  });

  if ($.inArray(oxtorrent.gui.settings.locale, localeList) > -1) {
    console.log('Loading oxtorrent engine with locale' + oxtorrent.gui.settings.locale);
    i18n.setLocale(oxtorrent.gui.settings.locale);
  } else {
    i18n.setLocale('en');
  }

  // menus needed by the module and menu(s) loaded by default
  oxtorrent.menuEntries = ["searchTypes", "orderBy", "categories"];
  oxtorrent.defaultMenus = ["searchTypes", "orderBy"];
  // searchTypes menus and default entry
  oxtorrent.searchTypes = JSON.parse('{"' + _("Search") + '":"search","' + _("Navigation") + '":"navigation"}');
  oxtorrent.defaultSearchType = 'navigation';
  // orderBy filters and default entry
  oxtorrent.orderBy_filters = JSON.parse('{"' + _("Date descending") + '":"trie-date-d","' + _("Date ascending") + '":"trie-date-a","' + _("Seeds descending") + '":"trie-seeds-d","' + _("Seeds ascending") + '":"trie-seeds-a"}');
  oxtorrent.defaultOrderBy = 'trie-date-d';
  // orderBy filters and default entry
  oxtorrent.category_filters = JSON.parse('{"' + _("Movies") + '":"films","' + _("Movies DVDRIP") + '":"films DVDRIP (.avi)","' + _("Movies DVDRIP (x264)") + '":"films DVDRIP (x264)","' + _("Movies 1080p") + '":"films 1080p","' + _("Movies 720p") + '":"films 720p","' + _("Movies VOSTFR") + '":"films VOSTFR","' + _("Series") + '":"series","' + _("Series FRENCH") + '":"series FRENCH","' + _("Series VOSTFR") + '":"series VOSTFR"}');
  oxtorrent.defaultCategory = 'films';
  // others params
  oxtorrent.has_related = false;
  oxtorrent.categoriesLoaded = true;
}

// search videos
oxtorrent.search = function(query, options, gui) {
  $("#search_results p").empty()
  if (options.searchType === "navigation" && !options.category) {
    return;
  }
  oxtorrent.gui = gui;
  oxtorrent.pageLoading = true;
  var page;
  try {
    page = parseInt(options.currentPage) - 1;
  } catch (err) {
    page = 0;
    oxtorrent.gui.current_page = 0;
  }
  if (page == 0) {
    $('#items_container').empty().append('<ul id="oxtorrent_cont" class="list"></ul>').show();
    oxtorrent.itemsCount = 0;
  }
  oxtorrent.gui.current_page += 1;
  // plugin page must match gui current page for lazy loading
  oxtorrent.currentPage = oxtorrent.gui.current_page;

  var query = encodeURIComponent(query);
  var url;
  var videos = {};

  if (options.searchType === "search") {
    url = 'https://www.oxtorrent.com/recherche/' + query;
    url += '/page/' + page + '/' + options.orderBy + '/desc';
  } else {
    var baseUrl = oxtorrent.url
    var url = ""
    if (options.category == "films") {
      url = baseUrl + "/torrents/films"
    } else if (options.category == "films DVDRIP (.avi)") {
      url = baseUrl + "/torrents/films/dvdrip-avi"
    } else if (options.category == "films DVDRIP (x264)") {
      url = baseUrl + "/torrents/films/dvdrip-x264"
    } else if (options.category == "films 1080p") {
      url = baseUrl + "/torrents/films/1080p"
    } else if (options.category == "films 720p") {
      url = baseUrl + "/torrents/films/720p"
    } else if (options.category == "films VOSTFR") {
      url = baseUrl + "/torrents/films/vostfr"
    } else if (options.category == "series") {
      url = baseUrl + "/torrents/series"
    } else if (options.category == "series FRENCH") {
      url = baseUrl + "/torrents/series/french"
    } else if (options.category == "series VOSTFR") {
      url = baseUrl + "/torrents/series/vostfr"
    }
    url += '/page/' + page + '/' + options.orderBy + '/desc';
  }

  console.log('url', url)

  cloudscraper.get(url, function(error, response, data) {
    if (error) {
      console.log('Error occurred');
    } else {
      console.log("result", data)
      var list = $('.table tr', data).get().slice(1)
      oxtorrent.itemsCount += list.length;

      if (oxtorrent.itemsCount == 0) {
        $('#loading').hide();
        $("#search_results p").empty().append(_("No results found..."));
        $("#search").show();
        $("#pagination").hide();
        oxtorrent.pageLoading = false;
        return;
      }

      oxtorrent.totalPages = parseInt($('ul.pagination li:last', data).prev().text()) || "";
      if (isNaN(oxtorrent.totalPages) && oxtorrent.itemsCount == 0) {
        $('#loading').hide();
        $("#search_results p").empty().append(_("No results found..."));
        $("#search").show();
        $("#pagination").hide();
        oxtorrent.pageLoading = false;
        return;
      } else if (!oxtorrent.totalPages) {
        oxtorrent.totalItems = oxtorrent.itemsCount;
      } else {
        oxtorrent.totalItems = oxtorrent.totalPages * 50;
      }
      console.log(oxtorrent.totalItems)
      analyseResults(list);
    }
  });
}

function analyseResults(list) {
  var arr = []
  var favMainList = oxtorrent.gui.sdb.find();
  var favList = [];
  try {
    Iterator.iterate(favMainList).forEach(function(item, index) {
      if (item.hasOwnProperty('serieName')) {
        favList.push(item);
      }
    });

    // td width="71%" align="left"><i class="Séries"></i> <a href="/torrent/271/game-of-thrones-saison-8-vostfr-hdtv" title="Game of Thrones Saison 8 VOSTFR HDTV en Torrent">Game of Thrones Saison 8 VOSTFR HDTV</a></td>
    // <td width="11%" align="left">3.27 GB</td>
    // <td width="9%" align="left"><img src="/themes/default/img/uploader.png" alt="seeders"> 43</td>
    // <td width="9%" align="left"><img src="/themes/default/img/downloader.png" alt="leechers"> 15</td>
    // </tr>


    Iterator.iterate(list).forEach(function(item, index) {
      console.log(item)
      var video = {};
      video.link = oxtorrent.url + $(item).find('a')[0].href.replace(/.*?\/torrent/, '/torrent');
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
      if (video.isSerie) {
        video.serieName = video.title.toLowerCase().match(/(.*)(s\d{1,3}|saison \d{1,3})/)[1].replace(/\(.*\)/, '').replace('-', '').trim();
        Iterator.iterate(favList).forEach(function(item, index) {
          var re = new RegExp(item.query, 'g');
          var re2 = new RegExp(item.serieName, 'g');
          if (item.serieName == video.serieName || video.serieName == item.query || video.serieName.match(re) || video.serieName.match(re2)) {
            video.isFavorite = true;
            video.favId = item.id;
          }
        });
        if (video.isFavorite) {
          video.background = 'background: url(' + oxtorrent.gui.confDir + '/images/' + video.favId + '-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box';
          video.toggle = '<span style="float:right;"><a href="#" data=""><i class="glyphicon glyphicon-star" style="color:#F8963F" title="' + _('Already in your favorites') + '"></i></span></a>';
        } else {
          video.background = '';
          video.toggle = '<span style="float:right;"><a href="#" style="cursor:pointer;" class="addToFavorites" data="' + video.serieName + '" title="' + _('Add to favorites') + '"><i class="glyphicon glyphicon-star"></i></span></a>';
        }
        appendVideo(video);
      } else {
        video.toggle = '';
        appendVideo(video);
      }
    });
  } catch (err) {
    console.log(err)
  }
  $('#loading').hide();
  $('#search_results p').empty()
  $('#search').show();
  var type = category !== 'series' ? 'movies' : 'chapters';
  var ctype = _(type)
  if (isNaN(oxtorrent.totalItems)) {
    oxtorrent.pageLoading = false;
    return;
  }
  if (searchType === 'navigation') {
    $('#search_results p').empty().append(_("Showing results Page %s / %s", oxtorrent.currentPage - 1, oxtorrent.totalPages, ctype)).show();
  } else {
    $('#search_results p').empty().append(_("%s results founds", oxtorrent.itemsCount)).show();
  }
}

function* checkDb(video) {
  try {
    yield oxtorrent.gui.sdb.find({
      "title": video.title
    });
  } catch (err) {
    return err;
  }
}

var tordata = ''

function appendVideo(video) {
  video.id = ((Math.random() * 1e6) | 0);
  if (video.title.length > 45) {
    text = video.title.substring(0, 45) + '...';
  } else {
    text = video.title;
  }
  var html = '<li id="' + video.id + '" class="list-row"> \
		<span class="optionsTop" style="display:none;"></span> \
		<div id="optionsTopInfos" style="display:none;"> \
		<span style="' + video.css + '" title="' + video.viewedTitle + '"><i class="glyphicon glyphicon-eye-open"></i></span> \
		<span><i class="glyphicon glyphicon-cloud-upload"></i>' + video.seeders + '</span> \
		<span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>' + video.size + '</span> \
		</div> \
		<div class="mvthumb"> \
		<img class="oxtorrentThumb" style="float:left;" /> \
		</div> \
		<div> \
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg preload_oxtorrentPlay_torrent" style="display:none;" data="" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
			<span><i class="glyphicon ' + video.quality + '"></i>' + video.hd + '</span> \
			<span style="float:right;"><a href="#" class="preload_oxtorrent_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
			' + video.toggle + ' \
		</div> \
		<div> \
			<p class="coverInfosTitle" title="' + video.title + '">' + text + '</p> \
		</div> \
		</li>';
  $("#oxtorrent_cont").append(html);
  console.log(video.link)
  cloudscraper.get(video.link, function(error, response, res) {
    var img = oxtorrent.url + res.replace(/\r?\n|\r/g).match(/.*?torrentsimage.*?src='(.*?)'/)[1]
    $('#' + video.id + ' .oxtorrentThumb').attr('src', img);
    console.log('image link', img)
    //store img
    video.cover = img;
    //store description and torrent link
    video.torrent = oxtorrent.url + res.match(/location.href='(.*?)'/)[1]
    console.log('torrent link', video.torrent)
    var r = $('.movie-information', res)
    r.find('strong').remove()
    video.synopsis = r.find('p').text()
    //save in data
    $('#' + video.id + ' .preload_oxtorrent_torrent').attr('data', encodeURIComponent(JSON.stringify(video)));
    $('#' + video.id + ' .coverPlayImg').attr('data', encodeURIComponent(JSON.stringify(video)));

    if ($('#items_container .oxtorrentThumb:visible').length === oxtorrent.itemsCount) {
      oxtorrent.pageLoading = false;
      oxtorrent.gui.searchComplete();
    }
  });
}

oxtorrent.loadMore = function() {
  $('#search_results p').empty()
  oxtorrent.pageLoading = true;
  oxtorrent.gui.changePage();
}

oxtorrent.play_next = function() {
  try {
    $("li.highlight").next().find("a.start_media").click();
  } catch (err) {
    console.log("end of playlist reached");
    try {
      oxtorrent.gui.changePage();
    } catch (err) {
      console.log('no more videos to play');
    }
  }
}

oxtorrent.search_type_changed = function() {
  if (oxtorrent.pageLoading) {
    if (searchType === 'navigation') {
      $('#video_search_query').prop('disabled', true);
    } else {
      $('#video_search_query').prop('disabled', false);
    }
    return;
  }
  oxtorrent.gui.current_page = 1;
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

module.exports = oxtorrent;
