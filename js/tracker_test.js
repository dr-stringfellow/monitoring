// globally defined variables

var max_time = 0;
var five_days = 5*24*60*60;
var one_day = 24*60*60;
var replica_time_tmp = [];
var replica_time_converted = [];

var json = [];
		
var colors = [
	      '#FBB735',
	      '#E98931',
	      '#EB403B',
	      '#B32E37',
	      '#6C2A6A',
	      '#5C4399',
	      '#274389',
	      '#1F5EA8',
	      '#227FB0',
	      '#2AB0C5',
	      '#39C0B3',
	      '#006401',
	      '#90fb92',
	      '#0076ff',
	      '#ff937e',
	      '#6a826c',
	      '#ff029d',
	      '#fe8900',
	      '#7a4782'
	       ];


function makeTrace(title,data_x,data_y,dash,widths,legend,colors){
    return{
	name: title,
	x: data_x,
	y: data_y,
	    line: {shape:'linear',
		color: colors,
		width: widths,
		dash: dash
		},
	showlegend: legend,    
	connectgaps: true

    }
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec +'0.000000';
    return time;
}

function stackedArea(traces) {
    for(var i=1; i<traces.length; i++) {
	for(var j=0; j<(Math.min(traces[i]['y'].length, traces[i-1]['y'].length)); j++) {
	    traces[i]['y'][j] += traces[i-1]['y'][j];
	}
    }
    return traces;
}

function initPage() {
    /*
    var ajaxInput = {
        'url': 'main.php',
        'data': {'getSummary': 1},
        'success': function (data) { drawSummary(data); 					
	},
        'dataType': 'json',
        'async': false
    };

    $.ajax(ajaxInput);

    */

    
    var ajaxInput_ongoings = {
        'url': 'main.php',
        'data': {'getSiteOverview': 1},
        'success': function (data) { 
	    drawSiteOverview(data);
	},
        'dataType': 'json',
        'async': false
    };

    $.ajax(ajaxInput_ongoings);
    

    /*
    var ajaxInput_completions = {
        'url': 'main.php',
        'data': {'getSiteOverview': 1},
        'success': function (data) { 
	    drawCompletions(data);
	},
        'dataType': 'json',
        'async': false
    };
    
    $.ajax(ajaxInput_completions);
    
    */

    
    var ajaxInput_summary = {
        'url': 'main.php',
        'data': {'getJson': 1},
        'success': function (data) { 
	    drawSummary(data);
	},
        'dataType': 'json',
        'async': false
    };

    $.ajax(ajaxInput_summary);
    

}


