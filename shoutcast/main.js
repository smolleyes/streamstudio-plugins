/********************* engine name **************************/

var shoutcast = {};
shoutcast.engine_name = 'Shoutcast';
shoutcast.defaultSearchType = 'search';
shoutcast.type="audio";

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var i18n = require("i18n");
var unirest = require('unirest');
var __ = require('underscore');
var XMLHttpRequest = require('xhr2');
var _ = i18n.__;

/****************************/
// module global vars
var videos_responses = new Array();
var has_more = true;
var init = false;
var browser_mode= false;
shoutcast.current_station_id = '';

// init module
shoutcast.init = function(gui,win,doc) {
  	$('#pagination',doc).hide();
    $=win.$
  	shoutcast.gui = win;
  	loadEngine();
    $("#loading p").empty().append(_("Loading stations..."));
    //play videos
    $(doc).off('click','.load_genre');
    $(doc).on('click','.load_genre',function(e){
		e.preventDefault();
		$('#loading').show();
		$("#loading p").empty().append(_("Loading stations..."));
		$("#search").hide();
		$('#items_container').empty().hide();
		var station = JSON.parse(decodeURIComponent($(this).attr("data")));
		shoutcast.load_genre_stations(station);
	});

	$(doc).off('click','.load_station');
	$(doc).on('click','.load_station',function(e){
		e.preventDefault();
		var station = JSON.parse(decodeURIComponent($(this).attr("data")));
		shoutcast.gui.stopIceTimer()
		shoutcast.gui.cleanffar();
		shoutcast.gui.initPlayer();
		if (station.listen_url) {
			$("#search_results p").empty().append(_("Playing %s station",station.stream_name))
			shoutcast.gui.iceCastStation = station.stream_name
			shoutcast.playShoutCast(station.listen_url+'/&shoutcast');
		} else {
			$("#search_results p").empty().append(_("Playing %s station",station.Name))
			shoutcast.gui.iceCastStation = station.Name
			shoutcast.current_station_id = station.ID;
			shoutcast.load_stream(station.ID);
		}
	});

	$(doc).off('click','.load_gs_song');
	$(doc).on('click','.load_gs_song',function(e){
		e.preventDefault();
		$('.highlight').toggleClass('highlight','false');
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
		var media= {};
		console.log(song)
		media.link = song.listen_url+"&shoutcast";
		media.type='object.item.audioItem.musicTrack';
		song.title = song.song.artist.name +' - '+ song.song.title;
		media.title = song.title;
		media.cover = $(this).closest('li').find('.mvthumb_small img').attr('src');
		$('.mejs-overlay-button').hide();
		$('#fbxMsg2').empty().remove();
		$('.mejs-container').append('<div id="fbxMsg2"><div><img src="'+song.cover_url+' /><span>'+song.title+'</span>"</div></div>');
		shoutcast.gui.startPlay(media);
	});

	$(doc).off('click','.download_sgFile');
	$(doc).on('click','.download_sgFile',function(e){
		e.preventDefault();
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
			var title = song.title+'.mp3';
			var id = song.id;
			shoutcast.gui.downloadFile(song.link,title,id,false);
	});

	$(doc).off('mouseenter','#shoutcast_cont .list-row_small');
	$(doc).on('mouseenter','#shoutcast_cont .list-row_small',function(e){
		var self = $(this);
		if($(this).find('.optionsTop').is(':hidden')) {
			setTimeout(function() {
				if ($("li:hover").attr('id') == self.attr('id')) {
					self.find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeIn("fast");
					self.find('.coverPlayImg').fadeIn('fast');
				}
			},100);
		}
	});

	$(doc).off('mouseleave','#shoutcast_cont .list-row_small');
	$(doc).on('mouseleave','#shoutcast_cont .list-row_small',function(e){
		if($(this).find('.optionsTop').is(':visible')) {
			$(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
			$(this).find('.coverPlayImg').fadeOut("fast");
		}
	});
}

function loadEngine() {
/********************* Configure locales *********************/
var localeList = ['en', 'fr','de'];
i18n.configure({
	defaultLocale: 'en',
    locales:localeList,
    directory: shoutcast.gui.pluginsDir + 'shoutcast/locales',
    updateFiles: true
});

if ($.inArray(shoutcast.gui.settings.locale, localeList) >-1) {
	console.log('Loading shoutcast engine with locale ' + shoutcast.gui.settings.locale);
	i18n.setLocale(shoutcast.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

/********************* engine config *************************
**************************************************************/

// menus needed by the module and menu(s) loaded by default
shoutcast.menuEntries = ["searchTypes","searchFilters"];
shoutcast.defaultMenus = ["searchTypes","searchFilters"];
// searchTypes menus and default entry
shoutcast.searchTypes = JSON.parse('{"'+_("Search")+'":"search"}');
shoutcast.searchFilters = JSON.parse('{"'+_("Shoutcast")+'":"shoutcast","'+_("Icecast")+'":"icecast"}');
shoutcast.defaultSearchFilter = "shoutcast";
shoutcast.defaultSearchType = 'search';
// others params
shoutcast.has_related = false;

}

shoutcast.search_type_changed = function() {
	shoutcast.searchType = $("#searchTypes_select a.active").attr("data-value");
	$('#video_search_query').prop('disabled', false);
	if (shoutcast.searchType === 'search') {
		$("#searchFilters_select").show();
		$("#searchFilters_label").show();
	} else if (shoutcast.searchType === 'populars') {
		$('#video_search_query').prop('disabled', false);
		$("#searchFilters_select").show();
		$("#searchFilters_label").show();
		$('#video_search_btn').click();
	} else {
		$("#searchFilters_select").hide();
		$("#searchFilters_label").hide();
		$('#video_search_btn').click();
	}
}

// search videos
shoutcast.search = function (query, options, gui){
	try {
		shoutcast.gui = gui;
		videos_responses = new Array();
		var page = options.currentPage;
		shoutcast.searchType = options.searchType;
		shoutcast.searchFilter = options.searchFilter;
		console.log(options)
		var req;
		if (shoutcast.searchType === 'search') {
			if (shoutcast.searchFilter === 'shoutcast') {
				$("#loading p").empty().append(_("Searching shoutcast for %s", query));
					unirest.post('https://shoutcast.com/Search/UpdateSearch')
				  	.send({ "query": query })
				  	.end(function (response) {
				    shoutcast.loadResults(JSON.parse(response.raw_body),query)
				 });
			} else  {
				$("#loading p").empty().append(_("Searching icecast for %s", query));
				var list;
				$.getJSON('http://api.include-once.org/xiph/cache.php',function(res) {
					list = __.filter(res,function(station) {
						return station.current_song.toLowerCase().indexOf(query) !== -1 || station.genre.toLowerCase().indexOf(query) !== -1 || station.stream_name.toLowerCase().indexOf(query) !== -1;
					})
					list = __.uniq(list, function(item, key, a) {
					    return item.stream_name;
					});
					list = __.sortBy(list, function(item, key, a) {
					    return item.bitrate;
					});
					console.log(list)
					shoutcast.loadResults(list.reverse(),query)
				});
			}
		}
	} catch(err) {
		console.log(err);
	}
}

shoutcast.loadResults = function(datas,query) {
	if(datas.length === 0 ) {
		$('#loading').hide();
		$("#search").show();
		$('#items_container').show();
		$("#search_results p").empty().append(_("No results found for your query %s",query));
		$("#search").show();
		return;
	}
	$("#search_results p").empty().append(_('%s results found for your search %s',datas.length,query));
	if(shoutcast.searchFilter === 'shoutcast') {
		shoutcast.load_stations(datas)
	} else {
		shoutcast.load_icecast_stations(datas)
	}
}

shoutcast.analyse_search_artists = function(datas,query) {
	if(datas.length === 0 ) {
		$('#loading').hide();
		$("#search_results p").empty().append(_("No results found for your query %s",query));
		$("#search").show();
		$('#items_container').show();
	}
	var stations = {}
	stations.station_ids = [];
	$.each(datas,function(index,s) {
		var link = encodeURIComponent(shoutcast.gui.Base64.toBase64('http://shoutcast.com/artist/'+s.id+'/'));
		$.get('http://rxproxy.com/index.php?rxproxyuri='+link,function(res){
			var list = $("li.playable", res);
			$.each(list,function(index2,s) {
				var id = $(this).attr('data-sz-station-id');
				stations.station_ids.push(id);
				if (index2+1 === list.length) {
					if (index+1 === datas.length) {
						$("#search_results p").empty().append(_('%s results found for your search %s',stations.station_ids.length,query));
						shoutcast.load_genre_stations(stations);
					}
				}
			});
		});
	});
}

shoutcast.analyse_search = function(datas,query) {
	var list = $("div.sz-station-basic", datas);
	var stations = {}
	stations.station_ids = [];
	$.each(list,function(index,s) {
		var id = $($("div.sz-station-basic",s).context).attr('data-sz-station-id');
		stations.station_ids.push(id);
		if (index+1 === list.length) {
			$("#search_results p").empty().append(_('%s results found for your search %s',list.length,query));
			shoutcast.load_genre_stations(stations);
		}
	});
}

shoutcast.load_genre = function(datas) {
	$('#loading').hide();
	$("#search").show();
	$('#items_container').empty().append('<ul id="shoutcast_cont" class="list"></ul>').show();
	$("#search_results p").empty().append(_('Stations in the %s section ...',_(shoutcast.searchType)));
	$.each(datas,function(index,genre) {
		var id = ((Math.random() * 1e6) | 0);
		if ($('#shoutcast_item_'+genre.id).length === 1) {return;}
		var html = '<li class="list-row_small" id="'+id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-list-alt"></i>'+_("Stations: ")+genre.station_ids.length+'</span> \
			</div> \
			<div class="mvthumb_small"> \
				<img src="images/Playlist.png"  /> \
			</div> \
			<div> \
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg load_genre" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(genre))+'" /> \
			</div> \
			<a href="#" style="bottom:-25px;" class="coverInfosTitle load_genre" title="'+genre.name+'" data="'+encodeURIComponent(JSON.stringify(genre))+'">'+genre.name+'</a> \
			<div id="shoutcast_item_'+genre.id+'"> \
			</div> \
		</li>';
		$("#shoutcast_cont").append(html);
		$('#loading').hide();
		$("#search").show();
		$('#items_container').show();
	});
}

shoutcast.load_genre_stations = function(datas) {
	if (shoutcast.searchType !== 'search') {
		$("#search_results p").empty().append(_('Browsing %s section ...',datas.name));
	}
	$('#items_container').empty().append('<ul id="shoutcast_cont" class="list"></ul>');
	$.each(datas.station_ids,function(index,id) {
		$.get('http://anonymouse.org/cgi-bin/anon-www.cgi/http://shoutcast.com/api/1/station/'+id,function(res) {
			var station=res;
			if ($('#shoutcast_item_'+station.id).length === 1) {return;}
			var id = ((Math.random() * 1e6) | 0);
			var html = '<li class="list-row_small" id="'+id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-music"></i>'+_("Total sounds: ")+station.song_count+'</span> \
			</div> \
			<div class="mvthumb_small"> \
				<img src="'+station.cover_url+'" /> \
			</div> \
			<div> \
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg load_station" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(station))+'" /> \
			</div> \
			<a href="#" style="bottom:-25px;" class="coverInfosTitle load_station" title="'+station.name+'" data="'+encodeURIComponent(JSON.stringify(station))+'">'+station.name+'</a> \
			<div id="shoutcast_item_'+station.id+'"> \
			</div> \
		</li>';
			$("#shoutcast_cont").append(html);
			$('#loading').hide();
			$("#search").show();
			$('#items_container').show();
		});
	});
}

shoutcast.load_icecast_stations = function(stations) {
	$('#items_container').empty().append('<ul id="shoutcast_cont" class="list"></ul>');
	$.each(stations,function(index,station) {
		var id = ((Math.random() * 1e6) | 0);
		if ($('#shoutcast_item_'+id).length === 1) {return;}
		var html = '<li class="list-row_small" id="'+id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-music"></i>'+_("Bitrate: ")+station.bitrate+' kbps</span> \
			</div> \
			<div class="mvthumb_small"> \
				<img src="images/Icecast_Logo.svg" /> \
			</div> \
			<div> \
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg load_station" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(station))+'" /> \
			</div> \
			<p class="coverInfosTitle" style="bottom:-35px;" title="'+station.stream_name+'">'+station.stream_name+'</p> \
			<div id="shoutcast_item_'+id+'"> \
			</div> \
		</li>';
		$("#shoutcast_cont").append(html);
		$('#loading').hide();
		$("#search").show();
		$('#items_container').show();
	});
}

