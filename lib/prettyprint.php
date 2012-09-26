<?
// Simple GeSHi demo

// Include the GeSHi library
$path = "../geshi/";
include($path . 'geshi.php');
// Make a new GeSHi object, with the source, language and path set
$source = $_POST['text'];
$lang = $_POST['lang'];
$geshi = new GeSHi($source, $lang, $path . '/geshi');
echo $geshi->parse_code();
?>
