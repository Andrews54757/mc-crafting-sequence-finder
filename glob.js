module.exports = function Glob(files) {
    var fs = require('fs')

    function regexIndexOf(string, regex, startpos) {
        var indexOf = string.substring(startpos || 0).search(regex);
        return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
    }

    function regexLastIndexOf(string, regex, startpos) {
        regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
        if (typeof (startpos) == "undefined") {
            startpos = string.length;
        } else if (startpos < 0) {
            startpos = 0;
        }
        var stringToWorkWith = string.substring(0, startpos + 1);
        var lastIndexOf = -1;
        var nextStop = 0;
        while ((result = regex.exec(stringToWorkWith)) != null) {
            lastIndexOf = result.index;
            regex.lastIndex = ++nextStop;
        }
        return lastIndexOf;
    }
    var out = [];

    function get(file) {
        if (/[*?\[\]]/.test(file)) {
            var ind = regexIndexOf(file, /[*?\[\]]/),
                ind2 = file.lastIndexOf('/', ind);

            var before = file.substring(0, ind2),
                after = file.substring(ind2 + 1)
            try {
                fs.statSync(before);
                after = after.split('/');

                function walk(path, i) {
                    try {
                        var current = fs.readdirSync(path);
                        var rule = after[i];
                        if (/[*?\[\]]/.test(rule)) {
                            var regex = new RegExp(rule.replace(/[*?]/g, function (a) {
                                return '.' + (a === '*' ? '*' : '')
                            }));
                            current.forEach((p) => {
                                if (regex.test(p)) {
                                    if (i === after.length - 1) {
                                        out.push(path + '/' + p);
                                    } else {
                                        walk(path + '/' + p, i + 1)
                                    }
                                }
                            });
                        } else {

                            if (current.indexOf(rule) !== -1) {
                                if (i === after.length - 1) {
                                    out.push(path + '/' + rule);
                                } else {
                                    walk(path + '/' + rule, i + 1)
                                }
                            }
                        }
                    } catch (e) {

                    }
                }
                walk(before, 0)
            } catch (e) {

            }
        } else {
            if (fs.existsSync(file)) {
                out.push(file);
            }
        }
    }
    if (typeof files === 'object') {
        files.forEach((file) => {
            get(file)
        })
    } else {
        get(files)
    }
    return out;
}