shoutcast.load_stations = function(stations) {
	$('#items_container').empty().append('<ul id="shoutcast_cont" class="list"></ul>');
	$.each(stations,function(index,station) {
		var id = station.ID;
		if ($('#shoutcast_item_'+id).length === 1) {return;}
		var html = '<li class="list-row_small" id="'+id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-music"></i>'+_("Total listeners: ")+station.Listeners+'</span> \
			</div> \
			<div class="mvthumb_small" style="background:white;"> \
				<img src="images/shoutcast.jpg" style="padding: 0 5px;" /> \
			</div> \
			<div> \
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg load_station" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(station))+'" /> \
			</div> \
			<p class="coverInfosTitle" style="bottom:-35px;" title="'+station.Name+'">'+station.Name+'</p> \
			<div id="shoutcast_item_'+station.id+'"> \
			</div> \
		</li>';
		$("#shoutcast_cont").append(html);
		$('#loading').hide();
		$("#search").show();
		$('#items_container').show();
	});
}

shoutcast.load_stream = function(id) {
	var xhr = new XMLHttpRequest();
	console.log(shoutcast.gui, id)
  xhr.open("GET", 'http://yp.shoutcast.com/sbin/tunein-station.m3u?id='+id);
  xhr.overrideMimeType("audio/x-mpegurl"); // Needed, see below.
  xhr.onload = shoutcast.parseShoutCastM3u;
  xhr.send();
}

