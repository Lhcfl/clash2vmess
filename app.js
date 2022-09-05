const fs = require("fs");
const yaml = require('js-yaml');
var http = require("http");
var skip;

utf16to8 = function (str) {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            out += str.charAt(i);
        } else if (c > 0x07FF) {
            out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        } else {
            out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        }
    }
    return out;
}


//utf-8转utf-16
utf8to16 = function (str) {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += str.charAt(i - 1);
                break;
            case 12: case 13:
                // 110x xxxx 10xx xxxx
                char2 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx 10xx xxxx 10xx xxxx
                char2 = str.charCodeAt(i++);
                char3 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }
    return out;
}

if (process.argv[2] == "-c") {
    const vmesss = String(fs.readFileSync(process.argv[3])).split("\n");
    console.log(vmesss);
    let clash_config = yaml.load(fs.readFileSync("./example.clash.yml"));
    clash_config.proxies = [];
    let count = {};
    for (const vmesslink of vmesss) {
        if (vmesslink.slice(0, 8) == 'vmess://') {
            const config = JSON.parse(utf8to16(atob(vmesslink.slice(8))));
            console.log(config);
            if (config.ps.indexOf("香港") != -1) {
                config.ps = '🇭🇰 ' + config.ps;
                if (clash_config["proxy-groups"][0].proxies[0] == 'DIRECT') clash_config["proxy-groups"][0].proxies.pop();
                clash_config["proxy-groups"][0].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("日本") != -1) {
                config.ps = '🇯🇵 ' + config.ps;
                if (clash_config["proxy-groups"][1].proxies[0] == 'DIRECT') clash_config["proxy-groups"][1].proxies.pop();
                clash_config["proxy-groups"][1].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("美国") != -1) {
                config.ps = '🇺🇲 ' + config.ps;
                if (clash_config["proxy-groups"][2].proxies[0] == 'DIRECT') clash_config["proxy-groups"][2].proxies.pop();
                clash_config["proxy-groups"][2].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("台湾") != -1) {
                config.ps = '🇨🇳 ' + config.ps;
                if (clash_config["proxy-groups"][3].proxies[0] == 'DIRECT') clash_config["proxy-groups"][3].proxies.pop();
                clash_config["proxy-groups"][3].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("狮城") != -1 || config.ps.indexOf("新加坡") != -1) {
                config.ps = '🇸🇬 ' + config.ps;
                if (clash_config["proxy-groups"][4].proxies[0] == 'DIRECT') clash_config["proxy-groups"][4].proxies.pop();
                clash_config["proxy-groups"][4].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("韩国") != -1) {
                config.ps = '🇰🇷 ' + config.ps;
                if (clash_config["proxy-groups"][5].proxies[0] == 'DIRECT') clash_config["proxy-groups"][5].proxies.pop();
                clash_config["proxy-groups"][5].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("俄罗斯") != -1) {
                config.ps = '🇷🇺 ' + config.ps;
                if (clash_config["proxy-groups"][6].proxies[0] == 'DIRECT') clash_config["proxy-groups"][6].proxies.pop();
                clash_config["proxy-groups"][6].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("土耳其") != -1) {
                config.ps = '🇹🇷 ' + config.ps;
                if (clash_config["proxy-groups"][6].proxies[0] == 'DIRECT') clash_config["proxy-groups"][6].proxies.pop();
                clash_config["proxy-groups"][6].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("德国") != -1) {
                config.ps = '🇩🇪 ' + config.ps;
                if (clash_config["proxy-groups"][6].proxies[0] == 'DIRECT') clash_config["proxy-groups"][6].proxies.pop();
                clash_config["proxy-groups"][6].proxies.push(config.ps);
            }
            else if (config.ps.indexOf("节点") != -1) {
                if (clash_config["proxy-groups"][6].proxies[0] == 'DIRECT') clash_config["proxy-groups"][6].proxies.pop();
                clash_config["proxy-groups"][6].proxies.push(config.ps);
            }

            let translate_config = {
                name: config.ps,
                server: config.add,
                port: config.port,
                type: "vmess",
                uuid: config.id,
                alterId: config.aid,
                cipher: "auto",
                tls: config.tls == "tls" ? true : false,
                "skip-cert-verify": false,
                "network": config.net,
            }
            if (count[config.ps] != undefined) {
                count[config.ps]++;
                translate_config.name += " " + count[config.ps];
            } else {
                count[config.ps] = 1;
            }
            if (config.net == 'ws') {
                translate_config["ws-opts"] = {
                    path: config.path,
                    headers: {
                        Host: config.host,
                    }
                }
            }
            clash_config.proxies.push(translate_config);
            if (clash_config["proxy-groups"][7].proxies[0] == 'DIRECT') clash_config["proxy-groups"][7].proxies.pop();
            clash_config["proxy-groups"][7].proxies.push(config.ps);

        }
    }
    fs.writeFileSync(process.argv[4] || "output.yml", yaml.dump(clash_config));
    console.log("已生成yml文件" + (process.argv[4] || "output.yml"));
    skip = true;
    process.exit(0);
}

if (process.argv[2] == '-v') {
    const clash_config = yaml.load(fs.readFileSync(process.argv[3]));
    let vmesss = '';
    for (const clash_obj of clash_config.proxies) {
        console.log(clash_obj);
        let vmess_obj = {
            v: 2,
            ps: clash_obj.name,
            add: clash_obj.server,
            port: clash_obj.port,
            id: clash_obj.uuid,
            aid: clash_obj.alterId,
            scy: "auto",
            net: clash_obj.network,
            type: 'none',
            host: clash_obj["ws-opts"] == undefined ? '' : clash_obj["ws-opts"].headers.Host,
            path: clash_obj["ws-opts"] == undefined ? '' : clash_obj["ws-opts"].path,
            tls: clash_obj.tls == true ? 'tls' : '',
            sni: "",
            alpn: ""
        }
        vmesss += "vmess://" + (btoa(utf16to8(JSON.stringify(vmess_obj)))) + '\n';
    } 
    fs.writeFileSync(process.argv[4] || "output.txt", vmesss);
    console.log("已生成txt文件" + (process.argv[4] || "output.txt"));

    http.createServer(function (request, response) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(btoa(vmesss));
    }).listen(8888);
    
    // 终端打印如下信息
    console.log('生成订阅链接 http://localhost:8888/');
    skip = true;
}

if (process.argv[2] == '--version') {
    console.log(JSON.parse(fs.readFileSync("./package.json")).version);
    skip = true;
    process.exit(0);
}

if (!skip) {
    console.log("node app.js [OPTION] [INPUT_FILE] [?OUTPUT_FILE]");
    console.log("[OPTION]:");
    console.log("\t -c\t把[INPUT_FILE]转化为clash配置[OUTPUT_FILE]");
    console.log("\t -v\t把[INPUT_FILE]转化为vmess分享链接[OUTPUT_FILE]");
}
