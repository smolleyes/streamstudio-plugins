/********************* engine config *************************
 **************************************************************/

var kick = {};
kick.engine_name = 'Kickass';
var kick_eng = require('kickass-torrent');
kick.type = "video";
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
kick.init = function(gui, ht5) {
    $('#pagination').hide();
    kick.gui = ht5;
    loadEngine();
    //play videos
    $(ht5.document).off('click', '.preload_kick_torrent');
    $(ht5.document).on('click', '.preload_kick_torrent', function(e) {
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = obj.link;
        var id = obj.id;
        var html = '<div id="fbxMsg_header"> \
			<h3>' + obj.title + '</h3> \
			</div> \
			<div id="fbxMsg_content" style="height:auto;"> \
				' + obj.synopsis + ' \
			</div>';
        kick.gui.showPopup(html, 'body')
    });

    $(ht5.document).off('mouseenter', '#kick_cont .list-row');
    $(ht5.document).on('mouseenter', '#kick_cont .list-row', function(e) {
        var self = $(this);
        if ($(this).find('.optionsTop').is(':hidden')) {
            setTimeout(function() {
                if ($("li:hover").attr('id') == self.attr('id')) {
                    self.find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeIn("fast");
                    self.find('.coverPlayImg').fadeIn('fast');
                }
            }, 100);
        }
    });

    $(ht5.document).off('mouseleave', '#kick_cont .list-row');
    $(ht5.document).on('mouseleave', '#kick_cont .list-row', function(e) {
        if ($(this).find('.optionsTop').is(':visible')) {
            $(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
            $(this).find('.coverPlayImg').fadeOut("fast");
        }
    });

    $(ht5.document).off('click', '.preload_kickPlay_torrent');
    $(ht5.document).on('click', '.preload_kickPlay_torrent', function(e) {
        e.preventDefault();
        kick.gui.saveTorrent = false;
        kick.gui.torrentSaved = false;
        kick.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = obj.link;
        var id = obj.id;
        saveTorrent = false;
        var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;'+obj.background+'"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>'+obj.title+'</h3><br><img style="width:180;height:240px;" src="'+obj.cover+'" /><br><br> \
        <button type="button" id="kick_play_'+id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" class="closePopup play_kick_torrent btn btn-success"> \
            <span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span> \
        </button>  \
        <button type="button" class="closePopup download_kick_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="kick_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'">  \
            <span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span>  \
            </span>  \
        </button>';

        if(kick.gui.freeboxAvailable) {
            html += '<button type="button"  href="'+obj.torrent+'" class="closePopup download_kick_torrentFile_fbx downloadText btn btn-info" id="kick_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>';
        }
        html += '<br/><br/><div><label>'+_("Keep torrent file after downloading ?")+'</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
        // show
        kick.gui.showPopup(html, 'body')
    });

    $(ht5.document).on('click', '#fbxMsg_content a', function(e) {
        e.preventDefault();
        ht5.gui.Window.open('http://kat.cr' + $(this).attr('href').replace(/(.*)?\/\//, ''), {
            "always-on-top": true,
            position: "center",
            toolbar: false,
            height: 800,
            width: 1024
        });
    })

    $(ht5.document).off('click', '.play_kick_torrent');
    $(ht5.document).on('click', '.play_kick_torrent', function(e) {
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        kick.gui.getTorrent(obj.torrentLink, obj.cover);
        kick.gui.itemTitle = obj.title;
        $('#playerToggle')[0].click();
    });

    $(ht5.document).off('click', '.download_kick_torrentFile');
    $(ht5.document).on('click', '.download_kick_torrentFile', function(e) {
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        kick.gui.getAuthTorrent(obj.torrentLink, false, false)
    });

    $(ht5.document).off('click', '.download_kick_torrentFile_fbx');
    $(ht5.document).on('click', '.download_kick_torrentFile_fbx', function(e) {
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        kick.gui.getAuthTorrent(obj.torrentLink, false, true)
    });

    $(ht5.document).off('click', '.addToFavorites');
    $(ht5.document).on('click', '.addToFavorites', function(e) {
        e.preventDefault();
        $(this).removeClass('addToFavorites');
        $(this).attr('title', _("Already in your favorites"));
        $(this).find('i').css('color', '#F8963F');
        var title = $(this).attr("data");
        $('#favoritesToggle')[0].click()
        kick.gui.addSerieToDb(title);
    });
}

function loadEngine() {
    /********************* Configure locales *********************/
    var localeList = ['en', 'fr', 'de'];
    i18n.configure({
        defaultLocale: 'en',
        locales: localeList,
        directory: kick.gui.pluginsDir + 'kickass/locales',
        updateFiles: true
    });

    if ($.inArray(kick.gui.settings.locale, localeList) > -1) {
        console.log('Loading kick engine with locale' + kick.gui.settings.locale);
        i18n.setLocale(kick.gui.settings.locale);
    } else {
        i18n.setLocale('en');
    }

    // menus needed by the module and menu(s) loaded by default
    kick.menuEntries = ["searchTypes", "orderBy"];
    kick.defaultMenus = ["searchTypes", "orderBy"];
    // searchTypes menus and default entry
    kick.searchTypes = JSON.parse('{"' + _("Search") + '":"search"}');
    kick.defaultSearchType = 'search';
    // orderBy filters and default entry
    kick.orderBy_filters = JSON.parse('{"' + _("Date") + '":"time_add","' + _("Seeds") + '":"seeds"}');
    kick.defaultOrderBy = 'time_add';
    // others params
    kick.has_related = false;
    kick.categoriesLoaded = true;

}

// search videos
kick.search = function(query, options, gui) {
    kick.gui = gui;
    kick.pageLoading = true;
    var page = options.currentPage;
    if (page == 1) {
        $('#items_container').empty().append('<ul id="kick_cont" class="list"></ul>').show();
        kick.itemsCount = 0;
    }
    kick.gui.current_page += 1;
    // plugin page must match gui current page for lazy loading
    kick.currentPage = kick.gui.current_page;
    var url;
    var videos = {};
    if (options.searchType === "search") {
        kick_eng({
            q: '' + query + '', //actual search term
            field: '' + options.orderBy + '', //seeders, leechers, time_add, files_count, empty for best match
            order: 'desc', //asc or desc
            page: page
        }, function(e, res) {
            var data = JSON.parse(res);
            if (e ||  data.total_results == 0) {
                $('#loading').hide();
                $("#search_results p").empty().append(_("No results found..."));
                $("#search").show();
                $("#pagination").hide();
                return;
            } else {
                if (data.total_results == 0) {
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
    var favMainList = kick.gui.sdb.find();
    var favList = [];
    Iterator.iterate(favMainList).forEach(function (item,index) {
        if(item.hasOwnProperty('serieName')) {
            favList.push(item);
        }
    });
    Iterator.iterate(list).forEach(function(item) {
        var video = {};
        video.torrentLink = item.torrentLink;
        video.link = item.guid;
        video.title = item.title.replace(/\./g, ' ');
        video.quality = video.title.match(/720|1080/) !== null ? 'glyphicon-hd-video' : 'glyphicon-sd-video';
        video.hd = video.title.match(/720/) !== null ? '720p' : video.title.match(/1080/) !== null ? '1080p' : '';
        video.seeders = item.seeds;
        video.leechs = item.leechs;
        var converted_size = Math.floor(Math.log(item.size) / Math.log(1024));
        video.size = (item.size / Math.pow(1024, converted_size)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_size];
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
                video.background = 'background: url('+kick.gui.confDir+'/images/'+video.favId+'-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box';
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
    $('#search_results p').empty().append(_("%s results founds", kick.totalItems)).show();
    $('#search').show();
}

kick.search_type_changed = function() {
    kick.gui.current_page = 1;
    $('#items_container').empty();
    searchType = $("#searchTypes_select a.active").attr("data-value");
    category = $("#categories_select a.active").attr("data-value");
    if (searchType === 'navigation') {
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
    } catch (err) {
        console.log("end of playlist reached");
        try {
            kick.gui.changePage();
        } catch (err) {
            console.log('no more videos to play');
        }
    }
}

kick.loadMore = function() {
    if(kick.pageLoading) {
        return;
    }
    kick.pageLoading = true;
    kick.gui.changePage();
}

function * checkDb(video) {
    try {
        yield kick.gui.sdb.find({
            "title": video.title
        });
    } catch (err) {
        return err;
    }
}

function * checkSerieDb(video) {
    try {
        yield kick.gui.sdb.find({
            "serieName": video.serieName
        });
    } catch (err) {
        return err;
    }
}

// functions
function appendVideo(video) {
    var viewed = "none";
    if (video.title.length > 45) {
        text = video.title.substring(0, 45) + '...';
    } else {
        text = video.title;
    }
    kick.gui.sdb.find({
        "title": video.title
    }, function(err, result) {
        if (!err) {
            if (result.length > 0) {
                viewed = "block"
            }
        } else {
            console.log(err)
        }
    })
    video.id = ((Math.random() * 1e6) | 0);
    var html = '<li id="' + video.id + '" class="list-row" style="margin:0;padding:0;display:none;"> \
		<span class="optionsTop" style="display:none;"></span> \
		<div id="optionsTopInfos" style="display:none;"> \
		<span style="' + video.css + '" title="' + video.viewedTitle + '"><i class="glyphicon glyphicon-eye-open"></i></span> \
		<span><i class="glyphicon glyphicon-cloud-upload"></i>' + video.seeders + '</span> \
		<span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>' + video.size + '</span> \
		</div> \
		<div class="mvthumb"> \
		<img class="kickthumb" style="float:left;" /> \
		</div> \
		<div> \
			<img class="coverPlayImg preload_kickPlay_torrent" style="display:none;" data="" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
			<span><i class="glyphicon ' + video.quality + '"></i>' + video.hd + '</span> \
			<span style="float:right;"><a href="#" class="preload_kick_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
			' + video.toggle + ' \
		</div> \
		<p class="coverInfosTitle" title="' + video.title + '">' + text + '</p> \
		<div id="torrent_' + video.id + '"> \
		</div> \
		</li>';
    $("#kick_cont").append(html);
    $.get(video.link, function(res) {
        var img = "images/kick.png";
        video.synopsis = $("#movieinfo", res).html();
        if (video.synopsis == undefined) {
            video.synopsis = $("#tab-main", res).html().replace(/"\/img/g, '"http://kat.cr/img').replace(/"\/\//g, '"http://').replace("file://",'');
        }
        video.synopsis += $("#desc", res).html();
        video.cover = img.replace('file:', 'http:');
        $('#' + video.id + ' img').attr('src', video.cover);
        $('#' + video.id + ' .preload_kick_torrent').attr('data', encodeURIComponent(JSON.stringify(video)));
        $('#' + video.id + ' .coverPlayImg').attr('data', encodeURIComponent(JSON.stringify(video)));
        $('#' + video.id).show();
    });
    if ($('#items_container ul li').length === kick.itemsCount) {
        kick.pageLoading = false;
    }
}

module.exports = kick;