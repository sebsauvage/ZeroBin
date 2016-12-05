ZeroBin on OpenShift
====================

This git repository helps you get up and running quickly w/ a ZeroBin installation
on OpenShift.

Running ZeroBin on OpenShift
----------------------------

Create an account at http://openshift.redhat.com/

Create a php-5.3 application (you can call your application whatever you want)

    rhc app create -a zerobin -t php-5.3

Add this upstream zerobin repo

    cd zerobin
    git remote add upstream -m master git://github.com/mscherer/zerobin.git
    git pull -s recursive -X theirs upstream master
    # note that the git pull above can be used later to pull updates to ZeroBin

Then push the repo upstream

    git push

That's it, you can now checkout your application at :

    http://zerobin-$yournamespace.rhcloud.com

