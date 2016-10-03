/********************* engine name **************************/

var mp3stream = {};
mp3stream.engine_name = 'Mp3stream';
mp3stream.defaultSearchType = 'populars';
mp3stream.type="audio";

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var i18n = require("i18n");
var _ = i18n.__;
var under = require('underscore')

/****************************/
// module global vars
var videos_responses = new Array();
var has_more = true;
var init = false;
var browser_mode= false;
mp3stream.current_station_id = '';

// init module
mp3stream.init = function(gui,ht5) {
    mp3stream.gui = ht5;
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
	});

	$(ht5.document).off('click','.mp3-artist-row');
	$(ht5.document).on('click','.mp3-artist-row',function(e){
		e.preventDefault();
		$('#loading').show();
		$("#search").hide();
		$('#albums ul').empty();
		var artist = JSON.parse(decodeURIComponent($(this).attr("data")));
		$("#loading p").empty().append(_("Loading "+artist.name+"'s albums..."));
		mp3stream.load_artist_albums(artist);
	});

 $(ht5.document).off('click','.mp3-album-row');
	$(ht5.document).on('click','.mp3-album-row',function(e){
		e.preventDefault();
		$('#loading').show();
		$("#search").hide();
		$('#songs ul').empty();
		var album = JSON.parse(decodeURIComponent($(this).attr("data")));
		$("#loading p").empty().append(_("Loading songs of %s 's album...",album.title));
		mp3stream.load_album_songs(album);
	});

	$(ht5.document).off('click','.mp3-song-row');
	$(ht5.document).on('click','.mp3-song-row',function(e){
		e.preventDefault();
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
		$("#loading p").empty().append(_("Loading song %s...",song.title));
		mp3stream.gui.player.playTrackId(song.id)
	});

	$(ht5.document).off('click','.download_sgFile');
	$(ht5.document).on('click','.download_sgFile',function(e){
		e.preventDefault();
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
			var title = song.title+'.mp3';
			var id = song.id;
			mp3stream.gui.downloadFile(song.link,title,id,false);
	});

	$(ht5.document).off('mouseenter','#mp3stream_cont .list-row_small');
	$(ht5.document).on('mouseenter','#mp3stream_cont .list-row_small',function(e){
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

	$(ht5.document).off('mouseleave','#mp3stream_cont .list-row_small');
	$(ht5.document).on('mouseleave','#mp3stream_cont .list-row_small',function(e){
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
    directory: mp3stream.gui.pluginsDir + 'mp3stream/locales',
    updateFiles: true
});

if ($.inArray(mp3stream.gui.settings.locale, localeList) >-1) {
	console.log('Loading mp3stream engine with locale ' + mp3stream.gui.settings.locale);
	i18n.setLocale(mp3stream.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

/********************* engine config *************************
**************************************************************/

// menus needed by the module and menu(s) loaded by default
mp3stream.menuEntries = ["searchTypes"];
mp3stream.defaultMenus = ["searchTypes"];
// searchTypes menus and default entry
mp3stream.searchTypes = JSON.parse('{"'+_("Artists")+'":"artists"}');
mp3stream.defaultSearchType = 'artists';
// others params
mp3stream.has_related = false;

}

mp3stream.search_type_changed = function() {
	mp3stream.searchType = $("#searchTypes_select a.active").attr("data-value");
	if (mp3stream.searchType === 'search') {
		$('#video_search_query').prop('disabled', false);
		$("#searchFilters_select").hide();
		$("#searchFilters_label").hide();
	} else if (mp3stream.searchType === 'populars') {
		$("#searchFilters_select").show();
		$("#searchFilters_label").show();
	} else {
		$("#searchFilters_select").hide();
		$("#searchFilters_label").hide();
	}
}

// search videos
mp3stream.search = function (query, options, gui){
	try {
		mp3stream.gui = gui;
		videos_responses = new Array();
		var page = options.currentPage;
		mp3stream.searchType = options.searchType;
		var req;
		if (mp3stream.searchType === 'artists') {
			$.get('https://musicmp3.ru/search.html?text='+query+'&all=artists',function(res) {
				$("#loading p").empty().append(_("Searching for %s",query));
				var data = $(res+' .content').find('a.artist_preview__title');
				mp3stream.analyse_search_artists(data,query);
			});
		} else if (mp3stream.searchType === 'albums') {
			$.get('https://musicmp3.ru/search.html?text='+query+'&all=albums',function(res) {
				$("#loading p").empty().append(_("Loading populars playlist..."));
				console.log(res)
				//mp3stream.load_stations(res);
			});
		} else if (mp3stream.searchType === 'songs') {
			$.get('https://musicmp3.ru/search.html?text='+query+'&all=songs',function(res) {
				$("#loading p").empty().append(_("Loading populars playlist..."));
				console.log(res)
				//mp3stream.load_stations(res);
			});
		}
	} catch(err) {
		console.log(err);
	}
}


mp3stream.analyse_search_artists = function(datas,query) {
	if(datas.length === 0 ) {
		$('#loading').hide();
		$("#search_results p").empty().append(_("No results found for your query %",query));
		$("#search").show();
		$('#items_container').show();
	}
	var artists = []
	$.each(datas,function(index,s) {
		var artist = {}
		artist.link = $(this).attr('href');
		artist.name = $(this).text();
		artists.push(artist)
	});
	mp3stream.load_artists(artists)
}

mp3stream.analyse_search = function(datas,query) {
	var list = $("div.sz-station-basic", datas);
	var stations = {}
	stations.station_ids = [];
	$.each(list,function(index,s) {
		var id = $($("div.sz-station-basic",s).context).attr('data-sz-station-id');
		stations.station_ids.push(id);
		if (index+1 === list.length) {
			$("#search_results p").empty().append(_('%s results found for your search %s',list.length,query));
			mp3stream.load_genre_stations(stations);
		}
	});
}


mp3stream.load_artists = function(artists) {
	$("#search_results p").empty().append(_('%s artists found ...',_(artists.length)));
	mp3stream.loadLayout()
	$.each(artists,function(index,artist) {
		artist.cover = "images/Playlist.png"
		$.get('http://ws.audioscrobbler.com/2.0/?method=artist.search&artist='+artist.name+'&api_key=43a12a39f46a8104341bfb964fc21430&format=json',function(res) {
			var results = res.results.artistmatches.artist;
			if(results.length > 0) {
				under.each(results,function(art) {
					if(art.name.toLowerCase() == artist.name.toLowerCase()) {
						var obj = under.findWhere(art.image,{size:'large'})
						artist.cover = obj['#text']
					}
				})
			}
			var id = ((Math.random() * 1e6) | 0);
			var html = `
			<li class="mp3-artist-row" id="${id}" data="${encodeURIComponent(JSON.stringify(artist))}">
				<img src="${artist.cover}" class="mp3-cover">
				<span class="mp3-artist-text">${artist.name}</span>
			</li>`;
			$("#artists ul").append(html);
			$('#loading').hide();
			$("#search").show();
			$('#items_container').show();
		});
	});
}

mp3stream.load_artist_albums = function(artist) {
	$.get('https://musicmp3.ru'+artist.link,function(res) {
		artist.biography = $(res).find('.biography').html()
		artist.albums = []
		$(res).find('.album_report').map(function(index,item) {
			var album = {};
			album.artist=artist.name;
			console.log(item)
			album.title = $(item).find('.album_report__name').text();
			album.cover=$(item).find('.album_report__image').attr("src").indexOf("no_image") == -1 ? $(item).find('.album_report__image').attr("src") : 'images/Playlist.png';
			album.link=$(item).find('.album_report__link').attr("href");
			album.date=$(item).find('.album_report__date').text();
			console.log(album)
			$('#albums ul').append(`
				<li class="mp3-album-row" data="${encodeURIComponent(JSON.stringify(album))}">
					<img src="${album.cover}" class="mp3-cover">
					<h5 class="mp3-album-title">${album.title}<br><span class="mp3-album-date">${album.date}</span></h5>
				</li>`
			);
			artist.albums.push(album)
		})
		$('#loading').hide();
		$("#search").show();
	})
}

mp3stream.load_album_songs = function(album) {
	var sessionId;
	mp3stream.gui.player.cleanTracks()
	mp3stream.gui.win.cookies.getAll({'domain' : 'musicmp3.ru'} , function (cookies) { sessionId = cookies[0].value })
	$.get('https://musicmp3.ru'+album.link,function(res) {
		album.mainTitle = $(res).find('.page_title__h1').html()
		album.songs = []
		$(res).find('tr.song').map(function(index,item) {
			var song = {};
			song.artist=album.artist;
			song.title = song.artist + ' - ' + $(item).find('span[itemprop="name"]').text();
			song.cover=album.cover;
			song.time = mp3stream.gui.secondstotime(parseInt($(item).find(".jp-seek-bar").attr('data-time')));
			song.rel=$(item).find('.js_play_btn').attr("rel");
			song.type="audio"
			var base = $(res).find('.tracklist').data('url');
			song.id=mp3stream.gui.generateUUID();
			song.link = base+'/'+boo(1+sessionId)+'/'+song.rel;
			mp3stream.gui.player.addTrack(song,true)
			$('#songs ul').append(`
				<li id="${song.id}" class="mp3-song-row" data="${encodeURIComponent(JSON.stringify(song))}">
					<img src="images/play-icon.png" class="song-play-image">
					<h5 class="mp3-album-title">${song.title}<br><span class="mp3-album-date">${song.time}</span></h5>
				</li>`
			);
			album.songs.push(song);
		})
		mp3stream.gui.fromPlayList = true;
		if(mp3stream.gui.player.media.paused) {
			$('.mp3-song-row')[0].click()
		}
		$('#loading').hide();
		$("#search").show();
	})
}


mp3stream.loadLayout = function() {
	$('#items_container').empty().append(`
		<div class="col-lg-12" id="mp3stream_cont">
			<div class="row" style="margin-left: 0px;">
				<div class="col-lg-3 mp3col">
					<h5>${_("Artists")}</h5>
					<div id="artists">
						<ul></ul>
					</div>
				</div>
				<div class="col-lg-3 mp3col">
				  <h5>${_("Albums")}</h5>
					<div id="albums">
						<ul></ul>
					</div>
				</div>
				<div class="col-lg-6 mp3col">
					<h5>${_("Playlist")}</h5>
					<div id="songs">
						<ul></ul>
					</div>
				</div>
			</div>
		</div>
	`)
}

function boo(d){
  for(var a=1234554321,c=7,b=305419896,e=0;e<d.length;){
    var f=d.charCodeAt(e)&255,a=a^((a&63)+c)*f+(a<<8),b=b+(b<<8^a),c=c+f;e++}a&=-2147483649;b&=-2147483649;d=a.toString(16);c=b.toString(16);
    return("0000"+a.toString(16)).substring(d.length-4)+("0000"+b.toString(16)).substring(c.length-4)
}


mp3stream.play_next = function() {
	mp3stream.gui.player.playNextTrack()
}

mp3stream.play_prev = function() {
	mp3stream.gui.player.playPrevTrack()
}


module.exports = mp3stream;
