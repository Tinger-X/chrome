$(document).ready(function () {
    const engineMap = {
        Google: "https://www.google.com/search?ie=UTF-8&q=",
        Baidu: "https://www.baidu.com/s?ie=UTF-8&wd=",
        Bing: "https://cn.bing.com/search?FORM=CHROMN&q=",
        360: "https://www.so.com/s?ie=UTF-8&q=",
        Sogou: "https://www.sogou.com/web?ie=UTF-8&query="
    };
    const block = {width: 112, height: 128};
    const Ajax = {
        get: function (args) {
            args["method"] = "get";
            this.run(args);
        },
        post: function (args) {
            args["method"] = "post";
            this.run(args);
        },
        set: function () {
            let token = $('meta[name=csrf-token]').attr('content');
            $.ajaxSetup({
                beforeSend: function (xhr, settings) {
                    if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRFToken", token);
                    }
                }
            });
        },
        run: function (args) {
            this.set();
            $.ajax(args);
        }
    };
    let _data = {
        user: {
            header: "",
            nick: "",
            wordColor: "",
            wallType: "",
            wallPaper: "",
            wallFilter: "",
            wallColor: "",
            engine: ""
        },
        site: [],
        logged: false
    };
    getData(function (res) {
        if (res["status"]) {
            _data = res;
            setData();
            eventListener();
        } else alert("Error!", false);
    });


    function getData(callback) {
        Ajax.get({
            url: "/getData/",
            success: callback,
            fail: function (err) {
                console.log(err);
                alert("Error", false);
            }
        })
    }

    function setData() {
        if (_data.logged) {  // 差别渲染
            $("#inout").html("注销");
        } else {
            $("#inout").html("登录/注册");
        }

        // 无差别渲染
        $("#avatar").attr("src", _data.user.header);  // header
        $("#nick").html(_data.user.nick).css("color", _data.user.wordColor);  // nick
        if (_data.user.wallType) $("#body").css({  // background
            "backgroundColor": "none",
            "backgroundImage": "url(" + _data.user.wallPaper + ")",
            "backdropFilter": "blur(" + _data.user.wallFilter + "px)"
        });
        else $("#body").css({
            "backgroundImage": "none",
            "backgroundColor": _data.user.wallColor,
            "backdropFilter": "blur(" + _data.user.wallFilter + "px)"
        });
        engineChange();
        let ens = _data.user.engine.split(', ');  // engine
        $("#select").attr({
            src: "/static/img/icon/" + ens[0] + ".png",
            alt: ens[0],
            title: ens[0]
        });
        $("#content>img").each(function (i) {
            $(this).attr({
                src: "/static/img/icon/" + ens[i + 1] + ".png",
                alt: ens[i + 1],
                title: ens[i + 1]
            });
        });
        showSites(_data.site);
    }

    function showSites(sites) {
        let box = $("#box");
        let len = sites.length + (_data.logged ? 1 : 0);
        let width = Math.ceil(len / Math.ceil(len / 10)) * block.width;  // width = ceil(len/行数) * w
        box.css("width", width + "px").html("");
        for (let i = 0; i < len; i++) {
            if (i === len - 1 && _data.logged) {
                box.append($("<div class='nav'><add><img src='/static/img/icon/add.png' alt='add'><p>+添加+</p></add></div>"));
            } else {
                let str = "<div class='nav' ind='" + i + "' id='" + sites[i].id + "'>"
                    + "<dot title='修改'>···</dot>"
                    + "<div class='link'>"
                    + "<img src='" + sites[i].icon + "' alt='icon'>"
                    + "<p>" + sites[i].name + "</p>"
                    + "</div>"
                    + "</div>";
                box.append($(str));
            }
        }

        // re-listen: link hover and click:
        $("div.link").hover(function () {
            $(this).css({backgroundColor: "rgba(255, 255, 255, 0.2)"}).prev().css({display: "block"});
        }, function () {
            $(this).css({backgroundColor: "transparent"}).prev().css({display: "none"});
        }).click(function () {
            linkClicked($(this).parent().attr("ind"), $(this).parent().attr("id"));
        });
        // dot hover and click:
        $("dot").hover(function () {
            $(this).css({
                color: "red",
                display: "block"
            }).next().css({backgroundColor: "rgba(255, 255, 255, 0.2)"});
        }, function () {
            $(this).css({
                color: "black",
                display: "none"
            }).next().css({backgroundColor: "transparent"});
        }).click(function () {
            let ind = $(this).parent().attr("ind");
            if (_data.logged) siteModify(ind);
            else alert("Please login first!", false);
        });
        // add hover and click:
        $("add").hover(function () {
            $(this).css({backgroundColor: "rgba(255, 255, 255, 0.2)"});
        }, function () {
            $(this).css({backgroundColor: "transparent"});
        }).click(siteAdd);
    }

    function linkClicked(ind, _id) {
        Ajax.post({
            url: "/siteClick/",
            data: {id: _id},
            success: function (res) {
                if (res.status) console.log("res");
                else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
            },
            fail: function (err) {
                console.log(err);
                alert("Error", false);
            }
        });
        window.location.href = _data.site[ind].site;
    }

    function updateSite(attrs) {
        // attrs => a changed site obj
        let out = $(document.getElementById(attrs.id)).children("div.link");
        out.children("img").attr({src: attrs.icon});
        out.children("p").html(attrs.name);
        Ajax.post({
            url: "/updateSite/",
            data: {
                id: attrs.id,
                name: attrs.name,
                icon: attrs.icon,
                site: attrs.site
            },
            success: function (res) {
                if (res.status) console.log("res");
                else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
            },
            fail: function (err) {
                console.log(err);
                alert("Error", false);
            }
        });
    }

    function siteModify(num) {
        maskChange();
        let the = _data.site[num];
        let str = "<div id='formBox'><img src='/static/img/icon/close.png' alt='close'><h2>添加</h2><form id='mod-form'>" +
            "<div class='input-box'><input type='text' value='" + the.site + "' maxlength='1010' id='mod-url' required><label>网址</label></div>" +
            "<div class='input-box'><input type='text' value='" + the.name + "' maxlength='32' id='mod-name' required><label>名称</label></div>" +
            "<div class='input-box'><input type='text' value='" + the.icon + "' maxlength='1024' id='mod-icon' required><label>icon</label></div>" +
            "<div class='icon-box'><img id='icon-res' src='" + the.icon + "' alt='icon'><div id='icons'></div></div>" +
            "<div class='btn-box'><div class='false'>删除</div><div class='true'><span>修改</span></div></div>" +
            "</form></div>";
        $("#mask").append($(str));
        // 添加静态icon及点击事件
        for (let i = 0; i < 10; i++) {
            let one = "<img src='/static/img/sites/icon" + i + ".png' alt='" + i + "'>";
            $("#icons").append($(one));
        }
        $("#icons>img").click(function () {
            let src = $(this).attr("src");
            $("#icon-res").attr("src", src);
            $("#mod-icon").val(src);
        });
        // 输入icon地址结束
        $("#mod-icon").blur(function () {
            let src = $(this).val();
            $("#icon-res").attr("src", src);
        });
        // 按钮事件
        $("#formBox>img").click(function () {
            $("#mod-url, #mod-name, #mod-icon").val("");
            $("#formBox").remove();
            maskChange(false);
        });
        $("#mod-form div.false").click(function () {
            Ajax.post({
                url: "/deleteSite/",
                data: {id: the.id},
                success: function (res) {
                    if (res.status) {
                        let list = [];
                        for (let i = 0; i < _data.site.length; i++) if (_data.site[i].id !== the.id) list.push(_data.site[i]);
                        _data.site = list;
                        showSites(list);
                        $("#mod-url, #mod-name, #mod-icon").val("");
                        $("#formBox").remove();
                        maskChange(false);
                    } else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
                },
                fail: function (err) {
                    console.log(err);
                    alert("Error", false);
                }
            });
        });
        $("#mod-form div.true").click(function () {
            let nam = $("#mod-name");
            let url = $("#mod-url");
            let ico = $("#mod-icon");
            let jdg = isURL(url.val());
            let can = true;

            // update data
            the.name = nam.val();
            the.site = jdg.str;
            the.icon = ico.val();
            if (!the.name) {
                redTip(nam);
                can = false;
            }
            if (!jdg.judge) {
                redTip(url);
                can = false;
            }
            if (!the.icon) {
                redTip(ico);
                can = false;
            }
            if (can) {
                updateSite(the);
                $("#mod-url, #mod-name, #mod-icon").val("");
                $("#formBox").remove();
                maskChange(false);
            }
        });
    }

    function siteAdd() {
        maskChange();
        let str = "<div id='formBox'><h2>添加</h2><form id='add-form'>" +
            "<div class='input-box'><input type='text' maxlength='1010' id='add-url' required><label>网址</label></div>" +
            "<div class='input-box'><input type='text' maxlength='32' id='add-name' required><label>名称</label></div>" +
            "<div class='btn-box'><div class='false'>取消</div><div class='true'><span>添加</span></div></div>" +
            "</form></div>";
        $("#mask").append($(str));
        $("#add-form div.false").click(function () {
            $("#add-url, #add-name").val("");
            $("#formBox").remove();
            maskChange(false);
        });
        $("#add-form div.true").click(function () {
            let url = $("#add-url");
            let nam = $("#add-name");
            let jud = isURL(url.val());
            if (jud.judge) {
                let pra = {
                    user: _data.user.id,
                    passwd: _data.user.passwd,
                    site: jud.str,
                    name: nam.val()
                };
                let can = true;
                if (!pra.name) {
                    redTip(nam);
                    can = false;
                }
                for (let i = 0; i < _data.site.length; i++) {
                    if (pra.site === _data.site[i].site) {
                        redTip(url);
                        can = false;
                        alert("网址重复", false);
                    }
                }
                if (can) {
                    Ajax.post({
                        url: "/addSite/",
                        data: pra,
                        success: function (res) {
                            if (res.status) {
                                _data.site.push(res.data);
                                reloadPage(_data);
                                $("#add-url, #add-name").val("");
                                $("#formBox").remove();
                                maskChange(false);
                            } else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
                        },
                        fail: function (err) {
                            console.log(err);
                            alert("Error", false);
                        }
                    });
                }
            } else {
                redTip(url);
                alert("似乎不是一个网址", false);
            }
        });
    }

    function reloadPage(data) {
        _data = data;
        // console.log(_data);
        setData();
    }

    function engineChange(num = 0) {
        let old = _data.user.engine.split((", "));
        let show = old[0];
        old[0] = old[num];
        old[num] = show;
        let txt = "在" + old[0] + "上搜索，或输入网址。[回车结束]";
        $("#input").attr("placeholder", txt);
        if (num) updateUser({engine: old.join(", ")});
    }

    function updateUser(attrs) {
        const keys = Object.keys(attrs);
        for (let key of keys) _data.user[key] = attrs[key];
        if (_data.logged) {
            Ajax.post({
                url: "/updateUser/",
                data: attrs,
                success: function (res) {
                    if (res.status) reloadPage(_data);
                    else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
                },
                fail: function (err) {
                    console.log(err);
                    alert("Error", false);
                }
            });
        }
    }

    function userLogin() {
        maskChange();
        let str = "<div id='formBox'><h2>登录</h2><div class='form-selector'><p id='to-login' class='form-this'>登录</p>" +
            "<p id='to-sin'>注册</p></div><form id='login-form'>" +
            "<div class='input-box'><input type='text' maxlength='32' id='login-account' required><label>账号</label></div>" +
            "<div class='input-box'><input type='password' maxlength='32' id='login-passwd' required><label>密码</label></div>" +
            "<div class='btn-box'><div class='false'>取消</div><div class='true'><span>登录</span></div></div>" +
            "</form></div>";
        $("#mask").append($(str));
        atLogin();
        $("#to-login").click(function () {
            let the = $(this);
            if (!the.hasClass("form-this")) {
                $("#to-sin").removeClass("form-this");
                $("#sin-form").remove();
                let form = "<form id='login-form'>" +
                    "<div class='input-box'><input type='text' maxlength='32' id='login-account' required><label>账号</label></div>" +
                    "<div class='input-box'><input type='password' maxlength='32' id='login-passwd' required><label>密码</label></div>" +
                    "<div class='btn-box'><div class='false'>取消</div><div class='true'><span>登录</span></div></div>" +
                    "</form>";
                $("#formBox>h2").html("登录");
                the.addClass("form-this");
                $("#formBox").append($(form));
                atLogin();
            }
        });
        $("#to-sin").click(function () {
            let the = $(this);
            if (!the.hasClass("form-this")) {
                $("#to-login").removeClass("form-this");
                $("#login-form").remove();

                let form = "<form id='sin-form'>" +
                    "<div class='input-box'><input type='text' maxlength='64' id='sin-account' required><label>账号</label></div>" +
                    "<div class='input-box'><input type='text' maxlength='64' id='sin-nick' required><label>昵称</label></div>" +
                    "<div class='input-box'><input type='password' maxlength='64' id='sin-passwd' required><label>密码</label></div>" +
                    "<div class='input-box'><input type='password' maxlength='64' id='sin-repeat' required><label>确认密码</label></div>" +
                    "<div id='sin-verify'></div>" +
                    "<div class='btn-box'><div class='false'>取消</div><div class='true'><span>注册</span></div></div>" +
                    "</form>";
                $("#formBox>h2").html("注册");
                the.addClass("form-this");
                $("#formBox").append($(form));
                atSin();
            }
        });
    }

    function atLogin() {
        $("#login-form div.false").click(function () {
            $("#login-account, #login-passwd").val("");
            $("#formBox").remove();
            maskChange(false);
        });
        $("#login-form div.true").click(function () {
            let acc = $("#login-account");
            let pwd = $("#login-passwd");
            let pra = {
                account: acc.val(),
                passwd: pwd.val()
            };
            let can = true;
            if (!pra.account) {
                redTip(acc);
                can = false;
            }
            if (!pra.passwd) {
                redTip(pwd);
                can = false;
            }
            if (can) {
                Ajax.post({
                    url: "/login/",
                    data: pra,
                    success: function (res) {
                        if (res.status) {
                            reloadPage(res);
                            $("#login-account, #login-passwd").val("");
                            $("#formBox").remove();
                            maskChange(false);
                        } else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
                    },
                    fail: function (err) {
                        alert("Error", false);
                        console.log(err);
                    }
                });
            }
        });
    }

    function atSin() {
        $("#sin-form div.false").click(function () {
            $("#sin-account, #sin-nick, #sin-passwd, #sin-repeat").val("");
            $("#formBox").remove();
            maskChange(false);
        });
        $("#sin-repeat").blur(function () {
            let rep = $(this);
            let pwd = $("#sin-passwd");
            if (rep.val() !== pwd.val()) {
                redTip(rep);
                alert("两次密码不一样", false);
            }
        });
        let very = $("#sin-verify")
        if (very.is(":empty")) {
            very.slideVerify({
                type: 1, //类型
                vOffset: 5, //误差量，根据需求自行调整
                barSize: {
                    width: "100%",
                    height: "40px",
                },
                status: false,
                ready: function () {
                    let that = this;
                    $("#sin-form div.true").click(function () {
                        if (!that.status) alert("请先完成验证", false);
                    });
                },
                success: function () {
                    this.status = true;
                    $("#sin-form div.true").click(function () {
                        let acc = $("#sin-account");
                        let nik = $("#sin-nick");
                        let pwd = $("#sin-passwd");
                        let rpt = $("#sin-repeat");
                        let pra = {
                            account: acc.val(),
                            nick: nik.val(),
                            passwd: pwd.val(),
                            repeat: rpt.val()
                        };
                        let can = true;
                        if (!pra.account) {
                            redTip(acc);
                            can = false;
                        }
                        if (!pra.nick) {
                            redTip(nik);
                            can = false;
                        }
                        if (!pra.passwd) {
                            redTip(pwd);
                            can = false;
                        }
                        if (!rpt.val()) {
                            redTip(rpt);
                            can = false;
                        }
                        if (rpt.val() !== pwd.val()) {
                            redTip(rpt);
                            alert("两次密码不一样", false);
                            can = false;
                        }

                        if (can) {
                            Ajax.post({
                                url: "/newUser/",
                                data: pra,
                                success: function (res) {
                                    if (res.status) {
                                        reloadPage(res);
                                        $("#sin-account, #sin-nick, #sin-passwd, #sin-repeat").val("");
                                        $("#formBox").remove();
                                        maskChange(false);
                                    } else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
                                },
                                fail: function (err) {
                                    alert("Error", false);
                                    console.log(err);
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    function userLogout() {
        Ajax.get({
            url: "/logout/",
            success: function (res) {
                if (res.status) reloadPage(res)
                else for (let i = 0; i < res["msgs"].length; i++) alert(res["msgs"][i], false);
            },
            fail: function (err) {
                alert("Error", false);
                console.log(err);
            }
        });
    }

    function pageDiy() {
        maskChange();
        let str = "<div id='diyBox'><h2>页面自定义</h2><div class='filter-line'>" +
            "<txt>模糊度</txt><input id='blur' type='range' value='" + _data.user.wallFilter + "' min='0' max='3' step='1'>" +
            "<txt>" + _data.user.wallFilter + "</txt></div><div class='colorInputBox'>" +
            "<div class='input-box'><input id='w-color' type='text' value='" + _data.user.wordColor + "' maxlength='128' required><label>字体颜色</label></div>" +
            "<div id='wc-res'></div></div><div class='form-selector'><p id='b-img'>背景图</p><p id='b-color'>背景色</p></div><div id='backBox'></div>" +
            "<div class='btn-box'><div class='false'>取消</div><div class='true'><span>修改</span></div></div></div>";
        $("#mask").append($(str));

        $("#wc-res").css({backgroundColor: _data.user.wordColor}).click(function () {
            colorSelect(function (res) {
                res = obj2rgb(res);
                $("#w-color").val(res);
                $("#wc-res").css({backgroundColor: res});
            }, rgb2obj(_data.user.wordColor));
        });
        $("#w-color").blur(function () {
            let c = $(this).val();
            $("#wc-res").css({backgroundColor: c});
        });
        $("#blur").change(function () {
            let v = $(this).val();
            $(this).next("txt").html(v);
        });
        $("#b-img").click(function () {
            if (!$(this).hasClass("form-this")) atBackImg();
        });
        $("#b-color").click(function () {
            if (!$(this).hasClass("form-this")) atBackColor();
        });
        if (_data.user.wallType) atBackImg();
        else atBackColor();

        $("#diyBox div.false").click(function () {
            $("#diyBox").remove();
            maskChange(false);
        });
        $("#diyBox div.true").click(function () {
            let pra = {
                wallFilter: $("#blur").val(),
                wordColor: $("#w-color").val(),
                wallType: $("#b-img").hasClass("form-this"),
            };
            if (pra.wallType) pra.wallPaper = $("#img-url").val();
            else pra.wallColor = $("#backColor").val();
            updateUser(pra);
            $("#diyBox").remove();
            maskChange(false);
        });
    }

    function atBackImg() {
        $("#b-color").removeClass("form-this");
        $("#b-img").addClass("form-this");
        let str = "<div class='input-box'><input id='img-url' type='text' value='" + _data.user.wallPaper + "' required><label>URL</label></div>" +
            "<img id='img-res' src='" + _data.user.wallPaper + "' alt='wallpaper'><div id='backImgBox'></div>";
        $("#backBox").empty().append($(str));

        // 添加static图像
        for (let i = 0; i < 10; i++) {
            let one = "<img src='http://static.tinger.host/image/chrome/paper/" + i + ".png' alt='" + i + "'>";
            $("#backImgBox").append($(one));
        }
        $("#img-url").blur(function () {
            let u = $(this).val();
            $("#img-res").attr({src: u});
        });
        $("#backImgBox>img").click(function () {
            let u = "http://static.tinger.host/image/chrome/paper/" + $(this).attr("alt") + ".png";
            $("#img-url").val(u);
            $("#img-res").attr({src: u});
        });
    }

    function atBackColor() {
        $("#b-img").removeClass("form-this");
        $("#b-color").addClass("form-this");
        let str = "<div class='colorInputBox'><div class='input-box'><input id='backColor' type='text' maxlength='128' value='" + _data.user.wallColor + "' required>" +
            "<label>背景色</label></div><div id='bc-res'></div></div>";
        $("#backBox").empty().append($(str));

        $("#backColor").blur(function () {
            let c = $(this).val();
            $("#bc-res").css({backgroundColor: c});
        });
        $("#bc-res").css({backgroundColor: _data.user.wallColor}).click(function () {
            colorSelect(function (res) {
                res = obj2rgb(res);
                $("#backColor").val(res);
                $("#bc-res").css({backgroundColor: res});
            }, rgb2obj(_data.user.wallColor));
        });
    }

    function obj2rgb(obj = {r: 0, g: 0, b: 0, a: 1}) {
        return "rgba(" + obj.r + ", " + obj.g + ", " + obj.b + ", " + obj.a + ")";
    }

    function rgb2obj(str) {
        let lis = str.split(", ");
        return {
            r: lis[0].split("(")[1],
            g: lis[1],
            b: lis[2],
            a: lis[3].split(")")[0]
        }
    }

    function colorSelect(callback, color = {r: 100, g: 100, b: 100, a: 1}) {
        maskChange();

        function colorFix(obj = {r: 0, g: 0, b: 0, a: 1}) {
            return "rgb(" + (255 - obj.r) + ", " + (255 - obj.g) + ", " + (255 - obj.b) + ")";
        }

        let rgb = obj2rgb(color);
        let wgb = colorFix(color);
        let str = "<div id='colorBox'><h3>调色板</h3>" +
            "<cline><input type='range' id='cr' min='0' step='1' max='255' value='" + color.r + "' /><cval>" + color.r + "</cval></cline>" +
            "<cline><input type='range' id='cg' min='0' step='1' max='255' value='" + color.g + "' /><cval>" + color.g + "</cval></cline>" +
            "<cline><input type='range' id='cb' min='0' step='1' max='255' value='" + color.b + "' /><cval>" + color.b + "</cval></cline>" +
            "<cline><input type='range' id='ca' min='0' step='0.01' max='1' value='" + color.a + "' /><cval>" + color.a + "</cval></cline>" +
            "<cres></cres><div class='btn-box'><div class='false'>取消</div><div class='true'><span>确认</span></div></div></div>";
        $("#mask").append($(str));
        $("cres").css({backgroundColor: rgb, color: wgb}).html(rgb);
        $("#cr, #cg, #cb, #ca").change(function () {
            let k = $(this).attr("id")[1];
            let v = $(this).val();
            $(this).next("cval").html(v);
            color[k] = v;
            let nc = obj2rgb(color);
            let wc = colorFix(color);
            $("cres").css({backgroundColor: nc, color: wc}).html(nc);
        });
        $("#colorBox div.false").click(function () {
            $("#cr, #cg, #cb, #ca").val("");
            $("#colorBox").remove();
            maskChange(false);
        });
        $("#colorBox div.true").click(function () {
            $("#cr, #cg, #cb, #ca").val("");
            $("#colorBox").remove();
            callback(color);
            maskChange(false);
        });

        // 拖动
        let dragging = false;
        let pra = {};
        $("#colorBox").mousedown(function (env) {
            pra.X = env.pageX - $(this).offset().left;
            pra.Y = env.pageY - $(this).offset().top;
            dragging = pra.Y < 40 && pra.Y > 0;
        }).mouseup(function () {
            dragging = false;
        }).mousemove(function (env) {
            if (dragging)
                $(this).css({top: env.pageY - pra.Y + "px", left: env.pageX - pra.X + "px"});
        });
    }

    function modifyUser() {
        maskChange();
        let str = "<div id='userForm'><h2>个人信息修改</h2>" +
            "<div class='input-box'><input type='text' maxlength='32' id='user-nick' value='" + _data.user.nick + "' required><label>昵称</label></div>" +
            "<div class='input-box'><input type='text' id='user-avatar' value='" + _data.user.header + "' required><label>头像</label></div>" +
            "<img id='h-res' src='" + _data.user.header + "' alt='avatar'><div id='h-box'></div>" +
            "<div class='btn-box'><div class='false'>取消</div><div class='true'><span>修改</span></div></div></div>";
        $("#mask").append($(str));

        for (let i = 0; i < 10; i++) {
            let one = "<img src='http://static.tinger.host/image/chrome/avatar/" + i + ".jpg' alt='" + i + "'>";
            $("#h-box").append($(one));
        }
        $("#user-avatar").blur(function () {
            let u = $(this).val();
            $("#h-res").attr({src: u});
        });
        $("#h-box>img").click(function () {
            let u = "http://static.tinger.host/image/chrome/avatar/" + $(this).attr("alt") + ".jpg";
            $("#user-avatar").val(u);
            $("#h-res").attr({src: u});
        });

        $("#userForm div.false").click(function () {
            $("#userForm").remove();
            maskChange(false);
        });
        $("#userForm div.true").click(function () {
            updateUser({
                nick: $("#user-nick").val(),
                header: $("#user-avatar").val()
            });
            $("#userForm").remove();
            maskChange(false);
        });
    }

    function eventListener() {
        // 差别监听：
        // diy page:
        $("#diy").click(function () {
            if (_data.logged) pageDiy();
            else alert("Please login first!", false);
        });

        // self info:
        $("#update").click(function () {
            if (_data.logged) modifyUser();
            else alert("Please login first!", false);
        });

        //login / logout:
        $("#inout").click(() => {
            if (_data.logged) {
                userLogout();
            } else {
                userLogin();
            }
        });

        // 无差别监听：
        // mouse hover user icon:
        $("#user").hover(function () {
            let menu = $("#menu");
            if (!menu.is(":animated")) {
                menu.animate({marginTop: "5px", opacity: 1}, 300);
            }
        }, function () {
            $("#menu").animate({marginTop: "-45px", opacity: 0}, 300);
        });

        // engine select:
        let selected = document.getElementById("select");
        let ls = document.getElementById("content").getElementsByTagName("img");
        for (let i = 0; i < 4; i++) {
            ls[i]["order"] = i + 1;
            ls[i].onclick = function () {
                let cho = {
                    src: this.src,
                    alt: this.alt,
                    title: this.title
                };
                this.src = selected.src;
                this.alt = selected.alt;
                this.title = selected.title;
                selected.src = cho.src;
                selected.alt = cho.alt;
                selected.title = cho.title;
                engineChange(this["order"]);
            }
        }

        // input and search:
        $(document).keydown((even) => {
            if (even.which === 13) {
                let content = $("#input").val();
                if (content) {
                    let strUrl = isURL(content);
                    if (strUrl.judge) {
                        window.location = strUrl.str;
                    } else {
                        let eng = engineMap[_data.user.engine.split((", "))[0]];
                        window.location = eng + content;
                    }
                }
            } else if ($("#mask").is(":empty")) {
                $("#input").focus();
            }
        });
    }

    function isURL(str_url) {
        let strRegex = "^((https|http)://)?"  // 开头- http(s)://
            + "(([0-9]{1,3}\\.){3}[0-9]{1,3}" // IP- 199.194.52.184
            + "|(([0-9A-Za-z-\\._*@\u4e00-\u9fa5]+\\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\\.[a-z]{2,6}))" // domain- third.second.host
            + "(:[0-9]{1,6})?" // 端口- :80
            + "((/?)|(/[^ ]+)+/?)$";  // 路由- 拒绝空格
        let re = new RegExp(strRegex);
        if (re.test(str_url)) {
            let url = str_url.slice(0, 4) === "http" ? str_url : "http://" + str_url;
            return {
                judge: true,
                str: url
            };
        }
        return {
            judge: false,
            str: str_url
        };
    }

    function alert(msg, type = true) {
        alertChange();
        let box = $("#alertBox");
        let alt = $("<div class='alert'><p>" + msg + "</p><img src='/static/img/icon/close.png' alt='close'></div>");
        box.prepend(alt);
        let self = setTimeout(function () {
            alt.remove();
            alertChange(false);
        }, 1000);
        if (type) alt.css({backgroundColor: "rgba(128, 128, 128, 0.8)"});
        else {
            clearTimeout(self);
            alt.css({backgroundColor: "rgba(255, 0, 0, 0.8)"});
        }
        $(".alert>img").click(function () {
            self && clearTimeout(self);
            $(this).parent().remove();
            alertChange(false);
        });
    }

    function redTip(node, time = 1000) {
        let bord = node.css("border");
        node.css({border: "1px solid red"});
        setTimeout(function () {
            node.css({border: bord});
        }, time);
    }

    function alertChange(type = true) {
        let box = $("#alertBox");
        if (box.length === 0 && type) {
            maskChange();
            $("#mask").append($("<div id='alertBox'></div>"));
        } else if (box.is(":empty") && !type) {
            box.remove();
            maskChange(false);
        }
    }

    function maskChange(type = true) {
        let mask = $("#mask");
        if (type && mask.is(":empty")) mask.css({display: "flex"});
        if ((!type) && mask.is(":empty")) mask.css({display: "none"});
    }
});