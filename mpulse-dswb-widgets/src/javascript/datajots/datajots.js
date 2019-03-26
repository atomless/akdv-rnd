;((window, document, $, d3, Stats, akdv, utils_env, utils_datajots_pointcloud) => {

    'use strict';

    const gpu_simulation = false;

    const config = Object.seal({
        stage_section_el_template : '',
        axis_x_bottom_svg : '',
        axis_x_bottom_svg_g : '',
        axis_y_left_svg : '',
        axis_y_left_svg_g : '',
        stages_d3_scales_array : [],
        data_uri : `${location.protocol}//${location.hostname}${((location.port)? ':' + location.port : '')}/${window.akdv.version}/data/datajots/`,
        stages_schema_path_and_filename : 'stages.schema.json',
        stages_json_filename : 'stages.json',
        resize_throttle_delay: 200,
        resize_throttle_timer: null,
        data_types_for_linear_scales : ['number', 'integer'],
        data_types_for_color_scales : ['color'],
        stages_json : false,
        data_json_schema : false,
        stagesJSONSchemaValidator : false, // overwritten once schema loaded and validator instantiated
        dataJSONSchemaValidator : false, // overwritten once schema loaded and validator instantiated
        stage_scroller: false,
        stage_scroller_selector: '#datajots-stages-scroller',
        chart_container_selector : '#datajots-chart-container',
        axis_x_bottom_container_selector : '#datajots-axis-x-container',
        axis_y_left_container_selector : '#datajots-axis-y-container',
        current_stage_element : false,
        stages_d3_force_simulation : null,
        stages_d3_force_simulation_running: false,
        non_simulation_dimension_types_array : ['radius', 'color', 'alpha'],
        axis_bandwidth_min_rems : 1.5,
        axis_bandwidth_padding_rems : 0.025,
        chart_padding_x_percent : 0.25,
        chart_padding_y_percent : 0.25,
        axis_x_bottom_y : 0,
        axis_y_left_x : 0,
        nodes_array : [],
        chart_canvas : false,
        chart_canvas_height : 0,
        chart_canvas_container_el : false,
        chart_canvas_axis_x_scroll_el : false,
        chart_canvas_axis_y_scroll_el : false,
        chart_canvas_renderer : false,
        chart_canvas_2d_context : false,
        chart_width : 0,
        chart_height : 0,
        chart_center_x : 0,
        chart_center_y : 0,
        max_data_nodes : 3500,
        node_defaults : {
            color : false,
            radius : 0.15,
            min_radius : 0.15,
            max_radius : 4
        },
        typed_array_store: null,
        gpu_simulation
    });


    const stats = new Stats();

    window.datajots = {


        // LOADING //

        async init() {

            let params = utils_env.getQueryParams();

            window._log.outputCopyrightAndVersionInfoToLog(window.akdv.meta);

            window.akdv.utils_css.init();
            window.akdv.themes.init(params);
            window.akdv.statusNotifier.init();
            window.akdv.storage.init();
            window.akdv.postMessageAPI.init();
            window.akdv.addEventListeners();

            if(!params.name || !window.akdv.validate.nameParam(params.name)) {
                throw 'The name of this data jot must be defined as "name=" in the URL query params and this must match the directory in the data path.';
            }

            if(params.stats) {
                document.body.appendChild( stats.dom );
            }

            this.onThemeChange();
            this.instantiateDOMTemplates();

            const stages_json_schema = await window.akdv.xmlHTTP.getJSON(config.data_uri + config.stages_schema_path_and_filename),
                  stages_json = await window.akdv.xmlHTTP.getJSON(config.data_uri + params.name + '/' + config.stages_json_filename),
                  data_json_schema = await window.akdv.xmlHTTP.getJSON(config.data_uri + params.name + '/data.schema.json'),
                  data = await window.akdv.xmlHTTP.getFile(config.data_uri + params.name + '/data.' + (stages_json.data_format || 'json'));
         
            config.stagesJSONSchemaValidator = window.akdv.validate.initializeValidatorWithJSONSchema(stages_json_schema);
            config.dataJSONSchemaValidator = window.akdv.validate.initializeValidatorWithJSONSchema(data_json_schema);
            
            if (!window.akdv.validate.json(stages_json, config.stagesJSONSchemaValidator)) {
                throw 'Stages JSON invalid.';
            }

            const data_json = (config.stages_json.data_format !== 'json')? window.akdv.utils_data.parseDSVToJSON(data) : data;
            if (!window.akdv.validate.json([data_json[0]], config.dataJSONSchemaValidator)) {
                throw 'Data JSON invalid.';
            }

            config.stages_json = stages_json;
            config.data_json_schema = data_json_schema;
            
            window._log.info('SUCCESS: Loaded configuration and data files and all deemed valid.');

            this.initializeDataNodes(data_json);
            this.initializeChart();
            this.initializeStageScroller();
            this.populateStages();
            
            if (config.gpu_simulation) {
                this.initializeTypedDataStore();
                config.node_defaults.radius = 0.05;
            } else {
                this.initializeSimulation();
                this.populateSimulation();
            }

            await this.initializeRender();

            const stage_index = (location.hash.includes('stage-index-')) ? location.hash.match(/\d+/)[0] : 0;
            this.switchStage(stage_index);

            this.onResize();
            this.addEventListeners();
            window.akdv.statusNotifier.done();
            $(window).trigger('chart-render-complete.akdv');
        },


        // SETUP //

        initializeTypedDataStore() {

            config.typed_array_store = akdv.createTypedArrayStore({
                length: config.nodes_array.length,
                square_length: true,
                typed_array_map: [
                    akdv.createTypedArrayItem(...['translate', Float32Array, 3]),
                    akdv.createTypedArrayItem(...['color', Float32Array, 3]),
                    akdv.createTypedArrayItem(...['radius', Float32Array, 1]),
                ]
            });
        },


        initializeSimulation() {

            config.stages_d3_force_simulation = d3.forceSimulation([])
                .alphaTarget(0.0001).alphaDecay(0.0228)
                .on('end', () => config.stages_d3_force_simulation_running = false)
                .on('tick', this.draw.bind(this)).stop();
        },


        instantiateDOMTemplates() {

            config.stage_section_el_template = window.akdv.utils_string.stringLiteralTemplate`<header class="datajots-stage-title"><h2 class="datajots-stage-title-text">${0}</h2></header>`;       
        },


        clearStages() {

            if (!config.gpu_simulation && config.stages_d3_force_simulation) {
                this.stopSimulation();
                config.stages_d3_force_simulation.nodes([]);
            }

            config.stage_scroller.clear();
            config.stages_d3_scales_array = null;
            $('section.datajots-stage').remove();
        },


        addStageElement(stage_datum, stage_index) {

            config.stages_json.stages[stage_index].element = config.stage_scroller.add(config.stage_section_el_template.with(stage_datum.displaytext));
        },


        addStageSimulation(stage_datum, stage_index) {

            window._log.info('Adding stage sim', stage_index);

            stage_datum.width = config.chart_width;
            stage_datum.height = config.chart_height;
            stage_datum.scroll_scale = d3.scaleLinear().domain([0.5, 1.5]);

            stage_datum.dimensions.forEach((d, i) => {

                let name = d.name;
                let dim_key = d.properties.by;
                let type = (dim_key === '*')
                    ? '*'
                    : config.data_json_schema.items.properties[dim_key].type;
                let is_linear = config.data_types_for_linear_scales.includes(type);
                let d3_scale = false;
                let domain = [];

                if (is_linear) {
                    d3_scale = d3.scaleLinear();
                    domain = window.getMinMaxDomainFromDataObjectForKey(config.nodes_array, dim_key);
                } else {
                    d3_scale = d3.scaleBand();
                    domain = akdv.utils_data.getUniqueListOfValuesFromDataArrayForProp(config.nodes_array, dim_key);
                }

                d3_scale.domain(domain);

                switch (name) {
                    case 'x':
                    case 'axis_x':
                        stage_datum.has_x_dimension = true;
                        if (name === 'axis_x') {
                            stage_datum.has_axis_x_dimension = true;
                            stage_datum.axis_x = akdv.bandedAxisDotFactory({
                                dim_key,
                                nodes_array: config.nodes_array,
                                d3_banded_scale: d3_scale,
                                invert_direction: true,
                                axis_bandwidth_min_rems: config.axis_bandwidth_min_rems,
                                axis_bandwidth_padding_rems: config.axis_bandwidth_padding_rems,
                                radius_rems: config.node_defaults.radius,
                                axis_orientation: akdv.AxisOrientation.HORIZONTAL
                            });
                        }
                    break;
                    case 'y':
                    case 'axis_y':
                        stage_datum.has_y_dimension = true;
                        if (name === 'axis_y') {
                            stage_datum.has_axis_y_dimension = true;
                            stage_datum.axis_y = akdv.bandedAxisDotFactory({
                                dim_key,
                                nodes_array: config.nodes_array,
                                d3_banded_scale: d3_scale,
                                axis_bandwidth_min_rems: config.axis_bandwidth_min_rems,
                                axis_bandwidth_padding_rems: config.axis_bandwidth_padding_rems,
                                radius_rems: config.node_defaults.radius,
                                axis_orientation: akdv.AxisOrientation.VERTICAL
                            });
                        }
                    break;
                    case 'color':
                        const palette_rgb_array = (d.properties.palette || [window.akdv.utils_css.getValueForStylePropertyOfSelector('color','body')]).reduce((arr, color) => [...arr, window.akdv.utils_color.rgbaStringToRgbaValuesArray(d3.color(color).rgb().toString(), true)], []);
                        if (config.data_types_for_linear_scales.includes(type)) {
                            d3_scale.range(palette_rgb_array);
                        } else {
                            d3_scale = d3.scaleOrdinal().domain(domain);
                            d3_scale.range(palette_rgb_array);
                        }
                    break;
                }

                d.d3_scale = d3_scale;
            });
        },


        resetNodesToDefaults() {

            const radius = window.akdv.utils_css.remsToPixels(config.node_defaults.radius);
            if (config.gpu_simulation) {
                config.nodes_array.forEach((node, i) => {

                    config.typed_array_store.getTypedArray('radius')[i] = radius;
                    config.node_defaults.color.forEach((v, j) => config.typed_array_store.getTypedArray('color')[i * 3 + j] = v);                  
                });
            } else {
                config.nodes_array.forEach((node) => {

                   node.radius = radius;
                   node.color = config.node_defaults.color;
                });
            }
        },


        updateGPUSimulation(stage_index) {
        
            const stage_datum = config.stages_json.stages[stage_index], 
                  typed_array_item = config.typed_array_store.getTypedArrayStoreItem('translate'),
                  translate = typed_array_item.typed_array,
                  scale = Math.min(config.chart_width, config.chart_height) * 0.5,
                  { x_dimension, y_dimension, axis_x_dimension, axis_y_dimension } = stage_datum.dimensions.reduce((result, dimension) => {result[dimension.name + '_dimension'] = dimension; return result;}, {})

            let bounding_box = null;
            // Note: Avoid logic within loops aka unwrap also avoiding functional features for perf
            if ((x_dimension || axis_x_dimension) && (y_dimension || axis_y_dimension)) {
                bounding_box = utils_datajots_pointcloud.setTranslateXY(config.nodes_array, typed_array_item, x_dimension || axis_x_dimension, y_dimension || axis_y_dimension);
            } else if ((x_dimension && !axis_y_dimension) || (y_dimension && !axis_x_dimension)) {
                bounding_box = utils_datajots_pointcloud.setTranslateSingleBanded(config.nodes_array, typed_array_item, x_dimension || y_dimension);
            } else if (axis_x_dimension) {
                bounding_box = utils_datajots_pointcloud.setTranslateSingleAxis(config.nodes_array, typed_array_item, axis_x_dimension, axis_x_dimension.axisForce);
            } else if (axis_y_dimension) {
                bounding_box = utils_datajots_pointcloud.setTranslateSingleAxis(config.nodes_array, typed_array_item, axis_y_dimension, axis_y_dimension.axisForce);
            } else {
               bounding_box = utils_datajots_pointcloud.setTranslateSpiral(config.nodes_array, typed_array_item, scale);
            }

            config.chart_canvas_renderer.update(bounding_box);
        },


        updateSimulationForces(stage_index, _alpha = 1.5) {

            const stage_datum = config.stages_json.stages[stage_index];
            config.stages_d3_force_simulation
                .force('charge', null)
                .force('x', null)
                .force('y', null);

            stage_datum.dimensions.forEach((dimension, i) => {

                const name = dimension.name,
                      dim_key = dimension.properties.by,
                      d3_scale = dimension.d3_scale;
                      
                switch (name) {
                    case 'x':
                        config.stages_d3_force_simulation.force('x', d3.forceX((d) => d3_scale(d[dim_key])).strength(0.15));
                        break;
                    case 'axis_x':
                        config.stages_d3_force_simulation
                            .force('x', d3.forceXY((d, i) => stage_datum.axis_x.axisForce(d)).strength(0.15));
                    break;
                    case 'y':
                        config.stages_d3_force_simulation.force('y', d3.forceY((d) => d3_scale(d[dim_key])).strength(0.15));
                        break;
                    case 'axis_y':
                        config.stages_d3_force_simulation
                            .force('y', d3.forceXY((d, i) => stage_datum.axis_y.axisForce(d)).strength(0.15));
                    break;
                }
            });

            // do not add repulsion charge for axis alignment
            if (!stage_datum.has_axis_x_dimension && !stage_datum.has_axis_y_dimension) {
                config.stages_d3_force_simulation.force('charge', d3.forceManyBody().theta(1.25).strength((d) => -(Math.pow(d.radius, 1.9) * 0.25)).distanceMax(500));
                // default to center nodes if x or y were undefined
                if (!stage_datum.has_x_dimension) {
                    config.stages_d3_force_simulation.force('x', d3.forceX().strength(0.15));
                }
                if (!stage_datum.has_y_dimension) {
                    config.stages_d3_force_simulation.force('y', d3.forceY().strength(0.15));
                }
            }

            config.stages_d3_force_simulation.alpha(_alpha).alphaTarget(0.000001).restart();
        },


        nonSimulationBasedNodeUpdate(stage_index) {

            let stage_datum = config.stages_json.stages[stage_index];

            stage_datum.dimensions.forEach((d, i) => {

                let dim_name = d.name;
                let dim_key = d.properties.by;
                let d3_scale = d.d3_scale;
                let requires_node_update = config.non_simulation_dimension_types_array.includes(dim_name);
                
                if (requires_node_update && config.nodes_array.length) {
                    if (config.gpu_simulation) {
                        const len = Array.isArray(d3_scale(config.nodes_array[0][dim_name])) ? d3_scale(config.nodes_array[0][dim_name]).length : 1;
                        config.nodes_array.forEach((node, j) => {
                            if (len > 1) {
                                d3_scale(node[dim_key]).forEach((v, k) => config.typed_array_store.getTypedArray(dim_name)[j * len + k] = v);
                            } else {
                                config.typed_array_store.getTypedArray(dim_name)[j] = d3_scale(node[dim_key]);
                            }
                        });
                    } else {
                        config.nodes_array.forEach((node) => {
                            node[dim_name] = Array.isArray(d3_scale(node[dim_key])) ? d3_scale(node[dim_key]).slice(0) : d3_scale(node[dim_key]);
                        });
                    }
                }
            });
        },


        populateAxes(stage_index) {

            const stage_datum = config.stages_json.stages[stage_index],
                  radius = window.akdv.utils_css.remsToPixels(config.node_defaults.radius);

            config.axis_x_bottom_svg_g.selectAll('.tick').remove();
            config.axis_y_left_svg_g.selectAll('.tick').remove();
            config.axis_x_bottom_svg_g.selectAll('path').remove();
            config.axis_y_left_svg_g.selectAll('path').remove();
            d3.select('#axis-x-bottom-label').text('');
            d3.select('#axis-y-left-label').text('');

            stage_datum.dimensions.forEach((d, i) => {

                let dim_name = d.name;
                let dim_key = d.properties.by;
                let d3_scale = d.d3_scale;

                if (dim_name === 'axis_x') {
                    config.axis_x_bottom_svg_g
                        .attr('transform', `translate(${config.chart_center_x}, ${config.chart_center_y + config.axis_x_bottom_y + radius})`)
                        .transition().duration(800).ease(d3.easeCubicOut)
                        .call(d3.axisBottom(d3_scale)
                        );
                    d3.select('#axis-x-bottom-label').text(d.properties.label || '');
                }

                if (dim_name === 'axis_y') {
                    config.axis_y_left_svg_g
                        .attr('transform', `translate(${config.chart_center_x + config.axis_y_left_x - radius}, ${config.chart_center_y})`)
                        .style('opacity', '1')
                        .transition().duration(800).ease(d3.easeCubicOut)
                        .call(d3.axisLeft(d3_scale)
                            .tickSize(window.akdv.utils_css.remsToPixels(0.25))
                            .ticks(d3_scale.domain().length)
                        );
                    d3.select('#axis-y-left-label').text('');
                }

            });
        },


        populateStages() {

            this.clearStages();
            this.current_stage_index = -1;
            config.stages_json.stages.forEach((d, i) => {
                    
                if (d.hide !== true) {
                    this.addStageElement(d, i);
                }

                this.addStageSimulation(d, i);
            });

            this.resizeScales();
        },


        populateSimulation() {
        
            config.stages_d3_force_simulation.nodes(config.nodes_array);
        },


        initializeRender() {

            return (config.gpu_simulation) ?
                window.akdv.initManyNodeParticleRendererFBO({
                    canvas: config.chart_canvas.node(),
                    width: config.chart_width,
                    height: config.chart_height,
                    data_length: config.nodes_array.length,
                    camera_alignment: akdv.CameraAligmentTypes.BOUNDS,
                    camera_bounds_fit_scale: 0.9
                }).then((instance) => {
                    config.chart_canvas_renderer = instance;
                    config.chart_canvas_renderer.setData(config.typed_array_store.getTypedArray('translate'),
                                                         config.typed_array_store.getTypedArray('color'),
                                                         config.typed_array_store.getTypedArray('radius'));
                }) :
                window.akdv.initManyNodeGeoInstancingRenderer({
                    canvas: config.chart_canvas.node(),
                    width: config.chart_width,
                    height: config.chart_height,
                    node_array: config.nodes_array,
                    accessors_x: 'x',
                    accessor_y: 'y',
                    accessor_radius: 'radius',
                    camera_alignment: akdv.CameraAligmentTypes.BOUNDS,
                    camera_bounds_fit_scale: 0.9
                }).then((instance) => {
                    config.chart_canvas_renderer = instance;
                });
        },


        initializeChart() {

            config.chart_canvas_container_el = d3.select(config.chart_container_selector);

            config.chart_canvas_axis_x_scroll_el = d3.select(config.axis_x_bottom_container_selector);
            config.chart_canvas_axis_y_scroll_el = d3.select(config.axis_y_left_container_selector);
            config.chart_canvas = d3.select(config.chart_container_selector).append('canvas');
            config.chart_canvas.attr('class', 'datajots-canvas').attr('width', config.chart_width).attr('height', config.chart_height);

            config.axis_x_bottom_svg = window.d3AppendSVGWithResponsiveAttributesToID(config.axis_x_bottom_container_selector, '100%');
            config.axis_x_bottom_svg_g = config.axis_x_bottom_svg.append('g');
            config.axis_x_bottom_svg_g.attr('class', 'axis axis-x-bottom');
            config.axis_x_bottom_svg.append('text')
                .attr('class', 'label axis-x-label')
                .attr('id', 'axis-x-bottom-label')
                .attr('x', '50%')
                .attr('y', '90%')
                .style('text-anchor', 'middle');

            config.axis_y_left_svg = window.d3AppendSVGWithResponsiveAttributesToID(config.axis_y_left_container_selector, '100%');
            config.axis_y_left_svg_g = config.axis_y_left_svg.append('g');
            config.axis_y_left_svg_g.attr('class', 'axis axis-y-left');
            config.axis_y_left_svg.append('text')
                .attr('class', 'label axis-y-label')
                .attr('id', 'axis-y-left-label')
                .attr('x', '0')
                .attr('y', '0')
                .style('text-anchor', 'middle');
        },


        initializeStageScroller() {

            config.stage_scroller = akdv.stageScrollerFactory({
                container_el: document.getElementById(config.stage_scroller_selector.slice(1))
            });
        },


        initializeDataNodes(data_json) {

            config.nodes_array = data_json
                .splice(Math.min(data_json.length, -config.max_data_nodes))
                .map((d) => {

                    d.radius = config.node_defaults.radius;
                    d.color = config.node_defaults.color; 
                    return d; 
                });
        },


        getLinearXRange() {

            return [window.devicePixelRatio * config.chart_width * -0.5, window.devicePixelRatio * config.chart_width * 0.5];
        },


        getLinearYRange() {

            return [window.devicePixelRatio * config.chart_height * -0.5, window.devicePixelRatio * config.chart_height * 0.5];
        },


        resizeScales() {

            const stage_datum = config.stages_json.stages[this.current_stage_index];

            if (stage_datum) {
                stage_datum.dimensions.forEach((d, i) => {

                    let name = d.name;
                    let dim_key = d.properties.by;
                    let type = (dim_key === '*')
                        ? '*'
                        : config.data_json_schema.items.properties[dim_key].type;
                    let is_linear = config.data_types_for_linear_scales.includes(type);
                    let d3_scale = d.d3_scale;
                    let range = [];

                    switch (name) {
                        case 'x':
                        case 'axis_x':
                            if (name === 'axis_x' && !is_linear) {
                                stage_datum.axis_x.update(config.axis_x_bottom_y, config.chart_height - (config.chart_height * config.chart_padding_y_percent));
                                range = stage_datum.axis_x.range(d3_scale.domain()); 
                            } else {
                                range = this.getLinearXRange();
                            }

                            d3_scale.range(range);

                            stage_datum.width = (range[1] - range[0]) + (config.chart_padding_x_percent * config.chart_width);

                            if (stage_datum.width > config.chart_width) {
                                stage_datum.scroll_scale.range(range);
                            }
                        break;
                        case 'y':
                        case 'axis_y':
                            if (name === 'axis_y' && !is_linear) {
                                stage_datum.axis_y.update(config.axis_y_left_x, config.chart_width - (config.chart_width * config.chart_padding_x_percent));
                                range = stage_datum.axis_y.range(d3_scale.domain()); 
                            } else {
                                range = this.getLinearYRange();
                            }

                            d3_scale.range(range);

                            stage_datum.height = (range[1] - range[0]) + (config.chart_padding_y_percent * config.chart_height);

                            if (stage_datum.height > config.chart_height) {
                                stage_datum.scroll_scale.range(range);
                            }
                        break;
                        case 'radius':
                            d3_scale.range([
                                window.akdv.utils_css.remsToPixels(config.node_defaults.min_radius), 
                                window.akdv.utils_css.remsToPixels(config.node_defaults.max_radius)
                            ]);
                        break;
                    }
                });
            }
        },


        resizeCanvas() {
            
            config.chart_canvas.attr('width', config.chart_width).attr('height', config.chart_height);
            $(config.chart_canvas.node()).trigger('viewport-resize', [config.chart_width, config.chart_height]);
        },


        updateSizes() {

            const stage_datum = config.stages_json.stages[this.current_stage_index];

            config.chart_width = $(config.chart_container_selector).width();
            config.chart_height = $(config.chart_container_selector).height();
            config.chart_center_x = config.chart_width * 0.5;
            config.chart_center_y = config.chart_height * 0.5;
            config.axis_x_bottom_y = config.chart_height * 0.35;
            config.axis_y_left_x = config.chart_width * -0.375;
        },


        // RUNTIME //


        draw() {

            config.stages_d3_force_simulation_running = true;
            stats.update();
            config.chart_canvas_renderer.tick();
        },


        stopSimulation() {

            config.stages_d3_force_simulation.stop();
        },

        
        applyStageScroll(stage_index) {
           
           const stage_datum = config.stages_json.stages[stage_index];

            this.requires_canvas_offset_scroll = stage_datum.width > config.chart_width || stage_datum.height > config.chart_height;
            if (this.requires_canvas_offset_scroll) {
                const scroll_bar = $(config.stage_scroller_selector + ' .ss-content');
                scroll_bar
                    .off('scroll')
                    .on('scroll', this.onScroll.bind(this))
                    .scrollTop(scroll_bar.scrollTop() + 1);
            } else {
                $(config.stage_scroller_selector + ' .ss-content').off('scroll');
                config.chart_canvas_axis_x_scroll_el.style('left', '0');
                config.chart_canvas_axis_y_scroll_el.style('top', '0');
                $(config.chart_canvas.node()).trigger('viewport-scroll', [0, 0]);               
            }
        },


        switchStage(stage_index) {

            window._log.info('SWITCHING STAGE TO ' + stage_index);

            const existing_nodes = config.nodes_array,
                  stage_datum = config.stages_json.stages[stage_index];
            config.nodes_array = existing_nodes;
            this.current_stage_index = stage_index;
            
            this.resizeScales();

            this.resetNodesToDefaults();
            this.nonSimulationBasedNodeUpdate(stage_index);
            this.populateAxes(stage_index);         

            config.current_stage_element = stage_datum.element;

            this.applyStageScroll(stage_index);

            let alpha = 1.5;

            config.chart_canvas_renderer.cameraAlignment = (config.stages_json.stages[stage_index].dimensions.some((d) => d.name === 'axis_x' || d.name === 'axis_y')) ? window.akdv.CameraAligmentTypes.PIXEL :  window.akdv.CameraAligmentTypes.BOUNDS;
            
            if (config.gpu_simulation) {
                this.updateGPUSimulation(stage_index);
            } else {
                this.updateSimulationForces(stage_index, alpha);
            }
        },


        // --- EVENTS --- //


        onResize(e) {

            this.updateSizes();
            this.resizeScales();
            this.resizeCanvas();
            this.populateAxes(this.current_stage_index);
            this.applyStageScroll(this.current_stage_index);

            if (config.gpu_simulation) {
                this.updateGPUSimulation(this.current_stage_index);
            } else {
                this.updateSimulationForces(this.current_stage_index, 1.5);
                if (!config.stages_d3_force_simulation_running && !config.gpu_simulation) {
                    config.chart_canvas_renderer.tick();
                }                
            }       
        },


        onScroll(e) {

            const stage_el_top = config.current_stage_element.offsetTop,
                  stage_scrolling_container_top = e.currentTarget.scrollTop,
                  scroll_ratio = stage_scrolling_container_top / stage_el_top,
                  stage_datum = config.stages_json.stages[this.current_stage_index],
                  scroll_offset = stage_datum.scroll_scale(scroll_ratio);

            if(stage_datum.width > config.chart_width && !stage_datum.has_axis_y_dimension) {
                d3.select(config.axis_x_bottom_container_selector).style('left', -scroll_offset + 'px');  
                $(config.chart_canvas.node()).trigger('viewport-scroll', [scroll_offset, 0]);
            } else {
                d3.select(config.axis_y_left_container_selector).style('top', scroll_offset + 'px');        
                $(config.chart_canvas.node()).trigger('viewport-scroll', [0, scroll_offset]);
            }
            
            if (!config.stages_d3_force_simulation_running && !config.gpu_simulation) {
                config.chart_canvas_renderer.tick();
            }
        },


        onThemeChange(e) {

            config.node_defaults.color = window.akdv.utils_color.rgbaStringToRgbaValuesArray(window.akdv.utils_css.getValueForStylePropertyOfSelector('color','body'), true);
        },


        addEventListeners() {

            $(window).on('resize-charts.akdv', this.onResize.bind(this));
            $(window).on('theme-change.akdv', this.onThemeChange.bind(this));

            config.stage_scroller.attach((event, stage_index) => this.switchStage(stage_index));
        },


        // --- GET/SET --- //


        get current_stage_index() {

            let i = Number(document.body.getAttribute('data-current-stage-index'));

            return (!isNaN(i))? i : 0;
        },


        set current_stage_index(index) {

            document.body.setAttribute('data-current-stage-index', index);
        },


        get requires_canvas_offset_scroll() {

            return config.stages_json.stages[this.current_stage_index].requires_canvas_scroll === true;
        },


        set requires_canvas_offset_scroll(bool) {

            config.stages_json.stages[this.current_stage_index].requires_canvas_scroll = bool;
        }


    };

    document.addEventListener('DOMContentLoaded', function(event) { 
        
        window.datajots.init();
    });


})(window, document, window.jQuery, window.d3, window.Stats, window.akdv, window.akdv.utils_env, window.akdv.utils_datajots_pointcloud);