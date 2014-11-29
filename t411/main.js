/********************* engine name **************************/

var t411 = {};
t411.engine_name = 'T411';
t411.initialized = false;
t411.type="video";
t411.topArray = [];
t411.lazyStart = 0;
t411.lazyLength = 0;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var i18n = require("i18n");
var _ = i18n.__;

/****************************/

// global var
var t411_win;
var videos_responses = new Array();

t411.init = function(gui,ht5,notif) {
  t411.mainWin = gui;
  t411.gui = ht5;
  t411.notif = notif;
  t411.page;
  t411.ignore_section = false;
  
  if (t411.initialized === false ) {
    $('#items_container').empty()
    //load page
    $.get('http://www.t411.me',function(res){
        if ($('.loginBar span',res)[0].innerHTML === '|') {
          t411.notif({title: 'Ht5streamer:',cls:'red',icon: '&#59256;',timeout:0,content:_("Please login to the website with the Always connected option checked then close the window to continue... !"),btnId:'showPage',btnTitle:_('Ok'),btnColor:'black',btnDisplay: 'block',updateDisplay:'none'});
          $('#showPage').click(function(e) {
              e.preventDefault();
              t411.page = t411.mainWin.Window.open('http://www.t411.me/users/login/', {
                    "position":"center",
                    "width": 880,
                    "height": 800,
                    "show": true
              });
              t411.page.on('loaded', function(){
                console.log('page loaded')
                
              });
              t411.page.on('close', function() {
                this.hide();
                this.close(true);
                t411.initialized = true;
                $('#search').show();
                $("#search_results").empty().append('<p>'+_("t411 engine loaded successfully...")+'</p>');
//t411.loadMenus();
              });
          });
        // si resélection du plugin
        } else if ($('#categories_select option').length === 0) {
            t411.notif({title: 'Ht5streamer:',cls:'green',icon: '&#10003;',content:_("t411.me connexion ok !"),btnId:'',btnTitle:'',btnColor:'',btnDisplay: 'none',updateDisplay:'none'});
            $('#search').show();
            $("#search_results").empty().append('<p>'+_("t411 engine loaded successfully...")+'</p>');
            //t411.loadMenus();
            t411.initialized = true;
        } else {
            t411.notif({title: 'Ht5streamer:',cls:'green',icon: '&#10003;',content:_("t411.me connexion ok !"),btnId:'',btnTitle:'',btnColor:'',btnDisplay: 'none',updateDisplay:'none'});
            $('#search').show();
            $("#search_results").empty().append('<p>'+_("t411 engine loaded successfully...")+'</p>');
            t411.initialized = true;
        }
    });
}
  
  // load engine
  loadEngine();
  //play videos
  $(ht5.document).off('click','.preload_t411_torrent');
  $(ht5.document).on('click','.preload_t411_torrent',function(e){
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = 'http://'+obj.link;
        var id = obj.id;
        $('.highlight').removeClass('highlight well');
		$(this).closest('li').addClass('highlight well');
        $.get(link, function(res) {
            var table = $("article", res).html()
            table += $(".accordion",res).html();
            obj.torrent = 'http://www.t411.me/torrents'+$('a.btn',res)[1].href.replace(/(.*?)\/torrents/,'');
            $('#fbxMsg').empty();
            $('#fbxMsg').append('<div id="fbxMsg_header"><h3>'+obj.title+'</h3><a href="#" id="closePreview">X</a></div><div id="fbxMsg_downloads" class="well"></div><div class="nano"><div id="fbxMsg_content" class="nano-content"></div></div>');
            $('#preloadTorrent').remove();
			$('.mejs-overlay-button').hide();
            $('.download-torrent').remove();
            // add play button
			$('#fbxMsg_downloads').append('<button type="button" id="t411_play_'+id+'" data="" class="play_t411_torrent btn btn-success" style="margin-right:20px;"> \
											<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span>\
										  </button>');
			$('#t411_play_'+id).attr('data',encodeURIComponent(JSON.stringify(obj)));
			// downloads buttons
			$('#fbxMsg_downloads').append('<button type="button" class="download_t411_torrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="t411_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span></span></button>');
			if(t411.gui.freeboxAvailable) {
				$('#fbxMsg_downloads').append('<button type="button"  href="'+obj.torrent+'" class="download_t411_torrentFile_fbx downloadText btn btn-info" id="omg_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>');
			}
			// clean preview
			$('#fbxMsg_content').append(table);
			$('#fbxMsg_content a').attr('href','#');
			// show
            $('#fbxMsg').slideDown('slow',function() { setTimeout(function() {t411.gui.updateScroller() },1000); $('#fbxMsg_content a,b,span,p,u,tr,td,table,thead').css('color','white') });
        })
    });
    
    $(ht5.document).off('click','.play_t411_torrent');
    $(ht5.document).on('click','.play_t411_torrent',function(e){
        e.preventDefault();
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
		t411.gui.getAuthTorrent(obj.torrent,true);
		$('#fbxMsg').slideUp();
		$('#playerToggle')[0].click();
    });
    
    $(ht5.document).off('click','.download_t411_torrentFile');
    $(ht5.document).on('click','.download_t411_torrentFile',function(e){
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        t411.gui.getAuthTorrent(obj.torrent,false,false);
    });
     
    $(ht5.document).off('click','.download_t411_torrentFile_fbx');
    $(ht5.document).on('click','.download_t411_torrentFile_fbx',function(e){
        e.preventDefault();
        console.log('download torrent clicked')
        var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        t411.gui.getAuthTorrent(obj.torrent,false,true);
    });
	
  
  
}

