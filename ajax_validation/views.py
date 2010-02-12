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
    fields = request.POST.getlist('fields')
    if not fields and not isinstance(form, BaseFormSet):
        fields = [form[f].field.widget.id_for_label(form[f].field.widget.attrs.get('id') or form[f].auto_id) for f in form.fields.keys()] + ['__all__']
    if form.is_valid():
        data = {
            'errors': {},
            'fields': fields,
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

        final_errors = {}
        for key, val in errors.iteritems():
            if '__all__' in key:
                field_id = key
            elif not isinstance(formfields[key].field, forms.FileField):
                field_id = formfields[key].field.widget.attrs.get('id') or formfields[key].auto_id
                field_id = formfields[key].field.widget.id_for_label(field_id)
            if not fields or field_id in fields:
                final_errors[field_id] = val
        data = {
            'fields': fields,
            'valid': False or not final_errors,
            'errors': final_errors,
        }
    json_serializer = LazyEncoder()
    return HttpResponse(json_serializer.encode(data), mimetype='application/json')
validate = require_POST(validate)
