/*

 welcome.js: first-run page Javascript for Epichrome apps

 Copyright (C) 2020 David Marmor.

 https://github.com/dmarmor/epichrome

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

// EPIENGINES -- info on all compatible browsers
const epiEngines = {
    'com.microsoft.edgemac': {
        'bundleName':  'Edge',
        'displayName': 'Microsoft Edge'
    },
    'com.vivaldi.Vivaldi': {
        'bundleName':  'Vivaldi',
        'displayName': 'Vivaldi'
    },
    'com.operasoftware.Opera': {
        'bundleName':  'Opera',
        'displayName': 'Opera'
    },
    'com.brave.Browser': {
        'bundleName':  'Brave',
        'displayName': 'Brave Browser'
    },
    'org.chromium.Chromium': {
        'bundleName':  'Chromium',
        'displayName': 'Chromium'
    },
    'com.google.Chrome': {
        'bundleName':  'Chrome',
        'displayName': 'Google Chrome'
    }
};


// REPLACETEXT -- replace text in all elements with a given class
function replaceText(className, newText, root=document) {

    // replace text for each instance of class found
    const elems = root.getElementsByClassName(className);
    for (let curElem of elems) {
        curElem.innerHTML = newText;
    }
}


// SETENGINE -- set info on the page for an engine, returns true if engine found
function setEngine(id, code='') {

    if (id) {

        // get info on this engine
        const engineID = id.slice(9);
        const engineType = id.slice(0,8);
        const info = epiEngines[engineID];
        if (!info) return false;

        // set up engine code
        if (code) { code = '_' + code; }

        // display engine text
        setDisplay('.has_engine' + code);

        // internal/external engine
        if (engineType == 'internal') {
            setDisplay('.engine' + code + '_type_int');
        } else {
            setDisplay('.engine' + code + '_type_ext');
        }

        // engine browser
        replaceText('engine' + code + '_browser', info.bundleName);

        // add to info
        info.id = engineID;
        info.type = engineType;

        // success
        return info;
    } else {

        // no ID
        return null;
    }
}


// BUILDPAGE -- main function to build the page view using url parameters
function buildPage() {

    // get URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // GENERAL APP INFO

    // app version
    var appVersion = urlParams.get('v');
    if (appVersion) {
        replaceText('version_cur', appVersion);
    } else {
        appVersion = document.getElementsByClassName('version_cur')[0].innerHTML;
    }

    // app engine
    const appEngine = setEngine(urlParams.get('e'));

    // SET ACTIVE PAGE & CHANGES

    // default to new app page
    var activePage = null;
    var pageTitle = null;
    var runtimeAction = 'rt_install';

    // app changes
    var appChanges = [];

    // alert extras
    var alertExtras = [];

    // update page
    const oldVersion = urlParams.get('ov');
    const statusUpdate = (oldVersion != null);
    // var statusUpdateSpecial = false;
    if (statusUpdate) {
        activePage = 'pg_update';
        pageTitle = document.head.dataset['update'].replace('OLDVERSION', oldVersion).replace('NEWVERSION', appVersion);

        appChanges.push('ch_update');
        alertExtras.push('al_update');

        replaceText('version_old', oldVersion);
    }

    // engine change
    var activePassword = null;
    const oldEngine = setEngine(urlParams.get('oe'), 'old');
    const statusEngineChange = (oldEngine != null);
    if (statusEngineChange) {
        if (!activePage) {
            activePage = 'pg_change_engine';
            pageTitle = document.head.dataset['changeEngine'].replace('OLDENGINE', oldEngine.bundleName).replace('NEWENGINE', appEngine.bundleName);
        }
        appChanges.push('ch_change_engine');
        activePassword = 'pw_change_engine';
    }

    // prefs reset
    const statusReset = (urlParams.get('r') == 1);
    if (statusReset) {
        if (!activePage) {
            activePage = 'pg_reset';
            pageTitle = document.head.dataset['reset'];
        }
        appChanges.push('ch_reset');
        if (!activePassword) { activePassword = 'pw_reset'; }
    }

    // new app
    const statusNewApp = (activePage == null);
    if (statusNewApp) {
        activePage = 'pg_new';
        pageTitle = document.head.dataset['new'].replace('APPVERSION', appVersion);
    }

    var bookmarkResult = urlParams.get('b');
    if (bookmarkResult == '1') {
        bookmarkResult=false;
        appChanges.push('ch_bookmark_add');
    }
    else if (bookmarkResult == '2') {
        bookmarkResult=false;
        appChanges.push('ch_bookmark_new');
    }
    else if (bookmarkResult == '3') {
        bookmarkResult='bm_fail';
    }
    else if (bookmarkResult == '4') {
        bookmarkResult='bm_deleted';
    }
    else if (bookmarkResult == '5') {
        bookmarkResult='bm_error';
    }
    else { bookmarkResult = false; }

    // SET PAGE TITLE

    document.title = pageTitle;

    // ACTION ITEM: RUNTIME EXTENSION

    const statusRuntime = urlParams.get('rt');
    if (statusRuntime == 1) {
        runtimeAction = 'rt_update';
        alertExtras.push('al_update_runtime');
    } else if (statusRuntime == 2) {
        runtimeAction = 'rt_change_engine';
    } else if (statusRuntime == 3) {
        runtimeAction = 'rt_update_fail';
        alertExtras.push('al_update_runtime');
    } else if (statusReset) {
        runtimeAction = 'rt_reset';
    }

    // ACTION ITEM: EXTENSION LIST

    // parse extensions and apps
    var extensions = urlParams.getAll('x');
    var apps = urlParams.getAll('a');
    var activeExtList = null;
    if ((extensions.length > 0) || (apps.length > 0)) {

        // prepare extension & app lists
        var extNode = document.getElementById('extension_dummy');
        var extListNode = extNode.parentNode;
        var extIconTemplate = extNode.getElementsByClassName('extension_icon')[0].dataset.template;
        extListNode.removeChild(extNode);
        extNode.removeAttribute('id');
        extNode.classList.remove('hide');
        var appListNode = document.getElementById('app_list');

        // reveal elements needed when we have extensions
        if (extensions.length > 0) {
            setDisplay('.has_exts');
        }
        // reveal elements needed when we have apps
        if (apps.length > 0) {
            console.log("showing apps");
            setDisplay('.has_apps');
        }
        // reveal elements needed when we have both extensions & apps
        if ((extensions.length > 0) && (apps.length > 0)) {
            console.log("showing boths");
            setDisplay('.has_exts_apps');
        }

        // populate extensions list
        populateExtList(extListNode, extNode, extIconTemplate, extensions);

        // populate extensions list
        populateExtList(appListNode, extNode, extIconTemplate, apps);

        // what type of list are we showing?
        if (urlParams.get('xi')) {
            activeExtList = 'ext_new';
        } else {
            alertExtras.push('al_ext_reinstall');
            if (statusEngineChange) {
                activeExtList = 'ext_change_engine';
            } else if (statusUpdate) {
                activeExtList = 'ext_update';
            } else {
                activeExtList = 'ext_fallback';
            }
        }

        // show correct ext group
        setDisplayGroup('group_ext', activeExtList);

    }

    // SHOW MAIN PAGE ITEMS

    // show active page
    setDisplayGroup('group_pg', activePage);

    // show active changes
    if (statusUpdate || (appChanges.length > 0)) {
        setDisplay('#changes_msg');

        if (appChanges.length > 0) {
            for (let curChange of appChanges) { setDisplay(curChange); }
            setDisplay('#changes_user');
        }
    }

    // SHOW/HIDE ACTION ITEMS

    // set appropriate runtime extension message
    setDisplayGroup('group_rt', runtimeAction);

    // show passwords message if needed
    if (activePassword != null) { setDisplayGroup('group_pw', activePassword); }

    // show extension list if needed
    if (activeExtList != null) { setDisplay('#extensions'); }

    // show bookmarks prompt if needed
    if (bookmarkResult && (bookmarkResult.slice(0,3) == 'bm_')) {
        setDisplayGroup('group_bm', bookmarkResult);
    }

    // show special update text

    // if (statusUpdateSpecial) {
    //     setDisplayGroup('group_ov', 'ov_update');
    // }

    // RENUMBER ACTIONS LIST

    const actionsList = document.getElementById('actions_list').getElementsByClassName('item');
    var nextNum = 1;
    var lastItemNum = null;
    for (let curAction of actionsList) {

        // check if this action is visible
        if (getComputedStyle(curAction).display != 'none') {

            // update item number
            var curItemNum = curAction.getElementsByClassName('itemnum')[0];
            curItemNum.innerHTML = nextNum;
            nextNum++;
            lastItemNum = curItemNum;
        }
    }

    // special case: only one visible, so hide number
    if (nextNum == 2) { lastItemNum.style.display = 'none'; }


    // SHOW PAGE CONTENTS
    setDisplay('.contents');

    // possibly show look at me dammit alert
    if (urlParams.get('m') == '1') {

        // turn on any extras
        if (alertExtras.length > 0) {
            for (let curExtra of alertExtras) { setDisplay(curExtra); }
        }

        var alertbox = document.getElementById('alert');
        setDisplay(alertbox);
        document.getElementById('alert_close').addEventListener('click', function(evt) {
            alertbox.style.transitionProperty = 'none';
            setDisplay(alertbox, false);
        }, false);
    }
}


function setDisplay(selector, displayMode = true, root=document) {

    // get elements to set display for
    if (typeof selector === 'string') {
        if (selector[0] == '#') {
            var nodes = [ root.getElementById(selector.slice(1)) ];
        } else {
            if (selector[0] == '.') { selector = selector.slice(1); }
            var nodes = root.getElementsByClassName(selector);
        }
    } else if (selector instanceof Node) {
        var nodes = [ selector ];
    } else {
        var nodes = selector;
    }

    // iterate & set display style
    for (let curNode of nodes) {
        if (!displayMode) {
            curNode.classList.add('hide');
        } else if (displayMode == true) {
            curNode.classList.remove('hide');
            //style.display = getComputedStyle(curNode).getPropertyValue("--display-on");
        } else {
            curNode.style.display = displayMode;
        }
    }
}


function setDisplayGroup(group, activeItem, root=document) {

    for (let curItem of root.getElementsByClassName(group)) {
        if (curItem.classList.contains(activeItem)) {
            setDisplay(curItem);
        } else {
            setDisplay(curItem, false);
        }
    }
}


function populateExtList(extListNode, extNode, extIconTemplate, items) {

    if (items.length > 0) {

        // create regex for parsing extensions & apps
        const regexpExt = new RegExp('^((.+)\\.[^.]+),(.*)$');
        const regexpIcon = new RegExp('EXTICON');

        // parse list into sortable array
        var sortedItems = [];
        for (let i = 0; i < items.length; i++) {

            // parse extension ID & name
            var curExt = items[i];
            var curMatch = curExt.match(regexpExt);
            if (curMatch) {
                var curExtIcon = curMatch[1];
                var curExtID = curMatch[2];
                var curExtName = curMatch[3];
                if (! curExtName) { curExtName = curExtID; }
            } else {

                // unable to parse extension
                console.log('Unable to parse extension string "' + curExt + '"');
                continue;
            }

            // add to sortable list
            sortedItems.push([curExtID, curExtName, curExtIcon]);
        }

        // sort array
        sortedItems.sort(function(a,b) {
            if (a[1] > b[1]) {
                return 1;
            } else if (a[1] < b[1]) {
                return -1;
            } else {
                return 0;
            }
        });

        // add items to list
        for (let i = 0; i < sortedItems.length; i++) {

            // get item elements
            curExtID   = sortedItems[i][0];
            curExtName = sortedItems[i][1];
            curExtIcon = sortedItems[i][2];

            // create list item for parsed extension info
            var curNode = extNode.cloneNode(true);

            // set icon image
            curNode.getElementsByClassName('extension_icon')[0].src = extIconTemplate.replace(regexpIcon, curExtIcon);

            // remove all text from name
            var curNameNode = curNode.getElementsByClassName('extension_name')[0]
            while (curNameNode.firstChild) {
                curNameNode.removeChild(curNameNode.lastChild);
            }

            // create new text node with name (to escape weird text)
            var curNameText = document.createTextNode(curExtName);
            curNameNode.appendChild(curNameText);

            // set web store link
            var curInstall = curNode.getElementsByClassName('install')[0];
            curInstall.href += curExtID;

            // add new node to list
            extListNode.appendChild(curNode);
        }

        // display this list
        setDisplay(extListNode);
    }
}