function loadEngine() {
/********************* Configure locales *********************/
var localeList = ['en', 'fr', 'es'];
i18n.configure({
	defaultLocale: 'en',
    locales:localeList,
    directory: t411.gui.pluginsDir + 't411/locales',
    updateFiles: true
});
if ($.inArray(t411.gui.settings.locale, localeList) >-1) {
	console.log('Loading t411 engine with locale' + t411.gui.settings.locale);
	i18n.setLocale(t411.gui.settings.locale);
} else {
	i18n.setLocale('en');
}

// menus needed by the module and menu(s) loaded by default
t411.menuEntries = ["searchTypes","orderBy"];
t411.defaultMenus = ["searchTypes","orderBy"];
// searchTypes menus and default entry
t411.searchTypes = JSON.parse('{"'+_("Search")+'":"search","'+_("Top 100")+'":"top100"}');
t411.defaultSearchType = 'search';
// orderBy filters and default entry
t411.orderBy_filters = JSON.parse('{"'+_("Date")+'":"added","'+_("Seeds")+'":"seeders","'+_("Size")+'":"size"}');
t411.defaultOrderBy = 'seeders';
//t411.search_type_changed();

}


t411.search = function(query,options) {
  t411.currentSearch = query;
  t411.lazyStart = 0;
  t411.lazyLength = 0;
  videos_responses = new Array();
  if (t411.searchType === 'top100') {
      var link = "http://www.t411.me/top/100/";
      var videos = {};
    $.get(link,function(res){
      var list = $('table.results tbody tr',res);
	  if(list.length === 0 ) {
		  $('#loading').hide();
		  $("#search_results p").empty().append(_("No results found..."));
		  $("#search").show();
		  $("#pagination").hide();
		  return;
	  }
	  try {
		  videos.totalItems = 100;
		  analyseResults(videos,list);
	  } catch(err) {
		 videos.totalItems = 100;
		 analyseResults(videos,list);
	  }
   });
  } else {
    if (query !== '') {
        var method = NaN;
        $('#loading').show();
        $('#search').hide();
        var page = options.currentPage - 1;
        var link = "http://www.t411.me/torrents/search/?search="+query.replace(/ /g,'+')+"&order="+options.orderBy+"&cat=210&type=desc&page="+page;
        var videos = {};
        $.get(link).done(function( res ) {
		  var list = $('table.results tbody tr',res);
          if(list.length === 0 ) {
              $('#loading').hide();
              $("#search_results p").empty().append(_("No results found..."));
              $("#search").show();
              $("#pagination").hide();
              return;
		  }
          try {
			  videos.totalItems = parseInt($('.pagebar a',res).last().prev().text().split('-')[1].trim());
			  analyseResults(videos,list);
		  } catch(err) {
			 videos.totalItems = list.length;
			 analyseResults(videos,list);
		  }
      });
    } else {
        $('#loading').hide();
        $('#search').show();
        $('#video_search_query').attr('placeholder','').focus();
        return;
    }
  }
}

