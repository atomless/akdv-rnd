const DEFAULT_CLASS = 'akdv-step-button';

class StepButton extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
            fast_change_start_timeout: false,
            fast_change_interval: false
        };
    }


    onClick(e, is_fast_change = false) {

        if (!is_fast_change) {
            this.onStopFastChange();
        }

        this.props.stepHandler(this.props.direction);
    }


    onStopFastChange(e) {
        window.clearTimeout(this.state.fast_change_start_timeout);
        window.clearInterval(this.state.fast_change_interval);
        this.setState(state => ({ fast_change_start_timeout: false, fast_change_interval: false }));
    }


    componentWillUnmount() {
        this.onStopFastChange();
    }


    onStartFastChange(e, period = 300) {

        this.onStopFastChange();

        this.setState(state => ({
            fast_change_interval: window.setInterval(t => this.onClick(e, true), period),
            fast_change_start_timeout: window.setTimeout(t => this.onStartFastChange(e, true, 100), 1500) 
        }));
    }


    render() {
        const {
            button_text = window.required(),
            stepHandler = window.required(),
            direction = 1,
            class_list = [],
            default_class = DEFAULT_CLASS,
        } = this.props;

        return (
            <span className={`"${default_class}-${direction < 0? 'down' : 'up'} ${default_class} noselect"`} onMouseDown={this.onStartFastChange.bind(this)} onMouseUp={this.onStopFastChange.bind(this)} onClick={this.onClick.bind(this)}>{button_text}</span>
        );
    }
}