/********************* engine config *************************
**************************************************************/

var omgTorrent = {};
omgTorrent.engine_name = 'Omgtorrent';
omgTorrent.type="video";

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var os = require('os');
var i18n = require("i18n");
var fs = require('fs');
var _ = i18n.__;

/****************************/

// module global vars
var searchType = 'navigation';

// init module
omgTorrent.init = function(gui,ht5) {
	$('#pagination').hide();
    $('#search').hide();
    omgTorrent.gui = ht5;
    loadEngine();
    //play videos
    $(ht5.document).off('click','.preload_omg_torrent');
    $(ht5.document).on('click','.preload_omg_torrent',function(e){
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = obj.link;
        var id = obj.id;
        $('.highlight').removeClass('highlight well');
		$(this).closest('li').addClass('highlight well');
     $.get(link, function(res) {
        var table = $(".infos_fiche", res).html();
        obj.torrent = 'http://www.omgtorrent.com'+$('#lien_dl',res).attr("href");
        $('#fbxMsg').empty();
            $('#fbxMsg').append('<div id="fbxMsg_header"><h3>'+obj.title+'</h3><a href="#" id="closePreview">X</a></div><div id="fbxMsg_downloads" class="well"></div><div id="fbxMsg_content"></div>');
            $('#preloadTorrent').remove();
			$('.mejs-overlay-button').hide();
            $('.download-torrent').remove();
            // add play button
			$('#fbxMsg_downloads').append('<button type="button" id="omg_play_'+id+'" data="" class="play_omg_torrent btn btn-success" style="margin-right:20px;"> \
											<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span>\
										  </button>');
			$('#omg_play_'+id).attr('data',encodeURIComponent(JSON.stringify(obj)));
			// downloads buttons
			$('#fbxMsg_downloads').append('<button type="button" class="download_omgTorrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="omg_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span></span></button>');
			if(omgTorrent.gui.freeboxAvailable) {
				$('#fbxMsg_downloads').append('<button type="button"  href="'+obj.torrent+'" class="download_omgTorrentFile_fbx downloadText btn btn-info" id="omg_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>');
			}
			// clean preview
			$('#fbxMsg_content').append($(table).html().replace(/"\/img/g,'"http://omgtorrent.com/img'));
			$($('#fbxMsg_content img')[1]).remove()
			// show
            $('#fbxMsg').slideDown();
   }).error(function(err){
     alert('can t load page '+obj.torrent)
 })
});

$(ht5.document).off('click','.play_omg_torrent');
$(ht5.document).on('click','.play_omg_torrent',function(e){
    e.preventDefault();
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    omgTorrent.gui.getTorrent(obj.torrent);
    $('#fbxMsg').slideUp();
    $('#playerToggle')[0].click();
});

$(ht5.document).off('click','.download_omgTorrentFile');
$(ht5.document).on('click','.download_omgTorrentFile',function(e){
    e.preventDefault();
    console.log('download torrent clicked')
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    omgTorrent.gui.getAuthTorrent(obj.torrent,false,false);
});

$(ht5.document).off('click','.download_omgTorrentFile_fbx');
$(ht5.document).on('click','.download_omgTorrentFile_fbx',function(e){
    e.preventDefault();
    console.log('download torrent clicked')
    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
    omgTorrent.gui.getAuthTorrent(obj.torrent,false,true);
});

}

function loadEngine() {
    /********************* Configure locales *********************/
    var localeList = ['en', 'fr'];
    i18n.configure({
       defaultLocale: 'en',
       locales:localeList,
       directory: omgTorrent.gui.pluginsDir + 'omgtorrent/locales',
       updateFiles: true
   });

    if ($.inArray(omgTorrent.gui.settings.locale, localeList) >-1) {
       console.log('Loading omgtorrent engine with locale' + omgTorrent.gui.settings.locale);
       i18n.setLocale(omgTorrent.gui.settings.locale);
   } else {
       i18n.setLocale('en');
   }

// menus needed by the module and menu(s) loaded by default
omgTorrent.menuEntries = ["searchTypes","orderBy","categories"];
omgTorrent.defaultMenus = ["searchTypes","orderBy"];
// searchTypes menus and default entry
omgTorrent.searchTypes = JSON.parse('{"'+_("Search")+'":"search","'+_("Navigation")+'":"navigation"}');
omgTorrent.defaultSearchType = 'navigation';
// orderBy filters and default entry
omgTorrent.orderBy_filters = JSON.parse('{"'+_("Date")+'":"id","'+_("Seeds")+'":"seeders"}');
omgTorrent.defaultOrderBy = 'id';
// category filters and default entry
omgTorrent.category_filters = JSON.parse('{"'+_("Movies")+'":"films"}');
omgTorrent.defaultCategory = 'films';
// others params
omgTorrent.has_related = false;
omgTorrent.categoriesLoaded = false;

}

// search videos
omgTorrent.search = function (query, options,gui) {
    omgTorrent.gui = gui;
    videos_responses = new Array();
    var page = options.currentPage;
    if(isNaN(page)) {
      page = 1;
      omgTorrent.gui.current_page = 1;
  }
  var url;
  if(searchType === 'search') {
      url='http://www.omgtorrent.com/recherche/?order='+options.orderBy+'&orderby=desc&query='+encodeURIComponent(query)+'&page='+page;
  } else {
      var category = options.category;
      url='http://www.omgtorrent.com/'+category+'/?order='+options.orderBy+'&orderby=desc&page='+page;
  }
  $.get(url,function(res){
      var videos = {};
      var list;
      if(searchType === 'search') {
          list=$($('table.table_corps',res)[0]).find('tr:not(.table_entete)');
      } else {
          list=$('.table_corps tr:not(".table_entete")',res);
      }
      if(list.length === 0 || $('.message.erreur',res).length > 0) {
          $('#loading').hide();
          $("#search_results p").empty().append(_("No results found..."));
          $("#search").show();
          $("#pagination").hide();
          return;
      }
      try {
        var number = parseInt($('.nav a', res).last().prev().text());
        if (isNaN(number)) {
          videos.totalItems = list.length;
      } else {
          videos.totalItems = parseInt(number) * 30;
      }
      analyseResults(videos,list);
  } catch(err) {
    videos.totalItems = list.length;
    analyseResults(videos,list);
}
});
}

function analyseResults(videos,list) {
  videos.total = list.length;
  videos.items = [];
  $.each(list,function(index,item) {
     var infos = {};
     if(searchType === 'search') {
        infos.cat = $(this).find('td')[0].innerHTML;
        infos.link = 'http://www.omgtorrent.com/films'+$(this).find('a')[0].href.replace(/.*\/films/,'').replace('file://','');
        infos.title = $(this).find('a')[0].innerHTML;
        infos.seeds = $(this).find('td')[3].innerHTML;
        infos.leechers = $(this).find('td')[4].innerHTML;
        infos.size = $(this).find('td')[2].innerHTML;
        storeVideosInfos(videos,infos,index);
    } else {
        infos.link = 'http://www.omgtorrent.com/films'+$(this).find('a')[0].href.replace(/.*\/films/,'').replace('file://','');
        infos.title = $($(this).find('a')[0]).text();
        infos.seeds = $(this).find('td')[3].innerHTML;
        infos.leechers = $(this).find('td')[4].innerHTML;
        infos.size = $(this).find('td')[2].innerHTML;;
        storeVideosInfos(videos,infos,index);
    }
});
}

omgTorrent.search_type_changed = function() {
	searchType = $("#searchTypes_select").val();
	if(searchType === 'search') {
		$("#categories_select").hide();
		$("#categories_label").hide();
		$("#search p").empty().append(_("<p>omgtorrent %s section</p>",searchType));
       $('#video_search_query').prop('disabled', false);
   } else {
      if (omgTorrent.categoriesLoaded === false) {
         $('#categories_select').empty();
         $.each(omgTorrent.category_filters, function(key, value){
            $('#categories_select').append('<option value="'+value+'">'+key+'</option>');
        });
         $("#categories_select").val(omgTorrent.defaultCategory);
         omgTorrent.categoriesLoaded = true;
         $('#video_search_query').prop('disabled', true);
         $('#video_search_btn')[0].click();
     }
     $("#categories_select").show();
     $("#categories_label").show();
     $("#search p").empty().append(_("<p>omgtorrent %s section</p>",searchType));
 }
}

omgTorrent.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			omgTorrent.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

// store videos and return it in the right order...
function storeVideosInfos(video,infos,num) {
    video.items.push(infos); 
    videos_responses[num]=video;
    if (videos_responses.length == video.total) {
        print_videos(videos_responses);
        videos_responses = new Array();
    }
}


// functions
function print_videos(videos) {
	$('#loading').hide();
	$("#loading p").empty().append(_("Loading videos..."));
	$("#search").show();
  $("#pagination").show();

	// init pagination if needed
  var totalItems = videos[0].totalItems;
  var totalPages = 1;
  if (videos[0].totalItems > 30) {
    totalPages = Math.round(videos[0].totalItems / 30);
}
if (omgTorrent.gui.current_page === 1) {
  if (searchType === 'search') {
    omgTorrent.gui.init_pagination(totalItems,30,false,true,totalPages);
} else {
    omgTorrent.gui.init_pagination(0,30,true,true,0);
}
$("#pagination").show();
} else {
  if (searchType !== 'search') {
      omgTorrent.gui.init_pagination(0,30,true,true,0);
  } else {
	omgTorrent.gui.init_pagination(totalItems,30,false,true,0);
  }
}

    // load videos in the playlist
    $('#items_container').empty().append('<ul id="omgtorrent_cont" class="list" style="margin:0;"></ul>').show();
    $.each(videos[0].items,function(index,video) {
        $.get(video.link,function(res) {
            video.id = ((Math.random() * 1e6) | 0);
            try {
                var img = 'http://www.omgtorrent.com'+$(".film_img",res).attr('src');
                var css = 'float:left;height:125px;width:100px'
            } catch(err) {
                var img = "images/omgtorrent.png";
                var css = 'float:left;height:45px;width:100px;margin-top:20px;'
            }
            if(img == undefined) {
              var img = "images/omgtorrent.png";
              var css = 'float:left;height:45px;width:100px;margin-top:20px;'
            }
            var html = '<li class="list-row" style="margin:0;padding:0;height:170px;"> \
							<div class="mvthumb"> \
								<img src="'+img+'" style="'+css+'" /> \
							</div> \
							<div style="margin: 0 0 0 105px;"> \
								<a href="#" class="preload_omg_torrent item-title" data="'+encodeURIComponent(JSON.stringify(video))+'">'+video.title+'</a> \
								<div class="item-info"> \
									<span><b>'+_("Size: ")+'</b>'+video.size+'</span> \
								</div> \
								<div class="item-info"> \
									<span><b>'+_("Seeders: ")+'</b>'+video.seeds+'</span> \
								</div> \
								<div class="item-info"> \
									<span><b>'+_("leechers: ")+'</b>'+video.leechers+'</span> \
								</div> \
							</div>  \
							<div id="torrent_'+video.id+'"> \
							</div> \
						</li>';
				$("#omgtorrent_cont").append(html);
        });
    });
}

module.exports = omgTorrent;
