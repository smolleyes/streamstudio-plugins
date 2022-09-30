/********************* engine config *************************
 **************************************************************/

var yggtorrent = {};
yggtorrent.engine_name = "yggtorrent";
yggtorrent.type = "video";
yggtorrent.totalPages = 0;
yggtorrent.currentPage = 0;
yggtorrent.itemsCount = 0;
yggtorrent.pageLoading = false;
yggtorrent.protected = true;
yggtorrent.url = "https://www2.yggtorrent.co";
yggtorrent.initialized = true;
yggtorrent.Win = null;
yggtorrent.init = false;

/********************* Node modules *************************/

var http = require("http");
var $ = require("jquery");
var path = require("path");
var os = require("os");
var i18n = require("i18n");
var fs = require("fs");
var _ = i18n.__;
var Iterator = require("iterator").Iterator;
var cloudscraper = require("cloudscraper");

/****************************/

// module global vars
var searchType = "navigation";

// init module
yggtorrent.init = function (gui, win, doc, console) {
  $("#pagination", doc).hide();
  $ = win.$;
  yggtorrent.gui = win;
  yggtorrent.mainWin = gui;
  loadEngine();
  //play videos
  $(doc).off("click", ".preload_yggtorrent_torrent");
  $(doc).on("click", ".preload_yggtorrent_torrent", function (e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    console.log(obj);
    var link = obj.link;
    var id = obj.id;
    //$('.highlight').removeClass('highlight well');
    //$(this).closest('li').addClass('highlight well');
    var html =
      '<div id="fbxMsg_header"> \
			<h3>' +
      obj.title +
      '</h3> \
			</div> \
			<div id="fbxMsg_content" style="height:auto;"> \
				<img src="' +
      obj.cover +
      '" /> \
				<p style="margin-top:10px;font-weight:bold;">' +
      obj.synopsis +
      "</p> \
			</div>";
    yggtorrent.gui.showPopup(html, "body");
  });

  $(doc).off("mouseenter", "#yggtorrent_cont .list-row");
  $(doc).on("mouseenter", "#yggtorrent_cont .list-row", function (e) {
    var self = $(this);
    if ($(this).find(".optionsTop").is(":hidden")) {
      setTimeout(function () {
        if ($("#yggtorrent_cont li:hover").attr("id") == self.attr("id")) {
          self
            .find(
              ".optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos"
            )
            .fadeIn("fast");
          self.find(".coverPlayImg").fadeIn("fast");
        }
      }, 100);
    }
  });

  $(doc).off("mouseleave", "#yggtorrent_cont .list-row");
  $(doc).on("mouseleave", "#yggtorrent_cont .list-row", function (e) {
    if ($(this).find(".optionsTop").is(":visible")) {
      $(this)
        .find(".optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos")
        .fadeOut("fast");
      $(this).find(".coverPlayImg").fadeOut("fast");
    }
  });

  $(doc).off("click", ".preload_yggtorrentPlay_torrent");
  $(doc).on("click", ".preload_yggtorrentPlay_torrent", function (e) {
    e.preventDefault();
    yggtorrent.gui.saveTorrent = false;
    yggtorrent.gui.torrentSaved = false;
    yggtorrent.gui.activeItem(
      $(this).closest(".list-row").find(".coverInfosTitle")
    );
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    var link = obj.link;
    var id = obj.id;
    saveTorrent = false;
    var html =
      '<div style="width:100%;height:100%;position:relative;top:0;left:0;' +
      obj.background +
      '"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>' +
      obj.title +
      '</h3><br><img style="width:180;height:240px;" src="' +
      obj.cover +
      '" /><br><br> \
	<button type="button" id="yggtorrent_play_' +
      id +
      '" data="' +
      encodeURIComponent(JSON.stringify(obj)) +
      '" class="closePopup play_yggtorrent_torrent btn btn-success"> \
    	<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">' +
      _("Start playing") +
      '</span></span> \
    </button>  \
    <button type="button" class="closePopup download_yggtorrent_torrentFile downloadText btn btn-info" href="' +
      obj.torrent +
      '" id="yggtorrent_downlink_' +
      obj.id +
      '" data="' +
      encodeURIComponent(JSON.stringify(obj)) +
      '" title="' +
      _("Download") +
      '">  \
    	<span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">' +
      _("Download") +
      "</span>  \
    	</span>  \
    </button>";

    if (yggtorrent.gui.freeboxAvailable) {
      html +=
        '<button type="button"  href="' +
        obj.torrent +
        '" class="closePopup download_yggtorrent_torrentFile_fbx downloadText btn btn-info" id="yggtorrent_downlinkFbx_' +
        obj.id +
        '" data="' +
        encodeURIComponent(JSON.stringify(obj)) +
        '" title="' +
        _("Download") +
        '"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">' +
        _("Télécharger avec freebox") +
        "</span></span></button>";
    }
    html +=
      "<br/><br/><div><label>" +
      _("Keep torrent file after downloading ?") +
      '</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
    // show
    yggtorrent.gui.showPopup(html, "body");
  });

  $(doc).off("click", ".play_yggtorrent_torrent");
  $(doc).on("click", ".play_yggtorrent_torrent", function (e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    console.log(obj);
    yggtorrent.gui.getAuthTorrent(obj.torrent, true, false);
    yggtorrent.gui.itemTitle = obj.title;
    $("#playerToggle")[0].click();
  });

  $(doc).off("click", ".download_yggtorrent_torrentFile");
  $(doc).on("click", ".download_yggtorrent_torrentFile", function (e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    yggtorrent.gui.getAuthTorrent(obj.torrent, false, false);
  });

  $(doc).off("click", ".download_yggtorrent_torrentFile_fbx");
  $(doc).on("click", ".download_yggtorrent_torrentFile_fbx", function (e) {
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    yggtorrent.gui.getAuthTorrent(obj.torrent, false, true);
  });

  $(doc).off("click", ".addToFavorites");
  $(doc).on("click", ".addToFavorites", function (e) {
    e.preventDefault();
    $(this).removeClass("addToFavorites");
    $(this).attr("title", _("Already in your favorites"));
    $(this).find("i").css("color", "#F8963F");
    var title = $(this).attr("data");
    $("#favoritesToggle")[0].click();
    yggtorrent.gui.addSerieToDb(title);
  });
};

