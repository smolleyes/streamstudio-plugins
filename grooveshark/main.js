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
		var self = $(this);
		var song = JSON.parse(decodeURIComponent($(this).attr("data")));
		var id = song.id;
		$('#time_'+id).hide();
		$('#gshark_item_'+id).text(_("Loading song, please wait...")).show();
		gshark.gui.activeItem($('#gshark_item_'+id).closest('.list-row_small').find('.coverInfosTitle'));
		GS.Grooveshark.getStreamingUrl(id, function(err, streamUrl) {
			$('#time_'+id).show();
			$('#gshark_item_'+id).text(_("Download"));
			$('#gshark_item_'+id).attr('title',_("Download"));
			$('#gshark_item_'+id).css('margin-right','0');
			console.log("play: " + streamUrl)
			$("#cover").remove();
			$('#gshark_item_'+id).attr('data',origins).show();
			var media= {};
			media.link = streamUrl;
			media.title = song.author +' - '+song.title;
			media.type='object.item.audioItem.musicTrack';
			media.cover = song.thumbnail;
			gshark.gui.startPlay(media);
			var img = song.thumbnail;
			self.attr('data',encodeURIComponent(JSON.stringify(song)));
			var marg = "-65px";
			var top = "-150px";
			var pos = "50%";
			if(gshark.gui.transcoderEnabled) {
				pos = '140px';
			}
			$('.mejs-container').append('<div id="fbxMsg2" style="height:calc(100% - 75px);"><div style="top: '+top+';position: relative;"><img style="margin-left: 50%;left: '+marg+';position: relative;top: 50%;margin-top: -150px;" src="'+img+'" /><h3 style="font-weight:bold;text-align: center;">'+media.title+'</h3></div></div>');
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

	$(ht5.document).off('mouseenter','#gshark_cont .list-row_small');
	$(ht5.document).on('mouseenter','#gshark_cont .list-row_small',function(e){
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

	$(ht5.document).off('mouseleave','#gshark_cont .list-row_small');
	$(ht5.document).on('mouseleave','#gshark_cont .list-row_small',function(e){
		if($(this).find('.optionsTop').is(':visible')) {
			$(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
			$(this).find('.coverPlayImg').fadeOut("fast");
		}
	});
}

function loadEngine() {
/********************* Configure locales *********************/
var localeList = ['en', 'fr','it','de','gr','es'];
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
gshark.defaultSearchType = 'songs';
gshark.defaultMenus = ["searchTypes"];
gshark.searchTypes = JSON.parse('{"'+_("Songs")+'":"songs","'+_("Albums")+'":"albums","'+_("Playlists")+'":"playlists","'+_("Populars")+'":"popular"}');
//gshark.orderBy_filters = JSON.parse('{"'+_("Date")+'":"age","'+_("Track number")+'":"track","'+_("Name")+'":"name"}');
gshark.has_related = false;
var totalItems = 0;
var currentSearch = "";
gshark.search_type_changed();
gshark.initialized = true;
gshark.searchType = 'songs';
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
		  .uniq(function(d) { return d.SongName.toLowerCase() })
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
		  .uniq(function(d) { return d.Name.toLowerCase() })
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
		  .uniq(function(d) { return d.Name.toLowerCase() })
		  .value()
		gshark.print_songs(list);
	});
}


gshark.search_type_changed = function() {
	gshark.searchType = $("#searchTypes_select a.active").attr("data-value");
	if (gshark.searchType === 'popular') {
		$('#video_search_query').prop('disabled', true);
		$('#video_search_btn').click();
	} else {
		$('#video_search_query').prop('disabled', false);
	}
}

gshark.print_songs = function(list) {
	$('#items_container').empty().append('<ul id="gshark_cont" class="list"></ul>');
	totalItems = list.length;
	$.each(list,function(index,song){
		var s = {};
		s.title = song.Name ? song.Name : song.SongName;
		s.thumbnail = "http://images.gs-cdn.net/static/albums/200_";
		song.CoverArtFilename ? s.thumbnail+=song.CoverArtFilename : s.thumbnail+="album.png";
		s.id = song.SongID;
		s.duration = gshark.gui.secondstotime(song.EstimateDuration);
		s.author = song.ArtistName;
		s.album = song.AlbumName;
		if ($('#gshark_item_'+s.id).length === 1) {return;}
		var ftitle = s.author+' - ' + s.title;
		if(ftitle.length > 40){
			text = ftitle.substring(0,40)+'...';
		} else {
			text = ftitle;
		}
		var id = ((Math.random() * 1e6) | 0);
		var html = '<li id="'+id+'" class="list-row_small"> \
						<span class="optionsTop" style="display:none;"></span> \
						<div id="optionsTopInfos" style="display:none;"> \
							<span><i class="glyphicon glyphicon-user"></i>'+s.author+'</span> \
						</div> \
						<div class="mvthumb_small"> \
							<img src="'+s.thumbnail+'" /> \
						</div> \
						<span class="optionsBottom" style="display:none;bottom:0;"></span> \
						<div id="optionsBottomInfos" style="display:none;bottom:0;"> \
							<span id="time_'+s.id+'"><i class="glyphicon glyphicon-time"></i>'+s.duration+'</span> \
							<a id="gshark_item_'+s.id+'" style="display:none;float:right;margin-right:5px;" class="download_gs" data="" href="#"> \
								<i class="glyphicon glyphicon-download"></i>'+_("Download")+' \
							</a> \
						</div> \
						<div> \
							<img class="coverPlayImg preload_gs" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(s))+'" /> \
						</div> \
						<a href="#" style="bottom:-25px;" class="coverInfosTitle" title="'+text+'">'+text+'</a> \
					</li>';
				$("#gshark_cont").append(html);
				$('#search_results p').empty().append('<span>'+$("#gshark_cont li").length+' '+_("available songs")+'</span>');
	});
}

gshark.print_albums = function(list) {
	$('#items_container').empty().append('<ul id="gshark_cont" class="list"></ul>');
	totalItems = list.length;
	$.each(list,function(index,album){
		var s = {};
		s.title = album.AlbumName ? album.Name : album.SongName;
		s.thumbnail = "http://images.gs-cdn.net/static/albums/200_";
		album.CoverArtFilename ? s.thumbnail+=album.CoverArtFilename : s.thumbnail+="album.png";
		s.id = album.AlbumID;
		s.tracks = album.TrackNum;
		s.author = album.ArtistName;
		s.album = album.AlbumName;
		if ($('#gshark_item_'+s.id).length === 1) {return;}
		var id = ((Math.random() * 1e6) | 0);
		var ftitle = s.author+' - ' + s.title;
		if(ftitle.length > 40){
			text = ftitle.substring(0,40)+'...';
		} else {
			text = ftitle;
		}
		var html = '<li id="'+id+'" class="list-row_small"> \
						<span class="optionsTop" style="display:none;"></span> \
						<div id="optionsTopInfos" style="display:none;"> \
						<span><i class="glyphicon glyphicon-user"></i>'+s.author+'</span> \
						</div> \
						<div class="mvthumb_small"> \
							<img src="'+s.thumbnail+'" />\
						</div> \
						<span class="optionsBottom" style="display:none;bottom:0;"></span> \
						<div id="optionsBottomInfos" style="display:none;bottom:0;"> \
							<span style="display:block;max-width:100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"><i class="glyphicon glyphicon-music"></i>'+s.album+'</span> \
						</div> \
						<div> \
							<img class="coverPlayImg preload_gs_album" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(s))+'" /> \
						</div> \
						<a href="#" style="bottom:-25px;" class="coverInfosTitle" title="'+text+'">'+text+'</a> \
					</li>';
				$("#gshark_cont").append(html);
				$('#search_results p').empty().append('<span>'+$("#gshark_cont li").length+' '+_("available albums")+'</span>');
	});
}

gshark.print_playlists = function(list) {
	$('#items_container').empty().append('<ul id="gshark_cont" class="list"></ul>');
	totalItems = list.length;
	$.each(list,function(index,playlist){
		var s = {};
		s.title = playlist.Name ? playlist.Name : playlist.SongName;
		s.thumbnail = "http://images.gs-cdn.net/static/playlists/200_";
		if(playlist.Picture && playlist.Picture.indexOf('-') !== -1) {
			s.thumbnail+=playlist.Picture.split('-')[0]+'.jpg'
		} else {
			playlist.Picture ? s.thumbnail+=playlist.Picture : "http://images.gs-cdn.net/static/albums/120_album.png";
		}
		s.id = playlist.PlaylistID;
		s.tracks = playlist.NumSongs;
		s.author = playlist.FName;
		var ftitle = s.author+' - ' + s.title;
		if(ftitle.length > 40){
			text = ftitle.substring(0,40)+'...';
		} else {
			text = ftitle;
		}
		if ($('#gshark_item_'+s.id).length === 1) {return;}
		var id = ((Math.random() * 1e6) | 0);
		var html = '<li id="'+id+'" class="list-row_small"> \
						<span class="optionsTop" style="display:none;"></span> \
						<div id="optionsTopInfos" style="display:none;"> \
						<span><i class="glyphicon glyphicon-list-alt"></i>'+_("Tracks: ")+s.tracks+'</span> \
						</div> \
						<div class="mvthumb_small"> \
							<img src="'+s.thumbnail+'" />\
						</div> \
						<div> \
							<img class="coverPlayImg preload_gs_playlist" style="display:none;margin: -50px 0 0 -100px;" data="'+encodeURIComponent(JSON.stringify(s))+'" /> \
						</div> \
						<a href="#" style="bottom: -25px;" class="coverInfosTitle" title="'+text+'">'+text+'</a> \
					</li>';
				$("#gshark_cont").append(html);
				$('#search_results p').empty().append('<span>'+$("#gshark_cont li").length+' '+_("available playlists")+'</span>');
	});
}

module.exports = gshark;
