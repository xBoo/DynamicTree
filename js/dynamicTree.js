var index = index || {

    NodeEndColor: "#DC143C",
    TwoWayEdgeColor: "#9933CC",
    graph: null,
    isShowName: true,
    xspace: 160,

    initNodes: function () {
        var t = this;
        var data = {
            nodes: [{ id: "node1", name: "node1", x: 0, y: 0 }, { id: "node2", name: "node2", x: t.xspace, y: 0 }, { id: "node3", name: "node3", x: -1 * t.xspace, y: 0 }],
            edges: [{ source: "node1", target: "node2" }, { source: "node3", target: "node1" }]
        };
        return data;
    },

    genChildNodes: function genChildNodes(node) { },


    setLable: function (node) {
        var t = this;
        var model = node.getModel();
        var label = node.getLabel();
        label.__cfg.visible = t.isShowName;
        var keyShape = node.getKeyShape();
        var children = node.getChildren();
        var parent = node.getParent();
        var box = keyShape.getBBox();
        var labelBox = label.getBBox();
        var dx = -1 * ((box.maxX - box.minX + labelBox.maxX - labelBox.minX) / 2);
        var dy = 0;

        if (children.length === 0) {
            dx = -dx;
        }
        label.translate(dx, dy);
    },

    setEdgeColor: function setEdgeColor(node) {
        var t = this;
        var existEdges = node.getEdges();
        existEdges.forEach(function (item) {
            var targetEdges = item.target.getEdges();
            for (var i = 0; i < targetEdges.length; i++) {
                if (item.source.id === targetEdges[i].target.id && item.target.id === targetEdges[i].source.id) {
                    if (item.model.color !== t.TwoWayEdgeColor)
                        t.graph.update(item, { color: t.TwoWayEdgeColor });

                    if (targetEdges[i].model.color !== t.TwoWayEdgeColor)
                        t.graph.update(targetEdges[i], { color: t.TwoWayEdgeColor });

                    break;
                }
            }
        });
    },

    initPage: function () {
        var t = this;
        G6.registerEdge("smooth", {
            getPath: function getPath(item) {
                var points = item.getPoints();
                var start = points[0];
                var end = points[points.length - 1];
                var hgap = Math.abs(end.x - start.x);
                if (end.x > start.x) {
                    return [["M", start.x, start.y], ["C", start.x + hgap / 4, start.y, end.x - hgap / 2, end.y, end.x, end.y]];
                }
                return [["M", start.x, start.y], ["C", start.x - hgap / 4, start.y, end.x + hgap / 2, end.y, end.x, end.y]];
            }
        });

        t.graph.node({
            label: function label(model) {
                return {
                    text: model.name,
                    fill: "blue",
                    fontSize: 14,
                    fontFamily: "sans-serif"
                };
            },
            size: 26,
            style: {
                fill: "green",
                stroke: "black",
                cursor: "pointer"
            }
        });

        t.graph.edge({
            style: function style() {
                return {
                    endArrow: true,
                    lineWidth: 1
                };
            },
            shape: "smooth"
        });

        var initData = t.initNodes();
        t.graph.read(initData);
        t.graph.getNodes().forEach(function (node) {
            t.setEdgeColor(node);
        });
        t.graph.getNodes().forEach(function (node) {
            t.setLable(node);
        });
        t.graph.draw();
    },




    addNodes: function (ev, isSource) {
        var t = this;
        if (ev.item.model.style.fill === t.NodeEndColor) return;
        try {
            $("#tree").css('cursor', 'wait');
            //get data from api
            var data = t.genRadomNodes(ev.item, isSource);

            $("#tree").css('cursor', 'default');
            if (data.nodes && data.nodes.length > 0) {
                //add node
                data.nodes.forEach(function (item) {
                    var exist = false;
                    var nodes = t.graph.getNodes();
                    for (var i = 0; i < nodes.length; i++) {
                        if (nodes[i].id === item.id) {
                            exist = true;
                            break;
                        }
                    }

                    if (!exist) {
                        var nd = t.graph.add("node", item);
                        t.setLable(nd);
                    }
                });

                //add edge
                data.edges.forEach(function (edge) {
                    var edges = t.graph.getEdges();
                    var exist = false;
                    for (var i = 0; i < edges.length; i++) {
                        if (edges[i].source.id === edge.source && edges[i].target.id === edge.target) {
                            exist = true;
                            break;
                        }
                    }

                    if (!exist) {
                        var sourceNode = t.graph.find(edge.source);
                        var targetNode = t.graph.find(edge.target);
                        if (sourceNode !== undefined && targetNode != undefined) {
                            t.graph.add("edge", edge);
                        }
                    }
                });

                t.setEdgeColor(ev.item);
                t.graph.draw();
            } else {
                t.graph.update(ev.item, { style: { fill: t.NodeEndColor } });
                t.setLable(ev.item);
            };
        } catch (e) {
            $("#tree").css('cursor', 'default');
        }
    },

    genRadomNodes: function (sourceNode, isSource) {
        var t = this;
        var rnd = parseInt(Math.random() * (8 + 1), 10);
        var nodes = new Array();
        var edges = new Array();
        for (var i = 0; i < rnd; i++) {

            var nodeId = t.guid();
            nodes.push({
                id: nodeId,
                name: "add_node_" + i,
                x: sourceNode.model.x + (isSource ? t.xspace : (-1) * t.xspace),
                y: t.CalculateY(i)
            });

            var towWay = parseInt(Math.random() * (8 + 1), 10) < 3;
            if (isSource) {
                edges.push({ source: sourceNode.id, target: nodeId });
                if (towWay) edges.push({ source: nodeId, target: sourceNode.id });
            }
            else {
                edges.push({ source: nodeId, target: sourceNode.id });
                if (towWay) edges.push({ source: sourceNode.id, target: nodeId });
            }
        }

        return { nodes: nodes, edges: edges };
    },

    CalculateY: function (i) {
        var dy = 0;
        switch (i) {
            case 0:
                dy = 0;
                break;
            case 1:
                dy = 45;
                break;
            default:
                dy = i % 2 == 0 ? i / 2 * 45 * -1 : (i + 1) / 2 * 45;
                break;
        }

        return dy;
    },

    s4: function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    },
    guid: function () {
        var t = this;
        return (t.s4() + t.s4() + "-" + t.s4() + "-" + t.s4() + "-" + t.s4() + "-" + t.s4() + t.s4() + t.s4());
    },

    removeChild: function removeChild(item) {
        var t = this;
        var edges = item.getEdges();

        for (var i = 0; i < edges.length; i++) {
            if (edges[i].source.id === item.id) {

                if (edges[i].target.id !== item.id) {
                    var nd = t.graph.find(edges[i].target.id);

                    var targetEdgesCount = 0;
                    nd.getEdges().forEach(function (item) {
                        if (item.target.id === nd.id) targetEdgesCount++;
                    });

                    var isTowWay = false;
                    var ndEdges = nd.getEdges();
                    for (var j = 0; j < ndEdges.length; j++) {
                        if (ndEdges[j].target.id === item.id) {
                            isTowWay = true;
                            break;
                        }
                    }

                    if (targetEdgesCount === 1 && !isTowWay) {
                        removeChild(nd);
                        t.graph.remove(nd, "node");
                    }
                }
                t.graph.remove(edges[i], "edge");
            }
        }
    },

    bindEvents: function () {
        var t = this;
        t.graph.on("node:dragstart", function (ev) {
            var item = ev.item;
            var model = item.getModel();
            dx = model.x - ev.x;
            dy = model.y - ev.y;
        });

        t.graph.on("node:drag", function (ev) {
            ev.currentItem && t.graph.update(ev.currentItem, {
                x: ev.x + dx,
                y: ev.y + dy
            });
        });

        t.graph.on("dragend", function (ev) {
            t.graph.draw();
        });

        t.graph.on("drag", function (ev) {
            if (ev.currentItem == null) {
                t.graph.translate(ev.domEvent.movementX, ev.domEvent.movementY);
            }
        });

        t.graph.on("afterchange", function () {
            t.graph.draw();
        });

        t.graph.on("node:click", (ev) => {
            if (ev.item != null && ev.item.isNode) {

                var edges = t.graph.getEdges();
                var hasChild = false;
                var hasParent = false;
                for (var i = 0; i < edges.length; i++) {

                    if (edges[i].target.id === ev.item.id) {
                        hasParent = true;
                    }

                    if (edges[i].source.id === ev.item.id) {
                        hasChild = true;
                    }
                }

                if (hasParent && hasChild) {
                    t.removeChild(ev.item);
                } else {

                    if (!hasParent && hasChild)
                        t.addNodes(ev, false);
                    else
                        t.addNodes(ev, true);
                }
            }
        });

        t.graph.on("node:mouseenter", function (ev) {

            var style = $("#tree").css("cursor");
            if (style === "default" || style === "auto") {
                $("#tree").css("cursor", "pointer");
            }
        });

        t.graph.on('node:mouseleave', (ev) => {
            var style = $("#tree").css("cursor");
            if (style === "pointer") {
                $("#tree").css("cursor", "default");
            }
        });

        $("#showLable").on("click", function (sender) {
            t.graph.getNodes().forEach(function (node) {
                var showLable = $("#showLable").prop("checked");
                var label = node.getLabel();
                label.__cfg.visible = showLable;
            });
            t.graph.draw();
        });
    },

    init: function () {
        var t = this;
        t.graph = new G6.Graph({
            container: "tree",
            fitView: "cc",
        });
        t.bindEvents();
        t.initPage();
    }
}.init();