function drawSiteOverview(data) {
    
    json = data;

    var T2entries = [];
    var addT2data = function(name, total, copied, nreplicas, problematic, phedex){
	T2entries.push({name: name, total: total, copied: copied, nreplicas: nreplicas, problematic: problematic, phedex: phedex})
    };


    //window.alert("Hello");
	
    // quick loop for finding latest time

    for(var i = 0 in data) {
	var obj = data[i];
	for(var j in obj["data"]) {
	    var replica = obj["data"][j];
	    if (replica.time[replica.total.length-1]>max_time)
		max_time = replica.time[replica.total.length-1];
	}
    }
	
    for(var i = 0 in data) {// loop over sites

	var obj = data[i];
	var tmp_site = obj.site;
        var tmp_total = 0;
	var tmp_copied = 0;
	var tmp_nreplicas = 0;
	var has_problematic_transfers = false;
	var phedexstring = '';
	var stuck_request_ids = '';

	for(var j in obj["data"]) {
	    var replica = obj["data"][j];
	    //Tracking only incomplete replicas where replica.total != replica.copied

	    if (max_time==replica.time[replica.total.length-1] && replica.total[replica.total.length-1]!=replica.copied[replica.total.length-1]){

		tmp_total += replica.total[replica.total.length-1];
		tmp_copied += replica.copied[replica.copied.length-1];
		tmp_nreplicas += 1;

		if ((replica.copied[replica.total.length-1]-replica.copied[replica.total.length-288])<0.05*replica.total[replica.total.length-1] && replica.copied[replica.total.length-288]>0){//288 is the number of time intervals corresponding to 3 days (we track each 900 seconds. 3*24*60*60/900=288)
		    var name_fields = replica.replica.split('_');
		    if (!has_problematic_transfers){
			stuck_request_ids += name_fields[0];
		    }
		    else { 
			stuck_request_ids += '%2C+';
			stuck_request_ids += name_fields[0];
		    }
		    has_problematic_transfers = true;
		}
	    }
	}

	var phedex = 'https://amazon.com';
	phedexstring = 'https://cmsweb.cern.ch/phedex/prod/Request::View?nodes='+tmp_site+'&request='+stuck_request_ids;

	if (!has_problematic_transfers)
	    phedexstring = 'http://t3serv012.mit.edu/dynamo/dealermon/test/test.html';
     
	addT2data(tmp_site, tmp_total, tmp_copied, tmp_nreplicas, has_problematic_transfers,phedexstring);
    };

    var data_name = [];
    var data_total = [];
    var data_copied = [];
    var data_total_subtract_copied = [];
    var data_nreplicas = [];
    var data_problematic = [];
    var data_phedex = [];

    for (var it2 in T2entries){
	data_name.push(T2entries[it2]['name']);
	data_total.push(T2entries[it2]['total']);
	data_copied.push(T2entries[it2]['copied']);
	data_total_subtract_copied.push(T2entries[it2]['total']-T2entries[it2]['copied']);
	if (T2entries[it2]['nreplicas']!=0)
	    data_nreplicas.push("Replicas being copied:" + " " +T2entries[it2]['nreplicas'].toString());
	else 
	    data_nreplicas.push("");
	data_problematic.push(T2entries[it2]['problematic']);
	data_phedex.push(T2entries[it2]['phedex']);
    }

    // getting indices
    var len = data_total.length;
    var indices = new Array(len);
    for (var i = 0; i < len; ++i) indices[i] = i;


    // sort sites according to overall volume of ongoing transfers
    indices.sort(function (a, b) { return data_total[a] > data_total[b] ? -1 : data_total[a] < data_total[b] ? 1 : 0; });
    
    var data_name_sorted = [];
    var data_total_sorted = [];
    var data_copied_sorted = [];
    var data_total_subtract_copied_sorted = [];
    var data_nreplicas_sorted = [];
    var data_color_sorted = [];
    var data_phedex_sorted = [];
    

    var T2entries_sorted = [];
    var addsortedT2data = function(name, total, copied, nreplicas, problematic, phedex){
	T2entries_sorted.push({name: name, total: total, copied: copied, nreplicas: nreplicas, problematic: problematic, phedex: phedex})
    };


    for (var i = 0; i < len; i++){
	if (data_total[indices[i]]!=0){
	    data_name_sorted[i]=data_name[indices[i]];
	    data_total_sorted[i]=data_total[indices[i]];
	    data_copied_sorted[i]=data_copied[indices[i]];
	    data_nreplicas_sorted[i]=data_nreplicas[indices[i]];
	    data_total_subtract_copied_sorted[i]=data_total_subtract_copied[indices[i]];
	    if (data_problematic[indices[i]]){
		data_color_sorted[i]='rgba(255,0,0,1.0)';
	    }
	    else {
		data_color_sorted[i]='rgba(0, 103, 113, 0.25)';
	    }
	    data_phedex_sorted[i]=data_phedex[indices[i]];
	    
	}
    }

    var data_sorted = [
		       data_name_sorted, 
		       data_total_subtract_copied_sorted, 
		       data_copied_sorted, 
		       data_total_sorted, 
		       data_nreplicas_sorted, 
		       data_phedex_sorted
		      ];

    var data_copied_plot = {
	            x: data_sorted[0],
		    y: data_sorted[2],
		    xaxis: 'x2',
		    yaxis: 'y2',
		    name: 'Copied',
		    labels: data_sorted[0],
		    showlegend: false,
		    marker: {
		    color: data_color_sorted,
	             line: {
	             color: 'rgba(0, 103, 113, 0.5)',
	             width: 1.0
		     }
	            },

		    type: 'bar'
		};
    var data_dummy = {
		    x: data_sorted[0],
		    y: data_sorted[2],
		    name: 'Copied',
		    marker: {
	            color: 'rgba(0, 103, 113, 0.25)',
	             line: {
	             color: 'rgba(0, 103, 113, 0.25)',
	             width: 1.0
		     }
	            },

		    type: 'bar'
		};
    var data_total_plot = {
		    x: data_sorted[0],
		    y: data_sorted[1],
		    xaxis: 'x2',
		    yaxis: 'y2',
		    text: data_sorted[4],
		    name: 'Missing',
		    marker: {
	             color: 'rgba(0, 103, 113, 0.6)',
	             line: {
		     color: 'rgba(0, 103, 113, 0.6))',
		     width: 1.0
		     }
	            },
		    type: 'bar'
		};

    var data = [data_copied_plot, data_total_plot,data_dummy];

    var layout = {
	annotations: 
	     [{
		xref: 'paper',
		yref: 'paper',
		x: 0.7,
		xanchor: 'left',
		y: 0.54,
		yanchor: 'bottom',
		text: 'Has stuck transfers <br>(<5% within 3 days)',
		showarrow: false,
		font: {
		    family: 'sans-serif',
		    size: 16,
		    color: '#000'
		}

	    },    
            {
		x: 0.68,
		y: 0.585,
		xref: 'paper',
		yref: 'paper',
		text: '',
		showarrow: true,
		arrowhead: 7,
		arrowsize: 2,
		ax: 0,
		ay: -5,
		arrowcolor:'rgba(255,0,0,1)'
	    }],
	xaxis2: {domain: [0, 1],
		 anchor: 'y2',
		 tickformat: " %I%p",
		 tickangle: 45,
		 utorange: true,
		 zeroline: true,
		 showline: true,
		 autotick: true,
		 ticks: '',
		 showticklabels: false
	},
	yaxis2: {domain: [0, 1],
		 anchor: 'x2',
		 range: [0, 1.3*Math.max(...data_sorted[3])],
		 utorange: true,
		 zeroline: false,
		 showline: false,
		 autotick: true,
		 ticks: '',
		 showticklabels: false
		},


	xaxis: {
	    tickangle: 45
	},
	yaxis: {
	    range: [0, 1.3*Math.max(...data_sorted[3])],
	    title: 'Volume being copied to site (TB)'
	},
	margin: {t: 50, b: 160, l: 90, r: 40},
	title: 'Status of sites with ongoing transfers',
	
	barmode: 'stack',
	legend: {
	    x: 0,
	    y: 1.00,
	    bgcolor: "#E2E2E2",
	    
	    orientation: 'h',
	    traceorder: 'reversed',
	    font: {
		family: 'sans-serif',
		size: 16,
		color: '#000'
	    },
	},
	font: {
	    family: 'sans-serif',
	    size: 14,
	    color: '#7f7f7f'
	}
    };

    var siteoverview = document.getElementById('SiteOverview');
    Plotly.newPlot('SiteOverview', data,layout);

    siteoverview.on('plotly_click', function(data){
	    if(data.points.length === 2) {
		var link = data_phedex_tmp[data.points[0].pointNumber];		
		window.open(link,"_blank");
	    }
	});

    var div_id = [];
    for (var i in data_sorted[0])
	div_id.push('div:'+data_sorted[0]);

    d3.select("#Wrapper2").selectAll('div')
	.data(data_sorted[0])
	.enter()
	.append('div')
	.attr('id',function (d){ return d; })
	.style('height','180px')
	.style('width','600px');
    //.text(function (d){ return d; });
        
}




