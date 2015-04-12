/********************* engine name **************************/

var songza = {};
songza.engine_name = 'Songza';
songza.defaultSearchType = 'populars';
songza.type="audio";

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var i18n = require("i18n");
var _ = i18n.__;

/****************************/
// module global vars
var videos_responses = new Array();
var has_more = true;
var init = false;
var browser_mode= false;
songza.current_station_id = '';

// init module
songza.init = function(gui,ht5) {
    songza.gui = ht5;
    loadEngine();
    $("#loading p").empty().append(_("Loading stations..."));
    //play videos
    $(ht5.document).off('click','.load_genre');
    $(ht5.document).on('click','.load_genre',function(e){
		e.preventDefault();
		$('#loading').show();
		$("#loading p").empty().append(_("Loading stations..."));
		$("#search").hide();
		$('#items_container').empty().hide();
		var station = JSON.parse(decodeURIComponent($(this).attr("data")));
		songza.load_genre_stations(station);
	});
	
	$(ht5.document).off('click','.load_station');
	$(ht5.document).on('click','.load_station',function(e){
		e.preventDefault();
		$('#loading').show();
		$("#loading p").empty().append(_("Loading songs..."));
		$("#search").hide();
		$('#items_container').empty().append('<ul id="songza_cont" class="list"></ul>').show();
		var station = JSON.parse(decodeURIComponent($(this).attr("data")));
		$("#search_results p").empty().append(_("Playing %s station, %s sounds in this playlist",station.name,station.song_count))
		songza.current_station_id = station.id;
		songza.current_station_songsCount = station.song_count;
		songza.load_next(station.id);
	});
	
	$(ht5.document).off('click','.load_gs_song');
	$(ht5.document).on('click','.load_gs_song',function(e){
		e.preventDefault();
		$('.highlight').toggleClass('highlight','false');
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
		var media= {};
		console.log(song)
		media.link = song.listen_url+"&external";
		media.type='object.item.audioItem.musicTrack';
		song.title = song.song.artist.name +' - '+ song.song.title;
		media.title = song.title;
		media.cover = $(this).closest('li').find('.mvthumb_small img').attr('src');
		$('.mejs-overlay-button').hide();
		$('#fbxMsg2').empty().remove();
		$('.mejs-container').append('<div id="fbxMsg2"><div><img src="'+song.cover_url+' /><span>'+song.title+'</span>"</div></div>');
		songza.gui.startPlay(media);
	});
	
	$(ht5.document).off('click','.download_sgFile');
	$(ht5.document).on('click','.download_sgFile',function(e){
		e.preventDefault();
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
			var title = song.title+'.mp3';
			var id = song.id;
			songza.gui.downloadFile(song.link,title,id,false);
	});

	$(ht5.document).off('mouseenter','#songza_cont .list-row_small');
	$(ht5.document).on('mouseenter','#songza_cont .list-row_small',function(e){
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

	$(ht5.document).off('mouseleave','#songza_cont .list-row_small');
	$(ht5.document).on('mouseleave','#songza_cont .list-row_small',function(e){
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
    directory: songza.gui.pluginsDir + 'songza/locales',
    updateFiles: true
});

if ($.inArray(songza.gui.settings.locale, localeList) >-1) {
	console.log('Loading songza engine with locale ' + songza.gui.settings.locale);
	i18n.setLocale(songza.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

/********************* engine config *************************
**************************************************************/

// menus needed by the module and menu(s) loaded by default
songza.menuEntries = ["searchTypes","searchFilters"];
songza.defaultMenus = ["searchTypes","searchFilters"];
// searchTypes menus and default entry
songza.searchTypes = JSON.parse('{"'+_("Populars")+'":"populars","'+_("Search")+'":"search","'+_("Genres")+'":"genres","'+_("Activities")+'":"activities","'+_("Moods")+'":"moods","'+_("Decades")+'":"decades","'+_("Culture")+'":"culture"}');
songza.searchFilters = JSON.parse('{"'+_("Trending")+'":"trending","'+_("All time")+'":"all-time"}');
songza.defaultSearchFilter = "trending";
songza.defaultSearchType = 'populars';
// others params
songza.has_related = false;

}

songza.search_type_changed = function() {
	songza.searchType = $("#searchTypes_select a.active").attr("data-value");
	$('#video_search_query').prop('disabled', true);
	if (songza.searchType === 'search') {
		$('#video_search_query').prop('disabled', false);
		$("#searchFilters_select").hide();
		$("#searchFilters_label").hide();
	} else if (songza.searchType === 'populars') {
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
songza.search = function (query, options, gui){
	try {
		songza.gui = gui;
		videos_responses = new Array();
		var page = options.currentPage;
		songza.searchType = options.searchType;
		if (options.searchFilter === 'alltime') {
			songza.searchFilter = 'all-time';
		} else {
			songza.searchFilter = options.searchFilter;
		}
		var req;
		if (songza.searchType === 'search') {
			$.get('http://anonymouse.org/cgi-bin/anon-www.cgi/http://songza.com/api/1/search/artist?query='+query,function(res) {
				$("#loading p").empty().append(_("Searching for %s",query));
				songza.analyse_search_artists(res,query);
			});
			return;
		}
		if (songza.searchType === 'populars') {
			$.get('http://songza.com/api/1/chart/name/songza/'+songza.searchFilter,function(res) {
				$("#loading p").empty().append(_("Loading populars playlist..."));
				songza.load_stations(res);
			});
			return;
		} else if (songza.searchType === 'genres') {
			req=http.get('http://songza.com/api/1/gallery/tag/genres');
			$("#loading p").empty().append(_("Loading genres playlists..."));
		} else if (songza.searchType === 'activities') {
			req=http.get('http://songza.com/api/1/gallery/tag/activities');
			$("#loading p").empty().append(_("Loading activities playlists..."));
		} else if (songza.searchType === 'decades') {
			req=http.get('http://songza.com/api/1/gallery/tag/decades');
			$("#loading p").empty().append(_("Loading decades playlists..."));
		} else if (songza.searchType === 'moods') {
			req=http.get('http://songza.com/api/1/gallery/tag/moods');
			$("#loading p").empty().append(_("Loading moods playlists..."));
		} else if (songza.searchType === 'culture') {
			req=http.get('http://songza.com/api/1/gallery/tag/culture');
			$("#loading p").empty().append(_("Loading culture playlists..."));
		}
		req.on('response',function(response) { 
			var data = new Array(); 
			response.on("data", function(chunk) {
				data.push(chunk);
			});
			response.on('end',function(){
				var datas = JSON.parse(data.join(''));
				try {
					if (songza.searchType !== 'populars') {
						songza.load_genre(datas);
					}
				} catch(err) {
					console.log(err);
					return;
				}
			});
		});
		req.on('error', function(e) {
			console.log("Got error: " + e.message);
		});
		req.end();
	} catch(err) {
		console.log(err);
	}
}


songza.analyse_search_artists = function(datas,query) {
	if(datas.length === 0 ) {
		$('#loading').hide();
		$("#search_results p").empty().append(_("No results found for your query %",query));
		$("#search").show();
		$('#items_container').show();
	}
	var stations = {}
	stations.station_ids = [];
	$.each(datas,function(index,s) {
		var link = encodeURIComponent(songza.gui.Base64.toBase64('http://songza.com/artist/'+s.id+'/'));
		$.get('http://rxproxy.com/index.php?rxproxyuri='+link,function(res){
			var list = $("li.playable", res);
			$.each(list,function(index2,s) {
				var id = $(this).attr('data-sz-station-id');
				stations.station_ids.push(id);
				if (index2+1 === list.length) {
					if (index+1 === datas.length) {
						$("#search_results p").empty().append(_('%s results found for your search %s',stations.station_ids.length,query));
						songza.load_genre_stations(stations);
					}
				}
			});
		});
	});
}

songza.analyse_search = function(datas,query) {
	var list = $("div.sz-station-basic", datas);
	var stations = {}
	stations.station_ids = [];
	$.each(list,function(index,s) {
		var id = $($("div.sz-station-basic",s).context).attr('data-sz-station-id');
		stations.station_ids.push(id);
		if (index+1 === list.length) {
			$("#search_results p").empty().append(_('%s results found for your search %s',list.length,query));
			songza.load_genre_stations(stations);
		}
	});
}

songza.load_genre = function(datas) {
	$('#loading').hide();
	$("#search").show();
	$('#items_container').empty().append('<ul id="songza_cont" class="list"></ul>').show();
	$("#search_results p").empty().append(_('Stations in the %s section ...',_(songza.searchType)));
	$.each(datas,function(index,genre) {
		var id = ((Math.random() * 1e6) | 0);
		if ($('#songza_item_'+genre.id).length === 1) {return;}
		var html = '<li class="list-row_small" id="'+id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-list-alt"></i>'+_("Stations: ")+genre.station_ids.length+'</span> \
			</div> \
			<div class="mvthumb_small"> \
				<img src="images/Playlist.png"  /> \
			</div> \
			<div> \
				<img class="coverPlayImg load_genre" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(genre))+'" /> \
			</div> \
			<a href="#" style="bottom:-25px;" class="coverInfosTitle load_genre" title="'+genre.name+'" data="'+encodeURIComponent(JSON.stringify(genre))+'">'+genre.name+'</a> \
			<div id="songza_item_'+genre.id+'"> \
			</div> \
		</li>';
		$("#songza_cont").append(html);
		$('#loading').hide();
		$("#search").show();
		$('#items_container').show();
	});
}

songza.load_genre_stations = function(datas) {
	if (songza.searchType !== 'search') {
		$("#search_results p").empty().append(_('Browsing %s section ...',datas.name));
	}
	$('#items_container').empty().append('<ul id="songza_cont" class="list"></ul>');
	$.each(datas.station_ids,function(index,id) {
		$.get('http://anonymouse.org/cgi-bin/anon-www.cgi/http://songza.com/api/1/station/'+id,function(res) {
			var station=res;
			if ($('#songza_item_'+station.id).length === 1) {return;}
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
				<img class="coverPlayImg load_station" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(station))+'" /> \
			</div> \
			<a href="#" style="bottom:-25px;" class="coverInfosTitle load_station" title="'+station.name+'" data="'+encodeURIComponent(JSON.stringify(station))+'">'+station.name+'</a> \
			<div id="songza_item_'+station.id+'"> \
			</div> \
		</li>';
			$("#songza_cont").append(html);
			$('#loading').hide();
			$("#search").show();
			$('#items_container').show();
		});
	});
}

songza.load_stations = function(stations) {
	$("#search_results p").empty().append(_('Stations in the %s section ...',_(songza.searchType)));
	$('#items_container').empty().append('<ul id="songza_cont" class="list"></ul>');
	$.each(stations,function(index,station) {
		var id = ((Math.random() * 1e6) | 0);
		if ($('#songza_item_'+station.id).length === 1) {return;}
		var html = '<li class="list-row_small" id="'+id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-music"></i>'+_("Total sounds: ")+station.song_count+'</span> \
			</div> \
			<div class="mvthumb_small"> \
				<img src="'+station.cover_url+'" /> \
			</div> \
			<div> \
				<img class="coverPlayImg load_station" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(station))+'" /> \
			</div> \
			<p class="coverInfosTitle" style="bottom:-35px;" title="'+station.name+'">'+station.name+'</p> \
			<div id="songza_item_'+station.id+'"> \
			</div> \
		</li>';
		$("#songza_cont").append(html);
		$('#loading').hide();	
		$("#search").show();
		$('#items_container').show();
	});
}

songza.load_next = function(id) {
	if (songza.current_station_songsCount === $("#songza_cont li.youtube_item").length) {
		$("#search_results p").empty().append(_('All songs already loaded in the playlist...'));
		return;
	}
	$("#loading p").empty().append(_("Loading next song..."))
	$("#search").hide();
	$("#pagination").hide();
	$("#loading").show();
	console.log('http://songza.com/api/1/station/'+id+'/next')
	$.get('http://rxproxy.com/index.php?rxproxyuri='+songza.gui.Base64.encode('http://songza.com/api/1/station/'+id+'/next'),function(res) {
		console.log(res)
		if ($('#songza_item_'+res.song.id).length === 1) {return;}
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
		var html = '<li class="list-row_small" id="songza_item_'+res.song.id+'"> \
			<span class="optionsTop" style="display:none;"></span> \
			<div id="optionsTopInfos" style="display:none;"> \
			<span><i class="glyphicon glyphicon-user"></i>'+res.song.artist.name+'</span> \
			</div> \
			<div class="mvthumb_small"> \
				<img src="'+res.song.cover_url+'"/> \
			</div> \
			<div> \
				<img class="coverPlayImg load_gs_song" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(res))+'" /> \
			</div> \
			<span class="optionsBottom" style="display:none;bottom:0;"></span> \
			<div id="optionsBottomInfos" style="display:none;bottom:0;"> \
				<a class="download_sgFile" href="#" style="margin-top:-3px;" data="'+encodeURIComponent(JSON.stringify(media))+'" title="'+_("Download")+'"><span><i class="glyphicon glyphicon-download"></i>'+_("Download")+'</span></a> \
			</div> \
			<p class="coverInfosTitle" style="bottom:-35px;" title="'+text+'">'+text+'</p> \
		</li>';
		$("#songza_cont").append(html);
		$('#loading').hide();
		$("#search").show();
		$('#items_container').show();
		songza.gui.activeItem($('#songza_item_'+res.song.id).closest('.list-row_small').find('.coverInfosTitle'));
		var media= {};
		media.link = res.listen_url+"&external";
		media.title = res.song.artist.name +' - '+ res.song.title;
		media.type='object.item.audioItem.musicTrack';
		media.cover=res.song.cover_url;
		songza.gui.startPlay(media);
		$('.mejs-overlay-button').hide();
		$('#fbxMsg2').empty();
		var pos = "50%";
		if(songza.gui.transcoderEnabled) {
			pos = '140px';
		}
		$('.mejs-container').append('<div id="fbxMsg2" style="height:calc(100% - 60px);"><div style="top:'+pos+';position: relative;"><img style="margin-left: 50%;left: -100px;position: relative;top: 50%;margin-top: -100px;" src="'+res.song.cover_url+'" /><h3 style="font-weight:bold;text-align: center;">'+media.title+'</h3></div></div>');
	});
}

songza.play_next = function() {
	songza.load_next(songza.current_station_id);
}

module.exports = songza;
