//--------------------------------------
// jc://birdhouse/, (c) Christoph Kloth
//--------------------------------------
// main charts and analysis
//--------------------------------------


/* class to integrate chart into a remote control */
class RemoteChartJS extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.chartJS_loaded = false;
        this.chartJS_URL = 'https://cdn.jsdelivr.net/npm/chart.js';
        this.chartJS_config = {};
        this.chartJS_chart = undefined;
        this.chartJS_defaultColors = ["coral", "cornflowerblue", "cadetblue",
            "crimson", "darkblue", "darkgoldenrod", "darkgreen", "darkmagenta",
            "darkorange", "darksalmon", "darkviolet", "dodgerblue", "firebrick",
            "forestgreen", "goldenrod", "greenyellow", "hotpink", "indigo",
        ];
        this.chartJS_darkColors = ["red", "aquamarine", "chartreuse", "coral", "cadetblue", "crimson", "darkblue", "goldenrod",
            "green", "magenta", "orange", "salmon", "violet", "firebrick", "goldenrod", "Lime", "MediumVioletRed",
            "GreenYellow", "HotPink", "indigo", "yellow", "cyan", "blue", "CornflowerBlue", "DarkCyan", "DarkMagenta",
            "DarkViolet", "DeepPink", "DeepSkyBlue", "DodgerBlue", "ForestGreen", "LightSeaGreen", "Olive", "Purple",
        ];

        this.html_loading = "<span class='center'>&nbsp;<br/>"+lang("CHART_LOADING")+"<br/>&nbsp;<br/>&nbsp;<br/>&nbsp;</span>";
        this.html_no_entries = "<span class='center'>&nbsp;<br/>"+lang("CHART_NO_ENTRIES")+"<br/>&nbsp;<br/>&nbsp;<br/>&nbsp;</span>";
        this.sign_forth = "❯";
        this.sign_back = "❮";
        this.chart_settings = {};

        this.draw = this.draw.bind(this);
        this.load = this.load.bind(this);

        this.load_chartJS();
    }

    /* load ChartJS library */
    load_chartJS() {
        this.logging.info("Loading ChartJS...");

        if (this.chartJS_loaded === false) {
            const chartJS_script = document.createElement('script');
            if (chartJS_script) {
                chartJS_script.async = true;
                chartJS_script.src = this.chartJS_URL;
                chartJS_script.type = 'text/javascript';
                document.body.appendChild(chartJS_script);
                setTimeout(() => {
                    if (typeof Chart === 'function') {
                        this.chartJS_loaded = true;
                        this.logging.warning("Loading ChartJS... done.");
                    } else {
                        this.logging.error("Loading ChartJS... failed.");
                    }
                }, 1000);
            }
        }
    }

    /*
    create container and load chart data

    @param (string) chart_id: unique id for the chart, e.g., name of the scene where it is used
    @param (object) settings: various settings to create the chart, e.g., date (YYYY-MM-DD), filter-values (list of values to be displayed)
    */
    create(chart_id, settings={}) {
        let html = "";
        let wait_time = 10;
        const style = settings["size"] || "default";
        if (!this.chartJS_loaded) { wait_time += 1000; }

        if (!settings && this.chart_settings) { settings = this.chart_settings; }
        if (!settings["date"]) { settings["date"] = "TODAY"; }
        if (!settings["chart-id"]) { settings["chart-id"] = chart_id; }
        if (!settings["filter-values"] && this.chart_settings["filter-values"]) { settings["filter-values"] = this.chart_settings["filter-values"]; }
        if (!settings["filter-values"]) { settings["filter-values"] = rmData.record.recorded_values(); }

        this.chart_settings = settings;

        setTimeout(() => {
            if (!this.chartJS_loaded) {
                this.logging.error([this.name, this.chartJS_loaded, chart_id, settings]);
                setTextById(`chart_${chart_id}`, lang("CHART_ERROR_LOADING_CHART_JS"));
            }
            else {
                appFW.requestAPI("POST", ["chart-data", settings["date"]], settings, this.load);
                //this.load({"DATA": {"chart_id": chart_id}});
            }
        }, wait_time);

        html += `<div id ='chart_${chart_id}' class='rm-chart ${style}'>${this.html_loading}</div>`;
        html += `<div class='rm-chart legend' style='margin-top:0;'><div id ='chart_${chart_id}_legend' class='rm-chart-content legend'>${this.html_loading}</div></div>`;
        return html;
    }

    // draw chart from data returned
    load(data) {

        let chart_id = data["REQUEST"]["ChartID"];
        let chart_data = data["DATA"];
        let chart_html = this.draw(
            chart_data["title"],
            chart_data["labels"],
            chart_data["units"],
            chart_data["data"],
            "line", true, "chart_"+chart_id);
        let chart_available = chart_data["available"].sort();
        let chart_position = chart_data["available"].indexOf(chart_data["title"]);
        let reload_click = this.name+".create(\"" + chart_id + "\");";
        let reload = `&nbsp;&nbsp;<img src='icon/reload-white.png' alt='' onclick='${reload_click}' class='rm-chart-reload'>`;

        let chart_title = chart_data["title"]+reload;
        if (chart_available.length > 1) {
            if (chart_position > 0) {
                let date = chart_available[chart_position - 1];
                let onclick = this.name+".create(\""+chart_id+"\",{\"date\":\""+date+"\"});";
                chart_title += "<div style='float:left' class='rm-chart-nav' onclick='"+onclick+"'>&nbsp;"+this.sign_back+"&nbsp;</div>";
            }
            if (chart_position < chart_available.length-1) {
                let date = chart_available[chart_position + 1];
                let onclick = this.name+".create(\""+chart_id+"\",{\"date\":\""+date+"\"});";
                chart_title += "<div style='float:right' class='rm-chart-nav' onclick='"+onclick+"'>&nbsp;"+this.sign_forth+"&nbsp;</div>";
            }
        }

        chart_html = `<div id ='chart_${chart_id}_title' class='rm-chart-title'></div>&nbsp;<br/>` + chart_html;
        chart_html = `<div class='rm-chart-content'>` + chart_html + `</div>`;

        setTextById(`chart_${chart_id}`, chart_html);
        setTextById(`chart_${chart_id}_title`, chart_title);
    }

    /*
    * render a specific chart, data have to be prepared in the required format
    * see https://www.chartjs.org/docs/latest/samples/line/line.html for details how to create line charts
    *
    * @param (string) label: dataset name for pie charts
    * @param (string) title: title of the chart
    * @param (dict) data: prepared chart data, see documentation of chartjs.org
    * @param (string) type: type of chart, see documentation of chartjs.org
    * @param (boolean) sort_keys: define if keys/labels should be sorted
    * @param (string) id: id of div element
    * @param (object) size: possibility to overwrite size of chart, e.g., {"height": "100px", "width": "90%"}
    */
    draw(label, titles, units, data, type="line", sort_keys=true, id="rmChart", size="", set_colors=[], set_menu="bottom") {

        // https://www.chartjs.org/docs/latest/samples/line/line.html
        // data = { "label1" : [1, 2, 3], "label2" : [1, 2, 3] };

        const getOrCreateLegendList = (chart, id) => {
            const legendContainer = document.getElementById(id);
            let listContainer = legendContainer.querySelector('div');

            if (!listContainer) {
                listContainer = document.createElement('div');
                listContainer.style.display = 'flex';
                listContainer.style.flexDirection = 'row';
                listContainer.style.margin = 0;
                listContainer.style.padding = 0;

                legendContainer.appendChild(listContainer);
            }

            return listContainer;
        };
        const htmlLegendPlugin = {
            id: 'htmlLegend',
            afterUpdate(chart, args, options) {
                const ul = getOrCreateLegendList(chart, options.containerID);

                // Remove old legend items
                while (ul.firstChild) {
                    ul.firstChild.remove();
                }

                // Reuse the built-in legendItems generator
                const items = chart.options.plugins.legend.labels.generateLabels(chart);

                items.forEach(item => {
                    const li = document.createElement('div');
                    li.style.alignItems = 'center';
                    li.style.cursor = 'pointer';
                    li.style.display = 'flex';
                    li.style.flexDirection = 'row';
                    li.style.marginLeft = '10px';

                    li.onclick = () => {
                        const {type} = chart.config;
                        if (type === 'pie' || type === 'doughnut') {
                            // Pie and doughnut charts only have a single dataset and visibility is per item
                            chart.toggleDataVisibility(item.index);
                        } else {
                            chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
                        }
                        chart.update();
                    };

                    // Color box
                    const boxSpan = document.createElement('span');
                    boxSpan.style.background = item.fillStyle;
                    boxSpan.style.borderColor = item.strokeStyle;
                    boxSpan.style.borderWidth = item.lineWidth + 'px';
                    boxSpan.style.display = 'inline-block';
                    boxSpan.style.flexShrink = 0;
                    boxSpan.style.height = '12px';
                    boxSpan.style.marginRight = '10px';
                    boxSpan.style.width = '12px';

                    // Text
                    const textContainer = document.createElement('p');
                    textContainer.style.color = item.fontColor;
                    textContainer.style.margin = 0;
                    textContainer.style.padding = 0;
                    textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

                    const text = document.createTextNode(item.text);
                    textContainer.appendChild(text);

                    li.appendChild(boxSpan);
                    li.appendChild(textContainer);
                    ul.appendChild(li);
                });
            }
        };

        let html = "";
        let canvas_size = {"height": "unset", "width": "unset"};
        let data_keys = Object.keys(data);
        if (sort_keys) { data_keys = data_keys.sort(); }

        if (data === undefined || data === {} || data_keys.length === 0) {
            html += this.html_no_entries;
            return html;
        }
        const data_rows = data[data_keys[0]].length;		// started with only 1 line per chart!
        let data_sets   = [];
        let colors      = [];
        let border_pie;
        let myTitle;

        if (set_colors !== []) {
            colors = set_colors;
            border_pie = "white";
        } else if (appTheme === "dark") {
            colors = this.chartJS_darkColors;
            border_pie = "white";
        } else {
            colors = this.chartJS_defaultColors;
            border_pie = "white";
        }

        if (type === "line") {
            for (let x=0;x<data_rows;x++) {
                let data_var = [];
                for (let i=0;i<data_keys.length;i++) {
                    let key = data_keys[i];
                    data_var.push(data[key][x]);
                }
                if (Array.isArray(titles)) { myTitle = titles[x]; }
                else                       { myTitle = titles; }

                if (Array.isArray(units))  { myTitle += " ["+units[x]+"]"; }
                else                       { myTitle += " ["+units+"]"; }

                data_sets.push({
                    label : (x+1)+": "+myTitle,
                    backgroundColor : colors[x],
                    borderColor : colors[x],
                    borderWidth : 1,
                    pointRadius : 0.5,
                    data : data_var
                });
            }
        }
        else if (type === "pie") {
            data_keys = titles;
            data_sets = [{
                label: label,
                data: data,
                backgroundColor : colors,
                borderColor: border_pie,
                borderWidth: 1,
                hoverOffset: 40
            }];
        }
        else {
            this.logging.error("Doesn't support chart type '" + type + "'.");
        }

        let canvas_style = "";
        Object.keys(size).forEach((key)        => { canvas_size[key] = size[key]; });
        Object.keys(canvas_size).forEach((key) => { canvas_style += key+":"+canvas_size[key]+";"; });
        html += "<div style=\""+canvas_style+"\"><canvas id=\""+id+"_chart\" style=\""+canvas_style+"\">"+this.html_loading+"</canvas></div>\n";


        const chart_labels = data_keys;
        const chart_data   = {
            labels   : chart_labels,
            datasets : data_sets
        };

        setTextById(id+"_legend", "");

        if (this.chartJS_config === undefined) { this.chartJS_config = {}; }
        this.chartJS_config[id] = {
            type : type,
            data : chart_data,
            options : {
                responsive: true,
                plugins: {
                    htmlLegend: {
                        display: true,
                        containerID: id+"_legend",
                    },
                    legend: {
                        display: false,
                        position: set_menu,
                        align: "left",
                        labels : {
                            boxHeight : 12,
                            boxWidth : 12,
                        }
                    }
                }
            },
            plugins: [htmlLegendPlugin],
        };
        if (label !== "") {
            //chartJS_config[id].options.plugins.title = {text: label, display: true}
        }
        setTimeout(() => {
            if (this.chartJS_chart) {
                this.chartJS_chart.destroy();
            }
            this.chartJS_chart = new Chart(document.getElementById(id+"_chart"), this.chartJS_config[id] );
        }, 1000 );
        return html;
    }


}


remote_scripts_loaded += 1;