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
function secondsToHuman(seconds) {
    if (seconds < 60) {
        var v = Math.floor(seconds);
        return v + ' second' + ((v > 1) ? 's' : '');
    }
    if (seconds < 60 * 60) {
        var v = Math.floor(seconds / 60);
        return v + ' minute' + ((v > 1) ? 's' : '');
    }
    if (seconds < 60 * 60 * 24) {
        var v = Math.floor(seconds / (60 * 60));
        return v + ' hour' + ((v > 1) ? 's' : '');
    }
    // If less than 2 months, display in days:
    if (seconds < 60 * 60 * 24 * 60) {
        var v = Math.floor(seconds / (60 * 60 * 24));
        return v + ' day' + ((v > 1) ? 's' : '');
    }
    var v = Math.floor(seconds / (60 * 60 * 24 * 30));
    return v + ' month' + ((v > 1) ? 's' : '');
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
        if (parameterString === "")
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
function parameterStringToHash(parameterString) {
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
    return Base64.toBase64(RawDeflate.deflate(Base64.utob(message)));
}

/**
 * Decompress a message compressed with compress().
 */
function decompress(data) {
    return Base64.btou(RawDeflate.inflate(Base64.fromBase64(data)));
}

/**
 * Compress, then encrypt message with key.
 *
 * @param string key
 * @param string message
 * @return encrypted string data
 */
function zeroCipher(key, message) {
    return sjcl.encrypt(key, compress(message));
}
/**
 *  Decrypt message with key, then decompress.
 *
 *  @param key
 *  @param encrypted string data
 *  @return string readable message
 */
function zeroDecipher(key, data) {
    return decompress(sjcl.decrypt(key, data));
}

/**
 * @return the current script location (without search or hash part of the URL).
 *   eg. http://server.com/zero/?aaaa#bbbb --> http://server.com/zero/
 */
function scriptLocation() {
    var scriptLocation = window.location.href.substring(0, window.location.href.length
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
function setElementText(element, text, isDataUrl) {
//    console.log(text);
//    console.log(element);
    // For IE<10.
    if ($('div#oldienotice').is(":visible")) {
        // IE<10 does not support white-space:pre-wrap; so we have to do this BIG UGLY STINKING THING.
        var html = htmlEntities(text).replace(/\n/ig, "\r\n<br>");
        element.html('<pre>' + html + '</pre>');
    }
    // for other (sane) browsers:
    else {
        if (!isDataUrl) {
            element.text(text);
        } else {
            element.text(text);
            document.getElementById("cleartext").setAttribute('style', 'display:none');
            document.getElementById('downloadButton').setAttribute('style', 'display:inline');

        }


    }
}

/** Apply syntax coloring to clear text area.
 */
function applySyntaxColoring() {
    if ($('div#cleartext').html().substring(0, 11) != '<pre><code>') {
        // highlight.js expects code to be surrounded by <pre><code>
        $('div#cleartext').html('<pre><code>' + $('div#cleartext').html() + '</code></pre>');
    }
    hljs.highlightBlock(document.getElementById('cleartext'));
    $('div#cleartext').css('padding', '0'); // Remove white padding around code box.
}


/**
 * Show decrypted text in the display area, including discussion (if open)
 *
 * @param string key : decryption key
 * @param array comments : Array of messages to display (items = array with keys ('data','meta')
 */
function displayMessages(key, comments) {
    var isData;
    try { // Try to decrypt the paste.
        var cleartext = zeroDecipher(key, comments[0].data);
        isData = isDataURL(cleartext);

        if (isData) {
            var mimeType = getMimeTypeFromDataURL(cleartext);
            var type = getFileTypeFromMimeType(mimeType);
            var isImage = isImageFromMimeType(mimeType);

            document.getElementById('download').setAttribute('href', cleartext);
            document.getElementById('download').setAttribute('download', 'zerobin-attachment.' + type);
            document.getElementById('downloadButton').setAttribute('style', 'display:inline');
            if (isImage) {
                document.getElementById("uploadPreview").setAttribute("style", "display: inline;");
                document.getElementById('uploadPreview').setAttribute('src', cleartext);
//                cleartext = '<a href="' + cleartext + '" download="zerobin - attachment.' + type + '" target="_blank" id="download">Download</a><img src="' + cleartext + '" / >';
            } else {
//                cleartext = '<a href="' + cleartext + '" download="zerobin-attachment.' + type + '" target="_blank" id="download">Download</a>';
                console.log("file but no image");

//                document.getElementById("uploadPreview").innerHTML("Download this file");
            }


        }
        // only download link
        // cleartext = "<a href='" + cleartext + "' download='jigar." + type + "' target='_blank'>Download</a>";
        // only direct image
        // cleartext = '<img src="' + cleartext + '"/>';
        // both image and download link



    } catch (err) {
        $('div#cleartext').hide();
        $('button#clonebutton').hide();
        showError('Could not decrypt data (Wrong key ?)');
        return;
    }

    setElementText($('div#cleartext'), cleartext, isData);
    urls2links($('div#cleartext')); // Convert URLs to clickable links.

    // comments[0] is the paste itself.

    if (comments[0].meta.syntaxcoloring)
        applySyntaxColoring();

    // Display paste expiration.
    if (comments[0].meta.expire_date)
        $('div#remainingtime').removeClass('foryoureyesonly').text('This document will expire in ' + secondsToHuman(comments[0].meta.remaining_time) + '.').show();
    if (comments[0].meta.burnafterreading) {
        $('div#remainingtime').addClass('foryoureyesonly').text('FOR YOUR EYES ONLY.  Don\'t close this window, this message can\'t be displayed again.').show();
        $('button#clonebutton').hide(); // Discourage cloning (as it can't really be prevented).
    }

    // If the discussion is opened on this paste, display it.
    if (comments[0].meta.opendiscussion) {
        $('div#comments').html('');
        // For each comment.
        for (var i = 1; i < comments.length; i++) {
            var comment = comments[i];
            var cleartext = "[Could not decrypt comment ; Wrong key ?]";
            try {
                cleartext = zeroDecipher(key, comment.data);
            } catch (err) {
            }
            var place = $('div#comments');
            // If parent comment exists, display below (CSS will automatically shift it right.)
            var cname = 'div#comment_' + comment.meta.parentid

            // If the element exists in page
            if ($(cname).length) {
                place = $(cname);
            }
            var divComment = $('<div class="comment" id="comment_' + comment.meta.commentid + '">'
                    + '<div class="commentmeta"><span class="nickname"></span><span class="commentdate"></span></div><div class="commentdata"></div>'
                    + '<button onclick="open_reply($(this),\'' + comment.meta.commentid + '\');return false;">Reply</button>'
                    + '</div>');
            setElementText(divComment.find('div.commentdata'), cleartext, null);
            // Convert URLs to clickable links in comment.
            urls2links(divComment.find('div.commentdata'));
            divComment.find('span.nickname').html('<i>(Anonymous)</i>');

            // Try to get optional nickname:
            try {
                divComment.find('span.nickname').text(zeroDecipher(key, comment.meta.nickname));
            } catch (err) {
            }
            divComment.find('span.commentdate').text('  (' + (new Date(comment.meta.postdate * 1000).toString()) + ')').attr('title', 'CommentID: ' + comment.meta.commentid);

            // If an avatar is available, display it.
            if (comment.meta.vizhash) {
                divComment.find('span.nickname').before('<img src="' + comment.meta.vizhash + '" class="vizhash" title="Anonymous avatar (Vizhash of the IP address)" />');
            }

            place.append(divComment);
        }
        $('div#comments').append('<div class="comment"><button onclick="open_reply($(this),\'' + pasteID() + '\');return false;">Add comment</button></div>');
        $('div#discussion').show();
    }
}

/**
 * Open the comment entry when clicking the "Reply" button of a comment.
 * @param object source : element which emitted the event.
 * @param string commentid = identifier of the comment we want to reply to.
 */
function open_reply(source, commentid) {
    $('div.reply').remove(); // Remove any other reply area.
    source.after('<div class="reply">'
            + '<input type="text" id="nickname" title="Optional nickname..." value="Optional nickname..." />'
            + '<textarea id="replymessage" class="replymessage" cols="80" rows="7"></textarea>'
            + '<br><button id="replybutton" onclick="send_comment(\'' + commentid + '\');return false;">Post comment</button>'
            + '<div id="replystatus">&nbsp;</div>'
            + '</div>');
    $('input#nickname').focus(function() {
        $(this).css('color', '#000');
        if ($(this).val() == $(this).attr('title')) {
            $(this).val('');
        }
    });
    $('textarea#replymessage').focus();
}

/**
 * Send a reply in a discussion.
 * @param string parentid : the comment identifier we want to send a reply to.
 */
function send_comment(parentid) {
    // Do not send if no data.
    if ($('textarea#replymessage').val().length == 0) {
        return;
    }

    showStatus('Sending comment...', spin = true);
    var cipherdata = zeroCipher(pageKey(), $('textarea#replymessage').val());
    var ciphernickname = '';
    var nick = $('input#nickname').val();
    if (nick != '' && nick != 'Optional nickname...') {
        ciphernickname = zeroCipher(pageKey(), nick);
    }
    var data_to_send = {data: cipherdata,
        parentid: parentid,
        pasteid: pasteID(),
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
        else if (data.status == 1) {
            showError('Could not post comment: ' + data.message);
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

    var isFile = false;
    if ($('textarea#message').val().length !== 0) {
        val = $('textarea#message').val();
    } else if ($('#uploadImage').val().length !== 0) {
        isFile = true;
        readFileData();
    } else {
        return;
    }

    // If sjcl has not collected enough entropy yet, display a message.
    if (!sjcl.random.isReady()) {
        showStatus('Sending paste (Please move your mouse for more entropy)...', spin = true);
        sjcl.random.addEventListener('seeded', function() {
            send_data();
        });
        return;
    }

    showStatus('Sending paste...', spin = true);

    var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
//    var cipherdata = zeroCipher(randomkey, $('textarea#message').val());
    var cipherdata = zeroCipher(randomkey, val);
    var data_to_send = {data: cipherdata,
        expire: $('select#pasteExpiration').val(),
        burnafterreading: $('input#burnafterreading').is(':checked') ? 1 : 0,
        opendiscussion: $('input#opendiscussion').is(':checked') ? 1 : 0,
        syntaxcoloring: $('input#syntaxcoloring').is(':checked') ? 1 : 0
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

            $('div#pastelink').html('Your paste is <a id="pasteurl" href="' + url + '">' + url + '</a> <span id="copyhint">(Hit CTRL+C to copy)</span>');
            $('div#deletelink').html('<a href="' + deleteUrl + '">Delete link</a>');
            $('div#pasteresult').show();
            selectText('pasteurl'); // We pre-select the link so that the user only has to CTRL+C the link.

//            setElementText($('div#cleartext'), $('textarea#message').val());
            if (isFile) {
//                setElementText($('div#cleartext'), 'File', null);
            } else {
                setElementText($('div#cleartext'), val, null);
            }

            urls2links($('div#cleartext'));

            // FIXME: Add option to remove syntax highlighting ?
            if ($('input#syntaxcoloring').is(':checked'))
                applySyntaxColoring();

            showStatus('');
        }
        else if (data.status == 1) {
            showError('Could not create paste: ' + data.message);
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
    var doc = document, text = doc.getElementById(element)
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
    $('div#expiration').show();
    $('div#remainingtime').hide();
    $('div#burnafterreadingoption').show();
    $('div#opendisc').show();
    $('div#syntaxcoloringoption').show();
    $('button#newbutton').show();
    $('div#pasteresult').hide();
    $('textarea#message').text('');
    $('textarea#message').show();
    $('div#cleartext').hide();
    $('div#message').focus();
    $('div#discussion').hide();
    $('div#attachfile').show();
}

/**
 * Put the screen in "Existing paste" mode.
 */
function stateExistingPaste() {
    $('button#sendbutton').hide();

    // No "clone" for IE<10.
    if ($('div#oldienotice').is(":visible")) {
        $('button#clonebutton').hide();
    }
    else {
        $('button#clonebutton').show();
    }


    $('button#rawtextbutton').show();
    $('div#expiration').hide();
    $('div#burnafterreadingoption').hide();
    $('div#attachfile').hide();
    $('div#opendisc').hide();
    $('div#syntaxcoloringoption').hide();
    $('button#newbutton').show();
    $('div#pasteresult').hide();
    $('textarea#message').hide();
    $('div#cleartext').show();

}

/** Return raw text
 */
function rawText()
{
    history.pushState(document.title, document.title, 'document.txt');
    var paste = $('div#cleartext').text();
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
    $('textarea#message').text($('div#cleartext').text());
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
    $('div#status').addClass('errorMessage').text(message);
    $('div#replystatus').addClass('errorMessage').text(message);
}

/**
 * Display status
 * (We use the same function for paste and reply to comments)
 *
 * @param string message : text to display
 * @param boolean spin (optional) : tell if the "spinning" animation should be displayed.
 */
function showStatus(message, spin) {
    $('div#replystatus').removeClass('errorMessage');
    $('div#replystatus').text(message);
    if (!message) {
        $('div#status').html('&nbsp;');
        return;
    }
    if (message == '') {
        $('div#status').html('&nbsp;');
        return;
    }
    $('div#status').removeClass('errorMessage');
    $('div#status').text(message);
    if (spin) {
        var img = '<img src="img/busy.gif" style="width:16px;height:9px;margin:0px 4px 0px 0px;" />';
        $('div#status').prepend(img);
        $('div#replystatus').prepend(img);
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
    element.html(element.html().replace(re, '<a href="$1" rel="nofollow">$1</a>'));
    var re = /((magnet):[\w?=&.\/-;#@~%+-]+)/ig;
    element.html(element.html().replace(re, '<a href="$1">$1</a>'));
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
    i = key.indexOf('=');
    if (i > -1) {
        key = key.substring(0, i + 1);
    }

    // If the equal sign was not present, some parameters may remain:
    i = key.indexOf('&');
    if (i > -1) {
        key = key.substring(0, i);
    }

    // Then add trailing equal sign if it's missing
    if (key.charAt(key.length - 1) !== '=')
        key += '=';

    return key;
}

var val;
/*
 * Read file data as dataURL using the FileReader API
 * https://developer.mozilla.org/en-US/docs/Web/API/FileReader#readAsDataURL()
 */

function readFileData() {

    var fr = new FileReader(), rFilter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;
    var f = document.getElementById("uploadImage").files[0];
    fr.readAsDataURL(f);

    fr.onload = function(oFREvent) {

        var dataURL = oFREvent.target.result;
        var mimeType = getMimeTypeFromDataURL(dataURL);
        var isImage = isImageFromMimeType(mimeType);
        if (isImage) {
            document.getElementById("uploadPreview").src = oFREvent.target.result;
            document.getElementById('message').setAttribute('style', 'display:none');
            document.getElementById("uploadPreview").setAttribute("style", "display: inline;");
            showPreview();
        }

        val = dataURL;
    };

}

/**
 *  Checks if the str is a dataURL as obtained using the FileReader API
 *  
 * @param {type} str
 * @returns {@exp;str@call;match}
 * Need to update this handling
 */
function isDataURL(str) {
    return str.match(/^data:.*;base64,/); // using this until a better regex is determined
}

/**
 * Returns true if file is an image, false otherwise
 * @returns {undefined}
 */
function isImageFromMimeType(mimeType) {
    if (mimeType.match(/image\//i))
        return true;

    return false;
}

/**
 * Get Mime Type from a DataURL
 * 
 * @param {type} dataURL
 * @returns Mime Type from a dataURL as obtained for a file using the FileReader API https://developer.mozilla.org/en-US/docs/Web/API/FileReader#readAsDataURL()
 */
function getMimeTypeFromDataURL(dataURL) {
    return dataURL.slice(dataURL.indexOf('data:') + 5, dataURL.indexOf(';base64,'));
}


/**
 * @param {type} mime
 * @returns File Type for a given mime type
 * Reference: Apache
 */
function getFileTypeFromMimeType(mime) {
    var file_types = {
        'application/activemessage': '',
        'application/andrew-inset': 'ez',
        'application/annodex': 'anx',
        'application/applefile': '',
        'application/atom+xml': 'atom',
        'application/atomcat+xml': 'atomcat',
        'application/atomicmail': '',
        'application/atomserv+xml': 'atomsrv',
        'application/batch-SMTP': '',
        'application/bbolin': 'lin',
        'application/beep+xml': '',
        'application/cals-1840': '',
        'application/commonground': '',
        'application/cu-seeme': 'cu',
        'application/cybercash': '',
        'application/davmount+xml': 'davmount',
        'application/dca-rft': '',
        'application/dec-dx': '',
        'application/dicom': 'dcm',
        'application/docbook+xml': '',
        'application/dsptype': 'tsp',
        'application/dvcs': '',
        'application/ecmascript': 'es',
        'application/edi-consent': '',
        'application/edi-x12': '',
        'application/edifact': '',
        'application/eshop': '',
        'application/font-tdpfr': '',
        'application/futuresplash': 'spl',
        'application/ghostview': '',
        'application/hta': 'hta',
        'application/http': '',
        'application/hyperstudio': '',
        'application/iges': '',
        'application/index': '',
        'application/index.cmd': '',
        'application/index.obj': '',
        'application/index.response': '',
        'application/index.vnd': '',
        'application/iotp': '',
        'application/ipp': '',
        'application/isup': '',
        'application/java-archive': 'jar',
        'application/java-serialized-object': 'ser',
        'application/java-vm': 'class',
        'application/javascript': 'js',
        'application/json': 'json',
        'application/m3g': 'm3g',
        'application/mac-binhex40': 'hqx',
        'application/mac-compactpro': 'cpt',
        'application/macwriteii': '',
        'application/marc': '',
        'application/mathematica': 'nb',
        'application/mbox': 'mbox',
        'application/ms-tnef': '',
        'application/msaccess': 'mdb',
        'application/msword': 'doc',
        'application/mxf': 'mxf',
        'application/news-message-id': '',
        'application/news-transmission': '',
        'application/ocsp-request': '',
        'application/ocsp-response': '',
        'application/octet-stream': 'bin',
        'application/oda': 'oda',
        'application/ogg': 'ogx',
        'application/onenote': 'one',
        'application/parityfec': '',
        'application/pdf': 'pdf',
        'application/pgp-encrypted': 'pgp',
        'application/pgp-keys': 'key',
        'application/pgp-signature': 'sig',
        'application/pics-rules': 'prf',
        'application/pkcs10': '',
        'application/pkcs7-mime': '',
        'application/pkcs7-signature': '',
        'application/pkix-cert': '',
        'application/pkix-crl': '',
        'application/pkixcmp': '',
        'application/postscript': 'ps',
        'application/prs.alvestrand.titrax-sheet': '',
        'application/prs.cww': '',
        'application/prs.nprend': '',
        'application/qsig': '',
        'application/rar': 'rar',
        'application/rdf+xml': 'rdf',
        'application/remote-printing': '',
        'application/riscos': '',
        'application/rtf': 'rtf',
        'application/sdp': '',
        'application/set-payment': '',
        'application/set-payment-initiation': '',
        'application/set-registration': '',
        'application/set-registration-initiation': '',
        'application/sgml': '',
        'application/sgml-open-catalog': '',
        'application/sieve': '',
        'application/sla': 'stl',
        'application/slate': '',
        'application/smil': 'smi',
        'application/timestamp-query': '',
        'application/timestamp-reply': '',
        'application/vemmi': '',
        'application/whoispp-query': '',
        'application/whoispp-response': '',
        'application/wita': '',
        'application/x400-bp': '',
        'application/xhtml+xml': 'xhtml',
        'application/xml': 'xml',
        'application/xml-dtd': '',
        'application/xml-external-parsed-entity': '',
        'application/xspf+xml': 'xspf',
        'application/zip': 'zip',
        'application/vnd.3M.Post-it-Notes': '',
        'application/vnd.accpac.simply.aso': '',
        'application/vnd.accpac.simply.imp': '',
        'application/vnd.acucobol': '',
        'application/vnd.aether.imp': '',
        'application/vnd.android.package-archive': 'apk',
        'application/vnd.anser-web-certificate-issue-initiation': '',
        'application/vnd.anser-web-funds-transfer-initiation': '',
        'application/vnd.audiograph': '',
        'application/vnd.bmi': '',
        'application/vnd.businessobjects': '',
        'application/vnd.canon-cpdl': '',
        'application/vnd.canon-lips': '',
        'application/vnd.cinderella': 'cdy',
        'application/vnd.claymore': '',
        'application/vnd.commerce-battelle': '',
        'application/vnd.commonspace': '',
        'application/vnd.comsocaller': '',
        'application/vnd.contact.cmsg': '',
        'application/vnd.cosmocaller': '',
        'application/vnd.ctc-posml': '',
        'application/vnd.cups-postscript': '',
        'application/vnd.cups-raster': '',
        'application/vnd.cups-raw': '',
        'application/vnd.cybank': '',
        'application/vnd.dna': '',
        'application/vnd.dpgraph': '',
        'application/vnd.dxr': '',
        'application/vnd.ecdis-update': '',
        'application/vnd.ecowin.chart': '',
        'application/vnd.ecowin.filerequest': '',
        'application/vnd.ecowin.fileupdate': '',
        'application/vnd.ecowin.series': '',
        'application/vnd.ecowin.seriesrequest': '',
        'application/vnd.ecowin.seriesupdate': '',
        'application/vnd.enliven': '',
        'application/vnd.epson.esf': '',
        'application/vnd.epson.msf': '',
        'application/vnd.epson.quickanime': '',
        'application/vnd.epson.salt': '',
        'application/vnd.epson.ssf': '',
        'application/vnd.ericsson.quickcall': '',
        'application/vnd.eudora.data': '',
        'application/vnd.fdf': '',
        'application/vnd.ffsns': '',
        'application/vnd.flographit': '',
        'application/vnd.framemaker': '',
        'application/vnd.fsc.weblaunch': '',
        'application/vnd.fujitsu.oasys': '',
        'application/vnd.fujitsu.oasys2': '',
        'application/vnd.fujitsu.oasys3': '',
        'application/vnd.fujitsu.oasysgp': '',
        'application/vnd.fujitsu.oasysprs': '',
        'application/vnd.fujixerox.ddd': '',
        'application/vnd.fujixerox.docuworks': '',
        'application/vnd.fujixerox.docuworks.binder': '',
        'application/vnd.fut-misnet': '',
        'application/vnd.google-earth.kml+xml': 'kml',
        'application/vnd.google-earth.kmz': 'kmz',
        'application/vnd.grafeq': '',
        'application/vnd.groove-account': '',
        'application/vnd.groove-identity-message': '',
        'application/vnd.groove-injector': '',
        'application/vnd.groove-tool-message': '',
        'application/vnd.groove-tool-template': '',
        'application/vnd.groove-vcard': '',
        'application/vnd.hhe.lesson-player': '',
        'application/vnd.hp-HPGL': '',
        'application/vnd.hp-PCL': '',
        'application/vnd.hp-PCLXL': '',
        'application/vnd.hp-hpid': '',
        'application/vnd.hp-hps': '',
        'application/vnd.httphone': '',
        'application/vnd.hzn-3d-crossword': '',
        'application/vnd.ibm.MiniPay': '',
        'application/vnd.ibm.afplinedata': '',
        'application/vnd.ibm.modcap': '',
        'application/vnd.informix-visionary': '',
        'application/vnd.intercon.formnet': '',
        'application/vnd.intertrust.digibox': '',
        'application/vnd.intertrust.nncp': '',
        'application/vnd.intu.qbo': '',
        'application/vnd.intu.qfx': '',
        'application/vnd.irepository.package+xml': '',
        'application/vnd.is-xpr': '',
        'application/vnd.japannet-directory-service': '',
        'application/vnd.japannet-jpnstore-wakeup': '',
        'application/vnd.japannet-payment-wakeup': '',
        'application/vnd.japannet-registration': '',
        'application/vnd.japannet-registration-wakeup': '',
        'application/vnd.japannet-setstore-wakeup': '',
        'application/vnd.japannet-verification': '',
        'application/vnd.japannet-verification-wakeup': '',
        'application/vnd.koan': '',
        'application/vnd.lotus-1-2-3': '',
        'application/vnd.lotus-approach': '',
        'application/vnd.lotus-freelance': '',
        'application/vnd.lotus-notes': '',
        'application/vnd.lotus-organizer': '',
        'application/vnd.lotus-screencam': '',
        'application/vnd.lotus-wordpro': '',
        'application/vnd.mcd': '',
        'application/vnd.mediastation.cdkey': '',
        'application/vnd.meridian-slingshot': '',
        'application/vnd.mif': '',
        'application/vnd.minisoft-hp3000-save': '',
        'application/vnd.mitsubishi.misty-guard.trustweb': '',
        'application/vnd.mobius.daf': '',
        'application/vnd.mobius.dis': '',
        'application/vnd.mobius.msl': '',
        'application/vnd.mobius.plc': '',
        'application/vnd.mobius.txf': '',
        'application/vnd.motorola.flexsuite': '',
        'application/vnd.motorola.flexsuite.adsi': '',
        'application/vnd.motorola.flexsuite.fis': '',
        'application/vnd.motorola.flexsuite.gotap': '',
        'application/vnd.motorola.flexsuite.kmr': '',
        'application/vnd.motorola.flexsuite.ttc': '',
        'application/vnd.motorola.flexsuite.wem': '',
        'application/vnd.mozilla.xul+xml': 'xul',
        'application/vnd.ms-artgalry': '',
        'application/vnd.ms-asf': '',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.ms-excel.addin.macroEnabled.12': 'xlam',
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12': 'xlsb',
        'application/vnd.ms-excel.sheet.macroEnabled.12': 'xlsm',
        'application/vnd.ms-excel.template.macroEnabled.12': 'xltm',
        'application/vnd.ms-fontobject': 'eot',
        'application/vnd.ms-lrm': '',
        'application/vnd.ms-officetheme': 'thmx',
        'application/vnd.ms-pki.seccat': 'cat',
        '#application/vnd.ms-pki.stl': 'stl',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.ms-powerpoint.addin.macroEnabled.12': 'ppam',
        'application/vnd.ms-powerpoint.presentation.macroEnabled.12': 'pptm',
        'application/vnd.ms-powerpoint.slide.macroEnabled.12': 'sldm',
        'application/vnd.ms-powerpoint.slideshow.macroEnabled.12': 'ppsm',
        'application/vnd.ms-powerpoint.template.macroEnabled.12': 'potm',
        'application/vnd.ms-project': '',
        'application/vnd.ms-tnef': '',
        'application/vnd.ms-word.document.macroEnabled.12': 'docm',
        'application/vnd.ms-word.template.macroEnabled.12': 'dotm',
        'application/vnd.ms-works': '',
        'application/vnd.mseq': '',
        'application/vnd.msign': '',
        'application/vnd.music-niff': '',
        'application/vnd.musician': '',
        'application/vnd.netfpx': '',
        'application/vnd.noblenet-directory': '',
        'application/vnd.noblenet-sealer': '',
        'application/vnd.noblenet-web': '',
        'application/vnd.novadigm.EDM': '',
        'application/vnd.novadigm.EDX': '',
        'application/vnd.novadigm.EXT': '',
        'application/vnd.oasis.opendocument.chart': 'odc',
        'application/vnd.oasis.opendocument.database': 'odb',
        'application/vnd.oasis.opendocument.formula': 'odf',
        'application/vnd.oasis.opendocument.graphics': 'odg',
        'application/vnd.oasis.opendocument.graphics-template': 'otg',
        'application/vnd.oasis.opendocument.image': 'odi',
        'application/vnd.oasis.opendocument.presentation': 'odp',
        'application/vnd.oasis.opendocument.presentation-template': 'otp',
        'application/vnd.oasis.opendocument.spreadsheet': 'ods',
        'application/vnd.oasis.opendocument.spreadsheet-template': 'ots',
        'application/vnd.oasis.opendocument.text': 'odt',
        'application/vnd.oasis.opendocument.text-master': 'odm',
        'application/vnd.oasis.opendocument.text-template': 'ott',
        'application/vnd.oasis.opendocument.text-web': 'oth',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.slide': 'sldx',
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow': 'ppsx',
        'application/vnd.openxmlformats-officedocument.presentationml.template': 'potx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.template': 'xltx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template':'xltx',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template': 'dotx',
        'application/vnd.osa.netdeploy': '',
        'application/vnd.palm': '',
        'application/vnd.pg.format': '',
        'application/vnd.pg.osasli': '',
        'application/vnd.powerbuilder6': '',
        'application/vnd.powerbuilder6-s': '',
        'application/vnd.powerbuilder7': '',
        'application/vnd.powerbuilder7-s': '',
        'application/vnd.powerbuilder75': '',
        'application/vnd.powerbuilder75-s': '',
        'application/vnd.previewsystems.box': '',
        'application/vnd.publishare-delta-tree': '',
        'application/vnd.pvi.ptid1': '',
        'application/vnd.pwg-xhtml-print+xml': '',
        'application/vnd.rapid': '',
        'application/vnd.rim.cod': 'cod',
        'application/vnd.s3sms': '',
        'application/vnd.seemail': '',
        'application/vnd.shana.informed.formdata': '',
        'application/vnd.shana.informed.formtemplate': '',
        'application/vnd.shana.informed.interchange': '',
        'application/vnd.shana.informed.package': '',
        'application/vnd.smaf': 'mmf',
        'application/vnd.sss-cod': '',
        'application/vnd.sss-dtf': '',
        'application/vnd.sss-ntf': '',
        'application/vnd.stardivision.calc': 'sdc',
        'application/vnd.stardivision.chart': 'sds',
        'application/vnd.stardivision.draw': 'sda',
        'application/vnd.stardivision.impress': 'sdd',
        'application/vnd.stardivision.math': 'sdf',
        'application/vnd.stardivision.writer': 'sdw',
        'application/vnd.stardivision.writer-global': 'sgl',
        'application/vnd.street-stream': '',
        'application/vnd.sun.xml.calc': 'sxc',
        'application/vnd.sun.xml.calc.template': 'stc',
        'application/vnd.sun.xml.draw': 'sxd',
        'application/vnd.sun.xml.draw.template': 'std',
        'application/vnd.sun.xml.impress': 'sxi',
        'application/vnd.sun.xml.impress.template': 'sti',
        'application/vnd.sun.xml.math': 'sxm',
        'application/vnd.sun.xml.writer': 'sxw',
        'application/vnd.sun.xml.writer.global': 'sxg',
        'application/vnd.sun.xml.writer.template': 'stw',
        'application/vnd.svd': '',
        'application/vnd.swiftview-ics': '',
        'application/vnd.symbian.install': 'sis',
        'application/vnd.tcpdump.pcap': 'cap',
        'application/vnd.triscape.mxs': '',
        'application/vnd.trueapp': '',
        'application/vnd.truedoc': '',
        'application/vnd.tve-trigger': '',
        'application/vnd.ufdl': '',
        'application/vnd.uplanet.alert': '',
        'application/vnd.uplanet.alert-wbxml': '',
        'application/vnd.uplanet.bearer-choice': '',
        'application/vnd.uplanet.bearer-choice-wbxml': '',
        'application/vnd.uplanet.cacheop': '',
        'application/vnd.uplanet.cacheop-wbxml': '',
        'application/vnd.uplanet.channel': '',
        'application/vnd.uplanet.channel-wbxml': '',
        'application/vnd.uplanet.list': '',
        'application/vnd.uplanet.list-wbxml': '',
        'application/vnd.uplanet.listcmd': '',
        'application/vnd.uplanet.listcmd-wbxml': '',
        'application/vnd.uplanet.signal': '',
        'application/vnd.vcx': '',
        'application/vnd.vectorworks': '',
        'application/vnd.vidsoft.vidconference': '',
        'application/vnd.visio': 'vsd',
        'application/vnd.vividence.scriptfile': '',
        'application/vnd.wap.sic': '',
        'application/vnd.wap.slc': '',
        'application/vnd.wap.wbxml': 'wbxml',
        'application/vnd.wap.wmlc': 'wmlc',
        'application/vnd.wap.wmlscriptc': 'wmlsc',
        'application/vnd.webturbo': '',
        'application/vnd.wordperfect': 'wpd',
        'application/vnd.wordperfect5.1': 'wp5',
        'application/vnd.wrq-hp3000-labelled': '',
        'application/vnd.wt.stf': '',
        'application/vnd.xara': '',
        'application/vnd.xfdl': '',
        'application/vnd.yellowriver-custom-menu': '',
        'application/x-123': 'wk',
        'application/x-7z-compressed': '7z',
        'application/x-abiword': 'abw',
        'application/x-apple-diskimage': 'dmg',
        'application/x-bcpio': 'bcpio',
        'application/x-bittorrent': 'torrent',
        'application/x-cab': 'cab',
        'application/x-cbr': 'cbr',
        'application/x-cbz': 'cbz',
        'application/x-cdf': 'cdf',
        'application/x-cdlink': 'vcd',
        'application/x-chess-pgn': 'pgn',
        'application/x-comsol': 'mph',
        'application/x-core': '',
        'application/x-cpio': 'cpio',
        'application/x-csh': 'csh',
        'application/x-debian-package': 'deb',
        'application/x-director': 'dcr',
        'application/x-dms': 'dms',
        'application/x-doom': 'wad',
        'application/x-dvi': 'dvi',
        'application/x-executable': '',
        'application/x-font': 'pfa',
        'application/x-font-woff': 'woff',
        'application/x-freemind': 'mm',
        'application/x-futuresplash': 'spl',
        'application/x-ganttproject': 'gan',
        'application/x-gnumeric': 'gnumeric',
        'application/x-go-sgf': 'sgf',
        'application/x-graphing-calculator': 'gcf',
        'application/x-gtar': 'gtar',
        'application/x-gtar-compressed': 'tgz',
        'application/x-hdf': 'hdf',
        '#application/x-httpd-eruby': 'rhtml',
        '#application/x-httpd-php': 'phtml',
        '#application/x-httpd-php-source': 'phps',
        '#application/x-httpd-php3': 'php3',
        '#application/x-httpd-php3-preprocessed': 'php3p',
        '#application/x-httpd-php4': 'php4',
        '#application/x-httpd-php5': 'php5',
        'application/x-hwp': 'hwp',
        'application/x-ica': 'ica',
        'application/x-info': 'info',
        'application/x-internet-signup': 'ins',
        'application/x-iphone': 'iii',
        'application/x-iso9660-image': 'iso',
        'application/x-jam': 'jam',
        'application/x-java-applet': '',
        'application/x-java-bean': '',
        'application/x-java-jnlp-file': 'jnlp',
        'application/x-jmol': 'jmz',
        'application/x-kchart': 'chrt',
        'application/x-kdelnk': '',
        'application/x-killustrator': 'kil',
        'application/x-koan': 'skp',
        'application/x-kpresenter': 'kpr',
        'application/x-kspread': 'ksp',
        'application/x-kword': 'kwd',
        'application/x-latex': 'latex',
        'application/x-lha': 'lha',
        'application/x-lyx': 'lyx',
        'application/x-lzh': 'lzh',
        'application/x-lzx': 'lzx',
        'application/x-maker': 'frm',
        'application/x-md5': 'md5',
        'application/x-mif': 'mif',
        'application/x-mpegURL': 'm3u8',
        'application/x-ms-wmd': 'wmd',
        'application/x-ms-wmz': 'wmz',
        'application/x-msdos-program': 'com',
        'application/x-msi': 'msi',
        'application/x-netcdf': 'nc',
        'application/x-ns-proxy-autoconfig': 'pac',
        'application/x-nwc': 'nwc',
        'application/x-object': 'o',
        'application/x-oz-application': 'oza',
        'application/x-pkcs7-certreqresp': 'p7r',
        'application/x-pkcs7-crl': 'crl',
        'application/x-python-code': 'pyc',
        'application/x-qgis': 'qgs',
        'application/x-quicktimeplayer': 'qtl',
        'application/x-rdp': 'rdp',
        'application/x-redhat-package-manager': 'rpm',
        'application/x-rss+xml': 'rss',
        'application/x-ruby': 'rb',
        'application/x-rx': '',
        'application/x-scilab': 'sci',
        'application/x-scilab-xcos': 'xcos',
        'application/x-sh': 'sh',
        'application/x-sha1': 'sha1',
        'application/x-shar': 'shar',
        'application/x-shellscript': '',
        'application/x-shockwave-flash': 'swf',
        'application/x-silverlight': 'scr',
        'application/x-sql': 'sql',
        'application/x-stuffit': 'sit',
        'application/x-sv4cpio': 'sv4cpio',
        'application/x-sv4crc': 'sv4crc',
        'application/x-tar': 'tar',
        'application/x-tcl': 'tcl',
        'application/x-tex-gf': 'gf',
        'application/x-tex-pk': 'pk',
        'application/x-texinfo': 'texinfo',
        'application/x-trash': '~',
        'application/x-troff': 't',
        'application/x-troff-man': 'man',
        'application/x-troff-me': 'me',
        'application/x-troff-ms': 'ms',
        'application/x-ustar': 'ustar',
        'application/x-videolan': '',
        'application/x-wais-source': 'src',
        'application/x-wingz': 'wz',
        'application/x-x509-ca-cert': 'crt',
        'application/x-xcf': 'xcf',
        'application/x-xfig': 'fig',
        'application/x-xpinstall': 'xpi',
        'audio/32kadpcm': '',
        'audio/3gpp': '',
        'audio/amr': 'amr',
        'audio/amr-wb': 'awb',
        'audio/amr':'amr',
                'audio/amr-wb':'awb',
                'audio/annodex': 'axa',
        'audio/basic': 'au',
        'audio/csound': 'csd',
        'audio/flac': 'flac',
        'audio/g.722.1': '',
        'audio/l16': '',
        'audio/midi': 'mid',
        'audio/mp4a-latm': '',
        'audio/mpa-robust': '',
        'audio/mpeg': 'mpga',
        'audio/mpegurl': 'm3u',
        'audio/ogg': 'oga',
        'audio/parityfec': '',
        'audio/prs.sid': 'sid',
        'audio/telephone-event': '',
        'audio/tone': '',
        'audio/vnd.cisco.nse': '',
        'audio/vnd.cns.anp1': '',
        'audio/vnd.cns.inf1': '',
        'audio/vnd.digital-winds': '',
        'audio/vnd.everad.plj': '',
        'audio/vnd.lucent.voice': '',
        'audio/vnd.nortel.vbk': '',
        'audio/vnd.nuera.ecelp4800': '',
        'audio/vnd.nuera.ecelp7470': '',
        'audio/vnd.nuera.ecelp9600': '',
        'audio/vnd.octel.sbc': '',
        'audio/vnd.qcelp': '',
        'audio/vnd.rhetorex.32kadpcm': '',
        'audio/vnd.vmx.cvsd': '',
        'audio/x-aiff': 'aif',
        'audio/x-gsm': 'gsm',
        'audio/x-mpegurl': 'm3u',
        'audio/x-ms-wma': 'wma',
        'audio/x-ms-wax': 'wax',
        'audio/x-pn-realaudio-plugin': '',
        'audio/x-pn-realaudio': 'ra',
        'audio/x-realaudio': 'ra',
        'audio/x-scpls': 'pls',
        'audio/x-sd2': 'sd2',
        'audio/x-wav': 'wav',
        'chemical/x-alchemy': 'alc',
        'chemical/x-cache': 'cac',
        'chemical/x-cache-csf': 'csf',
        'chemical/x-cactvs-binary': 'cbin',
        'chemical/x-cdx': 'cdx',
        'chemical/x-cerius': 'cer',
        'chemical/x-chem3d': 'c3d',
        'chemical/x-chemdraw': 'chm',
        'chemical/x-cif': 'cif',
        'chemical/x-cmdf': 'cmdf',
        'chemical/x-cml': 'cml',
        'chemical/x-compass': 'cpa',
        'chemical/x-crossfire': 'bsd',
        'chemical/x-csml': 'csml',
        'chemical/x-ctx': 'ctx',
        'chemical/x-cxf': 'cxf',
        '#chemical/x-daylight-smiles': 'smi',
        'chemical/x-embl-dl-nucleotide': 'emb',
        'chemical/x-galactic-spc': 'spc',
        'chemical/x-gamess-input': 'inp',
        'chemical/x-gaussian-checkpoint': 'fch',
        'chemical/x-gaussian-cube': 'cub',
        'chemical/x-gaussian-input': 'gau',
        'chemical/x-gaussian-log': 'gal',
        'chemical/x-gcg8-sequence': 'gcg',
        'chemical/x-genbank': 'gen',
        'chemical/x-hin': 'hin',
        'chemical/x-isostar': 'istr',
        'chemical/x-jcamp-dx': 'jdx',
        'chemical/x-kinemage': 'kin',
        'chemical/x-macmolecule': 'mcm',
        'chemical/x-macromodel-input': 'mmd',
        'chemical/x-mdl-molfile': 'mol',
        'chemical/x-mdl-rdfile': 'rd',
        'chemical/x-mdl-rxnfile': 'rxn',
        'chemical/x-mdl-sdfile': 'sd',
        'chemical/x-mdl-tgf': 'tgf',
        '#chemical/x-mif': 'mif',
        'chemical/x-mmcif': 'mcif',
        'chemical/x-mol2': 'mol2',
        'chemical/x-molconn-Z': 'b',
        'chemical/x-mopac-graph': 'gpt',
        'chemical/x-mopac-input': 'mop',
        'chemical/x-mopac-out': 'moo',
        'chemical/x-mopac-vib': 'mvb',
        'chemical/x-ncbi-asn1': 'asn',
        'chemical/x-ncbi-asn1-ascii': 'prt',
        'chemical/x-ncbi-asn1-binary': 'val',
        'chemical/x-ncbi-asn1-spec': 'asn',
        'chemical/x-pdb': 'pdb',
        'chemical/x-rosdal': 'ros',
        'chemical/x-swissprot': 'sw',
        'chemical/x-vamas-iso14976': 'vms',
        'chemical/x-vmd': 'vmd',
        'chemical/x-xtel': 'xtel',
        'chemical/x-xyz': 'xyz',
        'image/cgm': '',
        'image/g3fax': '',
        'image/gif': 'gif',
        'image/ief': 'ief',
        'image/jpeg': 'jpeg',
        'image/naplps': '',
        'image/pcx': 'pcx',
        'image/png': 'png',
        'image/prs.btif': '',
        'image/prs.pti': '',
        'image/svg+xml': 'svg',
        'image/tiff': 'tiff',
        'image/vnd.cns.inf2': '',
        'image/vnd.djvu': 'djvu',
        'image/vnd.dwg': '',
        'image/vnd.dxf': '',
        'image/vnd.fastbidsheet': '',
        'image/vnd.fpx': '',
        'image/vnd.fst': '',
        'image/vnd.fujixerox.edmics-mmr': '',
        'image/vnd.fujixerox.edmics-rlc': '',
        'image/vnd.microsoft.icon': 'ico',
        'image/vnd.mix': '',
        'image/vnd.net-fpx': '',
        'image/vnd.svf': '',
        'image/vnd.wap.wbmp': 'wbmp',
        'image/vnd.xiff': '',
        'image/x-canon-cr2': 'cr2',
        'image/x-canon-crw': 'crw',
        'image/x-cmu-raster': 'ras',
        'image/x-coreldraw': 'cdr',
        'image/x-coreldrawpattern': 'pat',
        'image/x-coreldrawtemplate': 'cdt',
        'image/x-corelphotopaint': 'cpt',
        'image/x-epson-erf': 'erf',
        'image/x-icon': '',
        'image/x-jg': 'art',
        'image/x-jng': 'jng',
        'image/x-ms-bmp': 'bmp',
        'image/x-nikon-nef': 'nef',
        'image/x-olympus-orf': 'orf',
        'image/x-photoshop': 'psd',
        'image/x-portable-anymap': 'pnm',
        'image/x-portable-bitmap': 'pbm',
        'image/x-portable-graymap': 'pgm',
        'image/x-portable-pixmap': 'ppm',
        'image/x-rgb': 'rgb',
        'image/x-xbitmap': 'xbm',
        'image/x-xpixmap': 'xpm',
        'image/x-xwindowdump': 'xwd',
        'inode/chardevice': '',
        'inode/blockdevice': '',
        'inode/directory-locked': '',
        'inode/directory': '',
        'inode/fifo': '',
        'inode/socket': '',
        'message/delivery-status': '',
        'message/disposition-notification': '',
        'message/external-body': '',
        'message/http': '',
        'message/s-http': '',
        'message/news': '',
        'message/partial': '',
        'message/rfc822': 'eml',
        'model/iges': 'igs',
        'model/mesh': 'msh',
        'model/vnd.dwf': '',
        'model/vnd.flatland.3dml': '',
        'model/vnd.gdl': '',
        'model/vnd.gs-gdl': '',
        'model/vnd.gtw': '',
        'model/vnd.mts': '',
        'model/vnd.vtu': '',
        'model/vrml': 'wrl',
        'model/x3d+vrml': 'x3dv',
        'model/x3d+xml': 'x3d',
        'model/x3d+binary': 'x3db',
        'multipart/alternative': '',
        'multipart/appledouble': '',
        'multipart/byteranges': '',
        'multipart/digest': '',
        'multipart/encrypted': '',
        'multipart/form-data': '',
        'multipart/header-set': '',
        'multipart/mixed': '',
        'multipart/parallel': '',
        'multipart/related': '',
        'multipart/report': '',
        'multipart/signed': '',
        'multipart/voice-message': '',
        'text/cache-manifest': 'appcache',
        'text/calendar': 'ics',
        'text/css': 'css',
        'text/csv': 'csv',
        'text/directory': '',
        'text/english': '',
        'text/enriched': '',
        'text/h323': '323',
        'text/html': 'html',
        'text/iuls': 'uls',
        'text/mathml': 'mml',
        'text/parityfec': '',
        'text/plain': 'asc',
        'text/prs.lines.tag': '',
        'text/rfc822-headers': '',
        'text/richtext': 'rtx',
        'text/rtf': '',
        'text/scriptlet': 'sct',
        'text/t140': '',
        'text/texmacs': 'tm',
        'text/tab-separated-values': 'tsv',
        'text/uri-list': '',
        'text/vnd.abc': '',
        'text/vnd.curl': '',
        'text/vnd.DMClientScript': '',
        'text/vnd.flatland.3dml': '',
        'text/vnd.fly': '',
        'text/vnd.fmi.flexstor': '',
        'text/vnd.in3d.3dml': '',
        'text/vnd.in3d.spot': '',
        'text/vnd.IPTC.NewsML': '',
        'text/vnd.IPTC.NITF': '',
        'text/vnd.latex-z': '',
        'text/vnd.motorola.reflex': '',
        'text/vnd.ms-mediapackage': '',
        'text/vnd.sun.j2me.app-descriptor': 'jad',
        'text/vnd.wap.si': '',
        'text/vnd.wap.sl': '',
        'text/vnd.wap.wml': 'wml',
        'text/vnd.wap.wmlscript': 'wmls',
        'text/x-bibtex': 'bib',
        'text/x-boo': 'boo',
        'text/x-c++hdr': 'h++',
        'text/x-c++src': 'c++',
        'text/x-chdr': 'h',
        'text/x-component': 'htc',
        'text/x-crontab': '',
        'text/x-csh': 'csh',
        'text/x-csrc': 'c',
        'text/x-dsrc': 'd',
        'text/x-diff': 'diff',
        'text/x-haskell': 'hs',
        'text/x-java': 'java',
        'text/x-lilypond': 'ly',
        'text/x-literate-haskell': 'lhs',
        'text/x-makefile': '',
        'text/x-moc': 'moc',
        'text/x-pascal': 'p',
        'text/x-pcs-gcd': 'gcd',
        'text/x-perl': 'pl',
        'text/x-python': 'py',
        'text/x-scala': 'scala',
        'text/x-server-parsed-html': '',
        'text/x-setext': 'etx',
        'text/x-sfv': 'sfv',
        'text/x-sh': 'sh',
        'text/x-tcl': 'tcl',
        'text/x-tex': 'tex',
        'text/x-vcalendar': 'vcs',
        'text/x-vcard': 'vcf',
        'video/3gpp': '3gp',
        'video/annodex': 'axv',
        'video/dl': 'dl',
        'video/dv': 'dif',
        'video/fli': 'fli',
        'video/gl': 'gl',
        'video/mpeg': 'mpeg',
        'video/MP2T': 'ts',
        'video/mp4': 'mp4',
        'video/quicktime': 'qt',
        'video/mp4v-es': '',
        'video/ogg': 'ogv',
        'video/parityfec': '',
        'video/pointer': '',
        'video/webm': 'webm',
        'video/vnd.fvt': '',
        'video/vnd.motorola.video': '',
        'video/vnd.motorola.videop': '',
        'video/vnd.mpegurl': 'mxu',
        'video/vnd.mts': '',
        'video/vnd.nokia.interleaved-multimedia': '',
        'video/vnd.vivo': '',
        'video/x-flv': 'flv',
        'video/x-la-asf': 'lsf',
        'video/x-mng': 'mng',
        'video/x-ms-asf': 'asf',
        'video/x-ms-wm': 'wm',
        'video/x-ms-wmv': 'wmv',
        'video/x-ms-wmx': 'wmx',
        'video/x-ms-wvx': 'wvx',
        'video/x-msvideo': 'avi',
        'video/x-sgi-movie': 'movie',
        'video/x-matroska': 'mpv',
        'x-conference/x-cooltalk': 'ice',
        'x-epoc/x-sisx-app': 'sisx',
        'x-world/x-vrml': 'vrm'
    };

    return file_types[mime];
}


/**
 *
 * @returns a preview of the uploaded image
 */

function showPreview() {
    document.getElementById('message').setAttribute('style', 'display:none');
    document.getElementById("uploadPreview").setAttribute("style", "display: inline;");
}

$(function() {

    // If "burn after reading" is checked, disable discussion.
    $('input#burnafterreading').change(function() {
        if ($(this).is(':checked')) {
            $('div#opendisc').addClass('buttondisabled');
            $('input#opendiscussion').attr({checked: false});
            $('input#opendiscussion').attr('disabled', true);
        }
        else {
            $('div#opendisc').removeClass('buttondisabled');
            $('input#opendiscussion').removeAttr('disabled');
        }
    });

    // Display status returned by php code if any (eg. Paste was properly deleted.)
    if ($('div#status').text().length > 0) {
        showStatus($('div#status').text(), false);
        return;
    }

    $('div#status').html('&nbsp;'); // Keep line height even if content empty.

    // Display an existing paste
    if ($('div#cipherdata').text().length > 1) {
        // Missing decryption key in URL ?
        if (window.location.hash.length == 0) {
            showError('Cannot decrypt paste: Decryption key missing in URL (Did you use a redirector or an URL shortener which strips part of the URL ?)');
            return;
        }

        // List of messages to display
        var messages = jQuery.parseJSON($('div#cipherdata').text());

        // Show proper elements on screen.
        stateExistingPaste();

        displayMessages(pageKey(), messages);
    }
    // Display error message from php code.
    else if ($('div#errormessage').text().length > 1) {
        showError($('div#errormessage').text());
    }
    // Create a new paste.
    else {
        newPaste();
    }
});