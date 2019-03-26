;((window, env_utils, dom_utils, event_utils, lang_utils, vega_utils, string_utils, statusFactory, componentFactory, annotationBubbleFactory, vega, vega_expressions) => {

    'use strict';

    window.vegaFactory = async ({
            uuid = string_utils.generateUUID(),
            container_el = document.querySelector('#vega-chart'),
            schema_json = false,
            config_json = false,
            schema_uri = false,
            renderer = 'svg',
            namespace = 'data',//env_utils.chart_group,
            signal_namespace = 'akdv_signals',
            event_shared_signals = true,
            annotation_el = document.querySelector('#annotation-layer'),
            statusNotifier = window.akdv.statusNotifier,
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        schema_uri = schema_uri || (!schema_json && vega_utils.getSchemaURL({ container_el })) || undefined;


        const state = Object.seal({
            data_result: null,
            vega_view: null,
            data_field_set: null,
            vega_view_initialized: false,
            async_run_queue: []
        });


        if (!statusNotifier) {
            const wrapper_el = document.createElement('div');
            container_el.appendChild(wrapper_el);
            statusNotifier = statusFactory({
                container_el: wrapper_el,
                namespace,
                modal: true,
                default_blind: true
            });
        }

        if (!annotation_el) {
            annotation_el = document.createElement('div');
            annotation_el.classList.add('annotation-layer');
            container_el.appendChild(annotation_el);
        }

        const annotationBubble = componentFactory({ 
            container_el: annotation_el,
            event_namespace: namespace,
            component: annotationBubbleFactory,
            show_timeout_period_ms: 100,
            offset_x_rems: 1.5,
            offset_y_rems: 0.55,
            function_to_format_data: (d) => ({
                title_obj: {
                    name: '',  
                    value: d.title || ''
                },
                name_value_unit_obj_list: Object.keys(d).reduce((r, key) => {
                    if (key !== 'title') {
                        r.push({ name: key, label: key, value: d[key] });
                    }

                    return r;
                }, [])
            })
        });


        const clear = (name) => {

            if (state.vega_view) {
                state.vega_view.remove(name, d => true);
                state.vega_view.run();
            }
        };


        const render = () => {

            if (state.vega_view && state.data_result !== null && (state.data_result === false || Object.keys(state.data_result).length)) {

                statusNotifier.rendering();
                event_utils.dispatchCustomEvent(window, 'chart-render-start', 'akdv', { namespace: namespace, uuid });
                
                if (!state.vega_view_initialized) {
                    const vega_el = document.createElement('div');
                    vega_el.classList.add('vega-chart-inner');
                    container_el.appendChild(vega_el);
                    state.vega_view.initialize(vega_el);
                    state.vega_view.width(container_el.offsetWidth);
                    state.vega_view.height(container_el.offsetHeight);
                    state.vega_view_initialized = true;
                }

                if (state.data_result !== false) {
                    let dirty = false;
                    for (let field_name of state.data_field_set.values()) {
                        if (state.data_result[field_name] && state.data_result[field_name].length) {
                            dirty = true;
                            state.vega_view.change(field_name, vega.changeset().insert(state.data_result[field_name]).remove(d => true));
                        }
                    }                

                    if (!dirty) {
                        state.vega_view.change(Array.from(state.data_field_set)[0] || 'data', vega.changeset().insert(state.data_result).remove(d => true));
                    }
                }

                state.vega_view.run();
                state.data_result = null;

                statusNotifier.done();
                container_el.setAttribute('data-render-complete', true);
                
                event_utils.dispatchCustomEvent(window, 'chart-render-complete', 'akdv', { namespace: namespace, uuid });
            }
        };


        const loadSchema = async () => {

            if (!config_json) {
                // Default akdv vega config
                config_json = await vega_utils.loadSchemaJSONByURL(env_utils.host_url_with_version + '/json/vega/config/akdv_default.json');
            }
                        
            state.vega_view = await (schema_json ? vega_utils.loadSchema(schema_json, renderer, config_json) : vega_utils.loadSchemaByURL(schema_uri, renderer, config_json));
            state.data_field_set = vega_utils.getDataFieldNamesFromView(state.vega_view);

            let tooltip_enter = true;
            state.vega_view.tooltip((handler, event, item, value) => {

                const component_event = value ? tooltip_enter ? 'show-component' : 'position-component' : 'hide-component';
                event_utils.dispatchCustomEvent(window, component_event, namespace, [ event, value ]);
                tooltip_enter = !value;
            });
        };


        const updateSignalState = async (signal, value, serial = false) => {

            if (serial) {
                // Queue updates to sequence signal changes in order of update
                const pending_signal = state.async_run_queue.find(state => state.signal === signal && state.value === value) ||
                                       state.async_run_queue.slice(0).reverse().find(state => state.signal === signal);
                const current_signal_value = pending_signal && pending_signal.value || state.vega_view.signal(signal);

                if (current_signal_value !== value) {
                    state.async_run_queue.push({signal, value, task: false});
                    if (!!state.async_run_queue[0].task) {
                        await state.async_run_queue[0].task;
                        state.async_run_queue.shift();
                    }

                    state.vega_view.signal(signal, value);
                    state.async_run_queue[0].task = state.vega_view.runAsync();
                }
            } else {
                // Let view.run determine timing and order of signal updates
                const signal_value = state.vega_view.signal(signal);
                if (signal_value !== value) {
                    state.vega_view.signal(signal, value, {force: true});
                    state.vega_view.run();
                }
            }
        };


        const onSignalChange = (e, ...args) => {

            const [signal, value, serial] =  [...Array.isArray(e.detail)? e.detail : args];

            const value_type = (value && value.type);

            switch(value_type) {
                case 'expression':
                    let value_transform = vega_expressions[value.method](...value.args);
                    state.vega_view.change(signal.replace(/_signal/, '_data'), vega.changeset().insert(value_transform).remove(d => true));
                break;
                default:
                    updateSignalState(signal, value, serial);
            }
        };


        const onDataReady = (signal, data_ready) => {

            event_utils.dispatchCustomEvent(window, signal, namespace, [signal, data_ready]);
            window.requestAnimationFrame(() => {
                if (data_ready) {
                    statusNotifier.done();
                    container_el.classList.remove('hidden');
                } else {
                    statusNotifier.noData();
                    container_el.classList.add('hidden');
                }
            });
        };


        const addSharedSignalEventListenAndDispatch = () => {

            const signals = state.vega_view.getState({ signals: vega.truthy }).signals;
            const akdv_signal_keys = Object.keys(signals).filter(k => k.startsWith('akdv_'));   

            for(let signal_key of akdv_signal_keys) {
                state.vega_view.addSignalListener(signal_key, 
                    (signal, value) => event_utils.dispatchCustomEvent(window, signal, signal_namespace, [signal, value]));

                event_utils.on(window, signal_key, signal_namespace, onSignalChange);
            }
        };


        const addSignalEventListeners = () => {

            const signal_state = state.vega_view.getState({ signals: vega.truthy });
            if (typeof signal_state.signals['data_ready'] !== 'undefined') {
                state.vega_view.addSignalListener('data_ready', onDataReady);
            }
        };


        const addExpressionFunctions = () => {

            for (let fn_name of Object.keys(vega_expressions)) {
                vega.expressionFunction(fn_name, (...args) => vega_expressions[fn_name](...args));
            }
        };


        const resize = ({ w = container_el.offsetWidth, h = container_el.offsetHeight } = {}) => {

            if (state.vega_view_initialized) {
                state.vega_view.width(w);
                state.vega_view.height(h);
                state.vega_view.run();
            }
        };


        const onFilterChange = (e, filter) => {

            const view_state = state.vega_view.getState({ signals: vega.truthy });
            view_state.signals[filter.name] = filter.filtered_array;
            state.vega_view.setState(view_state);
        };


        const onResult = (e, result) => {

            state.data_result = result; 
            render(); 
        };


        const destroy = () => {

            event_utils.dispatchCustomEvent(window, 'hide-component', namespace);
            event_utils.off(window, 'result', namespace, onResult);
            event_utils.off(window, 'filter-change', namespace, onFilterChange);
            event_utils.off(window, 'resize-charts', 'akdv', resize);

            dom_utils.removeChildren(container_el);
            state.data_result = null;
            if (state.vega_view) {
                const akdv_signal_keys = Object.keys(state.vega_view.getState({ signals: vega.truthy }).signals).filter(k => k.startsWith('akdv_'));   
                for (let signal_key of akdv_signal_keys) {
                    event_utils.off(window, signal_key, signal_namespace, onSignalChange);
                }

                state.vega_view.finalize();
            }
        };


        addExpressionFunctions();
        
        event_utils.on(window, `result`, namespace, onResult);

        try {
            await loadSchema();
        } catch(e) {
            statusNotifier.setError({ title: lang_utils.getLocalizedHTMLString('ChartSchema', 'AKDV.Error'), trace: e.stack });
            destroy();
            throw e;
        }

        addSignalEventListeners();

        if (event_shared_signals) {
            addSharedSignalEventListenAndDispatch();
        }

        render();

        if (!state.vega_view_initialized) {
            // Note this awaiting data status is low priority thus a higher priority status i.e. DSWB would take precedent 
            statusNotifier.setInfo({ title: lang_utils.getLocalizedHTMLString('AwaitingData', 'AKDV.Status') });
        }

        event_utils.on(window, `resize-charts`, `akdv`, resize);
        event_utils.on(window, `filter-change`, namespace, onFilterChange);


        const instance = Object.freeze({
            resize,
            render,
            destroy,
            get namespace() { return namespace; },
            get statusNotifier() { return statusNotifier; },
            get vega_view() { return state.vega_view; },
            get container_el() { return container_el; }
        });

        event_utils.dispatchCustomEvent(window, 'vega-chart-initialized', 'akdv', instance);

        return instance;
    };

})(window, window.akdv.utils_env, window.akdv.utils_dom, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.utils_vega, window.akdv.utils_string, window.statusFactory, window.componentFactory, window.annotationBubbleFactory, window.vega, window.vega_expressions);