function drawCompletions(data) {

    var T2entries = [];
    var addT2data = function(name, copied, nreplicas){
	T2entries.push({name: name,  copied: copied, nreplicas: nreplicas})
    };
    
    for(var i = 0 in data) {

	var obj = data[i];
	var tmp_site = obj.site;
        var tmp_total = 0;
	var tmp_copied = 0;
	var tmp_nreplicas = 0;

	for(var j in obj["data"]) {
	    var replica = obj["data"][j];
	    //Tracking only complete replicas where replica.total == replica.copied
	    tmp_copied = tmp_copied + replica.copied[replica.copied.length-1]*(replica.total[replica.total.length-1]!=0)*(replica.total[replica.total.length-1]==replica.copied[replica.total.length-1]);;
	    tmp_nreplicas = tmp_nreplicas + 1*(replica.total[replica.total.length-1]!=0)*(replica.total[replica.total.length-1]==replica.copied[replica.total.length-1]);;
	}

        addT2data(tmp_site, tmp_copied, tmp_nreplicas);

    };

    var data_name = [];
    var data_copied = [];
    var data_nreplicas = [];
    

    for (var it2 in T2entries){
	data_name.push(T2entries[it2]['name']);
	data_copied.push(T2entries[it2]['copied']);
	if (T2entries[it2]['nreplicas']!=0)
	    data_nreplicas.push("Replicas successfully copied:" + " " +T2entries[it2]['nreplicas'].toString());
	else 
	    data_nreplicas.push("");
    }

    // getting indices
    var len = data_copied.length;
    var indices = new Array(len);
    for (var i = 0; i < len; ++i) indices[i] = i;
	
    indices.sort(function (a, b) { return data_copied[a] > data_copied[b] ? -1 : data_copied[a] < data_copied[b] ? 1 : 0; });
    
    var data_name_tmp = [];
    var data_copied_tmp = [];
    var data_nreplicas_tmp = [];
    var data_color_tmp = [];
    
    for (var i = 0; i < len; i++){
	data_name_tmp[i]=data_name[indices[i]];
	data_copied_tmp[i]=data_copied[indices[i]];
	data_nreplicas_tmp[i]=data_nreplicas[indices[i]];
	if (data_name_tmp[i]=="T2_US_MIT"){
	    data_color_tmp[i]='rgba(222,45,38,0.8)';
	}
	else {
	    data_color_tmp[i]='rgba(255, 102, 102,0.3)';
	}
    }

    var data_sorted = [data_name_tmp, data_copied_tmp, data_nreplicas_tmp];

    var data_copied = {
		    x: data_sorted[0],
		    y: data_sorted[1],
		    text: data_sorted[2],
		    name: 'Copied',
		    marker: {
	    //color: data_color_tmp,
		     color: 'rgba(255, 102, 102,0.3)',
	             line: {
		     color: 'rgba(255, 102, 102, 0.9)',
		     width: 1.0
		     }
	            },

		    type: 'bar'
		};

    var data = [data_copied];

    var layout = {
	xaxis: {
	    tickangle: 45
	},
	yaxis: {
	    title: 'Volume successfully copied to site (TB)'
	},
	margin: {t: 50, b: 160, l: 90},
	//hoverinfo: 'none',
	title: 'Site completed transfers overview (last 5 days)',
	
	barmode: 'stack',
	legend: {
	    x: 0.6720,
	    y: 1.00,
	    bgcolor: "#E2E2E2",
	    
	    orientation: 'h',
	    traceorder: 'reversed',
	    font: {
		family: 'sans-serif',
		size: 16,
		color: '#000'
	    },
	},
	font: {
	    family: 'sans-serif',
	    size: 12,
	    color: '#7f7f7f'
	}

    };


    Plotly.newPlot('Completions', data,layout);
    
}


