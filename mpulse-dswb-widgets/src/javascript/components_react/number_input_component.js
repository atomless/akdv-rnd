const DEFAULT_CLASS = 'akdv-number-input';

class NumberInput extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
            value: this.props.default_value,
            fast_change_start_timeout: false,
            fast_change_interval: false
        };

        this.onInputChange = this.onInputChange.bind(this);
        this.onStepButtonClick = this.onStepButtonClick.bind(this);
    }


    static getValidInputNumber(num, min, max, fallback_value = 0) { return Math.max(min, Math.min(max, isNaN(num)?  fallback_value : num)); }


    static emitChangeEvent(n) {

        // event_utils.debounceEvent(event_name, event_namespace, number_input_changed.valueAsNumber, (e, data) => {
        //     event_utils.dispatchCustomEvent(number_input_changed, event_name, event_namespace, data);
        // }, 500);
    }


    setValue(n, emit = false) {

        let value = NumberInput.getValidInputNumber(n, this.props.min, this.props.max, this.state.value);

        this._input.value = value;
        this.setState(state => ({ value }));

        emit && NumberInput.emitChangeEvent(n);
    }


    changeBy(n) {

        this.setValue(this._input.valueAsNumber + n);
    }


    onInputChange(e) {

        this.setValue(this._input.valueAsNumber);
    }


    onStepButtonClick(direction) {

        this.changeBy(this._input.step * direction);
    }


    render() {
        const {
            label_text = window.required(),
            default_value = window.required(),
            max = window.required(),
            min = 0,
            step = 1,
            fast_step = 1,
            class_list = [],
            down_button_text = '-',
            up_button_text = '+',
            default_class = DEFAULT_CLASS,
            event_type_to_emit = 'change',
            event_namespace = 'akdv',
            readonly = false
        } = this.props;

        return (
            <label className={[`${default_class}-label`, ...class_list].join(' ')}>
                <StepButton button_text={down_button_text} direction={-1} stepHandler={this.onStepButtonClick} />
                <StepButton button_text={up_button_text} direction={1} stepHandler={this.onStepButtonClick} />
                <input ref={el => this._input = el} className={default_class} type="number" defaultValue={default_value} placeholder={default_value} max={max} min={min} step={step} readOnly={readonly} onInput={this.onInputChange} onBlur={this.onInputChange} />
                <span className="akdv-label-text-span">{label_text}</span>
            </label>
        );
    }
}