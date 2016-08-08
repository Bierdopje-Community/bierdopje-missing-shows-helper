# Bierdopje missing shows helper

A very small userscript written for [Xandecs](http://www.bierdopje.com/users/Xandecs/profile) that makes parsing through the requests for new shows manageable on [Bierdopje](bierdopje.com).

The script is only active in the [missing shows in bd / available in tvdb](http://www.bierdopje.com/forum/geachte-redactie/topic/1883-missende-series-in-bd-wel-in-tvdb) thread.

There it will:

1. Look for comments with a TvDbId
2. Check <sup>Using the [Bierdopje API](https://github.com/RobinHoutevelts/bierdopje-api.houtevelts.com)</sup> whether or not the show is _really_ missing on Bierdopje.
3. Show it's findings in a nice table.

Example:
![Example](http://eih.bz/s1/gifvlvf.gif)


To *install* you'll need a browser extension:
* Chrome => [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
* Firefox => [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey)


Afterwards you can __install__ the script
[BdMissingShowsHelper.user.js](https://github.com/Bierdopje-Community/bierdopje-missing-shows-helper/raw/master/BdMissingShowsHelper.user.js)

This project utilizes:

* [mattiasdelang/bierdopje-php](https://github.com/mattiasdelang/bierdopje-php)
* [Moinax/TvDb](https://github.com/Moinax/TvDb)

The code is still a mess. I hope to improve it in the near future.

I'd also like to replace the horrible jQuery+Handlebars code with [Vue.js](https://vuejs.org/)
