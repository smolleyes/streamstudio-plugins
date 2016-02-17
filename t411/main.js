/********************* engine name **************************/

var t411 = {};
t411.engine_name = 'T411';
t411.initialized = false;
t411.type = "video";
t411.topArray = [];
t411.lazyStart = 0;
t411.lazyLength = 0;
t411.pageLoading = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var i18n = require("i18n");
var _ = i18n.__;
var Iterator = require('iterator').Iterator;

/****************************/

// global var
var t411_win;
var videos_responses = new Array();

t411.init = function(gui, ht5, notif) {
    t411.mainWin = gui;
    t411.gui = ht5;
    t411.notif = notif;
    t411.page;
    t411.ignore_section = false;

    if (t411.initialized === false) {
        $('#items_container').empty()
        //load page
        $.get('http://www.t411.in', function(res) {
            if ($('a:contains("Déconnexion")',res).length == 0) {
                if(t411.gui.settings.t411Username && t411.gui.settings.t411Password) {
                    $.post('http://www.t411.in/users/login/',{ login: ''+t411.gui.settings.t411Username+'', password: ''+t411.gui.settings.t411Password+'', remember: 1 })
                    .done(function(data){
                        if ($('a:contains("Déconnexion")',data).length == 0) {
                            t411.initialized = false;
                            t411.notif({
                                title: 'StreamStudio:',
                                cls: 'red',
                                icon: '&#59256;',
                                content: _("t411.in connexion problem ! :  Invalid username or password..."),
                                btnId: '',
                                btnTitle: '',
                                btnColor: '',
                                btnDisplay: 'none',
                                updateDisplay: 'none',
                                timeout:0
                            });
                        } else {
                            t411.initialized = true;
                            t411.notif({
                                title: 'StreamStudio:',
                                cls: 'green',
                                icon: '&#10003;',
                                content: _("t411.in connexion ok !"),
                                btnId: '',
                                btnTitle: '',
                                btnColor: '',
                                btnDisplay: 'none',
                                updateDisplay: 'none'
                            });
                            $("#search_results").empty().append('<p>' + _("t411 engine loaded successfully...") + '</p>').show();
                        }
                    })
                    .fail(function(error) {
                        t411.initialized = false;
                        t411.notif({
                            title: 'StreamStudio:',
                            cls: 'red',
                            icon: '&#59256;',
                            content: _("t411.in connexion problem ! : "+ error),
                            btnId: '',
                            btnTitle: '',
                            btnColor: '',
                            btnDisplay: 'none',
                            updateDisplay: 'none',
                            timeout:0
                        });
                    })
                } else {
                    t411.notif({
                        title: 'StreamStudio:',
                        cls: 'red',
                        icon: '&#59256;',
                        content: _("Please enter your login informations for t411 engine in the StreamStudio settings !"),
                        btnId: '',
                        btnTitle: '',
                        btnColor: '',
                        btnDisplay: 'none',
                        updateDisplay: 'none'
                    });
                }
            } else if ($('#categories_select option').length === 0) {
                t411.notif({
                    title: 'StreamStudio:',
                    cls: 'green',
                    icon: '&#10003;',
                    content: _("t411.in connexion ok !"),
                    btnId: '',
                    btnTitle: '',
                    btnColor: '',
                    btnDisplay: 'none',
                    updateDisplay: 'none'
                });
                $('#search').show();
                $("#search_results").empty().append('<p>' + _("t411 engine loaded successfully...") + '</p>');
                //t411.loadMenus();
                t411.initialized = true;

                $.get('http://irc.t411.in/ip/index.php',function(res) {
                    var state = $($(res).find('tr:contains("tracker")').find('th')[2]).text()
                    console.log(state)
                    if(state == "ON-LINE") {
                        t411.notif({
                            title: 'StreamStudio:',
                            cls: 'green',
                            icon: '&#10003;',
                            content: _("t411.in Tracker ON-LINE !"),
                            btnId: '',
                            btnTitle: '',
                            btnColor: '',
                            btnDisplay: 'none',
                            updateDisplay: 'none'
                        });
                    } else {
                        t411.notif({
                            title: 'StreamStudio:',
                            cls: 'red',
                            icon: '&#59256;',
                            content: _("t411.in Tracker DOWN !"),
                            btnId: '',
                            btnTitle: '',
                            btnColor: '',
                            btnDisplay: 'none',
                            updateDisplay: 'none',
                            timeout: 0
                        });
                    }
                })

                
            } else {
                t411.notif({
                    title: 'StreamStudio:',
                    cls: 'green',
                    icon: '&#10003;',
                    content: _("t411.in connexion ok !"),
                    btnId: '',
                    btnTitle: '',
                    btnColor: '',
                    btnDisplay: 'none',
                    updateDisplay: 'none'
                });

                $('#search').show();
                $("#search_results").empty().append('<p>' + _("t411 engine loaded successfully...") + '</p>');
                t411.initialized = true;
            }
        });
    }

    // load engine
    loadEngine();
    //play videos
    $(ht5.document).off('click', '.preload_t411_torrent');
    $(ht5.document).on('click', '.preload_t411_torrent', function(e) {
        e.preventDefault();
        t411.gui.initPlayer();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = 'http://' + obj.link;
        var id = obj.id;
        //$('.highlight').removeClass('highlight well');
        //$(this).closest('li').addClass('highlight well');
        t411.gui.showPopup(obj.synopsis, 'body', changeCss)
    });

    $(ht5.document).off('mouseenter', '#t411_cont .list-row');
    $(ht5.document).on('mouseenter', '#t411_cont .list-row', function(e) {
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

    $(ht5.document).off('mouseleave', '#t411_cont .list-row');
    $(ht5.document).on('mouseleave', '#t411_cont .list-row', function(e) {
        if ($(this).find('.optionsTop').is(':visible')) {
            $(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
            $(this).find('.coverPlayImg').fadeOut("fast");
        }
    });

    $(ht5.document).off('click', '.preload_t411Play_torrent');
    $(ht5.document).on('click', '.preload_t411Play_torrent', function(e) {
        e.preventDefault();
        t411.gui.saveTorrent = false;
        t411.gui.torrentSaved = false;
        t411.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = 'http://' + obj.link;
        var id = obj.id;
        saveTorrent = false;
        var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;'+obj.background+'"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>'+obj.title+'</h3><br><img style="width:180;height:240px;" src="'+obj.cover+'" /><br><br> \
        <button type="button" id="t411_play_'+id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" class="closePopup play_t411_torrent btn btn-success"> \
            <span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span> \
        </button>  \
        <button type="button" class="closePopup download_t411_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="t411_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'">  \
            <span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span>  \
            </span>  \
        </button>';

        if(t411.gui.freeboxAvailable) {
            html += '<button type="button"  href="'+obj.torrent+'" class="closePopup download_t411_torrentFile_fbx downloadText btn btn-info" id="t411_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>';
        }
        html += '<br/><br/><div><label>'+_("Keep torrent file after downloading ?")+'</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
        // show
        t411.gui.showPopup(html, 'body')
    });

    $(ht5.document).off('click', '.play_t411_torrent');
    $(ht5.document).on('click', '.play_t411_torrent', function(e) {
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        t411.gui.getAuthTorrent(obj.torrent, true, false, obj.cover);
        t411.gui.itemTitle = obj.title;
        $('#playerToggle')[0].click();
    });

    $(ht5.document).off('click', '.download_t411_torrentFile');
    $(ht5.document).on('click', '.download_t411_torrentFile', function(e) {
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        t411.gui.getAuthTorrent(obj.torrent, false, false);
    });

    $(ht5.document).off('click', '.download_t411_torrentFile_fbx');
    $(ht5.document).on('click', '.download_t411_torrentFile_fbx', function(e) {
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        t411.gui.getAuthTorrent(obj.torrent, false, true);
    });

    $(ht5.document).off('click', '.addToFavorites');
    $(ht5.document).on('click', '.addToFavorites', function(e) {
        e.preventDefault();
        $(this).removeClass('addToFavorites');
        $(this).attr('title', _("Already in your favorites"));
        $(this).find('i').css('color', '#F8963F');
        var title = $(this).attr("data");
        $('#favoritesToggle')[0].click()
        t411.gui.addSerieToDb(title);
    });

}

// changes css callback when info popup is opened
function changeCss() {
    $('.mfp-content p,span,a').css('color', 'white').attr('href', '#');
    $('.mfp-content').find('iframe').remove()
}

function loadEngine() {
    /********************* Configure locales *********************/
    var localeList = ['en', 'fr', 'es'];
    i18n.configure({
        defaultLocale: 'en',
        locales: localeList,
        directory: t411.gui.pluginsDir + 't411/locales',
        updateFiles: true
    });
    if ($.inArray(t411.gui.settings.locale, localeList) > -1) {
        console.log('Loading t411 engine with locale' + t411.gui.settings.locale);
        i18n.setLocale(t411.gui.settings.locale);
    } else {
        i18n.setLocale('en');
    }

    // menus needed by the module and menu(s) loaded by default
    t411.menuEntries = ["searchTypes", "searchFilters","orderBy"];
    t411.defaultMenus = ["searchTypes", "searchFilters","orderBy"];
    // searchTypes menus and default entry
    t411.searchTypes = JSON.parse('{"' + _("Search") + '":"search","' + _("Top 100") + '":"navigation"}');
    t411.defaultSearchType = 'search';
    t411.searchFilters = JSON.parse('{"' + _("All categories") + '":"","'+_("Videos")+'":"210","'+_("Audio")+'":"395","'+_("xXx")+'":"456"}');
    t411.defaultSearchFilter = "";
    // orderBy filters and default entry
    t411.orderBy_filters = JSON.parse('{"' + _("Select a filter") + '":"","' + _("Date") + '":"added","' + _("Seeds") + '":"seeders","' + _("Size") + '":"size"}');
    t411.defaultOrderBy = '';
}


t411.search = function(query, options) {
    t411.currentSearch = query;
    t411.lazyStart = 0;
    t411.lazyLength = 0;
    t411.pageLoading = true;

    try {
        page = options.currentPage - 1;
    } catch (err) {
        page = 0;
        t411.totalItems = 0
        t411.gui.current_page = 1;
    }
    if (page == 0) {
        $('#items_container').empty().append('<ul id="t411_cont" class="list"></ul>').show();
        t411.totalItems = 0
        t411.itemsCount = 0;
    }
    t411.gui.current_page += 1;
    // plugin page must match gui current page for lazy loading
    t411.currentPage = t411.gui.current_page;

    if (t411.searchType === 'navigation') {
        var link = "http://www.t411.in/top/100/";
        var videos = {};
        $.get(link, function(res) {
            var list = $('table.results tbody tr', res).get();
            if (list.length === 0) {
                $('#loading').hide();
                $("#search_results p").empty().append(_("No results found..."));
                $("#search").show();
                $("#pagination").hide();
                return;
            }
            t411.totalItems = 100;
            t411.itemsCount = 10;
            analyseResults(list);
        });
    } else {
        if (query !== '') {
            $('#loading').show();
            $('#search').hide();
            var s = query.replace(/ /g, '+');
            var link = "http://www.t411.in/torrents/search/?search=" + s + "&description=&file=&user=&cat="+options.searchFilter+"&subcat=&page=" + page+"&order="+options.orderBy+"&type=desc";
            var videos = {};
            $.get(link).done(function(res) {
                var list = $('table.results tbody tr', res).get();
                if (list.length === 0) {
                    $('#loading').hide();
                    if(t411.totalItems == 0) {
                        $("#search_results p").empty().append(_("No results found..."));
                    }
                    $("#search").show();
                    $("#pagination").hide();
                    return;
                }
                try {
                    t411.totalItems = parseInt($('.pagebar a', res).last().prev().text().split('-')[1].trim());
                    t411.itemsCount += list.length;
                    analyseResults(list);
                } catch (err) {
                    if(t411.totalItems == 0) {
                      t411.totalItems = $('.results tr', res).length -2;
                    }
                    t411.itemsCount += list.length;
                    analyseResults(list);
                }
            });
        } else {
            $('#loading').hide();
            $('#search').show();
            $('#video_search_query').attr('placeholder', '').focus();
            return;
        }
    }
}

function analyseResults(list) {
    var arr = []
    var favMainList = t411.gui.sdb.find();
    var favList = [];
    Iterator.iterate(favMainList).forEach(function (item,index) {
        if(item.hasOwnProperty('serieName')) {
            favList.push(item);
        }
    });
    Iterator.iterate(list).forEach(function(item, index) {
        var infos = {};
        infos.link = $($(item).find('td')[1]).find('a').attr('href');
        infos.title = $($(item).find('td')[1]).find('a').text().replace(/\./g, ' ');
        infos.quality = infos.title.match(/720|1080/) !== null ? 'glyphicon-hd-video' : 'glyphicon-sd-video';
        infos.hd = infos.title.match(/720/) !== null ? '720p' : infos.title.match(/1080/) !== null ? '1080p' : '';
        infos.seeders = $($(item).find('td')[7]).text();
        infos.size = $($(item).find('td')[5]).text();
        var c = checkDb(infos);
        var l = c.next().value.length;
        infos.css = l > 0 ? 'color:red;float: left;margin-top: 1px;display:block' : 'display:none;';
        infos.viewedTitle = l > 0 ? _("Already watched") : '';
        infos.isSerie = infos.title.toLowerCase().match(/(.*)(s\d{1,3}e\d{1,3}|s\d{1,3}|saison \d{1,3})/) !== null ? true : false;
        infos.isFavorite = false;
        infos.favId = null;
        if(infos.isSerie) {
            infos.serieName = infos.title.toLowerCase().match(/(.*)(s\d{1,3}|saison \d{1,3})/)[1].replace(/\(.*\)/,'').replace('-','').trim();
            Iterator.iterate(favList).forEach(function (item,index) {
                var re = new RegExp(item.query, 'g');
                var re2 = new RegExp(item.serieName, 'g');
                if(item.serieName == infos.serieName || infos.serieName == item.query || infos.serieName.match(re) || infos.serieName.match(re2)) {
                    infos.isFavorite = true;
                    infos.favId = item.id;
                }
            });
            if(infos.isFavorite) {
                infos.background = 'background: url('+t411.gui.confDir+'/images/'+infos.favId+'-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box';
                infos.toggle = '<span style="float:right;"><a href="#" data=""><i class="glyphicon glyphicon-star" style="color:#F8963F" title="'+_('Already in your favorites')+'"></i></span></a>';
            } else {
                infos.background = '';
                infos.toggle = '<span style="float:right;"><a href="#" style="cursor:pointer;" class="addToFavorites" data="'+infos.serieName+'" title="'+_('Add to favorites')+'"><i class="glyphicon glyphicon-star"></i></span></a>';
            }
            arr.push(infos)
        } else {
            infos.toggle = '';
            arr.push(infos)
        }
    });
    $('#loading').hide();
    $('#search').show();
    if (t411.searchType === 'navigation') {
        if (t411.currentPage - 1 == 1) {
            t411.topArray = arr;
            list = arr.slice(0, 10);
            t411.lazyStart = 10;
            appendVideos(list);
        }
    } else {
        $('#search_results p').empty().append(_("%s results founds", t411.totalItems)).show();
        appendVideos(arr);
    }
}

function * checkDb(video) {
    try {
        yield t411.gui.sdb.find({
            "title": video.title
        });
    } catch (err) {
        return err;
    }
}

function * checkSerieDb(video) {
    try {
        yield t411.gui.sdb.find({
            "serieName": video.serieName
        });
    } catch (err) {
        return err;
    }
}

t411.loadMore = function() {
    var list;
    t411.pageLoading = true;
    if (t411.searchType === 'navigation') {
            list = t411.topArray.slice(t411.lazyStart, t411.lazyStart + 10);
            t411.lazyStart += 10;
            t411.itemsCount += 10;
            appendVideos(list);
    } else {
        t411.gui.changePage();
    }
}

function appendVideos(list) {
    // load videos in the playlist
    $.each(list, function(index, video) {
            video.id = ((Math.random() * 1e6) | 0);
            if (video.title.length > 45) {
                text = video.title.substring(0, 45) + '...';
            } else {
                text = video.title;
            }
            var html = '<li id="' + video.id + '" class="list-row" style="margin:0;padding:0;display:none;"> \
        <span class="optionsTop" style="display:none;"></span> \
        <div id="optionsTopInfos" style="display:none;"> \
        <span style="' + video.css + '" title="' + video.viewedTitle + '"><i class="glyphicon glyphicon-eye-open"></i></span> \
        <span><i class="glyphicon glyphicon-cloud-upload"></i>' + video.seeders + '</span> \
        <span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>' + video.size + '</span> \
        </div> \
        <div class="mvthumb"> \
        <img class="t411thumb" style="float:left;" /> \
        </div> \
        <div> \
          <img class="coverPlayImg preload_t411Play_torrent" style="display:none;" data="" /> \
        </div> \
        <span class="optionsBottom" style="display:none;"></span> \
        <div id="optionsBottomInfos" style="display:none;"> \
          <span><i class="glyphicon ' + video.quality + '"></i>' + video.hd + '</span> \
          <span style="float:right;"><a href="#" class="preload_t411_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
          ' + video.toggle + ' \
        </div> \
        <p class="coverInfosTitle" title="' + video.title + '">' + text + '</p> \
        <div id="torrent_' + video.id + '"> \
        </div> \
        </li>';
            $("#t411_cont").append(html);
            $.get('http:' + video.link, function(res) {
                video.synopsis = $("article,.accordion", res).html()
                video.torrent = 'http://www.t411.in/torrents' + $('a.btn', res)[1].href.replace(/(.*?)\/torrents/, '');
                var img = "images/T411.png";
                video.cover = img;
                $('#' + video.id + ' .t411thumb').attr('src', img)
                $('#' + video.id + ' .preload_t411_torrent').attr('data', encodeURIComponent(JSON.stringify(video)));
                $('#' + video.id + ' .coverPlayImg').attr('data', encodeURIComponent(JSON.stringify(video)));
                $('#' + video.id).show();
                var count = $('#items_container .t411thumb:visible').length;
                if (t411.searchType === 'navigation') {
                    $("#search_results").empty().append('<p>' + _("showing %s results on 100 (scroll to show more...)", count) + '</p>').show();
                    if (count === t411.lazyStart || count+1 === t411.lazyStart) {
                        t411.pageLoading = false;
                        $('#search').show();
                        if(!$('.nano-slider').is(':visible')) {
                            t411.loadMore();
                        }
                    }
                } else {
                    if (count === t411.itemsCount || count+1 === t411.itemsCount) {
                        t411.pageLoading = false;
                    }
                }
            });
    });
}

t411.search_type_changed = function() {
    t411.searchType = $("#searchTypes_select a.active").attr("data-value");
    t411.lazyStart = 0;
    if (t411.searchType === 'navigation') {
        $('#video_search_query').prop('disabled', true);
        $('#orderBy_label').hide();
        $('#orderBy_select').hide();
        $('#video_search_btn').click();
    } else {
        $('#video_search_query').prop('disabled', false);
        $('#orderBy_label').show();
        $('#orderBy_select').show();
    }
}


module.exports = t411;
