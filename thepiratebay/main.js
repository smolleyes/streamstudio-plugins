/********************* engine config *************************
**************************************************************/

var tpb = {};
tpb.engine_name = 'Thepiratebay';
tpb.type="video";
tpb.totalPages = 0;
tpb.currentPage = 0;
tpb.itemsCount = 0;
tpb.pageLoading = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var os = require('os');
var i18n = require("i18n");
var fs = require('fs');
var piratebay = require('thepiratebay');
var _ = i18n.__;
var Iterator = require('iterator').Iterator;

/****************************/

// module global vars
var searchType = 'search';

// init module
tpb.init = function(gui,ht5) {
	$('#pagination').hide();
    tpb.gui = ht5;
    loadEngine();
    //play videos
    $(ht5.document).off('click', '.preload_tpb_torrent');
    $(ht5.document).on('click', '.preload_tpb_torrent', function(e) {
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
        tpb.gui.showPopup(html, 'body')
    });

    $(ht5.document).off('mouseenter', '#tpb_cont .list-row');
    $(ht5.document).on('mouseenter', '#tpb_cont .list-row', function(e) {
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

    $(ht5.document).off('mouseleave', '#tpb_cont .list-row');
    $(ht5.document).on('mouseleave', '#tpb_cont .list-row', function(e) {
        if ($(this).find('.optionsTop').is(':visible')) {
            $(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
            $(this).find('.coverPlayImg').fadeOut("fast");
        }
    });

    $(ht5.document).off('click','.preload_tpbPlay_torrent');
    $(ht5.document).on('click','.preload_tpbPlay_torrent',function(e){
        e.preventDefault();
        tpb.gui.saveTorrent = false;
        tpb.gui.torrentSaved = false;
        tpb.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = obj.link;
        var id = ((Math.random() * 1e6) | 0);
		saveTorrent = false;
        var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;'+obj.background+'"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>'+obj.title+'</h3><br><img style="width:180;height:240px;" src="'+obj.cover+'" /><br><br> \
        <button type="button" id="tpb_play_'+id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" class="closePopup play_tpb_torrent btn btn-success"> \
            <span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span> \
        </button>  \
        <button type="button" class="closePopup download_tpb_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="tpb_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'">  \
            <span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span>  \
            </span>  \
        </button>';

        if(tpb.gui.freeboxAvailable) {
            html += '<button type="button"  href="'+obj.torrent+'" class="closePopup download_tpb_torrentFile_fbx downloadText btn btn-info" id="tpb_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>';
        }
        html += '<br/><br/><div><label>'+_("Keep torrent file after downloading ?")+'</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
        // show
        tpb.gui.showPopup(html, 'body')
        
    });
    
    $(ht5.document).off('click','.play_tpb_torrent');
    $(ht5.document).on('click','.play_tpb_torrent',function(e){
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        console.log(obj)
        tpb.gui.getAuthTorrent(decodeURIComponent(obj.magnet),true,false, obj.cover);
        $('#playerToggle')[0].click();
    });
    
    $(ht5.document).off('click','.download_tpb_torrentFile');
    $(ht5.document).on('click','.download_tpb_torrentFile',function(e){
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        tpb.gui.getAuthTorrent(decodeURIComponent(obj.magnet),false,false);
    });
    
    $(ht5.document).off('click','.download_tpb_torrentFile_fbx');
    $(ht5.document).on('click','.download_tpb_torrentFile_fbx',function(e){
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        console.log(obj)
        tpb.gui.addFreeboxDownload(decodeURIComponent(obj.magnet));
    });
}

function loadEngine() {
/********************* Configure locales *********************/
var localeList = ['en', 'fr'];
i18n.configure({
	defaultLocale: 'en',
    locales:localeList,
    directory: tpb.gui.pluginsDir + 'thepiratebay/locales',
    updateFiles: true
});

if ($.inArray(tpb.gui.settings.locale, localeList) >-1) {
	console.log('Loading thepiratebay engine with locale' + tpb.gui.settings.locale);
	i18n.setLocale(tpb.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

// menus needed by the module and menu(s) loaded by default
tpb.menuEntries = ["orderBy"];
tpb.defaultMenus = ["orderBy"];
// orderBy filters and default entry
tpb.orderBy_filters = JSON.parse('{"'+_("Name desc")+'":"1","'+_("Name asc")+'":"2","'+_("Date desc")+'":"3","'+_("Date asc")+'":"4","'+_("Size desc")+'":"5","'+_("Size asc")+'":"6","'+_("Seeds desc")+'":"7","'+_("Seeds asc")+'":"8","'+_("Leeches desc")+'":"9","'+_("Leeches asc")+'":"10"}');
tpb.defaultOrderBy = '7';
// others params
tpb.has_related = false;
tpb.orderFiltersLoaded = false;

}

// search videos
tpb.search = function (query, options,gui) {
    tpb.gui = gui;
    tpb.pageLoading = true;
	var page = options.currentPage - 1;
	if(page == 0) {
		$('#items_container').empty().append('<ul id="tpb_cont" class="list" style="margin:0;"></ul>').show();
		tpb.itemsCount = 0;
	}
	tpb.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	tpb.currentPage = tpb.gui.current_page;
    var videos = {};
	piratebay.search(query, {
		category: '0',
		page: page,
		orderBy: options.orderBy
	}).then(function(results){
		if(parseInt(results[0].total) == 0 ) {
            $('#loading').hide();
            $("#search_results p").empty().append(_("No results found..."));
            $("#search").show();
            $("#pagination").hide();
            return;
        }
        // add new items to total items count for lazy loading
		tpb.itemsCount += 30;
		tpb.totalItems = parseInt(results[0].total);
		$("#search_results p").empty().append(_("%s results found",tpb.totalItems));
		analyseResults(results);
	}).catch(function(err){
		console.log(err)
        return;
	});
}

function analyseResults(list) {
	var favMainList = tpb.gui.sdb.find();
    var favList = [];
    Iterator.iterate(favMainList).forEach(function (item,index) {
        if(item.hasOwnProperty('serieName')) {
            favList.push(item);
        }
    });
  Iterator.iterate(list).forEach(function (item) {
		var video = {};
		video.link = item.link;
		video.magnet = item.magnetLink;
		video.title = item.name.replace(/\./g,' ');
		video.size = item.size;
		video.seeders = item.seeders;
		video.leechers = item.leechers;
		video.date = item.uploadDate;
		//video.torrent = item.torrentLink;
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
                video.background = 'background: url('+tpb.gui.confDir+'/images/'+video.favId+'-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box';
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
	$('#search_results p').empty().append(_("%s results founds", tpb.totalItems)).show();
	$('#search').show();
}

tpb.search_type_changed = function() {
	tpb.gui.current_page = 1;
	$('#items_container').empty();
	searchType = $("#searchTypes_select a.active").attr("data-value");
	$("#searchTypesMenu_label").hide();
	$("#searchTypes_select").hide();
	$("#searchTypes_label").hide();
	$("#dateTypes_select").hide();
	$("#searchFilters_label").hide();
	$("#searchFilters_select").hide();
	$("#categories_label").hide();
	$("#categories_select").hide();
	$("#orderBy_label").show();
	$("#orderBy_select").show();
	$('#video_search_query').prop('disabled', false);
}

tpb.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			tpb.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

tpb.loadMore = function() {
	tpb.pageLoading = true;
	tpb.gui.changePage();
}

function * checkDb(video) {
    try {
        yield tpb.gui.sdb.find({
            "title": video.title
        });
    } catch (err) {
        return err;
    }
}

function * checkSerieDb(video) {
    try {
        yield tpb.gui.sdb.find({
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
    tpb.gui.sdb.find({"title":video.title},function(err,result){
        if(!err){
          if(result.length > 0 ) {
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
		<img class="tpbthumb" style="float:left;" /> \
		</div> \
		<div> \
			<img class="coverPlayImg preload_tpbPlay_torrent" style="display:none;" data="" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
			<span><i class="glyphicon ' + video.quality + '"></i>' + video.hd + '</span> \
			<span style="float:right;"><a href="#" class="preload_tpb_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
			' + video.toggle + ' \
		</div> \
		<p class="coverInfosTitle" title="' + video.title + '">' + text + '</p> \
		<div id="torrent_' + video.id + '"> \
		</div> \
		</li>';
    $("#tpb_cont").append(html);
    $.get(video.link, function(res) {
        try {
            var img = 'http:'+$(".torpicture", res).find('img').attr('src');
        } catch (err) {
            var img = "images/tpb.gif";
        }
        if (img === "http:undefined") {
            var img = "images/tpb.gif";
        }
        if (video.synopsis == undefined) {
            video.synopsis = $(".nfo", res).html()
        }
        video.cover = img.replace('file:', 'http:');
        $('#' + video.id + ' img').attr('src', video.cover);
        $('#' + video.id + ' .preload_tpb_torrent').attr('data', encodeURIComponent(JSON.stringify(video)));
        $('#' + video.id + ' .coverPlayImg').attr('data', encodeURIComponent(JSON.stringify(video)));
        $('#' + video.id).show();
    });
    if ($('#items_container ul li').length === tpb.itemsCount) {
        tpb.pageLoading = false;
    }

}

module.exports = tpb;