function analyseResults(videos,list) {
  videos.total = list.length;
  videos.items = [];
  $.each(list,function(index,item) {
      var infos = {};
      infos.link = $($(this).find('td')[1]).find('a').attr('href');
      infos.title = $($(this).find('td')[1]).find('a').text().replace(/\./g,' ');
      infos.seeders = $($(this).find('td')[7]).text();
      infos.size = $($(this).find('td')[5]).text();
      storeVideosInfos(videos,infos,index);
  });
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
  if (videos[0].totalItems > 50) {
    totalPages = Math.round(videos[0].totalItems / 50);
  }
  if (t411.gui.current_page === 1) {
      if (t411.searchType === 'search') {
        t411.gui.init_pagination(totalItems,50,false,true,totalPages);
        $("#pagination").show();
      }
  } else {
	if (t411.searchType !== 'search') {
		t411.gui.init_pagination(totalItems,50,false,true,0);
		$("#pagination").show();
	}
  }
  $('#items_container').empty().append('<ul id="t411_cont" class="list" style="margin:0;"></ul>').show();
  var list;
  if (t411.searchType === 'top100') {
	  t411.topArray = videos[0].items;
	  t411.lazyLength = 100;
	  list = videos[0].items.slice(0,10);
	  t411.lazyStart = 10;
	  appendVideos(list);
  } else {
	  t411.topArray = videos[0].items;
	  t411.lazyLength = videos[0].items.length;
	  if(t411.lazyLength < 10 ) {
		  t411.lazyStart = t411.lazyLength;
		  list = videos[0].items;
	  } else {
		  t411.lazyStart = 10;
		  list = videos[0].items.slice(0,10);
	  }
	  appendVideos(list);
  }
}

t411.loadMore = function() {
	var list;
	if (t411.searchType === 'top100') {
		list = t411.topArray.slice(t411.lazyStart, t411.lazyStart + 10);
		t411.lazyStart += 10;
		appendVideos(list);
	} else {
		if (t411.lazyStart + 10 > t411.lazyLength) {
			list = t411.topArray.slice(t411.lazyStart,t411.lazyLength);
			t411.lazyStart = t411.lazyLength;
		} else {
			list = t411.topArray.slice(t411.lazyStart, t411.lazyStart + 10);
			t411.lazyStart += 10;
		}
		appendVideos(list);
	}
}


function appendVideos(list) {
	// load videos in the playlist
	$.each(list,function(index,video) {
		if(t411.gui.engine['engine_name'] !== 'T411') {
			$('#loading').hide();
			$("#loading p").empty().append(_("Loading videos..."));
			$("#search").hide();
			$("#pagination").hide();
			return false;
		}
    var viewed = "none";
    t411.gui.sdb.find({"title":video.title},function(err,result){
        if(!err){
          if(result.length > 0 ) {
            viewed = "block"
          }
        } else { 
          console.log(err)
        }
    })
		var req = $.get('http:'+video.link,function(res) {
        video.id = ((Math.random() * 1e6) | 0);
        try {
            var img = $($('article',res).find('img')[0]).attr('src');
            if(img.match(/wink|affiche_film|prez/) !== null) {
				var img = $($('article',res).find('img')[1]).attr('src');
			}
        } catch(err) {
            var img = "images/T411.png";
        }
		var html = '<li class="list-row" style="margin:0;padding:0;height:170px;"> \
							<div class="mvthumb"> \
                <span class="viewedItem" style="display:'+viewed+';"><i class="glyphicon glyphicon-eye-open"></i>'+_("Already watched")+'</span> \
								<img src="'+img+'" style="float:left;width:100px;height:125px;" /> \
							</div> \
							<div style="margin: 0 0 0 105px;"> \
								<a href="#" class="preload_t411_torrent item-title" data="'+encodeURIComponent(JSON.stringify(video))+'">'+video.title+'</a> \
								<div class="item-info"> \
									<span><b>'+_("Size: ")+'</b>'+video.size+'</span> \
								</div> \
								<div class="item-info"> \
									<span><b>'+_("Seeders: ")+'</b>'+video.seeders+'</span> \
								</div> \
							</div>  \
							<div id="torrent_'+video.id+'"> \
							</div> \
						</li>';
				$("#t411_cont").append(html);
				if (t411.searchType === 'top100') {
					$("#search_results").empty().append('<p>'+_("showing %s results on 100 (scroll to show more...)",$("#t411_cont li").length)+'</p>');
				}
      });
	});
}

t411.search_type_changed = function() {
    t411.searchType = $("#searchTypes_select option:selected").val();
    t411.lazyStart = 0;
    if (t411.searchType === 'top100') {
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