function drawSummary(data) {



    var site = 'T2';
    var total_time = [];
    var total_copied = [];
    var total_total = [];
    //window.alert(site);

    var traces = [];

    var midnights_time_tmp = [];
    var midnights_time = [];
    var midnights_copied = [];
    
    var nreplicas = 0;
    var n_open_replicas = 0;
    
    // loop over sites
    for(var i = 0 in data) {
	
	var obj = data[i];
	site = obj.site;

	var traces_site = [];
	var site_has_open_transfers = false;
		
	// loop over replicas transferred to site
	for(var j in obj["data"]) {

	    var replica = obj["data"][j];

	    // loop over entries in rrd file of replicas
	    for(i=0;i<=replica.total.length-1; i++){

		if (nreplicas==0 && replica.copied[i]!=replica.total[i]){

		    total_time.push(replica.time[i]);
		    total_copied.push(replica.copied[i]);
		    total_total.push(replica.total[i]);

		}
		else {

		    var idx = total_time.indexOf(replica.time[i]);

		    if (idx>=0 && replica.copied[i]!=replica.total[i]){//time entry already there

			total_copied[idx]=total_copied[idx]+replica.copied[i];
			total_total[idx]=total_total[idx]+replica.total[i];
		    }

		    else if (replica.time[i]>total_time[total_time.length-1] && replica.copied[i]!=replica.total[i])
			{//time entry needs to be appended at the end
			    total_time.push(replica.time[i]);
			    total_copied.push(replica.copied[i]);
			    total_total.push(replica.total[i]);
		    }

		    else if (replica.time[i]<total_time[0] && replica.copied[i]!=replica.total[i]){//first time this occurs, append at the beginning
			
			total_time.unshift(replica.time[i]);
			total_copied.unshift(replica.copied[i]);
			total_total.unshift(replica.total[i]);
			
		    }

		    else if (idx<0 && replica.copied[i]!=replica.total[i]){//all the other times, timestamp is missing in the middle of the array. Figuring out the neighbouring timestamps
			
			var idx_smaller = -99;
			var idx_bigger = -99;
			for (var u = 0; u<total_time.length;u++){
			    if (replica.time[i]>total_time[u]){
				idx_smaller=u;
			    }
			    if (replica.time[i]<total_time[total_time.length-1-u]){
				idx_bigger = total_time.length-1-u;
			    }
			}
			total_time.splice(idx_smaller+1,0,replica.time[i]);
			total_copied.splice(idx_smaller+1,0,replica.copied[i]);
			total_total.splice(idx_smaller+1,0,replica.total[i]);
	       	
		    }
		}
	    }
	    
	    if (max_time == replica.time[replica.total.length-1] && replica.total[replica.copied.length-1]!=replica.copied[replica.copied.length-1]){
		site_has_open_transfers = true;

		var replica_ratio = [];
		for (var i=replica.copied.length-288; i< replica.copied.length;i++){ // 288 time intervals a 900 sec = 5 days
		    /*
		      if (replica.time[i]<max_time-five_days/2)
			continue;
		    if (i%2!=0)
		    	continue;
		    */
		    if (n_open_replicas==0)
			replica_time_tmp.push(replica.time[i]);
		    replica_ratio.push(100*replica.copied[i]/replica.total[i]);
		}

		if (n_open_replicas==0)
		    replica_time_converted = replica_time_tmp.map(timeConverter); 

		traces_site.push(makeTrace(replica.replica,replica_time_converted,replica_ratio,'dot',1.6,false,colors[nreplicas]));

		n_open_replicas += 1;

	    }

	    nreplicas += 1;
	    
	}

	if (site_has_open_transfers){
	    var layout_sites = {
		xaxis: {
		    //showgrid: false,
		    tickangle: 45
		},
		yaxis: {
		    title: 'Volume copied (%)',
		    range: [0, 105],

		},
		margin: {t: 32, b: 50, l: 90, r: 160},
		hoverinfo: 'closest',
		title: site,
		
		barmode: 'stack',
		legend: {
		    x: 0.6720,
		    y: 1.00,
		    bgcolor: "#E2E2E2",
		    
		    orientation: 'h',
		    traceorder: 'reversed',
		    font: {
			family: 'sans-serif',
			size: 16,
			color: '#000'
		    },
		},
		font: {
		    family: 'sans-serif',
		    size: 12,
		    color: '#7f7f7f'
		}
	    };
	    Plotly.plot(site, traces_site, layout_sites);
	}
    }

    // End of historic section

    var total_total_white = [];
    
    for (var i =0; i<total_total.length; i++){
	total_total_white.push(0);
    }

    while ((total_time[total_time.length-1]-18000) % (86400) != 0){
    	total_time.push(total_time[total_time.length-1]+900);
	total_total_white.push(0);
	
    }

    // cut arrays if they start with zero
    while (total_total[0]==0){ 
	total_time.splice(0,1);
	total_copied.splice(0,1);
	total_total.splice(0,1);
    }    
    
    while (total_time[0]<total_time[total_time.length-1]-5*24*60*60*1.02){ 
	total_time.splice(0,1);
	total_copied.splice(0,1);
	total_total.splice(0,1);	
    }    
    
    // Determining midnight times

    for (var idx = 0; idx<total_time.length; idx++){
	if ((total_time[idx]-86400) % one_day == 0){
	    midnights_time_tmp.push(total_time[idx]);
	}
    }

    for (var idx = midnights_time_tmp.length-1; idx>=0; idx--){
	midnights_time[midnights_time_tmp.length-1-idx]=midnights_time_tmp[idx];
    }

    //massaging times that get screwed up because of timezone difference:    
    midnights_time.reverse();
    midnights_time.unshift(midnights_time[0]-24*60*60);
    
    for (var i=0;i<midnights_time.length;i++){
    	midnights_time[i]+=18000;
    }

    var total_copied_aggr = [];
    
    for (var k=0;k<total_time.length;k++){
	if (k==0){
	    total_copied_aggr.push(total_copied[0]);
	}
	else {
	    total_copied_aggr.push(total_copied_aggr[k-1]+(total_copied[k]-total_copied[k-1])*(total_copied[k]>total_copied[k-1]));
	}
    }

    for (var m=0; m<midnights_time.length;m++){
	var idx_1 = total_time.indexOf(midnights_time[m]);
	var idx_2 = -99;
	if (m==midnights_time.length-2){
	    var nan_index = total_copied_aggr.length-1;
	    while (isNaN(total_copied_aggr[nan_index])){
		nan_index -= 1;
	    }
	    idx_2 = nan_index;
	}
	else{
	    idx_2 = total_time.indexOf(midnights_time[m+1]);
	}
	midnights_copied.push(total_copied_aggr[idx_2]-total_copied_aggr[idx_1])
    }

    var midnights_time_final = midnights_time.slice(0,-1);
    var midnights_copied_final = midnights_copied.slice(0,-1);

    var trace_midnight = {
	name: 'Daily aggregate',
	x: midnights_time_final.map(timeConverter),
	y: midnights_copied_final,
	type: 'bar',
	xaxis: 'x2',
	yaxis: 'y2',
	marker: {
	    color: 'rgba(57, 106, 173, 0.8)',
	}

    };

    var total_time_converted = total_time.map(timeConverter);

    //traces.push(makeTrace('Aggr',total_time.map(timeConverter),total_copied_aggr,'solid',2,true,'rgba(330, 103, 113, 0.8)'));

    traces.push(trace_midnight);
    traces.push(makeTrace('Total_white',total_time_converted,total_total_white,'solid',2,false,'rgba(0, 0, 0, 0)'));
    traces.push(makeTrace('Copied',total_time_converted,total_copied,'solid',2,true,'rgba(0, 103, 113, 0.25)'));
    traces.push(makeTrace('Total',total_time_converted,total_total,'solid',2,true,'rgba(0, 103, 113, 0.6)'));

    var layout = {
	
	xaxis2: {domain: [0, 1],
		 anchor: 'y2',
		 tickformat: " %I%p",
		 tickangle: 45,
		 utorange: true,
		 showgrid: false,
		 zeroline: true,
		 showline: true,
		 autotick: true,
		 ticks: '',
		 showticklabels: false
	},
	yaxis2: {domain: [0, 1],
		 anchor: 'x2',
		 range: [0, 1.4*Math.max(...total_total)],
		 utorange: true,
		 showgrid: false,
		 zeroline: false,
		 showline: false,
		 autotick: true,
		 ticks: '',
		 showticklabels: false
		},
	
	xaxis: {
	    domain: [0, 1.],
	    title: 'Time',
	    //tickformat: "%a %I%p",
	    tickangle: 45
	},
		yaxis: {title: 'Volume (TB)' , range: [0, 1.4*Math.max(...total_total)]},
	margin: {t: 50, b: 160, l: 90, r: 0},
	hoverinfo: 'none',
	showlegend:true,
	title: 'Cumulative transfers overview',
	legend: {
	    x: 0,
	    y: 1.00,
	    bgcolor: "#E2E2E2",
	    
	    orientation: 'h',
	    traceorder: 'reversed',
	    font: {
		family: 'sans-serif',
		size: 16,
		color: '#000'
	    },
	},
	font: {
	    family: 'sans-serif',
	    size: 14,
	    color: '#7f7f7f'
	},
	paper_bgcolor: 'rgba(0,0,0,0)',
	plot_bgcolor: 'rgba(0,0,0,0)'
    };

    Plotly.plot('Summary', traces,layout);

}



