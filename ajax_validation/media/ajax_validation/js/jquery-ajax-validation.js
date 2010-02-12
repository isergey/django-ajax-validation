(function($) {
    function inputs(form)   {
        return form.find(":input:visible:not(:button)");
    }

    $.fn.validate = function(url, settings) {
        settings = $.extend({
            type: 'table',
            callback: false,
            fields: false,
            dom: this,
            event: 'submit'
        }, settings);

        return this.each(function() {
            var form = $(this);
            settings.dom.bind(settings.event, function() {
                var status = false;
                var data = form.serialize();
                if (settings.fields) {
                    data += '&' + $.param({fields: settings.fields});
                }
                $.ajax({
                    data: data,
                    dataType: 'json',
                    error: function(XHR, textStatus, errorThrown) {
                        status = true;
                    },
                    success: function(data, textStatus) {
                        status = data.valid;
                        if (settings.callback)  {
                            settings.callback(data, form);
                        }
                        else {
                            var get_form_error_position = function(key) {
                                key = key || '__all__';
                                if (key == '__all__') {
                                    var filter = ':first';
                                } else {
                                    var filter = ':first[id^=id_' + key.replace('__all__', '') + ']';
                                }
                                return inputs(form).filter(filter).parent();
                            };
                            if (settings.type == 'p') {
                                $.each(data.fields, function(key, val) {
                                    if (val.indexOf('__all__') >= 0) {
                                        var error = get_form_error_position(val).prev();
                                        if (error.is('ul.errorlist'))
                                            error.remove();
                                    }
                                    else {
                                        $('#' + val).parent().find('ul.errorlist').remove();
                                    }
                                }
                                $.each(data.errors, function(key, val) {
                                    if (key.indexOf('__all__') >= 0) {
                                        var error = get_form_error_position(key);
                                        error.before('<ul class="errorlist"><li>' + val + '</li></ul>');
                                    }
                                    else {
                                        $('#' + key).parent().before('<ul class="errorlist"><li>' + val + '</li></ul>');
                                    }
                                });
                            }
                            if (settings.type == 'table') {
                                $.each(data.fields, function(key, val) {
                                    if (val.indexOf('__all__') >= 0) {
                                        var error = get_form_error_position(val).parent().prev();
                                        if (error.is('tr'))
                                            error.remove();
                                    }
                                    else {
                                        $('#' + val).parent().find('ul.errorlist').remove();
                                    }
                                }
                                $.each(data.errors, function(key, val) {
                                    if (key.indexOf('__all__') >= 0) {
                                        get_form_error_position(key).parent().before('<tr><td colspan="2"><ul class="errorlist"><li>' + val + '.</li></ul></td></tr>');
                                    }
                                    else {
                                        $('#' + key).before('<ul class="errorlist"><li>' + val + '</li></ul>');
                                    }
                                });
                            }
                            if (settings.type == 'ul') {
                                $.each(data.fields, function(key, val) {
                                    if (val.indexOf('__all__') >= 0) {
                                        var error = get_form_error_position(val).parent().prev();
                                        if (error.find('ul.errorlist').length)
                                            error.remove();
                                    }
                                    else {
                                        $('#' + val).parent().find('ul.errorlist').remove();
                                    }
                                }
                                $.each(data.errors, function(key, val) {
                                    if (key.indexOf('__all__') >= 0) {
                                        get_form_error_position(key).before('<li><ul class="errorlist"><li>' + val + '</li></ul></li>');
                                    }
                                    else {
                                        $('#' + key).prev().before('<ul class="errorlist"><li>' + val + '</li></ul>');
                                    }
                                });
                            }
                            if (settings.type == 'uni-form') {
                                $.each(data.fields, function(key, val) {
                                    if (val.indexOf('__all__') >= 0) {
                                        $(form).find('#errorMsg').remove();
                                    }
                                    else {
                                        $('#' + val).parent('.ctrlHolder').removeClass('error').find('p.errorField').remove();
                                    }
                                });
                                $.each(data.errors, function(key, val) {
                                    if (key.indexOf('__all__') >= 0) {
                                        get_form_error_position(key).before('<div id="errorMsg"><p>' + val + '</p></div>');
                                    }
                                    else {
                                        $('#' + key).prev().before('<p class="errorField">' + val + '</p>');
                                        $('#' + key).parent('.ctrlHolder').addClass('error');
                                    }
                                });
                            }
                        }
                    },
                    type: 'POST',
                    url: url
                });
            });
        });
    };
})(jQuery);
