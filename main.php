<?php
#$rrdpath = '/var/www/html/dynamo/dealermon/test/rrds';
$rrdpath = '/var/spool/dynamo/track_transfers/';
$rrdcolumns = array('copied', 'total');

function single_rrd_to_array($rrd)
{
  global $rrdpath;
  global $rrdcolumns;
 
  $ncols = count($rrdcolumns);
  $last = rrd_last($rrdpath . '/' . $rrd);

  $options = array('LAST', sprintf('--start=%d', $last - 3600 * 24 * 6), sprintf('--end=%d', $last - 1));
  $dump = rrd_fetch($rrdpath . '/' . $rrd, $options, count($options));

  if (isset($dump['data']) && count($dump['data']) >= $ncols) {
    $chunks = array_chunk($dump['data'], $ncols);
    $entry = $chunks;
  }
  else
    $entry = array_fill(0, $ncols, 0);

  $copied_entries = array();
  $total_entries = array();
  $time_entries = array();

  $mapped = array();
  $counter = 0;
  foreach ($entry as $i => $d){
    if ($counter%1 == 0) {
      array_push($time_entries,$i*$dump["step"]+$dump["start"]);
      array_push($total_entries,$d[1]/1e12);
      array_push($copied_entries,$d[0]/1e12);
    }
    $counter = $counter + 1;

  }
  $last_copied = array_pop($copied_entries);
  $last_total = array_pop($total_entries);
  $last_time = array_pop($time_entries);
  $rrd_array = array(	
		     $time_entries,
		     $copied_entries,
		     $total_entries,
				 );

#  var_dump($rrd_array[2]);
  return $rrd_array;
}

if (isset($_REQUEST['getSummary']) && $_REQUEST['getSummary']) {
  
  $Summary = single_rrd_to_array('total.rrd');
  
  echo json_encode($Summary);
  
}



if ( (isset($_REQUEST['getJson']) && $_REQUEST['getJson']) || (isset($_REQUEST['getSiteOverview']) && $_REQUEST['getSiteOverview'])) {
  
  # Defining the array
  $d = array();

  foreach (glob($rrdpath . "/T*") as $sitename) {

    if(isset($_REQUEST['sitename']) && $_REQUEST['sitename']==$sitename){
      continue;
    }

    //continue;

    $siteinfo = array('site' => str_replace($rrdpath . '/', '', $sitename), 'data' => array());

    
    ## Access a single site if argument sitename was handed over
    if(isset($_REQUEST['sitename']) && $_REQUEST['sitename']!=str_replace($rrdpath . '/', '', $sitename)){
      continue;
    }


    foreach (glob($sitename . "/*.rrd") as $replicaname) {
      if (preg_match('/site/',$replicaname)) {
	continue;
      }

      # Get time, copied, and total for specific dataset
      $replicadata = single_rrd_to_array(str_replace($rrdpath, '', $replicaname));

      # Massage name of dataset
      $replicaname = str_replace($sitename . '/', '', $replicaname);
      $replicaname = str_replace('.rrd', '', $replicaname);
      

      $replicainfo = array('replica' => $replicaname, 'time' => $replicadata[0], 'copied' => $replicadata[1], 'total' => $replicadata[2]);

      # There are some old rrd's of already completed requests. Don't take those into account.
      if ($replicadata[1][count($replicadata)] == $replicadata[2][count($replicadata)]) {
      	continue;
      }
      else {
	
	$siteinfo['data'][] = $replicainfo;
	
      }

#      $d[] = array('site' => str_replace($rrdpath . '/', '', $sitename), 'replica' => $replicaname, array('time' => $replicadata[0], 'copied' => $replicadata[1], 'total' => $replicadata[2]));

    }

    $d[] = $siteinfo;
  }

  echo @json_encode($d);

}


?>



