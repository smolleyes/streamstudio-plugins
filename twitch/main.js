/********************* engine config *************************
 **************************************************************/

var twitch = {};
twitch.engine_name = 'Twitch';
var TwitchTv = require('../node_modules/twitchtv/lib/twitch'),
    tw = new TwitchTv;
twitch.type = "video";
twitch.totalPages = 0;
twitch.currentPage = 0;
twitch.itemsCount = 0;
twitch.pageLoading = false;
twitch.channelBrowsing = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var os = require('os');
var i18n = require("i18n");
var fs = require('fs');
var _ = i18n.__;
var spawn = require('child_process').spawn;
var Iterator = require('iterator').Iterator;

/****************************/

// module global vars
var searchType = 'search';

// init module
twitch.init = function(gui, ht5) {
    $('#pagination').hide();
    twitch.gui = ht5;
    loadEngine();
    //play videos
    $(ht5.document).off('click', '.preload_twitch_torrent');
    $(ht5.document).on('click', '.preload_twitch_torrent', function(e) {
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = obj.link;
        var id = obj.id;
        $('.highlight').removeClass('highlight well');
        $(this).closest('li').addClass('highlight well');
        $.get(link, function(res) {
            var table = $("#movieinfo", res).html();
            if (table == undefined) {
                var table = $("#tab-main", res).html().replace(/"\/img/g, '"http://twitch.so/img').replace(/"\/\//g, '"http://');
            }
            table += $("#desc", res).html();
            var name = obj.title;
            obj.torrent = obj.torrentLink;
            $('#fbxMsg').empty();
            $('#fbxMsg').append('<div id="fbxMsg_header"><h3>' + obj.title + '</h3><a href="#" id="closePreview">X</a></div><div id="fbxMsg_downloads" class="well"></div><div id="fbxMsg_content"></div>');
            $('#preloadTorrent').remove();
            $('.mejs-overlay-button').hide();
            $('.download-torrent').remove();
            // add play button
            $('#fbxMsg_downloads').append('<button type="button" id="twitch_play_' + id + '" data="" class="play_twitch_torrent btn btn-success" style="margin-right:20px;"> \
											<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">' + _("Start playing") + '</span></span>\
										  </button>');
            $('#twitch_play_' + id).attr('data', encodeURIComponent(JSON.stringify(obj)));
            // downloads buttons
            $('#fbxMsg_downloads').append('<button type="button" class="download_twitch_torrentFile downloadText btn btn-info" href="' + obj.torrent + '" id="twitch_downlink_' + obj.id + '" data="' + encodeURIComponent(JSON.stringify(obj)) + '" title="' + _("Download") + '" ><span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">' + _("Download") + '</span></span></button>');
            if (twitch.gui.freeboxAvailable) {
                $('#fbxMsg_downloads').append('<button type="button"  href="' + obj.torrent + '" class="download_twitch_torrentFile_fbx downloadText btn btn-info" id="twitch_downlinkFbx_' + obj.id + '" data="' + encodeURIComponent(JSON.stringify(obj)) + '" title="' + _("Download") + '"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">' + _("Télécharger avec freebox") + '</span></span></button>');
            }
            // clean preview
            $('#fbxMsg_content').append(table);
            // show
            $('#fbxMsg').slideDown();
        })
    });

    $(ht5.document).on('click', '#fbxMsg_content a', function(e) {
        e.preventDefault();
        ht5.gui.Window.open('http://twitch.so' + $(this).attr('href').replace(/(.*)?\/\//, ''), {
            "always-on-top": true,
            position: "center",
            toolbar: false,
            height: 800,
            width: 1024
        });
    })

    $(ht5.document).off('click', '.play_twitch_torrent');
    $(ht5.document).on('click', '.play_twitch_torrent', function(e) {
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        twitch.gui.getTorrent(obj.torrent);
        $('#fbxMsg').slideUp();
        $('#playerToggle')[0].click();
    });

    $(ht5.document).off('click', '.download_twitch_torrentFile');
    $(ht5.document).on('click', '.download_twitch_torrentFile', function(e) {
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        twitch.gui.getAuthTorrent(obj.torrent, false, false)
    });

    $(ht5.document).off('click', '.download_twitch_torrentFile_fbx');
    $(ht5.document).on('click', '.download_twitch_torrentFile_fbx', function(e) {
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        twitch.gui.getAuthTorrent(obj.torrent, false, true)
    });

    $(ht5.document).off('click', '.showGamesChannels');
    $(ht5.document).on('click', '.showGamesChannels', function(e) {
        e.preventDefault();
        twitch.channelBrowsing = true;
        twitch.gui.current_page == 1;
        twitch.itemsCount = 0;
        $('#items_container').empty().append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        twitch.loadGameChannels(obj.title.replace(' ', '+'));
    });

    $(ht5.document).off('mouseenter', '#twitch_cont .list-row');
    $(ht5.document).on('mouseenter', '#twitch_cont .list-row', function(e) {
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

    $(ht5.document).off('mouseleave', '#twitch_cont .list-row');
    $(ht5.document).on('mouseleave', '#twitch_cont .list-row', function(e) {
        if ($(this).find('.optionsTop').is(':visible')) {
            $(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
            $(this).find('.coverPlayImg').fadeOut("fast");
        }
    });

    $(ht5.document).off('click', '.getChannelstreams');
    $(ht5.document).on('click', '.getChannelstreams', function(e) {
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        obj.id = $(this).closest('.list-row').find('ul').attr('id');
        $('#'+obj.id).empty().append('<span style="text-align:center;font-size:12px;">'+_("Loading...")+'</span>').show();
        var st = spawn(twitch.gui.livestreamerPath, ['--stream-url', obj.link]);
        var out = '';
        st.stdout.on('data', function(data) {
            out = data.toString();
        });
        st.on('exit', function(code) {
            if (code == 0) {
                if (out.indexOf('Available streams:') !== -1) {
                	$('#'+obj.id).empty();
                    var list = out.replace('Available streams:', '').replace(/\(.*?\)/g, '').split(',');
                    Iterator.iterate(list).forEach(function(item) {
                        var item = item.trim();
                        if (item !== 'audio') {
                            $('#' + obj.id).append('<li style="float:left;"><a style="background:none !important;font-size: 12px;font-weight: bold;margin: 0;padding: 0 5px;" class="playChannel twitchQualityLink" href="#" data="' + obj.title + '::' + obj.link + '&quality=' + item + '">' + item + ' </a></li>')
                        }
                    });
                } else {
                    $.notif({
                        title: 'StreamStudio:',
                        cls: 'red',
                        icon: '&#59256;',
                        timeout: 0,
                        content: _("No streams found for this channel !"),
                        btnId: 'ok',
                        btnTitle: _('Ok'),
                        btnColor: 'black',
                        btnDisplay: 'block',
                        updateDisplay: 'none'
                    })
                    $('#'+obj.id).empty().hide;
                }
            } else {
            	$('#'+obj.id).empty().hide;
            }
        });
    });

    $(ht5.document).off('click', '.playChannel');
    $(ht5.document).on('click', '.playChannel', function(e) {
        e.preventDefault();
        twitch.gui.ffmpegLive = false;
        var obj = $(this).attr("data").split('::');
        var video = {};
        video.title = obj[0];
        video.link = obj[1];
        twitch.gui.startPlay(video);
    });

}

function loadEngine() {
    /********************* Configure locales *********************/
    var localeList = ['en', 'fr', 'de'];
    i18n.configure({
        defaultLocale: 'en',
        locales: localeList,
        directory: twitch.gui.pluginsDir + 'twitch/locales',
        updateFiles: true
    });

    if ($.inArray(twitch.gui.settings.locale, localeList) > -1) {
        console.log('Loading twitch engine with locale' + twitch.gui.settings.locale);
        i18n.setLocale(twitch.gui.settings.locale);
    } else {
        i18n.setLocale('en');
    }

    // menus needed by the module and menu(s) loaded by default
    twitch.menuEntries = ["searchTypes", "categories"];
    twitch.defaultMenus = ["searchTypes"];
    // searchTypes menus and default entry
    twitch.searchTypes = JSON.parse('{"' + _("Search") + '":"search","' + _("Navigation") + '":"navigation"}');
    twitch.defaultSearchType = 'search';
    // categories filters and default entry
    twitch.category_filters = JSON.parse('{"' + _("Featured") + '":"featured","' + _("Games") + '":"games","' + _("Channels") + '":"channels"}');
    twitch.defaultCategory = 'featured';
    // others params
    twitch.has_related = false;
    twitch.categoriesLoaded = true;

}

// search videos
twitch.search = function(query, options, gui) {
    twitch.gui = gui;
    twitch.pageLoading = true;
    var page = options.currentPage - 1;
    if (page == 0) {
        twitch.channelBrowsing = false;
        $('#items_container').empty().append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
        twitch.itemsCount = 0;
    }
    twitch.gui.current_page = options.currentPage + 1;
    // plugin page must match gui current page for lazy loading
    twitch.currentPage = twitch.gui.current_page;
    var url;
    var videos = {};
    var offset = page * 20;
    if (options.searchType === "search") {
        $.getJSON('http://' + twitch.gui.ipaddress + ':8081/?link=https://api.twitch.tv/kraken/search/streams?limit=20&offset=' + offset + '&q=' + query.replace(' ', '+'), function(data) {
            if (data._total == 0 || data.streams.length == 0) {
                $('#loading').hide();
                $("#search_results p").empty().append(_("No results found..."));
                $("#search").show();
                $("#pagination").hide();
                return;
            } else {
                twitch.itemsCount += data.streams.length;
                twitch.totalPages = Math.round(data._total / 20);
                twitch.totalItems = data._total;
                twitch.next = data._links['next'];
                var list = data.streams;
                Iterator.iterate(list).forEach(function(item) {
                    var video = {};
                    video.viewers = item.viewers;
                    video.title = item.channel.name;
                    video.link = item.channel.url;
                    video.class = "getChannelstreams";
                    video.game = item.game;
                    video.thumbnail = item.preview['large'];
                    appendChannel(video);
                });
                $('#loading').hide();
                $('#search_results p').empty().append(_("%s results founds", twitch.totalItems)).show();
                $('#search').show();
                $("#items_container").show();
            }
        });
    } else {
        if (category === 'games') {
            if (!twitch.channelBrowsing) {
                twitch.gui.current_page == 1;
                twitch.next = "https://api.twitch.tv/kraken/games/top?limit=10&offset=0";
                $('#items_container').empty().append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
                twitch.loadGamesPage();
            }
        }
    }
}

function analyseResults(list) {
    Iterator.iterate(list).forEach(function(item) {
        var video = {};
        video.viewers = item.viewers;
        video.channels = item.channels;
        video.title = item.game.name;
        video.gameId = item.game.id;
        video.class = "showGamesChannels";
        video.thumbnail = item.game.box['large'];
        appendVideo(video);
    });
    $('#loading').hide();
    $('#search_results p').empty().append(_("%s results founds", twitch.totalItems)).show();
    $('#search').show();
    $("#items_container").show();
}

twitch.loadGamesPage = function() {
    $('#loading').show();
    $("#search").hide();
    $.get('http://' + twitch.gui.ipaddress + ':8081/?link=' + twitch.next.replace('http:', 'https:'), function(data) {
        twitch.parseGamesPage(data);
    })
}

twitch.parseGamesPage = function(data) {
    if (twitch.gui.current_page == 1) {
        twitch.totalPages = parseInt(data._total) / 10;
        twitch.itemsCount = data.top.length;
        twitch.gui.current_page += 1;
    } else {
        twitch.gui.current_page += 1;
        twitch.itemsCount += data.top.length;
    }
    twitch.totalItems = data._total;
    twitch.next = data._links['next'];
    var list = data.top;
    analyseResults(list);
}

// load game channels
twitch.loadGameChannels = function(name) {
    twitch.gui.current_page == 1;
    twitch.next = 'https://api.twitch.tv/kraken/streams?broadcaster_language=&game=' + name + '&limit=20&offset=0';
    twitch.loadGameChannelsPage();
}

twitch.loadGameChannelsPage = function() {
    $('#loading').show();
    $("#search").hide();
    $.get('http://' + twitch.gui.ipaddress + ':8081/?link=' + twitch.next.replace('http:', 'https:'), function(data) {
        if (searchType == "navigation" && category == "featured") {
            twitch.parseFeaturedChannelsPage(data);
        } else {
            twitch.parseGameChannelsPage(data);
        }
    })
}

twitch.parseGameChannelsPage = function(data) {
    if (twitch.gui.current_page == 1) {
        twitch.totalPages = parseInt(data._total) / 20;
        twitch.itemsCount = data.streams.length;
        twitch.gui.current_page += 1;
        $('#items_container').empty();
        $('#items_container').append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
    } else {
        twitch.gui.current_page += 1;
        twitch.itemsCount += data.streams.length;
        twitch.channelBrowsing = true;
    }
    twitch.totalItems = data._total;
    twitch.next = data._links['next'];
    var list = data.streams;
    Iterator.iterate(list).forEach(function(item) {
        var video = {};
        video.viewers = item.viewers;
        video.title = item.channel.name;
        video.link = item.channel.url;
        video.game = item.channel.game;
        video.class = "getChannelstreams";
        video.thumbnail = item.preview['large'];
        appendChannel(video);
    });
    $('#loading').hide();
    $('#search_results p').empty().append(_("%s results founds", twitch.totalItems)).show();
    $('#search').show();
    $("#items_container").show();
}

twitch.parseFeaturedChannelsPage = function(data) {
    if (twitch.gui.current_page == 1) {
        twitch.totalPages = 1;
        twitch.itemsCount = data.featured.length;
        twitch.gui.current_page += 1;
        $('#items_container').empty();
        $('#items_container').append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
    } else {
        twitch.gui.current_page += 1;
        twitch.itemsCount += data.featured.length;
        twitch.channelBrowsing = true;
    }
    twitch.totalItems = 30;
    twitch.next = data._links['next'];
    var list = data.featured;
    Iterator.iterate(list).forEach(function(item) {
        var video = {};
        video.viewers = item.stream.viewers;
        video.title = item.title;
        video.link = item.stream.channel.url;
        video.game = item.stream.channel.game;
        video.class = "getChannelstreams";
        video.thumbnail = item.stream.preview['large'];
        appendChannel(video);
    });
    $('#loading').hide();
    $('#search_results p').empty().append(_("Featured channels...", twitch.totalItems)).show();
    $('#search').show();
    $("#items_container").show();
}

function appendChannel(video) {
    video.id = ((Math.random() * 1e6) | 0);
    video.cover = video.thumbnail;
    var vid = ((Math.random() * 1e6) | 0);
    var html = '<li id="' + video.id + '" class="list-row" style="width:180px !important;height:220px;margin:0;padding:0"> \
	<span class="optionsTop" style="display:none;"></span> \
	<div id="optionsTopInfos" style="display:none;"> \
		<span><i class="glyphicon glyphicon-eye-open"></i>' + _("Viewers: ") + video.viewers + '</span> \
	</div> \
	<div class="mvthumb"> \
		<img style="width:180px;"" src="' + video.thumbnail + '" /> \
	</div> \
	<div> \
		<img class="coverPlayImg ' + video.class + '" style="display:none;margin: -65px 0 0 -100px;" data="' + encodeURIComponent(JSON.stringify(video)) + '" /> \
	</div> \
	<span class="optionsBottom" style="display:none;bottom:30px;"></span> \
	<div id="optionsBottomInfos" style="display:none;bottom:30px;"> \
		<div class="dropdown"> \
            <a class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" role="button" aria-expanded="false"> \
            ' + _("Available streams:") + ' \
            <span class="caret"></span> \
            </a> \
            <ul class="dropdown-menu downloads_container" role="menu" style="width:100%;max-height:60px;" id="'+vid+'"></ul> \
        </div> \
	</div> \
	<p class="coverInfosTitle" style="position:relative;bottom: -5px;" title="' + video.title + '">' + video.title + '</p> \
    <p style="color:grey;font-size:10px;margin:-5px 0 5px 0;">'+_("Game: ")+' '+video.game+'</p> \
	</li>';
    $("#twitch_cont").append(html);
    $('#' + video.id).show();
    if ($('#items_container ul li').length === twitch.itemsCount) {
        twitch.pageLoading = false;
    }
}

////////////

twitch.search_type_changed = function() {
    twitch.gui.current_page = 1;
    $('#items_container').empty();
    searchType = $("#searchTypes_select a.active").attr("data-value");
    category = $("#categories_select a.active").attr("data-value");
    $('#search p').empty();
    if (searchType === 'navigation') {
        $("#orderBy_select").hide();
        $("#orderBy_label").hide();
        $("#categories_label").show();
        $("#categories_select").show();
        $("#dateTypes_select").hide();
        $("#searchFilters_select").hide();
        $('#video_search_query').prop('disabled', true);
        if (category === 'games') {
            twitch.itemsCount = 0;
            twitch.channelBrowsing = false;
            twitch.gui.current_page == 1;
            twitch.next = "https://api.twitch.tv/kraken/games/top?limit=10&offset=0";
            $('#items_container').empty().append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
            twitch.loadGamesPage();
        } else if (category === 'featured') {
            twitch.itemsCount = 0;
            twitch.channelBrowsing = false;
            twitch.gui.current_page == 1;
            twitch.next = "https://api.twitch.tv/kraken/streams/featured?limit=30&offset=0";
            $('#items_container').empty().append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
            twitch.loadGameChannelsPage();
        } else if (category === 'channels') {
            twitch.itemsCount = 0;
            twitch.channelBrowsing = false;
            twitch.gui.current_page == 1;
            twitch.next = "https://api.twitch.tv/kraken/streams?limit=20&offset=0";
            $('#items_container').empty().append('<ul id="twitch_cont" class="list" style="margin:0;"></ul>').show();
            twitch.loadGameChannelsPage();
        }
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

twitch.play_next = function() {
    try {
        $("li.highlight").next().find("a.start_media").click();
    } catch (err) {
        console.log("end of playlist reached");
        try {
            twitch.gui.changePage();
        } catch (err) {
            console.log('no more videos to play');
        }
    }
}

twitch.loadMore = function() {
    twitch.pageLoading = true;
    if (searchType === "navigation") {
        if (category === 'games') {
            if (!twitch.channelBrowsing) {
                twitch.loadGamesPage();
            } else {
                twitch.loadGameChannelsPage();
            }
        } else if (category === 'channels') {
            twitch.loadGameChannelsPage();
        }
    } else {
        twitch.gui.changePage();
    }
}

// functions
function appendVideo(video) {
    video.id = ((Math.random() * 1e6) | 0);
    var html = '<li id="' + video.id + '" class="list-row" style="margin:0;padding:0;"> \
		<span class="optionsTop" style="display:none;"></span> \
		<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-facetime-video"></i>' + _("Channels: ") + video.channels + '</span> \
		</div> \
		<div class="mvthumb"> \
			<img src="' + video.thumbnail + '" /> \
		</div> \
		<div> \
			<img class="coverPlayImg ' + video.class + '" style="display:none;" data="' + encodeURIComponent(JSON.stringify(video)) + '" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
		</div> \
		<p class="coverInfosTitle" title="' + video.title + '">' + video.title + '</p> \
		</li>';
    $("#twitch_cont").append(html);
    if ($('#items_container ul li').length === twitch.itemsCount) {
        twitch.pageLoading = false;
    }
}

module.exports = twitch;