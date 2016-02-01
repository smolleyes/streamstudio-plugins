/********************* engine config *************************
**************************************************************/

var omgTorrent = {};
omgTorrent.engine_name = 'Omgtorrent';
omgTorrent.type="video";
omgTorrent.totalPages = 0;
omgTorrent.currentPage = 0;
omgTorrent.itemsCount = 0;
omgTorrent.pageLoading = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var os = require('os');
var i18n = require("i18n");
var fs = require('fs');
var _ = i18n.__;
var Iterator = require('iterator').Iterator;

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
	    omgTorrent.gui.showPopup(obj.synopsis,'body',changeCss)
	});

	$(ht5.document).off('mouseenter','#omgtorrent_cont .list-row');
	$(ht5.document).on('mouseenter','#omgtorrent_cont .list-row',function(e){
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

	$(ht5.document).off('mouseleave','#omgtorrent_cont .list-row');
	$(ht5.document).on('mouseleave','#omgtorrent_cont .list-row',function(e){
		if($(this).find('.optionsTop').is(':visible')) {
			$(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
			$(this).find('.coverPlayImg').fadeOut("fast");
		}
	});

	$(ht5.document).off('click','.preload_omgTorrentPlay_torrent');
	$(ht5.document).on('click','.preload_omgTorrentPlay_torrent',function(e){
		e.preventDefault();
		omgTorrent.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
		var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
		var link = obj.link;
		var id = obj.id;
		saveTorrent = false;
		var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;'+obj.background+'"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>'+obj.title+'</h3><br><img style="width:180;height:240px;" src="'+obj.cover+'" /><br><br> \
		<button type="button" id="omg_play_'+id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" class="closePopup play_omg_torrent btn btn-success"> \
	    	<span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span> \
	    </button>  \
	    <button type="button" class="closePopup download_omgTorrentFile downloadText btn btn-info" href="'+obj.torrent+'" id="omg_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'">  \
	    	<span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span>  \
	    	</span>  \
	    </button>';

		if(omgTorrent.gui.freeboxAvailable) {
			html += '<button type="button"  href="'+obj.torrent+'" class="closePopup download_omgTorrentFile_fbx downloadText btn btn-info" id="omg_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>';
		}
		html += '<br/><br/><div><label>'+_("Keep torrent file after downloading ?")+'</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
		// show
		omgTorrent.gui.showPopup(html,'body')
	});

	$(ht5.document).off('click','.play_omg_torrent');
	$(ht5.document).on('click','.play_omg_torrent',function(e){
	    e.preventDefault();
	    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	    omgTorrent.gui.getAuthTorrent(obj.torrent,true,false,obj.cover);
	    omgTorrent.gui.itemTitle = obj.title;
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

	$(ht5.document).off('click','.addToFavorites');
	$(ht5.document).on('click','.addToFavorites',function(e){
		e.preventDefault();
		$(this).removeClass('addToFavorites');
		$(this).attr('title',_("Already in your favorites"));
		$(this).find('i').css('color','#F8963F');
		var title = $(this).attr("data");
		$('#favoritesToggle')[0].click()
		omgTorrent.gui.addSerieToDb(title);
	});
}

// changes css callback when info popup is opened
function changeCss() {
  var html = $('.mfp-content').html().replace(/"\/img/g,'"http://omgtorrent.com/img');
  $('.mfp-content').empty().append(html);
  $('.mfp-content').css('text-align','left','important');
  $($('.mfp-content img')[1]).remove()
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
    omgTorrent.pageLoading = true;
	var page = options.currentPage;
	if(page == 1) {
		$('#items_container').empty().append('<ul id="omgtorrent_cont" class="list"></ul>').show();
		omgTorrent.itemsCount = 0;
	}
	omgTorrent.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	omgTorrent.currentPage = omgTorrent.gui.current_page;
  var url;
  if(searchType === 'search') {
      url='http://www.omgtorrent.com/recherche/?order='+options.orderBy+'&orderby=desc&query='+encodeURIComponent(query)+'&page='+page;
  } else {
      var category = options.category;
      url='http://www.omgtorrent.com/'+category+'/?order='+options.orderBy+'&orderby=desc&page='+page;
  }
  $.when($.ajax(url)).then(function(data, textStatus, jqXHR ) {
      var videos = {};
      var list;
      if(searchType === 'search') {
          list=$($('table.table_corps',data)[0]).find('tr:not(.table_entete)').get();
      } else {
          list=$('.table_corps tr:not(".table_entete")',data).get();
      }
      if(list.length === 0 || $('.message.erreur',data).length > 0) {
          $('#loading').hide();
          $("#search_results p").empty().append(_("No results found..."));
          $("#search").show();
          $("#pagination").hide();
          return;
      }
      // add new items to total items count for lazy loading
	  omgTorrent.itemsCount += list.length;
      try {
		  var number = parseInt($('.nav a', data).last().prev().text());
		  if (isNaN(number)) {
              omgTorrent.totalItems = list.length;
              omgTorrent.totalPages = 1;
		  } else {
			  omgTorrent.totalPages = parseInt(number);
			  omgTorrent.totalItems = omgTorrent.totalPages * 30;
		  }
		  analyseResults(list);
	  } catch(err) {
          omgTorrent.totalItems = list.length;
          omgTorrent.totalPages = 1;
          analyseResults(list);
      }
    });
}

function analyseResults(list) {
	var favMainList = omgTorrent.gui.sdb.find();
	var favList = [];
	Iterator.iterate(favMainList).forEach(function (item,index) {
		if(item.hasOwnProperty('serieName')) {
			favList.push(item);
		}
	});
	Iterator.iterate(list).forEach(function (item) { 
		var video = {};
		video.cat = $(item).find('td')[0].innerHTML;
		video.link = 'http://www.omgtorrent.com/films'+$(item).find('a')[0].href.replace(/.*\/films/,'').replace('file://','');
		video.title = $(item).find('a')[0].innerHTML;
		video.quality = video.title.match(/720|1080/) !== null ? 'glyphicon-hd-video' : 'glyphicon-sd-video';
		video.hd = video.title.match(/720/) !== null ? '720p' : video.title.match(/1080/) !== null ? '1080p' : '';
		video.seeders = $(item).find('td')[3].innerHTML;
		video.leechers = $(item).find('td')[4].innerHTML;
		video.size = $(item).find('td')[2].innerHTML;
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
                video.background = 'background: url('+omgTorrent.gui.confDir+'/images/'+video.favId+'-fanart.jpg) no-repeat no-repeat scroll 0% 0% / 100% 100% padding-box border-box';
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
	if(searchType === 'navigation') {
		$('#search_results p').empty().append(_("%s availables videos", omgTorrent.totalItems)).show();
		$('#search').show();
	} else {
		$('#search_results p').empty().append(_("%s results founds", omgTorrent.totalItems)).show();
		$('#search').show();
	}
}

omgTorrent.search_type_changed = function() {
	searchType = $("#searchTypes_select a.active").attr("data-value");
	omgTorrent.gui.current_page = 1;
	$('#items_container').empty();
	if(searchType === 'search') {
		$("#categories_select").hide();
		$("#categories_label").hide();
		$("#search p").empty().append(_("<p>omgtorrent %s section</p>",searchType));
        $('#video_search_query').prop('disabled', false);
   } else {
     $("#categories_select").show();
     $("#categories_label").show();
     $("#search p").empty().append(_("<p>omgtorrent %s section</p>",searchType));
     $('#video_search_query').prop('disabled', true);
     $('#video_search_btn').click();
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

function* checkDb(video) {
	try {
		yield omgTorrent.gui.sdb.find({"title":video.title});
	} catch(err) {
		return err;
	}
}

function* checkSerieDb(video) {
	try {
		yield omgTorrent.gui.sdb.find({"serieName":video.serieName});
	} catch(err) {
		return err;
	}
}

// functions
function appendVideo(video) {
		video.id = ((Math.random() * 1e6) | 0);
		if(video.title.length > 45){
			text = video.title.substring(0,45)+'...';
		} else {
			text = video.title;
		}
		var html = '<li id="'+video.id+'" class="list-row"> \
		<span class="optionsTop" style="display:none;"></span> \
		<div id="optionsTopInfos" style="display:none;"> \
		<span style="'+video.css+'" title="'+video.viewedTitle+'"><i class="glyphicon glyphicon-eye-open"></i></span> \
		<span><i class="glyphicon glyphicon-cloud-upload"></i>'+video.seeders+'</span> \
		<span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>'+video.size+'</span> \
		</div> \
		<div class="mvthumb"> \
		<img class="omgTorrentthumb" /> \
		</div> \
		<div> \
			<img class="coverPlayImg preload_omgTorrentPlay_torrent" style="display:none;" data="" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
			<span><i class="glyphicon '+video.quality+'"></i>'+video.hd+'</span> \
			<span style="float:right;"><a href="#" class="preload_omg_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
			'+video.toggle+' \
		</div> \
		<p class="coverInfosTitle" title="'+video.title+'">'+text+'</p> \
		<div id="torrent_'+video.id+'"> \
		</div> \
		</li>';
		$("#omgtorrent_cont").append(html);
		$.get(video.link,function(res) {
			try {
				var img = 'http://www.omgtorrent.com'+$(".film_img",res).attr('src');
			} catch(err) {
				var img = "images/omgtorrent.png";
			}
			if($(".film_img",res).attr('src') == undefined) {
			  var img = "images/omgtorrent.png";
			}
			video.synopsis = '<h3 style="text-align:center;">'+video.title+'</h3><br>'+$(".infos_fiche", res).html();
			video.cover = img;
			video.torrent = 'http://www.omgtorrent.com'+$('#lien_dl',res).attr("href");
			$('#'+video.id+' .omgTorrentthumb').attr('src',img)
			$('#'+video.id+' .preload_omg_torrent').attr('data',encodeURIComponent(JSON.stringify(video)));
			$('#'+video.id+' .coverPlayImg').attr('data',encodeURIComponent(JSON.stringify(video)));
		});
		if($('#items_container ul li').length === omgTorrent.itemsCount) {
			omgTorrent.pageLoading = false;
		}
}

omgTorrent.loadMore = function() {
	omgTorrent.pageLoading = true;
	omgTorrent.gui.changePage();
}

module.exports = omgTorrent;
