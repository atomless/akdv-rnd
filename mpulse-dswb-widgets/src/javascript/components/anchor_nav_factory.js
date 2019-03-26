;((window, document, $) => {

    'use strict';

    window.AnchorNavFactory = function(_options) {

        const defaults = {
            anchor_immediate_container_to_set_to_current_selector : 'li',
            anchor_immediate_container_current_class : 'current',
            anchor_generic_selector : '[href^="#"]',
            anchor_container_selector : false,
            navchange_event_name : 'navchange',
            pushstate_event_name : 'pushstate',
            scroll_snap_enabled : true,
            scroll_stopped : true,
            scroll_stopped_timeout : false,
            scroll_throttle_timeout : false,
            scroll_throttle_period_ms : 250,
            scroll_proximity_threshold_to_switch_to_section_px : 200,
            scrolling_container_id : '#scrolling-container',
            section_in_scrolling_container_selector : 'section'
        };
        const config = $.extend({}, defaults, _options || {});

        config.namespaced_navchange_event = config.navchange_event_name + '.' + config.scrolling_container_id.replace('#','');
        config.namespaced_pushstate_event = config.pushstate_event_name + '.' + config.scrolling_container_id.replace('#','');


        const onClick = function(e) {

            e.preventDefault();
            e.stopImmediatePropagation();

            let anchor_hash = e.currentTarget.getAttribute('href');
            let element_to_nav_to = document.getElementById(anchor_hash.replace('#',''));
            let state = { anchor: anchor_hash };

            window.history.pushState(state, anchor_hash, window.location.href.replace(window.location.hash, '') + anchor_hash);
            $(window).trigger(config.namespaced_pushstate_event, state);
        };


        // Invoked as a result of either history api change events (pushstate, popstate), scrolling to a section or clicking an anchor(see onClick above).
        const onNavChange = function(e, data) {

            let anchor = data.anchor || '';
            let $anchor_element_parent = $(config.anchor_immediate_container_to_set_to_current_selector + ' a[href="' + anchor + '"]')
                .parents(config.anchor_immediate_container_to_set_to_current_selector);

            $anchor_element_parent
                .parent()
                .find(config.anchor_immediate_container_to_set_to_current_selector + '.' + config.anchor_immediate_container_current_class)
                .removeClass(config.anchor_immediate_container_current_class);

            $anchor_element_parent.addClass('current');
        };


        // Invoked as a result of either history api change events (pushstate, popstate) or page load.
        const onHistoryStateChange = function(e) {

            let state = (e.data && e.data.state)? e.data.state : e.state || history.state || { anchor: window.location.hash };
            let anchor = state.anchor || '';
            let element_to_nav_to = document.getElementById(anchor.replace('#', ''));

            if (element_to_nav_to) {
                element_to_nav_to.scrollIntoView({ behavior: 'smooth' });
            }
            $(window).trigger(config.namespaced_navchange_event, { anchor: anchor });
        };

    
        const onScroll = function(e) {

            let scrolling_element = document.querySelector(config.scrolling_container_id);
            if (!scrolling_element) {
                throw 'anchor nav could not find a scrolling element using selector: ' + config.scrolling_container_id;
            }
            let scroll_y = scrolling_element.scrollTop;
            let selector = (config.anchor_container_selector || '') 
                         + ' ' + config.anchor_immediate_container_to_set_to_current_selector 
                         + '.' + config.anchor_immediate_container_current_class + ' a';
            let current_anchor_element = document.querySelector(selector);
            if (!current_anchor_element) {
                throw 'anchor nav could not find a current anchor element using selector: ' + selector;
            }
            let current_section = document.querySelector(selector).getAttribute('href').replace('#', '');

            document.querySelectorAll(config.scrolling_container_id + ' ' + config.section_in_scrolling_container_selector).forEach(function(section) {

                if (Math.abs(section.offsetTop - scroll_y) < config.scroll_proximity_threshold_to_switch_to_section_px
                 && current_section !== section.getAttribute('id')) {
                    $(window).trigger(config.namespaced_navchange_event, { anchor: '#' + section.getAttribute('id') });
                }
                if (Math.abs(section.offsetTop - scroll_y) < config.scroll_proximity_threshold_to_switch_to_section_px * 1.5
                 && config.scroll_snap_enabled && config.scroll_stopped) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            });
        };


        const throttleScroll = function(e) {

            if (config.scroll_snap_enabled) {
                window.clearTimeout(config.scroll_stopped_timeout);
                config.scroll_stopped = false;
                config.scroll_stopped_timeout = window.setTimeout(function() {

                    // if execution gets here then not scrolled for config.scroll_throttle_period_ms;
                    window.clearTimeout(config.scroll_stopped_timeout);
                    config.scroll_stopped = true;
                    onScroll(e);
                }, config.scroll_throttle_period_ms * 0.5);
            }
            if (config.scroll_throttle_timeout === false) {
                config.scroll_throttle_timeout = window.setTimeout(function() {

                    window.clearTimeout(config.scroll_throttle_timeout);
                    config.scroll_throttle_timeout = false;
                    onScroll(e);
                }, config.scroll_throttle_period_ms);
            }
        };


        const anchor_nav = {

            addEventListeners : function() {

                $(config.scrolling_container_id).on('scroll', throttleScroll);
                $(document).on('click', config.anchor_generic_selector, onClick);
                $(window).on(config.namespaced_navchange_event, onNavChange);
                $(window).on('load popstate ' + config.namespaced_pushstate_event, onHistoryStateChange);
            },

            removeEventListeners : function() {

                $(config.scrolling_container_id).off('scroll', throttleScroll);
                $(document).off('click', config.anchor_generic_selector, onClick);
                $(window).off(config.namespaced_navchange_event, onNavChange);
                $(window).off('load popstate ' + config.namespaced_pushstate_event, onHistoryStateChange);
            }
        };


        anchor_nav.addEventListeners();

        return anchor_nav;
    };


})(window, document, window.jQuery);