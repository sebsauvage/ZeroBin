/**
 * ZeroBin
 *
 * a zero-knowledge paste bin
 *
 * @link      http://sebsauvage.net/wiki/doku.php?id=php:zerobin
 * @copyright 2012 Sébastien SAUVAGE (sebsauvage.net)
 * @license   http://www.opensource.org/licenses/zlib-license.php The zlib/libpng License
 * @version   0.22
 */

'use strict';

// Immediately start random number generator collector.
sjcl.random.startCollectors();

$(function() {
    /**
     * static helper methods
     */
    var helper = {
        /**
         * Converts a duration (in seconds) into human friendly approximation.
         *
         * @param int seconds
         * @return array
         */
        secondsToHuman: function(seconds)
        {
            if (seconds < 60)
            {
                var v = Math.floor(seconds);
                return [v, 'second'];
            }
            if (seconds < 60 * 60)
            {
                var v = Math.floor(seconds / 60);
                return [v, 'minute'];
            }
            if (seconds < 60 * 60 * 24)
            {
                var v = Math.floor(seconds / (60 * 60));
                return [v, 'hour'];
            }
            // If less than 2 months, display in days:
            if (seconds < 60 * 60 * 24 * 60)
            {
                var v = Math.floor(seconds / (60 * 60 * 24));
                return [v, 'day'];
            }
            var v = Math.floor(seconds / (60 * 60 * 24 * 30));
            return [v, 'month'];
        },

        /**
         * Converts an associative array to an encoded string
         * for appending to the anchor.
         *
         * @param object associative_array Object to be serialized
         * @return string
         */
        hashToParameterString: function(associativeArray)
        {
            var parameterString = '';
            for (key in associativeArray)
            {
                if(parameterString === '')
                {
                    parameterString = encodeURIComponent(key);
                    parameterString += '=' + encodeURIComponent(associativeArray[key]);
                }
                else
                {
                    parameterString += '&' + encodeURIComponent(key);
                    parameterString += '=' + encodeURIComponent(associativeArray[key]);
                }
            }
            // padding for URL shorteners
            parameterString += '&p=p';

            return parameterString;
        },

        /**
         * Converts a string to an associative array.
         *
         * @param string parameter_string String containing parameters
         * @return object
         */
        parameterStringToHash: function(parameterString)
        {
            var parameterHash = {};
            var parameterArray = parameterString.split('&');
            for (var i = 0; i < parameterArray.length; i++)
            {
                var pair = parameterArray[i].split('=');
                var key = decodeURIComponent(pair[0]);
                var value = decodeURIComponent(pair[1]);
                parameterHash[key] = value;
            }

            return parameterHash;
        },

        /**
         * Get an associative array of the parameters found in the anchor
         *
         * @return object
         */
        getParameterHash: function()
        {
            var hashIndex = window.location.href.indexOf('#');
            if (hashIndex >= 0)
            {
                return this.parameterStringToHash(window.location.href.substring(hashIndex + 1));
            }
            else
            {
                return {};
            }
        },

        /**
         * Convert all applicable characters to HTML entities
         *
         * @param string str
         * @return string encoded string
         */
        htmlEntities: function(str)
        {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        },

        /**
         * Text range selection.
         * From: http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
         *
         * @param string element : Indentifier of the element to select (id="").
         */
        selectText: function(element)
        {
            var doc = document,
                text = doc.getElementById(element),
                range,
                selection;

            // MS
            if (doc.body.createTextRange)
            {
                range = doc.body.createTextRange();
                range.moveToElementText(text);
                range.select();
            }
            // all others
            else if (window.getSelection)
            {
                selection = window.getSelection();
                range = doc.createRange();
                range.selectNodeContents(text);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        },

        /**
         * Set text of a DOM element (required for IE)
         * This is equivalent to element.text(text)
         *
         * @param object element : a DOM element.
         * @param string text : the text to enter.
         */
        setElementText: function(element, text)
        {
            // For IE<10: Doesn't support white-space:pre-wrap; so we have to do this...
            if ($('#oldienotice').is(':visible')) {
                var html = this.htmlEntities(text).replace(/\n/ig,'\r\n<br>');
                element.html('<pre>'+html+'</pre>');
            }
            // for other (sane) browsers:
            else
            {
                element.text(text);
            }
        },

        /**
         * replace last child of element with message
         *
         * @param object element : a jQuery wrapped DOM element.
         * @param string message : the message to append.
         */
        setMessage: function(element, message)
        {
            var content = element.contents();
            if (content.length > 0)
            {
                content[content.length - 1].nodeValue = ' ' + message;
            }
            else
            {
                this.setElementText(element, message);
            }
        },

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
         */
        urls2links: function(element)
        {
            var markup = '<a href="$1" rel="nofollow">$1</a>';
            element.html(
                element.html().replace(
                    /((http|https|ftp):\/\/[\w?=&.\/-;#@~%+-]+(?![\w\s?&.\/;#~%"=-]*>))/ig,
                    markup
                )
            );
            element.html(
                element.html().replace(
                    /((magnet):[\w?=&.\/-;#@~%+-]+)/ig,
                    markup
                )
            );
        },

        /**
         * minimal sprintf emulation for %s and %d formats
         * From: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format#4795914
         *
         * @param string format
         * @param mixed args one or multiple parameters injected into format string
         * @return string
         */
        sprintf: function()
        {
            var args = arguments;
            if (typeof arguments[0] == 'object') args = arguments[0];
            var string = args[0],
                i = 1;
            return string.replace(/%((%)|s|d)/g, function (m) {
                // m is the matched format, e.g. %s, %d
                var val = null;
                if (m[2]) {
                    val = m[2];
                } else {
                    val = args[i];
                    // A switch statement so that the formatter can be extended.
                    switch (m)
                    {
                        case '%d':
                            val = parseFloat(val);
                            if (isNaN(val)) {
                                val = 0;
                            }
                            break;
                        // Default is %s
                    }
                    ++i;
                }
                return val;
            });
        },

        /**
         * get value of cookie, if it was set, empty string otherwise
         * From: http://www.w3schools.com/js/js_cookies.asp
         *
         * @param string cname
         * @return string
         */
        getCookie: function(cname) {
            var name = cname + '=';
            var ca = document.cookie.split(';');
            for(var i = 0; i < ca.length; ++i) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
            }
            return '';
        }
    };

    /**
     * internationalization methods
     */
    var i18n = {
        /**
         * supported languages, minus the built in 'en'
         */
        supportedLanguages: ['de', 'fr', 'pl', 'sl'],

        /**
         * translate a string, alias for translate()
         *
         * @param string $messageId
         * @param mixed args one or multiple parameters injected into placeholders
         * @return string
         */
        _: function()
        {
            return this.translate(arguments);
        },

        /**
         * translate a string
         *
         * @param string $messageId
         * @param mixed args one or multiple parameters injected into placeholders
         * @return string
         */
        translate: function()
        {
            var args = arguments, messageId, usesPlurals;
            if (typeof arguments[0] == 'object') args = arguments[0];
            if (usesPlurals = $.isArray(args[0]))
            {
                // use the first plural form as messageId, otherwise the singular
                messageId = (args[0].length > 1 ? args[0][1] : args[0][0]);
            }
            else
            {
                messageId = args[0];
            }
            if (messageId.length == 0) return messageId;
            if (!this.translations.hasOwnProperty(messageId))
            {
                if (this.language != 'en') console.debug(
                    'Missing translation for: ' + messageId
                );
                this.translations[messageId] = args[0];
            }
            if (usesPlurals && $.isArray(this.translations[messageId]))
            {
                var n = parseInt(args[1] || 1),
                    key = this.getPluralForm(n),
                    maxKey = this.translations[messageId].length - 1;
                if (key > maxKey) key = maxKey;
                args[0] = this.translations[messageId][key];
                args[1] = n;
            }
            else
            {
                args[0] = this.translations[messageId];
            }
            return helper.sprintf(args);
        },

        /**
         * per language functions to use to determine the plural form
         * From: http://localization-guide.readthedocs.org/en/latest/l10n/pluralforms.html
         *
         * @param int number
         * @return int array key
         */
        getPluralForm: function(n) {
            switch (this.language)
            {
                case 'fr':
                    return (n > 1 ? 1 : 0);
                case 'pl':
                    return (n == 1 ? 0 : n%10 >= 2 && n %10 <=4 && (n%100 < 10 || n%100 >= 20) ? 1 : 2);
                // en, de
                default:
                    return (n != 1 ? 1 : 0);
            }
        },

        /**
         * load translations into cache, then execute callback function
         *
         * @param function callback
         */
        loadTranslations: function(callback)
        {
            var selectedLang = helper.getCookie('lang');
            var language = selectedLang.length > 0 ? selectedLang : (navigator.language || navigator.userLanguage).substring(0, 2);
            // note that 'en' is built in, so no translation is necessary
            if (this.supportedLanguages.indexOf(language) == -1)
            {
                callback();
            }
            else
            {
                $.getJSON('i18n/' + language + '.json', function(data) {
                    i18n.language = language;
                    i18n.translations = data;
                    callback();
                });
            }
        },

        /**
         * built in language
         */
        language: 'en',

        /**
         * translation cache
         */
        translations: {}
    }

    /**
     * filter methods
     */
    var filter = {
        /**
         * Compress a message (deflate compression). Returns base64 encoded data.
         *
         * @param string message
         * @return base64 string data
         */
        compress: function(message)
        {
            return Base64.toBase64( RawDeflate.deflate( Base64.utob(message) ) );
        },

        /**
         * Decompress a message compressed with compress().
         *
         * @param base64 string data
         * @return string message
         */
        decompress: function(data)
        {
            return Base64.btou( RawDeflate.inflate( Base64.fromBase64(data) ) );
        },

        /**
         * Compress, then encrypt message with key.
         *
         * @param string key
         * @param string password
         * @param string message
         * @return encrypted string data
         */
        cipher: function(key, password, message)
        {
            password = (password || '').trim();
            if (password.length == 0)
            {
                return sjcl.encrypt(key, this.compress(message));
            }
            return sjcl.encrypt(key + sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(password)), this.compress(message));
        },

        /**
         * Decrypt message with key, then decompress.
         *
         * @param string key
         * @param string password
         * @param encrypted string data
         * @return string readable message
         */
        decipher: function(key, password, data)
        {
            if (data != undefined)
            {
                try
                {
                    return this.decompress(sjcl.decrypt(key, data));
                }
                catch(err)
                {
                    try
                    {
                        return this.decompress(sjcl.decrypt(key + sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(password)), data));
                    }
                    catch(err)
                    {}
                }
            }
            return '';
        }
    };

    var zerobin = {
        /**
         * headers to send in AJAX requests
         */
        headers: {'X-Requested-With': 'JSONHttpRequest'},

        /**
         * Get the current script location (without search or hash part of the URL).
         * eg. http://server.com/zero/?aaaa#bbbb --> http://server.com/zero/
         *
         * @return string current script location
         */
        scriptLocation: function()
        {
            var scriptLocation = window.location.href.substring(0,window.location.href.length
                - window.location.search.length - window.location.hash.length),
                hashIndex = scriptLocation.indexOf('#');
            if (hashIndex !== -1)
            {
                scriptLocation = scriptLocation.substring(0, hashIndex);
            }
            return scriptLocation;
        },

        /**
         * Get the pastes unique identifier from the URL
         * eg. http://server.com/zero/?c05354954c49a487#xxx --> c05354954c49a487
         *
         * @return string unique identifier
         */
        pasteID: function()
        {
            return window.location.search.substring(1);
        },

        /**
         * Return the deciphering key stored in anchor part of the URL
         *
         * @return string key
         */
        pageKey: function()
        {
            // Some web 2.0 services and redirectors add data AFTER the anchor
            // (such as &utm_source=...). We will strip any additional data.

            var key = window.location.hash.substring(1),    // Get key
                i = key.indexOf('=');

            // First, strip everything after the equal sign (=) which signals end of base64 string.
            if (i > -1) key = key.substring(0, i + 1);

            // If the equal sign was not present, some parameters may remain:
            i = key.indexOf('&');
            if (i > -1) key = key.substring(0, i);

            // Then add trailing equal sign if it's missing
            if (key.charAt(key.length - 1) !== '=') key += '=';

            return key;
        },

        /**
         * ask the user for the password and return it
         *
         * @throws error when dialog canceled
         * @return string password
         */
        requestPassword: function()
        {
            var password = prompt(i18n._('Please enter the password for this paste:'), '');
            if (password == null) throw 'password prompt canceled';
            if (password.length == 0) return this.requestPassword();
            return password;
        },

        /**
         * use given format on paste, defaults to plain text
         *
         * @param string format
         */
        formatPaste: function(format)
        {
            switch (format || 'plaintext')
            {
                case 'markdown':
                    if (typeof Showdown == 'object')
                    {
                        var converter = new Showdown.converter();
                        this.clearText.html(
                            converter.makeHtml(this.clearText.html())
                        );
                        this.clearText.removeClass('hidden');
                    }
                    this.prettyMessage.addClass('hidden');
                    break;
                case 'syntaxhighlighting':
                    if (typeof prettyPrint == 'function') prettyPrint();
                default:
                    // Convert URLs to clickable links.
                    helper.urls2links(this.clearText);
                    helper.urls2links(this.prettyPrint);
                    this.clearText.addClass('hidden');
                    if (format == 'plaintext')
                    {
                        this.prettyPrint.css('white-space', 'pre-wrap');
                        this.prettyPrint.css('word-break', 'normal');
                        this.prettyPrint.removeClass('prettyprint');
                    }
                    this.prettyMessage.removeClass('hidden');
            }
        },

        /**
         * Show decrypted text in the display area, including discussion (if open)
         *
         * @param string key : decryption key
         * @param object paste : paste object including comments to display (items = array with keys ('data','meta')
         */
        displayMessages: function(key, paste)
        {
            // Try to decrypt the paste.
            var password = this.passwordInput.val();
            if (!this.prettyPrint.hasClass('prettyprinted')) {
                try
                {
                    if (paste.attachment)
                    {
                        var attachment = filter.decipher(key, password, paste.attachment);
                        if (attachment.length == 0)
                        {
                            if (password.length == 0) password = this.requestPassword();
                            attachment = filter.decipher(key, password, paste.attachment);
                        }
                        if (attachment.length == 0) throw 'failed to decipher attachment';

                        if (paste.attachmentname)
                        {
                            var attachmentname = filter.decipher(key, password, paste.attachmentname);
                            if (attachmentname.length > 0) this.attachmentLink.attr('download', attachmentname);
                        }
                        this.attachmentLink.attr('href', attachment);
                        this.attachment.removeClass('hidden');

                        // if the attachment is an image, display it
                        var imagePrefix = 'data:image/';
                        if (attachment.substring(0, imagePrefix.length) == imagePrefix)
                        {
                            this.image.html(
                                $(document.createElement('img'))
                                    .attr('src', attachment)
                                    .attr('class', 'img-thumbnail')
                            );
                            this.image.removeClass('hidden');
                        }
                    }
                    var cleartext = filter.decipher(key, password, paste.data);
                    if (cleartext.length == 0 && password.length == 0 && !paste.attachment)
                    {
                        password = this.requestPassword();
                        cleartext = filter.decipher(key, password, paste.data);
                    }
                    if (cleartext.length == 0 && !paste.attachment) throw 'failed to decipher message';

                    this.passwordInput.val(password);
                    if (cleartext.length > 0)
                    {
                        helper.setElementText(this.clearText, cleartext);
                        helper.setElementText(this.prettyPrint, cleartext);
                        this.formatPaste(paste.meta.formatter);
                    }
                }
                catch(err)
                {
                    this.clearText.addClass('hidden');
                    this.prettyMessage.addClass('hidden');
                    this.cloneButton.addClass('hidden');
                    this.showError(i18n._('Could not decrypt data (Wrong key?)'));
                    return;
                }
            }

            // Display paste expiration / for your eyes only.
            if (paste.meta.expire_date)
            {
                var expiration = helper.secondsToHuman(paste.meta.remaining_time),
                    expirationLabel = [
                        'This document will expire in %d ' + expiration[1] + '.',
                        'This document will expire in %d ' + expiration[1] + 's.'
                    ];
                helper.setMessage(this.remainingTime, i18n._(expirationLabel, expiration[0]));
                this.remainingTime.removeClass('foryoureyesonly')
                                  .removeClass('hidden');
            }
            if (paste.meta.burnafterreading)
            {
                // unfortunately many web servers don't support DELETE (and PUT) out of the box
                $.ajax({
                    type: 'POST',
                    url: this.scriptLocation() + '?' + this.pasteID(),
                    data: {deletetoken: 'burnafterreading'},
                    dataType: 'json',
                    headers: this.headers
                })
                .fail(function() {
                    zerobin.showError(i18n._('Could not delete the paste, it was not stored in burn after reading mode.'));
                });
                helper.setMessage(this.remainingTime, i18n._(
                    'FOR YOUR EYES ONLY. Don\'t close this window, this message can\'t be displayed again.'
                ));
                this.remainingTime.addClass('foryoureyesonly')
                                  .removeClass('hidden');
                // Discourage cloning (as it can't really be prevented).
                this.cloneButton.addClass('hidden');
            }

            // If the discussion is opened on this paste, display it.
            if (paste.meta.opendiscussion)
            {
                this.comments.html('');

                // iterate over comments
                for (var i = 0; i < paste.comments.length; ++i)
                {
                    var place = this.comments;
                    var comment = paste.comments[i];
                    var cleartext = '[' + i18n._('Could not decrypt comment; Wrong key?') + ']';
                    try
                    {
                        cleartext = filter.decipher(key, password, comment.data);
                    }
                    catch(err)
                    {}
                    // If parent comment exists, display below (CSS will automatically shift it right.)
                    var cname = '#comment_' + comment.parentid;

                    // If the element exists in page
                    if ($(cname).length)
                    {
                        place = $(cname);
                    }
                    var divComment = $('<article><div class="comment" id="comment_' + comment.id + '">'
                                   + '<div class="commentmeta"><span class="nickname"></span><span class="commentdate"></span></div><div class="commentdata"></div>'
                                   + '<button class="btn btn-default btn-sm">' + i18n._('Reply') + '</button>'
                                   + '</div></article>');
                    divComment.find('button').click({commentid: comment.id}, $.proxy(this.openReply, this));
                    helper.setElementText(divComment.find('div.commentdata'), cleartext);
                    // Convert URLs to clickable links in comment.
                    helper.urls2links(divComment.find('div.commentdata'));

                    // Try to get optional nickname:
                    var nick = filter.decipher(key, password, comment.meta.nickname);
                    if (nick.length > 0)
                    {
                        divComment.find('span.nickname').text(nick);
                    }
                    else
                    {
                        divComment.find('span.nickname').html('<i>' + i18n._('Anonymous') + '</i>');
                    }
                    divComment.find('span.commentdate')
                              .text(' (' + (new Date(comment.meta.postdate * 1000).toLocaleString()) + ')')
                              .attr('title', 'CommentID: ' + comment.id);

                    // If an avatar is available, display it.
                    if (comment.meta.vizhash)
                    {
                        divComment.find('span.nickname')
                                  .before(
                                    '<img src="' + comment.meta.vizhash + '" class="vizhash" title="' +
                                    i18n._('Anonymous avatar (Vizhash of the IP address)') + '" /> '
                                  );
                    }

                    place.append(divComment);
                }
                var divComment = $(
                    '<div class="comment"><button class="btn btn-default btn-sm">' +
                    i18n._('Add comment') + '</button></div>'
                );
                divComment.find('button').click({commentid: this.pasteID()}, $.proxy(this.openReply, this));
                this.comments.append(divComment);
                this.discussion.removeClass('hidden');
            }
        },

        /**
         * Open the comment entry when clicking the "Reply" button of a comment.
         *
         * @param Event event
         */
        openReply: function(event)
        {
            event.preventDefault();
            var source = $(event.target),
                commentid = event.data.commentid,
                hint = i18n._('Optional nickname...');

            // Remove any other reply area.
            $('div.reply').remove();
            var reply = $(
                '<div class="reply">' +
                '<input type="text" id="nickname" class="form-control" title="' + hint + '" placeholder="' + hint + '" />' +
                '<textarea id="replymessage" class="replymessage form-control" cols="80" rows="7"></textarea>' +
                '<br /><button id="replybutton" class="btn btn-default btn-sm">' + i18n._('Post comment') + '</button>' +
                '<div id="replystatus"> </div>' +
                '</div>'
            );
            reply.find('button').click({parentid: commentid}, $.proxy(this.sendComment, this));
            source.after(reply);
            $('#replymessage').focus();
        },

        /**
         * Send a reply in a discussion.
         *
         * @param Event event
         */
        sendComment: function(event)
        {
            event.preventDefault();
            this.errorMessage.addClass('hidden');
            // Do not send if no data.
            var replyMessage = $('#replymessage');
            if (replyMessage.val().length == 0) return;

            this.showStatus(i18n._('Sending comment...'), true);
            var parentid = event.data.parentid;
            var cipherdata = filter.cipher(this.pageKey(), this.passwordInput.val(), replyMessage.val());
            var ciphernickname = '';
            var nick = $('#nickname').val();
            if (nick != '')
            {
                ciphernickname = filter.cipher(this.pageKey(), this.passwordInput.val(), nick);
            }
            var data_to_send = {
                data:     cipherdata,
                parentid: parentid,
                pasteid:  this.pasteID(),
                nickname: ciphernickname
            };

            $.ajax({
                type: 'POST',
                url: this.scriptLocation(),
                data: data_to_send,
                dataType: 'json',
                headers: this.headers,
                success: function(data)
                {
                    if (data.status == 0)
                    {
                        zerobin.showStatus(i18n._('Comment posted.'), false);
                        $.ajax({
                            type: 'GET',
                            url: zerobin.scriptLocation() + '?' + zerobin.pasteID(),
                            dataType: 'json',
                            headers: zerobin.headers,
                            success: function(data)
                            {
                                if (data.status == 0)
                                {
                                    zerobin.displayMessages(zerobin.pageKey(), data);
                                }
                                else if (data.status == 1)
                                {
                                    zerobin.showError(i18n._('Could not refresh display: %s', data.message));
                                }
                                else
                                {
                                    zerobin.showError(i18n._('Could not refresh display: %s', i18n._('unknown status')));
                                }
                            }
                        })
                        .fail(function() {
                            zerobin.showError(i18n._('Could not refresh display: %s', i18n._('server error or not responding')));
                        });
                    }
                    else if (data.status == 1)
                    {
                        zerobin.showError(i18n._('Could not post comment: %s', data.message));
                    }
                    else
                    {
                        zerobin.showError(i18n._('Could not post comment: %s', i18n._('unknown status')));
                    }
                }
            })
            .fail(function() {
                zerobin.showError(i18n._('Could not post comment: %s', i18n._('server error or not responding')));
            });
        },

        /**
         * Send a new paste to server
         *
         * @param Event event
         */
        sendData: function(event)
        {
            event.preventDefault();
            var file = document.getElementById('file'),
                files = (file && file.files) ? file.files : null; // FileList object

            // Do not send if no data.
            if (this.message.val().length == 0 && !(files && files[0])) return;

            // If sjcl has not collected enough entropy yet, display a message.
            if (!sjcl.random.isReady())
            {
                this.showStatus(i18n._('Sending paste (Please move your mouse for more entropy)...'), true);
                sjcl.random.addEventListener('seeded', function() {
                    this.sendData(event);
                });
                return;
            }

            $('.navbar-toggle').click();
            this.password.addClass('hidden');
            this.showStatus(i18n._('Sending paste...'), true);

            var randomkey = sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
            var cipherdata_attachment;
            var password = this.passwordInput.val();
            if(files && files[0])
            {
                if(typeof FileReader === undefined)
                {
                    this.showError(i18n._('Your browser does not support uploading encrypted files. Please use a newer browser.'));
                    return;
                }
                var reader = new FileReader();
                // Closure to capture the file information.
                reader.onload = (function(theFile)
                {
                    return function(e) {
                        zerobin.sendDataContinue(
                            randomkey,
                            filter.cipher(randomkey, password, e.target.result),
                            filter.cipher(randomkey, password, theFile.name)
                        );
                    }
                })(files[0]);
                reader.readAsDataURL(files[0]);
            }
            else if(this.attachmentLink.attr('href'))
            {
                this.sendDataContinue(
                    randomkey,
                    filter.cipher(randomkey, password, this.attachmentLink.attr('href')),
                    this.attachmentLink.attr('download')
                );
            }
            else
            {
                this.sendDataContinue(randomkey, '', '');
            }
        },

        /**
         * Send a new paste to server, step 2
         *
         * @param Event event
         */
        sendDataContinue: function(randomkey, cipherdata_attachment, cipherdata_attachment_name)
        {
            var cipherdata = filter.cipher(randomkey, this.passwordInput.val(), this.message.val());
            var data_to_send = {
                data:             cipherdata,
                expire:           $('#pasteExpiration').val(),
                formatter:        $('#pasteFormatter').val(),
                burnafterreading: this.burnAfterReading.is(':checked') ? 1 : 0,
                opendiscussion:   this.openDiscussion.is(':checked') ? 1 : 0
            };
            if (cipherdata_attachment.length > 0)
            {
                data_to_send.attachment = cipherdata_attachment;
                if (cipherdata_attachment_name.length > 0)
                {
                    data_to_send.attachmentname = cipherdata_attachment_name;
                }
            }
            $.ajax({
                type: 'POST',
                url: this.scriptLocation(),
                data: data_to_send,
                dataType: 'json',
                headers: this.headers,
                success: function(data)
                {
                    if (data.status == 0) {
                        zerobin.stateExistingPaste();
                        var url = zerobin.scriptLocation() + '?' + data.id + '#' + randomkey;
                        var deleteUrl = zerobin.scriptLocation() + '?pasteid=' + data.id + '&deletetoken=' + data.deletetoken;
                        zerobin.showStatus('', false);
                        zerobin.errorMessage.addClass('hidden');

                        $('#pastelink').html(i18n._('Your paste is <a id="pasteurl" href="%s">%s</a> <span id="copyhint">(Hit [Ctrl]+[c] to copy)</span>', url, url));
                        $('#deletelink').html('<a href="' + deleteUrl + '">' + i18n._('Delete data') + '</a>');
                        zerobin.pasteResult.removeClass('hidden');
                        // We pre-select the link so that the user only has to [Ctrl]+[c] the link.
                        helper.selectText('pasteurl');
                        zerobin.showStatus('', false);

                        helper.setElementText(zerobin.clearText, zerobin.message.val());
                        helper.setElementText(zerobin.prettyPrint, zerobin.message.val());
                        zerobin.formatPaste(data_to_send.formatter);
                    }
                    else if (data.status==1)
                    {
                        zerobin.showError(i18n._('Could not create paste: %s', data.message));
                    }
                    else
                    {
                        zerobin.showError(i18n._('Could not create paste: %s', i18n._('unknown status')));
                    }
                }
            })
            .fail(function()
            {
                zerobin.showError(i18n._('Could not create paste: %s', i18n._('server error or not responding')));
            });
        },

        /**
         * Put the screen in "New paste" mode.
         */
        stateNewPaste: function()
        {
            this.message.text('');
            this.attachment.addClass('hidden');
            this.cloneButton.addClass('hidden');
            this.rawTextButton.addClass('hidden');
            this.remainingTime.addClass('hidden');
            this.pasteResult.addClass('hidden');
            this.clearText.addClass('hidden');
            this.discussion.addClass('hidden');
            this.prettyMessage.addClass('hidden');
            this.sendButton.removeClass('hidden');
            this.expiration.removeClass('hidden');
            this.formatter.removeClass('hidden');
            this.burnAfterReadingOption.removeClass('hidden');
            this.openDisc.removeClass('hidden');
            this.newButton.removeClass('hidden');
            this.password.removeClass('hidden');
            this.attach.removeClass('hidden');
            this.message.removeClass('hidden');
            this.message.focus();
        },

        /**
         * Put the screen in "Existing paste" mode.
         */
        stateExistingPaste: function()
        {
            this.sendButton.addClass('hidden');

            // No "clone" for IE<10.
            if ($('#oldienotice').is(":visible"))
            {
                this.cloneButton.addClass('hidden');
            }
            else
            {
                this.cloneButton.removeClass('hidden');
            }
            this.rawTextButton.removeClass('hidden');

            this.attach.addClass('hidden');
            this.expiration.addClass('hidden');
            this.formatter.addClass('hidden');
            this.burnAfterReadingOption.addClass('hidden');
            this.openDisc.addClass('hidden');
            this.newButton.removeClass('hidden');
            this.pasteResult.addClass('hidden');
            this.message.addClass('hidden');
            this.clearText.addClass('hidden');
            this.prettyMessage.addClass('hidden');
        },

        /**
         * If "burn after reading" is checked, disable discussion.
         */
        changeBurnAfterReading: function()
        {
            if (this.burnAfterReading.is(':checked') )
            {
                this.openDisc.addClass('buttondisabled');
                this.openDiscussion.attr({checked: false, disabled: true});
            }
            else
            {
                this.openDisc.removeClass('buttondisabled');
                this.openDiscussion.removeAttr('disabled');
            }
        },

        /**
         * Reload the page.
         *
         * @param Event event
         */
        reloadPage: function(event)
        {
            event.preventDefault();
            window.location.href = this.scriptLocation();
        },

        /**
         * Return raw text.
         *
         * @param Event event
         */
        rawText: function(event)
        {
            event.preventDefault();
            var paste = this.clearText.html();
            var newDoc = document.open('text/html', 'replace');
            newDoc.write('<pre>' + paste + '</pre>');
            newDoc.close();
        },

        /**
         * Clone the current paste.
         *
         * @param Event event
         */
        clonePaste: function(event)
        {
            event.preventDefault();
            this.stateNewPaste();

            // Erase the id and the key in url
            history.replaceState(document.title, document.title, this.scriptLocation());

            this.showStatus('', false);
            if (this.attachmentLink.attr('href'))
            {
                this.clonedFile.removeClass('hidden');
                this.fileWrap.addClass('hidden');
            }
            this.message.text(this.clearText.text());
            $('.navbar-toggle').click();
        },

        /**
         * Support input of tab character.
         *
         * @param Event event
         */
        supportTabs: function(event)
        {
            var keyCode = event.keyCode || event.which;
            // tab was pressed
            if (keyCode === 9)
            {
                // prevent the textarea to lose focus
                event.preventDefault();
                // get caret position & selection
                var val   = this.value,
                    start = this.selectionStart,
                    end   = this.selectionEnd;
                // set textarea value to: text before caret + tab + text after caret
                this.value = val.substring(0, start) + '\t' + val.substring(end);
                // put caret at right position again
                this.selectionStart = this.selectionEnd = start + 1;
            }
        },

        /**
         * Create a new paste.
         */
        newPaste: function()
        {
            this.stateNewPaste();
            this.showStatus('', false);
            this.message.text('');
        },

        /**
         * Removes an attachment.
         */
        removeAttachment: function()
        {
            this.clonedFile.addClass('hidden');
            // removes the saved decrypted file data
            this.attachmentLink.attr('href', '');
            // the only way to deselect the file is to recreate the input
            this.fileWrap.html(this.fileWrap.html());
            this.fileWrap.removeClass('hidden');
        },

        /**
         * Display an error message
         * (We use the same function for paste and reply to comments)
         *
         * @param string message : text to display
         */
        showError: function(message)
        {
            if (this.status.length)
            {
                this.status.addClass('errorMessage').text(message);
            }
            else
            {
                this.errorMessage.removeClass('hidden');
                helper.setMessage(this.errorMessage, message);
            }
            this.replyStatus.addClass('errorMessage').text(message);
        },

        /**
         * Display a status message
         * (We use the same function for paste and reply to comments)
         *
         * @param string message : text to display
         * @param boolean spin (optional) : tell if the "spinning" animation should be displayed.
         */
        showStatus: function(message, spin)
        {
            this.replyStatus.removeClass('errorMessage').text(message);
            if (!message)
            {
                this.status.html(' ');
                return;
            }
            if (message == '')
            {
                this.status.html(' ');
                return;
            }
            this.status.removeClass('errorMessage').text(message);
            if (spin)
            {
                var img = '<img src="img/busy.gif" style="width:16px;height:9px;margin:0 4px 0 0;" />';
                this.status.prepend(img);
                this.replyStatus.prepend(img);
            }
        },

        /**
         * bind events to DOM elements
         */
        bindEvents: function()
        {
            this.burnAfterReading.change($.proxy(this.changeBurnAfterReading, this));
            this.sendButton.click($.proxy(this.sendData, this));
            this.cloneButton.click($.proxy(this.clonePaste, this));
            this.rawTextButton.click($.proxy(this.rawText, this));
            this.fileRemoveButton.click($.proxy(this.removeAttachment, this));
            $('.reloadlink').click($.proxy(this.reloadPage, this));
            this.message.keydown(this.supportTabs);
        },

        /**
         * main application
         */
        init: function()
        {
            // hide "no javascript" message
            $('#noscript').hide();

            // preload jQuery wrapped DOM elements and bind events
            this.attach = $('#attach');
            this.attachment = $('#attachment');
            this.attachmentLink = $('#attachment a');
            this.burnAfterReading = $('#burnafterreading');
            this.burnAfterReadingOption = $('#burnafterreadingoption');
            this.cipherData = $('#cipherdata');
            this.clearText = $('#cleartext');
            this.cloneButton = $('#clonebutton');
            this.clonedFile = $('#clonedfile');
            this.comments = $('#comments');
            this.discussion = $('#discussion');
            this.errorMessage = $('#errormessage');
            this.expiration = $('#expiration');
            this.fileRemoveButton = $('#fileremovebutton');
            this.fileWrap = $('#filewrap');
            this.formatter = $('#formatter');
            this.image = $('#image');
            this.message = $('#message');
            this.newButton = $('#newbutton');
            this.openDisc = $('#opendisc');
            this.openDiscussion = $('#opendiscussion');
            this.password = $('#password');
            this.passwordInput = $('#passwordinput');
            this.pasteResult = $('#pasteresult');
            this.prettyMessage = $('#prettymessage');
            this.prettyPrint = $('#prettyprint');
            this.rawTextButton = $('#rawtextbutton');
            this.remainingTime = $('#remainingtime');
            this.replyStatus = $('#replystatus');
            this.sendButton = $('#sendbutton');
            this.status = $('#status');
            this.bindEvents();

            // Display status returned by php code if any (eg. Paste was properly deleted.)
            if (this.status.text().length > 0)
            {
                this.showStatus(this.status.text(), false);
                return;
            }

            // Keep line height even if content empty.
            this.status.html(' ');

            // Display an existing paste
            if (this.cipherData.text().length > 1)
            {
                // Missing decryption key in URL?
                if (window.location.hash.length == 0)
                {
                    this.showError(i18n._('Cannot decrypt paste: Decryption key missing in URL (Did you use a redirector or an URL shortener which strips part of the URL?)'));
                    return;
                }

                // List of messages to display.
                var data = $.parseJSON(this.cipherData.text());

                // Show proper elements on screen.
                this.stateExistingPaste();

                this.displayMessages(this.pageKey(), data);
            }
            // Display error message from php code.
            else if (this.errorMessage.text().length > 1)
            {
                this.showError(this.errorMessage.text());
            }
            // Create a new paste.
            else
            {
                this.newPaste();
            }
        }
    }

    /**
     * main application start, called when DOM is fully loaded
     * runs zerobin when translations were loaded
     */
    i18n.loadTranslations($.proxy(zerobin.init, zerobin));
});