function loadEngine() {
  /********************* Configure locales *********************/
  var localeList = ["en", "fr"];
  i18n.configure({
    defaultLocale: "en",
    locales: localeList,
    directory: yggtorrent.gui.pluginsDir + "yggtorrent/locales",
    updateFiles: true,
  });

  if ($.inArray(yggtorrent.gui.settings.locale, localeList) > -1) {
    console.log(
      "Loading yggtorrent engine with locale" + yggtorrent.gui.settings.locale
    );
    i18n.setLocale(yggtorrent.gui.settings.locale);
  } else {
    i18n.setLocale("en");
  }

  // menus needed by the module and menu(s) loaded by default
  yggtorrent.menuEntries = ["searchTypes", "orderBy", "categories"];
  yggtorrent.defaultMenus = ["searchTypes", "orderBy"];
  // searchTypes menus and default entry
  yggtorrent.searchTypes = JSON.parse(
    '{"' + _("Search") + '":"search","' + _("Navigation") + '":"navigation"}'
  );
  yggtorrent.defaultSearchType = "navigation";
  // orderBy filters and default entry
  yggtorrent.orderBy_filters = JSON.parse(
    '{"' +
      _("Date descending") +
      '":"date/desc","' +
      _("Date ascending") +
      '":"date/asc","' +
      _("Seeds descending") +
      '":"seeds/desc","' +
      _("Seeds ascending") +
      '":"seeds/asc"}'
  );
  yggtorrent.defaultOrderBy = "date/desc";
  // orderBy filters and default entry
  yggtorrent.category_filters = JSON.parse(
    '{"' + _("Movies") + '":"films","' + _("Series") + '":"series"}'
  );
  yggtorrent.defaultCategory = "films";
  // others params
  yggtorrent.has_related = false;
  yggtorrent.categoriesLoaded = true;
  console.log(yggtorrent);
}

