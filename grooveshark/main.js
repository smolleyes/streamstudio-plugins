/********************* engine name **************************/

var gshark = {};
gshark.engine_name = 'Grooveshark';
gshark.initialized = false;
gshark.position = null;
gshark.type="audio";

/********************* Node modules *************************/

var GS = require('grooveshark-streaming');
var groov = require('groovr');
var http = require('http');
var $ = require('jquery');
var path = require('path');
var i18n = require("i18n");
var _ = i18n.__;
var __ = require('underscore');

/****************************/

// global var
var has_more = true;
var gs_win;
var old_count = 0;

gshark.init = function(gui,ht5) {
	gshark.gui = ht5;
	// load engine
	loadEngine();
	
	// gshark
	$(ht5.document).off('click','.preload_gs');
	$(ht5.document).on('click','.preload_gs',function(){
		$(".mejs-overlay").show();
		$(".mejs-layer").show();
		$(".mejs-overlay-play").hide();
		$(".mejs-overlay-loading").show();
		var origins = $(this).attr("data");
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
		var id = song.id;
		$('#gshark_item_'+id).empty().append("<p> Loading song, please wait...</p>")
		$('.highlight').removeClass('highlight well');
		GS.Grooveshark.getStreamingUrl(id, function(err, streamUrl) {
			console.log("play: " + streamUrl)
			$("#cover").remove();
			$('#gshark_item_'+id).empty().append('<div class="resolutions_container"><a class="video_link" style="display:none;" href="'+streamUrl+'" alt="360p"><span></span></a><a class="download_gs" href="#" data="'+origins+'" title="Download"><img src="images/down_arrow.png" width="16" height="16" />Download mp3</a></div>');
			var media= {};
			media.link = streamUrl;
			media.title = song.author +' - '+song.title;
			media.type='object.item.audioItem.musicTrack';
			gshark.gui.startPlay(media);
			$('#gshark_item_'+song.id).closest('.list-row').addClass('highlight well');
			var img = song.thumbnail;
			if (img.indexOf('album.png') == -1 ) {
				img = song.thumbnail.replace('120_','');
			}
			$('.mejs-container').append('<div id="fbxMsg" style="height:calc(100% - 60px);"><div style="top: 50%;position: relative;"><img style="margin-left: 50%;left: -100px;position: relative;top: 50%;margin-top: -100px;" src="'+img+'" /><h3 style="font-weight:bold;text-align: center;">'+media.title+'</h3></div></div>');
		});
	});
	
	
	$(ht5.document).off('click','.preload_gs_album');
	$(ht5.document).on('click','.preload_gs_album',function(e){
		e.preventDefault();
		$('#loading').show();
		$('#search').hide();
		$('#items_container').empty().hide();
		var album = JSON.parse(decodeURIComponent($(this).attr("data")));
		gshark.getAlbumSongs(album.id)
	});
	
	$(ht5.document).off('click','.preload_gs_playlist');
	$(ht5.document).on('click','.preload_gs_playlist',function(e){
		e.preventDefault();
		$('#loading').show();
		$('#search').hide();
		$('#items_container').empty().hide();
		var playlist = JSON.parse(decodeURIComponent($(this).attr("data")));
		gshark.getPlaylistSongs(playlist.id)
	});
	
	$(ht5.document).off('click','.download_gs');
	$(ht5.document).on('click','.download_gs',function(e){
		e.preventDefault();
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
		GS.Grooveshark.getStreamingUrl(song.id, function(err, streamUrl) {
			var title = song.author +' - '+song.title+'.mp3';
			var id = song.id;
			console.log('downloading : '+title)
			gshark.gui.downloadFile(streamUrl,title,id,false);
			if (activeTab !== 4) {
				$("#downloads_tab").click();
			}
		});
	});
}

