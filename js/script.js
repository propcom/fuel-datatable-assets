$(document).ready(function() {
	$('.data-table th.sortable').live('click', function() {
		if ($(this).hasClass('asc')) {
			$('.data-table th').removeClass('asc');
			$(this).addClass('desc');
		}
		else if ($(this).hasClass('desc')) {
			$('.data-table th').removeClass('desc');
			$(this).addClass('asc');
		}
		else {
			$('.data-table th').removeClass('asc');
			$('.data-table th').removeClass('desc');
			$(this).addClass('asc');
		}

		table_gen($(this).closest('div.data-table-wrapper').attr('id'));
	});

	$('.data-table .filter-box').live('keyup', function() {
		table_gen($(this).closest('div.data-table-wrapper').attr('id'));
	});

	$('.data-table .filter-enum').live('change', function() {
		table_gen($(this).closest('div.data-table-wrapper').attr('id'));
	});

	//$('.pagination a').live('click', function() {
	$('.footer-page-links a').live('click', function() {
		var url = $(this).attr('href').split('/');
		var num = url.pop();

		if (isNaN(num)) {
			num = '';
		}

		table_gen($(this).closest('div.data-table-wrapper').attr('id'), num);
		return false;
	});

	$('.data-table td.editable').live('click', function(event) {

		if (event.target.tagName.toUpperCase() == 'TD') {
			if ($(this).find('.inline-edit').length == 0) {
				var val = $.trim($(this).html());

				if ($(this).hasClass('type-freetext')) {
					$(this).html('<input type="text" class="inline-edit" value="'+val+'" /> <input type="button" class="inline-edit-save" value="Save" />');
				}
				else if ($(this).hasClass('type-date')) {
					$(this).html('<input type="text" class="inline-edit date" value="'+val+'" /> <input type="button" class="inline-edit-save" value="Save" />');
				}
				else if ($(this).hasClass('type-datetime')) {
					$(this).html('<input type="text" class="inline-edit datetime" value="'+val+'" /> <input type="button" class="inline-edit-save" value="Save" />');
				}
				else if ($(this).hasClass('type-bool')) {
					$(this).html('<select class="inline-edit bool"><option value="0"'+(val=='No'?' selected="selected"':'')+'>No</option><option value="1"'+(val=='Yes'?' selected="selected"':'')+'>Yes</option></select><input type="button" class="inline-edit-save" value="Save" />');
				}

				date_pickers();
			}
		}
	});

	$('.inline-edit-save').live('click', function() {
		var table_json = $(this).closest('.data-table-wrapper').find('.table-def').val();
		var col = $(this).closest('table').find('tr.headers th').eq($(this).parent().index() - 1).find('.header-name').val();
		var val = $(this).siblings('.inline-edit').val();
		var id = $(this).closest('tr').find('.row-id').val();

		var orig = $(this);

		$.post('/datatable/table/save_ajax/', {'table_json':table_json, 'field':col, 'value':val, 'id':id}, function(data) {
			if (orig.siblings('.inline-edit').hasClass('bool') || orig.siblings('.inline-edit').hasClass('enum')) {
				val = orig.siblings('.inline-edit').find('option:selected').html();
			}

			if (data == '1') {
				orig.parent().html(val);
			}
			else {
				alert('ah, bawls.');
			}
		});
	});

	var table_gen_req;

	function table_gen(id, page_no) {

		if (!page_no) {
			page_no = '';
		}

		if (table_gen_req) {
			table_gen_req.abort();
		}

		var tmp = $('#'+id+' th.sortable.asc,th.sortable.desc');

		var table_json = $('#'+id+' .table-def').val();
		var sort_col = tmp.find('.header-name').val();
		var sort_order = tmp.hasClass('asc')?'asc':'desc';

		// Get filters
		var filters = {};
		if ($('#'+id+' tr.filters').length > 0) {
			var i = 0;
			$('#'+id+' .header-name').each(function() {
				var name = $(this).val();
				var filter_parent = $('#'+id+' tr.filters th').eq(i++);

				filters[name] = filters[name] || {};

				if (filter_parent.find('.filter-freetext').length == 1) {
					filters[name]['type'] = 'freetext';
					filters[name]['val'] = filter_parent.find('.filter-freetext').val();
				}
				else if (filter_parent.find('.filter-date-from').length == 1) {
					filters[name].type = 'date';
					filters[name].val = {
						'from':filter_parent.find('.filter-date-from').val(),
						'to':filter_parent.find('.filter-date-to').val()
					}
				}
				else if (filter_parent.find('.filter-datetime-from').length == 1) {
					filters[name].type = 'datetime';
					filters[name].val = {
						'from':filter_parent.find('.filter-datetime-from').val(),
						'to':filter_parent.find('.filter-datetime-to').val()
					}
				}
				else if (filter_parent.find('.filter-range-from').length == 1) {
					filters[name].type = 'range';
					filters[name].val = {
						'from':filter_parent.find('.filter-range-from').val(),
						'to':filter_parent.find('.filter-range-to').val()
					}
				}
				else if (filter_parent.find('.filter-enum').length == 1) {
					filters[name].type = 'enum';
					filters[name].val = filter_parent.find('.filter-enum option:selected').val();
				}
			});
		}

		table_gen_req = $.post('/datatable/table/generate_ajax/'+page_no+'/', {'table_json':table_json, 'sort_col':sort_col, 'sort_order':sort_order, 'filter':filters}, function(data) {
			$('#'+id+' tr.content').remove();

			if ($('#'+id+' tr.filters').length > 0) {
				$('#'+id+' tr.filters').after(data);
			}
			else {
				$('#'+id+' tr.headers').after(data);
			}
			
			$('html, body').animate({ scrollTop: $('h1').offset().top });
		});
	}

	function date_pickers() {
		$('input.datatable-filter.date, .filter-date-from, .filter-date-to, .inline-edit.date').datepicker({
			'dateFormat':'dd M yy',
			'onClose': function(dateText, inst) {
				$(this).trigger('keyup');
			}
		});

		$('.filter-datetime-from, .filter-datetime-to, .inline-edit.datetime').datetimepicker({
			'dateFormat':'dd M yy',
			'timeFormat': 'hh:mm:ss',
			'showSecond': true,
			'onClose': function(dateText, inst) {
				$(this).trigger('keyup');
			}
		});
	}

	date_pickers();
});
