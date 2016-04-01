$(document).ready(function(){
    var prefix = $(".prefix");
    var root = $(".root");
    var suffix = $(".suffix");

    var ending = $(".ending");
    var partOfTheWord = root.add(suffix).add(prefix).add(ending);
    var em = $("#jsEm");
    var emWidth = em.width();
    timeout = 100;

    var decorationColor = "#999";

    partOfTheWord.css({
        "margin": "0 1px"
    });

    function check() {
        var emWidthNew = $("#jsEm").width();

        if (emWidth != emWidthNew) {
            drawDraw();
            emWidth = emWidthNew;
        }

        setTimeout(check, timeout);
    }
    
    check();

    function drawDraw() {
        $(".jsPartOfTheWordDecoration").remove();

        for (i = 0; i < partOfTheWord.size(); i++) {
            var partOfTheWordWidth = partOfTheWord.eq(i).width();
            var partOfTheWordHeight = partOfTheWord.eq(i).height();
            var partOfTheWordLeft = partOfTheWord.eq(i).offset().left;
            var partOfTheWordTop = partOfTheWord.eq(i).offset().top;
           
            var partOfTheWordDecoration = $("<span class='jsPartOfTheWordDecoration'></span>");
            var info = [];
            partOfTheWord.eq(i).after(partOfTheWordDecoration);


            if (partOfTheWord.eq(i).hasClass("prefix")) {
                partOfTheWordDecoration.css({
                    "position": "absolute",
                    "width": partOfTheWordWidth + 2 + "px",
                    "height": (partOfTheWordHeight / 2) + "px",
                    "margin-left": - partOfTheWordWidth - 2 + "px",
                    "margin-top": "1px",
                    "font-size": "0"
                });
                partOfTheWordDecoration.canvas();
                partOfTheWordDecoration.canvasinfo(info);
                partOfTheWordDecoration.polygon(
                    [0, 0],
                    [
                        ["lineTo", [info[0].width, 0]],
                        ["lineTo", [info[0].width, info[0].height]]
                    ],
                    {
                        "fill": false,
                        "stroke": true,
                        "close": false
                    },
                    {
                        "strokeStyle": decorationColor,
                        "lineWidth": 1
                    }
                );
            }

            if (partOfTheWord.eq(i).hasClass("root")) {
                partOfTheWordDecoration.css({
                    "position": "absolute",
                    "width": partOfTheWordWidth + 2 + "px",
                    "height": (partOfTheWordHeight / 1.5) + "px",
                    "margin-left": - partOfTheWordWidth - 2 + "px",
                    "margin-top": - (partOfTheWordHeight / 3) + "px",
                    "font-size": "0"
                });
                partOfTheWordDecoration.canvas();
                partOfTheWordDecoration.canvasinfo(info);
                partOfTheWordDecoration.polygon(
                    [0, info[0].height],
                    [
                        ["quadraticCurveTo", [info[0].width / 2, 0], [info[0].width, info[0].height]]
                    ],
                    {
                        "fill": false,
                        "stroke": true,
                        "close": false
                    },
                    {
                        "strokeStyle": decorationColor,
                        "lineWidth": 0.5
                    }
                );
            }

            if (partOfTheWord.eq(i).hasClass("suffix")) {
                partOfTheWordDecoration.css({
                    "position": "absolute",
                    "width": partOfTheWordWidth + 2 + "px",
                    "height": (partOfTheWordHeight / 2) + "px",
                    "margin-left": - partOfTheWordWidth - 2 + "px",
                    "margin-top": - (partOfTheWordHeight / 5) + "px",
                    "font-size": "0"
                });
                partOfTheWordDecoration.canvas();
                partOfTheWordDecoration.canvasinfo(info);
                partOfTheWordDecoration.polygon(
                    [0, info[0].height],
                    [
                        ["lineTo", [info[0].width / 2, 1]],
                        ["lineTo", [info[0].width, info[0].height]]
                    ],
                    {
                        "fill": false,
                        "stroke": true,
                        "close": false
                    },
                    {
                        "strokeStyle": decorationColor,
                        "lineWidth": 0.5
                    }
                );
            }

            /*
            if (partOfTheWord.eq(i).hasClass("ending")) {
                partOfTheWordDecoration.css({
                    "position": "absolute",
                    "width": partOfTheWordWidth + 2 + "px",
                    "height": partOfTheWordHeight + 1 + "px",
                    "margin-left": - partOfTheWordWidth - 2 + "px",
                    "margin-top": "1px",
                    "font-size": "0"
                });
                partOfTheWordDecoration.canvas();
                partOfTheWordDecoration.canvasinfo(info);
                partOfTheWordDecoration.polygon(
                    [0, 0],
                    [
                        ["lineTo", [info[0].width, 0]],
                        ["lineTo", [info[0].width, info[0].height]],
                        ["lineTo", [0, info[0].height]],
                        ["lineTo", [0, 0]]
                    ],
                    {
                        "fill": false,
                        "stroke": true,
                        "close": false
                    },
                    {
                        "strokeStyle": decorationColor,
                        "lineWidth": 1
                    }
                );
            }
            */
        }
    }

    drawDraw();
});