// search videos
yggtorrent.search = function (query, options, gui) {
  $("#search_results p").empty();
  console.log("INIT SEARCH", yggtorrent, options);
  if (options.searchType === "navigation" && !options.category) {
    return;
  }
  yggtorrent.gui = gui;
  yggtorrent.pageLoading = true;
  var page;
  // try {
  //   page = parseInt(options.currentPage);
  // } catch (err) {
  //   page = 0;
  //   yggtorrent.gui.current_page = 0;
  // }
  if (!$("#yggtorrent_cont").length) {
    $("#items_container")
      .empty()
      .append('<ul id="yggtorrent_cont" class="list"></ul>')
      .show();
    yggtorrent.itemsCount = 0;
    yggtorrent.init = true;
    yggtorrent.gui.current_page = 0;
    page = 0;
  } else {
    console.log("ALREADY LOADED", options, yggtorrent);
    yggtorrent.gui.current_page += 1;
    page = yggtorrent.gui.current_page;
  }
  //yggtorrent.gui.current_page += 1;
  // plugin page must match gui current page for lazy loading
  yggtorrent.currentPage = yggtorrent.gui.current_page + 1;

  var query = encodeURIComponent(query);
  var url;
  var videos = {};

  if (options.searchType === "search") {
    url = yggtorrent.url + "/search_torrent/" + query;
    url += "/page-" + page;
  } else {
    var baseUrl = yggtorrent.url;
    var url = "";
    if (options.category == "films") {
      url = baseUrl + "/torrents_films.html";
    } else if (options.category == "series") {
      url = baseUrl + "/torrents_series.html";
    }
    url += ",page-" + page;
  }

  console.log("url", url);

  cloudscraper.get(url, function (error, response, data) {
    if (error) {
      console.log("Error occurred", error);
    } else {
      console.log("result", data);
      var list = $(".table tr", data).get().slice(1);
      yggtorrent.itemsCount += list.length;

      if (yggtorrent.itemsCount == 0) {
        $("#loading").hide();
        $("#search_results p").empty().append(_("No results found..."));
        $("#search").show();
        $("#pagination").hide();
        yggtorrent.pageLoading = false;
        return;
      }

      yggtorrent.totalPages =
        parseInt($("ul.pagination li:last", data)[0].outerText) || "";
      if (isNaN(yggtorrent.totalPages) && yggtorrent.itemsCount == 0) {
        $("#loading").hide();
        $("#search_results p").empty().append(_("No results found..."));
        $("#search").show();
        $("#pagination").hide();
        yggtorrent.pageLoading = false;
        return;
      } else if (!yggtorrent.totalPages) {
        yggtorrent.totalItems = yggtorrent.itemsCount;
      } else {
        yggtorrent.totalItems = yggtorrent.totalPages * 50;
      }
      console.log(yggtorrent.totalItems);
      analyseResults(list);
    }
  });
};

