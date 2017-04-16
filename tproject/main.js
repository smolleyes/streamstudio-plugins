/********************* engine config *************************
**************************************************************/

var tProject = {};
tProject.engine_name = 'tproject';
tProject.type="video";
tProject.totalPages = 0;
tProject.currentPage = 0;
tProject.itemsCount = 0;
tProject.pageLoading = false;

/********************* Node modules *************************/

var http = require('http');
var $ = require('jquery');
var path = require('path');
var os = require('os');
var i18n = require("i18n");
var fs = require('fs');
var _ = i18n.__;
var Iterator = require('iterator').Iterator;
var cloudscraper = require('cloudscraper');
/****************************/

// module global vars
var searchType = 'navigation';

// init module
tProject.init = function(gui,ht5) {
	$('#pagination').hide();
    $('#search').hide();
    tProject.gui = ht5;
    loadEngine();
    //play videos
    $(ht5.document).off('click','.preload_tpj_torrent');
    $(ht5.document).on('click','.preload_tpj_torrent',function(e){
      console.log($(this))
        e.preventDefault();
        //var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
        var link = obj.link;
        var id = obj.id;
	    tProject.gui.showPopup(obj.synopsis,'body',changeCss)
	});

	$(ht5.document).off('mouseenter','#tproject_cont .list-row');
	$(ht5.document).on('mouseenter','#tproject_cont .list-row',function(e){
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

	$(ht5.document).off('mouseleave','#tproject_cont .list-row');
	$(ht5.document).on('mouseleave','#tproject_cont .list-row',function(e){
		if($(this).find('.optionsTop').is(':visible')) {
			$(this).find('.optionsTop,#optionsTopInfos,.optionsBottom,#optionsBottomInfos').fadeOut("fast");
			$(this).find('.coverPlayImg').fadeOut("fast");
		}
	});

	$(ht5.document).off('click','.preload_tProjectPlay_torrent');
	$(ht5.document).on('click','.preload_tProjectPlay_torrent',function(e){
		e.preventDefault();
		tProject.gui.activeItem($(this).closest('.list-row').find('.coverInfosTitle'));
		var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
		var link = obj.link;
    var id = obj.id;
    $.get(link,function(res) {
      obj.torrent = $('.download_torrent',res).next().attr('href');
      obj.magnet = $('.download_magnet',res).next().attr('href');
      console.log(obj)
      saveTorrent = false;
      var html = '<div style="width:100%;height:100%;position:relative;top:0;left:0;'+obj.background+'"></div><div style="position: absolute;top: 50%;left: 50%;width: 500px;height: 500px;margin-top: -250px;margin-left: -250px;background: rgba(32, 32, 32, 0.63);border-radius: 3px;"><h3>'+obj.title+'</h3><br><img style="width:180;height:240px;" src="images/TorrentProjectAPI.jpg" /><br><br> \
      <button type="button" id="tpj_play_'+id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" class="closePopup play_tpj_torrent btn btn-success"> \
          <span class="glyphicon glyphicon-play-circle"><span class="fbxMsg_glyphText">'+_("Start playing")+'</span></span> \
        </button>  \
        <button type="button" class="closePopup download_tProjectFile downloadText btn btn-info" href="'+obj.link+'" id="tpj_downlink_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'">  \
          <span class="glyphicon glyphicon-download"><span class="fbxMsg_glyphText">'+_("Download")+'</span>  \
          </span>  \
        </button>';

      if(tProject.gui.freeboxAvailable) {
        html += '<button type="button"  href="'+obj.link+'" class="closePopup download_tProjectFile_fbx downloadText btn btn-info" id="tpj_downlinkFbx_'+obj.id+'" data="'+encodeURIComponent(JSON.stringify(obj))+'" title="'+ _("Download")+'"><span class="glyphicon glyphicon-download-alt"><span class="fbxMsg_glyphText">'+_("Télécharger avec freebox")+'</span></span></button>';
      }
      html += '<br/><br/><div><label>'+_("Keep torrent file after downloading ?")+'</label><input style="position:relative;left:10px;" type="checkbox" class="saveTorrentCheck" name="saveTorrentCheck"></input></div></div>';
      // show
      tProject.gui.showPopup(html,'body')
    })
	});

	$(ht5.document).off('click','.play_tpj_torrent');
	$(ht5.document).on('click','.play_tpj_torrent',function(e){
	    e.preventDefault();
	    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
      console.log(obj)
	    tProject.gui.getAuthTorrent(obj.magnet,true,false,null);
	    tProject.gui.itemTitle = obj.title;
	    $('#playerToggle')[0].click();
	});

	$(ht5.document).off('click','.download_tProjectFile');
	$(ht5.document).on('click','.download_tProjectFile',function(e){
	    e.preventDefault();
	    console.log('download torrent clicked')
	    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	    tProject.gui.getAuthTorrent(obj.magnet,false,false,null);
	});

	$(ht5.document).off('click','.download_tProjectFile_fbx');
	$(ht5.document).on('click','.download_tProjectFile_fbx',function(e){
	    e.preventDefault();
	    console.log('download torrent clicked')
	    var obj = JSON.parse(decodeURIComponent($(this).attr("data")));
	    tProject.gui.getAuthTorrent(obj.magnet,false,true,null);
	});
}

// changes css callback when info popup is opened
function changeCss() {
  var html = $('.mfp-content').html().replace(/"\/img/g,'"http://tproject.com/img');
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
       directory: tProject.gui.pluginsDir + 'tproject/locales',
       updateFiles: true
   });

    if ($.inArray(tProject.gui.settings.locale, localeList) >-1) {
       console.log('Loading tproject engine with locale' + tProject.gui.settings.locale);
       i18n.setLocale(tProject.gui.settings.locale);
   } else {
       i18n.setLocale('en');
   }

// menus needed by the module and menu(s) loaded by default
tProject.menuEntries = ["searchTypes","orderBy","categories"];
tProject.defaultMenus = ["searchTypes","orderBy","categories"];
// searchTypes menus and default entry
tProject.searchTypes = JSON.parse('{"'+_("Search torrents")+'":"search","'+_("Search Files")+'":"searchFiles"}');
tProject.defaultSearchType = 'search';
// orderBy filters and default entry
tProject.orderBy_filters = JSON.parse('{"'+_("Best")+'":"best","'+_("Seeds")+'":"seeders"}');
tProject.defaultOrderBy = 'best';
// category filters and default entry
tProject.category_filters = JSON.parse('{"'+_("All")+'":"9000","'+_("Videos")+'":"2000","'+_("Audio")+'":"1000"}');
tProject.defaultCategory = '9000';
// others params
tProject.has_related = false;
tProject.categoriesLoaded = false;

}

// search videos
tProject.search = function (query, options,gui) {
  console.log(options, options.currentPage)
    tProject.gui = gui;
    tProject.pageLoading = true;
	var page = options.currentPage;
	if(page == 1) {
		$('#items_container').empty().append('<ul id="tproject_cont" class="list"></ul>').show();
		tProject.itemsCount = 0;
    page = 0
	} else {
    page = (page-1);
  }
	tProject.gui.current_page += 1;
	// plugin page must match gui current page for lazy loading
	tProject.currentPage = tProject.gui.current_page;
  var url;
  if(searchType === 'search') {
      url='https://torrentproject.se/?hl=en&safe=off&num=20&start='+page+'&orderby='+options.orderBy+'&s='+query.replace(/\s+/g,'+')+'&filter='+options.category;
  } else {
      var category = options.category;
      url='https://torrentproject.se/?hl=en&num=20&start='+page+'&filter='+options.category+'&safe=off&orderby='+options.orderBy+'&s=file%3A'+query.replace(/\s+/g,'+');
  }
  cloudscraper.get(url, function(error, response, data) {
      var list = [];
      var l =$($('.torrent',data)).get();
      $.map(l,function(item,i) {
        var obj = {}
        obj.title = $(item).find('a').attr('title')
        obj.link = $(item).find('a').attr('href');
        obj.seeds = $(item).find('.seeders span').text()
        obj.leechs = $(item).find('.leechers span').text()
        obj.date = $(item).find('.cated').text().trim()
        obj.type = $(item).find('.cate').text()
        obj.size = $(item).find('.torrent-size').text().trim()
        list.push(obj)
      }); 
      if(list.length === 0 || $('.message.erreur',data).length > 0) {
          $('#loading').hide();
          $("#search_results p").empty().append(_("No results found..."));
          $("#search").show();
          $("#pagination").hide();
          return;
      }
      // add new items to total items count for lazy loading
	    tProject.itemsCount += list.length;
      try {
		  var totalResults = parseInt($('#resultStats',data).text().match(/\d{1,10}/)[0]);
		  if (!totalResults) {
        tProject.totalItems = list.length;
        tProject.totalPages = 1;
		  } else {
			  tProject.totalPages = totalResults / 20;
			  tProject.totalItems = totalResults;
		  }
		  analyseResults(list);
	  } catch(err) {
          tProject.totalItems = list.length;
          tProject.totalPages = 1;
          analyseResults(list);
      }
    });
}

function analyseResults(list) {
	Iterator.iterate(list).forEach(function (item) { 
    appendVideo(item);
  });
  $('#loading').hide();
	if(searchType === 'search') {
		$('#search_results p').empty().append(_("%s torrents found", tProject.totalItems)).show();
		$('#search').show();
	} else {
		$('#search_results p').empty().append(_("%s files found", tProject.totalItems)).show();
		$('#search').show();
	}
}

tProject.search_type_changed = function() {
	searchType = $("#searchTypes_select a.active").attr("data-value");
	tProject.gui.current_page = 1;
	$('#items_container').empty();
}

tProject.play_next = function() {
	try {
		$("li.highlight").next().find("a.start_media").click();
	} catch(err) {
		console.log("end of playlist reached");
		try {
			tProject.gui.changePage();
		} catch(err) {
			console.log('no more videos to play');
		}
	}
}

function* checkDb(video) {
	try {
		yield tProject.gui.sdb.find({"title":video.title});
	} catch(err) {
		return err;
	}
}

function* checkSerieDb(video) {
	try {
		yield tProject.gui.sdb.find({"serieName":video.serieName});
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
		<span><i class="glyphicon glyphicon-cloud-upload"></i>'+video.seeds+'</span> \
		<span style="float:right;"><i class="glyphicon glyphicon-hdd"></i>'+video.size+'</span> \
		</div> \
		<div class="mvthumb"> \
		<img class="tProjectthumb" src="images/TorrentProjectAPI.jpg"/> \
		</div> \
		<div> \
			<img class="coverPlayImg preload_tProjectPlay_torrent" style="display:none;" data="'+encodeURIComponent(JSON.stringify(video))+'" /> \
		</div> \
		<span class="optionsBottom" style="display:none;"></span> \
		<div id="optionsBottomInfos" style="display:none;"> \
			<span><a href="#" class="preload_tpj_torrent" data=""><i class="glyphicon glyphicon-info-sign"></i></a></span> \
			'+video.type+' \
		</div> \
		<p class="coverInfosTitle" title="'+video.title+'">'+video.title+'</p> \
		<div id="torrent_'+video.id+'"> \
		</div> \
		</li>';
		$("#tproject_cont").append(html);
		if($('#items_container ul li').length === tProject.itemsCount) {
			tProject.pageLoading = false;
		}
}

tProject.loadMore = function() {
	tProject.pageLoading = true;
	tProject.gui.changePage();
}

module.exports = tProject;
