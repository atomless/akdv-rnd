;((window, document, d3, string_utils, css_utils, dom_utils, event_utils, math_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'draggable-marker';
    const DEFAULT_EVENT_NAME = 'marker-drag';

    window.draggableMarkerFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            enable_drag_x = false,
            enable_drag_y = false,
            xscale = false,
            yscale = false,
            color_scale = false,
            color_scale_orientation = false,
            update_color_on_drag = false,
            xscale_threshold_line = false,
            yscale_threshold_line = false,
            xvalue_label = false,
            xvalue_units = false,
            yvalue_label = false,
            yvalue_units = false,
            // constraints are defined in axis values not screen coordinates
            min_x = -Infinity,
            max_x = Infinity,
            min_y = -Infinity,
            max_y = Infinity,
            offset_x = 0,
            offset_y = 0,
            start_at_xscale_value = 0,
            start_at_yscale_value = 0,
            class_list = [],
            size_rems = 1,

            event_name = DEFAULT_EVENT_NAME,
            event_namespace = false
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let marker_el, marker_icon, marker_line, xvlabel, xvlabel_value, yvlabel, yvlabel_value, drag_cursor_offset_x = 0, drag_cursor_offset_y = 0, tx = 0, ty = 0, value_x = start_at_xscale_value, value_y = start_at_yscale_value;


        const getFillColor = (v) => {

            let fill = 'var(--prime_button)';

            if (color_scale_orientation && color_scale) {
                fill = color_scale(v || (color_scale_orientation === 'x'? start_at_xscale_value : start_at_yscale_value));
            }

            return  fill;
        };


        const moveTo = ({ 
            el = marker_el, 
            x = xscale? xscale(value_x) : tx + offset_x,
            y = yscale? yscale(value_x) : ty + offset_y, 
            trigger_external_event = false 
        } = {}) => {

            let old_x_value = value_x, old_y_value = value_y;

            if (xscale && xscale.range) {
                tx = math_utils.clamp(
                    Math.max(xscale(min_x), xscale.range()[0]),
                    Math.min(xscale(max_x), xscale.range()[1]),
                    x + drag_cursor_offset_x
                );
                value_x = xscale.invert(tx);
            } else {
                tx = offset_x;
            }

            if (xvlabel_value) {
                xvlabel_value.text(string_utils.getFormattedNumberSD(value_x, 3));
            }

            if (yscale && yscale.range) {
                ty = math_utils.clamp(
                    Math.max(xscale(min_y), yscale.range()[0]),
                    Math.min(xscale(max_y), yscale.range()[1]),
                    y + drag_cursor_offset_y
                );
                value_y = yscale.invert(ty);
            } else {
                ty = offset_y;
            }

            if (yvlabel_value) {
                yvlabel_value.text(value_y);
            }

            el.attr('transform', `translate(${tx}, ${ty})`);

            if (trigger_external_event && (old_x_value !== value_x || old_y_value !== value_y)) {
                event_utils.debounceEvent(event_name, event_namespace, { x, y }, (e, data) => {
                    event_utils.dispatchCustomEvent(window, event_name, event_namespace, data);
                }, 300);
            }
        };


        // constraints are defined in axis values not screen coordinates
        const setDragConstraintAxisValues = ({ left, right, top, bottom }) => {
            min_x = Number(left) === left? left : min_x;
            max_x = Number(right) === right? right : max_x;
            min_y = Number(top) === top? top : min_y;
            max_y = Number(bottom) === bottom? bottom : max_y;
            moveTo({ trigger_external_event: false });
        };


        const onMouseOver = e => {

        };


        const onMouseOut = e => {

        };

        // d3 event handlers cannot use fat arrow functions or the "this" keyword will not refer to the element
        const onDragStart = function(e) {

            let marker = d3.select(this);
            let t = css_utils.getTransformationObjectFromTransformAttributeString(marker.attr('transform'));

            marker.raise().classed('active', true);

            drag_cursor_offset_x = t.translate_x - d3.event.x;
            drag_cursor_offset_y = t.translate_y - d3.event.y;
        };

        // d3 event handlers cannot use fat arrow functions or the "this" keyword will not refer to the element
        const onDrag = function(e) {

            let marker = d3.select(this);

            if (update_color_on_drag) {
                let scale = color_scale_orientation === 'x'? xscale : yscale;
                let value = scale.invert(d3.event[color_scale_orientation]);

                marker
                    .attr('fill', getFillColor(value))
                    .attr('stroke', getFillColor(value));
            }

            moveTo({ el: marker, x: d3.event.x, y: d3.event.y, trigger_external_event: true });
        };

        // d3 event handlers cannot use fat arrow functions or the "this" keyword will not refer to the element
        const onDragEnd = function(e) {

            let marker = d3.select(this);

            marker.lower().classed('active', false);

            drag_cursor_offset_x = 0;
            drag_cursor_offset_y = 0;
        };


        const onResize = e => {

            moveTo();
        };


        color_scale_orientation = (color_scale && (xscale || yscale))? color_scale_orientation || xscale? 'x' : 'y' : false;

        if (enable_drag_x) {
            class_list.push('drag-x-enabled');
        }
        if (enable_drag_y) {
            class_list.push('drag-y-enabled');
        }

        marker_el = d3.select(container_el).append('g')
            .attr('id', `${DEFAULT_CLASS}-for-${event_namespace}-${uuid}`)
            .attr('class', [DEFAULT_CLASS, ...class_list].join(' '))
            .on('mouseover', onMouseOver)
            .on('mouseout', onMouseOut)
            .call(
                d3.drag()
                    .on('start', onDragStart)
                    .on('drag', onDrag)
                    .on('end', onDragEnd)
            );

        marker_line = marker_el
            .append('line')
            .attr('stroke', getFillColor());

        if (xscale_threshold_line) {
            marker_line
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', -offset_y * 1.1);
        }

        if (yscale_threshold_line) {
            marker_line
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', -offset_x * 1.1)
                .attr('y2', 0);
        }

        // we could extend this to support other shapes as the icon
        marker_icon = marker_el
            .append('circle')
            .attr('r', `${size_rems * 0.25}rem`)
            .attr('fill', getFillColor())
            .attr('stroke', getFillColor())
            .attr('stroke-width', `${size_rems * 0.75}rem`);

        if (xvalue_label) {
            xvlabel = marker_el
                .append('text')
                .attr('class', `${DEFAULT_CLASS}-xvalue-label`);
            xvlabel_value = xvlabel
                .append('tspan')
                .attr('class', `${DEFAULT_CLASS}-xvalue-label-value`)
                .text(`${start_at_xscale_value}`);
            if (xvalue_units) {
                xvlabel
                    .append('tspan')
                    .attr('class', `${DEFAULT_CLASS}-xvalue-label-units`)
                    .text(`${xvalue_units? ' ' + xvalue_units : '' }`);
            }
        }

        if (yvalue_label) {
            yvlabel = marker_el
                .append('text')
                .attr('class', `${DEFAULT_CLASS}-yvalue-label`)
            yvlabel_value = yvlabel
                .append('tspan')
                .attr('class', `${DEFAULT_CLASS}-yvalue-label-value`)
                .text(`${start_at_yscale_value}`);
            if (yvalue_units) {
                yvlabel
                    .append('tspan')
                    .attr('class', `${DEFAULT_CLASS}-yvalue-label-units`)
                    .text(`${yvalue_units? ' ' + yvalue_units : '' }`);
            }
        }

        moveTo({ trigger_external_event: false });

        return {

            setDragConstraintAxisValues,
            moveTo,
            onResize,
            el : marker_el

        };
    };

})(window, document, window.d3, 
   window.akdv.utils_string, window.akdv.utils_css, window.akdv.utils_dom, window.akdv.utils_event, window.akdv.utils_math);