function analyseResults(list) {
  var arr = [];
  var favMainList = yggtorrent.gui.sdb.find();
  var favList = [];
  try {
    Iterator.iterate(favMainList).forEach(function (item, index) {
      if (item.hasOwnProperty("serieName")) {
        favList.push(item);
      }
    });

    // td width="71%" align="left"><i class="Séries"></i> <a href="/torrent/271/game-of-thrones-saison-8-vostfr-hdtv" title="Game of Thrones Saison 8 VOSTFR HDTV en Torrent">Game of Thrones Saison 8 VOSTFR HDTV</a></td>
    // <td width="11%" align="left">3.27 GB</td>
    // <td width="9%" align="left"><img src="/themes/default/img/uploader.png" alt="seeders"> 43</td>
    // <td width="9%" align="left"><img src="/themes/default/img/downloader.png" alt="leechers"> 15</td>
    // </tr>

    Iterator.iterate(list).forEach(function (item, index) {
      console.log(item);
      var video = {};
      video.link =
        yggtorrent.url +
        $(item)
          .find("a")[0]
          .href.replace(/.*?\/torrent/, "/torrent");
      video.title = $($(item).find("a")[0]).text();
      video.quality =
        video.title.match(/720|1080/) !== null
          ? "glyphicon-hd-video"
          : "glyphicon-sd-video";
      video.hd =
        video.title.match(/720/) !== null
          ? "720p"
          : video.title.match(/1080/) !== null
          ? "1080p"
          : "";
      video.size = $($(item).find("td")[1]).text();
      video.seeders = $($(item).find("td")[2]).text();
      video.leechers = $($(item).find("td")[3]).text();
      var c = checkDb(video);
      var l = c.next().value.length;
      video.css =
        l > 0
          ? "color:red;float: left;margin-top: 1px;display:block"
          : "display:none;";
      video.viewedTitle = l > 0 ? _("Already watched") : "";
      video.isSerie =
        video.title
          .toLowerCase()
          .match(/(.*)(s\d{1,3}e\d{1,3}|s\d{1,3}|saison \d{1,3})/) !== null
          ? true
          : false;
      video.isFavorite = false;
      video.favId = null;
      if (video.isSerie) {
        video.serieName = video.title
          .toLowerCase()
          .match(/(.*)(s\d{1,3}|saison \d{1,3})/)[1]
          .replace(/\(.*\)/, "")
          .replace("-", "")
          .trim();
        Iterator.iterate(favList).forEach(function (item, index) {
          var re = new RegExp(item.query, "g");
          var re2 = new RegExp(item.serieName, "g");
          if (
            item.serieName == video.serieName ||
            video.serieName == item.query ||
            video.serieName.match(re) ||
            video.serieName.match(re2)
          ) {
            video.isFavorite = true;
            video.favId = item.id;
          }
        });
        if (video.isFavorite) {
          video.background =
            "background: url(" +
            yggtorrent.gui.confDir +
            "/images/" +
            video.favId +
            "-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box";
          video.toggle =
            '<span style="float:right;"><a href="#" data=""><i class="glyphicon glyphicon-star" style="color:#F8963F" title="' +
            _("Already in your favorites") +
            '"></i></span></a>';
        } else {
          video.background = "";
          video.toggle =
            '<span style="float:right;"><a href="#" style="cursor:pointer;" class="addToFavorites" data="' +
            video.serieName +
            '" title="' +
            _("Add to favorites") +
            '"><i class="glyphicon glyphicon-star"></i></span></a>';
        }
        appendVideo(video);
      } else {
        video.toggle = "";
        appendVideo(video);
      }
    });
  } catch (err) {
    console.log(err);
  }
  $("#loading").hide();
  $("#search_results p").empty();
  $("#search").show();
  var type = category !== "series" ? "movies" : "chapters";
  var ctype = _(type);
  if (isNaN(yggtorrent.totalItems)) {
    yggtorrent.pageLoading = false;
    return;
  }
  if (searchType === "navigation") {
    $("#search_results p")
      .empty()
      .append(
        _(
          "Showing results Page %s / %s",
          yggtorrent.currentPage,
          yggtorrent.totalPages,
          ctype
        )
      )
      .show();
  } else {
    $("#search_results p")
      .empty()
      .append(_("%s results founds", yggtorrent.itemsCount))
      .show();
  }
}

function* checkDb(video) {
  try {
    yield yggtorrent.gui.sdb.find({
      title: video.title,
    });
  } catch (err) {
    return err;
  }
}

var tordata = "";

