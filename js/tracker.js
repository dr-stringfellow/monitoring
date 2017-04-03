var loading = new Spinner({'scale': 5, 'corners': 0, 'width': 2});

function initPage(dataType, categories, constraints) {
    var ajaxInput = {
        'url': 'inventory.php',
        'data': {'getGroups': 1},
        'success': function (data, textStatus, jqXHR) { setGroups(data); },
        'dataType': 'json',
        'async': false
    };

    $.ajax(ajaxInput);

}

