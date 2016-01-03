// ==UserScript==
// @name       Bierdopje missende series helper
// @namespace  http://www.bierdopje.com
// @version    0.01
// @description  Toont welke series nog niet zijn toegevoegd op bierdopje
// @grant      GM_setClipboard
// @grant      unsafeWindow
// @match      http://www.bierdopje.com/forum/geachte-redactie/topic/1883-missende-series-in-bd-wel-in-tvdb/*
// @require    http://code.jquery.com/jquery-2.1.4.min.js
// @require    http://momentjs.com/downloads/moment-with-locales.min.js
// @copyright  2016+, Robin Houtevelts
// ==/UserScript==

if (window.top != window.self)
  return;

var BD_API_URL   = 'https://bierdopje-api.houtevelts.com';
var TVDB_API_URL = 'https://tvdb-api.houtevelts.com';
var CSS_URL      = 'https://bierdopje-api.houtevelts.com/scoped-twbs.css';

var DEBUG = true;

var COMMENT_TXT = '<tr id="replyheader-1337" name="replyheader"><td width="50" align="left" valign="middle" class="defbg postbuts" height="20"><a href="#1337"><img src="http://cdn.bierdopje.eu/g/if/forum/icon_minipost.gif" width="12" height="9" alt="Bericht" border="0"></a> <span class="postname"><a href="#" class="user user">BD MissingShowFinder</a></span> </td><td nowrap="nowrap" valign="middle" align="right" class="defbg postbuts" height="20"><p align="left">&nbsp;</p></td><td nowrap="nowrap" valign="middle" align="right" class="defbg postbuts" height="20">&nbsp;</td></tr><tr id="replyside-1337" name="replyside"><td width="150" align="left" valign="top" class="userinfo"><span class="postdetails"><br><img src="http://eih.bz/s1/2015123000.png"><br><br><br><br><br><br></span><br></td><td class="posttext" valign="top" colspan="2"><span class="postbody" id="BD__MissingShowFinder__postbody"><div class="twbs container-fluid">Dag {{username}}!</div></span><span class="gensmall"></span></td></tr>';

var NO_REQUESTS_TXT = '<p class="postcontent">Er zijn geen aanvragen gevonden door mij op deze pagina.</p>';

var MISSING_SHOWS_TXT = '<p class="postcontent">Op deze pagina heb ik <code>{{nr_missing_shows}}</code> shows gevonden die niet op Bierdopje staan! <br />Ik heb ze in een mooi overzicht gegoten voor jou:</p><table class="twbs table table-bordered table-hover table-striped"><tr><th>Show</th><th>TvDbId</th><th>Requested by</th></tr></table>';
var MISSING_SHOWS_ROW_TXT = '<tr><td><a href="{{url}}">{{showname}}</a></td><td><code>{{tvDbId}}</code><button data-tvDbId="{{tvDbId}}" type="button" class="twbs pull-right btn btn-info btn-sm" title="Kopier id naar klembord"><span class="glyphicon glyphicon-paperclip" aria-hidden="true"></span></button></td><td></td></tr>';

var AVAILABLE_SHOWS_TXT = '<p class="postcontent">Er zijn op deze pagina <code>{{nr_available_shows}}</code> shows die wél op Bierdopje staan!</p><div class="twbs container-fluid"><table class="twbs table table-bordered table-hover table-striped"><tr><th>Show</th><th>Url</th><th>Requested by</th></tr></table></div>';
var AVAILABLE_SHOWS_ROW_TXT = '<tr><td><a href="{{url}}">{{showname}}</a></td><td><code>{{url_slug}}</code><button data-url="{{url}}" type="button" class="twbs pull-right btn btn-info btn-sm" title="Kopier url naar klembord"><span class="glyphicon glyphicon-paperclip" aria-hidden="true"></span></button></td><td></td></tr>';

var USER_REQUEST_TXT = '{{username}}<sup><a href="{{permalink}}" title="{{time}}">comment</a></sup><br />';

var windowLocation = window.location.href.split("#")[0];
var tvDbId_comments = {};

