/**
 * ZeroBin 0.19
 *
 * @link http://sebsauvage.net/wiki/doku.php?id=php:zerobin
 * @author sebsauvage
 */

// Immediately start random number generator collector.
sjcl.random.startCollectors();

/**
 *  Converts a duration (in seconds) into human readable format.
 *
 *  @param int seconds
 *  @return string
 */
function secondsToHuman(seconds)
{
    if (seconds<60) { var v=Math.floor(seconds); return v+' second'+((v>1)?'s':''); }
    if (seconds<60*60) { var v=Math.floor(seconds/60); return v+' minute'+((v>1)?'s':''); }
    if (seconds<60*60*24) { var v=Math.floor(seconds/(60*60)); return v+' hour'+((v>1)?'s':''); }
    // If less than 2 months, display in days:
    if (seconds<60*60*24*60) { var v=Math.floor(seconds/(60*60*24)); return v+' day'+((v>1)?'s':''); }
    var v=Math.floor(seconds/(60*60*24*30)); return v+' month'+((v>1)?'s':'');
}

/**
 * Converts an associative array to an encoded string
 * for appending to the anchor.
 *
 * @param object associative_array Object to be serialized
 * @return string
 */
function hashToParameterString(associativeArray)
{
  var parameterString = ""
  for (key in associativeArray)
  {
    if( parameterString === "" )
    {
      parameterString = encodeURIComponent(key);
      parameterString += "=" + encodeURIComponent(associativeArray[key]);
    } else {
      parameterString += "&" + encodeURIComponent(key);
      parameterString += "=" + encodeURIComponent(associativeArray[key]);
    }
  }
  //padding for URL shorteners
  parameterString += "&p=p";
  
  return parameterString;
}

/**
 * Converts a string to an associative array.
 *
 * @param string parameter_string String containing parameters
 * @return object
 */
function parameterStringToHash(parameterString)
{
  var parameterHash = {};
  var parameterArray = parameterString.split("&");
  for (var i = 0; i < parameterArray.length; i++) {
    //var currentParamterString = decodeURIComponent(parameterArray[i]);
    var pair = parameterArray[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1]);
    parameterHash[key] = value;
  }
  
  return parameterHash;
}

/**
 * Get an associative array of the parameters found in the anchor
 *
 * @return object
 **/
function getParameterHash()
{
  var hashIndex = window.location.href.indexOf("#");
  if (hashIndex >= 0) {
    return parameterStringToHash(window.location.href.substring(hashIndex + 1));
  } else {
    return {};
  } 
}

/**
 * Compress a message (deflate compression). Returns base64 encoded data.
 *
 * @param string message
 * @return base64 string data
 */
function compress(message) {
    return Base64.toBase64( RawDeflate.deflate( Base64.utob(message) ) );
}

/**
 * Decompress a message compressed with compress().
 */
function decompress(data) {
    return Base64.btou( RawDeflate.inflate( Base64.fromBase64(data) ) );
}

/**
 * Compress, then encrypt message with key.
 *
 * @param string key
 * @param string message
 * @return encrypted string data
 */
function zeroCipher(key, message) {
    return sjcl.encrypt(key,compress(message));
}
/**
 *  Decrypt message with key, then decompress.
 *
 *  @param key
 *  @param encrypted string data
 *  @return string readable message
 */
function zeroDecipher(key, data) {
    return decompress(sjcl.decrypt(key,data));
}

/**
 * @return the current script location (without search or hash part of the URL).
 *   eg. http://server.com/zero/?aaaa#bbbb --> http://server.com/zero/
 */
function scriptLocation() {
  var scriptLocation = window.location.href.substring(0,window.location.href.length
    - window.location.search.length - window.location.hash.length);
  var hashIndex = scriptLocation.indexOf("#");
  if (hashIndex !== -1) {
    scriptLocation = scriptLocation.substring(0, hashIndex)
  }
  return scriptLocation
}

/**
 * @return the paste unique identifier from the URL
 *   eg. 'c05354954c49a487'
 */