shoutcast.parseShoutCastM3u = function() {
  var playlist = shoutcast.gui.M3U.parse(this.response);
  console.log(playlist)
  iceCastStation = playlist[0].artist || playlist[0].title.replace('-1,','')
  shoutcast.playShoutCast(playlist[0].file)
};

shoutcast.playShoutCast = function(stream) {
  var t={}
  t.link=stream+'/&shoutcast';
  t.title=shoutcast.gui.iceCastStation || '';
  shoutcast.gui.startPlay(t)
}

shoutcast.load_next = function(id) {
	if (shoutcast.current_station_songsCount === $("#shoutcast_cont li.youtube_item").length) {
		$("#search_results p").empty().append(_('All songs already loaded in the playlist...'));
		return;
	}
	$("#loading p").empty().append(_("Loading next song..."))
	$("#search").hide();
	$("#pagination").hide();
	$("#loading").show();
	console.log('http://shoutcast.com/api/1/station/'+id+'/next')
	$.get('http://rxproxy.com/index.php?rxproxyuri='+shoutcast.gui.Base64.encode('http://shoutcast.com/api/1/station/'+id+'/next'),function(res) {
		console.log(res)
		if ($('#shoutcast_item_'+res.song.id).length === 1) {return;}
		var media= {};
		media.link = res.listen_url;
		media.id = res.song.id;
		media.title = res.song.artist.name +' - '+ res.song.title;
		var id = ((Math.random() * 1e6) | 0);
		var ftitle = res.song.artist.name+' - '+res.song.title;
		if(ftitle.length > 40){
			text = ftitle.substring(0,40)+'...';
		} else {
			text = ftitle;
		}
		var html = '<li class="list-row_small" id="shoutcast_item_'+res.song.id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-user"></i>'+res.song.artist.name+'</span> \
			</div> \
			<div class="mvthumb_small"> \
				<img src="'+res.song.cover_url+'"/> \
			</div> \
			<div> \
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="coverPlayImg load_gs_song" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(res))+'" /> \
			</div> \
			<span class="optionsBottom" style="display:none;bottom:0;"></span> \
			<div id="optionsBottomInfos" style="display:none;bottom:0;"> \
				<a class="download_sgFile" href="#" style="margin-top:-3px;" data="'+encodeURIComponent(JSON.stringify(media))+'" title="'+_("Download")+'"><span><i class="glyphicon glyphicon-download"></i>'+_("Download")+'</span></a> \
			</div> \
			<p class="coverInfosTitle" style="bottom:-35px;" title="'+text+'">'+text+'</p> \
		</li>';
		$("#shoutcast_cont").append(html);
		$('#loading').hide();
		$("#search").show();
		$('#items_container').show();
		shoutcast.gui.activeItem($('#shoutcast_item_'+res.song.id).closest('.list-row_small').find('.coverInfosTitle'));
		var media= {};
		media.link = res.listen_url+"&shoutcast";
		media.title = res.song.artist.name +' - '+ res.song.title;
		media.type='object.item.audioItem.musicTrack';
		media.cover=res.song.cover_url;
		shoutcast.gui.startPlay(media);
		$('.mejs-overlay-button').hide();
		$('#fbxMsg2').empty();
		var pos = "50%";
		if(shoutcast.gui.transcoderEnabled) {
			pos = '140px';
		}
		$('.mejs-container').append('<div id="fbxMsg2" style="height:calc(100% - 60px);"><div style="top:'+pos+';position: relative;"><img style="margin-left: 50%;left: -100px;position: relative;top: 50%;margin-top: -100px;" src="'+res.song.cover_url+'" /><h3 style="font-weight:bold;text-align: center;">'+media.title+'</h3></div></div>');
	});
}

shoutcast.play_next = function() {
	shoutcast.load_next(shoutcast.current_station_id);
}

module.exports = shoutcast;