$(function() {
  /* Inject bootstrap */
  //https://raw.githubusercontent.com/homeyer/scoped-twbs/
  var pageHead = document.getElementsByTagName("HEAD")[0];
  var link = window.document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = CSS_URL;
  pageHead.insertBefore(link,pageHead.lastChild);
  
  $(document).on('click', 'button[data-tvdbid]', function(e) {
    var button = $(this);
    var tvDbId = button.attr('data-tvdbid');
    GM_setClipboard(tvDbId);
  });
  
  $(document).on('click', 'button[data-url]', function(e) {
    var button = $(this);
    var url = button.attr('data-url');
    GM_setClipboard(url);
  });
  
  $(document).on('bierdopje.missingShowsFinder.finished', function(e, shows) {
    var missingShows = [];
    var availableShows = [];
    var comments_shows = {}; // so we can sort by request-date
    
    shows.map(function(show) {
      if(show.isAvailable){
        var comments = tvDbId_comments[show.tvdbId];
        comments.map(function(comment) {
          comments_shows[comment.date.format('x')] = show;
        });
      } else {
        missingShows.push(show);
      }
    });
    shows = null;
    delete shows;
    
    // order missing shows by name
    missingShows.sort(function(a, b) {
      var nameA = a.name.toLowerCase();
      var nameB = b.name.toLowerCase();
      
      if (nameA > nameB)
        return 1;
      else if (nameA < nameB)
        return -1;
      return 0;
    });
        
    // order available shows by commentdate
    Object.keys(comments_shows).sort().map(function(key) {
      availableShows.push(comments_shows[key]);
    });
    availableShows = $.unique(availableShows);
    comments_shows = null;
    delete comments_shows;
    
    var getRequests = function(show, cb) {
      var comments = tvDbId_comments[parseInt(show.tvDbId)];
      comments.sort(function(a, b) {
        var dateA = a.date.format('x');
        var dateB = b.date.format('x');
        
        if (dateA > dateB)
          return 1;
        else if (dateA < dateB)
          return -1;
        return 0;
      });
      comments.map(function(comment) {
        var request = USER_REQUEST_TXT.replace(/{{username}}/g, comment.user.name);
            request = request.replace(/{{permalink}}/g, comment.permaLink);
            request = request.replace(/{{time}}/g, comment.date.fromNow());
        cb(request);
      });
    };
    
    var comment = COMMENT_TXT.replace(/{{username}}/g, unsafeWindow.UserName);
        comment = $(comment);
    if (missingShows.length > 0) {
      var body = MISSING_SHOWS_TXT.replace(/{{nr_missing_shows}}/g, missingShows.length);
          body = $(body);
      var table = $(body[1]);
      
      missingShows.map(function(show) {
        var row = MISSING_SHOWS_ROW_TXT.replace(/{{showname}}/g, show.name);
            row = row.replace(/{{tvDbId}}/g, show.tvDbId);
            row = row.replace(/{{url}}/g, 'http://thetvdb.com/?tab=series&id='+show.tvDbId+'&lid=13');
            
        row = $(row);
        getRequests(show, function(request) {
          $('td', row).last().append(request);
        });
        table.append(row);
      });
      $('.container-fluid', comment).append(body);
    }
    
    if (availableShows.length > 0) {
      var body = AVAILABLE_SHOWS_TXT.replace(/{{nr_available_shows}}/g, availableShows.length);
          body = $(body);
      var table = $('table', body);
      
      availableShows.map(function(show) {   
        var row = AVAILABLE_SHOWS_ROW_TXT.replace(/{{showname}}/g, show.name);
            row = row.replace(/{{url}}/g, show.link);
            row = row.replace(/{{url_slug}}/g, show.link.replace(unsafeWindow.BaseURL, ''));
        row = $(row);
        getRequests(show, function(request) {
          $('td', row).last().append(request);
        });
        table.append(row);
      });
      $('.container-fluid', comment).append(body);
    }
    
    if (availableShows.length == 0 && missingShows.length == 0) {
      var body = NO_REQUESTS_TXT;
      $('.container-fluid', comment).append(body);
    }
    
    $('.content.go-wide table.forumline tr[id^="replyside"]').last().after(comment);
    
    var consoleMsg = 'There are '+missingShows.length+' shows missing';
    if (missingShows.length <= 0) {
      console.info(consoleMsg);
    }else{
      console.warn(consoleMsg);
      console.table(missingShows);
    }
  });
  
  log('Starting');
  
  var forumContentTable = $('#page .maincontent .content .forumline');
  getCommentsOnPage(forumContentTable, function(comments) {
    getTvDbIdsFromComments(comments, function(tvDbIds) {
      tvDbId_comments = $.extend({},tvDbIds); // make a copy of the 
      var todo = Object.keys(tvDbIds).length;
      var shows = [];
      
      $.each(tvDbIds, function(tvDbId, comments) {
        checkIfExists(tvDbId, function(show) {
          todo--;
          if(!show) { // invalid tvDbId
            if (todo == 0)
              $(document).trigger('bierdopje.missingShowsFinder.finished', [shows]);
            return true;
          }
          
          show.tvDbId = tvDbId;
          shows.push(show);
          
          // set background color on comments, displaying the status.
          // green means it's on BD, red means it's not.
          var color = show.isAvailable ? '#DFF5E2' : '#F3D4D4';
          comments.map(function(comment) {
            var element = comment.bodyel;
            $('td.posttext', element).css('background-color', color);
          });

          if (todo == 0)
            $(document).trigger('bierdopje.missingShowsFinder.finished', [shows]);
        });
      });
    });
  });
  
});

  function getCommentsOnPage(forum, callback) {
    var comments = {};
    
    $('tr[id^="reply"]', forum).each(function(){      
      var element = $(this);
      var elementType = element.attr('name');
      var commentId = parseInt(element.attr('id').split('-')[1]);
      
      var comment = {};
      if(comments.hasOwnProperty(commentId))
        comment = comments[commentId];
      
      if (elementType == 'replyheader') {
        var header = parseCommentHeader(element);
        if(foundComment(header))
          comment = mergeCommentContent(comment, header);
      } else if (elementType == 'replyside') {
        var body = parseCommentBody(element);
        if(foundComment(body))
          comment = mergeCommentContent(comment, body);
      }
      
      comments[commentId] = comment;
    });
   
    // validate comments in a crappy way
    var validComments = [];
    Object.keys(comments).map(function(id) {
      var comment = comments[id];
      var isValid = comment.hasOwnProperty('id')
          && comment.hasOwnProperty('permaLink')
          && comment.hasOwnProperty('user')
          && comment.user.hasOwnProperty('name')
          && comment.user.hasOwnProperty('link')
          && comment.hasOwnProperty('date')
          && comment.hasOwnProperty('headerel')
          && comment.hasOwnProperty('body')
          && comment.hasOwnProperty('bodyel');
          
      if(isValid)
        validComments.push(comment);
    });
    comments = validComments;
    
    log('Found '+comments.length+' comments');
    
    callback(comments);
  }
  
  function foundComment(commentContent) {
    return commentContent.hasOwnProperty('id');
  }
  
  function mergeCommentContent(oldContent, newContent) {
      // Merge oldContent and newContent
      return jQuery.extend({}, oldContent, newContent, true);
    }
  
  function parseCommentHeader(element) {
    var commentId = parseInt(element.attr('id').split('-')[1]);
    var permaLink = windowLocation + '#' + commentId;
    
    var userHref = $('.postname a.user', element);
    var user = {};
      user.name = userHref.text();
      user.link = 'http://www.bierdopje.com' + userHref.attr('href');
     
    var dateString = $('td:eq(1) p', element).text(); //Geplaatst op woensdag 26 augustus 2015 20:01
        dateString = /(\d+ .*?)$/g.exec(dateString)[1]; // 26 augustus 2015 20:01
    var date = moment(dateString, 'DD MMMM YYYY HH:mm');
    
    return {
      id: commentId,
      permaLink : permaLink,
      user : user,
      date : date,
      headerel : element
    };
  }
  
  function parseCommentBody(element) {
    var commentId = parseInt(element.attr('id').split('-')[1]);
    var body = $('span[id^=post].postbody', element);
    
    return {
      id : commentId,
      body : body.html(),
      bodyel : element
    };
  }
  
  function getTvDbIdsFromComments(comments, callback) {
    var tvDbIds = {};
    
    // Ignore Xandecs, he doesn't make requests
    var ignoredUsers = ['xandecs']; // lowercase
    
    log('Extracting TvDbId\'s from comments');
    comments.map(function(comment){
      if(ignoredUsers.indexOf(comment.user.name.toLowerCase()) >= 0)
        return true; //continue
      
      var TVDBId = -1;
      
      var body = comment.body;
      var match = /thetvdb.com\/.*?id=(\d+)/i.exec(body);
      if (match != null) {
        TVDBId = parseInt(match[1]);
      }else{
        match = /tvdb.*?(\d+)/i.exec(body);
        if(match != null)
          TVDBId = parseInt(match[1]);
      }
      
      if (!(TVDBId > 0))
        return true; // continue
      
      log('Found tvDbId: "'+TVDBId+'"');
        
      if(!tvDbIds.hasOwnProperty(TVDBId))
        tvDbIds[TVDBId] = [];
      
      tvDbIds[TVDBId].push(comment);
    });
    
    log('Found '+Object.keys(tvDbIds).length+' tvDbId\'s');
    callback(tvDbIds);
  }
  
  function checkIfExists(tvDbId, callback) {
    log('Checking if show with tvDbId '+tvDbId+' exist on Bierdopje');
    checkIfAvailableOnBierdopje(tvDbId, function(show) {
      var isAvailable = Object.keys(show).length > 0;
      log('Show with tvDbId '+tvDbId+' does'+(isAvailable ? '' : ' not')+' exist on Bierdopje');
      if(!isAvailable) {
        log('Trying to get showName from TvDb');
        getSerieInfoFromTvDb(tvDbId, function(show) {
          // Check if TvDbId returned info.
          if(Object.keys(show).length <= 0) {
            log('TvDbId "'+tvDbId+'" is invalid');
            callback(null);
            return false;
          }
          
          log('Got showName of tvdbId '+tvDbId+', "'+show.name+'"');
          
          show.isAvailable = isAvailable;
          callback(show);
        });
      } else {
        show.isAvailable = isAvailable;
        callback(show);
      }
    });
  }
  
  function checkIfAvailableOnBierdopje(TVDBId, callback) {
    $.getJSON(BD_API_URL+'/GetShowByTVDBID/'+TVDBId, function(show) {
      callback(show);
    }).fail(function(){
      callback({});
    });
  }
  
  function getSerieInfoFromTvDb(TVDBId, callback) {
    $.getJSON(TVDB_API_URL+'/show/'+TVDBId, function(show) {
      callback(show);
    }).fail(function(){
      callback({});
    });
  }
  
  function log(string) {
    if(DEBUG)
      console.log('[BD:MissingShowFinder] '+string);
  }
