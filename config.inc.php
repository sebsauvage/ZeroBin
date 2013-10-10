<?php
/*
ZeroBin - a zero-knowledge paste bin
Please see project page: http://sebsauvage.net/wiki/doku.php?id=php:zerobin
*/

// Set each one of these to the number
// of seconds in the expiration period,
// or -1 if it shall never expire
$cfg["expire"]["5min"] = 5*60;
$cfg["expire"]["10min"] = 10*60;
$cfg["expire"]["1hour"] = 60*60;
$cfg["expire"]["1day"] = 24*60*60;
$cfg["expire"]["1week"] = 7*24*60*60;
$cfg["expire"]["1month"] = 30*24*60*60; // Well this is not *exactly* one month, it's 30 days.
$cfg["expire"]["1year"] = 365*24*60*60;
$cfg["expire"]["never"] = -1;

//Labels for the expiration times. Must match those in $cfg["expire"]
$cfg["expireLabels"]["5min"] = "5 minutes";
$cfg["expireLabels"]["10min"] = "10 minutes";
$cfg["expireLabels"]["1hour"] = "1 hour";
$cfg["expireLabels"]["1day"] = "1 day";
$cfg["expireLabels"]["1week"] = "1 week";
$cfg["expireLabels"]["1month"] = "1 month";
$cfg["expireLabels"]["1year"] = "1 year";
$cfg["expireLabels"]["never"] = "Never";

/*
 * The expire value that is selected per default
 * Make sure the value exists in $cfg["expire"]
 */
$cfg["expireSelected"] = "1month";

/* Default expiration time, if nothing or sth invalid is selected
 * This is NOT the per-default selected option
 * Make sure the value exists in $cfg["expire"]
 */
$cfg["expireDefault"] = "never";

/*
 * Set this to true to default-select
 * the burn-after-reading feature
 */
$cfg["burnAfterReadingSelected"] = false;

/*
 * The time between two posts, in seconds
 * from a single IP address.
 * Set this to -1 to disable rate limiting.
 */
$cfg["timeBetweenPosts"] = 10;

/*
 * The maximum post size in bytes.
 * Default: 2 Mibibytes
 */
$cfg["maxPostSize"] = 2097152;

/*
<<<<<<< HEAD
 * Whether to show the hash on-screen.
 * Users selecting the text could copy
 *  the paste URL without hash if
 *  this is disabled, but it provides
 *  slightly higher security.
 */
$cfg["showHash"] = true;


/*
 * Set this to false to disable the discussion system
 */
$cfg["enableDiscussionSystem"] = true;

/*
 * Set this to false to disable syntax highlighting
 */
$cfg["enableSyntaxHighlighting"] = true;

?>