function appendVideo(video) {
  console.log(video);
  try {
    video.id = (Math.random() * 1e6) | 0;
    if (video.title.length > 45) {
      text = video.title.substring(0, 45) + "...";
    } else {
      text = video.title;
    }
    var html =
      '<li id="' +
      video.id +
      '" class="list-row"> \
      <span class="optionsTop" style="display:none;"></span> \
      <div id="optionsTopInfos" style="display:none;"> \
      <span style="' +
      video.css +
      '" title="' +
      video.viewedTitle +
      '"><i class="glyphicon glyphicon-eye-open"></i></span> \
      <span><i class="glyphicon glyphicon-cloud-upload"></i>' +
      video.seeders +
      '</span> \
      <span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>' +
      video.size +
      '</span> \
      </div> \
      <div class="mvthumb"> \
      <img class="yggtorrentThumb" style="float:left;" /> \
      </div> \
      <div> \
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg preload_yggtorrentPlay_torrent" style="display:none;" data="" /> \
      </div> \
      <span class="optionsBottom" style="display:none;"></span> \
      <div id="optionsBottomInfos" style="display:none;"> \
        <span><i class="glyphicon ' +
      video.quality +
      '"></i>' +
      video.hd +
      '</span> \
        <span style="float:right;"><a href="#" class="preload_yggtorrent_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
        ' +
      video.toggle +
      ' \
      </div> \
      <div> \
        <p class="coverInfosTitle" title="' +
      video.title +
      '">' +
      text +
      "</p> \
      </div> \
      </li>";
    $("#yggtorrent_cont").append(html);
    console.log(video.link);
    cloudscraper.get(video.link, function (error, response, res) {
      console.log(yggtorrent.itemsCount, yggtorrent.totalItems);
      var img = yggtorrent.url + $(".movie-img img", res).attr("src");

      $("#" + video.id + " .yggtorrentThumb").attr("src", img);
      console.log("image link", img);
      //store img
      video.cover = img;
      //store description and torrent link

      video.torrent = $(".btn.download", res)[2].href;

      console.log(video.link, video.torrent);

      var r = $(".movie-information", res);
      r.find("strong").remove();
      video.synopsis = r.find("p").text();
      //save in data
      $("#" + video.id + " .preload_yggtorrent_torrent").attr(
        "data",
        encodeURIComponent(JSON.stringify(video))
      );
      $("#" + video.id + " .coverPlayImg").attr(
        "data",
        encodeURIComponent(JSON.stringify(video))
      );

      if (
        $("#items_container .yggtorrentThumb").length === yggtorrent.itemsCount
      ) {
        yggtorrent.pageLoading = false;
        yggtorrent.gui.searchComplete();
      }
    });
  } catch (err) {
    console.log("ERROR IN APPENVIDEO", err);
  }
}

yggtorrent.loadMore = function () {
  $("#search_results p").empty();
  yggtorrent.pageLoading = true;
  yggtorrent.gui.changePage();
};

yggtorrent.play_next = function () {
  try {
    $("li.highlight").next().find("a.start_media").click();
  } catch (err) {
    console.log("end of playlist reached");
    try {
      yggtorrent.gui.changePage();
    } catch (err) {
      console.log("no more videos to play");
    }
  }
};

yggtorrent.search_type_changed = function () {
  if (yggtorrent.pageLoading) {
    if (searchType === "navigation") {
      $("#video_search_query").prop("disabled", true);
    } else {
      $("#video_search_query").prop("disabled", false);
    }
    return;
  }
  yggtorrent.gui.current_page = 1;
  $("#items_container").empty();
  searchType = $("#searchTypes_select a.active").attr("data-value");
  category = $("#categories_select a.active").attr("data-value");
  $("#search").hide();
  if (searchType === "navigation") {
    $("#orderBy_select").show();
    $("#orderBy_label").show();
    $("#categories_label").show();
    $("#categories_select").show();
    $("#dateTypes_select").hide();
    $("#searchFilters_select").hide();
    $("#video_search_query").prop("disabled", true);
    $("#video_search_btn").click();
  } else {
    $("#dateTypes_select").hide();
    $("#searchFilters_label").hide();
    $("#searchFilters_select").hide();
    $("#categories_label").hide();
    $("#categories_select").hide();
    $("#orderBy_label").show();
    $("#orderBy_select").show();
    $("#video_search_query").prop("disabled", false);
  }
};

module.exports = yggtorrent;
