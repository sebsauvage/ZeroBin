<?php

// Generate a large random hexadecimal salt.
function generateRandomSalt()
{
    $randomSalt='';
    if (function_exists("mcrypt_create_iv"))
    {
        $randomSalt = bin2hex(mcrypt_create_iv(256, MCRYPT_DEV_URANDOM));
    }
    else // fallback to mt_rand()
    {
        for($i=0;$i<16;$i++) { $randomSalt.=base_convert(mt_rand(),10,16); }
    }
    return $randomSalt;
}

/* Return this ZeroBin server salt.
   This is a random string which is unique to each ZeroBin installation.
   It is automatically created if not present.

   Salt is used:
      - to generate unique VizHash in discussions (which are not reproductible across ZeroBin servers)
      - to generate unique deletion token (which are not re-usable across ZeroBin servers)
*/
function getServerSalt()
{
    $saltfile = 'data/salt.php';
    if (!is_file($saltfile))
        file_put_contents($saltfile,'<?php /* |'.generateRandomSalt().'| */ ?>',LOCK_EX);
    $items=explode('|',file_get_contents($saltfile));
    return $items[1];

}

?>