function pasteID() {
    return window.location.search.substring(1);
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/**
 * Set text of a DOM element (required for IE)
 * This is equivalent to element.text(text)
 * @param object element : a DOM element.
 * @param string text : the text to enter.
 */
function setElementText(element, text) {
    // For IE<10.
    if ($('#oldienotice').is(":visible")) {
        // IE<10 does not support white-space:pre-wrap; so we have to do this BIG UGLY STINKING THING.
        var html = htmlEntities(text).replace(/\n/ig,"\r\n<br>");
        element.html('<pre>'+html+'</pre>');
    }
    // for other (sane) browsers:
    else {
        element.text(text);
    }
}

/** Apply syntax coloring to clear text area.
  */
function applySyntaxColoring()
{
    if ($('main').html().substring(0,11) != '<pre><code>')
    {
        // highlight.js expects code to be surrounded by <pre><code>
        $('main').html('<pre><code>'+ $('main').html()+'</code></pre>');
    }
    hljs.highlightBlock(document.getElementByTag('main'));
    $('main').css('padding','0'); // Remove white padding around code box.
}


/**
 * Show decrypted text in the display area, including discussion (if open)
 *
 * @param string key : decryption key
 * @param array comments : Array of messages to display (items = array with keys ('data','meta')
 */
function displayMessages(key, comments) {
    try { // Try to decrypt the paste.
        var cleartext = zeroDecipher(key, comments[0].data);
    } catch(err) {
        $('main').hide();
        $('button#clonebutton').hide();
        showError('Could not decrypt data (Wrong key ?)');
        return;
    }
    setElementText($('main'), cleartext);
    urls2links($('main')); // Convert URLs to clickable links.

    // comments[0] is the paste itself.

    if (comments[0].meta.syntaxcoloring) applySyntaxColoring();

    // Display paste expiration.
    if (comments[0].meta.expire_date) $('#remainingtime').removeClass('foryoureyesonly').text('This document will expire in '+secondsToHuman(comments[0].meta.remaining_time)+'.').show();
    if (comments[0].meta.burnafterreading) {
        $('#remainingtime').addClass('foryoureyesonly').text('FOR YOUR EYES ONLY.  Don\'t close this window, this message can\'t be displayed again.').show();
        $('button#clonebutton').hide(); // Discourage cloning (as it can't really be prevented).
    }

    // If the discussion is opened on this paste, display it.
    // If the discussion is opened on this paste, display it.
    if (comments[0].meta.opendiscussion) {
        $('#comments').html('<h2>Discussion</h2>');
        // For each comment.
        for (var i = 1; i < comments.length; i++) {
            var comment=comments[i];
            var cleartext="[Could not decrypt comment ; Wrong key ?]";
            try {
                cleartext = zeroDecipher(key, comment.data);
            } catch(err) { }
            var place = $('#comments');
            // If parent comment exists, display below (CSS will automatically shift it right.)
            var cname = '#comment_'+comment.meta.parentid

            // If the element exists in page
            if ($(cname).length) {
                place = $(cname);
            }
            var article = $('<article id="comment_' + comment.meta.commentid+'">'
                               /*+ '<div class="commentmeta"><span class="nickname"></span><span class="commentdate"></span></div><div class="commentdata"></div>'
                               + '<button onclick="open_reply($(this),\'' + comment.meta.commentid + '\');return false;">Reply</button>'*/
                               + '</article>');
            var footer = $('<footer><i>(Anonymous)</i></footer>');

            article.append(footer);
            // Try to get optional nickname:
            try {
                article.find('footer').text(zeroDecipher(key, comment.meta.nickname));
            } catch(err) { article.find('footer').text(err) }

            // If an avatar is available, display it.
            if (comment.meta.vizhash) {
                article.find('footer').prepend('<img alt="[vizhash]" src="' + comment.meta.vizhash + '" class="vizhash" title="Anonymous avatar (Vizhash of the IP address)" />');
            }
            
            var articleDate = new Date(comment.meta.postdate*1000);
            article.find('footer').append('<time>' + articleDate.toString() + '</tine>');
            article.find('time').attr('title','CommentID: ' + comment.meta.commentid).attr('datetime', articleDate.toISOString());
            
            var content = $('<div></div>');
            content.append(cleartext);
            // Convert URLs to clickable links in comment.
            urls2links(content);
            article.append(content);
            
            article.append('<button onclick="open_reply($(this),\'' + comment.meta.commentid + '\');return false;">Reply</button>');
            
            place.append(article);
        }
        $('#comments').append('<button onclick="open_reply($(this),\'' + pasteID() + '\');return false;">Add comment</button>');
        $('#comments').show();
    }
}

/**
 * Open the comment entry when clicking the "Reply" button of a comment.
 * @param object source : element which emitted the event.
 * @param string commentid = identifier of the comment we want to reply to.
 */
function open_reply(source, commentid) {
    $('form').remove(); // Remove any other reply area.
    source.after('<form id="reply">'
               + '<label>Nickname: <input type="text" id="nickname" title="Optional nickname..." /></label>'
               + '<textarea id="replymessage" cols="80" rows="7"></textarea>'
               + '<button id="replybutton" onclick="send_comment(\'' + commentid + '\');return false;">Post comment</button>'
                + '<p id="replystatus">&nbsp;</p>'
                + '</form>');
    $('input#nickname').focus(function() {
        $(this).css('color', '#000');
    });
    $('textarea#replymessage').focus();
}

/**
 * Send a reply in a discussion.
 * @param string parentid : the comment identifier we want to send a reply to.
 */
function send_comment(parentid) {
    // Do not send if no data.
    if ($('textarea#replymessage').val().length==0) {
        return;
    }

    showStatus('Sending comment...', spin=true);
    var cipherdata = zeroCipher(pageKey(), $('textarea#replymessage').val());
    var ciphernickname = '';
    var nick=$('input#nickname').val();
    if (nick != '' && nick != 'Optional nickname...') {
        ciphernickname = zeroCipher(pageKey(), nick);
    }
    var data_to_send = { data:cipherdata,
                         parentid: parentid,
                         pasteid:  pasteID(),
                         nickname: ciphernickname
                       };

    $.post(scriptLocation(), data_to_send, 'json')
        .error(function() {
            showError('Comment could not be sent (serveur error or not responding).');
        })
        .success(function(data) {
            if (data.status == 0) {
                showStatus('Comment posted.');
                location.reload();
            }
            else if (data.status==1) {
                showError('Could not post comment: '+data.message);
            }
            else {
                showError('Could not post comment.');
            }
        });
    }


/**
 *  Send a new paste to server
 */
function send_data() {
    // Do not send if no data.
    if ($('textarea#message').val().length == 0) {
        return;
    }

    // If sjcl has not collected enough entropy yet, display a message.
    if (!sjcl.random.isReady())
    {
        showStatus('Sending paste (Please move your mouse for more entropy)...', spin=true);
        sjcl.random.addEventListener('seeded', function(){ send_data(); }); 
        return; 
    }
    
    showStatus('Sending paste...', spin=true);

    var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
    var cipherdata = zeroCipher(randomkey, $('textarea#message').val());
    var data_to_send = { data:           cipherdata,
                         expire:         $('label#expiration > select').val(),
                         burnafterreading: $('#burnafterreadingoption > input').is(':checked') ? 1 : 0,
                         opendiscussion: $('#opendisc > input').is(':checked') ? 1 : 0,
                         syntaxcoloring: $('#syntaxcoloringoption > input').is(':checked') ? 1 : 0
                       };
    $.post(scriptLocation(), data_to_send, 'json')
        .error(function() {
            showError('Data could not be sent (serveur error or not responding).');
        })
        .success(function(data) {
            if (data.status == 0) {
                stateExistingPaste();
                var url = scriptLocation() + "?" + data.id + '#' + randomkey;
                var deleteUrl = scriptLocation() + "?pasteid=" + data.id + '&deletetoken=' + data.deletetoken;
                showStatus('');

                $('#pastelink').html('Your paste is <a id="pasteurl" href="' + url + '">' + url + '</a> <span id="copyhint">(Hit CTRL+C to copy)</span>');
                $('#deletelink').html('<a href="' + deleteUrl + '">Delete link</a>');
                $('#pasteresult').show();
                selectText('pasteurl'); // We pre-select the link so that the user only has to CTRL+C the link.

                setElementText($('main'), $('textarea#message').val());
                urls2links($('main'));

                // FIXME: Add option to remove syntax highlighting ?
                if ($('#syntaxcoloringoption > input').is(':checked')) applySyntaxColoring();

                showStatus('');
            }
            else if (data.status==1) {
                showError('Could not create paste: '+data.message);
            }
            else {
                showError('Could not create paste.');
            }
        });
}


/** Text range selection.
 *  From: http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
 *  @param string element : Indentifier of the element to select (id="").
 */
function selectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection
    ;    
    if (doc.body.createTextRange) { //ms
        range = doc.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) { //all others
        selection = window.getSelection();        
        range = doc.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
/**
 * Put the screen in "New paste" mode.
 */
function stateNewPaste() {
    $('button#sendbutton').show();
    $('button#clonebutton').hide();
    $('button#rawtextbutton').hide();
    $('#expiration').show();
    $('#remainingtime').hide();
    $('#burnafterreadingoption').show();
    $('#opendisc').show();
    $('#syntaxcoloringoption').show();
    $('button#newbutton').show();
    $('#pasteresult').hide();
    $('textarea#message').text('');
    $('textarea#message').show();
    $('main').hide();
    $('#message').focus();
    $('section#comments').hide();
}

/**
 * Put the screen in "Existing paste" mode.
 */
function stateExistingPaste() {
    $('button#sendbutton').hide();

    // No "clone" for IE<10.
    if ($('#oldienotice').is(":visible")) {
        $('button#clonebutton').hide();
    }
    else {
        $('button#clonebutton').show();
    }
    $('button#rawtextbutton').show();

    $('#expiration').hide();
    $('#burnafterreadingoption').hide();
    $('#opendisc').hide();
    $('#syntaxcoloringoption').hide();    
    $('button#newbutton').show();
    $('#pasteresult').hide();
    $('textarea#message').hide();
    $('main').show();
}

/** Return raw text
  */
function rawText()
{
    history.pushState(document.title, document.title, 'document.txt');
    var paste = $('main').text();
    var newDoc = document.open('text/plain', 'replace');
    newDoc.write(paste);
    newDoc.close();
}

/**
 * Clone the current paste.
 */
function clonePaste() {
    stateNewPaste();
    
    //Erase the id and the key in url
    history.replaceState(document.title, document.title, scriptLocation());
    
    showStatus('');
    $('textarea#message').text($('main').text());
}

/**
 * Create a new paste.
 */
function newPaste() {
    stateNewPaste();
    showStatus('');
    $('textarea#message').text('');
}

/**
 * Display an error message
 * (We use the same function for paste and reply to comments)
 */
function showError(message) {
    $('#status').addClass('errorMessage').text(message);
    $('#replystatus').addClass('errorMessage').text(message);
}

/**
 * Display status
 * (We use the same function for paste and reply to comments)
 *
 * @param string message : text to display
 * @param boolean spin (optional) : tell if the "spinning" animation should be displayed.
 */
function showStatus(message, spin) {
    $('#replystatus').removeClass('errorMessage');
    $('#replystatus').text(message);
    if (!message) {
        $('#status').html('&nbsp;');
        return;
    }
    if (message == '') {
        $('#status').html('&nbsp;');
        return;
    }
    $('#status').removeClass('errorMessage');
    $('#status').text(message);
    if (spin) {
        var img = '<img src="img/busy.gif" style="width:16px;height:9px;margin:0px 4px 0px 0px;" />';
        $('#status').prepend(img);
        $('#replystatus').prepend(img);
    }
}

/**
 * Convert URLs to clickable links.
 * URLs to handle:
 * <code>
 *     magnet:?xt.1=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C&xt.2=urn:sha1:TXGCZQTH26NL6OUQAJJPFALHG2LTGBC7
 *     http://localhost:8800/zero/?6f09182b8ea51997#WtLEUO5Epj9UHAV9JFs+6pUQZp13TuspAUjnF+iM+dM=
 *     http://user:password@localhost:8800/zero/?6f09182b8ea51997#WtLEUO5Epj9UHAV9JFs+6pUQZp13TuspAUjnF+iM+dM=
 * </code>
 *
 * @param object element : a jQuery DOM element.
 * @FIXME: add ppa & apt links.
 */
function urls2links(element) {
    var re = /((http|https|ftp):\/\/[\w?=&.\/-;#@~%+-]+(?![\w\s?&.\/;#~%"=-]*>))/ig;
    element.html(element.html().replace(re,'<a href="$1" rel="nofollow">$1</a>'));
    var re = /((magnet):[\w?=&.\/-;#@~%+-]+)/ig;
    element.html(element.html().replace(re,'<a href="$1">$1</a>'));
}

/**
 * Return the deciphering key stored in anchor part of the URL
 */
function pageKey() {
    var key = window.location.hash.substring(1);  // Get key

    // Some stupid web 2.0 services and redirectors add data AFTER the anchor
    // (such as &utm_source=...).
    // We will strip any additional data.

    // First, strip everything after the equal sign (=) which signals end of base64 string.
    i = key.indexOf('='); if (i>-1) { key = key.substring(0,i+1); }

    // If the equal sign was not present, some parameters may remain:
    i = key.indexOf('&'); if (i>-1) { key = key.substring(0,i); }

    // Then add trailing equal sign if it's missing
    if (key.charAt(key.length-1)!=='=') key+='=';

    return key;
}

$(function() {

    // If "burn after reading" is checked, disable discussion.
    $('#burnafterreadingoption > input').change(function() {
        if ($(this).is(':checked') ) { 
            $('#opendisc').addClass('buttondisabled');
            $('#opendisc > input').attr({checked: false});
            $('#opendisc > input').attr('disabled',true);
        }
        else {
            $('#opendisc').removeClass('buttondisabled');
            $('#opendisc > input').removeAttr('disabled');
        }
    });

    // Display status returned by php code if any (eg. Paste was properly deleted.)
    if ($('#status').text().length > 0) {
        showStatus($('#status').text(),false);
        return;
    }

    $('#status').html('&nbsp;'); // Keep line height even if content empty.

    // Display an existing paste
    if ($('#cipherdata').text().length > 1) {
        // Missing decryption key in URL ?
        if (window.location.hash.length == 0) {
            showError('Cannot decrypt paste: Decryption key missing in URL (Did you use a redirector or an URL shortener which strips part of the URL ?)');
            return;
        }

        // List of messages to display
        var messages = jQuery.parseJSON($('#cipherdata').text());

        // Show proper elements on screen.
        stateExistingPaste();

        displayMessages(pageKey(), messages);
    }
    // Display error message from php code.
    else if ($('#errormessage').text().length>1) {
        showError($('#errormessage').text());
    }
    // Create a new paste.
    else {
        newPaste();
    }
});
