from django import forms
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from django.forms.formsets import BaseFormSet

from ajax_validation.utils import LazyEncoder

def validate(request, *args, **kwargs):
    form_class = kwargs.pop('form_class')
    defaults = {
        'data': request.POST
    }
    extra_args_func = kwargs.pop('callback', lambda request, *args, **kwargs: {})
    kwargs = extra_args_func(request, *args, **kwargs)
    defaults.update(kwargs)
    form = form_class(**defaults)
    if form.is_valid():
        data = {
            'errors': {},
            'fields': request.POST.getlist('fields'),
            'valid': True,
        }
    else:
        # if we're dealing with a FormSet then walk over .forms to populate errors and formfields
        if isinstance(form, BaseFormSet):
            errors = {}
            formfields = {}
            for f in form.forms:
                for field in f.fields.keys():
                    formfields[f.add_prefix(field)] = f[field]
                for field, error in f.errors.iteritems():
                    errors[f.add_prefix(field)] = error
            if form.non_form_errors():
                errors['__all__'] = form.non_form_errors()
        else:
            errors = form.errors
            formfields = dict([(fieldname, form[fieldname]) for fieldname in form.fields.keys()])

        # if fields have been specified then restrict the error list
        if request.POST.getlist('fields'):
            fields = request.POST.getlist('fields') + ['__all__']
            errors = dict([(key, val) for key, val in errors.iteritems() if key in fields])
        else:
            fields = []

        data = {
            'fields': fields,
            'valid': not errors,
            'errors': errors,
        }
    json_serializer = LazyEncoder()
    return HttpResponse(json_serializer.encode(data), mimetype='application/json')
validate = require_POST(validate)