function loadEngine() {
/********************* Configure locales *********************/
var localeList = ['en', 'fr'];
i18n.configure({
	defaultLocale: 'en',
    locales:localeList,
    directory: gshark.gui.pluginsDir + 'grooveshark/locales',
    updateFiles: true
});

if ($.inArray(gshark.gui.settings.locale, localeList) >-1) {
	console.log('Loading gshark engine with locale' + gshark.gui.settings.locale);
	i18n.setLocale(gshark.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

// engine config
gshark.menuEntries = ["searchTypes","categories"];
gshark.defaultSearchType = 'search';
gshark.defaultMenus = ["searchTypes"];
gshark.searchTypes = JSON.parse('{"'+_("Songs")+'":"songs","'+_("Albums")+'":"albums","'+_("Playlists")+'":"playlists","'+_("Populars")+'":"popular"}');
//gshark.orderBy_filters = JSON.parse('{"'+_("Date")+'":"age","'+_("Track number")+'":"track","'+_("Name")+'":"name"}');
gshark.has_related = false;
var totalItems = 0;
var currentSearch = "";
gshark.search_type_changed();
gshark.initialized = true;
gshark.searchType = 'search';
gshark.searchInit = false;
gshark.albumsCount = 0;
gshark.playlistsCount = 0;
gshark.songsCount = 0;
gshark.ignoreSection = false;

}

gshark.search = function(query,options) {
	gshark.currentSearch = query;
	gshark.searchInit = false;
	gshark.ignoreSection = false;
	gshark.position = null;
	if ((query === '') && (options.searchType !== 'popular')) {
		$('#video_search_query').attr('placeholder','').focus();
		$('#loading').hide();
		$('#search').show();
		return;
	}
	if (options.searchType === 'popular') {
		gshark.getPopulars();
	} else if (options.searchType === 'songs') {
		gshark.searchSongs(query);
	} else if (options.searchType === 'albums') {
		gshark.searchAlbums(query);
	} else if (options.searchType === 'playlists') {
		gshark.searchPlaylists(query);
	}
}

gshark.searchSongs = function(query) {
	groov.search({type:'Songs',query:query},function(err,songs) {
		$('#search').show();
		$('#loading').hide();
		$('#items_container').show();
		var list = __.chain(songs)
		  .sortBy(function(d) { return d.SongName })
		  .uniq(function(d) { return d.SongName })
		  .value()
		gshark.print_songs(list);
	});
}

gshark.getPopulars = function() {
	groov.getPopular(function(err,songs) {
		$('#search').show();
		$('#loading').hide();
		$('#items_container').show();
		gshark.print_songs(songs);
	});
}

gshark.searchAlbums = function(query) {
	groov.search({type:'Albums',query:query},function(err,albums) {
		$('#search').show();
		$('#loading').hide();
		$('#items_container').show();
		gshark.print_albums(albums);
	});
}

gshark.searchPlaylists = function(query) {
	groov.search({type:'Playlists',query:query},function(err,playlists) {
		$('#search').show();
		$('#loading').hide();
		$('#items_container').show();
		gshark.print_playlists(playlists);
	});
}

gshark.getAlbumSongs = function(id) {
	groov.getAlbumSongs(id,function(err,songs) {
		$('#search').show();
		$('#loading').hide();
		$('#items_container').show();
		var list = __.chain(songs)
		  .sortBy(function(d) { return d.Name })
		  .uniq(function(d) { return d.Name })
		  .value()
		gshark.print_songs(list);
	});
}

gshark.getPlaylistSongs = function(id) {
	groov.getPlaylistSongs(id,function(err,songs) {
		$('#search').show();
		$('#loading').hide();
		$('#items_container').show();
		var list = __.chain(songs)
		  .sortBy(function(d) { return d.Name })
		  .uniq(function(d) { return d.Name })
		  .value()
		gshark.print_songs(list);
	});
}


gshark.search_type_changed = function() {
	gshark.searchType = $("#searchTypes_select option:selected").val();
	if (gshark.searchType === 'popular') {
		$('#video_search_query').prop('disabled', true);
		$('#video_search_btn').click();
	} else {
		$('#video_search_query').prop('disabled', false);
	}
}

gshark.print_songs = function(list) {
	$('#items_container').empty().append('<ul id="gshark_cont" class="list" style="margin:0;"></ul>');
	totalItems = list.length;
	$('#search_results p').empty().append('<span>'+totalItems+' '+_("available songs")+'</span>');
	$.each(list,function(index,song){
		var s = {};
		s.title = song.Name ? song.Name : song.SongName;
		s.thumbnail = "http://images.gs-cdn.net/static/albums/120_";
		song.CoverArtFilename ? s.thumbnail+=song.CoverArtFilename : s.thumbnail+="album.png";
		s.id = song.SongID;
		s.duration = gshark.gui.secondstotime(song.EstimateDuration);
		s.author = song.ArtistName;
		s.album = song.AlbumName;
		if ($('#gshark_item_'+s.id).length === 1) {return;}
		var html = '<li class="list-row" style="margin:0;padding:0;height:170px;"> \
						<div class="mvthumb"> \
							<img src="'+s.thumbnail+'" style="float:left;width:100px;height:100px;" /> \
						</div> \
						<div style="margin: 0 0 0 105px;"> \
							<a href="#" class="preload_gs item-title" data="'+encodeURIComponent(JSON.stringify(s))+'">'+s.title+'</a> \
							<div class="item-info"> \
								<span><b>'+_("Artist: ")+'</b>'+s.author+'</span> \
							</div> \
							<div class="item-info"> \
								<span><b>'+_("Album: ")+'</b>'+s.album+'</span> \
							</div> \
							<div class="item-info"> \
								<span><b>'+_("Duration: ")+'</b>'+s.duration+'</span> \
							</div> \
							<div class="item-info" id="gshark_item_'+s.id+'"> \
							</div> \
						</div>  \
					</li>';
				$("#gshark_cont").append(html);
	});
}

gshark.print_albums = function(list) {
	$('#items_container').empty().append('<ul id="gshark_cont" class="list" style="margin:0;"></ul>');
	totalItems = list.length;
	$('#search_results p').empty().append('<span>'+totalItems+' '+_("available albums")+'</span>');
	$.each(list,function(index,album){
		var s = {};
		s.title = album.AlbumName ? album.Name : album.SongName;
		s.thumbnail = "http://images.gs-cdn.net/static/albums/120_";
		album.CoverArtFilename ? s.thumbnail+=album.CoverArtFilename : s.thumbnail+="album.png";
		s.id = album.AlbumID;
		s.tracks = album.TrackNum;
		s.author = album.ArtistName;
		s.album = album.AlbumName;
		if ($('#gshark_item_'+s.id).length === 1) {return;}
		var html = '<li class="list-row" style="margin:0;padding:0;height:170px;"> \
						<div class="mvthumb"> \
							<img src="'+s.thumbnail+'" style="float:left;width:100px;height:100px;" />\
						</div> \
						<div style="margin: 0 0 0 105px;"> \
							<a href="#" class="preload_gs_album item-title" data="'+encodeURIComponent(JSON.stringify(s))+'">'+s.title+'</a> \
							<div class="item-info"> \
								<span><b>'+_("Artist: ")+'</b>'+s.author+'</span> \
							</div> \
							<div class="item-info"> \
								<span><b>'+_("Album: ")+'</b>'+s.album+'</span> \
							</div> \
							<div class="item-info"> \
								<span><b>'+_("Tracks: ")+'</b>'+s.tracks+'</span> \
							</div> \
							<div class="item-info" id="gshark_item_'+s.id+'"> \
							</div> \
						</div>  \
					</li>';
				$("#gshark_cont").append(html);
	});
}

gshark.print_playlists = function(list) {
	$('#items_container').empty().append('<ul id="gshark_cont" class="list" style="margin:0;"></ul>');
	totalItems = list.length;
	$('#search_results p').empty().append('<span>'+totalItems+' '+_("available playlists")+'</span>');
	$.each(list,function(index,playlist){
		var s = {};
		s.title = playlist.Name ? playlist.Name : playlist.SongName;
		s.thumbnail = "http://images.gs-cdn.net/static/playlists/70_";
		if(playlist.Picture && playlist.Picture.indexOf('-') !== -1) {
			s.thumbnail+=playlist.Picture.split('-')[0]+'.jpg'
		} else {
			playlist.Picture ? s.thumbnail+=playlist.Picture : "http://images.gs-cdn.net/static/albums/120_album.png";
		}
		s.id = playlist.PlaylistID;
		s.tracks = playlist.NumSongs;
		s.author = playlist.FName;
		if ($('#gshark_item_'+s.id).length === 1) {return;}
		var html = '<li class="list-row" style="margin:0;padding:0;"> \
						<div class="mvthumb"> \
							<img src="'+s.thumbnail+'" style="float:left;width:100px;height:100px;" />\
						</div> \
						<div style="margin: 0 0 0 105px;"> \
							<a href="#" class="preload_gs_playlist item-title" data="'+encodeURIComponent(JSON.stringify(s))+'">'+s.title+'</a> \
							<div class="item-info"> \
								<span><b>'+_("Author: ")+'</b>'+s.author+'</span> \
							</div> \
							<div class="item-info"> \
								<span><b>'+_("Tracks: ")+'</b>'+s.tracks+'</span> \
							</div> \
							<div class="item-info" id="gshark_item_'+s.id+'"> \
							</div> \
						</div>  \
					</li>';
				$("#gshark_cont").append(html);
	});
}

module.exports = gshark;
